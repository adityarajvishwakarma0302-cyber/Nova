export type SupportedLanguage = 'en' | 'hi';

export interface Translations {
  appName: string;
  appTagline: string;
  districtName: string;
  navigation: {
    districtOverview: string;
    patientDesk: string;
    bedManagement: string;
    pharmacyDispensing: string;
    inventoryAudits: string;
    staffAttendance: string;
    diagnostics: string;
    aiForecasting: string;
    safetyVerification: string;
  };
  roles: {
    REGISTRATION: string;
    NURSE: string;
    PHARMACIST: string;
    DOCTOR: string;
    FACILITY_ADMIN: string;
    DISTRICT_OFFICER: string;
  };
  facilityTypes: {
    PHC: string;
    CHC: string;
    SDH: string;
    DH: string;
  };
  bedStatus: {
    AVAILABLE: string;
    OCCUPIED: string;
    MAINTENANCE: string;
    QUARANTINED: string;
    CLEANING: string;
  };
  triage: {
    GREEN: string;
    YELLOW: string;
    RED: string;
  };
  attendance: {
    SCHEDULED: string;
    CONFIRMED_PRESENT: string;
    CONFIRMED_ABSENT: string;
    UNCONFIRMED: string;
  };
  common: {
    facility: string;
    allFacilities: string;
    currentRole: string;
    switchRole: string;
    changeFacility: string;
    liveSync: string;
    offlineMode: string;
    dataStale: string;
    save: string;
    cancel: string;
    confirm: string;
    submit: string;
    search: string;
    filter: string;
    status: string;
    actions: string;
    timestamp: string;
    loading: string;
    success: string;
    error: string;
    viewReceipt: string;
    printReceipt: string;
    downloadPdf: string;
    auditLog: string;
    reason: string;
    required: string;
    availableBeds: string;
    occupiedBeds: string;
    totalVisits: string;
    activeAdmissions: string;
    dailyDischarges: string;
    safetyStock: string;
    usableStock: string;
    batchNumber: string;
    expiryDate: string;
  };
  pharmacy: {
    dispenseMedicine: string;
    selectPatient: string;
    selectMedicine: string;
    selectBatchFefo: string;
    quantityToDispense: string;
    generateReceipt: string;
    insufficientStockError: string;
    duplicatePrevented: string;
    returnMedicine: string;
    correctReceipt: string;
    conditionSealed: string;
    conditionUnsealed: string;
    conditionDamaged: string;
    dispositionRestock: string;
    dispositionQuarantine: string;
    dispositionDestroy: string;
    clinicalIncidentTitle: string;
    clinicalIncidentWarning: string;
    compensatingTransactionNotice: string;
  };
  receipt: {
    title: string;
    govtBanner: string;
    receiptNumber: string;
    uhid: string;
    patientName: string;
    dispensedBy: string;
    itemHeader: string;
    batchHeader: string;
    expiryHeader: string;
    qtyHeader: string;
    totalAmount: string;
    instructions: string;
    freeDrugScheme: string;
    emergencyHelp: string;
  };
  ai: {
    demandForecastTitle: string;
    depletionCountdown: string;
    interFacilityTransferTitle: string;
    aiRationale: string;
    approveTransfer: string;
    rejectTransfer: string;
    safetyReserveRule: string;
    humanApprovalNotice: string;
    daysUntilStockout: string;
    donorReserveProtected: string;
  };
  verification: {
    title: string;
    subtitle: string;
    runAllTests: string;
    running: string;
    passed: string;
    failed: string;
    simulatedScenario: string;
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'SwasthyaSetu AI',
    appTagline: 'District Health Intelligence & Hospital Management System',
    districtName: 'Devbhoomi District Health Authority',
    navigation: {
      districtOverview: 'District Overview',
      patientDesk: 'Patient Desk & OPD',
      bedManagement: 'Bed Management',
      pharmacyDispensing: 'Pharmacy & Dispensing',
      inventoryAudits: 'Medicine Inventory & Audit',
      staffAttendance: 'Doctor & Staff Attendance',
      diagnostics: 'Diagnostics & Reagents',
      aiForecasting: 'AI Demand & Redistribution',
      safetyVerification: 'Automated Safety Audit Suite',
    },
    roles: {
      REGISTRATION: 'Registration / Reception Clerk',
      NURSE: 'Staff Nurse',
      PHARMACIST: 'Registered Pharmacist',
      DOCTOR: 'Medical Officer / Doctor',
      FACILITY_ADMIN: 'Facility Medical Superintendent',
      DISTRICT_OFFICER: 'Chief Medical Officer (CMO)',
    },
    facilityTypes: {
      PHC: 'Primary Health Centre (PHC)',
      CHC: 'Community Health Centre (CHC)',
      SDH: 'Sub-District Hospital (SDH)',
      DH: 'District Hospital (DH)',
    },
    bedStatus: {
      AVAILABLE: 'Available',
      OCCUPIED: 'Occupied',
      MAINTENANCE: 'Maintenance',
      QUARANTINED: 'Quarantined',
      CLEANING: 'Sanitizing / Cleaning',
    },
    triage: {
      GREEN: 'Non-Urgent (Green)',
      YELLOW: 'Urgent (Yellow)',
      RED: 'Immediate Resuscitation (Red)',
    },
    attendance: {
      SCHEDULED: 'Scheduled Shift',
      CONFIRMED_PRESENT: 'Confirmed Present (Verified)',
      CONFIRMED_ABSENT: 'Confirmed Absent (Verified)',
      UNCONFIRMED: 'Unconfirmed (Awaiting Verification)',
    },
    common: {
      facility: 'Facility',
      allFacilities: 'All District Facilities (Consolidated)',
      currentRole: 'Active Role',
      switchRole: 'Switch Role',
      changeFacility: 'Change Facility',
      liveSync: 'Live Synchronized',
      offlineMode: 'Offline Safe Mode',
      dataStale: 'Record Pending Verification',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      submit: 'Submit',
      search: 'Search by UHID, Name, or Batch...',
      filter: 'Filter',
      status: 'Status',
      actions: 'Actions',
      timestamp: 'Timestamp',
      loading: 'Loading data...',
      success: 'Operation completed successfully',
      error: 'Transaction aborted due to error',
      viewReceipt: 'View Receipt',
      printReceipt: 'Print Official Receipt',
      downloadPdf: 'Export Record',
      auditLog: 'Immutable Audit Trail',
      reason: 'Reason / Justification',
      required: 'Required',
      availableBeds: 'Available Beds',
      occupiedBeds: 'Occupied Beds',
      totalVisits: 'OPD Footfall Today',
      activeAdmissions: 'Active IPD Admissions',
      dailyDischarges: 'Discharges Today',
      safetyStock: 'Safety Threshold',
      usableStock: 'Usable Stock',
      batchNumber: 'Batch No.',
      expiryDate: 'Expiry Date',
    },
    pharmacy: {
      dispenseMedicine: 'Dispense Medicine',
      selectPatient: 'Select Patient (UHID)',
      selectMedicine: 'Select Medicine',
      selectBatchFefo: 'Active FEFO Batch',
      quantityToDispense: 'Quantity Dispensed',
      generateReceipt: 'Generate Atomic Receipt & Deduct Stock',
      insufficientStockError: 'Transaction Blocked: Dispense quantity exceeds usable stock!',
      duplicatePrevented: 'Idempotency Block: Duplicate receipt attempt prevented without re-deducting stock.',
      returnMedicine: 'Process Patient Medicine Return',
      correctReceipt: 'Correct Dispensing Receipt',
      conditionSealed: 'Sealed & Intact Original Packaging',
      conditionUnsealed: 'Unsealed / Opened Packaging',
      conditionDamaged: 'Damaged / Compromised',
      dispositionRestock: 'Return to Usable Stock (After Inspection)',
      dispositionQuarantine: 'Quarantine for Authorized Disposal',
      dispositionDestroy: 'Bio-Medical Waste Destruction',
      clinicalIncidentTitle: 'Clinical Incident Review Required',
      clinicalIncidentWarning: 'Incorrect drug dispensing logged. Clinical review record created.',
      compensatingTransactionNotice: 'Non-destructive correction recorded with compensating stock journal entry.',
    },
    receipt: {
      title: 'OFFICIAL MEDICAL DISPENSING RECEIPT',
      govtBanner: 'National Health Mission — Free Essential Drugs Initiative',
      receiptNumber: 'Receipt No',
      uhid: 'Patient UHID',
      patientName: 'Patient Name',
      dispensedBy: 'Dispensed By Pharmacist',
      itemHeader: 'Medicine & Formulation',
      batchHeader: 'Batch',
      expiryHeader: 'Exp. Date',
      qtyHeader: 'Qty Dispensed',
      totalAmount: 'Patient Fee Charged (₹0.00 - Govt. Free Supply)',
      instructions: 'Take medications as directed by the treating Medical Officer.',
      freeDrugScheme: 'Not for resale. Supply sponsored under State Free Medicine Scheme.',
      emergencyHelp: 'For medical emergencies or adverse reaction, dial 108 immediately.',
    },
    ai: {
      demandForecastTitle: 'AI Patient Demand & Footfall Forecast (Next 7 Days)',
      depletionCountdown: 'Medicine Stock-out Countdown & Lead-time Buffer',
      interFacilityTransferTitle: 'AI Automated Inter-Facility Stock Redistribution',
      aiRationale: 'Clinical & Logistical AI Evidence Rationale',
      approveTransfer: 'Authorize Transfer (Human Review)',
      rejectTransfer: 'Decline Recommendation',
      safetyReserveRule: 'Strict Rule Enforced: Donor facility safety stock preserved above buffer threshold.',
      humanApprovalNotice: 'Consequential action requires explicit human administrative sign-off.',
      daysUntilStockout: 'days of stock remaining',
      donorReserveProtected: 'Donor reserve protected',
    },
    verification: {
      title: 'Automated 12-Rule Safety & Integrity Verification Suite',
      subtitle: 'Real-time test runner validating atomic concurrency, oversell protection, and audit permanence',
      runAllTests: 'Run Full Automated Test Suite',
      running: 'Executing database transactions...',
      passed: 'PASSED',
      failed: 'FAILED',
      simulatedScenario: 'Interactive Simulation Scenarios',
    },
  },
  hi: {
    appName: 'स्वास्थ्यसेतु AI',
    appTagline: 'जिला स्वास्थ्य आसूचना एवं अस्पताल प्रबंधन प्रणाली',
    districtName: 'देवभूमि जिला स्वास्थ्य प्राधिकरण',
    navigation: {
      districtOverview: 'जिला समीक्षा डैशबोर्ड',
      patientDesk: 'मरीज़ पंजीकरण एवं ओपीडी',
      bedManagement: 'बेड प्रबंधन',
      pharmacyDispensing: 'औषधालय एवं दवा वितरण',
      inventoryAudits: 'दवा भंडार एवं ऑडिट ट्रेल',
      staffAttendance: 'चिकित्सक एवं स्टाफ उपस्थिति',
      diagnostics: 'जांच केंद्र एवं रीएजेंट',
      aiForecasting: 'एआई मांग पूर्वानुमान एवं पुनःवितरण',
      safetyVerification: 'स्वचालित सुरक्षा ऑडिट सूट',
    },
    roles: {
      REGISTRATION: 'पंजीकरण लिपिक (रिसेप्शन)',
      NURSE: 'स्टाफ नर्स',
      PHARMACIST: 'पंजीकृत फार्मासिस्ट',
      DOCTOR: 'चिकित्सा अधिकारी / डॉक्टर',
      FACILITY_ADMIN: 'अस्पताल अधीक्षक / प्रशासक',
      DISTRICT_OFFICER: 'मुख्य चिकित्सा अधिकारी (CMO)',
    },
    facilityTypes: {
      PHC: 'प्राथमिक स्वास्थ्य केंद्र (PHC)',
      CHC: 'सामुदायिक स्वास्थ्य केंद्र (CHC)',
      SDH: 'उप-जिला अस्पताल (SDH)',
      DH: 'जिला अस्पताल (DH)',
    },
    bedStatus: {
      AVAILABLE: 'उपलब्ध (खाली)',
      OCCUPIED: 'भर्ती (भरा हुआ)',
      MAINTENANCE: 'मरम्मत / रखरखाव',
      QUARANTINED: 'संक्रमण रोकथाम (क्वारंटाइन)',
      CLEANING: 'स्वच्छता / कीटाणुशोधन जारी',
    },
    triage: {
      GREEN: 'गैर-आपातकालीन (हरा)',
      YELLOW: 'त्वरित देखरेख (पीला)',
      RED: 'अति-गंभीर आपातकाल (लाल)',
    },
    attendance: {
      SCHEDULED: 'निर्धारित पाली',
      CONFIRMED_PRESENT: 'सत्यापित उपस्थित',
      CONFIRMED_ABSENT: 'सत्यापित अनुपस्थित',
      UNCONFIRMED: 'अपुष्ट (सत्यापन प्रतीक्षित)',
    },
    common: {
      facility: 'स्वास्थ्य केंद्र',
      allFacilities: 'जिले के समस्त स्वास्थ्य केंद्र (समेकित)',
      currentRole: 'वर्तमान पद / भूमिका',
      switchRole: 'भूमिका बदलें',
      changeFacility: 'केंद्र बदलें',
      liveSync: 'लाइव सिंक सक्रिय',
      offlineMode: 'सुरक्षित ऑफलाइन मोड',
      dataStale: 'रिकॉर्ड सत्यापन प्रतीक्षित',
      save: 'सुरक्षित करें',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      submit: 'प्रस्तुत करें',
      search: 'यूएचआईडी (UHID), नाम या बैच खोजें...',
      filter: 'फ़िल्टर',
      status: 'स्थिति',
      actions: 'कार्रवाई',
      timestamp: 'समय मुहर',
      loading: 'डेटा लोड हो रहा है...',
      success: 'कार्य सफलतापूर्वक पूर्ण हुआ',
      error: 'त्रुटि के कारण लेन-देन निरस्त',
      viewReceipt: 'रसीद देखें',
      printReceipt: 'आधिकारिक रसीद प्रिंट करें',
      downloadPdf: 'रिकॉर्ड डाउनलोड करें',
      auditLog: 'अपरिवर्तनीय ऑडिट ट्रेल',
      reason: 'कारण / स्पष्टीकरण',
      required: 'अनिवार्य',
      availableBeds: 'उपलब्ध बेड',
      occupiedBeds: 'भर्ती बेड',
      totalVisits: 'आज की ओपीडी संख्या',
      activeAdmissions: 'सक्रिय भर्ती मरीज',
      dailyDischarges: 'आज का डिस्चार्ज',
      safetyStock: 'सुरक्षित सीमा (Safety Stock)',
      usableStock: 'उपयोग योग्य स्टॉक',
      batchNumber: 'बैच संख्या',
      expiryDate: 'समाप्ति तिथि (Expiry)',
    },
    pharmacy: {
      dispenseMedicine: 'दवा वितरण करें',
      selectPatient: 'मरीज़ चुनें (UHID)',
      selectMedicine: 'दवा का चयन करें',
      selectBatchFefo: 'सक्रिय FEFO बैच',
      quantityToDispense: 'वितरित मात्रा',
      generateReceipt: 'परमाणु रसीद बनाएं एवं स्टॉक घटाएं',
      insufficientStockError: 'लेनदेन अस्वीकृत: वितरित मात्रा उपलब्ध स्टॉक से अधिक है!',
      duplicatePrevented: 'डुप्लिकेट रोकथाम: पुनः स्टॉक काटे बिना डुप्लिकेट रसीद प्रयास रोका गया।',
      returnMedicine: 'मरीज़ द्वारा लौटाई गई दवा दर्ज करें',
      correctReceipt: 'दवा वितरण रसीद सुधारें',
      conditionSealed: 'पूर्णतः सीलबंद मूल पैकेजिंग',
      conditionUnsealed: 'खुली हुई पैकेजिंग',
      conditionDamaged: 'क्षतिग्रस्त / दूषित पैकेजिंग',
      dispositionRestock: 'जांचोपरांत पुनः उपयोग योग्य स्टॉक में शामिल करें',
      dispositionQuarantine: 'अधिकृत निस्तारण हेतु क्वारंटाइन करें',
      dispositionDestroy: 'बायो-मेडिकल कचरा निस्तारण',
      clinicalIncidentTitle: 'क्लिनिकल समीक्षा आवश्यक',
      clinicalIncidentWarning: 'ग़लत दवा वितरण दर्ज। क्लिनिकल समीक्षा रिकॉर्ड तैयार किया गया।',
      compensatingTransactionNotice: 'अपरिवर्तनीय रिकॉर्ड सुरक्षित; क्षतिपूर्ति स्टॉक प्रविष्टि जोड़ी गई।',
    },
    receipt: {
      title: 'आधिकारिक दवा वितरण पावती / रसीद',
      govtBanner: 'राष्ट्रीय स्वास्थ्य मिशन — निःशुल्क अनिवार्य औषधि योजना',
      receiptNumber: 'रसीद संख्या',
      uhid: 'मरीज़ यूएचआईडी (UHID)',
      patientName: 'मरीज़ का नाम',
      dispensedBy: 'वितरणकर्ता फार्मासिस्ट',
      itemHeader: 'दवा एवं खुराक रूप',
      batchHeader: 'बैच',
      expiryHeader: 'समाप्ति तिथि',
      qtyHeader: 'वितरित मात्रा',
      totalAmount: 'मरीज़ से देय शुल्क (₹0.00 - सरकारी निःशुल्क आपूर्ति)',
      instructions: 'दवा का सेवन चिकित्सक के परामर्श अनुसार ही करें।',
      freeDrugScheme: 'बिक्री हेतु नहीं। राज्य निःशुल्क औषधि योजना अंतर्गत प्रदत्त।',
      emergencyHelp: 'आपातकालीन सहायता या प्रतिकूल प्रभाव हेतु तुरंत 108 डायल करें।',
    },
    ai: {
      demandForecastTitle: 'एआई मरीज़ मांग एवं ओपीडी पूर्वानुमान (आगामी 7 दिन)',
      depletionCountdown: 'दवा समाप्ति उलटी गिनती एवं लीड-टाइम बफर',
      interFacilityTransferTitle: 'एआई अंतर-अस्पताल दवा पुनःवितरण सिफारिशें',
      aiRationale: 'क्लिनिकल एवं लॉजिस्टिक्स साक्ष्य विश्लेषण',
      approveTransfer: 'हस्तांतरण स्वीकृत करें (मानवीय समीक्षा)',
      rejectTransfer: 'सिफारिश अस्वीकार करें',
      safetyReserveRule: 'कड़ा नियम: दाता अस्पताल का सुरक्षित बफर स्टॉक से कम नहीं किया जा सकता।',
      humanApprovalNotice: 'महत्वपूर्ण निर्णय हेतु अधिकृत मानवीय प्रशासनिक स्वीकृति आवश्यक है।',
      daysUntilStockout: 'दिनों का स्टॉक शेष',
      donorReserveProtected: 'दाता अस्पताल सुरक्षित भंडार आरक्षित',
    },
    verification: {
      title: 'स्वचालित 12-नियम सुरक्षा एवं डेटा सत्यनिष्ठा परीक्षण सूट',
      subtitle: 'वास्तविक समय में समवर्ती लेन-देन, ओवरसेल रोकथाम एवं ऑडिट का सत्यापन',
      runAllTests: 'पूर्ण स्वचालित परीक्षण सूट चलाएं',
      running: 'डेटाबेस लेन-देन परीक्षण जारी...',
      passed: 'उत्तीर्ण (PASSED)',
      failed: 'विफल (FAILED)',
      simulatedScenario: 'इंटरैक्टिव सिमुलेशन परिदृश्य',
    },
  },
};
