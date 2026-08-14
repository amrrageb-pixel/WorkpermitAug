import React, { useState, useEffect } from 'react';
import {
  Permit, PermitType, AuditLogEntry, UserProfile, Language, HiraAssessment,
  LotoDetail, GasReadings, CompetencyWorker, PermitSignatures, TrainingRecord
} from '../types';
import {
  PERMIT_TYPES_INFO, STANDARD_HAZARDS, STANDARD_PPES,
  HOT_WORK_CONDITIONS, CONFINED_SPACE_CONDITIONS, HEIGHT_WORK_CONDITIONS,
  COMMUNICATION_METHODS, MOCK_HIRAS, MOCK_WORKERS, PDF_CHECKLISTS, OSHA_CHECKLISTS
} from '../utils/initialData';
import { isWorkerCertifiedForType, requiresCertificationFor } from '../utils/competency';
import { 
  Shield, CheckSquare, Brain, FileText, Plus, CheckCircle, ArrowRight, ArrowLeft, ShieldCheck, ShieldAlert,
  AlertTriangle, Users, CalendarClock, MapPin, Clock,
  Trash2, Lock, Gauge, Siren, PenLine, Eye, Wrench, Zap
} from 'lucide-react';

interface PermitFormProps {
  onSaveDraft: (newPermit: Permit) => void;
  onCancel: () => void;
  currentUser?: UserProfile;
  language: Language;
  prefilledHira?: HiraAssessment | null;
  onClearPrefilledHira?: () => void;
  hiras?: HiraAssessment[];
  permits?: Permit[];
  users?: UserProfile[];
  trainings?: TrainingRecord[];
  onAddHira?: (hira: HiraAssessment) => void;
}

export const PermitFormV2: React.FC<PermitFormProps> = ({
  onSaveDraft,
  onCancel,
  currentUser,
  language,
  prefilledHira,
  onClearPrefilledHira,
  hiras = [],
  permits = [],
  users = [],
  trainings = [],
  onAddHira
}) => {
 // ── Wizard state ──────────────────────────────────────────────────────────
 const [currentStep, setCurrentStep] = useState(1);
 const totalSteps = 5;
 


  const permitId = React.useMemo(() => `PTW-2026-0${Math.floor(100 + Math.random() * 900)}`, []);

 // ── Step 1: Basic Info ────────────────────────────────────────────────────
 const [title, setTitle] = useState('');
 const [type, setType] = useState<PermitType>('COLD');
 const [linkedHiraId, setLinkedHiraId] = useState('');
  const [internalRiskAssessment, setInternalRiskAssessment] = useState(false);
  const [toolsAndEquipment, setToolsAndEquipment] = useState('');
  const [electricalRequired, setElectricalRequired] = useState(false);

  useEffect(() => {
    if (type === 'LOTO') {
      setElectricalRequired(true);
    }
  }, [type]);

 // ── Step 2: Location & Duration ───────────────────────────────────────────
 const [location, setLocation] = useState('');
 const [description, setDescription] = useState('');
 const [startDate, setStartDate] = useState('2026-07-16T08:00');
 const [endDate, setEndDate] = useState('2026-07-16T16:00');

  // A permit is authorization for a bounded window of work, not an open-ended one — real PTW
  // practice caps initial validity at a single shift and requires a logged extension (already
  // supported via handleExtendPermit) for anything longer, rather than issuing month-long permits.
  const MAX_INITIAL_PERMIT_HOURS = 24;
  const dateRangeError = React.useMemo(() => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end)) return '';
    if (end <= start) {
      return language === 'ar' ? 'وقت النهاية يجب أن يكون بعد وقت البداية.' : 'End time must be after the start time.';
    }
    const hours = (end - start) / (1000 * 60 * 60);
    if (hours > MAX_INITIAL_PERMIT_HOURS) {
      return language === 'ar'
        ? `مدة التصريح الأولية لا يجب أن تتجاوز ${MAX_INITIAL_PERMIT_HOURS} ساعة. للعمل الأطول، أصدر التصريح ثم استخدم "طلب تمديد" الموثّق بدلاً من صلاحية مفتوحة.`
        : `Initial permit validity should not exceed ${MAX_INITIAL_PERMIT_HOURS} hours. For longer work, issue the permit and use the logged "Request Extension" action instead of an open-ended validity window.`;
    }
    return '';
  }, [startDate, endDate, language]);

  // SIMOPS Conflict Detection
  const simopsConflicts = React.useMemo(() => {
    if (!location.trim() || !permits.length) return [];
    const locLower = location.trim().toLowerCase();
    return permits.filter(p => 
      p.status !== 'CLOSED' && p.status !== 'REJECTED' &&
      p.location?.toLowerCase().includes(locLower)
    );
  }, [location, permits]);

  // Dynamic PPE Auto-Selection per Work Type
  useEffect(() => {
    const autoPpe: string[] = ['helmet', 'shoes', 'glasses'];
    if (type === 'HEIGHT') {
      autoPpe.push('harness');
    } else if (type === 'CONFINED') {
      autoPpe.push('mask');
    } else if (type === 'HOT') {
      autoPpe.push('shield', 'gloves');
    } else if (type === 'ELECTRICAL' || type === 'LOTO') {
      autoPpe.push('gloves');
    }
    setChoosenPpes(prev => Array.from(new Set([...prev, ...autoPpe])));
  }, [type]);

 // ── Step 3: Hazards & Controls ────────────────────────────────────────────
 const [choosenHazards, setChoosenHazards] = useState<string[]>([]);
  // Sync prefilledHira when passed from HiraManager or parent
  useEffect(() => {
    if (prefilledHira) {
      setLinkedHiraId(prefilledHira.id);
      const displayTitle = language === 'ar' ? (prefilledHira.taskAr || prefilledHira.taskEn) : (prefilledHira.taskEn || prefilledHira.taskAr);
      if (displayTitle) setTitle(displayTitle);
      if (prefilledHira.hazardAr || prefilledHira.hazardEn) {
        const mainHazard = language === 'ar' ? (prefilledHira.hazardAr || prefilledHira.hazardEn) : (prefilledHira.hazardEn || prefilledHira.hazardAr);
        setChoosenHazards([mainHazard]);
      }
      if (prefilledHira.areaAr || prefilledHira.areaEn) {
        setLocation(language === 'ar' ? (prefilledHira.areaAr || prefilledHira.areaEn) : (prefilledHira.areaEn || prefilledHira.areaAr));
      }
    }
  }, [prefilledHira, language]);
  // --- HIRA ISO 45001 Full Embedded Form State ---
  const [showInternalHiraForm, setShowInternalHiraForm] = useState(false);
  const [customHira, setCustomHira] = useState<HiraAssessment | null>(null);

  const [hiraTaskAr, setHiraTaskAr] = useState('');
  const [hiraTaskEn, setHiraTaskEn] = useState('');
  const [hiraHazardAr, setHiraHazardAr] = useState('');
  const [hiraHazardEn, setHiraHazardEn] = useState('');
  const [hiraConsequenceAr, setHiraConsequenceAr] = useState('');
  const [hiraConsequenceEn, setHiraConsequenceEn] = useState('');
  const [hiraAreaAr, setHiraAreaAr] = useState('');
  const [hiraAreaEn, setHiraAreaEn] = useState('');
  
  const [hiraLikelihood, setHiraLikelihood] = useState<number>(3);
  const [hiraSeverity, setHiraSeverity] = useState<number>(3);

  const [hiraEliminationAr, setHiraEliminationAr] = useState('');
  const [hiraEliminationEn, setHiraEliminationEn] = useState('');
  const [hiraSubstitutionAr, setHiraSubstitutionAr] = useState('');
  const [hiraSubstitutionEn, setHiraSubstitutionEn] = useState('');
  const [hiraEngineeringAr, setHiraEngineeringAr] = useState('');
  const [hiraEngineeringEn, setHiraEngineeringEn] = useState('');
  const [hiraAdministrativeAr, setHiraAdministrativeAr] = useState('');
  const [hiraAdministrativeEn, setHiraAdministrativeEn] = useState('');
  const [hiraPpeAr, setHiraPpeAr] = useState('');
  const [hiraPpeEn, setHiraPpeEn] = useState('');

  const [hiraResLikelihood, setHiraResLikelihood] = useState<number>(1);
  const [hiraResSeverity, setHiraResSeverity] = useState<number>(2);

  const getRiskScoreColor = (score: number) => {
    if (score >= 15) return 'bg-red-500 text-white dark:bg-red-950/70 border-red-600';
    if (score >= 8) return 'bg-amber-500 text-slate-900 dark:bg-yellow-900 text-yellow-300 border-amber-600';
    return 'bg-emerald-500 text-white dark:bg-emerald-950/70 border-emerald-600';
  };

  const getRiskLevelText = (score: number) => {
    if (score >= 15) return language === 'ar' ? 'خطر حرج (عالي) | High Critical' : 'High Critical | خطر حرج';
    if (score >= 8) return language === 'ar' ? 'متوسط المقبولية | Medium Risk' : 'Medium Risk | متوسط';
    return language === 'ar' ? 'مقبول (آمن) | Low Risk' : 'Low Risk | مقبول';
  };

  const handleSaveHiraAssessment = () => {
    const newHira: HiraAssessment = {
      id: `HIRA-PTW-${Math.floor(1000 + Math.random() * 9000)}`,
      taskAr: hiraTaskAr || title || 'تبديل شفرات دوّار مروحة السحب والترشيح الرئيسية',
      taskEn: hiraTaskEn || title || 'Replacing high-voltage fan drive rotor blades',
      areaAr: hiraAreaAr || location || 'برج التسخين المسبق للفرن',
      areaEn: hiraAreaEn || location || 'Kiln Preheater Tower',
      hazardAr: hiraHazardAr || 'الانحشار الميكانيكي تحت شفرات المروحة أو تحركها فجأة',
      hazardEn: hiraHazardEn || 'Mechanical entrapment, crushed fingers, falling into pulley space',
      consequenceAr: hiraConsequenceAr || 'بتر في الأطراف أو تهتك جلدي جراء دوران غير مخطط للمروحة',
      consequenceEn: hiraConsequenceEn || 'Amputation of hand, severe trauma from rotating impact',
      initialLikelihood: hiraLikelihood,
      initialSeverity: hiraSeverity,
      initialRiskScore: hiraLikelihood * hiraSeverity,
      controls: {
        eliminationAr: hiraEliminationAr,
        eliminationEn: hiraEliminationEn,
        substitutionAr: hiraSubstitutionAr,
        substitutionEn: hiraSubstitutionEn,
        engineeringAr: hiraEngineeringAr || 'تركيب قفل حماية ميكانيكي ومثبت دوران شفرات',
        engineeringEn: hiraEngineeringEn || 'Mechanical locking pin & blade stabilizer',
        administrativeAr: hiraAdministrativeAr || 'تطبيق عزل الطاقة LOTO وتعيين مراقب سلامة',
        administrativeEn: hiraAdministrativeAr || 'Apply LOTO & Safety Observer',
        ppeAr: hiraPpeAr || 'بدلة حماية، خوذة، نظارات عازلة، قفازات ميكانيكية، حذاء سلامة',
        ppeEn: hiraPpeEn || 'Protective Suit, Helmet, Safety Glasses, Mechanical Gloves'
      },
      residualLikelihood: hiraResLikelihood,
      residualSeverity: hiraResSeverity,
      residualRiskScore: hiraResLikelihood * hiraResSeverity,
      status: 'APPROVED',
      assessedBy: currentUser?.fullNameAr || 'أخصائي السلامة والصحة المهنية',
      date: new Date().toISOString().split('T')[0]
    };

    setCustomHira(newHira);
    setLinkedHiraId(newHira.id);
    const mainHaz = newHira.hazardAr;
    if (mainHaz && !choosenHazards.includes(mainHaz)) {
      setChoosenHazards(prev => [...prev, mainHaz]);
    }
    setShowInternalHiraForm(false);
  };



 const [gasReadings, setGasReadings] = useState<GasReadings>({});
  const [oshaChecklists, setOshaChecklists] = useState<{
    lotoVerification?: {[key: string]: boolean};
    confinedSpace?: {[key: string]: boolean};
    hotWork?: {[key: string]: boolean};
    generalSafety?: {[key: string]: boolean};
  }>({});

 // ── Step 4: Workers & PPE ─────────────────────────────────────────────────
 const [competencyWorkers, setCompetencyWorkers] = useState<CompetencyWorker[]>([]);
 const [choosenPpes, setChoosenPpes] = useState<string[]>(['helmet', 'shoes', 'glasses']);
 const [tbtTopic, setTbtTopic] = useState('');
 const [tbtConductor, setTbtConductor] = useState('');
 // ISO 45001 7.4 / NEBOSH: each attendee individually acknowledges the briefing — a
 // supervisor checking one box for the whole crew is not acceptable accountability.
 const [tbtAcknowledgedIds, setTbtAcknowledgedIds] = useState<Set<string>>(new Set());
 const toggleTbtAck = (workerId: string) => {
 setTbtAcknowledgedIds(prev => {
 const next = new Set(prev);
 if (next.has(workerId)) next.delete(workerId); else next.add(workerId);
 return next;
 });
 };
 const [selectedWorkerId, setSelectedWorkerId] = useState('');
 const [externalWorkerName, setExternalWorkerName] = useState('');
 const [externalWorkerRole, setExternalWorkerRole] = useState('');

  // Dynamic Tenant-Scoped Worker List
  const companyWorkersList = React.useMemo(() => {
    if (users && users.length > 0) {
      return users.map(u => ({
        id: u.empCode || u.username,
        name: (language === 'ar' ? u.fullNameAr : u.fullNameEn) || u.fullNameAr || u.username,
        role: (language === 'ar' ? u.roleAr : u.roleEn) || u.roleAr || 'عامل / موظف بالشركة',
      }));
    }
    return MOCK_WORKERS;
  }, [users, language]);

 const handleAddWorker = () => {
 const w = companyWorkersList.find(x => x.id === selectedWorkerId);
 if (!w || competencyWorkers.find(x => x.id === w.id)) return;

 // Checked against real training records (see utils/competency.ts) — never defaults to
 // "qualified" for a certification-requiring permit type without a matching, unexpired
 // TrainingRecord for this exact worker.
 const status: 'QUALIFIED' | 'EXPIRED' | 'NOT_REQUIRED' = !requiresCertificationFor(type)
 ? 'NOT_REQUIRED'
 : isWorkerCertifiedForType(w.name, type, trainings) ? 'QUALIFIED' : 'EXPIRED';

 if (status === 'EXPIRED') {
 const proceed = window.confirm(language === 'ar'
 ? `تحذير: لا يوجد سجل تدريب ساري لـ "${w.name}" لهذا النوع من التصريح. لا يجوز السماح له بالعمل بدون شهادة صالحة. هل تريد إضافته على أي حال (سيمنع هذا اعتماد التصريح لاحقاً)؟`
 : `Warning: "${w.name}" has no valid, unexpired training record for this permit type. They may not legally perform this work without one. Add anyway? (this will block final permit approval)`);
 if (!proceed) return;
 }

 setCompetencyWorkers(prev => [...prev, { id: w.id, name: w.name, role: w.role, competencyStatus: status }]);
 setSelectedWorkerId('');
 };

 const handleAddExternalWorker = () => {
 if (!externalWorkerName.trim()) return;
 setCompetencyWorkers(prev => [...prev, {
 id: 'EXT-' + Date.now(),
 name: externalWorkerName,
 role: externalWorkerRole || (language === 'ar' ? 'عامل خارجي / مقاول' : 'External Contractor'),
 competencyStatus: 'NOT_REQUIRED',
 isExternal: true,
 externalCompany: externalWorkerRole || 'Contractor'
 }]);
 setExternalWorkerName('');
 setExternalWorkerRole('');
 };

 // ── Step 5: Emergency & Signatures ────────────────────────────────────────
 const [emergencyContact, setEmergencyContact] = useState('');
 const [assemblyPoint, setAssemblyPoint] = useState('');
 const [nearestMedicalFacility, setNearestMedicalFacility] = useState('');
 // OSHA 1910.146: a confined-space entry permit must name a rescue plan, standby rescue
 // equipment, and a communication method BEFORE entry is authorized — not optional extras.
 const [rescueEquipmentOnStandby, setRescueEquipmentOnStandby] = useState(false);
 const [communicationMethod, setCommunicationMethod] = useState('');
 const [signatures, setSignatures] = useState<PermitSignatures>({
 issuerName: currentUser?.fullNameAr || 'م. أحمد',
 });

 // ── Navigation helpers ────────────────────────────────────────────────────
 const canAdvance = (step: number): boolean => {
 switch (step) {
 case 1: return !!title.trim() && !!type;
 case 2: return !!location.trim() && !!startDate && !!endDate && !dateRangeError;
 case 3: return true; // Hazards are optional depending on HIRA
 case 4: return competencyWorkers.length > 0 && competencyWorkers.every(w => tbtAcknowledgedIds.has(w.id));
 default: return true;
 }
 };

 const nextStep = () => {
 if (!canAdvance(currentStep)) {
 const msgs: Record<number, Record<string, string>> = {
 1: { ar: 'يرجى إدخال عنوان التصريح واختيار نوع العمل.', en: 'Please enter the permit title and select work type.' },
 2: { ar: 'يرجى إدخال موقع العمل وتواريخ الصلاحية.', en: 'Please enter work location and validity dates.' },
 4: { ar: 'يجب إضافة عامل واحد على الأقل.', en: 'At least one worker must be added.' },
 };
 const msg = msgs[currentStep];
 if (msg) alert(language === 'ar' ? msg.ar : msg.en);
 return;
 }
 setCurrentStep(p => Math.min(p + 1, totalSteps));
 };
 const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

 // ── HIRA selection ────────────────────────────────────────────────────────
 const handleHiraSelect = (hiraId: string) => {
 setLinkedHiraId(hiraId);
 if (hiraId === 'INTERNAL') {
   setChoosenHazards([]);
   setInternalRiskAssessment(true);
   return;
 }
 setInternalRiskAssessment(false);
 const h = MOCK_HIRAS.find(x => x.id === hiraId);
 if (h) {
 setTitle(h.title);
 setChoosenHazards(h.hazards);
 }
 };

 // ── PPE toggle ────────────────────────────────────────────────────────────
 const handleTogglePpe = (id: string) => {
 setChoosenPpes(prev =>
 prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
 );
 };

 // ── Submit ────────────────────────────────────────────────────────────────
 const handleSubmit = () => {
 if (!signatures.receiverName) {
 alert(language === 'ar' ? 'يجب تعبئة التوقيع قبل الإرسال.' : 'Signature is required before submitting.');
 return;
 }
 if (!title.trim() || !location.trim()) {
 alert(language === 'ar' ? 'العنوان والموقع مطلوبان.' : 'Title and Location are required.');
 return;
 }
 if (type === 'CONFINED' && (!rescueEquipmentOnStandby || !communicationMethod)) {
 alert(language === 'ar'
 ? 'تصاريح الأماكن المغلقة تتطلب تأكيد جاهزية معدات الإنقاذ وتحديد وسيلة الاتصال قبل الإرسال (OSHA 1910.146).'
 : 'Confined space permits require confirming rescue equipment readiness and a communication method before submitting (OSHA 1910.146).');
 return;
 }

 const actorName = currentUser ? (language === 'ar' ? currentUser.fullNameAr : currentUser.fullNameEn) : 'م. أحمد المنفذ';
 const actorRoleAr = currentUser ? currentUser.roleAr : 'مشرف الفريق المنفذ';
 const actorRoleEn = currentUser ? currentUser.roleEn : 'Maintenance Site Supervisor';

 const firstAudit: AuditLogEntry = {
 id: `L-${Date.now()}`,
 timestamp: new Date().toISOString().substring(0, 16).replace('T', ' '),
 actionAr: `إنشاء مسودة تصريح العمل (${type})`,
 actionEn: `Created work permit draft (${type})`,
 actorName, actorRoleAr, actorRoleEn,
 comment: language === 'ar' ? 'تم إنشاء التصريح عبر المعالج المتعدد الخطوات.' : 'Created via 5-step wizard.',
 };

 const newPermit: Permit = {
 id: permitId,
 title, type, location,
 requesterName: actorName,
 requesterRoleAr: actorRoleAr,
 requesterRoleEn: actorRoleEn,
 description,
 toolsAndEquipment,
 oshaChecklists,
 internalRiskAssessment,
 hazards: choosenHazards,
 startDate, endDate,
 status: 'DRAFT',

 productionRequired: true,
 productionApproval: false,
 electricalRequired: electricalRequired || type === 'LOTO',
 electricalApproval: false,

 lotoRequired: !!oshaChecklists.lotoVerification,
 lotoDetails: [],
 gasTestRequired: type === 'CONFINED' || type === 'HOT',
 gasReadingsData: gasReadings,

 hseApproval: false,
 requiredPPE: choosenPpes,
 safetyPrecautionConfirmations: {},
 workers: competencyWorkers.map(w => w.name),
 competencyWorkers,
 toolboxTalkCompleted: competencyWorkers.length > 0 && competencyWorkers.every(w => tbtAcknowledgedIds.has(w.id)),
 toolboxTalkTopicAr: tbtTopic || title,
 toolboxTalkTopicEn: tbtTopic || title,
 toolboxTalkConductor: tbtConductor || actorName,
 // Only individually-acknowledged attendees are recorded as present — matching how the
 // attendance register is actually filled in above, not the whole crew list by default.
 toolboxTalkAttendees: competencyWorkers.filter(w => tbtAcknowledgedIds.has(w.id)).map(w => w.name),
 toolboxTalkTimestamp: new Date().toISOString().substring(0, 16),
 signatures,
 emergencyContact,
 emergencyAssemblyPoint: assemblyPoint || undefined,
 nearestMedicalFacility: nearestMedicalFacility || undefined,
 rescuePlanRequired: type === 'CONFINED',
 rescueEquipmentOnStandby: type === 'CONFINED' ? rescueEquipmentOnStandby : undefined,
 communicationMethod: communicationMethod || undefined,

 auditTrail: [firstAudit],
 hiraId: linkedHiraId || undefined,
 };

 if (onAddHira && (internalRiskAssessment || choosenHazards.length > 0)) {
    const autoHira: HiraAssessment = {
      id: `HIRA-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `${title} (PTW Auto-HIRA)`,
      department: location || 'Site Operations',
      preparedBy: actorName,
      assessedDate: new Date().toISOString().substring(0, 10),
      reviewDate: new Date(Date.now() + 365*86400000).toISOString().substring(0, 10),
      hazards: choosenHazards,
      overallRisk: choosenHazards.length > 3 ? 'HIGH' : 'MEDIUM',
      status: 'APPROVED',
      approvedBy: actorName,
      approvedAt: new Date().toISOString().substring(0, 10),
      tenantId: currentUser?.tenantId || 'tenant-demo'
    };
    onAddHira(autoHira);
  }

  onSaveDraft(newPermit);
  };

 // ── Shared CSS tokens ─────────────────────────────────────────────────────
 const inputClass = 'w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-shadow';
 const sectionTitle = (icon: React.ReactNode, textAr: string, textEn: string) => (
 <div className="flex items-center gap-2 justify-start mb-4">
 <div className="bg-orange-500/10 p-1.5 rounded-lg">{icon}</div>
 <h3 className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200">{language === 'ar' ? textAr : textEn}</h3>
 </div>
 );

 // ════════════════════════════════════════════════════════════════════════════
 // RENDER
 // ════════════════════════════════════════════════════════════════════════════
 return (
 <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-lg flex flex-col text-start font-sans overflow-hidden">

 {/* ─── Header ───────────────────────────────────────────────────────── */}
 <div className="bg-gradient-to-l from-orange-500/5 to-transparent dark:from-orange-950/20 px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
 <div className="flex items-center gap-3 justify-start ">
 <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-md shadow-orange-500/20">
 <FileText className="w-5 h-5" />
 </div>
 <div className="text-start">
 <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
 {language === 'ar' ? 'إنشاء مسودة تصريح عمل جديدة' : 'Create New Work Permit Draft'}
 </h2>
 <p className="text-xs text-neutral-400 mt-0.5 font-mono">{permitId}</p>
 </div>
 </div>
 </div>

 {/* ─── Stepper ──────────────────────────────────────────────────────── */}
 <div className="px-6 py-4 border-b border-neutral-50 dark:border-neutral-800/50">
 <div className="flex items-center justify-between">
 {[
  { num: 1, ar: 'تفاصيل العمل', en: 'Details', icon: <FileText className="w-3.5 h-3.5" /> },
  { num: 2, ar: 'قوائم التحقق', en: 'Checklists', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  { num: 3, ar: 'تقييم المخاطر', en: 'Risk Assessment', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { num: 4, ar: 'فريق العمل', en: 'Team', icon: <Users className="w-3.5 h-3.5" /> },
  { num: 5, ar: 'التواقيع', en: 'Signatures', icon: <PenLine className="w-3.5 h-3.5" /> },
 ].map((s, idx) => {
 const isActive = currentStep === s.num;
 const isCompleted = currentStep > s.num;
 return (
 <React.Fragment key={s.num}>
 {idx > 0 && (
 <div className={`flex-1 h-[2px] mx-1 rounded-full transition-colors ${isCompleted ? 'bg-emerald-400' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
 )}
 <button
 type="button"
 onClick={() => {
 // Only allow going back or to current step freely
 if (s.num <= currentStep) setCurrentStep(s.num);
 else if (canAdvance(currentStep)) setCurrentStep(s.num);
 }}
 className="flex flex-col items-center gap-1 group"
 >
 <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
 isActive
 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 ring-4 ring-orange-100 dark:ring-orange-950'
 : isCompleted
 ? 'bg-emerald-500 text-white shadow-sm'
 : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'
 }`}>
 {isCompleted ? <CheckCircle className="w-5 h-5" /> : s.icon}
 </div>
 <span className={`text-[10px] font-bold transition-colors ${
 isActive ? 'text-orange-600 dark:text-orange-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'
 }`}>
 {language === 'ar' ? s.ar : s.en}
 </span>
 </button>
 </React.Fragment>
 );
 })}
 </div>
 {/* Progress bar */}
 <div className="mt-3 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
 style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
 />
 </div>
 </div>

 {/* ─── Step Content ─────────────────────────────────────────────────── */}
 <div className="px-6 py-5 min-h-[380px]">

 {/* ──── STEP 1: Basic Info ──── */}
 {currentStep === 1 && (
 <div className="space-y-5">
 {sectionTitle(<FileText className="w-4 h-4 text-orange-500" />, 'الخطوة ١: المعلومات الأساسية', 'Step 1: Basic Information')}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Permit ID (readonly) */}
 <div>
 <label className="block text-xs font-bold text-neutral-500 mb-1.5">{language === 'ar' ? 'رقم التصريح (تلقائي)' : 'Permit Number (Auto)'}</label>
 <input readOnly value={permitId} className="w-full text-sm p-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-500 font-mono cursor-not-allowed" />
 </div>

 {/* Work Type */}
 <div>
 <label className="block text-xs font-bold text-neutral-500 mb-1.5">{language === 'ar' ? 'تصنيف العمل *' : 'Work Classification *'}</label>
 <select value={type} onChange={e => setType(e.target.value as PermitType)} className={`${inputClass} cursor-pointer`}>
 {Object.keys(PERMIT_TYPES_INFO).map(k => (
 <option key={k} value={k}>{language === 'ar' ? PERMIT_TYPES_INFO[k as PermitType].labelAr : PERMIT_TYPES_INFO[k as PermitType].labelEn}</option>
 ))}
 </select>
 </div>

 {/* HIRA Link — moved before title so auto-fill works first */}
 <div className="md:col-span-2">
 <label className="block text-xs font-bold text-neutral-500 mb-1.5">{language === 'ar' ? 'ربط تقييم المخاطر (HIRA)' : 'Link Risk Assessment (HIRA)'}</label>
 <div className="flex gap-2">
 <select value={linkedHiraId} onChange={e => handleHiraSelect(e.target.value)} className={`flex-1 ${inputClass} cursor-pointer`}>
 <option value="">{language === 'ar' ? '-- اختر تقييم المخاطر --' : '-- Select HIRA --'}</option>
 <option value="INTERNAL">{language === 'ar' ? '-- تقييم داخلي للتصريح --' : '-- Internal Permit Assessment --'}</option>
   {/* Real Registered HIRAs created by user */}
  {hiras && hiras.length > 0 && (
    <optgroup label={language === 'ar' ? 'تقييمات المخاطر المسجلة والمعتمدة' : 'Registered HIRA Assessments'}>
      {hiras.map(h => {
        const displayTitle = language === 'ar' ? (h.taskAr || h.taskEn || h.hazardAr || h.id) : (h.taskEn || h.taskAr || h.hazardEn || h.id);
        const displayArea = language === 'ar' ? (h.areaAr || h.areaEn || '') : (h.areaEn || h.areaAr || '');
        return (
          <option key={h.id} value={h.id}>
            {h.id} — {displayTitle} {displayArea ? `(${displayArea})` : ''}
          </option>
        );
      })}
    </optgroup>
  )}

  {/* Sample Mock HIRA Templates */}
  <optgroup label={language === 'ar' ? 'نماذج تقييمات جاهزة' : 'Sample HIRA Templates'}>
    {MOCK_HIRAS.map(h => (
      <option key={h.id} value={h.id}>{h.title}</option>
    ))}
  </optgroup>
 </select>
 </div>
 {linkedHiraId && linkedHiraId !== 'INTERNAL' && (
 <div className="mt-2 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 justify-start ">
 <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
 <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{language === 'ar' ? 'تم ربط التقييم بنجاح — سيتم تعبئة العنوان والمخاطر تلقائياً' : 'HIRA linked — title and hazards auto-filled'}</span>
 </div>
 )}
 {linkedHiraId === 'INTERNAL' && (
 <div className="mt-2 flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 justify-start ">
 <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
 <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{language === 'ar' ? 'تقييم داخلي — سيتم تحديد المخاطر يدوياً في الخطوة 3' : 'Internal Assessment — Hazards will be selected manually in Step 3'}</span>
 </div>
 )}
 </div>

 {/* Title (full width) */}
 <div className="md:col-span-2">
 <label className="block text-xs font-bold text-neutral-500 mb-1.5">{language === 'ar' ? 'عنوان التصريح / وصف المهمة *' : 'Permit Title / Task Description *'}</label>
 <input
 value={title}
 onChange={e => setTitle(e.target.value)}
 placeholder={language === 'ar' ? 'مثال: صيانة المضخة الرئيسية - الخط 3' : 'e.g., Main Pump Maintenance - Line 3'}
 className={inputClass}
 />
 </div>
  {/* Tools and Equipment */}
  <div className="md:col-span-2">
  <label className="block text-xs font-bold text-neutral-500 mb-1.5 flex items-center gap-1 justify-start ">
  <Wrench className="w-3.5 h-3.5 text-neutral-500" />
  {language === 'ar' ? 'الأدوات والمعدات المستخدمة في العمل *' : 'Tools & Equipment Used *'}
  </label>
  <textarea
  rows={2}
  value={toolsAndEquipment}
  onChange={e => setToolsAndEquipment(e.target.value)}
  placeholder={language === 'ar' ? 'مثال: رافعة شوكية، معدات لحام، سقالات...' : 'e.g., Forklift, Welding Gear, Scaffolds...'}
  className={inputClass}
  />
  </div>

  {/* SIMOPS Conflict Alert */}
  {simopsConflicts.length > 0 && (
    <div className="md:col-span-2 bg-amber-50 dark:bg-amber-950/30 border-s-4 border-s-amber-500 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-lg text-xs space-y-1 text-start">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
        <span>{language === 'ar' ? '⚠️ تنبيه SIMOPS (عمليات متزامنة نشطة في نفس الموقع):' : '⚠️ SIMOPS Warning (Active Concurrent Operations in location):'}</span>
      </div>
      <p className="text-amber-700 dark:text-amber-400">
        {language === 'ar' 
          ? `يوجد ${simopsConflicts.length} تصريح نشط/قيد الاعتماد بالموقع (${location}):` 
          : `There are ${simopsConflicts.length} active/pending permit(s) in location (${location}):`}
      </p>
      <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 font-mono text-[11px]">
        {simopsConflicts.map(cp => (
          <li key={cp.id}>
            <strong>{cp.id}</strong> — {cp.title} ({cp.type}) [{cp.status}]
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
        {language === 'ar' ? 'يرجى مراجعة تدابير السلامة ومنع التعارض قبل تقديم المسودة.' : 'Please audit hazards and cross-referencing to prevent SIMOPS incidents.'}
      </p>
    </div>
  )}
 {/* Location */}
 <div className="md:col-span-2">
 <label className="block text-xs font-bold text-neutral-500 mb-1.5">{language === 'ar' ? 'موقع العمل بدقة *' : 'Exact Work Location *'}</label>
 <input
 value={location}
 onChange={e => setLocation(e.target.value)}
 placeholder={language === 'ar' ? 'مثال: المبنى C - الطابق 2 - غرفة المضخات' : 'e.g., Building C - Floor 2 - Pump Room'}
 className={inputClass}
 />
 </div>

 {/* Description */}
 <div className="md:col-span-2">
 <label className="block text-xs font-bold text-neutral-500 mb-1.5">{language === 'ar' ? 'وصف تفصيلي للمعدات والمهمة' : 'Detailed Equipment/Task Description'}</label>
 <textarea
 rows={3}
 value={description}
 onChange={e => setDescription(e.target.value)}
 placeholder={language === 'ar' ? 'صف المعدات التي سيتم العمل عليها والإجراءات المخطط لها...' : 'Describe the equipment and planned procedures...'}
 className={inputClass}
 />
 </div>

 {/* Start Date */}
 <div>
 <label className="block text-xs font-bold text-neutral-500 mb-1.5 flex items-center gap-1 justify-start ">
 <CalendarClock className="w-3.5 h-3.5 text-emerald-500" />
 {language === 'ar' ? 'بداية الصلاحية *' : 'Start Date & Time *'}
 </label>
 <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
 </div>

 {/* End Date */}
 <div>
 <label className="block text-xs font-bold text-neutral-500 mb-1.5 flex items-center gap-1 justify-start ">
 <Clock className="w-3.5 h-3.5 text-red-500" />
 {language === 'ar' ? 'نهاية الصلاحية *' : 'End Date & Time *'}
 </label>
 <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
 </div>
  </div>
  {dateRangeError && (
  <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-2">⚠ {dateRangeError}</p>
  )}
  </div>
  )}

  {/* ──── STEP 2: OSHA Checklists ──── */}
  {currentStep === 2 && (
  <div className="space-y-5">
  {sectionTitle(<CheckCircle className="w-4 h-4 text-orange-500" />, 'الخطوة ٢: قوائم التحقق (الإجراءات المطلوب مراجعتها - نظام أوشا)', 'Step 2: Required Safety Checklists (OSHA System)')}

  <div className="bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 font-bold">
  {language === 'ar' ? 'يرجى مراجعة واختيار قوائم التحقق الإلزامية حسب طبيعة العمل:' : 'Please review and select the mandatory checklists based on the work type:'}
  </p>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {[
    { id: 'generalSafety', ar: 'السلامة العامة والوقاية', en: 'General Safety & PPE' },
    { id: 'lotoVerification', ar: 'التحقق من عزل الطاقة (LOTO)', en: 'LOTO Verification' },
    { id: 'confinedSpace', ar: 'دخول أماكن مغلقة', en: 'Confined Space Entry' },
    { id: 'hotWork', ar: 'أعمال ساخنة (قطع/لحام)', en: 'Hot Work' }
  ].map(chk => {
    const isChecked = !!oshaChecklists[chk.id as keyof typeof oshaChecklists];
    return (
    <label key={chk.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
      isChecked 
      ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' 
      : 'border-neutral-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-neutral-600'
    }`}>
      <input 
      type="checkbox" 
      className="w-4 h-4 text-orange-500 focus:ring-orange-500 rounded border-neutral-300"
      checked={isChecked}
      onChange={(e) => {
        setOshaChecklists(prev => {
          const next = { ...prev };
          if (e.target.checked) {
            next[chk.id as keyof typeof oshaChecklists] = {};
          } else {
            delete next[chk.id as keyof typeof oshaChecklists];
          }
          return next;
        });
      }}
      />
      <span className={`text-sm font-bold ${isChecked ? 'text-orange-700 dark:text-orange-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
      {language === 'ar' ? chk.ar : chk.en}
      </span>
    </label>
    );
  })}
  </div>
  </div>

  {/* Checklist Details */}
  {Object.entries(oshaChecklists).filter(([_, itemsMap]) => !!itemsMap).length > 0 && (
    <div className="mt-6 flex flex-col gap-6">
      {Object.entries(oshaChecklists).map(([listId, itemsMap]) => {
        if (!itemsMap) return null;
        const checklistKey = listId as keyof typeof OSHA_CHECKLISTS;
        const listItems = OSHA_CHECKLISTS[checklistKey];
        if (!listItems) return null;
        
        const titleObj = [
          { id: 'generalSafety', ar: 'متطلبات السلامة العامة والوقاية الشخصية', en: 'General Safety & PPE Requirements' },
          { id: 'lotoVerification', ar: 'إجراءات عزل الطاقة (LOTO)', en: 'Energy Isolation (LOTO) Procedures' },
          { id: 'confinedSpace', ar: 'إجراءات الدخول للأماكن المغلقة', en: 'Confined Space Entry Procedures' },
          { id: 'hotWork', ar: 'إجراءات الأعمال الساخنة', en: 'Hot Work Procedures' }
        ].find(t => t.id === listId);

        return (
          <div key={listId} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-neutral-100 dark:bg-neutral-800/80 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {language === 'ar' ? titleObj?.ar : titleObj?.en}
              </h4>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
              {listItems.map((item) => {
                if (item.isHeader) {
                  return (
                    <div key={item.id} className="col-span-1 md:col-span-2 mt-2 border-b border-neutral-200 dark:border-neutral-800 pb-1 mb-1">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{language === 'ar' ? item.labelAr : item.labelEn}</span>
                    </div>
                  );
                }
                const isChecked = !!(itemsMap && itemsMap[item.id as keyof typeof itemsMap]);
                return (
                  <label key={item.id} className="flex items-start gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500 bg-white dark:bg-neutral-900"
                      checked={isChecked}
                      onChange={(e) => {
                        setOshaChecklists(prev => {
                          const currentList = prev[checklistKey] || {};
                          return {
                            ...prev,
                            [checklistKey]: {
                              ...currentList,
                              [item.id]: e.target.checked
                            }
                          };
                        });
                      }}
                    />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white leading-relaxed">
                      {language === 'ar' ? item.labelAr : item.labelEn}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  )}
  </div>
  )}

  {/* ──── STEP 3: Hazards & Controls ──── */}
  {currentStep === 3 && (
  <div className="space-y-5">
  {sectionTitle(<ShieldAlert className="w-4 h-4 text-orange-500" />, 'الخطوة ٣: تقييم المخاطر وتدابير التحكم (Risk Assessment & Control Measures)', 'Step 3: Energy Isolation & HIRA')}

  {/* ELECTRICAL ISOLATION CHECKBOX CARD (NEBOSH / OSHA LOTO) */}
  <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-700/60 p-4 rounded-xl space-y-2 text-start">
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input 
        type="checkbox"
        checked={electricalRequired}
        onChange={(e) => setElectricalRequired(e.target.checked)}
        className="w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500 bg-white dark:bg-neutral-900 cursor-pointer"
      />
      <div>
        <span className="font-extrabold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          {language === 'ar' ? '⚡ يتطلب هذا التصريح عزل مصادر الطاقة الكهربائية (Electrical Isolation / LOTO Required)' : '⚡ Electrical Isolation Required (LOTO Clearance)'}
        </span>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          {language === 'ar' 
            ? 'تفعيل هذا الخيار سيرسل التصريح تلقائياً لإدارة الكهرباء والـ LOTO للمراجعة وفصل القواطع الكهربائية وتثبيت الأقفال قبل البدء.'
            : 'Enabling this option routes the permit to Electrical Dept to perform breaker lockout/tagout prior to execution.'}
        </p>
      </div>
    </label>
  </div>

  {/* HIRA ISO 45001 Form Container */}
  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-6">
    {/* Form Header */}
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
            {language === 'ar' ? 'تحديد المخاطر وتقييمها (HIRA - ISO 45001)' : 'Hazard Identification & Risk Assessment (HIRA - ISO 45001)'}
          </h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {language === 'ar' ? 'إنشاء مصفوفة المخاطر الميدانية، وتطبيق الهرم الرقابي للتحكم (Hierarchy of Controls)، والحد من الحوادث.' : 'Conduct 5x5 Likelihood/Severity risk matrix analyses and map Hierarchy of Controls safeguard measures.'}
        </p>
      </div>
      
      <button 
        type="button"
        onClick={() => setShowInternalHiraForm(!showInternalHiraForm)}
        className="bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
      >
        <Brain className="w-4 h-4" />
        <span>{showInternalHiraForm ? (language === 'ar' ? 'إغلاق النموذج' : 'Close Form') : (language === 'ar' ? 'إجراء تقييم مخاطر HIRA ميداني' : 'Compose HIRA Risk Matrix')}</span>
      </button>
    </div>

    {/* Form Inputs (when expanded) */}
    {showInternalHiraForm && (
      <div className="space-y-6 border-t border-slate-200 dark:border-slate-800 pt-4 text-start">
        {/* Task, Hazard, Consequence, Area */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {language === 'ar' ? 'وصف المهمة / الوظيفة' : 'Task / Job Description'}
            </label>
            <input 
              type="text"
              value={hiraTaskAr}
              onChange={e => setHiraTaskAr(e.target.value)}
              placeholder={title || "مثال: تبديل شفرات دوّار مروحة السحب والترشيح الرئيسية"}
              className="text-start w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {language === 'ar' ? 'الخطر المترتب' : 'Identified Hazard'}
            </label>
            <input 
              type="text"
              value={hiraHazardAr}
              onChange={e => setHiraHazardAr(e.target.value)}
              placeholder="مثال: الانحشار الميكانيكي تحت شفرات المروحة أو تحركها فجأة"
              className="text-start w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {language === 'ar' ? 'العواقب المحتملة' : 'Worst Possible Consequence'}
            </label>
            <input 
              type="text"
              value={hiraConsequenceAr}
              onChange={e => setHiraConsequenceAr(e.target.value)}
              placeholder="مثال: بتر في الأطراف أو تهتك جلدي جراء دوران غير مخطط للمروحة"
              className="text-start w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {language === 'ar' ? 'منطقة العمل بالمصنع' : 'Work Area / Location'}
            </label>
            <input 
              type="text"
              value={hiraAreaAr}
              onChange={e => setHiraAreaAr(e.target.value)}
              placeholder={location || "مثال: برج التسخين المسبق للفرن"}
              className="text-start w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* 5x5 Initial Risk Scoring Matrix */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Brain className="w-4 h-4" />
            <span>{language === 'ar' ? '1. تقييم كود الخطر المبدئي (5X5 RISK ASSESSMENT MATRIX)' : '1. Initial 5x5 Hazard Score Assessment'}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'ar' ? `احتمالية حدوث الخطر (الاحتمالية: ${hiraLikelihood} من 5)` : `Probability Matrix: Likelihood (${hiraLikelihood} of 5)`}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setHiraLikelihood(n)}
                      className={`py-2 text-xs font-mono font-bold rounded border transition-colors ${
                        hiraLikelihood === n 
                          ? 'bg-indigo-600 text-white border-indigo-700' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>{language === 'ar' ? 'مستحيل تقريبًا' : 'Very Unlikely (1)'}</span>
                  <span>{language === 'ar' ? 'مؤكد الحدوث' : 'Highly Likely (5)'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'ar' ? `خطورة الضرر المحتملة (الخطورة: ${hiraSeverity} من 5)` : `Hazard Severity: Severity (${hiraSeverity} of 5)`}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setHiraSeverity(n)}
                      className={`py-2 text-xs font-mono font-bold rounded border transition-colors ${
                        hiraSeverity === n 
                          ? 'bg-indigo-600 text-white border-indigo-700' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>{language === 'ar' ? 'طفيف (بلا ضياع وقت)' : 'Negligible (1)'}</span>
                  <span>{language === 'ar' ? 'كارثي (وفاة/عاهة)' : 'Catastrophic (5)'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center items-center p-4 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'تقييم الخطر الكلي المبدئي' : 'Calculated Risk Rating'}</span>
              <span className={`text-4xl font-mono font-bold px-5 py-2.5 rounded-xl border mt-2 shadow-inner select-none ${getRiskScoreColor(hiraLikelihood * hiraSeverity)}`}>
                {hiraLikelihood * hiraSeverity}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-neutral-400 mt-2">
                {getRiskLevelText(hiraLikelihood * hiraSeverity)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Hierarchy of Controls */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" />
            <span>{language === 'ar' ? '2. الهرمية المعتمدة للتحكم في المخاطر (Hierarchy of Controls)' : '2. Mapping Hierarchy of Controls (NEBOSH Standards)'}</span>
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">1. ELIMINATION | إزالة مادية ملموسة للتهديد</label>
              <input type="text" value={hiraEliminationAr} onChange={e => setHiraEliminationAr(e.target.value)} placeholder="إجراءات إزالة الخطر" className="text-xs p-2.5 w-full rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">2. SUBSTITUTION | استبدال فني بمواد أكثر أماناً</label>
              <input type="text" value={hiraSubstitutionAr} onChange={e => setHiraSubstitutionAr(e.target.value)} placeholder="إجراءات الاستبدال الفني" className="text-xs p-2.5 w-full rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">3. ENGINEERING CONTROLS | تحكم هندسي وأجهزة أمان</label>
              <input type="text" value={hiraEngineeringAr} onChange={e => setHiraEngineeringAr(e.target.value)} placeholder="مثال: تركيب قفل حماية ميكانيكي ومثبت دوران شفرات" className="text-xs p-2.5 w-full rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">4. ADMINISTRATIVE CONTROLS | تدابير إدارية وتصاريح</label>
              <input type="text" value={hiraAdministrativeAr} onChange={e => setHiraAdministrativeAr(e.target.value)} placeholder="مثال: تطبيق عزل الطاقة LOTO وتعيين مراقب سلامة" className="text-xs p-2.5 w-full rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">5. PPE | معدات الوقاية الشخصية الوقائية</label>
              <input type="text" value={hiraPpeAr} onChange={e => setHiraPpeAr(e.target.value)} placeholder="مثال: بدلة حماية، خوذة، نظارات عازلة، قفازات، حذاء سلامة" className="text-xs p-2.5 w-full rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
            </div>
          </div>
        </div>

        {/* 3. Residual Risk Matrix */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>{language === 'ar' ? '3. تقييم كود الخطر المتبقي (Residual Risk Score 5x5)' : '3. Residual Risk Score Assessment'}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'ar' ? `الاحتمالية المتبقية (${hiraResLikelihood} من 5)` : `Residual Likelihood (${hiraResLikelihood} of 5)`}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setHiraResLikelihood(n)}
                      className={`py-2 text-xs font-mono font-bold rounded border transition-colors ${
                        hiraResLikelihood === n 
                          ? 'bg-emerald-600 text-white border-emerald-700' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {language === 'ar' ? `الشدة المتبقية (${hiraResSeverity} من 5)` : `Residual Severity (${hiraResSeverity} of 5)`}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setHiraResSeverity(n)}
                      className={`py-2 text-xs font-mono font-bold rounded border transition-colors ${
                        hiraResSeverity === n 
                          ? 'bg-emerald-600 text-white border-emerald-700' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center items-center p-4 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الخطر المتبقي الكلي' : 'Residual Risk Score'}</span>
              <span className={`text-4xl font-mono font-bold px-5 py-2.5 rounded-xl border mt-2 shadow-inner select-none ${getRiskScoreColor(hiraResLikelihood * hiraResSeverity)}`}>
                {hiraResLikelihood * hiraResSeverity}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-neutral-400 mt-2">
                {getRiskLevelText(hiraResLikelihood * hiraResSeverity)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSaveHiraAssessment}
            className="bg-orange-600 hover:bg-orange-500 font-bold text-white text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{language === 'ar' ? 'حفظ واعتماد التقييم الداخلي للتصريح (ISO 45001)' : 'Save & Attach Internal HIRA'}</span>
          </button>
        </div>
      </div>
    )}

    {/* Display Attached Custom HIRA Summary if created */}
    {customHira && (
      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {language === 'ar' ? `تم ربط التقييم الداخلي [${customHira.id}] للتصريح بنجاح` : `Internal HIRA attached [${customHira.id}]`}
            </span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full">
            {language === 'ar' ? 'معتمد ومثبت' : 'Certified'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">{language === 'ar' ? 'الخطر الرئيسي:' : 'Main Hazard:'}</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{customHira.hazardAr}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">{language === 'ar' ? 'الخطر الأولي -> المتبقي:' : 'Risk Score:'}</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{customHira.initialRiskScore} ➔ {customHira.residualRiskScore} (مقبول)</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">{language === 'ar' ? 'التحكم الهندسي الإداري:' : 'Controls:'}</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{customHira.controls.engineeringAr || customHira.controls.administrativeAr}</p>
          </div>
        </div>
      </div>
    )}
  </div>

{/* Gas Readings (conditional) */}
 {(type === 'HOT' || type === 'CONFINED') && (
 <div className="bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 p-4 rounded-xl">
 <label className="block text-xs font-bold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-1.5 justify-start ">
 <Gauge className="w-4 h-4" />
 {language === 'ar' ? 'قراءات الغازات الحرجة (ما قبل الدخول)' : 'Critical Gas Readings (Pre-entry)'}
 </label>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-[10px] font-bold text-neutral-500">LEL %</span>
 <span className="text-[9px] text-emerald-600 font-mono">{language === 'ar' ? 'الحد الآمن: < 10%' : 'Safe: < 10%'}</span>
 </div>
 <input type="number" placeholder="0" value={gasReadings.lel || ''} onChange={e => setGasReadings({...gasReadings, lel: Number(e.target.value)})} className="w-full text-sm p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-mono" />
 </div>
 <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-[10px] font-bold text-neutral-500">O₂ %</span>
 <span className="text-[9px] text-emerald-600 font-mono">{language === 'ar' ? 'الحد الآمن: 19.5-23.5%' : 'Safe: 19.5-23.5%'}</span>
 </div>
 <input type="number" step="0.1" placeholder="20.9" value={gasReadings.o2 || ''} onChange={e => setGasReadings({...gasReadings, o2: Number(e.target.value)})} className="w-full text-sm p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-mono" />
 </div>
 <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-[10px] font-bold text-neutral-500">H₂S ppm</span>
 <span className="text-[9px] text-emerald-600 font-mono">{language === 'ar' ? 'الحد الآمن: < 10' : 'Safe: < 10 ppm'}</span>
 </div>
 <input type="number" placeholder="0" value={gasReadings.h2s || ''} onChange={e => setGasReadings({...gasReadings, h2s: Number(e.target.value)})} className="w-full text-sm p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-mono" />
 </div>
 </div>
 <div className="mt-3">
 <label className="block text-[10px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'اسم فاحص الغاز' : 'Gas Tester Name'}</label>
 <input
 value={gasReadings.testerName || ''}
 onChange={e => setGasReadings({...gasReadings, testerName: e.target.value})}
 placeholder={language === 'ar' ? 'اسم المسؤول عن الفحص...' : 'Name of gas tester...'}
 className="w-full text-xs p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30"
 />
 </div>
 </div>
 )}

  {/* OSHA Specific Checklists */}
  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl">
    <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5 justify-start ">
      <CheckCircle className="w-4 h-4" />
      {language === 'ar' ? 'قوائم فحص OSHA (إلزامي)' : 'OSHA Checklists (Mandatory)'}
    </label>
    
    <div className="space-y-4">
      {Object.entries(OSHA_CHECKLISTS).map(([category, items]) => {
        // Automatically determine which checklists to show based on Permit Type and Selected Hazards
        const requiresHotWork = type === 'HOT' || choosenHazards.includes('fire') || choosenHazards.includes('heat_burn');
        const requiresConfined = type === 'CONFINED' || choosenHazards.includes('toxic_gas');
        const requiresLoto = type === 'LOTO' || type === 'ELECTRICAL' || choosenHazards.includes('electrocution') || choosenHazards.includes('entrapment');
        
        if (category === 'lotoVerification' && !requiresLoto) return null;
        if (category === 'hotWork' && !requiresHotWork) return null;
        if (category === 'confinedSpace' && !requiresConfined) return null;
        // generalSafety always shows

        const catLabels: Record<string, {ar: string, en: string}> = {
          lotoVerification: { ar: 'التحقق من عزل الطاقة (LOTO)', en: 'LOTO Verification' },
          confinedSpace: { ar: 'الأماكن المغلقة', en: 'Confined Space' },
          hotWork: { ar: 'العمل الساخن', en: 'Hot Work' },
          generalSafety: { ar: 'السلامة العامة', en: 'General Safety' }
        };

        return (
          <div key={category} className="border border-emerald-100 dark:border-emerald-900/30 rounded-lg overflow-hidden">
            <div className="bg-emerald-100/50 dark:bg-emerald-900/50 px-3 py-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              {language === 'ar' ? catLabels[category]?.ar : catLabels[category]?.en}
            </div>
            <div className="p-3 bg-white dark:bg-neutral-900 grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map(item => {
                const isChecked = !!oshaChecklists[category as keyof typeof oshaChecklists]?.[item.id];
                return (
                  <label key={item.id} className={`flex items-start gap-2 p-2 border rounded text-xs cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                    <input 
                      type="checkbox" 
                      className="mt-0.5"
                      checked={isChecked}
                      onChange={e => {
                        setOshaChecklists(prev => ({
                          ...prev,
                          [category]: {
                            ...prev[category as keyof typeof oshaChecklists],
                            [item.id]: e.target.checked
                          }
                        }));
                      }}
                    />
                    <span className={isChecked ? 'text-emerald-800 dark:text-emerald-300 font-bold' : 'text-neutral-600 dark:text-neutral-400'}>
                      {language === 'ar' ? item.labelAr : item.labelEn}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
        </div>
  </div>
  
  </div>
  )}

  {/* ──── STEP 4: Workers & PPE ──── */}
 {currentStep === 4 && (
 <div className="space-y-5">
 {sectionTitle(<Users className="w-4 h-4 text-orange-500" />, 'الخطوة ٤: فريق العمل', 'Step 4: Team')}

 {/* Worker selector */}
 <div>
 <label className="block text-xs font-bold text-neutral-500 mb-1.5">{language === 'ar' ? 'إضافة عامل من قاعدة البيانات *' : 'Add Worker from Database *'}</label>
 <div className="flex gap-2">
 <select value={selectedWorkerId} onChange={e => setSelectedWorkerId(e.target.value)} className={`flex-1 ${inputClass} cursor-pointer`}>
 <option value="">{language === 'ar' ? '-- اختر عامل --' : '-- Select Worker --'}</option>
 {companyWorkersList.filter(w => !competencyWorkers.find(cw => cw.id === w.id)).map(w => (
 <option key={w.id} value={w.id}>{w.name} — {w.role}</option>
 ))}
 </select>
 <button
 type="button"
 onClick={handleAddWorker}
 disabled={!selectedWorkerId}
 className="bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg px-5 py-2.5 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" />
 {language === 'ar' ? 'إضافة' : 'Add'}
 </button>
 </div>
 </div>

  {/* External Worker selector */}
  <div className="mt-4 border-t border-neutral-200 dark:border-neutral-800 pt-4">
    <label className="block text-xs font-bold text-neutral-500 mb-1.5">{language === 'ar' ? 'إضافة عامل من خارج الشركة (مقاول)' : 'Add External Worker (Contractor)'}</label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <input 
        placeholder={language === 'ar' ? 'اسم العامل...' : 'Worker Name...'}
        value={externalWorkerName}
        onChange={e => setExternalWorkerName(e.target.value)}
        className={inputClass}
      />
      <div className="flex gap-2">
        <input 
          placeholder={language === 'ar' ? 'الوظيفة / الشركة...' : 'Role / Company...'}
          value={externalWorkerRole}
          onChange={e => setExternalWorkerRole(e.target.value)}
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="button"
          onClick={handleAddExternalWorker}
          disabled={!externalWorkerName.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg px-5 py-2.5 text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {language === 'ar' ? 'إضافة' : 'Add'}
        </button>
      </div>
    </div>
  </div>

 {/* Workers list */}
 <div className="space-y-2">
 {competencyWorkers.map(w => (
 <div key={w.id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-950 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs group hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors">
 <div className="flex items-center gap-2 ">
 <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 font-bold text-sm">
 {w.name.charAt(0)}
 </div>
 <div className="text-start">
 <span className="font-bold text-neutral-800 dark:text-neutral-200 block">{w.name}</span>
 <span className="text-neutral-400 text-[10px]">{w.role}</span>
 </div>
 </div>
 <div className="flex items-center gap-2 ">
 <button type="button" onClick={() => setCompetencyWorkers(prev => prev.filter(x => x.id !== w.id))} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
 <Trash2 className="w-4 h-4" />
 </button>
 {w.competencyStatus === 'QUALIFIED' && (
 <span className="text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
 <CheckCircle className="w-3.5 h-3.5" /> {language === 'ar' ? 'مؤهل' : 'Qualified'}
 </span>
 )}
 {w.competencyStatus === 'EXPIRED' && (
 <span className="text-red-700 bg-red-100 dark:bg-red-950/50 dark:text-red-400 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
 <AlertTriangle className="w-3.5 h-3.5" /> {language === 'ar' ? 'منتهية الصلاحية' : 'Cert Expired'}
 </span>
 )}
 {w.competencyStatus === 'NOT_REQUIRED' && (
 <span className="text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 px-2.5 py-1 rounded-full font-bold">
 {language === 'ar' ? 'غير مطلوبة' : 'N/A'}
 </span>
 )}
 </div>
 </div>
 ))}
 {competencyWorkers.length === 0 && (
 <div className="text-center py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
 <Users className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
 <p className="text-xs text-neutral-400">{language === 'ar' ? 'لم يتم إضافة أي عامل — اختر من القائمة أعلاه' : 'No workers added yet — select from the dropdown above'}</p>
 </div>
 )}
 </div>

  {/* Toolbox Talk (TBT) Attendance & Briefing Card */}
  <div className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 p-4 rounded-xl space-y-3 text-start">
    <label className="block text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5 justify-start">
      <Users className="w-4 h-4 text-sky-600" />
      {language === 'ar' ? 'توثيق اجتماع السلامة (Toolbox Talk - TBT)' : 'Toolbox Talk (TBT) Briefing Record'}
    </label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
      <div>
        <label className="block text-[11px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'موضوع اجتماع السلامة (Topic)' : 'Safety Topic'}</label>
        <input 
          value={tbtTopic}
          onChange={e => setTbtTopic(e.target.value)}
          placeholder={language === 'ar' ? 'مثال: مخاطر السقوط والغازات السامة...' : 'e.g. Fall risks & toxic gas precautions...'}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-[11px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'مسؤول القاء اجتماع السلامة (Conductor)' : 'TBT Conductor'}</label>
        <input 
          value={tbtConductor}
          onChange={e => setTbtConductor(e.target.value)}
          placeholder={language === 'ar' ? 'اسم مشرف السلامة / رئيس الفريق...' : 'Safety Supervisor / Team Lead name...'}
          className={inputClass}
        />
      </div>
    </div>
    {competencyWorkers.length > 0 && (
      <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-sky-100 dark:border-sky-900/30 text-[11px]">
        <span className="font-bold text-sky-700 dark:text-sky-400 block mb-1.5">
          {language === 'ar'
            ? `سجل الحضور — كل عامل يجب أن يقر بحضوره شخصياً (${tbtAcknowledgedIds.size}/${competencyWorkers.length}):`
            : `Attendance Register — each worker must individually acknowledge (${tbtAcknowledgedIds.size}/${competencyWorkers.length}):`}
        </span>
        <div className="flex flex-col gap-1">
          {competencyWorkers.map(cw => (
            <label key={cw.id} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-transparent hover:border-sky-100 dark:hover:border-sky-900/40">
              <input
                type="checkbox"
                checked={tbtAcknowledgedIds.has(cw.id)}
                onChange={() => toggleTbtAck(cw.id)}
                className="w-3.5 h-3.5"
              />
              <span className={tbtAcknowledgedIds.has(cw.id) ? 'font-semibold text-sky-800 dark:text-sky-300' : 'text-neutral-500'}>
                {cw.name}
              </span>
              <span className="text-neutral-400">
                {language === 'ar' ? '— أقر بحضور الإحاطة وفهم المخاطر' : '— acknowledges attending & understanding the briefing'}
              </span>
            </label>
          ))}
        </div>
      </div>
    )}
  </div>

 {/* PPE */}
 <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
 <label className="block text-xs font-bold text-neutral-500 mb-3 flex items-center gap-1.5 justify-start ">
 <ShieldCheck className="w-4 h-4 text-emerald-500" />
 {language === 'ar' ? 'معدات الحماية الشخصية المطلوبة (PPE)' : 'Required Personal Protective Equipment (PPE)'}
 </label>
 <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
 {STANDARD_PPES.map(ppe => (
 <label
 key={ppe.id}
 className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-all text-start ${
 choosenPpes.includes(ppe.id)
 ? 'bg-orange-50 border-orange-400 dark:bg-orange-950/30 dark:border-orange-800 shadow-sm'
 : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
 }`}
 >
 <input type="checkbox" checked={choosenPpes.includes(ppe.id)} onChange={() => handleTogglePpe(ppe.id)} className="hidden" />
 <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
 choosenPpes.includes(ppe.id) ? 'bg-orange-500 border-orange-500' : 'border-neutral-300 dark:border-neutral-600'
 }`}>
 {choosenPpes.includes(ppe.id) && <CheckCircle className="w-3 h-3 text-white" />}
 </div>
 <span className={`text-[10px] font-bold leading-tight ${
 choosenPpes.includes(ppe.id) ? 'text-orange-700 dark:text-orange-400' : 'text-neutral-600 dark:text-neutral-400'
 }`}>
 {language === 'ar' ? ppe.labelAr : ppe.labelEn}
 </span>
 </label>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* ──── STEP 5: Emergency, Signatures & Review ──── */}
 {currentStep === 5 && (
 <div className="space-y-5">
 {sectionTitle(<PenLine className="w-4 h-4 text-orange-500" />, 'الخطوة ٥: الطوارئ وتواقيع بدء العمل', 'Step 5: Emergency & Start Signatures')}

 {/* Emergency info */}
 <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-4 rounded-xl">
 <label className="block text-xs font-bold text-red-700 dark:border-red-400 mb-3 flex items-center gap-1.5 justify-start ">
 <Siren className="w-4 h-4" />
 {language === 'ar' ? 'معلومات الطوارئ' : 'Emergency Information'}
 </label>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'جهة الاتصال أثناء الطوارئ' : 'Emergency Contact'}</label>
 <input
 value={emergencyContact}
 onChange={e => setEmergencyContact(e.target.value)}
 placeholder={language === 'ar' ? 'رقم الهاتف / تردد اللاسلكي...' : 'Phone / Radio Channel...'}
 className="w-full text-xs p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
 />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'نقطة التجمع' : 'Assembly Point'}</label>
 <input
 value={assemblyPoint}
 onChange={e => setAssemblyPoint(e.target.value)}
 placeholder={language === 'ar' ? 'مثال: نقطة التجمع A بجانب البوابة الرئيسية' : 'e.g., Muster Point A near Main Gate'}
 className="w-full text-xs p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
 />
 </div>
 <div className="md:col-span-2">
 <label className="block text-[10px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'أقرب مركز إسعاف طبي' : 'Nearest Medical Facility'}</label>
 <input
 value={nearestMedicalFacility}
 onChange={e => setNearestMedicalFacility(e.target.value)}
 placeholder={language === 'ar' ? 'مثال: عيادة الموقع الرئيسية / مستشفى المدينة' : 'e.g., Main Site Clinic / City Hospital'}
 className="w-full text-xs p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
 />
 </div>
 </div>

 {type === 'CONFINED' && (
 <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-900/30 space-y-2.5">
 <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase">
 {language === 'ar' ? 'جاهزية الإنقاذ (إلزامي للأماكن المغلقة — OSHA 1910.146)' : 'Rescue Readiness (Mandatory for Confined Spaces — OSHA 1910.146)'}
 </span>
 <label className="flex items-center gap-2 text-xs cursor-pointer">
 <input type="checkbox" checked={rescueEquipmentOnStandby} onChange={e => setRescueEquipmentOnStandby(e.target.checked)} className="w-4 h-4" />
 {language === 'ar' ? 'معدات الإنقاذ (حامل جسم / رافعة ثلاثية / حبل إنقاذ) جاهزة وعلى استعداد عند الفتحة' : 'Rescue equipment (harness/tripod/retrieval line) is staged and ready at the entry point'}
 </label>
 <div>
 <label className="block text-[10px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'وسيلة الاتصال مع العامل بالداخل' : 'Communication Method with Entrant'}</label>
 <select
 value={communicationMethod}
 onChange={e => setCommunicationMethod(e.target.value)}
 className="w-full text-xs p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none"
 >
 <option value="">{language === 'ar' ? '— اختر —' : '— Select —'}</option>
 {COMMUNICATION_METHODS.map(m => (
 <option key={m.id} value={m.id}>{language === 'ar' ? m.labelAr : m.labelEn}</option>
 ))}
 </select>
 </div>
 </div>
 )}
 </div>

 {/* Signatures */}
 <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200 dark:border-indigo-900/30 p-4 rounded-xl">
 <label className="block text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-1.5 justify-start ">
 <PenLine className="w-4 h-4" />
 {language === 'ar' ? 'التوقيعات الرقمية (إلزامية)' : 'Digital Signatures (Required)'}
 </label>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <span className="text-[10px] text-neutral-500 font-bold block mb-1">{language === 'ar' ? 'مُصدر التصريح (تلقائي)' : 'Permit Issuer (Auto)'}</span>
 <input
 readOnly
 value={signatures.issuerName || ''}
 className="w-full text-xs p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed font-bold"
 />
 </div>
 <div>
 <span className="text-[10px] text-neutral-500 font-bold block mb-1">{language === 'ar' ? 'توقيع مشرف العمل *' : 'Work Supervisor Signature *'}</span>
 <input
 placeholder={language === 'ar' ? 'اكتب اسمك الكامل للاستلام...' : 'Type full name to sign...'}
 value={signatures.receiverName || ''}
 onChange={e => setSignatures({ ...signatures, receiverName: e.target.value, receiverSignedAt: new Date().toISOString() })}
 className={`w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
 signatures.receiverName ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950'
 }`}
 />
 </div>
 </div>
 </div>

 {/* Pre-submission Summary */}
 <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-xl border border-orange-200 dark:border-orange-900/50">
 <h4 className="font-extrabold text-orange-700 dark:text-orange-400 mb-3 text-sm flex items-center gap-1.5 justify-start ">
 <Eye className="w-4 h-4" />
 {language === 'ar' ? 'ملخص المراجعة النهائية' : 'Final Review Summary'}
 </h4>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
 {[
 { labelAr: 'رقم التصريح', labelEn: 'Permit #', value: permitId },
 { labelAr: 'العنوان', labelEn: 'Title', value: title || '—' },
 { labelAr: 'التصنيف', labelEn: 'Type', value: language === 'ar' ? PERMIT_TYPES_INFO[type].labelAr : PERMIT_TYPES_INFO[type].labelEn },
 { labelAr: 'الموقع', labelEn: 'Location', value: location || '—' },
 { labelAr: 'بداية الصلاحية', labelEn: 'Start', value: startDate.replace('T', ' ') },
 { labelAr: 'نهاية الصلاحية', labelEn: 'End', value: endDate.replace('T', ' ') },
 { labelAr: 'المخاطر المحددة', labelEn: 'Hazards', value: `${choosenHazards.length}` },
 { labelAr: 'عدد العمال', labelEn: 'Workers', value: `${competencyWorkers.length}` },
 { labelAr: 'معدات PPE', labelEn: 'PPE Items', value: `${choosenPpes.length}` },
 { labelAr: 'تقييم HIRA', labelEn: 'HIRA', value: linkedHiraId || (language === 'ar' ? 'غير مربوط' : 'Not linked') },
 { labelAr: 'التوقيعات', labelEn: 'Signatures', value: `${[signatures.issuerName, signatures.siteManagerName, signatures.receiverName].filter(Boolean).length}/3` },
 ].map((item, idx) => (
 <div key={idx} className="bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-orange-100 dark:border-orange-900/30">
 <p className="text-[10px] text-neutral-400 mb-0.5">{language === 'ar' ? item.labelAr : item.labelEn}</p>
 <p className="font-bold text-neutral-900 dark:text-neutral-200 truncate">{item.value}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 </div>

 {/* ─── Footer Navigation ────────────────────────────────────────────── */}
 <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-between items-center ">
 {currentStep < totalSteps ? (
 <button
 type="button"
 onClick={nextStep}
 className="flex items-center justify-center gap-1.5 px-7 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] cursor-pointer"
 >
 <span>{language === 'ar' ? 'التالي' : 'Next'}</span>
 <ArrowLeft className="w-4 h-4" />
 </button>
 ) : (
 <button
 type="button"
 onClick={handleSubmit}
 className="flex items-center justify-center gap-1.5 px-7 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
 >
 <CheckCircle className="w-4 h-4" />
 <span>{language === 'ar' ? 'مراجعة وإرسال المسودة' : 'Review & Submit Draft'}</span>
 </button>
 )}

 {currentStep > 1 ? (
 <button
 type="button"
 onClick={prevStep}
 className="flex items-center justify-center gap-1.5 px-5 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-700"
 >
 <ArrowRight className="w-4 h-4" />
 <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
 </button>
 ) : (
 <button type="button" onClick={onCancel} className="px-5 py-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs font-bold transition-colors">
 {language === 'ar' ? 'إلغاء' : 'Cancel'}
 </button>
 )}
 </div>

 
 

  </div>
);
};
