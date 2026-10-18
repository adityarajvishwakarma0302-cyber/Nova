import React, { useState } from 'react';
import { 
  ClipboardList, 
  PackagePlus, 
  Search, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2,
  FileSpreadsheet,
  Building2
} from 'lucide-react';
import { Medicine, Batch, InventoryTransaction } from '../types/index.ts';
import { SupportedLanguage, translations } from '../i18n/index.ts';

interface InventoryAuditProps {
  medicines: Medicine[];
  batches: Batch[];
  transactions: InventoryTransaction[];
  facilityName: string;
  facilityId: string;
  currentLang: SupportedLanguage;
  currentUserName: string;
  currentUserId: string;
  onRecordDelivery: (payload: any) => Promise<any>;
  onRefresh: () => void;
}

export const InventoryAudit: React.FC<InventoryAuditProps> = ({
  medicines,
  batches,
  transactions,
  facilityName,
  facilityId,
  currentLang,
  currentUserName,
  currentUserId,
  onRecordDelivery,
  onRefresh,
}) => {
  const t = translations[currentLang];
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'BATCHES' | 'LEDGER'>('BATCHES');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  // Delivery Form State
  const [deliveryData, setDeliveryData] = useState({
    medicineId: medicines[0]?.id || '',
    batchNumber: '',
    expiryDate: '2028-06-30',
    quantity: 500,
    storageLocation: 'Central Drug Store - Rack A1',
    supplierChallan: 'CHALLAN-NHM-2026-',
    unitCost: 1.25,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredBatches = batches.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      (b.medicineName && b.medicineName.toLowerCase().includes(term)) ||
      b.batchNumber.toLowerCase().includes(term) ||
      b.storageLocation.toLowerCase().includes(term)
    );
  });

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryData.medicineId || !deliveryData.batchNumber || deliveryData.quantity <= 0) {
      setFeedback({ type: 'error', text: 'Please fill all required delivery fields with positive quantity.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onRecordDelivery({
        facilityId: facilityId === 'ALL' ? 'FAC-PHC-06' : facilityId,
        medicineId: deliveryData.medicineId,
        batchNumber: deliveryData.batchNumber,
        expiryDate: deliveryData.expiryDate,
        quantity: deliveryData.quantity,
        storageLocation: deliveryData.storageLocation,
        unitCost: deliveryData.unitCost,
        supplierChallan: deliveryData.supplierChallan,
        userId: currentUserId,
        userName: currentUserName,
      });

      setShowDeliveryModal(false);
      setFeedback({
        type: 'success',
        text: `Warehouse delivery recorded successfully for batch ${deliveryData.batchNumber}. Stock updated.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to record delivery' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {currentLang === 'hi' ? 'अपरिवर्तनीय स्टॉक बहीखाता' : 'Non-Destructive Stock Journal'}
            </span>
            <span className="text-xs text-slate-400">
              {facilityName}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            {t.navigation.inventoryAudits}
          </h1>
          <p className="text-xs text-slate-500">
            {currentLang === 'hi'
              ? 'दवाओं का स्टॉक कभी मिटाया नहीं जाता; क्षतिपूर्ति लेनदेन द्वारा पूर्ण ऑडिट ट्रेल संरक्षित है'
              : 'Inventory balances are never deleted; traceable through compensating transactions'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowDeliveryModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <PackagePlus className="w-4 h-4" />
            <span>{currentLang === 'hi' ? 'आपूर्ति आवक दर्ज करें' : 'Receive Warehouse Delivery'}</span>
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

      {/* Sub-tabs: Batches Table vs Ledger Transactions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('BATCHES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'BATCHES'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Batch Inventory ({batches.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LEDGER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'LEDGER'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Audit Trail Ledger ({transactions.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter medicine or batch..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56"
            />
          </div>
        </div>

        {/* Tab 1: Batch Inventory View */}
        {activeTab === 'BATCHES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'दवा एवं कोड' : 'Medicine & Formulation'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'बैच संख्या' : 'Batch No.'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'समाप्ति तिथि' : 'Expiry Date'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'hi' ? 'उपयोग योग्य स्टॉक' : 'Usable Stock'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'hi' ? 'क्वारंटाइन' : 'Quarantine'}</th>
                  <th className="py-3 px-4 text-right">{currentLang === 'hi' ? 'सुरक्षित सीमा' : 'Safety Buffer'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'भंडारण स्थान' : 'Location'}</th>
                  <th className="py-3 px-4">{currentLang === 'hi' ? 'स्थिति' : 'Audit Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredBatches.map((b) => {
                  const isExp = b.isExpired;
                  const isLow = b.quantityUsable <= (b.default_safety_stock ? b.default_safety_stock * 0.2 : 50);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{b.medicineName || b.medicineId}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{b.medicineCode}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {b.batchNumber}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {b.expiryDate}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono font-black text-sm px-2 py-0.5 rounded ${
                            isExp
                              ? 'text-slate-400 bg-slate-100'
                              : isLow
                              ? 'text-rose-700 bg-rose-50 font-extrabold'
                              : 'text-emerald-700 bg-emerald-50'
                          }`}
                        >
                          {b.quantityUsable}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        {b.quantityQuarantined > 0 ? (
                          <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            🔒 {b.quantityQuarantined}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {b.default_safety_stock || 300}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {b.storageLocation}
                      </td>

                      <td className="py-3 px-4">
                        {isExp ? (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 uppercase">
                            Expired (Excluded)
                          </span>
                        ) : b.isRecalled ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 uppercase">
                            Regulatory Recall
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase">
                            Stockout Risk
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                            Eligible FEFO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Immutable Ledger View */}
        {activeTab === 'LEDGER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Medicine & Batch</th>
                  <th className="py-3 px-4 text-right">Delta</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4">Officer / User</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((tx: any) => {
                  const isPositive = tx.quantity_delta > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            tx.transaction_type === 'DELIVERY' || tx.transaction_type === 'RETURN_RESTOCKED' || tx.transaction_type === 'CORRECTION_CREDIT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.transaction_type === 'DISPENSE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{tx.medicine_name || tx.medicine_id}</p>
                        <span className="text-[10px] font-mono text-slate-400">Batch: {tx.batch_number}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-700' : 'text-slate-800'}>
                          {isPositive ? `+${tx.quantity_delta}` : tx.quantity_delta}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {tx.balance_after}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {tx.user_name}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={tx.reason}>
                        <p className="truncate">{tx.reason}</p>
                        <span className="text-[10px] text-slate-400 font-mono">Ref: {tx.reference_id}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Delivery */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {currentLang === 'hi' ? 'केंद्रीय औषधि आपूर्ति आवक (Challan Indent)' : 'Receive Central Warehouse Delivery'}
              </h3>
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Select Drug *
                  </label>
                  <select
                    required
                    value={deliveryData.medicineId}
                    onChange={(e) => setDeliveryData({ ...deliveryData, medicineId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.strength})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Manufacturer Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryData.batchNumber}
                    onChange={(e) => setDeliveryData({ ...deliveryData, batchNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. PCM-2026-X9"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryData.expiryDate}
                    onChange={(e) => setDeliveryData({ ...deliveryData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={deliveryData.quantity}
                    onChange={(e) => setDeliveryData({ ...deliveryData, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Supplier Delivery Challan #
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryData.supplierChallan}
                    onChange={(e) => setDeliveryData({ ...deliveryData, supplierChallan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Assigned Storage Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryData.storageLocation}
                    onChange={(e) => setDeliveryData({ ...deliveryData, storageLocation: e.target.value })}
                    placeholder="e.g. Dispensary Shelf B2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? t.common.loading : 'Record Delivery & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
