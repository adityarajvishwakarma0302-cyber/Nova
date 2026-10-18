import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.cwd(), 'swasthya_setu.db');

export function initDatabase(inMemory = false): DatabaseSync {
  const db = new DatabaseSync(inMemory ? ':memory:' : DB_PATH);
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Create Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      type TEXT NOT NULL,
      block TEXT NOT NULL,
      total_beds INTEGER NOT NULL,
      contact_phone TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      distance_km REAL NOT NULL,
      last_sync_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ONLINE'
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      badge_number TEXT NOT NULL,
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      uhid TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      village TEXT NOT NULL,
      phone TEXT NOT NULL,
      blood_group TEXT,
      allergies TEXT,
      emergency_contact TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      uhid TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      visit_type TEXT NOT NULL,
      chief_complaint TEXT NOT NULL,
      triage_category TEXT NOT NULL,
      doctor_id TEXT,
      doctor_name TEXT,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS beds (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      ward_name TEXT NOT NULL,
      bed_number TEXT NOT NULL,
      bed_type TEXT NOT NULL,
      status TEXT NOT NULL, -- AVAILABLE, OCCUPIED, MAINTENANCE, QUARANTINED, CLEANING
      current_patient_id TEXT,
      current_uhid TEXT,
      current_patient_name TEXT,
      assigned_at TEXT,
      notes TEXT,
      UNIQUE(facility_id, ward_name, bed_number),
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS bed_assignments (
      id TEXT PRIMARY KEY,
      bed_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      uhid TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      ward_name TEXT NOT NULL,
      bed_number TEXT NOT NULL,
      admission_date TEXT NOT NULL,
      discharge_date TEXT,
      status TEXT NOT NULL, -- ACTIVE, DISCHARGED, TRANSFERRED
      admitted_by TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (bed_id) REFERENCES beds(id),
      FOREIGN KEY (facility_id) REFERENCES facilities(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      generic_name TEXT NOT NULL,
      category TEXT NOT NULL,
      form TEXT NOT NULL,
      strength TEXT NOT NULL,
      unit TEXT NOT NULL,
      default_safety_stock INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      medicine_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      batch_number TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      quantity_usable INTEGER NOT NULL CHECK (quantity_usable >= 0),
      quantity_quarantined INTEGER NOT NULL DEFAULT 0 CHECK (quantity_quarantined >= 0),
      quantity_damaged INTEGER NOT NULL DEFAULT 0 CHECK (quantity_damaged >= 0),
      storage_location TEXT NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      is_expired INTEGER NOT NULL DEFAULT 0,
      is_recalled INTEGER NOT NULL DEFAULT 0,
      UNIQUE(facility_id, medicine_id, batch_number),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      receipt_number TEXT UNIQUE NOT NULL,
      facility_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      uhid TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      dispensed_by_user_id TEXT NOT NULL,
      dispensed_by_user_name TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, CORRECTED, VOIDED
      timestamp TEXT NOT NULL,
      FOREIGN KEY (facility_id) REFERENCES facilities(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS receipt_items (
      id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      medicine_code TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      batch_number TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      quantity_dispensed INTEGER NOT NULL CHECK (quantity_dispensed > 0),
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL DEFAULT 0,
      total_price REAL NOT NULL DEFAULT 0,
      dosage_instructions TEXT,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      quantity_delta INTEGER NOT NULL,
      balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
      idempotency_key TEXT UNIQUE NOT NULL,
      reference_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (facility_id) REFERENCES facilities(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS receipt_audits (
      id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      receipt_number TEXT NOT NULL,
      correction_reason TEXT NOT NULL,
      corrected_by_user_id TEXT NOT NULL,
      corrected_by_user_name TEXT NOT NULL,
      previous_values_json TEXT NOT NULL,
      new_values_json TEXT NOT NULL,
      affected_transactions_json TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id)
    );

    CREATE TABLE IF NOT EXISTS patient_returns (
      id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      receipt_number TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      uhid TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      batch_number TEXT NOT NULL,
      quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
      condition TEXT NOT NULL, -- SEALED_INTACT, UNSEALED, EXPIRED, DAMAGED
      disposition TEXT NOT NULL, -- RESTOCKED, QUARANTINED, DESTROYED
      inspected_by_user_id TEXT NOT NULL,
      inspected_by_user_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS clinical_incidents (
      id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      uhid TEXT NOT NULL,
      severity TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'REPORTED',
      reported_by TEXT NOT NULL,
      clinical_review_notes TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS doctor_attendance (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      shift TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL, -- SCHEDULED, CONFIRMED_PRESENT, CONFIRMED_ABSENT, UNCONFIRMED
      check_in_time TEXT,
      check_out_time TEXT,
      verified_by TEXT,
      notes TEXT,
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS diagnostic_tests (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      test_name TEXT NOT NULL,
      category TEXT NOT NULL,
      total_reagents_available INTEGER NOT NULL,
      reagents_per_test INTEGER NOT NULL DEFAULT 1,
      tests_possible_with_stock INTEGER NOT NULL,
      equipment_status TEXT NOT NULL, -- OPERATIONAL, DEGRADED, OUT_OF_SERVICE
      daily_average_tests INTEGER NOT NULL,
      status TEXT NOT NULL, -- AVAILABLE, UNAVAILABLE, LOW_REAGENT
      last_reported_time TEXT NOT NULL,
      downtime_reason TEXT,
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS inter_facility_transfers (
      id TEXT PRIMARY KEY,
      source_facility_id TEXT NOT NULL,
      source_facility_name TEXT NOT NULL,
      target_facility_id TEXT NOT NULL,
      target_facility_name TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      batch_number TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      status TEXT NOT NULL DEFAULT 'PROPOSED_AI', -- PROPOSED_AI, APPROVED, DISPATCHED, RECEIVED, REJECTED
      ai_rationale TEXT NOT NULL,
      approved_by TEXT,
      donor_reserve_remaining INTEGER NOT NULL,
      donor_safety_threshold INTEGER NOT NULL,
      recipient_deficit_days REAL NOT NULL,
      transport_eta_hours REAL NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (source_facility_id) REFERENCES facilities(id),
      FOREIGN KEY (target_facility_id) REFERENCES facilities(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS facility_alerts (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      facility_name TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      suggested_action TEXT NOT NULL,
      responsible_officer TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      timestamp TEXT NOT NULL,
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT UNIQUE NOT NULL,
      facility_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING'
    );
  `);

  return db;
}

export const dbInstance = initDatabase();
