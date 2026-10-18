/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DistrictDashboard } from './components/DistrictDashboard.tsx';
import { PatientManagement } from './components/PatientManagement.tsx';
import { BedManagement } from './components/BedManagement.tsx';
import { PharmacyDispensing } from './components/PharmacyDispensing.tsx';
import { InventoryAudit } from './components/InventoryAudit.tsx';
import { AttendanceAndDiagnostics } from './components/AttendanceAndDiagnostics.tsx';
import { AIForecasting } from './components/AIForecasting.tsx';
import { VerificationRunner } from './components/VerificationRunner.tsx';
import { 
  Facility, 
  UserRole, 
  Patient, 
  Visit, 
  Bed, 
  Medicine, 
  Batch, 
  InventoryTransaction, 
  DoctorAttendance, 
  DiagnosticTest, 
  InterFacilityTransfer, 
  FacilityAlert,
  DistrictSummary
} from './types/index.ts';
import { SupportedLanguage } from './i18n/index.ts';

export default function App() {
  // App Navigation & Context State
  const [currentTab, setCurrentTab] = useState<string>('district');
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const [currentRole, setCurrentRole] = useState<UserRole>('DISTRICT_OFFICER');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('ALL');

  // Offline simulation & Safe sync queue state
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  // Core Data States
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [districtSummary, setDistrictSummary] = useState<DistrictSummary | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [bedMetrics, setBedMetrics] = useState<any>({
    totalOperational: 0,
    occupied: 0,
    available: 0,
    unavailableOther: 0,
    maintenance: 0,
    quarantined: 0,
    cleaning: 0,
    occupancyRatePct: 0,
  });
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [attendance, setAttendance] = useState<DoctorAttendance[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticTest[]>([]);
  const [transfers, setTransfers] = useState<InterFacilityTransfer[]>([]);
  const [alerts, setAlerts] = useState<FacilityAlert[]>([]);
  const [forecastData, setForecastData] = useState<{
    footfall: any;
    depletion: any[];
    recommendations: any[];
    aiSynthesis: any;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active user representation based on role
  const currentUserName = 
    currentRole === 'DISTRICT_OFFICER' ? 'Dr. Rameshwar Dayal, CMO' :
    currentRole === 'FACILITY_ADMIN' ? 'Dr. Anita Joshi, Superintendent' :
    currentRole === 'DOCTOR' ? 'Dr. Vivek Bhatt, MO' :
    currentRole === 'PHARMACIST' ? 'Rajesh Sharma, RPh' :
    currentRole === 'NURSE' ? 'Sister Sunita Kumari, RN' : 'Kamlesh Rawat, Clerk';

  const currentUserId = 'USR-' + currentRole;

  // Selected Facility Name
  const activeFacilityObj = facilities.find((f) => f.id === selectedFacilityId);
  const facilityName = activeFacilityObj ? activeFacilityObj.name : 'All District Facilities (Consolidated)';

  // Data Fetching
  const fetchAllData = useCallback(async () => {
    try {
      const facQuery = selectedFacilityId === 'ALL' ? '' : `?facilityId=${selectedFacilityId}`;
      
      const [
        facRes,
        sumRes,
        patRes,
        visRes,
        bedRes,
        medRes,
        batRes,
        txRes,
        attRes,
        diagRes,
        trfRes,
        altRes,
        fcRes,
      ] = await Promise.all([
        fetch('/api/facilities').then((r) => r.json()),
        fetch('/api/district/summary').then((r) => r.json()),
        fetch('/api/patients').then((r) => r.json()),
        fetch(`/api/visits${facQuery}`).then((r) => r.json()),
        fetch(`/api/beds${facQuery}`).then((r) => r.json()),
        fetch('/api/medicines').then((r) => r.json()),
        fetch(`/api/batches${facQuery}`).then((r) => r.json()),
        fetch(`/api/inventory/transactions${facQuery}`).then((r) => r.json()),
        fetch(`/api/attendance${facQuery}`).then((r) => r.json()),
        fetch(`/api/diagnostics${facQuery}`).then((r) => r.json()),
        fetch('/api/transfers').then((r) => r.json()),
        fetch('/api/alerts').then((r) => r.json()),
        fetch(`/api/forecast${facQuery}`).then((r) => r.json()),
      ]);

      setFacilities(facRes || []);
      setDistrictSummary(sumRes || null);
      setPatients(patRes || []);
      setVisits(visRes || []);
      setBeds(bedRes?.beds || []);
      setBedMetrics(bedRes?.metrics || {
        totalOperational: 0,
        occupied: 0,
        available: 0,
        unavailableOther: 0,
        maintenance: 0,
        quarantined: 0,
        cleaning: 0,
        occupancyRatePct: 0,
      });
      setMedicines(medRes || []);
      setBatches(batRes || []);
      setTransactions(txRes || []);
      setAttendance(attRes || []);
      setDiagnostics(diagRes || []);
      setTransfers(trfRes || []);
      setAlerts(altRes || []);
      setForecastData(fcRes || null);
    } catch (err) {
      console.error('Failed to fetch platform telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFacilityId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle Offline Replay when switched back online
  useEffect(() => {
    if (!isOfflineMode && syncQueue.length > 0) {
      const replayPending = async () => {
        for (const item of syncQueue) {
          try {
            await fetch(item.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload),
            });
          } catch (e) {
            console.error('Replay failed for item:', item, e);
          }
        }
        setSyncQueue([]);
        fetchAllData();
      };
      replayPending();
    }
  }, [isOfflineMode, syncQueue, fetchAllData]);

  // API Action Wrappers
  const handleRegisterPatient = async (patientData: any) => {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register patient');
    }
    return res.json();
  };

  const handleRecordVisit = async (visitData: any) => {
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record visit');
    }
    return res.json();
  };

  const handleAssignBed = async (params: any) => {
    const res = await fetch('/api/beds/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to assign bed');
    }
    return res.json();
  };

  const handleDischarge = async (params: any) => {
    const res = await fetch('/api/beds/discharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Discharge failed');
    }
    return res.json();
  };

  const handleTransfer = async (params: any) => {
    const res = await fetch('/api/beds/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Transfer failed');
    }
    return res.json();
  };

  const handleChangeBedStatus = async (params: any) => {
    const res = await fetch('/api/beds/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Status update failed');
    }
    return res.json();
  };

  const handleDispense = async (payload: any) => {
    if (isOfflineMode) {
      // Offline queue simulation
      setSyncQueue((prev) => [
        ...prev,
        { endpoint: '/api/dispense', payload, timestamp: new Date().toISOString() },
      ]);
      // Return simulated optimistic offline response
      return {
        isDuplicateReplay: false,
        receipt: {
          id: 'OFFLINE-' + Date.now(),
          receiptNumber: 'RX-OFFLINE-' + Math.floor(100000 + Math.random() * 900000),
          facilityId: payload.facilityId,
          facilityName,
          patientId: payload.patientId,
          uhid: payload.uhid,
          patientName: payload.patientName,
          totalAmount: 0,
          dispensedByUserId: payload.dispensedByUserId,
          dispensedByUserName: payload.dispensedByUserName,
          idempotencyKey: payload.idempotencyKey,
          status: 'CONFIRMED',
          timestamp: new Date().toISOString(),
          items: payload.items.map((it: any) => ({
            id: 'OFFLINE-ITEM-' + it.batchId,
            medicineId: it.medicineId,
            medicineName: medicines.find((m) => m.id === it.medicineId)?.name || 'Prescribed Medicine',
            batchNumber: batches.find((b) => b.id === it.batchId)?.batchNumber || 'OFFLINE-BATCH',
            expiryDate: '2027-12-31',
            quantityDispensed: it.quantity,
            unit: 'units',
            unitPrice: 0,
            totalPrice: 0,
            dosageInstructions: it.dosageInstructions,
          })),
        },
      };
    }

    const res = await fetch('/api/dispense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Dispense failed');
    }
    return res.json();
  };

  const handleCorrectReceipt = async (receiptId: string, payload: any) => {
    const res = await fetch(`/api/receipts/${receiptId}/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Correction failed');
    }
    return res.json();
  };

  const handleProcessReturn = async (payload: any) => {
    const res = await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Return failed');
    }
    return res.json();
  };

  const handleReportIncident = async (payload: any) => {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Incident reporting failed');
    }
    return res.json();
  };

  const handleRecordDelivery = async (payload: any) => {
    const res = await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Delivery recording failed');
    }
    return res.json();
  };

  const handleVerifyAttendance = async (payload: any) => {
    const res = await fetch('/api/attendance/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Attendance verification failed');
    }
    return res.json();
  };

  const handleUpdateDiagnostic = async (payload: any) => {
    const res = await fetch('/api/diagnostics/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Diagnostic update failed');
    }
    return res.json();
  };

  const handleApproveTransfer = async (transferId: string, approvedBy: string) => {
    const res = await fetch('/api/transfers/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transferId, approvedBy }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Transfer approval failed');
    }
    return res.json();
  };

  const handleRejectTransfer = async (transferId: string, reason: string) => {
    const res = await fetch('/api/transfers/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transferId, reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Transfer rejection failed');
    }
    return res.json();
  };

  const handleRunLiveTests = async () => {
    const res = await fetch('/api/run-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to execute test runner');
    }
    return res.json();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Universal Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
        setSelectedFacilityId={setSelectedFacilityId}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
        isOfflineMode={isOfflineMode}
        setIsOfflineMode={setIsOfflineMode}
        pendingSyncCount={syncQueue.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'district' && (
          <DistrictDashboard
            summary={districtSummary}
            facilities={facilities}
            alerts={alerts}
            onSelectFacility={(id) => setSelectedFacilityId(id)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            currentLang={currentLang}
            aiBrief={forecastData?.aiSynthesis}
            onRefresh={fetchAllData}
          />
        )}

        {currentTab === 'patients' && (
          <PatientManagement
            patients={patients}
            visits={visits}
            facilities={facilities}
            selectedFacilityId={selectedFacilityId}
            beds={beds}
            currentLang={currentLang}
            onRegisterPatient={handleRegisterPatient}
            onRecordVisit={handleRecordVisit}
            onAdmitPatient={handleAssignBed}
            onRefresh={fetchAllData}
          />
        )}

        {currentTab === 'beds' && (
          <BedManagement
            beds={beds}
            metrics={bedMetrics}
            patients={patients}
            facilityName={facilityName}
            facilityId={selectedFacilityId === 'ALL' ? 'FAC-PHC-06' : selectedFacilityId}
            currentLang={currentLang}
            onAssignBed={handleAssignBed}
            onDischarge={handleDischarge}
            onTransfer={handleTransfer}
            onChangeStatus={handleChangeBedStatus}
            onRefresh={fetchAllData}
          />
        )}

        {currentTab === 'dispense' && (
          <PharmacyDispensing
            medicines={medicines}
            batches={batches}
            patients={patients}
            facilityId={selectedFacilityId === 'ALL' ? 'FAC-PHC-06' : selectedFacilityId}
            facilityName={facilityName}
            currentLang={currentLang}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            onDispense={handleDispense}
            onCorrectReceipt={handleCorrectReceipt}
            onProcessReturn={handleProcessReturn}
            onReportIncident={handleReportIncident}
            onRefresh={fetchAllData}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryAudit
            medicines={medicines}
            batches={batches}
            transactions={transactions}
            facilityName={facilityName}
            facilityId={selectedFacilityId === 'ALL' ? 'FAC-PHC-06' : selectedFacilityId}
            currentLang={currentLang}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            onRecordDelivery={handleRecordDelivery}
            onRefresh={fetchAllData}
          />
        )}

        {currentTab === 'attendance' && (
          <AttendanceAndDiagnostics
            attendanceRecords={attendance}
            diagnosticTests={diagnostics}
            facilityName={facilityName}
            facilityId={selectedFacilityId === 'ALL' ? 'FAC-PHC-06' : selectedFacilityId}
            currentLang={currentLang}
            currentUserName={currentUserName}
            onVerifyAttendance={handleVerifyAttendance}
            onUpdateDiagnostic={handleUpdateDiagnostic}
            onRefresh={fetchAllData}
          />
        )}

        {currentTab === 'ai' && (
          <AIForecasting
            footfallForecast={forecastData?.footfall || null}
            depletionList={forecastData?.depletion || []}
            transfers={transfers}
            currentLang={currentLang}
            currentUserName={currentUserName}
            onApproveTransfer={handleApproveTransfer}
            onRejectTransfer={handleRejectTransfer}
            onRefresh={fetchAllData}
          />
        )}

        {currentTab === 'verification' && (
          <VerificationRunner
            currentLang={currentLang}
            onRunLiveTests={handleRunLiveTests}
            onRefreshAll={fetchAllData}
          />
        )}
      </main>

      {/* Official Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white">SwasthyaSetu AI</span>
            <span>• National Health Mission Integrated Health Intelligence Platform</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-500 font-mono text-[11px]">
            <span>ACID Engine: SQLite WAL Mode</span>
            <span>FEFO Medicine Allocation</span>
            <span>Rule-Guaranteed Donor Reserves</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
