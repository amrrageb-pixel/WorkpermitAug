import React from 'react';
import { Incident, IncidentType, IncidentStatus, HSE_Severity, CapaItem, SandboxRole, UserProfile, AttachmentInfo, Language } from '../types';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, 
  Plus, Calendar, MapPin, User, FileText, ChevronRight, 
  Workflow, Trash2, CheckCircle, HelpCircle, ArrowLeft, BrainCircuit, BarChart3, Download, RefreshCw, Printer, Copy,
  UploadCloud, X, Eye, Paperclip
} from 'lucide-react';

interface IncidentManagerProps {
  incidents: Incident[];
  onAddIncident: (inc: Incident) => void;
  onUpdateIncident: (inc: Incident) => void;
  onDeleteIncident: (id: string) => void;
  currentRole: SandboxRole;
  language: Language;
  currentUser: UserProfile;
  users: UserProfile[];
}

export const IncidentManager: React.FC<IncidentManagerProps> = ({
  incidents,
  onAddIncident,
  onUpdateIncident,
  onDeleteIncident,
  currentRole,
  language,
  currentUser,
  users
}) => {
  const [activeView, setActiveView] = React.useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [selectedIncId, setSelectedIncId] = React.useState<string | null>(null);

  // Attachment states for the report form
  const [formAttachments, setFormAttachments] = React.useState<AttachmentInfo[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = React.useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = React.useState<string>('');

  // Form states
  const [titleEn, setTitleEn] = React.useState('');
  const [titleAr, setTitleAr] = React.useState('');
  const [type, setType] = React.useState<IncidentType>('NEAR_MISS');
  const [date, setDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = React.useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [locationEn, setLocationEn] = React.useState('');
  const [locationAr, setLocationAr] = React.useState('');
  const [descriptionEn, setDescriptionEn] = React.useState('');
  const [descriptionAr, setDescriptionAr] = React.useState('');
  const [severity, setSeverity] = React.useState<HSE_Severity>('LOW');

  // RCA 5 Whys state (for active edit or view)
  const [why1En, setWhy1En] = React.useState('');
  const [why1Ar, setWhy1Ar] = React.useState('');
  const [why2En, setWhy2En] = React.useState('');
  const [why2Ar, setWhy2Ar] = React.useState('');
  const [why3En, setWhy3En] = React.useState('');
  const [why3Ar, setWhy3Ar] = React.useState('');
  const [why4En, setWhy4En] = React.useState('');
  const [why4Ar, setWhy4Ar] = React.useState('');
  const [why5En, setWhy5En] = React.useState('');
  const [why5Ar, setWhy5Ar] = React.useState('');
  const [rootCauseEn, setRootCauseEn] = React.useState('');
  const [rootCauseAr, setRootCauseAr] = React.useState('');

  // CAPA State
  const [capaTextEn, setCapaTextEn] = React.useState('');
  const [capaTextAr, setCapaTextAr] = React.useState('');
  const [capaDeptEn, setCapaDeptEn] = React.useState('Mechanical Maintenance');
  const [capaDeptAr, setCapaDeptAr] = React.useState('الصيانة الميكانيكية');
  const [capaDue, setCapaDue] = React.useState(() => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    return future.toISOString().split('T')[0];
  });

  const activeIncident = incidents.find(i => i.id === selectedIncId);

  const [selectedMonthFilter, setSelectedMonthFilter] = React.useState<string>(() => {
    const dObj = new Date();
    return `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showExportModal, setShowExportModal] = React.useState<boolean>(false);
  const [resetCompletedMessage, setResetCompletedMessage] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const getMonthAndSubOffset = (offset: number) => {
    const tempDate = new Date();
    tempDate.setMonth(tempDate.getMonth() + offset);
    const mm = String(tempDate.getMonth() + 1).padStart(2, '0');
    const yyyy = tempDate.getFullYear();
    return `${yyyy}-${mm}`;
  };

  const currentMonthStr = getMonthAndSubOffset(0);
  const prevMonthStr = getMonthAndSubOffset(-1);
  const nextMonthStr = getMonthAndSubOffset(1);

  const formatMonthName = (mStr: string) => {
    if (mStr === 'ALL') return language === 'ar' ? 'جميع الأوقات (تراكمي)' : 'All Time (Cumulative)';
    const [y, mPrefix] = mStr.split('-');
    const monthsAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthsEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const mIdx = parseInt(mPrefix, 10) - 1;
    if (language === 'ar') {
      return `${monthsAr[mIdx]} ${y}`;
    }
    return `${monthsEn[mIdx]} ${y}`;
  };

  const handleSimulateMonthReset = () => {
    // For all incidents in the current month, change their date's prefix to the previous month
    const updatedIncidents = incidents.map(inc => {
      if (inc.date && inc.date.startsWith(currentMonthStr)) {
        const remainingDate = inc.date.substring(7); // e.g., "-02" from "2026-06-02"
        return {
          ...inc,
          date: `${prevMonthStr}${remainingDate}`
        };
      }
      return inc;
    });
    
    // Save to parent state
    updatedIncidents.forEach(inc => onUpdateIncident(inc));
    
    setResetCompletedMessage(
      language === 'ar' 
        ? 'تمت تصفير جميع حسابات الأفراد للشهر الحالي ونقل التاريخ للشهر الفائت بنجاح.' 
        : 'All current month claims migrated and counters reset to zero successfully.'
    );
    
    setTimeout(() => {
      setResetCompletedMessage(null);
    }, 4000);
  };

  const handleCopyCsvData = () => {
    const header = language === 'ar' 
      ? 'رمز الموظف,الاسم الكامل,حوادث عمل,شبه حوادث,الإجمالي في الفترة,الإجمالي التراكمي' 
      : 'Employee Code,Full Name,Accident Count,Near Miss Count,Period Total,All-Time Total';
    
    const rows = users.map(u => {
      const activeStats = (incidents || []).filter(inc => {
        if (selectedMonthFilter !== 'ALL' && !inc.date.startsWith(selectedMonthFilter)) return false;
        return inc.reportedByEmpCode === u.empCode || inc.reportedByName === u.fullNameEn || inc.reportedByName === u.fullNameAr;
      });
      const userAccidents = activeStats.filter(i => i.type === 'ACCIDENT').length;
      const userNearMisses = activeStats.filter(i => i.type === 'NEAR_MISS').length;
      const periodTotal = activeStats.length;
      
      const allTimeTotal = (incidents || []).filter(inc => 
        inc.reportedByEmpCode === u.empCode || inc.reportedByName === u.fullNameEn || inc.reportedByName === u.fullNameAr
      ).length;
      
      const name = language === 'ar' ? u.fullNameAr : u.fullNameEn;
      return `${u.empCode},"${name}",${userAccidents},${userNearMisses},${periodTotal},${allTimeTotal}`;
    });

    const csvContent = [header, ...rows].join('\n');
    navigator.clipboard.writeText(csvContent);
    setToastMessage(language === 'ar' ? 'تم نسخ التقرير الإحصائي كـ CSV للحافظة!' : 'Safety stats copied to clipboard as CSV!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  React.useEffect(() => {
    if (activeIncident) {
      setWhy1En(activeIncident.why1En || '');
      setWhy1Ar(activeIncident.why1Ar || '');
      setWhy2En(activeIncident.why2En || '');
      setWhy2Ar(activeIncident.why2Ar || '');
      setWhy3En(activeIncident.why3En || '');
      setWhy3Ar(activeIncident.why3Ar || '');
      setWhy4En(activeIncident.why4En || '');
      setWhy4Ar(activeIncident.why4Ar || '');
      setWhy5En(activeIncident.why5En || '');
      setWhy5Ar(activeIncident.why5Ar || '');
      setRootCauseEn(activeIncident.rootCauseEn || '');
      setRootCauseAr(activeIncident.rootCauseAr || '');
    }
  }, [selectedIncId, activeIncident]);

  const handleFilesSelection = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const sizeStr = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
          : `${(file.size / 1024).toFixed(0)} KB`;
        
        const newAttachment: AttachmentInfo = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          dataUrl,
          size: sizeStr
        };
        setFormAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleOpenForm = () => {
    setFormAttachments([]);
    setActiveView('FORM');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn || !titleEn.trim()) return;

    const newIncValue: Incident = {
      id: `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      titleEn,
      titleAr: titleAr || titleEn,
      type,
      date,
      time,
      locationEn,
      locationAr: locationAr || locationEn,
      descriptionEn,
      descriptionAr: descriptionAr || descriptionEn,
      severity,
      reportedByName: currentUser.fullNameEn,
      reportedByEmpCode: currentUser.empCode,
      reportedByRoleAr: currentUser.roleAr,
      reportedByRoleEn: currentUser.roleEn,
      status: 'REPORTED',
      capaActions: [],
      attachments: formAttachments
    };

    onAddIncident(newIncValue);
    
    // reset form
    setTitleEn('');
    setTitleAr('');
    setLocationEn('');
    setLocationAr('');
    setDescriptionEn('');
    setDescriptionAr('');
    setSeverity('LOW');
    setType('NEAR_MISS');
    setFormAttachments([]);

    setActiveView('LIST');
  };

  const handleSaveRca = () => {
    if (!activeIncident) return;
    const updated: Incident = {
      ...activeIncident,
      why1En, why1Ar,
      why2En, why2Ar,
      why3En, why3Ar,
      why4En, why4Ar,
      why5En, why5Ar,
      rootCauseEn, rootCauseAr,
      status: activeIncident.status === 'REPORTED' ? 'INVESTIGATING' : activeIncident.status
    };
    onUpdateIncident(updated);
  };

  const handleAddCapaAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident || !capaTextEn.trim()) return;

    const newCapa: CapaItem = {
      id: `CAPA-${Math.floor(1000 + Math.random() * 9000)}`,
      actionEn: capaTextEn,
      actionAr: capaTextAr || capaTextEn,
      assignedDepartmentEn: capaDeptEn,
      assignedDepartmentAr: capaDeptAr,
      dueDate: capaDue,
      status: 'PENDING'
    };

    const updated: Incident = {
      ...activeIncident,
      capaActions: [...activeIncident.capaActions, newCapa],
      status: 'CAPA_PENDING'
    };

    onUpdateIncident(updated);
    setCapaTextEn('');
    setCapaTextAr('');
  };

  const handleToggleCapaStatus = (capaId: string) => {
    if (!activeIncident) return;
    const updatedActions = activeIncident.capaActions.map(action => {
      if (action.id === capaId) {
        return { ...action, status: action.status === 'PENDING' ? 'DONE' : 'PENDING' } as CapaItem;
      }
      return action;
    });

    // Check if all actions are done, then default auto status transition
    const allDone = updatedActions.every(a => a.status === 'DONE');

    const updated: Incident = {
      ...activeIncident,
      capaActions: updatedActions,
      status: allDone ? 'CLOSED' : 'CAPA_PENDING'
    };
    onUpdateIncident(updated);
  };

  const handleCloseIncident = () => {
    if (!activeIncident) return;
    const updated: Incident = {
      ...activeIncident,
      status: 'CLOSED',
      closedAt: new Date().toISOString().split('T')[0],
      closedBy: 'Eng. Asaad Al-Shamrani (Safety Authority)'
    };
    onUpdateIncident(updated);
  };

  const triggerAutoRca = async () => {
    if (!activeIncident) return;
    // Pre-populate with typical safety recommendations
    setWhy1En(`Equipment operating near abrasive materials without proper guards fitted or secure fencing.`);
    setWhy1Ar(`تشغيل المعدة بالقرب من مواد كاشطة دون تركيب حواجز حماية ملائمة أو سياج مادي.`);
    setWhy2En(`Maintenance operations carried out with short cut focus and lack of active LOTO compliance inspects.`);
    setWhy2Ar(`إجراء عمليات الصيانة بالتركيز على اختصار الوقت وضعف الرقابة الفعلية على بروتوكول عزل الطاقة LOTO.`);
    setWhy3En(`Subcontractor was not comprehensively trained in the site specific isolation checklist.`);
    setWhy3Ar(`مقاولو الباطن لم يتلقوا تدريباً كافياً وشاملاً على قائمة التحقق الخاصة بعزل مصانع الإسمنت.`);
    setWhy4En(`Supervisors did not physically verify dead state of breaker beforehand.`);
    setWhy4Ar(`المشرفون لم يتحققوا ماديًا من حالة خلو الجهد الكهربائي في الموقع مسبقاً قبل المباشرة.`);
    setWhy5En(`Production targets forced hasty handovers of machinery lines.`);
    setWhy5Ar(`أهداف خطوط الإنتاج والتشغيل المستمر فرضت تدويرًا واستلامًا مستعجلًا للأجهزة.`);
    setRootCauseEn(`Failure of administrative shift boundary controls on subcontractor isolations.`);
    setRootCauseAr(`فشل في ضوابط تبديل ورديات العمل الإدارية وعزل مقاولي الباطن.`);
  };

  // Helper text getters
  const getTypeLabel = (t: IncidentType) => {
    switch(t) {
      case 'NEAR_MISS': return language === 'ar' ? 'شبه حادث | Near Miss' : 'Near Miss | شبه حادث';
      case 'ACCIDENT': return language === 'ar' ? 'حادث عمل | Accident' : 'Accident | حادث عمل';
      case 'PROPERTY_DAMAGE': return language === 'ar' ? 'تلف ممتلكات | Property Damage' : 'Property Damage | تلف ممتلكات';
      case 'ENVIRONMENTAL': return language === 'ar' ? 'بيئي | Environmental' : 'Environmental | بيئي';
    }
  };

  const getSeverityBadge = (s: HSE_Severity) => {
    switch(s) {
      case 'LOW':
        return <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">{language === 'ar' ? 'منخفضة | Low' : 'Low | منخفضة'}</span>;
      case 'MEDIUM':
        return <span className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border border-yellow-250 dark:border-yellow-900 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">{language === 'ar' ? 'متوسطة | Medium' : 'Medium | متوسطة'}</span>;
      case 'HIGH':
        return <span className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">{language === 'ar' ? 'عالية | High' : 'High | عالية'}</span>;
      case 'CRITICAL':
        return <span className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">{language === 'ar' ? 'جسيمة | Critical' : 'Critical | جسيمة'}</span>;
    }
  };

  const getStatusBadge = (st: IncidentStatus) => {
    switch(st) {
      case 'REPORTED':
        return <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs font-semibold px-2.5 py-1 rounded-md">{language === 'ar' ? 'تم التبليغ' : 'Reported'}</span>;
      case 'INVESTIGATING':
        return <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-xs font-semibold px-2.5 py-1 rounded-md">{language === 'ar' ? 'قيد التحقيق (RCA)' : 'Investigating'}</span>;
      case 'CAPA_PENDING':
        return <span className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900 text-xs font-semibold px-2.5 py-1 rounded-md">{language === 'ar' ? 'إجراءات تصحيحية معلقة' : 'CAPA Pending'}</span>;
      case 'CLOSED':
        return <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900 text-xs font-semibold px-2.5 py-1 rounded-md">{language === 'ar' ? 'مغلق ومؤمن' : 'Resolved & Closed'}</span>;
    }
  };

  const displayedIncidents = (incidents || []).filter(inc => {
    if (selectedMonthFilter === 'ALL') return true;
    return inc.date && inc.date.startsWith(selectedMonthFilter);
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-orange-500" />
            <span>{language === 'ar' ? 'إدارة الحوادث وشبه الحوادث (ISO 45001)' : 'Incident & Near Miss Management (ISO 45001)'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar' 
              ? 'تسجيل البلاغات الميدانية، والتحقيق بـ (5 Whys)، ومتابعة الخطط التصحيحية (CAPA) طبقا لشهادة نيبوش نيبوش.'
              : 'Record near misses, run 5-Whys investigations, and track Corrective/Preventive Actions (CAPA).'}
          </p>
        </div>

        {activeView === 'LIST' && (
          <button
            onClick={handleOpenForm}
            className="bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm select-none transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إبلاغ عن حادث أو شبه حادث' : 'Report Safe Event / Incident'}</span>
          </button>
        )}
      </div>

      {/* --- 1. LIST VIEW --- */}
      {activeView === 'LIST' && (
        <div className="space-y-6">
          
          {/* TOAST SYSTEM FEEDBACK FOR COPYS/SIMULATORS */}
          {toastMessage && (
            <div className="fixed top-4 start- end- sm:start- sm:end- bg-emerald-600 text-white font-bold p-3.5 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-bounce max-w-sm">
              <CheckCircle />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* DYNAMIC SAFETY STATISTICS PANEL */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-6">
            
            {/* Action Bar Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                    {language === 'ar' ? 'بوابة استخراج الإحصائيات والأداء والمحاكاة' : 'Statistics, Performance Ledger & Reset Hub'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'تتبع فترات الإبلاغ والتصفير الدوري لعدادات الموظفين مطلع كل شهر.' : 'Audit monthly reporting counts and simulate automatic system renewal cycles.'}
                  </p>
                </div>
              </div>

              {/* Month Selector & Simulators */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Month Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">{language === 'ar' ? 'فترة فحص:' : 'View Period:'}</span>
                  <select
                    value={selectedMonthFilter}
                    onChange={(e) => setSelectedMonthFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="ALL">{formatMonthName('ALL')}</option>
                    <option value={currentMonthStr}>{formatMonthName(currentMonthStr)} ({language === 'ar' ? 'الحالي' : 'Current'})</option>
                    <option value={prevMonthStr}>{formatMonthName(prevMonthStr)} ({language === 'ar' ? 'السابق' : 'Previous'})</option>
                    <option value={nextMonthStr}>{formatMonthName(nextMonthStr)} ({language === 'ar' ? 'القادم - مصفّر' : 'Next - Empty & Zeroed'})</option>
                  </select>
                </div>

                {/* Simulate Reset Button */}
                <button
                  type="button"
                  onClick={handleSimulateMonthReset}
                  title={language === 'ar' ? 'ترحيل الحوادث للشهر الفائت لتصفير عداد الأفراد فورياً للتجربة' : 'Simulate month transition to zero-out active individual tallies'}
                  className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                  <span>{language === 'ar' ? 'محاكاة تصفير بداية الشهر' : 'Simulate Month Reset'}</span>
                </button>

                {/* Extract Report Trigger */}
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'ar' ? 'استخراج الإحصائيات' : 'Extract Safety Stats'}</span>
                </button>

              </div>
            </div>

            {/* Simulation Feedback Alert */}
            {resetCompletedMessage && (
              <div className="bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs p-3.5 rounded-lg font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{resetCompletedMessage}</span>
              </div>
            )}

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-center relative overflow-hidden group">
                <div className="absolute top-0 end- start- h-1 bg-blue-500" />
                <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white">
                  {displayedIncidents.length}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-1">
                  {language === 'ar' ? 'مجموع البلاغات بالفترة' : 'Total Reports (Period)'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-center relative overflow-hidden">
                <div className="absolute top-0 end- start- h-1 bg-red-500 animate-pulse" />
                <div className="text-2xl font-bold font-mono text-red-500">
                  {displayedIncidents.filter(i => i.type === 'ACCIDENT').length}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-1">
                  {language === 'ar' ? 'حوادث العمل المبلّغة' : 'Accidents Reported'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-center relative overflow-hidden">
                <div className="absolute top-0 end- start- h-1 bg-amber-500" />
                <div className="text-2xl font-bold font-mono text-amber-500">
                  {displayedIncidents.filter(i => i.type === 'NEAR_MISS').length}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-1">
                  {language === 'ar' ? 'شبه حادث (مسجل)' : 'Near Misses Recorded'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-center relative overflow-hidden">
                <div className="absolute top-0 end- start- h-1 bg-emerald-500" />
                <div className="text-[10px] sm:text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
                  {selectedMonthFilter === 'ALL' ? 'Cumulative' : formatMonthName(selectedMonthFilter)}
                </div>
                <div className="text-xs text-slate-500 font-bold mt-2 flex items-center justify-center gap-1">
                  <span>{language === 'ar' ? 'إعادة التصفير:' : 'Next Reset:'}</span>
                  <span className="font-mono text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                    {selectedMonthFilter === 'ALL' ? 'N/A' : '01-' + formatMonthName(nextMonthStr).split(' ')[0]}
                  </span>
                </div>
              </div>

            </div>

            {/* LEDGER OF INDIVIDUAL COUNTS (عدد الحوادث وعدد مرات تسجيلها لكل فرد على حدة) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#0F172A] px-4 py-3 border-b border-slate-750 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-400" />
                  <span>{language === 'ar' ? 'جدول تسجيل الحوادث وأثر المخالفات لكل فرد' : 'Individual Incident Ledger & Logging Counters'}</span>
                </span>
                <span className="text-[10px] font-bold text-orange-400 uppercase bg-orange-950/45 px-2 py-0.5 rounded-md border border-orange-500/25">
                  {language === 'ar' ? 'تتجدد شهرياً تلقائياً' : 'Resets Monthly at Month Start'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-end text-xs min-w-[600px]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <thead className="bg-[#1E293B] text-slate-300 font-bold border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3">{language === 'ar' ? 'الموظف / الفرد الناقل' : 'Individual'}</th>
                      <th className="px-4 py-3 text-center">{language === 'ar' ? 'حوادث العمل' : 'Accidents'}</th>
                      <th className="px-4 py-3 text-center">{language === 'ar' ? 'أشباه حوادث وممتلكات' : 'Near-Miss / Property'}</th>
                      <th className="px-4 py-3 text-center bg-slate-50 dark:bg-slate-850/40 text-orange-400 font-extrabold">{language === 'ar' ? 'الملفات المرفوعة بالفترة ' : 'Active Logged (Period)'}</th>
                      <th className="px-4 py-3 text-center">{language === 'ar' ? 'إجمالي الأوقات' : 'All-Time Total'}</th>
                      <th className="px-4 py-3 text-start">{language === 'ar' ? 'حالة السجل الأمني' : 'Logging Level Badge'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => {
                      // Filter counts for this specific individual in the current period filter
                      const activeLogsForUser = (incidents || []).filter(inc => {
                        if (selectedMonthFilter !== 'ALL' && !inc.date.startsWith(selectedMonthFilter)) return false;
                        return inc.reportedByEmpCode === u.empCode || inc.reportedByName === u.fullNameEn || inc.reportedByName === u.fullNameAr;
                      });
                      
                      const accidentsCount = activeLogsForUser.filter(inc => inc.type === 'ACCIDENT').length;
                      const nearMissCount = activeLogsForUser.filter(inc => inc.type === 'NEAR_MISS').length;
                      const otherTypeCount = activeLogsForUser.length - accidentsCount - nearMissCount;
                      const periodTotal = activeLogsForUser.length;

                      // Cumulative all-time log count
                      const allTimeTotal = (incidents || []).filter(inc => 
                        inc.reportedByEmpCode === u.empCode || inc.reportedByName === u.fullNameEn || inc.reportedByName === u.fullNameAr
                      ).length;

                      return (
                        <tr key={u.empCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                          {/* Profile Info */}
                          <td className="px-4 py-3 flex items-center gap-3">
                            <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300 border border-slate-250 dark:border-slate-700">
                              {u.empCode}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {language === 'ar' ? u.fullNameAr : u.fullNameEn}
                              </div>
                              <div className="text-[10px] text-slate-400 uppercase font-medium">
                                {language === 'ar' ? u.roleAr : u.roleEn}
                              </div>
                            </div>
                          </td>
                          
                          {/* Accidents */}
                          <td className="px-4 py-3 text-center text-red-500 font-bold font-mono">
                            {accidentsCount}
                          </td>

                          {/* Near misses */}
                          <td className="px-4 py-3 text-center text-amber-500 font-bold font-mono">
                            {nearMissCount}
                          </td>

                          {/* Period total */}
                          <td className="px-4 py-3 text-center font-bold font-mono bg-slate-50 dark:bg-slate-850/20 text-slate-900 dark:text-white">
                            {periodTotal}
                          </td>

                          {/* Cumulative */}
                          <td className="px-4 py-3 text-center font-bold font-mono text-slate-400">
                            {allTimeTotal}
                          </td>

                          {/* Custom visual level pill */}
                          <td className="px-4 py-3 text-start">
                            {periodTotal === 0 ? (
                              <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                                {language === 'ar' ? 'سجل نظيف (أمين)' : 'Zero Risk Log'}
                              </span>
                            ) : periodTotal <= 2 ? (
                              <span className="bg-amber-50 dark:bg-amber-100/10 text-amber-600 dark:text-amber-500 border border-amber-200/50 dark:border-amber-900/30 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase animate-pulse">
                                {language === 'ar' ? 'بلاغات نشطة' : 'Active Reporter'}
                              </span>
                            ) : (
                              <span className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-950 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                                {language === 'ar' ? 'بؤرة خطر عالية' : 'Critical Logs'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* SECTION HEADER FOR ACTUAL REPORTS CARDS */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-orange-500" />
              <span>{language === 'ar' ? 'سجل تقارير الحوادث الميدانية المسجلة حالياً' : 'Current Active Incident Cases List'}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold font-mono">
              {displayedIncidents.length} {language === 'ar' ? 'بلاغ مطابق' : 'Cases Match'}
            </span>
          </div>

          {displayedIncidents.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {language === 'ar' ? 'لا توجد حوادث أو بلاغات مسجلة خلال هذه الفترة الزمنية.' : 'No reported incidents matching this period filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedIncidents.map((inc) => (
                <div 
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncId(inc.id);
                    setActiveView('DETAIL');
                  }}
                  className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 rounded-xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-400">{inc.id}</span>
                      <span className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase px-2 py-0.5 bg-slate-200/50 dark:bg-slate-800 rounded">
                        {getTypeLabel(inc.type)}
                      </span>
                      {getSeverityBadge(inc.severity)}
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                      {language === 'ar' ? inc.titleAr : inc.titleEn}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inc.date} • {inc.time}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{language === 'ar' ? inc.locationAr : inc.locationEn}</span>
                      </span>
                      <span className="flex items-center gap-1.5 animate-fade-in">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {(() => {
                            const match = users.find(u => u.empCode === inc.reportedByEmpCode || u.fullNameEn === inc.reportedByName || u.fullNameAr === inc.reportedByName);
                            if (match) {
                              return language === 'ar' ? match.fullNameAr : match.fullNameEn;
                            }
                            return inc.reportedByName;
                          })()}
                        </span>
                      </span>
                    </div>

                    {inc.capaActions.length > 0 && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold pt-1">
                        {language === 'ar' 
                          ? `${inc.capaActions.filter(c => c.status === 'DONE').length} من أصل ${inc.capaActions.length} إجراءات تصحيحية مكتملة` 
                          : `${inc.capaActions.filter(c => c.status === 'DONE').length} of ${inc.capaActions.length} CAPA actions resolved`}
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    {getStatusBadge(inc.status)}
                    <span className="text-slate-400 flex items-center text-xs font-semibold">
                      <span>{language === 'ar' ? 'فحص التحقيق' : 'Review Case'}</span>
                      <ChevronRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- 2. REPORT FORM VIEW --- */}
      {activeView === 'FORM' && (
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'ar' ? 'إبلاغ جديد عن حدث ميداني' : 'Fill EHS Report Form'}</span>
            <button 
              type="button" 
              onClick={() => setActiveView('LIST')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'تراجع' : 'Back to list'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {language === 'ar' ? 'العنوان (مطلوب)' : 'Title (Required)'}
              </label>
              <input 
                type="text" 
                required 
                value={language === 'ar' ? titleAr : titleEn} 
                onChange={e => {
                  setTitleEn(e.target.value);
                  setTitleAr(e.target.value);
                }}
                placeholder={language === 'ar' ? "مثال: ذراع مكسور تسبب في تسرب بسيط للمواد الخام" : "e.g. Broken valve handle caused mild material spill"}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'نوع الواقعة' : 'Event / Incident Type'}</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as IncidentType)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="NEAR_MISS">{language === 'ar' ? 'شبه حادث (وشيك الوقوع) • Near Miss' : 'Near Miss'}</option>
                <option value="ACCIDENT">{language === 'ar' ? 'حادث عمل (مع إصابة) • Accident' : 'Accident'}</option>
                <option value="PROPERTY_DAMAGE">{language === 'ar' ? 'تلف أو خسارة ممتلكات • Property Damage' : 'Property Damage'}</option>
                <option value="ENVIRONMENTAL">{language === 'ar' ? 'حادث بيئي (تسرب) • Environmental' : 'Environmental'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'درجة الخطورة المتصورة' : 'Perceived Potential Severity'}</label>
              <select 
                value={severity} 
                onChange={e => setSeverity(e.target.value as HSE_Severity)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="LOW">{language === 'ar' ? 'منخفضة (حوادث بسيطة) • Low' : 'Low'}</option>
                <option value="MEDIUM">{language === 'ar' ? 'متوسطة • Medium' : 'Medium'}</option>
                <option value="HIGH">{language === 'ar' ? 'عالية (مخاطر حقيقية) • High' : 'High'}</option>
                <option value="CRITICAL">{language === 'ar' ? 'جسيمة (إصابة خطرة/وفاة) • Critical' : 'Critical'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'التاريخ الميداني' : 'Event Date'}</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'وقت الحادث' : 'Event Time'}</label>
              <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-255 border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {language === 'ar' ? 'مكان الحدث بالتفصيل (مطلوب)' : 'Detailed Location (Required)'}
              </label>
              <input 
                type="text" 
                required 
                value={language === 'ar' ? locationAr : locationEn} 
                onChange={e => {
                  setLocationEn(e.target.value);
                  setLocationAr(e.target.value);
                }}
                placeholder={language === 'ar' ? "مثال: صوامع المواد الخام - برج تعبئة الشحنات السفلي" : "e.g. Raw Mill Silo discharge chutes area"}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {language === 'ar' ? 'تفاصيل الواقعة بالكامل (مطلوب)' : 'Detailed Description (Required)'}
              </label>
              <textarea 
                rows={4} 
                required 
                value={language === 'ar' ? descriptionAr : descriptionEn} 
                onChange={e => {
                  setDescriptionEn(e.target.value);
                  setDescriptionAr(e.target.value);
                }}
                placeholder={language === 'ar' ? "اكتب تسلسل الأحداث، الظروف البيئية، المعدات المتأثرة، رد الفعل الفوري..." : "Provide a step by step layout on what happened, witnesses, materials involved..."}
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* DRAG AND DROP FILE UPLOAD AREA */}
          <div className="space-y-3.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              {language === 'ar' ? 'المرفقات والشهادات الميدانية (صور، مستندات Word، ملفات PDF)' : 'Field Evidence & Attachments (Images, Word, PDF)'}
            </label>
            
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesSelection(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragging 
                  ? 'border-orange-500 bg-orange-500/5' 
                  : 'border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'
              }`}
            >
              <input 
                type="file" 
                id="file-attachments-input"
                multiple 
                accept="image/*,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => handleFilesSelection(e.target.files)}
                className="hidden" 
              />
              
              <label 
                htmlFor="file-attachments-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2.5"
              >
                <div className="w-11 h-11 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-500">
                  <UploadCloud className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' 
                      ? 'اسحب الملفات وأفلتها هنا أو اضغط للتصفح' 
                      : 'Drag & drop evidence files here or click to browse'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'ar' 
                      ? 'الصيغ المدعومة: الصور (PNG, JPG)، ملفات PDF، ومستندات Word (DOC, DOCX)' 
                      : 'Supported formats: Images (PNG, JPG), PDF, and Word Documents (DOC, DOCX)'}
                  </p>
                </div>
              </label>
            </div>

            {/* List of active attachments in form state */}
            {formAttachments.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-lg p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-slate-550 uppercase tracking-widest block border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  {language === 'ar' ? 'الملفات المجهزة للرفع:' : 'Files Staged for Inclusion:'}
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formAttachments.map((att, attIdx) => (
                    <div 
                      key={attIdx} 
                      className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg p-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Paperclip className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{att.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{att.size}</p>
                        </div>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => {
                          setFormAttachments((prev) => prev.filter((_, i) => i !== attIdx));
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all font-black text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-end">
            <button 
              type="button" 
              onClick={() => setActiveView('LIST')}
              className="px-5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950 font-bold transition-all"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-all shadow"
            >
              {language === 'ar' ? 'إرسال التقرير المبدئي' : 'Submit Initial Report'}
            </button>
          </div>
        </form>
      )}

      {/* --- 3. INVESTIGATION & DETAIL VIEW (5 WHYS & CAPA) --- */}
      {activeView === 'DETAIL' && activeIncident && (
        <div className="space-y-6">
          
          {/* Header Action Back */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <button 
              onClick={() => setActiveView('LIST')}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'العودة للقائمة' : 'Back to incidents'}</span>
            </button>

            <div className="flex items-center gap-2">
              {getStatusBadge(activeIncident.status)}
              {currentRole === 'HSE' && activeIncident.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={handleCloseIncident}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إغلاق الحادث بالكامل' : 'Close Incident Securely'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Incident Quick Profile */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div className="space-y-1">
                <span className="font-mono text-xs font-bold text-orange-500">{activeIncident.id}</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'ar' ? activeIncident.titleAr : activeIncident.titleEn}
                </h3>
              </div>
              <div className="text-start">
                <span className="text-xs text-slate-400 font-mono block">{language === 'ar' ? 'المبلغ عنه في:' : 'Reported on:'}</span>
                <span className="text-xs font-semibold text-slate-600">{activeIncident.date} {activeIncident.time}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>{language === 'ar' ? 'موقع وتفاصيل المشكلة' : 'Location Details'}</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400">{language === 'ar' ? activeIncident.locationAr : activeIncident.locationEn}</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-orange-500" />
                  <span>{language === 'ar' ? 'المبلغ والمسؤول المباشر' : 'Reporter details'}</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400">{activeIncident.reportedByName} - {language === 'ar' ? activeIncident.reportedByRoleAr : activeIncident.reportedByRoleEn}</p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg text-sm">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <FileText className="w-4 h-4 text-orange-400" />
                <span>{language === 'ar' ? 'الوصف الميداني للتسلسل الكامل' : 'Incident Narrative'}</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-h-40 overflow-y-auto pe-">
                {language === 'ar' ? activeIncident.descriptionAr : activeIncident.descriptionEn}
              </p>
            </div>

            {/* INCIDENT ATTACHMENTS (EVIDENCE RETRIEVAL) */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-xs text-slate-750 dark:text-slate-300 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-orange-500" />
                <span>{language === 'ar' ? 'المرفقات والشهادات والتقارير المرفوعة' : 'Incident Supporting Evidence & Attachments'}</span>
              </h4>
              
              {!activeIncident.attachments || activeIncident.attachments.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">
                  {language === 'ar' ? 'لا توجد مستندات أو صور مرفقة مع هذا البلاغ.' : 'No attached documents or photos were submitted with this case.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeIncident.attachments.map((att, attIdx) => {
                    const isImg = att.type?.startsWith('image/') || att.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    return (
                      <div 
                        key={attIdx} 
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-xs hover:border-orange-500 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-2 overflow-hidden grow">
                          {isImg ? (
                            <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          
                          <div className="truncate text-xs">
                            <p className="font-bold text-slate-700 dark:text-slate-300 truncate" title={att.name}>{att.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">{att.size}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {isImg && att.dataUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPreviewImage(att.dataUrl || null);
                                setPreviewImageName(att.name);
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-orange-500 transition-colors"
                              title={language === 'ar' ? 'عرض فوري' : 'Quick Preview'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {att.dataUrl && (
                            <a
                              href={att.dataUrl}
                              download={att.name}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-center rounded text-slate-400 hover:text-orange-500 transition-colors inline-block"
                              title={language === 'ar' ? 'تنزيل الملف' : 'Download File'}
                              referrerPolicy="no-referrer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION: 5 WHYS INVESTIGATION & ROOT CAUSE ANALYSIS (NEBOSH STANDARD) */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <Workflow className="w-5 h-5 text-indigo-500" />
                <span>{language === 'ar' ? 'التحقيق بطريقة الأسباب الـ 5 (5 Whys RCA)' : 'RCA - 5 Whys Investigation Panel'}</span>
              </h3>
              
              {currentRole === 'HSE' && (
                <button
                  type="button"
                  onClick={triggerAutoRca}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                  title="Generate typical NEBOSH RCA questions"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'توليد أسباب نموذجية' : 'AI Assistant Suggestions'}</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'منهجية نيبوش المعتمدة لحفر جذور الحوادث عبر التساؤل المتتالي خمس مرات متتالية حتى كشف الخلل الإداري الحقيقي.'
                : 'The NEBOSH General Certificate methodology. Drill down 5 levels of causality to reveal failure of safety management systems.'}
            </p>

            {/* Editable or Static Form */}
            {currentRole === 'HSE' ? (
              <div className="space-y-4 pt-2">
                <div className="space-y-3.5">
                  {[1, 2, 3, 4, 5].map((idx) => {
                    // Assign states
                    const setValEn = [null, setWhy1En, setWhy2En, setWhy3En, setWhy4En, setWhy5En][idx];
                    const valEn = [null, why1En, why2En, why3En, why4En, why5En][idx];
                    const setValAr = [null, setWhy1Ar, setWhy2Ar, setWhy3Ar, setWhy4Ar, setWhy5Ar][idx];
                    const valAr = [null, why1Ar, why2Ar, why3Ar, why4Ar, why5Ar][idx];

                    return (
                      <div key={idx} className="border border-slate-100 dark:border-slate-900 rounded-lg p-3 bg-slate-50 dark:bg-slate-950/50 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold font-mono text-xs select-none">W{idx}</span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{language === 'ar' ? `لماذا حدث الأمر؟ (المستوى ${idx})` : `Why did this happen? (Level ${idx})`}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={valEn || ''} 
                            onChange={e => setValEn?.(e.target.value)}
                            placeholder={`English Explanation ${idx}`}
                            className="bg-white dark:bg-slate-950 border border-slate-205 border-slate-200 dark:border-slate-800 text-xs p-2 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                          />
                          <input 
                            type="text" 
                            value={valAr || ''} 
                            onChange={e => setValAr?.(e.target.value)}
                            placeholder={`التفسير بالعربية للمستوى ${idx}`}
                            className="text-start bg-white dark:bg-slate-950 border border-slate-255 border-slate-200 dark:border-slate-800 text-xs p-2 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-900 pt-3 flex flex-col gap-2">
                  <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{language === 'ar' ? 'السبب الجذري النهائي للتحقيق (RCA Root Cause):' : 'Final RCA Root Cause Summary:'}</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <textarea 
                      rows={2}
                      value={rootCauseEn}
                      onChange={e => setRootCauseEn(e.target.value)}
                      placeholder="e.g. Failure of administrative controls in isolation shift handovers..."
                      className="bg-white dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 p-2 text-xs rounded"
                    />
                    <textarea 
                      rows={2}
                      value={rootCauseAr}
                      onChange={e => setRootCauseAr(e.target.value)}
                      placeholder="مثال: التدني الرقابي مع مقاولي الباطن وانهيار إجرائي في تبديل وتنسيق المسؤوليات للتبادلات الفنية الميدانية..."
                      className="text-start bg-white dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 p-2 text-xs rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveRca}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow transition-all"
                  >
                    {language === 'ar' ? 'حفظ نتائج التحقيق' : 'Save RCA Findings'}
                  </button>
                </div>
              </div>
            ) : (
              // Read-only static list for non-HSE profiles
              <div className="pt-2 space-y-3">
                {!activeIncident.why1En ? (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    {language === 'ar' ? 'تحقيق الأسباب الخمسة (RCA) غير مكتمل بعد. يجب تسجيله بواسطة مسؤول السلامة (HSE).' : '5 Whys assessment is not yet conducted. Requires safety inspector review.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[
                      { l: activeIncident.why1En, r: activeIncident.why1Ar },
                      { l: activeIncident.why2En, r: activeIncident.why2Ar },
                      { l: activeIncident.why3En, r: activeIncident.why3Ar },
                      { l: activeIncident.why4En, r: activeIncident.why4Ar },
                      { l: activeIncident.why5En, r: activeIncident.why5Ar }
                    ].map((why, i) => why.l && (
                      <div key={i} className="flex gap-3 text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded border border-slate-100 dark:border-slate-900">
                        <span className="font-mono font-bold text-indigo-500 w-5 shrink-0">W{i+1}:</span>
                        <div className="grow">
                          <p className="font-medium text-slate-800 dark:text-neutral-200">{why.l}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5 text-start">{why.r}</p>
                        </div>
                      </div>
                    ))}

                    {activeIncident.rootCauseEn && (
                      <div className="mt-4 p-3 border-s- border-s--500 bg-indigo-50/45 dark:bg-indigo-950/20 rounded">
                        <strong className="text-xs text-indigo-700 dark:text-indigo-400 block mb-1">{language === 'ar' ? 'السبب الجذري النهائي لمفتش الأمان:' : 'Final Management Root Cause:'}</strong>
                        <p className="text-xs font-medium text-slate-800 dark:text-neutral-200">{activeIncident.rootCauseEn}</p>
                        <p className="text-slate-400 text-[10px] text-start mt-1">{activeIncident.rootCauseAr}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION: CORRECTIVE & PREVENTIVE ACTIONS (CAPA) */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider border-b border-slate-100 dark:border-slate-900 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>{language === 'ar' ? 'خطط خطة العمل للتصحيح والوقاية (CAPA Tracking)' : 'CAPA Plan Tracker (ISO 45001 Compliance)'}</span>
            </h3>

            {/* Existing actions list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{language === 'ar' ? 'المتابعة الحالية' : 'Active Safeguard Actions'}</h4>
              {activeIncident.capaActions.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">{language === 'ar' ? 'لا يوجد إجراءات معينة مدرجة حتى الآن لهذا البلاغ.' : 'No active corrective actions assigned to this incident.'}</p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {activeIncident.capaActions.map((action) => (
                    <div 
                      key={action.id}
                      onClick={() => handleToggleCapaStatus(action.id)}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer select-none transition-all ${
                        action.status === 'DONE' 
                          ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/10 opacity-70' 
                          : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={action.status === 'DONE'} 
                        onChange={() => {}} // toggled in parent div onClick
                        className="mt-1 w-4.5 h-4.5 text-emerald-500 border-slate-300 rounded focus:ring-emerald-400 cursor-pointer" 
                      />
                      <div className="grow">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                          <span className="font-mono text-[9px] text-slate-400">{action.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-850 text-slate-600 dark:text-slate-400">
                            {language === 'ar' ? action.assignedDepartmentAr : action.assignedDepartmentEn}
                          </span>
                        </div>
                        <p className={`text-xs font-bold text-slate-800 dark:text-neutral-200 ${action.status === 'DONE' ? 'line-through text-slate-500' : ''}`}>
                          {language === 'ar' ? action.actionAr : action.actionEn}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-semibold" dir="ltr">
                          <span>DUE DATE: {action.dueDate}</span>
                          <span className={action.status === 'DONE' ? 'text-emerald-500' : 'text-orange-500'}>
                            {action.status === 'DONE' ? 'RESOLVED' : 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Creator (Only for HSE / supervisor Roles) */}
            {currentRole === 'HSE' && (
              <form onSubmit={handleAddCapaAction} className="border-t border-slate-150 dark:border-slate-900 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">{language === 'ar' ? 'إضافة إجراء تصحيحي جديد (CAPA):' : 'Create New CAPA Action:'}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'ar' ? 'الإجراء المقترح بالإنجليزية (مطلوب)' : 'Action in English'}</label>
                    <input 
                      type="text" 
                      required
                      value={capaTextEn}
                      onChange={e => setCapaTextEn(e.target.value)}
                      placeholder="e.g. Conduct mechanical inspection on mill safety latch"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'ar' ? 'الإجراء المقترح بالعربية' : 'Action in Arabic'}</label>
                    <input 
                      type="text" 
                      required
                      value={capaTextAr}
                      onChange={e => setCapaTextAr(e.target.value)}
                      placeholder="مثال: إجراء فحص ميكانيكي للقفل الخارجي لباب الطاحونة"
                      className="text-start w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'ar' ? 'الإدارة المسؤولة عن التنفيذ' : 'Target Department'}</label>
                    <select
                      value={capaDeptEn}
                      onChange={e => {
                        setCapaDeptEn(e.target.value);
                        // parallel sync arabic
                        if (e.target.value === 'Mechanical Maintenance') setCapaDeptAr('إدارة الصيانة');
                        else if (e.target.value === 'Electrical & Power') setCapaDeptAr('إدارة الكهرباء');
                        else if (e.target.value === 'Production & Operations') setCapaDeptAr('إدارة الإنتاج والتشغيل');
                        else setCapaDeptAr('إدارة السلامة والصحة المهنية');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-800 dark:text-white"
                    >
                      <option value="Mechanical Maintenance">Mechanical Maintenance | إدارة الصيانة</option>
                      <option value="Electrical & Power">Electrical & Power | إدارة الكهرباء</option>
                      <option value="Production & Operations">Production & Operations | إدارة الإنتاج والتشغيل</option>
                      <option value="HSE Department">HSE Department | إدارة السلامة والصحة المهنية</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{language === 'ar' ? 'تاريخ الاستحقاق الأقصى' : 'Deadline Date'}</label>
                    <input 
                      type="date"
                      value={capaDue}
                      onChange={e => setCapaDue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-[11px] px-4 py-2 rounded shadow transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إسناد وتعيين الإجراء' : 'Assign CAPA Requirement'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      )}

      {/* STATISTICS EXPORT CERTIFICATE MODAL */}
      {showExportModal && (
        <div id="safety-modal-container" className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-150 dark:border-slate-800 p-6 space-y-6 animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-250 pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-800 dark:text-white pb-0">
                  {language === 'ar' ? 'تقرير مستند إحصائيات السلامة والوقاية المعتمد' : 'Official HSE Certified Statistics Report'}
                </h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* Print Area Container */}
            <div id="printable-hse-document" className="space-y-6 border-2 border-dashed border-slate-300 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 font-sans text-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              
              {/* Certification Stamp Header */}
              <div className="text-center space-y-1.5 border-b-2 border-double border-slate-300 pb-3">
                <h4 className="text-sm font-black text-[#0F172A] dark:text-white tracking-wide uppercase">
                  {language === 'ar' ? 'الشركة السعودية للإسمنت • إدارة السلامة والصحة المهنية' : 'SAUDI CEMENT COMPANY • FIELD SAFETY AUDIT'}
                </h4>
                <p className="text-[10px] text-slate-450 uppercase font-mono tracking-widest">
                  DOCUMENT NO: SCC-HSE-R-354 • COMPLIANT STATUS: CERTIFIED
                </p>
                <div className="text-xs font-bold text-slate-550 pt-1">
                  {language === 'ar' ? 'الفترة الزمنية المختارة:' : 'Statistical Period:'}{' '}
                  <span className="text-orange-500">{formatMonthName(selectedMonthFilter)}</span>
                </div>
              </div>

              {/* Statistics tables in printed shape */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border p-3 rounded-lg text-center">
                  <div className="text-lg font-black text-red-500">
                    {displayedIncidents.filter(i => i.type === 'ACCIDENT').length}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    {language === 'ar' ? 'إجمالي الحوادث' : 'Total Accidents'}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border p-3 rounded-lg text-center">
                  <div className="text-lg font-black text-amber-500">
                    {displayedIncidents.filter(i => i.type === 'NEAR_MISS').length}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    {language === 'ar' ? 'إجمالي أشباه الحوادث' : 'Total Near Misses'}
                  </div>
                </div>
              </div>

              {/* Individual Details table */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-black uppercase text-[#0F172A] dark:text-slate-300 tracking-wider">
                  {language === 'ar' ? 'عدد مرات التسجيل والرفع التفصيلية لكل فرد للسلامة:' : 'Individual Incident Registration Ledgers (ISO 45051):'}
                </h5>
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900 text-[11px]">
                  <div className="grid grid-cols-4 bg-[#1E293B] text-slate-200 font-bold p-2 text-[10px] uppercase border-b border-slate-700">
                    <div className="col-span-2 text-start">{language === 'ar' ? 'الفرد / الموظف' : 'User profile'}</div>
                    <div className="text-center">{language === 'ar' ? 'بلاغات الفترة' : 'Period Logs'}</div>
                    <div className="text-end">{language === 'ar' ? 'السجل الكلي' : 'All time'}</div>
                  </div>
                  {users.map((u) => {
                    const activeLogsForUser = (incidents || []).filter(inc => {
                      if (selectedMonthFilter !== 'ALL' && !inc.date.startsWith(selectedMonthFilter)) return false;
                      return inc.reportedByEmpCode === u.empCode || inc.reportedByName === u.fullNameEn || inc.reportedByName === u.fullNameAr;
                    });
                    const allTimeTotal = (incidents || []).filter(inc => 
                      inc.reportedByEmpCode === u.empCode || inc.reportedByName === u.fullNameEn || inc.reportedByName === u.fullNameAr
                    ).length;
                    
                    return (
                      <div key={u.empCode} className="grid grid-cols-4 p-2 border-b last:border-0 hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:border-slate-800">
                        <div className="col-span-2 font-bold text-start">
                          {language === 'ar' ? u.fullNameAr : u.fullNameEn}{' '}
                          <span className="text-[9px] text-slate-400">({u.empCode})</span>
                        </div>
                        <div className="text-center font-bold text-orange-500 font-mono">{activeLogsForUser.length}</div>
                        <div className="text-end font-mono text-slate-400">{allTimeTotal}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verified signatures footer */}
              <div className="pt-6 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                <div>
                  {language === 'ar' ? 'إمضاء رئيس السلامة:' : 'HSE Authority Approval:'}
                  <div className="text-[#0F172A] dark:text-slate-300 italic font-black pt-1">Asaad Al-Shamrani</div>
                </div>
                <div className="text-end">
                  {language === 'ar' ? 'كود الفحص التقني:' : 'Certificate Check Code:'}
                  <div className="font-mono text-orange-600 dark:text-orange-400 pt-1">SCC-993-9251-X</div>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-150 pt-4">
              <button
                type="button"
                onClick={handleCopyCsvData}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'نسخ كجدول CSV للحافظة' : 'Copy CSV Table'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'طباعة التقرير أو حفظ كـ PDF' : 'Print / Export PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ATTACHMENT IMAGE LIGHTBOX PREVIEW MODAL */}
      {selectedPreviewImage && (
        <div id="attachment-lightbox-modal" className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 animate-fade-in">
          <div className="absolute top-4 end- flex items-center gap-2">
            <a
              href={selectedPreviewImage}
              download={previewImageName}
              className="bg-slate-800/80 hover:bg-slate-700 text-white p-2.5 rounded-full backdrop-blur-xs transition-all flex items-center justify-center border border-slate-700"
              title={language === 'ar' ? 'تنزيل' : 'Download'}
              referrerPolicy="no-referrer"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => {
                setSelectedPreviewImage(null);
                setPreviewImageName('');
              }}
              className="bg-slate-800/80 hover:bg-rose-600 text-white p-2.5 rounded-full backdrop-blur-xs transition-all flex items-center justify-center border border-slate-700 font-extrabold"
              title={language === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center select-none p-2">
            <img 
              src={selectedPreviewImage} 
              alt={previewImageName} 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-slate-800/50"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-white font-bold text-sm bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800 inline-block">
              {previewImageName}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
