export type FacilityType = 'PHC' | 'CHC' | 'SDH' | 'DH';

export type UserRole = 
  | 'REGISTRATION' 
  | 'NURSE' 
  | 'PHARMACIST' 
  | 'DOCTOR' 
  | 'FACILITY_ADMIN' 
  | 'DISTRICT_OFFICER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  facilityId: string;
  facilityName: string;
  badgeNumber: string;
}

export interface Facility {
  id: string;
  name: string;
  nameHi: string;
  type: FacilityType;
  block: string;
  totalBeds: number;
  contactPhone: string;
  latitude: number;
  longitude: number;
  distanceKmFromCenter: number;
  lastSyncTime: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  isStale?: boolean;
}

export interface Patient {
  id: string;
  uhid: string;
  fullName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  village: string;
  phone: string;
  bloodGroup: string;
  allergies: string;
  emergencyContact: string;
  createdAt: string;
}

export type TriageCategory = 'GREEN' | 'YELLOW' | 'RED';
export type VisitType = 'OPD' | 'EMERGENCY' | 'FOLLOWUP';
export type VisitStatus = 'WAITING' | 'ATTENDED' | 'ADMITTED' | 'DISCHARGED';

export interface Visit {
  id: string;
  patientId: string;
  uhid: string;
  patientName: string;
  facilityId: string;
  visitType: VisitType;
  chiefComplaint: string;
  triageCategory: TriageCategory;
  doctorId: string;
  doctorName: string;
  status: VisitStatus;
  timestamp: string;
}

export type BedType = 'GENERAL' | 'ICU' | 'MATERNITY' | 'ISOLATION' | 'PEDIATRIC';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'QUARANTINED' | 'CLEANING';

export interface Bed {
  id: string;
  facilityId: string;
  wardName: string;
  bedNumber: string;
  bedType: BedType;
  status: BedStatus;
  currentPatientId: string | null;
  currentUhid: string | null;
  currentPatientName: string | null;
  assignedAt: string | null;
  notes: string | null;
}

export interface BedAssignment {
  id: string;
  bedId: string;
  facilityId: string;
  patientId: string;
  uhid: string;
  patientName: string;
  wardName: string;
  bedNumber: string;
  admissionDate: string;
  dischargeDate: string | null;
  status: 'ACTIVE' | 'DISCHARGED' | 'TRANSFERRED';
  admittedBy: string;
  notes: string | null;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  genericName: string;
  category: string;
  form: 'TABLET' | 'INJECTION' | 'SYRUP' | 'OINTMENT' | 'IV_FLUID';
  strength: string;
  unit: string;
  defaultSafetyStock: number;
}

export interface Batch {
  id: string;
  medicineId: string;
  medicineName?: string;
  medicineCode?: string;
  facilityId: string;
  batchNumber: string;
  expiryDate: string;
  quantityUsable: number;
  quantityQuarantined: number;
  quantityDamaged: number;
  storageLocation: string;
  unitCost: number;
  isExpired: boolean;
  isRecalled: boolean;
  unit?: string;
  default_safety_stock?: number;
}

export type TransactionType = 
  | 'DISPENSE' 
  | 'DELIVERY' 
  | 'RETURN_RESTOCKED' 
  | 'RETURN_QUARANTINED' 
  | 'CORRECTION_CREDIT' 
  | 'CORRECTION_DEBIT' 
  | 'WASTAGE' 
  | 'TRANSFER_IN' 
  | 'TRANSFER_OUT' 
  | 'STOCK_ADJUSTMENT';

export interface InventoryTransaction {
  id: string;
  facilityId: string;
  medicineId: string;
  batchId: string;
  transactionType: TransactionType;
  quantityDelta: number;
  balanceAfter: number;
  idempotencyKey: string;
  referenceId: string;
  userId: string;
  userName: string;
  reason: string;
  timestamp: string;
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  medicineId: string;
  medicineName: string;
  medicineCode: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantityDispensed: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  dosageInstructions?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  facilityId: string;
  facilityName: string;
  patientId: string;
  uhid: string;
  patientName: string;
  totalAmount: number;
  dispensedByUserId: string;
  dispensedByUserName: string;
  idempotencyKey: string;
  status: 'CONFIRMED' | 'CORRECTED' | 'VOIDED';
  timestamp: string;
  items: ReceiptItem[];
}

export interface ReceiptAudit {
  id: string;
  receiptId: string;
  receiptNumber: string;
  correctionReason: string;
  correctedByUserId: string;
  correctedByUserName: string;
  previousValuesJson: string;
  newValuesJson: string;
  affectedTransactionsJson: string;
  timestamp: string;
}

export type ReturnCondition = 'SEALED_INTACT' | 'UNSEALED' | 'EXPIRED' | 'DAMAGED';
export type ReturnDisposition = 'RESTOCKED' | 'QUARANTINED' | 'DESTROYED';

export interface PatientReturn {
  id: string;
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
  condition: ReturnCondition;
  disposition: ReturnDisposition;
  inspectedByUserId: string;
  inspectedByUserName: string;
  reason: string;
  timestamp: string;
}

export interface ClinicalIncident {
  id: string;
  receiptId: string;
  medicineId: string;
  patientId: string;
  uhid: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'REPORTED' | 'UNDER_REVIEW' | 'RESOLVED';
  reportedBy: string;
  clinicalReviewNotes?: string;
  timestamp: string;
}

export type ShiftType = 'MORNING' | 'EVENING' | 'NIGHT' | 'EMERGENCY_ONCALL';
export type AttendanceStatus = 'SCHEDULED' | 'CONFIRMED_PRESENT' | 'CONFIRMED_ABSENT' | 'UNCONFIRMED';

export interface DoctorAttendance {
  id: string;
  facilityId: string;
  doctorName: string;
  specialty: string;
  shift: ShiftType;
  scheduledDate: string;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  verifiedBy: string | null;
  notes: string | null;
}

export interface DiagnosticTest {
  id: string;
  facilityId: string;
  testName: string;
  category: string;
  totalReagentsAvailable: number;
  reagentsPerTest: number;
  testsPossibleWithStock: number;
  equipmentStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUT_OF_SERVICE';
  dailyAverageTests: number;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'LOW_REAGENT';
  lastReportedTime: string;
  downtimeReason?: string;
}

export type TransferStatus = 'PROPOSED_AI' | 'APPROVED' | 'DISPATCHED' | 'RECEIVED' | 'REJECTED';

export interface InterFacilityTransfer {
  id: string;
  sourceFacilityId: string;
  sourceFacilityName: string;
  targetFacilityId: string;
  targetFacilityName: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  status: TransferStatus;
  aiRationale: string;
  approvedBy: string | null;
  donorReserveRemaining: number;
  donorSafetyThreshold: number;
  recipientDeficitDays: number;
  transportEtaHours: number;
  timestamp: string;
}

export interface FacilityAlert {
  id: string;
  facilityId: string;
  facilityName: string;
  alertType: 'STOCKOUT_RISK' | 'BED_CRISIS' | 'STAFF_GAP' | 'DIAGNOSTIC_DOWN' | 'DATA_STALE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  suggestedAction: string;
  responsibleOfficer: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  timestamp: string;
}

export interface DistrictSummary {
  totalFacilities: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  unavailableBeds: number;
  occupancyRatePct: number;
  totalOpdToday: number;
  activeAdmissions: number;
  dischargesToday: number;
  activeStockoutRisks: number;
  totalDoctorsOnDuty: number;
  totalDoctorsScheduled: number;
  activeAlertsCount: number;
}

export interface ForecastPoint {
  dayOffset: number;
  dateStr: string;
  dayName: string;
  dayNameHi?: string;
  projectedVisits: number;
  confidenceLower: number;
  confidenceUpper: number;
  surgeFactor: number;
}

export interface MedicineDepletionForecast {
  medicineId: string;
  medicineName: string;
  genericName?: string;
  unit?: string;
  facilityId: string;
  facilityName: string;
  usableStock: number;
  safetyStock: number;
  avgDailyConsumption: number;
  daysRemaining: number;
  estimatedDepletionDate: string;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE';
  donorSurplusCandidates: {
    facilityId: string;
    facilityName: string;
    surplusQuantity: number;
    distanceKm: number;
  }[];
}
