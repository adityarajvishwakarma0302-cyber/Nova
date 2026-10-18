import { DatabaseSync } from 'node:sqlite';

export class BedService {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /**
   * Assign a bed to an admitted patient.
   * Atomically verifies that bed is AVAILABLE and that patient is not already assigned to another active bed.
   */
  assignBed(params: {
    facilityId: string;
    bedId: string;
    patientId: string;
    uhid: string;
    patientName: string;
    admittedBy: string;
    notes?: string;
  }) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      // 1. Verify Bed existence and availability
      const bed = this.db.prepare('SELECT * FROM beds WHERE id = ?').get(params.bedId) as any;
      if (!bed) {
        throw new Error('BED_NOT_FOUND: The specified bed does not exist.');
      }

      if (bed.facility_id !== params.facilityId) {
        throw new Error('FACILITY_MISMATCH: Bed does not belong to specified facility.');
      }

      if (bed.status !== 'AVAILABLE') {
        throw new Error(`BED_UNAVAILABLE: Bed ${bed.ward_name}-${bed.bed_number} is currently ${bed.status}.`);
      }

      // 2. Verify Patient is not already actively admitted to a bed
      const activeAssignment = this.db
        .prepare('SELECT * FROM bed_assignments WHERE patient_id = ? AND status = ?')
        .get(params.patientId, 'ACTIVE') as any;

      if (activeAssignment) {
        throw new Error(
          `PATIENT_ALREADY_ADMITTED: Patient ${params.uhid} already occupies bed ${activeAssignment.ward_name}-${activeAssignment.bed_number}.`
        );
      }

      const timestamp = new Date().toISOString();
      const assignmentId = 'ADM-' + Math.random().toString(36).substring(2, 9).toUpperCase();

      // 3. Mark Bed Occupied
      this.db
        .prepare(`
          UPDATE beds 
          SET status = 'OCCUPIED',
              current_patient_id = ?,
              current_uhid = ?,
              current_patient_name = ?,
              assigned_at = ?,
              notes = ?
          WHERE id = ?
        `)
        .run(
          params.patientId,
          params.uhid,
          params.patientName,
          timestamp,
          params.notes || null,
          params.bedId
        );

      // 4. Create Active Bed Assignment Record
      this.db
        .prepare(`
          INSERT INTO bed_assignments (
            id, bed_id, facility_id, patient_id, uhid, patient_name,
            ward_name, bed_number, admission_date, status, admitted_by, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
        `)
        .run(
          assignmentId,
          params.bedId,
          params.facilityId,
          params.patientId,
          params.uhid,
          params.patientName,
          bed.ward_name,
          bed.bed_number,
          timestamp,
          params.admittedBy,
          params.notes || null
        );

      this.db.exec('COMMIT;');
      return { success: true, assignmentId, bedId: params.bedId, timestamp };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Discharge an admitted patient.
   * Frees bed, updates assignment record, marks bed as CLEANING/AVAILABLE.
   */
  dischargePatient(params: {
    facilityId: string;
    bedId: string;
    dischargeNotes?: string;
    markCleaning?: boolean;
  }) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const bed = this.db.prepare('SELECT * FROM beds WHERE id = ?').get(params.bedId) as any;
      if (!bed) {
        throw new Error('BED_NOT_FOUND: Bed could not be found.');
      }

      const timestamp = new Date().toISOString();
      const nextStatus = params.markCleaning ? 'CLEANING' : 'AVAILABLE';

      // Update active assignment to DISCHARGED
      this.db
        .prepare(`
          UPDATE bed_assignments 
          SET status = 'DISCHARGED',
              discharge_date = ?,
              notes = COALESCE(notes, '') || ' [Discharge: ' || ? || ']'
          WHERE bed_id = ? AND status = 'ACTIVE'
        `)
        .run(timestamp, params.dischargeNotes || 'Routine discharge', params.bedId);

      // Reset Bed status
      this.db
        .prepare(`
          UPDATE beds 
          SET status = ?,
              current_patient_id = NULL,
              current_uhid = NULL,
              current_patient_name = NULL,
              assigned_at = NULL,
              notes = ?
          WHERE id = ?
        `)
        .run(nextStatus, params.markCleaning ? 'Awaiting sanitation' : null, params.bedId);

      this.db.exec('COMMIT;');
      return { success: true, bedId: params.bedId, newStatus: nextStatus };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Transfer patient from one bed to another within facility.
   */
  transferBed(params: {
    facilityId: string;
    currentBedId: string;
    targetBedId: string;
    reason: string;
    authorizedBy: string;
  }) {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const currentBed = this.db.prepare('SELECT * FROM beds WHERE id = ?').get(params.currentBedId) as any;
      const targetBed = this.db.prepare('SELECT * FROM beds WHERE id = ?').get(params.targetBedId) as any;

      if (!currentBed || currentBed.status !== 'OCCUPIED') {
        throw new Error('INVALID_CURRENT_BED: Current bed is not currently occupied.');
      }

      if (!targetBed || targetBed.status !== 'AVAILABLE') {
        throw new Error(`TARGET_BED_UNAVAILABLE: Target bed is currently ${targetBed?.status || 'NON-EXISTENT'}.`);
      }

      const timestamp = new Date().toISOString();

      // Complete previous assignment as TRANSFERRED
      this.db
        .prepare(`
          UPDATE bed_assignments 
          SET status = 'TRANSFERRED',
              discharge_date = ?,
              notes = COALESCE(notes, '') || ' [Transferred to ' || ? || '-' || ? || ': ' || ? || ']'
          WHERE bed_id = ? AND status = 'ACTIVE'
        `)
        .run(timestamp, targetBed.ward_name, targetBed.bed_number, params.reason, params.currentBedId);

      // Mark old bed as CLEANING
      this.db
        .prepare(`
          UPDATE beds 
          SET status = 'CLEANING',
              current_patient_id = NULL,
              current_uhid = NULL,
              current_patient_name = NULL,
              assigned_at = NULL,
              notes = 'Post-transfer disinfection'
          WHERE id = ?
        `)
        .run(params.currentBedId);

      // Assign target bed
      this.db
        .prepare(`
          UPDATE beds 
          SET status = 'OCCUPIED',
              current_patient_id = ?,
              current_uhid = ?,
              current_patient_name = ?,
              assigned_at = ?,
              notes = ?
          WHERE id = ?
        `)
        .run(
          currentBed.current_patient_id,
          currentBed.current_uhid,
          currentBed.current_patient_name,
          timestamp,
          `Transferred from ${currentBed.ward_name}-${currentBed.bed_number}: ${params.reason}`,
          params.targetBedId
        );

      // Create new assignment
      const newAssignmentId = 'TRF-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      this.db
        .prepare(`
          INSERT INTO bed_assignments (
            id, bed_id, facility_id, patient_id, uhid, patient_name,
            ward_name, bed_number, admission_date, status, admitted_by, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
        `)
        .run(
          newAssignmentId,
          params.targetBedId,
          params.facilityId,
          currentBed.current_patient_id,
          currentBed.current_uhid,
          currentBed.current_patient_name,
          targetBed.ward_name,
          targetBed.bed_number,
          timestamp,
          params.authorizedBy,
          `Transferred from ${currentBed.ward_name}-${currentBed.bed_number}: ${params.reason}`
        );

      this.db.exec('COMMIT;');
      return { success: true, newAssignmentId };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Calculate bed metrics with mutually exclusive status definitions:
   * Total Operational = Available + Occupied + Unavailable (Maintenance + Quarantined + Cleaning)
   */
  getBedMetrics(facilityId?: string) {
    let query = 'SELECT status, count(*) as count FROM beds';
    const params: any[] = [];
    if (facilityId && facilityId !== 'ALL') {
      query += ' WHERE facility_id = ?';
      params.push(facilityId);
    }
    query += ' GROUP BY status';

    const rows = this.db.prepare(query).all(...params) as any[];
    const counts: Record<string, number> = {
      AVAILABLE: 0,
      OCCUPIED: 0,
      MAINTENANCE: 0,
      QUARANTINED: 0,
      CLEANING: 0,
    };

    let totalOperational = 0;
    for (const r of rows) {
      counts[r.status] = r.count;
      totalOperational += r.count;
    }

    const occupied = counts.OCCUPIED;
    const unavailableOther = counts.MAINTENANCE + counts.QUARANTINED + counts.CLEANING;
    const available = counts.AVAILABLE;
    // Enforce mutually exclusive check: available === totalOperational - occupied - unavailableOther
    const calculatedAvailable = Math.max(0, totalOperational - occupied - unavailableOther);

    return {
      totalOperational,
      occupied,
      available: calculatedAvailable,
      unavailableOther,
      maintenance: counts.MAINTENANCE,
      quarantined: counts.QUARANTINED,
      cleaning: counts.CLEANING,
      occupancyRatePct: totalOperational > 0 ? Math.round((occupied / totalOperational) * 100) : 0,
    };
  }
}
