import React, { useState } from 'react';
import { 
  Bed as BedIcon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft, 
  LogOut, 
  Wrench, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  User, 
  FileText,
  Filter
} from 'lucide-react';
import { Bed as BedInterface, Patient } from '../types/index.ts';
import { SupportedLanguage, translations } from '../i18n/index.ts';

interface BedManagementProps {
  beds: BedInterface[];
  metrics: {
    totalOperational: number;
    occupied: number;
    available: number;
    unavailableOther: number;
    maintenance: number;
    quarantined: number;
    cleaning: number;
    occupancyRatePct: number;
  };
  patients: Patient[];
  facilityName: string;
  facilityId: string;
  currentLang: SupportedLanguage;
  onAssignBed: (params: any) => Promise<any>;
  onDischarge: (params: any) => Promise<any>;
  onTransfer: (params: any) => Promise<any>;
  onChangeStatus: (params: any) => Promise<any>;
  onRefresh: () => void;
}

export const BedManagement: React.FC<BedManagementProps> = ({
  beds,
  metrics,
  patients,
  facilityName,
  facilityId,
  currentLang,
  onAssignBed,
  onDischarge,
  onTransfer,
  onChangeStatus,
  onRefresh,
}) => {
  const t = translations[currentLang];
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals state
  const [activeBedForAction, setActiveBedForAction] = useState<BedInterface | null>(null);
  const [actionType, setActionType] = useState<'ASSIGN' | 'DISCHARGE' | 'TRANSFER' | 'STATUS' | null>(null);

  // Form states
  const [assignPatientId, setAssignPatientId] = useState('');
  const [targetTransferBedId, setTargetTransferBedId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [newBedStatus, setNewBedStatus] = useState<string>('AVAILABLE');
  const [statusNotes, setStatusNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter wards
  const wards = Array.from(new Set(beds.map((b) => b.wardName)));

  const filteredBeds = beds.filter((b) => {
    const matchesWard = selectedWard === 'ALL' || b.wardName === selectedWard;
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    return matchesWard && matchesStatus;
  });

  const availableBedsForTransfer = beds.filter(
    (b) => b.status === 'AVAILABLE' && b.id !== activeBedForAction?.id
  );

  // Mutually exclusive formula check: Operational = Occupied + Available + Unavailable
  const formulaCheck = metrics.totalOperational === (metrics.occupied + metrics.available + metrics.unavailableOther);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBedForAction) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (actionType === 'ASSIGN') {
        const patient = patients.find((p) => p.id === assignPatientId);
        if (!patient) throw new Error('Please select a valid registered patient.');
        await onAssignBed({
          facilityId,
          bedId: activeBedForAction.id,
          patientId: patient.id,
          uhid: patient.uhid,
          patientName: patient.fullName,
          admittedBy: 'Staff Nurse',
          notes: 'Admitted from ward desk',
        });
        setSuccessMessage(`Patient ${patient.fullName} successfully assigned to ${activeBedForAction.bedNumber}.`);
      } else if (actionType === 'DISCHARGE') {
        await onDischarge({
          facilityId,
          bedId: activeBedForAction.id,
          dischargeNotes,
          markCleaning: true,
        });
        setSuccessMessage(`Bed ${activeBedForAction.bedNumber} discharged and scheduled for terminal cleaning.`);
      } else if (actionType === 'TRANSFER') {
        if (!targetTransferBedId) throw new Error('Please choose an available destination bed.');
        await onTransfer({
          facilityId,
          currentBedId: activeBedForAction.id,
          targetBedId: targetTransferBedId,
          reason: transferReason || 'Clinical progression',
          authorizedBy: 'Medical Officer',
        });
        setSuccessMessage(`Patient transferred successfully. Source bed queued for disinfection.`);
      } else if (actionType === 'STATUS') {
        await onChangeStatus({
          bedId: activeBedForAction.id,
          newStatus: newBedStatus,
          notes: statusNotes,
        });
        setSuccessMessage(`Bed ${activeBedForAction.bedNumber} status updated to ${newBedStatus}.`);
      }

      setActionType(null);
      setActiveBedForAction(null);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OCCUPIED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MAINTENANCE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'QUARANTINED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'CLEANING':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Formula Verification Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {currentLang === 'hi' ? 'परस्पर अनन्य बेड प्रबंधन' : 'Mutually Exclusive Bed Logic'}
              </span>
              <span className="text-xs text-slate-400">
                {facilityName}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              {t.navigation.bedManagement}
            </h1>
          </div>

          {/* Formula Verification HUD */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono">
            <div className="text-[11px] text-slate-500 font-sans font-semibold mb-1">
              {currentLang === 'hi' ? 'गणितीय सत्यनिष्ठा सूत्र (Mathematical Invariance):' : 'Strict Verification Equation:'}
            </div>
            <div className="flex items-center space-x-1.5 font-bold">
              <span className="text-slate-800">{metrics.totalOperational} Operational</span>
              <span className="text-slate-400">=</span>
              <span className="text-emerald-700">{metrics.available} Available</span>
              <span className="text-slate-400">+</span>
              <span className="text-blue-700">{metrics.occupied} Occupied</span>
              <span className="text-slate-400">+</span>
              <span className="text-amber-700">{metrics.unavailableOther} Unavailable</span>
              {formulaCheck ? (
                <span className="ml-2 text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-sans text-[10px] font-bold">
                  ✓ VERIFIED
                </span>
              ) : (
                <span className="ml-2 text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-sans text-[10px] font-bold">
                  ⚠️ INCONSISTENCY DETECTED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Counts Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <span className="text-emerald-700 font-semibold">{t.bedStatus.AVAILABLE}</span>
            <p className="text-2xl font-black text-emerald-900 mt-1 font-mono">{metrics.available}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-blue-700 font-semibold">{t.bedStatus.OCCUPIED}</span>
            <p className="text-2xl font-black text-blue-900 mt-1 font-mono">{metrics.occupied}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="text-amber-700 font-semibold">{t.bedStatus.MAINTENANCE}</span>
            <p className="text-2xl font-black text-amber-900 mt-1 font-mono">{metrics.maintenance}</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <span className="text-rose-700 font-semibold">{t.bedStatus.QUARANTINED}</span>
            <p className="text-2xl font-black text-rose-900 mt-1 font-mono">{metrics.quarantined}</p>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
            <span className="text-sky-700 font-semibold">{t.bedStatus.CLEANING}</span>
            <p className="text-2xl font-black text-sky-900 mt-1 font-mono">{metrics.cleaning}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="font-bold text-slate-400">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="font-bold text-slate-400">✕</button>
        </div>
      )}

      {/* Ward & Status Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-semibold flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" />
            {currentLang === 'hi' ? 'वार्ड फ़िल्टर:' : 'Ward Filter:'}
          </span>
          <button
            type="button"
            onClick={() => setSelectedWard('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              selectedWard === 'ALL'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Wards ({beds.length})
          </button>
          {wards.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setSelectedWard(w)}
              className={`px-2.5 py-1 rounded font-medium transition ${
                selectedWard === w
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {w} ({beds.filter((b) => b.wardName === w).length})
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">{t.bedStatus.AVAILABLE}</option>
            <option value="OCCUPIED">{t.bedStatus.OCCUPIED}</option>
            <option value="MAINTENANCE">{t.bedStatus.MAINTENANCE}</option>
            <option value="QUARANTINED">{t.bedStatus.QUARANTINED}</option>
            <option value="CLEANING">{t.bedStatus.CLEANING}</option>
          </select>
        </div>
      </div>

      {/* Bed Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === 'OCCUPIED';
          return (
            <div
              key={bed.id}
              className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                isOccupied ? 'border-blue-300' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-black text-base text-slate-900 flex items-center">
                    <BedIcon className="w-4 h-4 mr-1.5 text-slate-500" />
                    {bed.bedNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusBadge(
                      bed.status
                    )}`}
                  >
                    {t.bedStatus[bed.status] || bed.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-700">{bed.wardName}</p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {bed.bedType} • {bed.id}
                </span>

                {/* Inpatient Information if Occupied */}
                {isOccupied && (
                  <div className="mt-3 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center text-blue-900 font-bold">
                      <User className="w-3 h-3 mr-1 text-blue-600" />
                      <span>{bed.currentPatientName || 'Admitted Inpatient'}</span>
                    </div>
                    <p className="font-mono text-blue-800 text-[11px]">
                      {bed.currentUhid}
                    </p>
                    {bed.assignedAt && (
                      <p className="text-[10px] text-slate-500 flex items-center">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        Admitted: {new Date(bed.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                )}

                {bed.notes && (
                  <p className="text-[11px] text-slate-500 italic mt-2 bg-slate-50 p-1.5 rounded">
                    "{bed.notes}"
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                {bed.status === 'AVAILABLE' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBedForAction(bed);
                      setActionType('ASSIGN');
                    }}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-xs transition"
                  >
                    + Assign Patient
                  </button>
                ) : isOccupied ? (
                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBedForAction(bed);
                        setActionType('DISCHARGE');
                      }}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold transition flex items-center justify-center"
                    >
                      <LogOut className="w-3 h-3 mr-1 text-slate-600" />
                      Discharge
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBedForAction(bed);
                        setActionType('TRANSFER');
                      }}
                      className="py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-bold transition flex items-center justify-center"
                    >
                      <ArrowRightLeft className="w-3 h-3 mr-1" />
                      Transfer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBedForAction(bed);
                      setActionType('STATUS');
                    }}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold transition flex items-center justify-center"
                  >
                    <Wrench className="w-3 h-3 mr-1 text-slate-500" />
                    Change Status
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Action Modal */}
      {actionType && activeBedForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'ASSIGN' && 'Assign Patient to Bed'}
                {actionType === 'DISCHARGE' && 'Discharge Patient from Bed'}
                {actionType === 'TRANSFER' && 'Transfer Inpatient to New Bed'}
                {actionType === 'STATUS' && 'Update Bed Operational Status'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActionType(null);
                  setActiveBedForAction(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteAction} className="mt-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500">Selected Bed:</span>
                <p className="font-bold text-slate-900 font-mono">
                  {activeBedForAction.wardName} — {activeBedForAction.bedNumber} ({activeBedForAction.bedType})
                </p>
              </div>

              {actionType === 'ASSIGN' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Select Patient to Admit *
                  </label>
                  <select
                    required
                    value={assignPatientId}
                    onChange={(e) => setAssignPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- Choose Registered Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.uhid}) — {p.village}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {actionType === 'DISCHARGE' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Clinical Discharge Summary / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={dischargeNotes}
                    onChange={(e) => setDischargeNotes(e.target.value)}
                    placeholder="e.g. Completed course of IV antibiotics; afebrile; fit for discharge"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    * Bed will be automatically moved to <strong>CLEANING</strong> status for infection control.
                  </p>
                </div>
              )}

              {actionType === 'TRANSFER' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Target Available Bed *
                    </label>
                    <select
                      required
                      value={targetTransferBedId}
                      onChange={(e) => setTargetTransferBedId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="">-- Choose Available Bed --</option>
                      {availableBedsForTransfer.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.wardName} — {b.bedNumber} ({b.bedType})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Transfer Clinical Justification
                    </label>
                    <input
                      type="text"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="e.g. Step-down to General Observation"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {actionType === 'STATUS' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      New Status *
                    </label>
                    <select
                      value={newBedStatus}
                      onChange={(e) => setNewBedStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="AVAILABLE">{t.bedStatus.AVAILABLE}</option>
                      <option value="CLEANING">{t.bedStatus.CLEANING}</option>
                      <option value="MAINTENANCE">{t.bedStatus.MAINTENANCE}</option>
                      <option value="QUARANTINED">{t.bedStatus.QUARANTINED}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Reason / Maintenance Details
                    </label>
                    <input
                      type="text"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="e.g. Oxygen flowmeter calibration"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionType(null);
                    setActiveBedForAction(null);
                  }}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
