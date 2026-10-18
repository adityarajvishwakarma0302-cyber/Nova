import React, { useState } from 'react';
import { 
  Stethoscope, 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  UserCheck, 
  Wrench, 
  ShieldAlert,
  Calendar,
  Activity
} from 'lucide-react';
import { DoctorAttendance, DiagnosticTest } from '../types/index.ts';
import { SupportedLanguage, translations } from '../i18n/index.ts';

interface AttendanceAndDiagnosticsProps {
  attendanceRecords: DoctorAttendance[];
  diagnosticTests: DiagnosticTest[];
  facilityName: string;
  facilityId: string;
  currentLang: SupportedLanguage;
  currentUserName: string;
  onVerifyAttendance: (payload: any) => Promise<any>;
  onUpdateDiagnostic: (payload: any) => Promise<any>;
  onRefresh: () => void;
}

export const AttendanceAndDiagnostics: React.FC<AttendanceAndDiagnosticsProps> = ({
  attendanceRecords,
  diagnosticTests,
  facilityName,
  facilityId,
  currentLang,
  currentUserName,
  onVerifyAttendance,
  onUpdateDiagnostic,
  onRefresh,
}) => {
  const t = translations[currentLang];
  const [activeSubTab, setActiveSubTab] = useState<'ATTENDANCE' | 'DIAGNOSTICS'>('ATTENDANCE');

  // Verify modal state
  const [selectedRecord, setSelectedRecord] = useState<DoctorAttendance | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'CONFIRMED_PRESENT' | 'CONFIRMED_ABSENT' | 'UNCONFIRMED'>('CONFIRMED_PRESENT');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [checkInTime, setCheckInTime] = useState('09:00 AM');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onVerifyAttendance({
        id: selectedRecord.id,
        status: verifyStatus,
        checkInTime: verifyStatus === 'CONFIRMED_PRESENT' ? checkInTime : null,
        verifiedBy: currentUserName,
        notes: verifyNotes,
      });

      setSelectedRecord(null);
      setFeedback({
        type: 'success',
        text: `Doctor attendance verification updated for ${selectedRecord.doctorName}.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Verification failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED_PRESENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CONFIRMED_ABSENT':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'UNCONFIRMED':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SCHEDULED':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Verified Operational Surveillance
            </span>
            <span className="text-xs text-slate-400">
              {facilityName}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            {currentLang === 'hi' ? 'चिकित्सक उपस्थिति एवं जांच केंद्र' : 'Doctor Attendance & Diagnostic Availability'}
          </h1>
          <p className="text-xs text-slate-500">
            {currentLang === 'hi'
              ? 'नियम 6 लागू: रिकॉर्ड अनुपस्थित होने पर डॉक्टर को सीधे अनुपस्थित नहीं माना जाता'
              : 'Rule 6 Enforced: Never infer a doctor is absent solely because a telemetry record is missing'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('ATTENDANCE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeSubTab === 'ATTENDANCE'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{currentLang === 'hi' ? 'चिकित्सक उपस्थिति' : 'Staff Attendance'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('DIAGNOSTICS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeSubTab === 'DIAGNOSTICS'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{currentLang === 'hi' ? 'जांच एवं रीएजेंट' : 'Diagnostics & Reagents'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="font-bold text-slate-400">✕</button>
        </div>
      )}

      {/* Sub-tab 1: Doctor Attendance */}
      {activeSubTab === 'ATTENDANCE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {currentLang === 'hi' ? 'चिकित्सा अधिकारी उपस्थिति रोस्टर' : 'Medical Officer Shift Attendance Log'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Distinguishes confirmed present, confirmed absent (with documented leave), and unconfirmed (awaiting check-in).
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
              Today: {new Date().toLocaleDateString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'चिकित्सक का नाम' : 'Doctor Name'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'विशेषज्ञता' : 'Specialty'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'पाली' : 'Shift'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'सत्यापित स्थिति' : 'Verified Attendance Status'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'आगमन / प्रस्थान' : 'Check-In / Out'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'सत्यापनकर्ता / टिप्पणी' : 'Verifier & Remarks'}</th>
                  <th className="py-3 px-4 text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{record.doctorName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(record as any).facility_name || facilityName}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {record.specialty}
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {record.shift}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getAttendanceBadge(record.status)}`}>
                        {t.attendance[record.status] || record.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {record.checkInTime ? `${record.checkInTime}` : '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {record.verifiedBy ? (
                        <p>
                          <strong className="text-slate-800">{record.verifiedBy}:</strong> {record.notes || 'Verified on shift'}
                        </p>
                      ) : (
                        <span className="text-slate-400 italic">Unverified (Pending confirmation)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRecord(record);
                          setVerifyStatus(record.status === 'SCHEDULED' ? 'CONFIRMED_PRESENT' : (record.status as any));
                          setVerifyNotes(record.notes || '');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs transition"
                      >
                        Verify / Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Diagnostic Tests */}
      {activeSubTab === 'DIAGNOSTICS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {currentLang === 'hi' ? 'जांच सेवाएं, रीएजेंट उपलब्धता एवं उपकरण स्थिति' : 'Diagnostic Services, Reagent Reserves & Equipment Status'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Forecasts reagent buffer exhaustion and distinguishes confirmed outages from network latency.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'जांच का नाम' : 'Diagnostic Test'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'श्रेणी' : 'Category'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'उपकरण स्थिति' : 'Equipment Status'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'hi' ? 'रीएजेंट स्टॉक' : 'Reagent Stock'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'hi' ? 'संभावित जांच' : 'Tests Capacity'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'सेवा उपलब्धता' : 'Service Status'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'डाउनटाइम कारण / टिप्पणी' : 'Downtime Reason'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {diagnosticTests.map((diag) => {
                  const isOut = diag.status === 'UNAVAILABLE';
                  const isLow = diag.status === 'LOW_REAGENT';
                  return (
                    <tr key={diag.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{diag.testName}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{(diag as any).facility_name || facilityName}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {diag.category}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            diag.equipmentStatus === 'OPERATIONAL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : diag.equipmentStatus === 'DEGRADED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {diag.equipmentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {diag.totalReagentsAvailable} units
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={diag.testsPossibleWithStock <= 15 ? 'text-rose-700' : 'text-slate-800'}>
                          {diag.testsPossibleWithStock} tests
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isOut
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {diag.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {diag.downtimeReason ? (
                          <span className="text-rose-700 font-medium">⚠️ {diag.downtimeReason}</span>
                        ) : (
                          <span className="text-slate-400">Normal operating parameters</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verify Doctor Attendance Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Verify Shift Attendance: {selectedRecord.doctorName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-bold text-slate-900">{selectedRecord.doctorName}</p>
                <p className="text-slate-600">{selectedRecord.specialty} • Shift: {selectedRecord.shift}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Attendance Verification Status *
                </label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none"
                >
                  <option value="CONFIRMED_PRESENT">{t.attendance.CONFIRMED_PRESENT}</option>
                  <option value="CONFIRMED_ABSENT">{t.attendance.CONFIRMED_ABSENT}</option>
                  <option value="UNCONFIRMED">{t.attendance.UNCONFIRMED}</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  * Note: Only choose Confirmed Absent if verified by signed administrative leave record.
                </p>
              </div>

              {verifyStatus === 'CONFIRMED_PRESENT' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Check-In Timestamp
                  </label>
                  <input
                    type="text"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Administrative Remarks / Leave Document #
                </label>
                <input
                  type="text"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="e.g. Attending inpatient rounds in ICU / Casual Leave Order #312"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : 'Save Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
