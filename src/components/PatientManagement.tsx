import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Calendar, 
  Activity, 
  Bed, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Patient, Visit, Facility, Bed as BedInterface } from '../types/index.ts';
import { SupportedLanguage, translations } from '../i18n/index.ts';

interface PatientManagementProps {
  patients: Patient[];
  visits: Visit[];
  facilities: Facility[];
  selectedFacilityId: string;
  beds: BedInterface[];
  currentLang: SupportedLanguage;
  onRegisterPatient: (patientData: any) => Promise<any>;
  onRecordVisit: (visitData: any) => Promise<any>;
  onAdmitPatient: (params: any) => Promise<any>;
  onRefresh: () => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({
  patients,
  visits,
  facilities,
  selectedFacilityId,
  beds,
  currentLang,
  onRegisterPatient,
  onRecordVisit,
  onAdmitPatient,
  onRefresh,
}) => {
  const t = translations[currentLang];
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // New Patient Form State
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: 'MALE',
    village: '',
    phone: '',
    bloodGroup: 'B+',
    allergies: '',
    emergencyContact: '',
  });

  // Visit Form State
  const [visitData, setVisitData] = useState({
    visitType: 'OPD',
    chiefComplaint: '',
    triageCategory: 'GREEN',
    doctorName: 'Dr. Anita Joshi, MO',
  });

  // Admission Form State
  const [selectedBedId, setSelectedBedId] = useState('');
  const [admissionNotes, setAdmissionNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const name = (p.fullName || (p as any).full_name || '').toLowerCase();
    const uhid = (p.uhid || '').toLowerCase();
    const village = (p.village || '').toLowerCase();
    const phone = p.phone || '';
    return (
      uhid.includes(term) ||
      name.includes(term) ||
      village.includes(term) ||
      phone.includes(term)
    );
  });

  const availableBeds = beds.filter((b) => b.status === 'AVAILABLE');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.age || !formData.village) {
      setFeedbackMessage({ type: 'error', text: 'Please fill all mandatory fields (Name, Age, Village).' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);
    try {
      const created = await onRegisterPatient(formData);
      setShowRegisterModal(false);
      setFormData({
        fullName: '',
        age: '',
        gender: 'MALE',
        village: '',
        phone: '',
        bloodGroup: 'B+',
        allergies: '',
        emergencyContact: '',
      });
      setFeedbackMessage({
        type: 'success',
        text: `Patient registered successfully with unique ID: ${created.uhid}`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Registration failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setIsSubmitting(true);
    try {
      await onRecordVisit({
        patientId: selectedPatient.id,
        uhid: selectedPatient.uhid,
        patientName: selectedPatient.fullName,
        facilityId: selectedFacilityId === 'ALL' ? 'FAC-PHC-06' : selectedFacilityId,
        visitType: visitData.visitType,
        chiefComplaint: visitData.chiefComplaint || 'Routine medical evaluation',
        triageCategory: visitData.triageCategory,
        doctorName: visitData.doctorName,
      });
      setShowVisitModal(false);
      setFeedbackMessage({
        type: 'success',
        text: `Outpatient visit recorded for ${selectedPatient.fullName} (${selectedPatient.uhid}) without inflating inpatient bed counts.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to record visit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedBedId) {
      setFeedbackMessage({ type: 'error', text: 'Please choose an available bed.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdmitPatient({
        facilityId: selectedFacilityId === 'ALL' ? 'FAC-PHC-06' : selectedFacilityId,
        bedId: selectedBedId,
        patientId: selectedPatient.id,
        uhid: selectedPatient.uhid,
        patientName: selectedPatient.fullName,
        admittedBy: 'Staff Nurse on Duty',
        notes: admissionNotes,
      });
      setShowAdmitModal(false);
      setSelectedBedId('');
      setAdmissionNotes('');
      setFeedbackMessage({
        type: 'success',
        text: `Patient ${selectedPatient.fullName} admitted to bed successfully. Occupancy updated.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Admission failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {currentLang === 'hi' ? 'गोपनीय रोगी डेटा' : 'Secure Patient Identifier (UHID)'}
            </span>
            <span className="text-xs text-slate-400">
              {currentLang === 'hi' ? 'न्यूनतम आवश्यक व्यक्तिगत जानकारी' : 'Privacy-Preserving Minimum Collection'}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            {t.navigation.patientDesk}
          </h1>
          <p className="text-xs text-slate-500">
            {currentLang === 'hi'
              ? 'ओपीडी (OPD) विजिट और आईपीडी (IPD) बेड भर्ती को स्पष्ट रूप से पृथक रखा गया है'
              : 'Outpatient visits and inpatient admissions tracked separately without skewing bed occupancy'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{currentLang === 'hi' ? 'नया मरीज़ पंजीकृत करें' : 'Register New Patient'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              {currentLang === 'hi' ? 'पंजीकृत मरीज़ सूची' : 'Registered Patient Directory'} ({filteredPatients.length})
            </h2>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.common.search}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">UHID</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'मरीज़ का नाम' : 'Patient Name'}</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'आयु / लिंग' : 'Age / Gender'}</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'ग्राम / संपर्क' : 'Village / Phone'}</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'रक्त समूह' : 'Blood Group'}</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'एलर्जी / चेतावनी' : 'Allergies'}</th>
                <th className="py-3 px-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                    {patient.uhid}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {patient.fullName || (patient as any).full_name}
                  </td>
                  <td className="py-3 px-4">
                    {patient.age} yrs • {patient.gender}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-slate-800">{patient.village}</p>
                    <span className="text-[11px] text-slate-400">{patient.phone}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                      {patient.bloodGroup || (patient as any).blood_group || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {patient.allergies ? (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                        ⚠️ {patient.allergies}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No known allergies</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowVisitModal(true);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-semibold text-xs transition"
                      >
                        + OPD Visit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowAdmitModal(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-semibold text-xs transition"
                      >
                        + Admit (IPD)
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {currentLang === 'hi' ? 'नया मरीज़ पंजीकरण (UHID उत्पत्ति)' : 'New Patient Registration (Generate UHID)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    {currentLang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {currentLang === 'hi' ? 'आयु (वर्ष) *' : 'Age (Years) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="125"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g. 35"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {currentLang === 'hi' ? 'लिंग *' : 'Gender *'}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {currentLang === 'hi' ? 'ग्राम / निवास स्थान *' : 'Village / Locality *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="e.g. Rampur Kalan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {currentLang === 'hi' ? 'मोबाइल नंबर' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91-9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {currentLang === 'hi' ? 'रक्त समूह' : 'Blood Group'}
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {currentLang === 'hi' ? 'दवा एलर्जी (यदि कोई हो)' : 'Known Drug Allergies'}
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Sulfa"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : t.common.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record OPD Visit Modal */}
      {showVisitModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {currentLang === 'hi' ? 'ओपीडी (OPD) विजिट दर्ज करें' : 'Record Outpatient (OPD) Visit'}
              </h3>
              <button
                type="button"
                onClick={() => setShowVisitModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900">{selectedPatient.fullName}</p>
                <p className="font-mono text-indigo-700 font-semibold">{selectedPatient.uhid}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {currentLang === 'hi' ? 'मुख्य शिकायत / लक्षण *' : 'Chief Complaint *'}
                </label>
                <input
                  type="text"
                  required
                  value={visitData.chiefComplaint}
                  onChange={(e) => setVisitData({ ...visitData, chiefComplaint: e.target.value })}
                  placeholder="e.g. Acute fever for 3 days, cough, headache"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {currentLang === 'hi' ? 'ट्राइएज प्राथमिकता' : 'Triage Priority'}
                  </label>
                  <select
                    value={visitData.triageCategory}
                    onChange={(e) => setVisitData({ ...visitData, triageCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="GREEN">{t.triage.GREEN}</option>
                    <option value="YELLOW">{t.triage.YELLOW}</option>
                    <option value="RED">{t.triage.RED}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {currentLang === 'hi' ? 'चिकित्सक' : 'Examining Physician'}
                  </label>
                  <input
                    type="text"
                    value={visitData.doctorName}
                    onChange={(e) => setVisitData({ ...visitData, doctorName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : 'Confirm OPD Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admit Patient Modal */}
      {showAdmitModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {currentLang === 'hi' ? 'आईपीडी (IPD) बेड पर भर्ती करें' : 'Admit Patient to Bed (Inpatient IPD)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAdmitModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmit} className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900">{selectedPatient.fullName}</p>
                <p className="font-mono text-indigo-700 font-semibold">{selectedPatient.uhid}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {currentLang === 'hi' ? 'उपलब्ध बेड चुनें *' : 'Select Available Bed *'}
                </label>
                {availableBeds.length === 0 ? (
                  <p className="text-rose-600 font-bold p-2 bg-rose-50 rounded border border-rose-200">
                    ⚠️ No available operational beds in this facility.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- Choose Bed --</option>
                    {availableBeds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.wardName} — {b.bedNumber} ({b.bedType})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {currentLang === 'hi' ? 'भर्ती का कारण / टिप्पणी' : 'Admission Diagnosis / Notes'}
                </label>
                <textarea
                  rows={2}
                  value={admissionNotes}
                  onChange={(e) => setAdmissionNotes(e.target.value)}
                  placeholder="e.g. Acute severe dehydrating gastroenteritis; IV hydration ordered"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedBedId}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : 'Execute Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
