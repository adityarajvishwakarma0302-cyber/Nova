import React from 'react';
import { 
  Building2, 
  UserCheck, 
  Languages, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Bed, 
  Pill, 
  Users, 
  Activity, 
  Stethoscope, 
  BrainCircuit, 
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { Facility, UserRole } from '../types/index.ts';
import { SupportedLanguage, translations } from '../i18n/index.ts';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  facilities: Facility[];
  selectedFacilityId: string;
  setSelectedFacilityId: (id: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentLang: SupportedLanguage;
  setCurrentLang: (lang: SupportedLanguage) => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  pendingSyncCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  facilities,
  selectedFacilityId,
  setSelectedFacilityId,
  currentRole,
  setCurrentRole,
  currentLang,
  setCurrentLang,
  isOfflineMode,
  setIsOfflineMode,
  pendingSyncCount,
}) => {
  const t = translations[currentLang];

  const tabs = [
    { id: 'district', label: t.navigation.districtOverview, icon: Activity },
    { id: 'patients', label: t.navigation.patientDesk, icon: Users },
    { id: 'beds', label: t.navigation.bedManagement, icon: Bed },
    { id: 'dispense', label: t.navigation.pharmacyDispensing, icon: Pill },
    { id: 'inventory', label: t.navigation.inventoryAudits, icon: ClipboardList },
    { id: 'attendance', label: t.navigation.staffAttendance, icon: Stethoscope },
    { id: 'ai', label: t.navigation.aiForecasting, icon: BrainCircuit },
    { id: 'verification', label: t.navigation.safetyVerification, icon: ShieldCheck },
  ];

  const roles: { role: UserRole; label: string }[] = [
    { role: 'DISTRICT_OFFICER', label: t.roles.DISTRICT_OFFICER },
    { role: 'FACILITY_ADMIN', label: t.roles.FACILITY_ADMIN },
    { role: 'DOCTOR', label: t.roles.DOCTOR },
    { role: 'PHARMACIST', label: t.roles.PHARMACIST },
    { role: 'NURSE', label: t.roles.NURSE },
    { role: 'REGISTRATION', label: t.roles.REGISTRATION },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      {/* Top Banner: District Authority & Control Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 border-b border-slate-800 gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-lg font-bold flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  {t.appName}
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded font-mono font-medium border border-emerald-500/30">
                  v2.6 ACID Core
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t.districtName} — {t.appTagline}
              </p>
            </div>
          </div>

          {/* Controls: Facility Selector, Role Switcher, Language & Sync */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Facility Selector */}
            <div className="flex items-center bg-slate-800 rounded-md px-2 py-1.5 border border-slate-700">
              <label htmlFor="facility-select" className="text-slate-400 mr-2 flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1" />
                {t.common.facility}:
              </label>
              <select
                id="facility-select"
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-800 text-white">
                  🏛️ {t.common.allFacilities}
                </option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-800 text-white">
                    {f.type === 'DH' ? '🏥' : f.type === 'CHC' ? '🏨' : '🏡'} {currentLang === 'hi' ? f.nameHi || f.name : f.name} ({f.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-800 rounded-md px-2 py-1.5 border border-slate-700">
              <label htmlFor="role-select" className="text-slate-400 mr-2 flex items-center">
                <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                {t.common.currentRole}:
              </label>
              <select
                id="role-select"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-transparent text-emerald-300 font-medium focus:outline-none cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r.role} value={r.role} className="bg-slate-800 text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setCurrentLang('en')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  currentLang === 'en'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang('hi')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  currentLang === 'hi'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Connectivity / Offline Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`flex items-center px-2.5 py-1.5 rounded-md border font-medium transition ${
                isOfflineMode
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}
              title={isOfflineMode ? 'Transactions queue locally with idempotency key replay protection' : 'Live server connection active'}
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 mr-1 text-amber-400 animate-pulse" />
                  <span>{t.common.offlineMode}</span>
                  {pendingSyncCount > 0 && (
                    <span className="ml-1.5 bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {pendingSyncCount}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  <span>{t.common.liveSync}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
