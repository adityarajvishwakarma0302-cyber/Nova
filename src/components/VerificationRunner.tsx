import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Play, 
  AlertTriangle, 
  Cpu, 
  RefreshCw,
  Terminal,
  FileCheck2,
  Lock,
  RotateCcw
} from 'lucide-react';
import { SupportedLanguage, translations } from '../i18n/index.ts';

interface VerificationRunnerProps {
  currentLang: SupportedLanguage;
  onRunLiveTests: () => Promise<any>;
  onRefreshAll: () => void;
}

export const VerificationRunner: React.FC<VerificationRunnerProps> = ({
  currentLang,
  onRunLiveTests,
  onRefreshAll,
}) => {
  const t = translations[currentLang];
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<string | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const handleRunSuite = async () => {
    setIsRunning(true);
    setSummaryStatus(null);
    const start = performance.now();
    try {
      const data = await onRunLiveTests();
      const end = performance.now();
      setExecutionTimeMs(Math.round(end - start));
      setTestResults(data.results || []);
      setSummaryStatus(data.summary || 'COMPLETED');
      onRefreshAll();
    } catch (err: any) {
      setSummaryStatus('ERROR: ' + (err.message || 'Test execution failed'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Section 14 & 15 Compliance Runner
              </span>
              <span className="text-xs text-slate-400">
                Live Transactional Verification
              </span>
            </div>
            <h1 className="text-xl font-black text-white mt-1">
              {t.verification.title}
            </h1>
            <p className="text-xs text-slate-300">
              {t.verification.subtitle}
            </p>
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleRunSuite}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-2 transition disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.verification.running}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{t.verification.runAllTests}</span>
              </>
            )}
          </button>
        </div>

        {summaryStatus && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-bold">
                Status: {summaryStatus}
              </span>
            </div>
            {executionTimeMs && (
              <span className="text-slate-400">
                Execution Time: {executionTimeMs} ms (ACID in-memory & WAL engine)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rules Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
          <FileCheck2 className="w-4 h-4 mr-2 text-indigo-600" />
          Mandatory Safety & Audit Rules (Automated Assertions)
        </h2>

        {testResults.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
            <Terminal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Click "Run Full Automated Test Suite" Above</p>
            <p className="text-[11px] mt-1 text-slate-400">
              Directly executes atomic database queries testing oversell rejection, duplicate key prevention, and quarantine isolation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {testResults.map((r, i) => (
              <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start space-x-3">
                  {r.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{r.rule}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{r.details}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded font-mono uppercase shrink-0 ${
                    r.passed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {r.passed ? t.verification.passed : t.verification.failed}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Demonstration Scenarios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-2">
          {t.verification.simulatedScenario}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Demonstrates real-world hospital edge cases handled safely by the transactional engine:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Scenario 1 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 block mb-1">
                Scenario 1: Oversell Rejection
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                When a staff member attempts to dispense 500 units from a batch with only 25 units available, the backend transaction strictly rolls back with `INSUFFICIENT_USABLE_STOCK` before any receipt is emitted.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-emerald-700 font-semibold text-[11px]">
              ✓ Verified in Rule 2
            </div>
          </div>

          {/* Scenario 2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 block mb-1">
                Scenario 2: Duplicate Receipt Retry
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                If network disruption causes a retry with the identical idempotency key, the server returns the existing confirmed receipt safely without deducting stock a second time.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-emerald-700 font-semibold text-[11px]">
              ✓ Verified in Rule 3
            </div>
          </div>

          {/* Scenario 3 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 block mb-1">
                Scenario 3: Protected Donor Buffer
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                When AI suggests an inter-facility redistribution from DH Central to PHC Rampur, the transfer quantity is mathematically capped to guarantee the donor stays above its safety reserve.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-emerald-700 font-semibold text-[11px]">
              ✓ Verified in Rule 10
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
