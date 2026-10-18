import React, { useState } from 'react';
import { 
  Building2, 
  Bed, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Search, 
  ShieldAlert, 
  BrainCircuit, 
  Stethoscope, 
  Pill, 
  Activity,
  Phone,
  RefreshCw
} from 'lucide-react';
import { Facility, FacilityAlert, DistrictSummary } from '../types/index.ts';
import { SupportedLanguage, translations } from '../i18n/index.ts';

interface DistrictDashboardProps {
  summary: DistrictSummary | null;
  facilities: Facility[];
  alerts: FacilityAlert[];
  onSelectFacility: (facilityId: string) => void;
  onNavigateTab: (tabId: string) => void;
  currentLang: SupportedLanguage;
  aiBrief: any;
  onRefresh: () => void;
}

export const DistrictDashboard: React.FC<DistrictDashboardProps> = ({
  summary,
  facilities,
  alerts,
  onSelectFacility,
  onNavigateTab,
  currentLang,
  aiBrief,
  onRefresh,
}) => {
  const t = translations[currentLang];
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredFacilities = facilities.filter((f) => {
    const matchesSearch = 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.nameHi && f.nameHi.includes(searchTerm)) ||
      f.block.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || f.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const openAlerts = alerts.filter((a) => a.status === 'OPEN');

  return (
    <div className="space-y-6">
      {/* Top Banner: District Overview & AI Intelligence Brief */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/30 flex items-center">
                <BrainCircuit className="w-3.5 h-3.5 mr-1" />
                {currentLang === 'hi' ? 'जिला एकीकृत स्वास्थ्य नियंत्रण कक्ष' : 'District Integrated Command & Control'}
              </span>
              <span className="text-xs text-slate-400">
                10 {currentLang === 'hi' ? 'स्वास्थ्य केंद्र जुड़े हुए' : 'Facilities Connected'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              {currentLang === 'hi' ? 'देवभूमि जिला स्वास्थ्य आसूचना डैशबोर्ड' : 'Devbhoomi District Health Intelligence Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{currentLang === 'hi' ? 'ताज़ा करें' : 'Refresh Telemetry'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('ai')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>{currentLang === 'hi' ? 'एआई मांग व पुनःवितरण' : 'AI Redistribution'}</span>
            </button>
          </div>
        </div>

        {/* AI Clinical & Epidemiological Brief */}
        {aiBrief && (
          <div className="mt-4 bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3.5 text-xs">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold mb-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{aiBrief.summaryHeadline}</span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {aiBrief.model}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {aiBrief.clinicalContext}
            </p>
            {aiBrief.actionableDirectives && aiBrief.actionableDirectives.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-indigo-900/50 flex flex-wrap gap-2">
                {aiBrief.actionableDirectives.map((dir: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center bg-slate-900/80 text-emerald-300 px-2.5 py-1 rounded border border-emerald-500/20 text-[11px]"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1" />
                    {dir}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Operational Beds */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t.common.availableBeds}</span>
            <Bed className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">
              {summary?.availableBeds ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              / {summary?.totalBeds ?? 0} {currentLang === 'hi' ? 'कुल' : 'Total'}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{
                width: `${summary?.totalBeds ? Math.round((summary.availableBeds / summary.totalBeds) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Occupied Inpatient Beds */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t.common.occupiedBeds}</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">
              {summary?.occupiedBeds ?? 0}
            </span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              {summary?.occupancyRatePct ?? 0}% {currentLang === 'hi' ? 'दर' : 'Rate'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary?.unavailableBeds ?? 0} {currentLang === 'hi' ? 'बेड रखरखाव/सफाई में' : 'in maintenance/clean'}
          </p>
        </div>

        {/* OPD Footfall Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t.common.totalVisits}</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-black text-indigo-700">
              {summary?.totalOpdToday ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {currentLang === 'hi' ? 'ओपीडी (OPD) विजिट केवल' : 'Outpatient visits only'}
          </p>
        </div>

        {/* Active Inpatient Admissions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{t.common.activeAdmissions}</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-black text-purple-700">
              {summary?.activeAdmissions ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary?.dischargesToday ?? 0} {t.common.dailyDischarges}
          </p>
        </div>

        {/* Doctor Shifts Verified */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{currentLang === 'hi' ? 'ड्यूटी पर चिकित्सक' : 'Doctors on Duty'}</span>
            <Stethoscope className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-teal-700">
              {summary?.totalDoctorsOnDuty ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              / {summary?.totalDoctorsScheduled ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {currentLang === 'hi' ? 'सत्यापित उपस्थिति' : 'Verified attendance'}
          </p>
        </div>

        {/* Active Critical Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{currentLang === 'hi' ? 'सक्रिय अलर्ट' : 'Active Alerts'}</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700">
              {summary?.activeAlertsCount ?? 0}
            </span>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              {summary?.activeStockoutRisks ?? 0} {currentLang === 'hi' ? 'स्टॉक संकट' : 'Stockouts'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {currentLang === 'hi' ? 'कार्रवाई आवश्यक' : 'Intervention required'}
          </p>
        </div>
      </div>

      {/* Flagged & Under-Resourced Facilities Section */}
      {openAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-xs overflow-hidden">
          <div className="bg-rose-50/70 px-5 py-3.5 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-sm font-bold text-rose-900">
                {currentLang === 'hi' 
                  ? 'कार्रवाई हेतु चिह्नित स्वास्थ्य केंद्र (साक्ष्य एवं सुधारात्मक निर्देश)' 
                  : 'Operational Alerts & Under-Resourced Facilities (Evidence-Grounded Directives)'}
              </h2>
            </div>
            <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              {openAlerts.length} {currentLang === 'hi' ? 'खुले अलर्ट' : 'Open Alerts'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 p-2 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {openAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between hover:border-rose-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {alert.facilityName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-800 leading-snug">
                    {alert.title}
                  </h3>

                  <div className="mt-2 text-[11px] text-slate-600 space-y-1">
                    <p>
                      <strong className="text-slate-700">{currentLang === 'hi' ? 'साक्ष्य / विवरण:' : 'Evidence:'}</strong>{' '}
                      {alert.description}
                    </p>
                    <p className="bg-emerald-50 text-emerald-900 p-1.5 rounded border border-emerald-200/60 font-medium">
                      <strong className="text-emerald-950">{currentLang === 'hi' ? 'सुझावित कार्रवाई:' : 'Suggested Action:'}</strong>{' '}
                      {alert.suggestedAction}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    <strong>{currentLang === 'hi' ? 'प्रभारी अधिकारी:' : 'Officer:'}</strong> {alert.responsibleOfficer}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFacility(alert.facilityId);
                      if (alert.alertType === 'STOCKOUT_RISK') onNavigateTab('ai');
                      else if (alert.alertType === 'DIAGNOSTIC_DOWN') onNavigateTab('attendance');
                      else onNavigateTab('beds');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    {currentLang === 'hi' ? 'समीक्षा करें' : 'Investigate'}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facilities Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {currentLang === 'hi' ? 'जिला स्वास्थ्य केंद्र नेटवर्क' : 'District Healthcare Facilities Network'}
            </h2>
            <p className="text-xs text-slate-500">
              {currentLang === 'hi' 
                ? 'नियमित डेटा प्रविष्टि केवल एक बार की जाती है; गणनाएं स्वतः अद्यतन होती हैं' 
                : 'Enter routine data once; metrics calculate dynamically across the district'}
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.common.search}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="ALL">{currentLang === 'hi' ? 'समस्त प्रकार (All)' : 'All Facility Types'}</option>
              <option value="DH">{t.facilityTypes.DH}</option>
              <option value="SDH">{t.facilityTypes.SDH}</option>
              <option value="CHC">{t.facilityTypes.CHC}</option>
              <option value="PHC">{t.facilityTypes.PHC}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'केंद्र एवं प्रकार' : 'Facility & Type'}</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'प्रखंड (Block)' : 'Block / Distance'}</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'बेड अधिभोग स्थिति (Occupancy)' : 'Bed Breakdown (Occupancy)'}</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'उपलब्ध बेड' : 'Available Beds'}</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'टेलीमेट्री स्थिति' : 'Sync Status'}</th>
                <th className="py-3 px-4">{currentLang === 'hi' ? 'सक्रिय अलर्ट' : 'Alerts'}</th>
                <th className="py-3 px-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredFacilities.map((f: any) => {
                const total = f.operationalBeds || f.total_beds;
                const occ = f.occupiedBeds || 0;
                const avail = f.availableBeds || (total - occ);
                const unavail = f.unavailableBeds || 0;
                const occPct = total > 0 ? Math.round((occ / total) * 100) : 0;

                return (
                  <tr key={f.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">
                          {f.type === 'DH' ? '🏥' : f.type === 'CHC' ? '🏨' : '🏡'}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">
                            {currentLang === 'hi' ? f.name_hi || f.name : f.name}
                          </p>
                          <span className="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium">
                            {f.type} • {f.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-800">{f.block}</p>
                      <span className="text-[11px] text-slate-400">
                        {f.distance_km === 0 ? 'District H.Q.' : `${f.distance_km} km`}
                      </span>
                    </td>

                    {/* Mutually Exclusive Bed Breakdown */}
                    <td className="py-3 px-4 w-48">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-700">
                          {occ} {currentLang === 'hi' ? 'भर्ती' : 'Occupied'} ({occPct}%)
                        </span>
                        <span className="text-slate-400">
                          {total} {currentLang === 'hi' ? 'कुल' : 'Total'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 flex overflow-hidden">
                        <div
                          className="bg-blue-600 h-2"
                          style={{ width: `${(occ / total) * 100}%` }}
                          title={`Occupied: ${occ}`}
                        />
                        <div
                          className="bg-amber-400 h-2"
                          style={{ width: `${(unavail / total) * 100}%` }}
                          title={`Maintenance/Clean: ${unavail}`}
                        />
                        <div
                          className="bg-emerald-500 h-2"
                          style={{ width: `${(avail / total) * 100}%` }}
                          title={`Available: ${avail}`}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                        {avail}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {f.isStale ? (
                        <div className="flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200" title="Telemetry delayed due to network conditions. Not underperforming.">
                          <Clock className="w-3 h-3 mr-1 text-amber-600" />
                          <span>{currentLang === 'hi' ? 'विलंबित सिंक (सत्यापन प्रतीक्षित)' : 'Sync Stale (Awaiting Check-in)'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          <span>{currentLang === 'hi' ? 'लाइव कनेक्टेड' : 'Live Synchronized'}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {f.activeAlerts > 0 ? (
                        <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {f.activeAlerts}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">
                          {currentLang === 'hi' ? 'कोई संकट नहीं' : 'Nominal'}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectFacility(f.id);
                          onNavigateTab('beds');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs transition"
                      >
                        {currentLang === 'hi' ? 'प्रबंधन खोलें' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
