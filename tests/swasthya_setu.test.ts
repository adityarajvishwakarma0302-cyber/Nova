import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase } from '../server/db.ts';
import { seedDatabase } from '../server/seed.ts';
import { InventoryService } from '../server/inventoryService.ts';
import { BedService } from '../server/bedService.ts';
import { ForecastingService } from '../server/forecastingService.ts';

test('SwasthyaSetu AI Test Suite', async (t) => {
  // Use in-memory SQLite for isolated, fast, reproducible tests
  const db = initDatabase(true);
  seedDatabase(db);
  const inventory = new InventoryService(db);
  const bedService = new BedService(db);
  const forecasting = new ForecastingService(db);

  await t.test('1. Successful medicine dispensing and exact stock deduction', () => {
    const batch = db.prepare("SELECT * FROM batches WHERE facility_id = 'FAC-PHC-06' AND quantity_usable >= 10").get() as any;
    assert.ok(batch, 'Usable batch exists at PHC Rampur');
    const initialUsable = batch.quantity_usable;

    const res = inventory.dispense({
      idempotencyKey: 'IDEMP-TEST-001',
      facilityId: 'FAC-PHC-06',
      patientId: 'PAT-001',
      uhid: 'UHID-2026-00101',
      patientName: 'Sunita Devi',
      dispensedByUserId: 'PHARM-01',
      dispensedByUserName: 'R. Sharma, RPh',
      items: [
        {
          medicineId: batch.medicine_id,
          batchId: batch.id,
          quantity: 4,
          unitPrice: 2.5,
          dosageInstructions: '1 tablet twice daily after meals',
        },
      ],
    });

    assert.equal(res.isDuplicateReplay, false);
    assert.ok(res.receipt.receiptNumber.startsWith('RX-'));
    assert.equal(res.receipt.totalAmount, 10); // 4 * 2.5

    const updatedBatch = db.prepare('SELECT * FROM batches WHERE id = ?').get(batch.id) as any;
    assert.equal(updatedBatch.quantity_usable, initialUsable - 4, 'Stock must decrease by exactly 4');

    const tx = db.prepare("SELECT * FROM inventory_transactions WHERE idempotency_key = 'IDEMP-TEST-001-" + batch.id + "'").get() as any;
    assert.ok(tx, 'Inventory transaction ledger entry exists');
    assert.equal(tx.quantity_delta, -4);
    assert.equal(tx.balance_after, initialUsable - 4);
  });

  await t.test('2. Rejection of dispensing beyond usable stock (Oversell Protection)', () => {
    const batch = db.prepare("SELECT * FROM batches WHERE facility_id = 'FAC-PHC-06'").get() as any;
    assert.ok(batch);

    assert.throws(
      () => {
        inventory.dispense({
          idempotencyKey: 'IDEMP-OVERSELL',
          facilityId: 'FAC-PHC-06',
          patientId: 'PAT-001',
          uhid: 'UHID-2026-00101',
          patientName: 'Sunita Devi',
          dispensedByUserId: 'PHARM-01',
          dispensedByUserName: 'R. Sharma',
          items: [
            {
              medicineId: batch.medicine_id,
              batchId: batch.id,
              quantity: batch.quantity_usable + 500, // Excessive quantity
            },
          ],
        });
      },
      /INSUFFICIENT_USABLE_STOCK/,
      'Must reject dispensing request when requested quantity exceeds usable stock'
    );
  });

  await t.test('3. Two simultaneous requests competing for limited stock', () => {
    // Setup a batch with only 5 units remaining
    const testBatchId = 'BATCH-CONCURRENT-TEST';
    db.prepare(`
      INSERT INTO batches (
        id, medicine_id, facility_id, batch_number, expiry_date,
        quantity_usable, quantity_quarantined, quantity_damaged,
        storage_location, unit_cost, is_expired, is_recalled
      ) VALUES (?, 'MED-01', 'FAC-PHC-06', 'CONCURRENT-BATCH', '2028-01-01', 5, 0, 0, 'Shelf 1', 1.0, 0, 0)
    `).run(testBatchId);

    // Request A requests 4 units
    const resA = inventory.dispense({
      idempotencyKey: 'CONCURRENT-REQ-A',
      facilityId: 'FAC-PHC-06',
      patientId: 'PAT-001',
      uhid: 'UHID-2026-00101',
      patientName: 'Sunita Devi',
      dispensedByUserId: 'PHARM-01',
      dispensedByUserName: 'R. Sharma',
      items: [{ medicineId: 'MED-01', batchId: testBatchId, quantity: 4 }],
    });
    assert.ok(resA.receipt);

    // Stock remaining is now 1. Request B requests 3 units -> Must fail!
    assert.throws(
      () => {
        inventory.dispense({
          idempotencyKey: 'CONCURRENT-REQ-B',
          facilityId: 'FAC-PHC-06',
          patientId: 'PAT-002',
          uhid: 'UHID-2026-00102',
          patientName: 'Mohan Lal Verma',
          dispensedByUserId: 'PHARM-02',
          dispensedByUserName: 'Assistant Pharmacist',
          items: [{ medicineId: 'MED-01', batchId: testBatchId, quantity: 3 }],
        });
      },
      /INSUFFICIENT_USABLE_STOCK/,
      'Second competing transaction must fail without negative inventory'
    );

    const finalBatch = db.prepare('SELECT * FROM batches WHERE id = ?').get(testBatchId) as any;
    assert.equal(finalBatch.quantity_usable, 1, 'Batch balance must accurately remain at 1');
  });

  await t.test('4. Atomic rollback: When item validation fails, no partial deductions occur', () => {
    const batchValid = db.prepare("SELECT * FROM batches WHERE facility_id = 'FAC-PHC-06' AND quantity_usable >= 10").get() as any;
    const initialStock = batchValid.quantity_usable;

    assert.throws(
      () => {
        inventory.dispense({
          idempotencyKey: 'ATOMIC-FAIL-TEST',
          facilityId: 'FAC-PHC-06',
          patientId: 'PAT-001',
          uhid: 'UHID-2026-00101',
          patientName: 'Sunita Devi',
          dispensedByUserId: 'PHARM-01',
          dispensedByUserName: 'R. Sharma',
          items: [
            { medicineId: batchValid.medicine_id, batchId: batchValid.id, quantity: 2 },
            { medicineId: 'MED-NONEXISTENT', batchId: 'BATCH-DOES-NOT-EXIST', quantity: 1 },
          ],
        });
      },
      /BATCH_NOT_FOUND/,
      'Transaction must abort on invalid batch'
    );

    const postCheck = db.prepare('SELECT * FROM batches WHERE id = ?').get(batchValid.id) as any;
    assert.equal(postCheck.quantity_usable, initialStock, 'Stock must not be touched if any item fails');
  });

  await t.test('5. Duplicate requests and receipt retries (Strict Idempotency)', () => {
    const batch = db.prepare("SELECT * FROM batches WHERE facility_id = 'FAC-PHC-06' AND quantity_usable >= 10").get() as any;
    const initialStock = batch.quantity_usable;
    const testKey = 'STRICT-IDEMPOTENCY-' + Date.now();

    // First attempt
    const res1 = inventory.dispense({
      idempotencyKey: testKey,
      facilityId: 'FAC-PHC-06',
      patientId: 'PAT-003',
      uhid: 'UHID-2026-00103',
      patientName: 'Pooja Rawat',
      dispensedByUserId: 'PHARM-01',
      dispensedByUserName: 'R. Sharma',
      items: [{ medicineId: batch.medicine_id, batchId: batch.id, quantity: 3 }],
    });
    assert.equal(res1.isDuplicateReplay, false);

    // Second attempt with exact same key (network retry / client resend)
    const res2 = inventory.dispense({
      idempotencyKey: testKey,
      facilityId: 'FAC-PHC-06',
      patientId: 'PAT-003',
      uhid: 'UHID-2026-00103',
      patientName: 'Pooja Rawat',
      dispensedByUserId: 'PHARM-01',
      dispensedByUserName: 'R. Sharma',
      items: [{ medicineId: batch.medicine_id, batchId: batch.id, quantity: 3 }],
    });
    assert.equal(res2.isDuplicateReplay, true, 'Must flag as duplicate replay');
    assert.equal(res1.receipt.id, res2.receipt.id, 'Must return identical receipt record');

    const finalBatch = db.prepare('SELECT * FROM batches WHERE id = ?').get(batch.id) as any;
    assert.equal(finalBatch.quantity_usable, initialStock - 3, 'Must NOT double-deduct stock');
  });

  await t.test('6. Receipt correction with complete immutable audit history', () => {
    const receipt = db.prepare("SELECT * FROM receipts WHERE status = 'CONFIRMED' LIMIT 1").get() as any;
    assert.ok(receipt);

    const corrRes = inventory.correctReceipt({
      receiptId: receipt.id,
      correctionReason: 'Clinical review: Patient has drug contraindication; voided by Medical Officer',
      correctedByUserId: 'USR-ADMIN-01',
      correctedByUserName: 'Dr. Anita Joshi',
      newStatus: 'VOIDED',
      adjustStock: true,
    });

    assert.ok(corrRes.success);
    const audit = db.prepare('SELECT * FROM receipt_audits WHERE id = ?').get(corrRes.auditId) as any;
    assert.ok(audit, 'Audit trail entry created');
    assert.ok(audit.correction_reason.includes('contraindication'));
    assert.ok(audit.previous_values_json.includes('CONFIRMED'));
    assert.ok(audit.new_values_json.includes('VOIDED'));

    const updatedReceipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(receipt.id) as any;
    assert.equal(updatedReceipt.status, 'VOIDED');
  });

  await t.test('7. Patient returned medicine: Restockable vs Quarantined', () => {
    const batch = db.prepare("SELECT * FROM batches WHERE facility_id = 'FAC-PHC-06' LIMIT 1").get() as any;
    const initialUsable = batch.quantity_usable;
    const initialQuarantine = batch.quantity_quarantined;

    const receipt = db.prepare("SELECT * FROM receipts LIMIT 1").get() as any;
    assert.ok(receipt, 'Receipt exists for return test');

    // Case 1: Unsealed packaging -> Quarantined (Rule E & H: Must NOT return to usable stock!)
    inventory.processReturn({
      receiptId: receipt.id,
      receiptNumber: receipt.receipt_number,
      patientId: 'PAT-001',
      uhid: 'UHID-2026-00101',
      patientName: 'Sunita Devi',
      medicineId: batch.medicine_id,
      medicineName: 'Test Medicine',
      batchId: batch.id,
      batchNumber: batch.batch_number,
      quantityReturned: 10,
      condition: 'UNSEALED',
      disposition: 'QUARANTINED',
      inspectedByUserId: 'PHARM-01',
      inspectedByUserName: 'R. Sharma',
      reason: 'Patient opened bottle seal; cannot guarantee sterility',
    });

    const bAfterQuarantine = db.prepare('SELECT * FROM batches WHERE id = ?').get(batch.id) as any;
    assert.equal(bAfterQuarantine.quantity_usable, initialUsable, 'Usable stock must remain unchanged');
    assert.equal(bAfterQuarantine.quantity_quarantined, initialQuarantine + 10, 'Quarantined stock must increase by 10');

    // Case 2: Sealed, inspected intact packaging -> Restocked
    inventory.processReturn({
      receiptId: receipt.id,
      receiptNumber: receipt.receipt_number,
      patientId: 'PAT-001',
      uhid: 'UHID-2026-00101',
      patientName: 'Sunita Devi',
      medicineId: batch.medicine_id,
      medicineName: 'Test Medicine',
      batchId: batch.id,
      batchNumber: batch.batch_number,
      quantityReturned: 5,
      condition: 'SEALED_INTACT',
      disposition: 'RESTOCKED',
      inspectedByUserId: 'PHARM-01',
      inspectedByUserName: 'R. Sharma',
      reason: 'Unused sealed blister pack returned upon treatment completion',
    });

    const bAfterRestock = db.prepare('SELECT * FROM batches WHERE id = ?').get(batch.id) as any;
    assert.equal(bAfterRestock.quantity_usable, initialUsable + 5, 'Usable stock now increases by 5');
  });

  await t.test('8. Expired and damaged batch exclusion from dispensing', () => {
    // Attempting to dispense from expired batch
    assert.throws(
      () => {
        inventory.dispense({
          idempotencyKey: 'EXP-DISPENSE-ATTEMPT',
          facilityId: 'FAC-PHC-06',
          patientId: 'PAT-001',
          uhid: 'UHID-2026-00101',
          patientName: 'Sunita Devi',
          dispensedByUserId: 'PHARM-01',
          dispensedByUserName: 'R. Sharma',
          items: [{ medicineId: 'MED-02', batchId: 'B-RAM-AMX-EXP', quantity: 1 }],
        });
      },
      /BATCH_EXPIRED|INSUFFICIENT_USABLE_STOCK/,
      'Must reject dispensing expired medicine'
    );
  });

  await t.test('9. Deliveries and authorized inventory stock updates', () => {
    const delivery = inventory.recordDelivery({
      facilityId: 'FAC-PHC-06',
      medicineId: 'MED-01',
      batchNumber: 'NEW-CHALLAN-BATCH-99',
      expiryDate: '2028-12-31',
      quantity: 500,
      storageLocation: 'Central Store Bay 4',
      unitCost: 0.9,
      supplierChallan: 'CHALLAN-2026-9812',
      userId: 'STORE-KEEPER-01',
      userName: 'Manoj Kumar',
    });

    assert.ok(delivery.success);
    assert.equal(delivery.newBalance, 500);

    const b = db.prepare('SELECT * FROM batches WHERE id = ?').get(delivery.batchId) as any;
    assert.equal(b.quantity_usable, 500);
  });

  await t.test('10. Bed management: Assignment, transfer, discharge, and duplicate prevention', () => {
    const availableBed = db.prepare("SELECT * FROM beds WHERE facility_id = 'FAC-PHC-06' AND status = 'AVAILABLE' LIMIT 1").get() as any;
    assert.ok(availableBed);

    // 1. Assign patient
    const assignRes = bedService.assignBed({
      facilityId: 'FAC-PHC-06',
      bedId: availableBed.id,
      patientId: 'PAT-005',
      uhid: 'UHID-2026-00105',
      patientName: 'Anjali Negi',
      admittedBy: 'Nurse Meena',
      notes: 'Observation for viral pyrexia',
    });
    assert.ok(assignRes.success);

    // 2. Prevent assigning same patient to second bed simultaneously
    const secondAvailableBed = db.prepare("SELECT * FROM beds WHERE facility_id = 'FAC-PHC-06' AND status = 'AVAILABLE' LIMIT 1").get() as any;
    assert.throws(
      () => {
        bedService.assignBed({
          facilityId: 'FAC-PHC-06',
          bedId: secondAvailableBed.id,
          patientId: 'PAT-005',
          uhid: 'UHID-2026-00105',
          patientName: 'Anjali Negi',
          admittedBy: 'Nurse Meena',
        });
      },
      /PATIENT_ALREADY_ADMITTED/,
      'Must prevent assigning one patient to multiple beds concurrently'
    );

    // 3. Transfer patient to second bed
    const transferRes = bedService.transferBed({
      facilityId: 'FAC-PHC-06',
      currentBedId: availableBed.id,
      targetBedId: secondAvailableBed.id,
      reason: 'Shifted to female observation bay',
      authorizedBy: 'Dr. Anita Joshi',
    });
    assert.ok(transferRes.success);

    // Old bed is marked CLEANING
    const oldBed = db.prepare('SELECT * FROM beds WHERE id = ?').get(availableBed.id) as any;
    assert.equal(oldBed.status, 'CLEANING');

    // New bed is OCCUPIED
    const newBed = db.prepare('SELECT * FROM beds WHERE id = ?').get(secondAvailableBed.id) as any;
    assert.equal(newBed.status, 'OCCUPIED');
    assert.equal(newBed.current_patient_id, 'PAT-005');

    // 4. Discharge patient
    const dischargeRes = bedService.dischargePatient({
      facilityId: 'FAC-PHC-06',
      bedId: secondAvailableBed.id,
      dischargeNotes: 'Afebril, hemodynamically stable',
      markCleaning: true,
    });
    assert.ok(dischargeRes.success);

    const dischargedBed = db.prepare('SELECT * FROM beds WHERE id = ?').get(secondAvailableBed.id) as any;
    assert.equal(dischargedBed.status, 'CLEANING');
    assert.equal(dischargedBed.current_patient_id, null);
  });

  await t.test('11. Mutually exclusive bed status formula', () => {
    const metrics = bedService.getBedMetrics('FAC-PHC-06');
    assert.equal(
      metrics.totalOperational,
      metrics.occupied + metrics.available + metrics.unavailableOther,
      'Mutually exclusive status equation must hold true: totalOperational = occupied + available + unavailableOther'
    );
  });

  await t.test('12. AI Inter-Facility transfer: Donor safety buffer preservation', () => {
    const recs = forecasting.generateRedistributionRecommendations();
    assert.ok(recs.length > 0, 'Should generate redistribution recommendations for deficit facilities');

    for (const r of recs) {
      assert.ok(
        r.donorReserveRemaining >= r.donorSafetyThreshold,
        `Donor reserve (${r.donorReserveRemaining}) must not drop below safety threshold (${r.donorSafetyThreshold})`
      );
      assert.ok(r.quantity > 0, 'Transfer quantity must be positive');
      assert.ok(r.transportEtaHours > 0, 'Transport ETA must be computed');
    }
  });
});
