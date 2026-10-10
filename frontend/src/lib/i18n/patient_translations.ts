export type PatientLang = 'en' | 'hi' | 'ta';

export interface Translations {
  portalTitle: string;
  portalSubtitle: string;
  cashThresholdLabel: string;
  cashThresholdDesc: string;
  saveThreshold: string;
  activePolicy: string;
  policyLimit: string;
  deductibleUsed: string;
  upcomingVisits: string;
  visitCalendarTitle: string;
  insuranceComparisonTitle: string;
  insuranceComparisonSub: string;
  betterSchemesTitle: string;
  chatbotHeader: string;
  chatbotPlaceholder: string;
  send: string;
  triageTitle: string;
  noVisits: string;
  cashRecommendation: string;
  insuranceRecommendation: string;
}

export const PATIENT_TRANSLATIONS: Record<PatientLang, Translations> = {
  en: {
    portalTitle: 'Patient Care & Intelligent Navigation Portal',
    portalSubtitle: 'Personalized care plan instructions, upcoming visit calendar, insurance policy comparison, & AI Navigation Agent',
    cashThresholdLabel: 'Emergency Cash Payment Threshold',
    cashThresholdDesc: 'Maximum cash amount you are willing to pay for minor hospital visits before using insurance policy deductibles.',
    saveThreshold: 'Save Cash Threshold',
    activePolicy: 'Active Insurance Scheme',
    policyLimit: 'Annual Sum Insured Limit',
    deductibleUsed: 'Deductible Used This Year',
    upcomingVisits: 'Upcoming Hospital & Clinic Visits',
    visitCalendarTitle: 'Interactive Visit & Diagnostic Calendar',
    insuranceComparisonTitle: 'Insurance Policy & Scheme Comparison',
    insuranceComparisonSub: 'Comparative analysis of your active policy vs recommended healthcare schemes',
    betterSchemesTitle: 'Better Schemes Suited for You',
    chatbotHeader: 'AI Healthcare Operations & Navigation Agent',
    chatbotPlaceholder: 'Ask about symptoms, clinic visits, or treatment costs (e.g. sore throat, CABG cost)...',
    send: 'Send',
    triageTitle: 'Care Pathway Guidance',
    noVisits: 'No upcoming visits scheduled for this month.',
    cashRecommendation: 'Below Cash Threshold: Pay in Cash to save annual deductible limit.',
    insuranceRecommendation: 'Exceeds Cash Threshold: Use Insurance Policy Coverage & Pre-Authorization.'
  },
  hi: {
    portalTitle: 'मरीज़ देखभाल एवं बुद्धिमत्तापूर्ण नेविगेशन पोर्टल',
    portalSubtitle: 'व्यक्तिगत देखभाल निर्देश, आगामी अस्पताल दौरा कैलेंडर, बीमा तुलना एवं एआई सहायक',
    cashThresholdLabel: 'आपातकालीन नकद भुगतान सीमा (Threshold)',
    cashThresholdDesc: 'बीमा क्लेम का उपयोग करने से पहले वह अधिकतम नकद राशि जो आप छोटे इलाज के लिए दे सकते हैं।',
    saveThreshold: 'सीमा सहेजें (Save)',
    activePolicy: 'सक्रिय स्वास्थ्य बीमा योजना',
    policyLimit: 'वार्षिक बीमा कवर सीमा',
    deductibleUsed: 'इस वर्ष उपयोग किया गया डिडक्टिबल',
    upcomingVisits: 'आगामी अस्पताल और क्लिनिक यात्राएं',
    visitCalendarTitle: 'इंटरैक्टिव क्लिनिक और स्कैन कैलेंडर',
    insuranceComparisonTitle: 'स्वास्थ्य बीमा और योजना तुलना',
    insuranceComparisonSub: 'आपकी वर्तमान बीमा योजना और अन्य बेहतर योजनाओं का तुलनात्मक अध्ययन',
    betterSchemesTitle: 'आपके लिए अनुशंसित बेहतर सरकारी और निजी योजनाएं',
    chatbotHeader: 'एआई स्वास्थ्य सेवा नेविगेशन और संचालन सहायक',
    chatbotPlaceholder: 'लक्षणों, क्लिनिक दौरे या इलाज के खर्च के बारे में पूछें...',
    send: 'भेजें (Send)',
    triageTitle: 'उपचार मार्ग मार्गदर्शन (Care Pathway)',
    noVisits: 'इस महीने के लिए कोई आगामी यात्रा निर्धारित नहीं है।',
    cashRecommendation: 'नकद सीमा से कम: वार्षिक बीमा सीमा बचाने के लिए नकद भुगतान करें।',
    insuranceRecommendation: 'नकद सीमा से अधिक: बीमा पॉलिसी कवरेज और पूर्व-स्वीकृति का उपयोग करें।'
  },
  ta: {
    portalTitle: 'நோயாளி பராமரிப்பு மற்றும் அறிவார்ந்த வழிசெலுத்தல் மையம்',
    portalSubtitle: 'தனிப்பயனாக்கப்பட்ட மருத்துவ வழிகாட்டுதல், வரவிருக்கும் கிளினிக் காலண்டர் & AI உதவி ஏஜென்ட்',
    cashThresholdLabel: 'அவசர ரொக்கப் பண வரம்பு (Threshold)',
    cashThresholdDesc: 'காப்பீட்டைப் பயன்படுத்துவதற்கு முன்பு சிறு மருத்துவ செலவுகளுக்கு நீங்கள் செலுத்த விரும்பும் அதிகபட்ச ரொக்கப் பணம்.',
    saveThreshold: 'வரம்பை சேமிக்கவும் (Save)',
    activePolicy: 'தற்போதைய சுகாதார காப்பீட்டுத் திட்டம்',
    policyLimit: 'ஆண்டு காப்பீட்டுத் தொகை வரம்பு',
    deductibleUsed: 'இந்த ஆண்டில் பயன்படுத்தப்பட்ட தொகை',
    upcomingVisits: 'வரவிருக்கும் மருத்துவமனை வருகைகள்',
    visitCalendarTitle: 'ஊடாடும் கிளினிக் மற்றும் பரிசோதனை காலண்டர்',
    insuranceComparisonTitle: 'காப்பீட்டுக் கொள்கை ஒப்பீடு',
    insuranceComparisonSub: 'உங்கள் தற்போதைய காப்பீட்டிற்கும் சிறந்த திட்டங்களுக்கும் இடையிலான ஒப்பீட்டு ஆய்வு',
    betterSchemesTitle: 'உங்களுக்கு ஏற்ற சிறந்த சுகாதாரத் திட்டங்கள்',
    chatbotHeader: 'AI சுகாதார சேவை மற்றும் வழிசெலுத்தல் ஏஜென்ட்',
    chatbotPlaceholder: 'அறிகுறிகள், கிளினிக் வருகை அல்லது செலவுகள் பற்றி கேட்கவும்...',
    send: 'அனுப்பு (Send)',
    triageTitle: 'சிகிச்சை வழிசெலுத்தல் வழிகாட்டல்',
    noVisits: 'இந்த மாதத்தில் வரவிருக்கும் வருகைகள் எதுவும் இல்லை.',
    cashRecommendation: 'ரொக்க வரம்பிற்குள்: காப்பீட்டு வரம்பைப் பாதுகாக்க ரொக்கமாகச் செலுத்துங்கள்.',
    insuranceRecommendation: 'ரொக்க வரம்பிற்கு மேல்: காப்பீட்டுத் திட்டத்தைப் பயன்படுத்தவும்.'
  }
};
