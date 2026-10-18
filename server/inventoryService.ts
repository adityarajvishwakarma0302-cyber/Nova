import { DatabaseSync } from 'node:sqlite';

export interface DispenseRequestItem {
  medicineId: string;
  batchId: string;
  quantity: number;
  unitPrice?: number;
  dosageInstructions?: string;
}

export interface DispenseRequest {
  idempotencyKey: string;
  facilityId: string;
  patientId: string;
  uhid: string;
  patientName: string;
  dispensedByUserId: string;
  dispensedByUserName: string;
  items: DispenseRequestItem[];
}

export class InventoryService {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /**
   * Atomic dispensing transaction.
   * Checks usable stock, batch validity, prevents duplicate receipt via idempotency,
   * generates receipt and deducts stock in one single commit.
   */
  dispense(req: DispenseRequest) {
    if (!req.items || req.items.length === 0) {
      throw new Error('INVALID_DISPENSE_REQUEST: No items provided');
    }

    // Step 1: Idempotency Check
    const existingReceipt = this.db
      .prepare('SELECT * FROM receipts WHERE idempotency_key = ?')
      .get(req.idempotencyKey) as any;

    if (existingReceipt) {
      const items = this.db
        .prepare('SELECT * FROM receipt_items WHERE receipt_id = ?')
        .all(existingReceipt.id) as any[];
      return {
        isDuplicateReplay: true,
        receipt: {
          ...existingReceipt,
          items,
        },
      };
    }

    // Step 2: Validate all items and stock balances before mutating
    for (const item of req.items) {
      if (item.quantity <= 0) {
        throw new Error(`INVALID_QUANTITY: Quantity must be positive, received ${item.quantity}`);
      }

      const batch = this.db
        .prepare('SELECT * FROM batches WHERE id = ?')
        .get(item.batchId) as any;

      if (!batch) {
        throw new Error(`BATCH_NOT_FOUND: Batch ${item.batchId} does not exist`);
      }

      if (batch.facility_id !== req.facilityId) {
        throw new Error(`FACILITY_MISMATCH: Batch belongs to another facility`);
      }

      if (batch.is_recalled) {
        throw new Error(`BATCH_RECALLED: Batch ${batch.batch_number} is recalled by drug controller`);
      }

      // Check expiry date
      const expiry = new Date(batch.expiry_date);
      if (expiry.getTime() < Date.now()) {
        throw new Error(`BATCH_EXPIRED: Batch ${batch.batch_number} expired on ${batch.expiry_date}`);
      }

      // Check usable stock
      if (batch.quantity_usable < item.quantity) {
        throw new Error(
          `INSUFFICIENT_USABLE_STOCK: Cannot dispense ${item.quantity} units from batch ${batch.batch_number}. Usable stock is only ${batch.quantity_usable}.`
        );
      }
    }

    // Step 3: Run Atomic Database Transaction
    this.db.exec('BEGIN IMMEDIATE;');

    try {
      const receiptId = 'RCP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const receiptNumber = 'RX-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
      const timestamp = new Date().toISOString();

      let totalAmount = 0;
      const receiptItemsToInsert: any[] = [];

      for (const item of req.items) {
        const batch = this.db
          .prepare('SELECT * FROM batches WHERE id = ?')
          .get(item.batchId) as any;

        const medicine = this.db
          .prepare('SELECT * FROM medicines WHERE id = ?')
          .get(item.medicineId) as any;

        const unitPrice = item.unitPrice || 0;
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;

        const newBalance = batch.quantity_usable - item.quantity;
        if (newBalance < 0) {
          throw new Error('CONCURRENT_STOCK_DEPLETION: Usable stock depleted during transaction execution.');
        }

        // Deduct from batch
        this.db
          .prepare('UPDATE batches SET quantity_usable = ? WHERE id = ?')
          .run(newBalance, batch.id);

        // Record inventory transaction
        const txId = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        this.db
          .prepare(`
            INSERT INTO inventory_transactions (
              id, facility_id, medicine_id, batch_id, transaction_type,
              quantity_delta, balance_after, idempotency_key, reference_id,
              user_id, user_name, reason, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            txId,
            req.facilityId,
            item.medicineId,
            item.batchId,
            'DISPENSE',
            -item.quantity,
            newBalance,
            `${req.idempotencyKey}-${item.batchId}`,
            receiptNumber,
            req.dispensedByUserId,
            req.dispensedByUserName,
            `Patient Prescription Dispensing for UHID: ${req.uhid}`,
            timestamp
          );

        receiptItemsToInsert.push({
          id: 'RCI-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          receipt_id: receiptId,
          medicine_id: item.medicineId,
          medicine_name: medicine?.name || 'Essential Medicine',
          medicine_code: medicine?.code || 'MED-GEN',
          batch_id: item.batchId,
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          quantity_dispensed: item.quantity,
          unit: medicine?.unit || 'units',
          unit_price: unitPrice,
          total_price: totalPrice,
          dosage_instructions: item.dosageInstructions || 'Take as advised by physician',
        });
      }

      // Insert Receipt
      this.db
        .prepare(`
          INSERT INTO receipts (
            id, receipt_number, facility_id, patient_id, uhid, patient_name,
            total_amount, dispensed_by_user_id, dispensed_by_user_name,
            idempotency_key, status, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          receiptId,
          receiptNumber,
          req.facilityId,
          req.patientId,
          req.uhid,
          req.patientName,
          totalAmount,
          req.dispensedByUserId,
          req.dispensedByUserName,
          req.idempotencyKey,
          'CONFIRMED',
          timestamp
        );

      // Insert Items
      const insertItemStmt = this.db.prepare(`
        INSERT INTO receipt_items (
          id, receipt_id, medicine_id, medicine_name, medicine_code,
          batch_id, batch_number, expiry_date, quantity_dispensed,
          unit, unit_price, total_price, dosage_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of receiptItemsToInsert) {
        insertItemStmt.run(
          item.id,
          item.receipt_id,
          item.medicine_id,
          item.medicine_name,
          item.medicine_code,
          item.batch_id,
          item.batch_number,
          item.expiry_date,
          item.quantity_dispensed,
          item.unit,
          item.unit_price,
          item.total_price,
          item.dosage_instructions
        );
      }

      this.db.exec('COMMIT;');

      return {
        isDuplicateReplay: false,
        receipt: {
          id: receiptId,
          receiptNumber,
          facilityId: req.facilityId,
          patientId: req.patientId,
          uhid: req.uhid,
          patientName: req.patientName,
          totalAmount,
          dispensedByUserId: req.dispensedByUserId,
          dispensedByUserName: req.dispensedByUserName,
          idempotencyKey: req.idempotencyKey,
          status: 'CONFIRMED',
          timestamp,
          items: receiptItemsToInsert,
        },
      };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Correct an existing receipt.
   * Preserves full immutable audit history and creates compensating stock entries.
   */
  correctReceipt(params: {
    receiptId: string;
    correctionReason: string;
    correctedByUserId: string;
    correctedByUserName: string;
    newStatus: 'CORRECTED' | 'VOIDED';
    adjustStock: boolean;
  }) {
    if (!params.correctionReason || params.correctionReason.trim().length < 5) {
      throw new Error('AUDIT_REASON_REQUIRED: A valid clinical or administrative justification is required.');
    }

    const receipt = this.db.prepare('SELECT * FROM receipts WHERE id = ?').get(params.receiptId) as any;
    if (!receipt) {
      throw new Error('RECEIPT_NOT_FOUND: Specified receipt does not exist');
    }

    const items = this.db.prepare('SELECT * FROM receipt_items WHERE receipt_id = ?').all(params.receiptId) as any[];

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const timestamp = new Date().toISOString();
      const affectedTransactions: any[] = [];

      // If adjusting stock (e.g. voiding or reversing dispensed quantities)
      if (params.adjustStock) {
        for (const item of items) {
          const batch = this.db.prepare('SELECT * FROM batches WHERE id = ?').get(item.batch_id) as any;
          if (batch) {
            const newBalance = batch.quantity_usable + item.quantity_dispensed;
            this.db.prepare('UPDATE batches SET quantity_usable = ? WHERE id = ?').run(newBalance, batch.id);

            const txId = 'TX-REV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
            this.db
              .prepare(`
                INSERT INTO inventory_transactions (
                  id, facility_id, medicine_id, batch_id, transaction_type,
                  quantity_delta, balance_after, idempotency_key, reference_id,
                  user_id, user_name, reason, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `)
              .run(
                txId,
                receipt.facility_id,
                item.medicine_id,
                item.batch_id,
                'CORRECTION_CREDIT',
                item.quantity_dispensed,
                newBalance,
                `COMPENSATING-${receipt.id}-${item.id}-${Date.now()}`,
                receipt.receipt_number,
                params.correctedByUserId,
                params.correctedByUserName,
                `Receipt Correction Compensation: ${params.correctionReason}`,
                timestamp
              );

            affectedTransactions.push({
              transactionId: txId,
              batchId: batch.id,
              quantityRestored: item.quantity_dispensed,
              newBalance,
            });
          }
        }
      }

      // Update receipt status
      this.db
        .prepare('UPDATE receipts SET status = ? WHERE id = ?')
        .run(params.newStatus, params.receiptId);

      // Record immutable audit trail
      const auditId = 'AUDIT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      this.db
        .prepare(`
          INSERT INTO receipt_audits (
            id, receipt_id, receipt_number, correction_reason,
            corrected_by_user_id, corrected_by_user_name,
            previous_values_json, new_values_json,
            affected_transactions_json, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          auditId,
          receipt.id,
          receipt.receipt_number,
          params.correctionReason,
          params.correctedByUserId,
          params.correctedByUserName,
          JSON.stringify({ status: receipt.status, items }),
          JSON.stringify({ status: params.newStatus }),
          JSON.stringify(affectedTransactions),
          timestamp
        );

      this.db.exec('COMMIT;');
      return { success: true, auditId };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Process patient medicine return.
   * Distinguishes restockable from quarantined/damaged stock.
   */
  processReturn(params: {
    receiptId: string;
    receiptNumber: string;
    patientId: string;
    uhid: string;
    patientName: string;
    medicineId: string;
    medicineName: string;
    batchId: string;
    batchNumber: string;
    quantityReturned: number;
    condition: 'SEALED_INTACT' | 'UNSEALED' | 'EXPIRED' | 'DAMAGED';
    disposition: 'RESTOCKED' | 'QUARANTINED' | 'DESTROYED';
    inspectedByUserId: string;
    inspectedByUserName: string;
    reason: string;
  }) {
    if (params.quantityReturned <= 0) {
      throw new Error('INVALID_RETURN_QUANTITY: Returned quantity must be greater than zero.');
    }

    const batch = this.db.prepare('SELECT * FROM batches WHERE id = ?').get(params.batchId) as any;
    if (!batch) {
      throw new Error('BATCH_NOT_FOUND: Medicine batch could not be found');
    }

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const timestamp = new Date().toISOString();
      const returnId = 'RET-' + Math.random().toString(36).substring(2, 9).toUpperCase();

      let balanceAfter = batch.quantity_usable;

      if (params.condition === 'SEALED_INTACT' && params.disposition === 'RESTOCKED') {
        // Safe to return to usable stock
        balanceAfter = batch.quantity_usable + params.quantityReturned;
        this.db.prepare('UPDATE batches SET quantity_usable = ? WHERE id = ?').run(balanceAfter, batch.id);

        this.db
          .prepare(`
            INSERT INTO inventory_transactions (
              id, facility_id, medicine_id, batch_id, transaction_type,
              quantity_delta, balance_after, idempotency_key, reference_id,
              user_id, user_name, reason, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            'TX-RET-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            batch.facility_id,
            params.medicineId,
            params.batchId,
            'RETURN_RESTOCKED',
            params.quantityReturned,
            balanceAfter,
            `RET-RESTOCK-${returnId}`,
            params.receiptNumber,
            params.inspectedByUserId,
            params.inspectedByUserName,
            `Patient return inspected and restocked: ${params.reason}`,
            timestamp
          );
      } else if (params.disposition === 'QUARANTINED') {
        // Quarantine: Exclude from usable stock!
        const newQuarantine = batch.quantity_quarantined + params.quantityReturned;
        this.db.prepare('UPDATE batches SET quantity_quarantined = ? WHERE id = ?').run(newQuarantine, batch.id);

        this.db
          .prepare(`
            INSERT INTO inventory_transactions (
              id, facility_id, medicine_id, batch_id, transaction_type,
              quantity_delta, balance_after, idempotency_key, reference_id,
              user_id, user_name, reason, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            'TX-RET-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            batch.facility_id,
            params.medicineId,
            params.batchId,
            'RETURN_QUARANTINED',
            0,
            batch.quantity_usable,
            `RET-QUARANTINE-${returnId}`,
            params.receiptNumber,
            params.inspectedByUserId,
            params.inspectedByUserName,
            `Patient return quarantined (condition: ${params.condition}): ${params.reason}`,
            timestamp
          );
      } else {
        // Damaged / Biohazard destruction
        const newDamaged = batch.quantity_damaged + params.quantityReturned;
        this.db.prepare('UPDATE batches SET quantity_damaged = ? WHERE id = ?').run(newDamaged, batch.id);

        this.db
          .prepare(`
            INSERT INTO inventory_transactions (
              id, facility_id, medicine_id, batch_id, transaction_type,
              quantity_delta, balance_after, idempotency_key, reference_id,
              user_id, user_name, reason, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            'TX-RET-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            batch.facility_id,
            params.medicineId,
            params.batchId,
            'WASTAGE',
            0,
            batch.quantity_usable,
            `RET-DESTROY-${returnId}`,
            params.receiptNumber,
            params.inspectedByUserId,
            params.inspectedByUserName,
            `Patient return marked damaged/destroyed: ${params.reason}`,
            timestamp
          );
      }

      this.db
        .prepare(`
          INSERT INTO patient_returns (
            id, receipt_id, receipt_number, patient_id, uhid, patient_name,
            medicine_id, medicine_name, batch_id, batch_number,
            quantity_returned, condition, disposition,
            inspected_by_user_id, inspected_by_user_name, reason, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          returnId,
          params.receiptId,
          params.receiptNumber,
          params.patientId,
          params.uhid,
          params.patientName,
          params.medicineId,
          params.medicineName,
          params.batchId,
          params.batchNumber,
          params.quantityReturned,
          params.condition,
          params.disposition,
          params.inspectedByUserId,
          params.inspectedByUserName,
          params.reason,
          timestamp
        );

      this.db.exec('COMMIT;');
      return { success: true, returnId, disposition: params.disposition };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Record authorized delivery from government central warehouse.
   */
  recordDelivery(params: {
    facilityId: string;
    medicineId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    storageLocation: string;
    unitCost?: number;
    supplierChallan: string;
    userId: string;
    userName: string;
  }) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const timestamp = new Date().toISOString();
      let batch = this.db
        .prepare('SELECT * FROM batches WHERE facility_id = ? AND medicine_id = ? AND batch_number = ?')
        .get(params.facilityId, params.medicineId, params.batchNumber) as any;

      let batchId = batch?.id;
      let newBalance = params.quantity;

      if (batch) {
        newBalance = batch.quantity_usable + params.quantity;
        this.db.prepare('UPDATE batches SET quantity_usable = ? WHERE id = ?').run(newBalance, batch.id);
      } else {
        batchId = 'BATCH-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        this.db
          .prepare(`
            INSERT INTO batches (
              id, medicine_id, facility_id, batch_number, expiry_date,
              quantity_usable, quantity_quarantined, quantity_damaged,
              storage_location, unit_cost, is_expired, is_recalled
            ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 0, 0)
          `)
          .run(
            batchId,
            params.medicineId,
            params.facilityId,
            params.batchNumber,
            params.expiryDate,
            params.quantity,
            params.storageLocation,
            params.unitCost || 0
          );
      }

      this.db
        .prepare(`
          INSERT INTO inventory_transactions (
            id, facility_id, medicine_id, batch_id, transaction_type,
            quantity_delta, balance_after, idempotency_key, reference_id,
            user_id, user_name, reason, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          'TX-DELIV-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          params.facilityId,
          params.medicineId,
          batchId,
          'DELIVERY',
          params.quantity,
          newBalance,
          `DELIV-${params.supplierChallan}-${batchId}-${Date.now()}`,
          params.supplierChallan,
          params.userId,
          params.userName,
          `Warehouse Delivery Received: Challan #${params.supplierChallan}`,
          timestamp
        );

      this.db.exec('COMMIT;');
      return { success: true, batchId, newBalance };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Log Clinical Incident (e.g. wrong medicine dispensed).
   * Flags for review without wiping historical stock and dispensing transactions.
   */
  reportClinicalIncident(params: {
    receiptId: string;
    medicineId: string;
    patientId: string;
    uhid: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    reportedBy: string;
  }) {
    const id = 'INC-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const timestamp = new Date().toISOString();

    this.db
      .prepare(`
        INSERT INTO clinical_incidents (
          id, receipt_id, medicine_id, patient_id, uhid,
          severity, description, status, reported_by, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'REPORTED', ?, ?)
      `)
      .run(
        id,
        params.receiptId,
        params.medicineId,
        params.patientId,
        params.uhid,
        params.severity,
        params.description,
        params.reportedBy,
        timestamp
      );

    return { success: true, incidentId: id };
  }
}
