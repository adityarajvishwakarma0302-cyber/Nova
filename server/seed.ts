import { DatabaseSync } from 'node:sqlite';

export function seedDatabase(db: DatabaseSync) {
  // Check if already seeded
  const facilityCount = (db.prepare('SELECT count(*) as count FROM facilities').get() as any)?.count || 0;
  if (facilityCount >= 10) {
    return;
  }

  db.exec('BEGIN IMMEDIATE;');

  try {
    // 1. Insert 10 Facilities
    const facilities = [
      {
        id: 'FAC-DH-01',
        name: 'District Hospital Central',
        name_hi: 'केंद्रीय जिला चिकित्सालय',
        type: 'DH',
        block: 'Central Sadar',
        total_beds: 150,
        contact_phone: '+91-135-2710001',
        latitude: 30.3165,
        longitude: 78.0322,
        distance_km: 0.0,
        last_sync_time: new Date().toISOString(),
        status: 'ONLINE',
      },
      {
        id: 'FAC-SDH-02',
        name: 'Sub-District Hospital Vijaypur',
        name_hi: 'उप-जिला चिकित्सालय विजयपुर',
        type: 'SDH',
        block: 'Vijaypur North',
        total_beds: 60,
        contact_phone: '+91-135-2710002',
        latitude: 30.4201,
        longitude: 78.1154,
        distance_km: 18.5,
        last_sync_time: new Date().toISOString(),
        status: 'ONLINE',
      },
      {
        id: 'FAC-CHC-03',
        name: 'CHC Sundarpur',
        name_hi: 'सामुदायिक स्वास्थ्य केंद्र सुंदरपुर',
        type: 'CHC',
        block: 'Sundarpur East',
        total_beds: 30,
        contact_phone: '+91-135-2710003',
        latitude: 30.2512,
        longitude: 78.2231,
        distance_km: 24.0,
        last_sync_time: new Date().toISOString(),
        status: 'ONLINE',
      },
      {
        id: 'FAC-CHC-04',
        name: 'CHC Belgaon',
        name_hi: 'सामुदायिक स्वास्थ्य केंद्र बेलगांव',
        type: 'CHC',
        block: 'Belgaon West',
        total_beds: 30,
        contact_phone: '+91-135-2710004',
        latitude: 30.1874,
        longitude: 77.9215,
        distance_km: 29.2,
        last_sync_time: new Date().toISOString(),
        status: 'ONLINE',
      },
      {
        id: 'FAC-CHC-05',
        name: 'CHC Devgarh',
        name_hi: 'सामुदायिक स्वास्थ्य केंद्र देवगढ़',
        type: 'CHC',
        block: 'Devgarh Hills',
        total_beds: 30,
        contact_phone: '+91-135-2710005',
        latitude: 30.4982,
        longitude: 78.2914,
        distance_km: 38.0,
        last_sync_time: new Date().toISOString(),
        status: 'ONLINE',
      },
      {
        id: 'FAC-PHC-06',
        name: 'PHC Rampur',
        name_hi: 'प्राथमिक स्वास्थ्य केंद्र रामपुर',
        type: 'PHC',
        block: 'Sundarpur East',
        total_beds: 10,
        contact_phone: '+91-135-2710006',
        latitude: 30.2981,
        longitude: 78.3122,
        distance_km: 31.4,
        last_sync_time: new Date().toISOString(),
        status: 'ONLINE',
      },
      {
        id: 'FAC-PHC-07',
        name: 'PHC Shivnagar',
        name_hi: 'प्राथमिक स्वास्थ्य केंद्र शिवनगर',
        type: 'PHC',
        block: 'Devgarh Hills',
        total_beds: 8,
        contact_phone: '+91-135-2710007',
        latitude: 30.5621,
        longitude: 78.3412,
        distance_km: 44.2,
        last_sync_time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hrs ago (simulated slow link)
        status: 'DEGRADED',
      },
      {
        id: 'FAC-PHC-08',
        name: 'PHC Anandpur',
        name_hi: 'प्राथमिक स्वास्थ्य केंद्र आनंदपुर',
        type: 'PHC',
        block: 'Central Sadar',
        total_beds: 10,
        contact_phone: '+91-135-2710008',
        latitude: 30.3812,
        longitude: 78.0612,
        distance_km: 12.1,
        last_sync_time: new Date().toISOString(),
        status: 'ONLINE',
      },
      {
        id: 'FAC-PHC-09',
        name: 'PHC Kalyanpur',
        name_hi: 'प्राथमिक स्वास्थ्य केंद्र कल्याणपुर',
        type: 'PHC',
        block: 'Belgaon West',
        total_beds: 8,
        contact_phone: '+91-135-2710009',
        latitude: 30.1251,
        longitude: 77.8812,
        distance_km: 36.5,
        last_sync_time: new Date().toISOString(),
        status: 'ONLINE',
      },
      {
        id: 'FAC-PHC-10',
        name: 'PHC Raipur',
        name_hi: 'प्राथमिक स्वास्थ्य केंद्र रायपुर',
        type: 'PHC',
        block: 'Central Sadar',
        total_beds: 10,
        contact_phone: '+91-135-2710010',
        latitude: 30.3411,
        longitude: 78.1412,
        distance_km: 14.8,
        last_sync_time: new Date().toISOString(),
        status: 'ONLINE',
      },
    ];

    const insertFacilityStmt = db.prepare(`
      INSERT INTO facilities (
        id, name, name_hi, type, block, total_beds, contact_phone,
        latitude, longitude, distance_km, last_sync_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const f of facilities) {
      insertFacilityStmt.run(
        f.id, f.name, f.name_hi, f.type, f.block, f.total_beds,
        f.contact_phone, f.latitude, f.longitude, f.distance_km,
        f.last_sync_time, f.status
      );
    }

    // 2. Insert Essential Medicines
    const medicines = [
      {
        id: 'MED-01',
        code: 'MED-PCM-500',
        name: 'Paracetamol 500mg',
        generic_name: 'Paracetamol',
        category: 'Analgesic / Antipyretic',
        form: 'TABLET',
        strength: '500 mg',
        unit: 'tablets',
        default_safety_stock: 500,
      },
      {
        id: 'MED-02',
        code: 'MED-AMX-500',
        name: 'Amoxicillin 500mg',
        generic_name: 'Amoxicillin Trihydrate',
        category: 'Antibacterial / Penicillin',
        form: 'TABLET',
        strength: '500 mg',
        unit: 'capsules',
        default_safety_stock: 300,
      },
      {
        id: 'MED-03',
        code: 'MED-ORS-SCT',
        name: 'Oral Rehydration Salts (ORS)',
        generic_name: 'Sodium Chloride + Dextrose Formula',
        category: 'Electrolyte Replenisher',
        form: 'SYRUP',
        strength: '20.5 g sachet',
        unit: 'sachets',
        default_safety_stock: 400,
      },
      {
        id: 'MED-04',
        code: 'MED-MET-500',
        name: 'Metformin HCl 500mg',
        generic_name: 'Metformin Hydrochloride',
        category: 'Oral Antidiabetic',
        form: 'TABLET',
        strength: '500 mg',
        unit: 'tablets',
        default_safety_stock: 250,
      },
      {
        id: 'MED-05',
        code: 'MED-CQ-250',
        name: 'Chloroquine Phosphate 250mg',
        generic_name: 'Chloroquine Phosphate',
        category: 'Antimalarial',
        form: 'TABLET',
        strength: '250 mg',
        unit: 'tablets',
        default_safety_stock: 200,
      },
      {
        id: 'MED-06',
        code: 'MED-NS-500',
        name: 'Normal Saline 0.9% IV',
        generic_name: 'Sodium Chloride 0.9% w/v',
        category: 'Intravenous Fluids',
        form: 'IV_FLUID',
        strength: '500 ml bottle',
        unit: 'bottles',
        default_safety_stock: 150,
      },
      {
        id: 'MED-07',
        code: 'MED-CTX-1G',
        name: 'Ceftriaxone 1g Injection',
        generic_name: 'Ceftriaxone Sodium',
        category: 'Broad-Spectrum Antibiotic',
        form: 'INJECTION',
        strength: '1 g vial',
        unit: 'vials',
        default_safety_stock: 100,
      },
      {
        id: 'MED-08',
        code: 'MED-IFA-TAB',
        name: 'Iron & Folic Acid (Large)',
        generic_name: 'Ferrous Sulphate 100mg + Folic Acid 0.5mg',
        category: 'Maternal Micronutrient',
        form: 'TABLET',
        strength: '100mg/0.5mg',
        unit: 'tablets',
        default_safety_stock: 600,
      },
    ];

    const insertMedStmt = db.prepare(`
      INSERT INTO medicines (
        id, code, name, generic_name, category, form, strength, unit, default_safety_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const m of medicines) {
      insertMedStmt.run(m.id, m.code, m.name, m.generic_name, m.category, m.form, m.strength, m.unit, m.default_safety_stock);
    }

    // 3. Batches across facilities
    // Give DH high surplus stock
    // Give PHC Rampur critically low stock in Amoxicillin and IV fluids to demonstrate redistribution
    const insertBatchStmt = db.prepare(`
      INSERT INTO batches (
        id, medicine_id, facility_id, batch_number, expiry_date,
        quantity_usable, quantity_quarantined, quantity_damaged,
        storage_location, unit_cost, is_expired, is_recalled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // DH Central batches (high surplus)
    insertBatchStmt.run('B-DH-PCM-01', 'MED-01', 'FAC-DH-01', 'PCM-2025-A', '2027-08-31', 4500, 0, 0, 'Central Warehouse Bay 1', 0.85, 0, 0);
    insertBatchStmt.run('B-DH-AMX-01', 'MED-02', 'FAC-DH-01', 'AMX-2025-B', '2027-06-30', 2800, 0, 0, 'Bay 2 Shelf C', 2.10, 0, 0);
    insertBatchStmt.run('B-DH-ORS-01', 'MED-03', 'FAC-DH-01', 'ORS-2025-C', '2028-01-31', 3200, 0, 0, 'Bay 3 Pallet 4', 4.50, 0, 0);
    insertBatchStmt.run('B-DH-MET-01', 'MED-04', 'FAC-DH-01', 'MET-2025-D', '2027-11-30', 1900, 0, 0, 'Bay 1 Shelf B', 1.20, 0, 0);
    insertBatchStmt.run('B-DH-CQ-01', 'MED-05', 'FAC-DH-01', 'CQ-2025-E', '2027-09-30', 1400, 0, 0, 'Cold Lock Cabinet', 3.40, 0, 0);
    insertBatchStmt.run('B-DH-NS-01', 'MED-06', 'FAC-DH-01', 'NS-2025-F', '2027-12-31', 1200, 0, 0, 'IV Infusion Bay', 18.0, 0, 0);

    // PHC Rampur batches (CRITICAL SHORTAGE for Amoxicillin & IV fluids)
    insertBatchStmt.run('B-RAM-PCM-01', 'MED-01', 'FAC-PHC-06', 'PCM-RAM-01', '2027-04-30', 280, 0, 0, 'Dispensary Shelf 1', 0.85, 0, 0);
    // Amoxicillin at Rampur is critically low: only 25 left with safety stock 300!
    insertBatchStmt.run('B-RAM-AMX-01', 'MED-02', 'FAC-PHC-06', 'AMX-RAM-01', '2027-03-31', 25, 0, 0, 'Dispensary Shelf 2', 2.10, 0, 0);
    // Expired batch at Rampur (Rule E demonstration: must remain excluded from usable stock!)
    insertBatchStmt.run('B-RAM-AMX-EXP', 'MED-02', 'FAC-PHC-06', 'AMX-RAM-OLD', '2024-01-15', 0, 60, 0, 'Quarantine Red Bin', 2.10, 1, 0);
    // Recalled batch at Rampur (Rule G demonstration: recalled by regulator)
    insertBatchStmt.run('B-RAM-CQ-RCL', 'MED-05', 'FAC-PHC-06', 'CQ-RCL-2023', '2027-05-31', 0, 100, 0, 'Regulatory Hold Locker', 3.40, 0, 1);
    insertBatchStmt.run('B-RAM-ORS-01', 'MED-03', 'FAC-PHC-06', 'ORS-RAM-01', '2027-10-31', 420, 0, 0, 'Dispensary Shelf 3', 4.50, 0, 0);
    insertBatchStmt.run('B-RAM-NS-01', 'MED-06', 'FAC-PHC-06', 'NS-RAM-01', '2027-05-15', 12, 0, 0, 'Emergency Trolley', 18.0, 0, 0);

    // CHC Sundarpur batches
    insertBatchStmt.run('B-SUN-PCM-01', 'MED-01', 'FAC-CHC-03', 'PCM-SUN-01', '2027-05-31', 750, 0, 0, 'Ward Store A', 0.85, 0, 0);
    insertBatchStmt.run('B-SUN-AMX-01', 'MED-02', 'FAC-CHC-03', 'AMX-SUN-01', '2027-09-30', 920, 0, 0, 'Ward Store B', 2.10, 0, 0);
    insertBatchStmt.run('B-SUN-NS-01', 'MED-06', 'FAC-CHC-03', 'NS-SUN-01', '2027-08-31', 240, 0, 0, 'ICU Store', 18.0, 0, 0);

    // Populate generic stock for other facilities
    const otherFacs = ['FAC-SDH-02', 'FAC-CHC-04', 'FAC-CHC-05', 'FAC-PHC-07', 'FAC-PHC-08', 'FAC-PHC-09', 'FAC-PHC-10'];
    for (const fId of otherFacs) {
      insertBatchStmt.run(`B-${fId}-PCM`, 'MED-01', fId, `PCM-${fId}-01`, '2027-08-31', 400, 0, 0, 'Main Store', 0.85, 0, 0);
      insertBatchStmt.run(`B-${fId}-AMX`, 'MED-02', fId, `AMX-${fId}-01`, '2027-07-31', 350, 0, 0, 'Main Store', 2.10, 0, 0);
      insertBatchStmt.run(`B-${fId}-ORS`, 'MED-03', fId, `ORS-${fId}-01`, '2027-12-31', 300, 0, 0, 'Main Store', 4.50, 0, 0);
      insertBatchStmt.run(`B-${fId}-NS`, 'MED-06', fId, `NS-${fId}-01`, '2027-09-30', 80, 0, 0, 'Emergency Bay', 18.0, 0, 0);
    }

    // 4. Initial Inventory Transactions
    const insertTxStmt = db.prepare(`
      INSERT INTO inventory_transactions (
        id, facility_id, medicine_id, batch_id, transaction_type,
        quantity_delta, balance_after, idempotency_key, reference_id,
        user_id, user_name, reason, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTxStmt.run(
      'TX-INIT-01', 'FAC-DH-01', 'MED-01', 'B-DH-PCM-01', 'DELIVERY',
      4500, 4500, 'INIT-DH-PCM', 'CENTRAL-INDENT-2026', 'SYS-ADMIN', 'State Depot Manager',
      'Initial Annual Quota Allocation', new Date(Date.now() - 7 * 86400000).toISOString()
    );
    insertTxStmt.run(
      'TX-INIT-02', 'FAC-PHC-06', 'MED-02', 'B-RAM-AMX-01', 'DISPENSE',
      -15, 25, 'HISTORIC-DISP-01', 'RX-2026-10291', 'USR-PHARM-01', 'Rajesh Sharma, RPh',
      'OPD Dispensing for RTI cluster', new Date(Date.now() - 86400000).toISOString()
    );

    // 5. Insert Demo Patients
    const patients = [
      {
        id: 'PAT-001',
        uhid: 'UHID-2026-00101',
        full_name: 'Sunita Devi',
        age: 34,
        gender: 'FEMALE',
        village: 'Rampur Kalan',
        phone: '+91-9876543210',
        blood_group: 'B+',
        allergies: 'Penicillin allergy noted',
        emergency_contact: 'Ramesh Kumar (Husband): +91-9876543211',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'PAT-002',
        uhid: 'UHID-2026-00102',
        full_name: 'Mohan Lal Verma',
        age: 58,
        gender: 'MALE',
        village: 'Sundarpur East',
        phone: '+91-9876543212',
        blood_group: 'O+',
        allergies: 'None',
        emergency_contact: 'Anil Verma (Son): +91-9876543213',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'PAT-003',
        uhid: 'UHID-2026-00103',
        full_name: 'Pooja Rawat',
        age: 26,
        gender: 'FEMALE',
        village: 'Belgaon Khurd',
        phone: '+91-9876543214',
        blood_group: 'A+',
        allergies: 'Sulfa drugs',
        emergency_contact: 'Vikram Rawat (Brother): +91-9876543215',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'PAT-004',
        uhid: 'UHID-2026-00104',
        full_name: 'Kishan Chand',
        age: 71,
        gender: 'MALE',
        village: 'Shivnagar Hills',
        phone: '+91-9876543216',
        blood_group: 'AB+',
        allergies: 'None',
        emergency_contact: 'Gita Chand (Daughter): +91-9876543217',
        created_at: new Date().toISOString(),
      },
      {
        id: 'PAT-005',
        uhid: 'UHID-2026-00105',
        full_name: 'Anjali Negi',
        age: 19,
        gender: 'FEMALE',
        village: 'Anandpur Village',
        phone: '+91-9876543218',
        blood_group: 'O-',
        allergies: 'Aspirin',
        emergency_contact: 'Surender Negi (Father): +91-9876543219',
        created_at: new Date().toISOString(),
      },
    ];

    const insertPatStmt = db.prepare(`
      INSERT INTO patients (
        id, uhid, full_name, age, gender, village, phone,
        blood_group, allergies, emergency_contact, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of patients) {
      insertPatStmt.run(p.id, p.uhid, p.full_name, p.age, p.gender, p.village, p.phone, p.blood_group, p.allergies, p.emergency_contact, p.created_at);
    }

    // 6. Registered Operational Beds across facilities with mutually exclusive statuses
    const insertBedStmt = db.prepare(`
      INSERT INTO beds (
        id, facility_id, ward_name, bed_number, bed_type, status,
        current_patient_id, current_uhid, current_patient_name, assigned_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // PHC Rampur: 10 Operational beds
    // Bed 1: Occupied by Sunita Devi
    insertBedStmt.run('BED-RAM-01', 'FAC-PHC-06', 'Maternity Ward', 'B-01', 'MATERNITY', 'OCCUPIED', 'PAT-001', 'UHID-2026-00101', 'Sunita Devi', new Date(Date.now() - 36 * 3600 * 1000).toISOString(), 'Post-natal observation');
    // Bed 2: Available
    insertBedStmt.run('BED-RAM-02', 'FAC-PHC-06', 'General Ward', 'B-02', 'GENERAL', 'AVAILABLE', null, null, null, null, 'Cleaned and ready');
    // Bed 3: Available
    insertBedStmt.run('BED-RAM-03', 'FAC-PHC-06', 'General Ward', 'B-03', 'GENERAL', 'AVAILABLE', null, null, null, null, null);
    // Bed 4: Cleaning
    insertBedStmt.run('BED-RAM-04', 'FAC-PHC-06', 'General Ward', 'B-04', 'GENERAL', 'CLEANING', null, null, null, null, 'Under terminal disinfection');
    // Bed 5: Maintenance
    insertBedStmt.run('BED-RAM-05', 'FAC-PHC-06', 'Emergency Ward', 'B-05', 'GENERAL', 'MAINTENANCE', null, null, null, null, 'Broken caster wheels scheduled for repair');
    // Bed 6: Quarantined
    insertBedStmt.run('BED-RAM-06', 'FAC-PHC-06', 'Isolation Ward', 'B-06', 'ISOLATION', 'QUARANTINED', null, null, null, null, 'Suspected respiratory infection ward barrier');
    // Beds 7-10: Available
    for (let i = 7; i <= 10; i++) {
      insertBedStmt.run(`BED-RAM-0${i}`, 'FAC-PHC-06', 'General Ward', `B-0${i}`, 'GENERAL', 'AVAILABLE', null, null, null, null, null);
    }

    // CHC Sundarpur Beds (30 total)
    for (let i = 1; i <= 30; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      let status = 'AVAILABLE';
      let patientId: string | null = null;
      let uhid: string | null = null;
      let patientName: string | null = null;

      if (i === 1) {
        status = 'OCCUPIED';
        patientId = 'PAT-002';
        uhid = 'UHID-2026-00102';
        patientName = 'Mohan Lal Verma';
      } else if (i === 2) {
        status = 'OCCUPIED';
        patientId = 'PAT-003';
        uhid = 'UHID-2026-00103';
        patientName = 'Pooja Rawat';
      } else if (i === 3) {
        status = 'MAINTENANCE';
      } else if (i === 4) {
        status = 'CLEANING';
      }

      insertBedStmt.run(
        `BED-SUN-${numStr}`,
        'FAC-CHC-03',
        i <= 10 ? 'Male Medical Ward' : i <= 20 ? 'Female Medical Ward' : 'Emergency & Trauma',
        `B-${numStr}`,
        i <= 20 ? 'GENERAL' : i <= 25 ? 'MATERNITY' : 'ICU',
        status,
        patientId,
        uhid,
        patientName,
        status === 'OCCUPIED' ? new Date(Date.now() - 24 * 3600 * 1000).toISOString() : null,
        null
      );
    }

    // Populate standard beds for other facilities
    for (const f of facilities) {
      if (f.id === 'FAC-PHC-06' || f.id === 'FAC-CHC-03') continue;
      const count = f.id === 'FAC-DH-01' ? 40 : f.id === 'FAC-SDH-02' ? 20 : 10;
      for (let i = 1; i <= count; i++) {
        const numStr = i < 10 ? `0${i}` : `${i}`;
        const status = i <= Math.floor(count * 0.4) ? 'OCCUPIED' : i === count ? 'MAINTENANCE' : 'AVAILABLE';
        insertBedStmt.run(
          `BED-${f.id}-${numStr}`,
          f.id,
          'General Ward',
          `B-${numStr}`,
          'GENERAL',
          status,
          status === 'OCCUPIED' ? 'PAT-DEMO' : null,
          status === 'OCCUPIED' ? 'UHID-INPATIENT' : null,
          status === 'OCCUPIED' ? 'Admitted Inpatient' : null,
          status === 'OCCUPIED' ? new Date().toISOString() : null,
          null
        );
      }
    }

    // 7. Initial Active Bed Assignment Record for Sunita Devi at Rampur
    db.prepare(`
      INSERT INTO bed_assignments (
        id, bed_id, facility_id, patient_id, uhid, patient_name,
        ward_name, bed_number, admission_date, status, admitted_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'ADM-RAM-001',
      'BED-RAM-01',
      'FAC-PHC-06',
      'PAT-001',
      'UHID-2026-00101',
      'Sunita Devi',
      'Maternity Ward',
      'B-01',
      new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      'ACTIVE',
      'Dr. Anita Joshi, MO',
      'Observation post normal delivery'
    );

    // 8. Doctor Attendance with all 4 verified states
    // Rule 6: Never infer doctor is absent solely because a record is missing!
    const insertDocStmt = db.prepare(`
      INSERT INTO doctor_attendance (
        id, facility_id, doctor_name, specialty, shift, scheduled_date,
        status, check_in_time, check_out_time, verified_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const todayDate = new Date().toISOString().split('T')[0];

    // Rampur Doctors
    insertDocStmt.run('DOC-01', 'FAC-PHC-06', 'Dr. Anita Joshi', 'General Medicine / MO', 'MORNING', todayDate, 'CONFIRMED_PRESENT', '08:45 AM', null, 'Matron Shanti Devi', 'On duty at OPD Room 1');
    insertDocStmt.run('DOC-02', 'FAC-PHC-06', 'Dr. Vivek Bhatt', 'Pediatrics', 'EVENING', todayDate, 'SCHEDULED', null, null, null, 'Shift begins 02:00 PM');
    
    // Remote PHC Shivnagar: Unconfirmed attendance (Rule 6 validation: Not marked absent!)
    insertDocStmt.run('DOC-03', 'FAC-PHC-07', 'Dr. Ramesh Chandra', 'Medical Officer', 'MORNING', todayDate, 'UNCONFIRMED', null, null, null, 'Awaiting satellite phone check-in from high altitude post');
    
    // Sundarpur: Confirmed Absent (verified with signed leave)
    insertDocStmt.run('DOC-04', 'FAC-CHC-03', 'Dr. S. K. Pant', 'General Surgery', 'MORNING', todayDate, 'CONFIRMED_ABSENT', null, null, 'Medical Superintendent', 'Approved medical leave (Casual Leave #412)');
    insertDocStmt.run('DOC-05', 'FAC-CHC-03', 'Dr. Meena Bhandari', 'Obstetrics & Gynecology', 'MORNING', todayDate, 'CONFIRMED_PRESENT', '08:55 AM', null, 'Duty Sister', 'In Labour Room');
    
    // DH Central Doctors
    insertDocStmt.run('DOC-06', 'FAC-DH-01', 'Dr. R. K. Saxena', 'Chief Physician', 'MORNING', todayDate, 'CONFIRMED_PRESENT', '08:15 AM', null, 'Biometric Kiosk', 'Ward rounds in progress');
    insertDocStmt.run('DOC-07', 'FAC-DH-01', 'Dr. Neha Kapoor', 'Emergency Medicine', 'NIGHT', todayDate, 'SCHEDULED', null, null, null, 'Emergency casualty duty');

    // 9. Diagnostic Tests with reagent tracking & downtime reasons
    const insertDiagStmt = db.prepare(`
      INSERT INTO diagnostic_tests (
        id, facility_id, test_name, category, total_reagents_available,
        reagents_per_test, tests_possible_with_stock, equipment_status,
        daily_average_tests, status, last_reported_time, downtime_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDiagStmt.run('DIAG-01', 'FAC-PHC-06', 'Rapid Malaria Antigen (Pf/Pv)', 'Hematology', 45, 1, 45, 'OPERATIONAL', 8, 'AVAILABLE', new Date().toISOString(), null);
    insertDiagStmt.run('DIAG-02', 'FAC-PHC-06', 'Blood Glucose Strips (Glucometer)', 'Biochemistry', 12, 1, 12, 'OPERATIONAL', 15, 'LOW_REAGENT', new Date().toISOString(), 'Reagent buffer down to under 24 hours supply');
    insertDiagStmt.run('DIAG-03', 'FAC-PHC-06', 'Dengue NS1 Antigen Rapid Test', 'Serology', 0, 1, 0, 'OPERATIONAL', 5, 'UNAVAILABLE', new Date().toISOString(), 'Reagents completely stocked out');
    insertDiagStmt.run('DIAG-04', 'FAC-CHC-03', 'Complete Blood Count (CBC Analyzer)', 'Hematology', 450, 1, 450, 'OPERATIONAL', 35, 'AVAILABLE', new Date().toISOString(), null);
    insertDiagStmt.run('DIAG-05', 'FAC-CHC-03', 'Digital X-Ray Chest PA', 'Radiology', 0, 1, 0, 'DEGRADED', 20, 'UNAVAILABLE', new Date(Date.now() - 3600000).toISOString(), 'X-Ray Collimator tube power supply fault; technician ticket #XRAY-991 pending');
    insertDiagStmt.run('DIAG-06', 'FAC-DH-01', 'Electrolytes & Arterial Blood Gas', 'Critical Care', 800, 1, 800, 'OPERATIONAL', 50, 'AVAILABLE', new Date().toISOString(), null);

    // 10. Operational Alerts with evidence, severity, action, responsible officer
    const insertAlertStmt = db.prepare(`
      INSERT INTO facility_alerts (
        id, facility_id, facility_name, alert_type, severity,
        title, description, suggested_action, responsible_officer, status, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
    `);

    insertAlertStmt.run(
      'ALT-01',
      'FAC-PHC-06',
      'PHC Rampur',
      'STOCKOUT_RISK',
      'CRITICAL',
      'Impending Stockout: Amoxicillin 500mg (25 capsules remaining)',
      'Current burn rate is 12 capsules/day with safety threshold 300. Usable stock will deplete in approx 48 hours.',
      'Authorize inter-facility transfer of 200 units from surplus stock at District Hospital Central.',
      'Dr. Anita Joshi / District Drug Inspector',
      new Date().toISOString()
    );

    insertAlertStmt.run(
      'ALT-02',
      'FAC-PHC-07',
      'PHC Shivnagar',
      'DATA_STALE',
      'WARNING',
      'Facility Data Sync Delayed (> 4 Hours)',
      'Last telemetry synchronization was recorded 4.2 hours ago. Connectivity degraded due to terrain microwave disruption.',
      'Contact facility on satellite mobile hotline (+91-135-2710007) and switch to queue-and-forward offline buffer.',
      'District IT Officer / Sub-Divisional Magistrate',
      new Date().toISOString()
    );

    insertAlertStmt.run(
      'ALT-03',
      'FAC-CHC-03',
      'CHC Sundarpur',
      'DIAGNOSTIC_DOWN',
      'CRITICAL',
      'Digital X-Ray System Offline',
      'Equipment collimator power malfunction. Trauma and orthopedic patients must be diverted or stabilized.',
      'Escalate emergency repair contract with vendor; route urgent emergency thoracic cases to SDH Vijaypur.',
      'Biomedical Engineer, NHM',
      new Date().toISOString()
    );

    // 11. Initial Proposed Inter-Facility Transfer
    db.prepare(`
      INSERT INTO inter_facility_transfers (
        id, source_facility_id, source_facility_name, target_facility_id, target_facility_name,
        medicine_id, medicine_name, batch_id, batch_number, quantity, status,
        ai_rationale, approved_by, donor_reserve_remaining, donor_safety_threshold,
        recipient_deficit_days, transport_eta_hours, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROPOSED_AI', ?, NULL, ?, ?, ?, ?, ?)
    `).run(
      'TRF-AI-001',
      'FAC-DH-01',
      'District Hospital Central',
      'FAC-PHC-06',
      'PHC Rampur',
      'MED-02',
      'Amoxicillin 500mg',
      'B-DH-AMX-01',
      'AMX-2025-B',
      200,
      'Recipient PHC Rampur has only 25 units (< 2 days buffer) against a 300 safety threshold. District Hospital Central holds 2,800 units. Transferring 200 units leaves DH with 2,600 units, well above its 500 reserve. Transport ETA via NH-58 is 1.1 hours.',
      2600,
      500,
      2.1,
      1.1,
      new Date().toISOString()
    );

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Error during database seed:', err);
  }
}
