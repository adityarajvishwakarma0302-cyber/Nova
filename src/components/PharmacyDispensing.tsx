import React, { useState } from 'react';
import { 
  Pill, 
  Receipt as ReceiptIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  FileEdit, 
  ShieldAlert, 
  Search, 
  QrCode, 
  Plus, 
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';
import { Medicine, Batch, Patient, Receipt } from '../types/index.ts';
import { SupportedLanguage, translations } from '../i18n/index.ts';

interface PharmacyDispensingProps {
  medicines: Medicine[];
  batches: Batch[];
  patients: Patient[];
  facilityId: string;
  facilityName: string;
  currentLang: SupportedLanguage;
  currentUserName: string;
  currentUserId: string;
  onDispense: (payload: any) => Promise<any>;
  onCorrectReceipt: (receiptId: string, payload: any) => Promise<any>;
  onProcessReturn: (payload: any) => Promise<any>;
  onReportIncident: (payload: any) => Promise<any>;
  onRefresh: () => void;
}

export const PharmacyDispensing: React.FC<PharmacyDispensingProps> = ({
  medicines,
  batches,
  patients,
  facilityId,
  facilityName,
  currentLang,
  currentUserName,
  currentUserId,
  onDispense,
  onCorrectReceipt,
  onProcessReturn,
  onReportIncident,
  onRefresh,
}) => {
  const t = translations[currentLang];

  // Dispensing Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [dispenseItems, setDispenseItems] = useState<
    { medicineId: string; batchId: string; quantity: number; dosageInstructions: string }[]
  >([
    { medicineId: '', batchId: '', quantity: 10, dosageInstructions: '1 tablet twice daily after food' },
  ]);

  // Idempotency Key
  const [currentIdempotencyKey, setCurrentIdempotencyKey] = useState(
    'IDEMP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
  );

  // Active Modals & View States
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Correction Form State
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState<'CORRECTED' | 'VOIDED'>('VOIDED');

  // Return Form State
  const [returnCondition, setReturnCondition] = useState<'SEALED_INTACT' | 'UNSEALED' | 'EXPIRED' | 'DAMAGED'>('SEALED_INTACT');
  const [returnDisposition, setReturnDisposition] = useState<'RESTOCKED' | 'QUARANTINED' | 'DESTROYED'>('RESTOCKED');
  const [returnQuantity, setReturnQuantity] = useState(5);
  const [returnReason, setReturnReason] = useState('');

  // Clinical Incident State
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected Patient
  const activePatient = patients.find((p) => p.id === selectedPatientId);

  // Available batches for this facility (valid & unexpired)
  const validBatches = batches.filter((b) => !b.isExpired && !b.isRecalled);

  const handleAddItem = () => {
    setDispenseItems([
      ...dispenseItems,
      { medicineId: '', batchId: '', quantity: 10, dosageInstructions: 'Take as directed' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setDispenseItems(dispenseItems.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, medicineId: string) => {
    // FEFO: Auto-select earliest expiring batch for this medicine
    const matchingBatches = validBatches
      .filter((b) => b.medicineId === medicineId && b.quantityUsable > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    const updated = [...dispenseItems];
    updated[index].medicineId = medicineId;
    updated[index].batchId = matchingBatches[0]?.id || '';
    setDispenseItems(updated);
  };

  const handleBatchChange = (index: number, batchId: string) => {
    const updated = [...dispenseItems];
    updated[index].batchId = batchId;
    setDispenseItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...dispenseItems];
    updated[index].quantity = quantity;
    setDispenseItems(updated);
  };

  const handleDosageChange = (index: number, dosage: string) => {
    const updated = [...dispenseItems];
    updated[index].dosageInstructions = dosage;
    setDispenseItems(updated);
  };

  // Atomic Dispense Transaction
  const handleDispenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) {
      setErrorMessage('Please select a registered patient with valid UHID.');
      return;
    }

    if (dispenseItems.length === 0 || !dispenseItems[0].batchId) {
      setErrorMessage('Please add at least one medicine item with a valid batch.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const selectedBatch = batches.find((b) => b.id === dispenseItems[0]?.batchId);
      const targetFacilityId = selectedBatch?.facilityId || (facilityId === 'ALL' ? 'FAC-PHC-06' : facilityId);

      const result = await onDispense({
        idempotencyKey: currentIdempotencyKey,
        facilityId: targetFacilityId,
        patientId: activePatient.id,
        uhid: activePatient.uhid,
        patientName: activePatient.fullName || (activePatient as any).full_name || 'Patient',
        dispensedByUserId: currentUserId,
        dispensedByUserName: currentUserName,
        items: dispenseItems.map((item) => ({
          medicineId: item.medicineId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: 0, // Government Free Drug Supply
          dosageInstructions: item.dosageInstructions,
        })),
      });

      setGeneratedReceipt(result.receipt);
      if (result.isDuplicateReplay) {
        setSuccessMessage('Idempotency Replay: Duplicate submission prevented from deducting stock twice.');
      } else {
        setSuccessMessage('Atomic transaction committed: Receipt generated and batch stock deducted simultaneously.');
      }

      // Generate next new idempotency key for subsequent prescriptions
      setCurrentIdempotencyKey('IDEMP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Dispensing transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test oversell scenario
  const handleTriggerOversellAttempt = () => {
    const targetBatch = batches.find((b) => (b.quantityUsable || (b as any).quantity_usable) > 0) || batches[0];
    if (targetBatch) {
      const patient = patients[0];
      if (patient) {
        const medId = targetBatch.medicineId || (targetBatch as any).medicine_id || 'MED-01';
        const bId = targetBatch.id;
        const usable = targetBatch.quantityUsable ?? (targetBatch as any).quantity_usable ?? 25;
        setSelectedPatientId(patient.id);
        setDispenseItems([
          {
            medicineId: medId,
            batchId: bId,
            quantity: usable + 500, // Intentionally excessive
            dosageInstructions: 'Oversell stress test attempt',
          },
        ]);
        setErrorMessage(
          `Configured test: Dispensing ${usable + 500} units against usable batch stock of ${usable}. Click "Generate Atomic Receipt & Deduct Stock" to verify database rejection.`
        );
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Correct Receipt Handler
  const handleExecuteCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedReceipt) return;

    setIsSubmitting(true);
    try {
      await onCorrectReceipt(generatedReceipt.id, {
        correctionReason,
        correctedByUserId: currentUserId,
        correctedByUserName: currentUserName,
        newStatus: correctionStatus,
        adjustStock: true,
      });

      setShowCorrectionModal(false);
      setSuccessMessage('Receipt correction finalized with immutable audit log and compensating stock transaction.');
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Correction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return Medicine Handler
  const handleExecuteReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedReceipt || !generatedReceipt.items[0]) return;

    setIsSubmitting(true);
    try {
      const firstItem = generatedReceipt.items[0];
      await onProcessReturn({
        receiptId: generatedReceipt.id,
        receiptNumber: generatedReceipt.receiptNumber,
        patientId: generatedReceipt.patientId,
        uhid: generatedReceipt.uhid,
        patientName: generatedReceipt.patientName,
        medicineId: firstItem.medicineId,
        medicineName: firstItem.medicineName,
        batchId: firstItem.batchId,
        batchNumber: firstItem.batchNumber,
        quantityReturned: returnQuantity,
        condition: returnCondition,
        disposition: returnDisposition,
        inspectedByUserId: currentUserId,
        inspectedByUserName: currentUserName,
        reason: returnReason || 'Patient returned surplus/unused medication',
      });

      setShowReturnModal(false);
      setSuccessMessage(`Patient return processed. Disposition: ${returnDisposition}.`);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Return processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Report Incident Handler
  const handleExecuteIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedReceipt) return;

    setIsSubmitting(true);
    try {
      const firstItem = generatedReceipt.items[0];
      await onReportIncident({
        receiptId: generatedReceipt.id,
        medicineId: firstItem?.medicineId || 'MED-01',
        patientId: generatedReceipt.patientId,
        uhid: generatedReceipt.uhid,
        severity: incidentSeverity,
        description: incidentDescription,
        reportedBy: currentUserName,
      });

      setShowIncidentModal(false);
      setSuccessMessage('Clinical incident recorded for formal medical board review. Audit trail preserved.');
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Incident logging failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Verification Shortcuts */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              ACID Transaction Enforced
            </span>
            <span className="text-xs text-slate-400">
              {facilityName} • FEFO (First-Expired, First-Out)
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            {t.navigation.pharmacyDispensing}
          </h1>
          <p className="text-xs text-slate-500">
            {currentLang === 'hi'
              ? 'रसीद निर्माण एवं स्टॉक कटौती एक ही परमाणु डेटाबेस लेनदेन में निष्पादित होते हैं'
              : 'Receipt creation and stock deduction commit atomically in one database transaction'}
          </p>
        </div>

        {/* Quick Safety Demonstration Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerOversellAttempt}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Test Oversell Rejection
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="font-bold text-slate-400">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="font-bold text-slate-400">✕</button>
        </div>
      )}

      {/* Grid: Dispensing Form & Live Batch Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dispensing Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
            <Pill className="w-4 h-4 mr-2 text-emerald-600" />
            {t.pharmacy.dispenseMedicine}
          </h2>

          <form onSubmit={handleDispenseSubmit} className="space-y-4 text-xs">
            {/* Patient Selector */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {t.pharmacy.selectPatient} *
              </label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
              >
                <option value="">-- Choose Patient by UHID / Name --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.uhid} — {p.fullName} ({p.village}, {p.age}y/{p.gender}) {p.allergies ? `⚠️ Allergy: ${p.allergies}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Medicine Items List */}
            <div className="space-y-3">
              <label className="block text-slate-700 font-semibold">
                Prescription Items & FEFO Batches *
              </label>

              {dispenseItems.map((item, index) => {
                const availableBatchesForMed = validBatches.filter(
                  (b) => b.medicineId === item.medicineId
                );
                const currentBatch = batches.find((b) => b.id === item.batchId);

                return (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Medicine Selector */}
                      <div className="sm:col-span-1">
                        <label className="block text-slate-500 text-[11px] font-medium mb-1">Medicine</label>
                        <select
                          required
                          value={item.medicineId}
                          onChange={(e) => handleMedicineChange(index, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-medium focus:outline-none"
                        >
                          <option value="">-- Select Drug --</option>
                          {medicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.form})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Batch Selector (FEFO) */}
                      <div className="sm:col-span-1">
                        <label className="block text-slate-500 text-[11px] font-medium mb-1">
                          Active Batch (FEFO Usable)
                        </label>
                        <select
                          required
                          value={item.batchId}
                          onChange={(e) => handleBatchChange(index, e.target.value)}
                          disabled={!item.medicineId}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-medium focus:outline-none font-mono"
                        >
                          <option value="">-- Choose Batch --</option>
                          {availableBatchesForMed.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.batchNumber} (Stock: {b.quantityUsable}, Exp: {b.expiryDate})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="sm:col-span-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-500 text-[11px] font-medium">Quantity</label>
                          {currentBatch && (
                            <span className="text-[10px] text-emerald-700 font-bold font-mono">
                              Max: {currentBatch.quantityUsable}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          required
                          min="1"
                          max={currentBatch?.quantityUsable || 9999}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-bold font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Dosage Instructions */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item.dosageInstructions}
                        onChange={(e) => handleDosageChange(index, e.target.value)}
                        placeholder="Dosage instructions (e.g. 1 tab thrice daily after meals)"
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none text-[11px]"
                      />
                      {dispenseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs flex items-center transition"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Another Drug
              </button>
            </div>

            {/* Idempotency Key Notice */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Transaction Idempotency Key: {currentIdempotencyKey}</span>
              <span className="text-emerald-700 font-sans font-bold">✓ Duplicate-Proof</span>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow text-xs flex items-center space-x-2 disabled:opacity-50 transition"
              >
                <ReceiptIcon className="w-4 h-4" />
                <span>
                  {isSubmitting ? t.common.loading : t.pharmacy.generateReceipt}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Active Batch Balances & Expiry Monitor */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-indigo-600" />
            {currentLang === 'hi' ? 'सक्रिय बैच स्टॉक (FEFO)' : 'Live Batches & Expiry (FEFO)'}
          </h2>
          <p className="text-[11px] text-slate-500 mb-3">
            Only valid, unexpired stock is eligible for dispensing. Expired and quarantined batches are automatically isolated.
          </p>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {batches.map((b) => {
              const isLow = b.quantityUsable <= 50;
              const isExp = b.isExpired;
              return (
                <div
                  key={b.id}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                    isExp
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : isLow
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{b.medicineName || b.medicineId}</span>
                    <span className="font-mono text-[11px] bg-white px-1.5 py-0.2 rounded border">
                      {b.batchNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-1.5">
                    <span>
                      Usable: <strong>{b.quantityUsable}</strong> {b.unit || 'units'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Exp: {b.expiryDate}
                    </span>
                  </div>

                  {b.quantityQuarantined > 0 && (
                    <div className="mt-1 text-[10px] text-rose-700 font-semibold">
                      🔒 Quarantined: {b.quantityQuarantined} units (Excluded from dispensing)
                    </div>
                  )}

                  {isExp && (
                    <div className="mt-1 text-[10px] font-bold text-rose-700 uppercase">
                      ⛔ Expired Batch (Rule E Enforced)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generated Receipt Display & Print Modal */}
      {generatedReceipt && (
        <div className="bg-white rounded-xl border border-emerald-300 shadow-md p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Official Medical Dispensing Receipt Generated
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center transition"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                {t.common.printReceipt}
              </button>
              <button
                type="button"
                onClick={() => setShowCorrectionModal(true)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center transition"
              >
                <FileEdit className="w-3.5 h-3.5 mr-1" />
                Correct Receipt
              </button>
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold flex items-center transition"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Patient Return
              </button>
              <button
                type="button"
                onClick={() => setShowIncidentModal(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold flex items-center transition"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                Report Incident
              </button>
            </div>
          </div>

          {/* Printable Receipt Container */}
          <div id="printable-receipt" className="mt-4 p-6 bg-slate-50 border border-slate-200 rounded-lg text-xs max-w-2xl mx-auto shadow-inner">
            {/* Header */}
            <div className="text-center border-b pb-3 border-slate-300">
              <p className="text-[10px] tracking-wider font-extrabold uppercase text-slate-500">
                {t.receipt.govtBanner}
              </p>
              <h2 className="text-base font-black tracking-tight text-slate-900 mt-0.5">
                {facilityName}
              </h2>
              <p className="text-[11px] font-bold text-emerald-800">
                {t.receipt.title}
              </p>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 gap-2 my-3 text-[11px] border-b pb-3 border-slate-300">
              <div>
                <p>
                  <strong>{t.receipt.receiptNumber}:</strong> <span className="font-mono font-bold text-indigo-700">{generatedReceipt.receiptNumber}</span>
                </p>
                <p>
                  <strong>{t.receipt.uhid}:</strong> <span className="font-mono font-bold">{generatedReceipt.uhid}</span>
                </p>
                <p>
                  <strong>{t.receipt.patientName}:</strong> {generatedReceipt.patientName}
                </p>
              </div>
              <div className="text-right">
                <p>
                  <strong>Date & Time:</strong> {new Date(generatedReceipt.timestamp).toLocaleString()}
                </p>
                <p>
                  <strong>{t.receipt.dispensedBy}:</strong> {generatedReceipt.dispensedByUserName}
                </p>
                <p>
                  <strong>Status:</strong> <span className="uppercase font-bold text-emerald-700">{generatedReceipt.status}</span>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs my-2 border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] uppercase text-slate-600 font-bold">
                  <th className="py-1.5">{t.receipt.itemHeader}</th>
                  <th className="py-1.5">{t.receipt.batchHeader}</th>
                  <th className="py-1.5">{t.receipt.expiryHeader}</th>
                  <th className="py-1.5 text-right">{t.receipt.qtyHeader}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {generatedReceipt.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">
                      <p className="font-bold text-slate-900">{item.medicineName}</p>
                      {item.dosageInstructions && (
                        <p className="text-[10px] text-slate-500">{item.dosageInstructions}</p>
                      )}
                    </td>
                    <td className="py-2 font-mono">{item.batchNumber}</td>
                    <td className="py-2 text-slate-600">{item.expiryDate}</td>
                    <td className="py-2 text-right font-bold font-mono">{item.quantityDispensed}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total / Government Free Drug Declaration */}
            <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 italic">
                {t.receipt.freeDrugScheme}
              </span>
              <span className="font-bold text-emerald-800 text-sm">
                Total: ₹0.00 (Govt. Free Supply)
              </span>
            </div>

            {/* Footer Notice */}
            <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 space-y-0.5">
              <p>{t.receipt.instructions}</p>
              <p className="font-bold text-rose-700">{t.receipt.emergencyHelp}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Receipt Correction (Audit Rule C & J) */}
      {showCorrectionModal && generatedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {t.pharmacy.correctReceipt}
              </h3>
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteCorrection} className="mt-4 space-y-3.5 text-xs">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <p className="font-bold">Immutable Audit Rule Enforced</p>
                <p className="text-[11px] mt-0.5">
                  Corrections will never delete history. A compensating stock transaction will be created and audited under your user identity ({currentUserName}).
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  New Status *
                </label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="VOIDED">Void Receipt (Restores dispensed stock)</option>
                  <option value="CORRECTED">Mark Corrected (Compensating entry)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Justification / Clinical Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Treating MO modified prescription to alternative antibiotic due to documented allergy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : 'Confirm Audited Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Patient Return (Rule E & H) */}
      {showReturnModal && generatedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {t.pharmacy.returnMedicine}
              </h3>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteReturn} className="mt-4 space-y-3.5 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <p>
                  Receipt: <strong className="font-mono">{generatedReceipt.receiptNumber}</strong>
                </p>
                <p>
                  Patient: <strong>{generatedReceipt.patientName}</strong> ({generatedReceipt.uhid})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Return Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Packaging Condition *
                  </label>
                  <select
                    value={returnCondition}
                    onChange={(e) => {
                      const cond = e.target.value as any;
                      setReturnCondition(cond);
                      // Auto-suggest safe disposition
                      if (cond === 'SEALED_INTACT') setReturnDisposition('RESTOCKED');
                      else setReturnDisposition('QUARANTINED');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none"
                  >
                    <option value="SEALED_INTACT">{t.pharmacy.conditionSealed}</option>
                    <option value="UNSEALED">{t.pharmacy.conditionUnsealed}</option>
                    <option value="DAMAGED">{t.pharmacy.conditionDamaged}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Authorized Disposition *
                </label>
                <select
                  value={returnDisposition}
                  onChange={(e) => setReturnDisposition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none"
                >
                  <option value="RESTOCKED">{t.pharmacy.dispositionRestock}</option>
                  <option value="QUARANTINED">{t.pharmacy.dispositionQuarantine}</option>
                  <option value="DESTROYED">{t.pharmacy.dispositionDestroy}</option>
                </select>
                {returnDisposition !== 'RESTOCKED' && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    * Rule E: Quarantined / destroyed stock will NOT enter usable inventory.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Inspection Notes / Return Reason *
                </label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Treatment completed; unused blister strip returned"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : 'Log Patient Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Clinical Incident (Rule I) */}
      {showIncidentModal && generatedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {t.pharmacy.clinicalIncidentTitle}
              </h3>
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteIncident} className="mt-4 space-y-3.5 text-xs">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                <p className="font-bold">{t.pharmacy.clinicalIncidentWarning}</p>
                <p className="text-[11px] mt-0.5">
                  Correcting inventory or receipts must never erase the clinical safety incident history.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Severity Level *
                </label>
                <select
                  value={incidentSeverity}
                  onChange={(e) => setIncidentSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none"
                >
                  <option value="LOW">Low (Near miss, caught prior to administration)</option>
                  <option value="MEDIUM">Medium (Non-severe drug substitution, monitoring ordered)</option>
                  <option value="HIGH">High (Potential adverse reaction risk)</option>
                  <option value="CRITICAL">Critical (Severe toxicity risk / urgent counter-measure required)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Clinical Description & Findings *
                </label>
                <textarea
                  required
                  rows={3}
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Provide precise details of discrepancy and clinical triage actions taken..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : 'Log Incident for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
