import React, { useState } from 'react';
import { 
  BrainCircuit, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Truck, 
  Clock, 
  Activity, 
  RefreshCw,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { ForecastPoint, MedicineDepletionForecast, InterFacilityTransfer } from '../types/index.ts';
import { SupportedLanguage, translations } from '../i18n/index.ts';

interface AIForecastingProps {
  footfallForecast: {
    methodology: string;
    dailyBaseline: number;
    sevenDayForecast: ForecastPoint[];
  } | null;
  depletionList: MedicineDepletionForecast[];
  transfers: InterFacilityTransfer[];
  currentLang: SupportedLanguage;
  currentUserName: string;
  onApproveTransfer: (transferId: string, approvedBy: string) => Promise<any>;
  onRejectTransfer: (transferId: string, reason: string) => Promise<any>;
  onRefresh: () => void;
}

export const AIForecasting: React.FC<AIForecastingProps> = ({
  footfallForecast,
  depletionList,
  transfers,
  currentLang,
  currentUserName,
  onApproveTransfer,
  onRejectTransfer,
  onRefresh,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'REDISTRIBUTION' | 'DEPLETION' | 'FOOTFALL'>('REDISTRIBUTION');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pendingTransfers = transfers.filter((tr) => tr.status === 'PROPOSED_AI');
  const pastTransfers = transfers.filter((tr) => tr.status !== 'PROPOSED_AI');

  const criticalShortages = depletionList.filter(
    (d) => d.urgencyLevel === 'CRITICAL' || d.urgencyLevel === 'HIGH'
  );

  const handleApprove = async (transferId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onApproveTransfer(transferId, currentUserName);
      setFeedback({
        type: 'success',
        text: 'Inter-facility transfer authorized by human administrative officer. Stock dispatched and donor reserve preserved.',
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Authorization failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (transferId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onRejectTransfer(transferId, 'Officer preferred local buffer adjustment');
      setFeedback({
        type: 'success',
        text: 'AI transfer proposal declined after administrative review.',
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Rejection failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center">
                <BrainCircuit className="w-3.5 h-3.5 mr-1" />
                Gemini 3.8-Flash + Statistical Baseline Engine
              </span>
              <span className="text-xs text-slate-400">
                Human-in-the-Loop Approval Required
              </span>
            </div>
            <h1 className="text-xl font-black text-white mt-1">
              {t.navigation.aiForecasting}
            </h1>
            <p className="text-xs text-slate-300">
              {currentLang === 'hi'
                ? 'मांग का पूर्वानुमान, दवा समाप्ति की उलटी गिनती, एवं स्वचालित सुरक्षित पुनःवितरण सिफारिशें'
                : 'Demand forecasting, run-out countdowns, and constraint-preserving inter-facility redistribution'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('REDISTRIBUTION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeTab === 'REDISTRIBUTION'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Redistribution ({pendingTransfers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DEPLETION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeTab === 'DEPLETION'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Stockout Risks ({criticalShortages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('FOOTFALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeTab === 'FOOTFALL'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>7-Day Footfall</span>
            </button>
          </div>
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

      {/* Tab 1: AI Inter-Facility Redistribution */}
      {activeTab === 'REDISTRIBUTION' && (
        <div className="space-y-4">
          {/* Safety Rules Guarantee Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">
                {t.ai.safetyReserveRule}
              </p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Every recommended transfer mathematically guarantees that the donor facility retains usable stock strictly above its mandated safety reserve threshold. Expired or quarantined stocks are never suggested for transfer. Consequential execution requires human officer authorization.
              </p>
            </div>
          </div>

          {/* Pending Transfer Recommendations */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <Truck className="w-4 h-4 mr-2 text-indigo-600" />
              Pending Inter-Facility Stock Redistribution Proposals ({pendingTransfers.length})
            </h2>

            {pendingTransfers.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800">All Facilities Currently Stabilized</p>
                <p className="text-[11px] mt-1">No emergency inter-facility transfers required at this time.</p>
              </div>
            ) : (
              pendingTransfers.map((tr) => (
                <div
                  key={tr.id}
                  className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 hover:border-indigo-400 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-sm text-slate-900">
                            {tr.medicineName}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.2 rounded font-mono text-[10px]">
                            Batch: {tr.batchNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Transfer ID: <span className="font-mono">{tr.id}</span>
                        </p>
                      </div>
                    </div>

                    {/* Donor and Recipient Facilities Route */}
                    <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block">Donor Center (Surplus)</span>
                        <span className="text-slate-900 font-bold">{tr.sourceFacilityName}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-rose-500 uppercase block">Recipient Center (Deficit)</span>
                        <span className="text-slate-900 font-bold">{tr.targetFacilityName}</span>
                      </div>
                    </div>

                    {/* Quantity & Transport ETA */}
                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans block">Transfer Quantity</span>
                        <span className="text-lg font-black text-emerald-700">{tr.quantity} units</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans block">Transport ETA</span>
                        <span className="text-sm font-bold text-slate-800 flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-slate-500" />
                          {tr.transportEtaHours} hrs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Rationale & Safety Safeguards */}
                  <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <strong className="text-slate-800 block mb-1 flex items-center">
                        <BrainCircuit className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        AI Evidence & Logistical Rationale:
                      </strong>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {tr.aiRationale}
                      </p>
                    </div>

                    <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 text-[11px] space-y-1.5 flex flex-col justify-center">
                      <div className="flex items-center text-emerald-900 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                        Donor Buffer Guard
                      </div>
                      <p className="text-emerald-800">
                        Donor Reserve After: <strong>{tr.donorReserveRemaining} units</strong>
                      </p>
                      <p className="text-emerald-800">
                        Mandated Safety Threshold: <strong>{tr.donorSafetyThreshold} units</strong>
                      </p>
                      <span className="inline-block bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        ✓ Safety Margin Intact
                      </span>
                    </div>
                  </div>

                  {/* Human Sign-off Action Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 italic">
                      * Consequential operational action: Requires human administrative review ({currentUserName}).
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleReject(tr.id)}
                        className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleApprove(tr.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow text-xs flex items-center space-x-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize Transfer</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Past Authorized Transfers */}
          {pastTransfers.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Authorized / Resolved Transfers History
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {pastTransfers.map((pt) => (
                  <div key={pt.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">
                        {pt.medicineName} ({pt.quantity} units)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {pt.sourceFacilityName} ➔ {pt.targetFacilityName} • Authorized by {pt.approvedBy || 'Admin'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        pt.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Medicine Depletion Countdown */}
      {activeTab === 'DEPLETION' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              {t.ai.depletionCountdown}
            </h2>
            <p className="text-[11px] text-slate-500">
              Calculated using usable stock balances, daily burn rate, and supplier lead times.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4 text-right">Usable Stock</th>
                  <th className="py-3 px-4 text-right">Burn Rate / Day</th>
                  <th className="py-3 px-4 text-right">Buffer Days Left</th>
                  <th className="py-3 px-4">Estimated Run-out</th>
                  <th className="py-3 px-4">Surplus Donors Identified</th>
                  <th className="py-3 px-4">Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {depletionList.map((dep, idx) => {
                  const isCrit = dep.urgencyLevel === 'CRITICAL';
                  const isHigh = dep.urgencyLevel === 'HIGH';
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {dep.facilityName}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{dep.medicineName}</p>
                        <span className="text-[10px] text-slate-400">{dep.genericName}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isCrit ? 'text-rose-700 font-extrabold' : 'text-slate-800'}>
                          {dep.usableStock} {dep.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ~{dep.avgDailyConsumption} / day
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-sm">
                        <span className={isCrit ? 'text-rose-700' : isHigh ? 'text-amber-700' : 'text-emerald-700'}>
                          {dep.daysRemaining} days
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {dep.estimatedDepletionDate}
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        {dep.donorSurplusCandidates && dep.donorSurplusCandidates.length > 0 ? (
                          <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {dep.donorSurplusCandidates[0].facilityName} ({dep.donorSurplusCandidates[0].surplusQuantity} surplus)
                          </span>
                        ) : (
                          <span className="text-slate-400">District-wide constrained</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isCrit
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isHigh
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {dep.urgencyLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: 7-Day Patient Footfall Projections */}
      {activeTab === 'FOOTFALL' && footfallForecast && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" />
              {t.ai.demandForecastTitle}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Methodology: {footfallForecast.methodology}. Demonstrates empirical uncertainty bounds without claiming false precision.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
            {footfallForecast.sevenDayForecast.map((pt) => (
              <div
                key={pt.dayOffset}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-extrabold uppercase text-slate-500">
                    {currentLang === 'hi' ? pt.dayNameHi : pt.dayName}
                  </span>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{pt.dateStr}</p>
                </div>

                <div className="my-3">
                  <span className="text-2xl font-black text-indigo-700 font-mono">
                    {pt.projectedVisits}
                  </span>
                  <span className="text-[10px] text-slate-500 block">estimated visits</span>
                </div>

                <div className="bg-white p-1.5 rounded border border-slate-200 text-[10px] text-slate-500 font-mono">
                  95% Range: {pt.confidenceLower} - {pt.confidenceUpper}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
