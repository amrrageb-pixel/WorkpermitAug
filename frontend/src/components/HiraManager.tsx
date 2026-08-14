import React from 'react';
import { HiraAssessment, HiraControlMeasures, SandboxRole, Language, UserProfile } from '../types';
import { 
  Shield, Brain, CheckSquare, Plus, Trash2, MapPin, 
  User, CheckCircle, XCircle, AlertCircle, FileText, ChevronRight, ArrowLeft, PenLine 
} from 'lucide-react';

interface HiraManagerProps {
  hiras: HiraAssessment[];
  onAddHira: (hira: HiraAssessment) => void;
  onUpdateHira: (hira: HiraAssessment) => void;
  onDeleteHira: (id: string) => void;
  currentRole: SandboxRole;
  language: Language;
  currentUser?: UserProfile;
  onCreatePermitFromHira?: (hira: HiraAssessment) => void;
}

export const HiraManager: React.FC<HiraManagerProps> = ({
  hiras,
  onAddHira,
  onUpdateHira,
  onDeleteHira,
  currentRole,
  language,
  currentUser,
  onCreatePermitFromHira
}) => {
  const [activeView, setActiveView] = React.useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [selectedHiraId, setSelectedHiraId] = React.useState<string | null>(null);
  const [editingHiraId, setEditingHiraId] = React.useState<string | null>(null);

  const isCompanyAdmin = currentUser?.customRole === 'SUPER_ADMIN' || 
                         currentUser?.customRole === 'SAFETY_MANAGER' || 
                         currentUser?.customRole === 'SAFETY_SUPERVISOR' || 
                         currentUser?.username?.includes('admin') || 
                         currentUser?.username === 'admin' || 
                         currentRole === 'HSE' || 
                         currentUser?.sandboxRole === 'HSE';

  // Form states
  const [taskEn, setTaskEn] = React.useState('');
  const [taskAr, setTaskAr] = React.useState('');
  const [areaEn, setAreaEn] = React.useState('Kiln Preheater Tower');
  const [areaAr, setAreaAr] = React.useState('برج التسخين المسبق للفرن');
  const [hazardEn, setHazardEn] = React.useState('');
  const [hazardAr, setHazardAr] = React.useState('');
  const [consequenceEn, setConsequenceEn] = React.useState('');
  const [consequenceAr, setConsequenceAr] = React.useState('');

  // 5x5 Likelihood and Severity
  const [likelihood, setLikelihood] = React.useState<number>(3);
  const [severity, setSeverity] = React.useState<number>(3);

  // Hierarchy controls
  const [eliminationEn, setEliminationEn] = React.useState('');
  const [eliminationAr, setEliminationAr] = React.useState('');
  const [substitutionEn, setSubstitutionEn] = React.useState('');
  const [substitutionAr, setSubstitutionAr] = React.useState('');
  const [engineeringEn, setEngineeringEn] = React.useState('');
  const [engineeringAr, setEngineeringAr] = React.useState('');
  const [administrativeEn, setAdministrativeEn] = React.useState('');
  const [administrativeAr, setAdministrativeAr] = React.useState('');
  const [ppeEn, setPpeEn] = React.useState('');
  const [ppeAr, setPpeAr] = React.useState('');

  // Residual scores after controls
  const [resLikelihood, setResLikelihood] = React.useState<number>(1);
  const [resSeverity, setResSeverity] = React.useState<number>(2);

  const activeHira = hiras.find(h => h.id === selectedHiraId);

  const startEditHira = (hira: HiraAssessment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingHiraId(hira.id);
    setTaskAr(hira.taskAr || hira.taskEn || '');
    setTaskEn(hira.taskEn || hira.taskAr || '');
    setAreaAr(hira.areaAr || hira.areaEn || 'برج التسخين المسبق للفرن');
    setAreaEn(hira.areaEn || hira.areaAr || 'Kiln Preheater Tower');
    setHazardAr(hira.hazardAr || hira.hazardEn || '');
    setHazardEn(hira.hazardEn || hira.hazardAr || '');
    setConsequenceAr(hira.consequenceAr || hira.consequenceEn || '');
    setConsequenceEn(hira.consequenceEn || hira.consequenceAr || '');
    setLikelihood(hira.initialLikelihood || 3);
    setSeverity(hira.initialSeverity || 3);
    setResLikelihood(hira.residualLikelihood || 1);
    setResSeverity(hira.residualSeverity || 2);
    setEliminationAr(hira.controls.eliminationAr || hira.controls.eliminationEn || '');
    setEliminationEn(hira.controls.eliminationEn || hira.controls.eliminationAr || '');
    setSubstitutionAr(hira.controls.substitutionAr || hira.controls.substitutionEn || '');
    setSubstitutionEn(hira.controls.substitutionEn || hira.controls.substitutionAr || '');
    setEngineeringAr(hira.controls.engineeringAr || hira.controls.engineeringEn || '');
    setEngineeringEn(hira.controls.engineeringEn || hira.controls.engineeringAr || '');
    setAdministrativeAr(hira.controls.administrativeAr || hira.controls.administrativeEn || '');
    setAdministrativeEn(hira.controls.administrativeEn || hira.controls.administrativeAr || '');
    setPpeAr(hira.controls.ppeAr || hira.controls.ppeEn || '');
    setPpeEn(hira.controls.ppeEn || hira.controls.ppeAr || '');
    setActiveView('FORM');
  };

  const handleCreateHira = (e: React.FormEvent) => {
    e.preventDefault();
    const task = language === 'ar' ? taskAr : taskEn;
    if (!task.trim()) return;

    if (editingHiraId) {
      const existing = hiras.find(h => h.id === editingHiraId);
      if (existing) {
        const updated: HiraAssessment = {
          ...existing,
          taskEn: language === 'ar' ? taskAr : taskEn,
          taskAr: language === 'ar' ? taskAr : (taskAr || taskEn),
          areaEn,
          areaAr: areaAr || areaEn,
          hazardEn: language === 'ar' ? hazardAr : hazardEn,
          hazardAr: language === 'ar' ? hazardAr : (hazardAr || hazardEn),
          consequenceEn: language === 'ar' ? consequenceAr : consequenceEn,
          consequenceAr: language === 'ar' ? consequenceAr : (consequenceAr || consequenceEn),
          initialLikelihood: likelihood,
          initialSeverity: severity,
          initialRiskScore: likelihood * severity,
          controls: {
            eliminationEn: language === 'ar' ? eliminationAr : eliminationEn,
            eliminationAr: language === 'ar' ? eliminationAr : (eliminationAr || eliminationEn),
            substitutionEn: language === 'ar' ? substitutionAr : substitutionEn,
            substitutionAr: language === 'ar' ? substitutionAr : (substitutionAr || substitutionEn),
            engineeringEn: language === 'ar' ? engineeringAr : engineeringEn,
            engineeringAr: language === 'ar' ? engineeringAr : (engineeringAr || engineeringEn),
            administrativeEn: language === 'ar' ? administrativeAr : administrativeEn,
            administrativeAr: language === 'ar' ? administrativeAr : (administrativeAr || administrativeEn),
            ppeEn: language === 'ar' ? ppeAr : ppeEn,
            ppeAr: language === 'ar' ? ppeAr : (ppeAr || ppeEn)
          },
          residualLikelihood: resLikelihood,
          residualSeverity: resSeverity,
          residualRiskScore: resLikelihood * resSeverity
        };
        onUpdateHira(updated);
      }
    } else {
      const newHira: HiraAssessment = {
        id: `HIRA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        taskEn: language === 'ar' ? taskAr : taskEn,
        taskAr: language === 'ar' ? taskAr : (taskAr || taskEn),
        areaEn,
        areaAr: areaAr || areaEn,
        hazardEn: language === 'ar' ? hazardAr : hazardEn,
        hazardAr: language === 'ar' ? hazardAr : (hazardAr || hazardEn),
        consequenceEn: language === 'ar' ? consequenceAr : consequenceEn,
        consequenceAr: language === 'ar' ? consequenceAr : (consequenceAr || consequenceEn),
        initialLikelihood: likelihood,
        initialSeverity: severity,
        initialRiskScore: likelihood * severity,
        controls: {
          eliminationEn: language === 'ar' ? eliminationAr : eliminationEn,
          eliminationAr: language === 'ar' ? eliminationAr : (eliminationAr || eliminationEn),
          substitutionEn: language === 'ar' ? substitutionAr : substitutionEn,
          substitutionAr: language === 'ar' ? substitutionAr : (substitutionAr || substitutionEn),
          engineeringEn: language === 'ar' ? engineeringAr : engineeringEn,
          engineeringAr: language === 'ar' ? engineeringAr : (engineeringAr || engineeringEn),
          administrativeEn: language === 'ar' ? administrativeAr : administrativeEn,
          administrativeAr: language === 'ar' ? administrativeAr : (administrativeAr || administrativeEn),
          ppeEn: language === 'ar' ? ppeAr : ppeEn,
          ppeAr: language === 'ar' ? ppeAr : (ppeAr || ppeEn)
        },
        residualLikelihood: resLikelihood,
        residualSeverity: resSeverity,
        residualRiskScore: resLikelihood * resSeverity,
        status: 'APPROVED',
        assessedBy: currentUser ? (language === 'ar' ? currentUser.fullNameAr : currentUser.fullNameEn) : (language === 'ar' ? 'مقيم المخاطر' : 'Risk Assessor'),
        date: new Date().toISOString().split('T')[0]
      };
      onAddHira(newHira);
    }
    
    // reset
    setEditingHiraId(null);
    setTaskEn(''); setTaskAr(''); setHazardEn(''); setHazardAr(''); setConsequenceEn(''); setConsequenceAr('');
    setLikelihood(3); setSeverity(3); setResLikelihood(1); setResSeverity(2);
    setEliminationEn(''); setEliminationAr(''); setSubstitutionEn(''); setSubstitutionAr('');
    setEngineeringEn(''); setEngineeringAr(''); setAdministrativeEn(''); setAdministrativeAr(''); setPpeEn(''); setPpeAr('');

    setActiveView('LIST');
  };

  const handleApproveHira = (id: string, approve: boolean) => {
    const target = hiras.find(h => h.id === id);
    if (!target) return;

    const updated: HiraAssessment = {
      ...target,
      status: approve ? 'APPROVED' : 'REJECTED',
      approvedBy: approve ? 'Eng. Asaad Al-Shamrani (HSE HSE Leader)' : undefined,
      approvedAt: approve ? new Date().toISOString().split('T')[0] : undefined
    };

    onUpdateHira(updated);
    if (selectedHiraId === id) {
      setActiveView('LIST');
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 15) return 'bg-red-500 text-white dark:bg-red-950/70 border-red-650';
    if (score >= 8) return 'bg-amber-500 text-slate-900 dark:bg-yellow-900 text-yellow-300 border-amber-600';
    return 'bg-emerald-500 text-white dark:bg-emerald-950/70 border-emerald-650';
  };

  const getRiskLevelText = (score: number) => {
    if (score >= 15) return language === 'ar' ? 'خطر حرج (عالي) | High Critical' : 'High Critical | خطر حرج';
    if (score >= 8) return language === 'ar' ? 'متوسط المقبولية | Medium Risk' : 'Medium Risk | متوسط';
    return language === 'ar' ? 'مقبول (آمن) | Low Risk' : 'Low Risk | مقبول';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-500" />
            <span>{language === 'ar' ? 'تحديد المخاطر وتقييمها (HIRA - ISO 45001)' : 'HIRA Assessment Tool (ISO 45001 / NEBOSH)'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar' 
              ? 'إنشاء مصفوفة المخاطر الميدانية، وتطبيق الهرم الرقابي للتحكم (Hierarchy of Controls)، والحد من الحوادث.'
              : 'Conduct 5x5 Likelihood/Severity risk matrix analyses and map Hierarchy of Controls safeguard measures.'}
          </p>
        </div>

        {activeView === 'LIST' && (
          <button
            onClick={() => setActiveView('FORM')}
            className="bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm select-none transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إجراء تقييم مخاطر HIRA جديد' : 'New HIRA Audit Risk Matrix'}</span>
          </button>
        )}
      </div>

      {/* --- 1. LIST ASSESSMENT VIEWS --- */}
      {activeView === 'LIST' && (
        <div className="space-y-4">
          {hiras.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{language === 'ar' ? 'لا توجد تقييمات مخاطر مسجلة.' : 'No HIRAs created yet.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {hiras.map((hira) => (
                <div 
                  key={hira.id}
                  onClick={() => {
                    setSelectedHiraId(hira.id);
                    setActiveView('DETAIL');
                  }}
                  className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-orange-500 rounded-xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-2 grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{hira.id}</span>
                      <span className="text-[10px] sm:text-xs font-bold bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        {language === 'ar' ? hira.areaAr : hira.areaEn}
                      </span>
                      {hira.status === 'APPROVED' ? (
                        <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 rounded-full">{language === 'ar' ? 'معتمد ومؤمن' : 'Approved'}</span>
                      ) : (
                        <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 rounded-full">{language === 'ar' ? 'قيد مراجعة السلامة' : 'Pending Review'}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                      {language === 'ar' ? hira.taskAr : hira.taskEn}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{language === 'ar' ? 'محرر من قبل:' : 'Assessed by:'} {hira.assessedBy}</span>
                      <span>{hira.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                    {isCompanyAdmin && (
                      <div className="flex items-center gap-1.5 border-e border-slate-200 dark:border-slate-800 pe-3 me-1">
                        <button
                          type="button"
                          onClick={(e) => startEditHira(hira, e)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-900/30 cursor-pointer"
                          title={language === 'ar' ? 'تعديل التقييم' : 'Edit HIRA'}
                        >
                          <PenLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(language === 'ar' ? `⚠️ هل أنت متأكد كأدمن من مسح تقييم المخاطر [${hira.id}] نهائياً؟` : `⚠️ Delete HIRA [${hira.id}]?`)) {
                              onDeleteHira(hira.id);
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/30 cursor-pointer"
                          title={language === 'ar' ? 'حذف التقييم' : 'Delete HIRA'}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}

                    <div className="text-center min-w-[60px]">
                      <div className="text-[10px] text-slate-400 tracking-wider uppercase font-bold">{language === 'ar' ? 'خطر مبدئي' : 'Initial Risk'}</div>
                      <div className={`mt-1 font-mono font-bold text-sm px-2 py-1 rounded text-center border ${getRiskScoreColor(hira.initialRiskScore)}`}>
                        {hira.initialRiskScore}
                      </div>
                    </div>

                    <div className="text-center min-w-[60px]">
                      <div className="text-[10px] text-slate-400 tracking-wider uppercase font-bold">{language === 'ar' ? 'خطر متبقي' : 'Residual'}</div>
                      <div className={`mt-1 font-mono font-bold text-sm px-2 py-1 rounded text-center border ${getRiskScoreColor(hira.residualRiskScore)}`}>
                        {hira.residualRiskScore}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- 2. HIRA FORM CREATION --- */}
      {activeView === 'FORM' && (
        <form onSubmit={handleCreateHira} className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'ar' ? 'إجراء تقييم مخاطر HIRA ميداني' : 'HIRA Matrix Composer Form'}</span>
            <button 
              type="button" 
              onClick={() => setActiveView('LIST')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'تراجع' : 'Back to assessments'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 border-s- border-s--500 ps-">
            {language === 'ar' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">وصف المهمة / الوظيفة</label>
                  <input 
                    type="text" 
                    required 
                    value={taskAr} 
                    onChange={e => setTaskAr(e.target.value)}
                    placeholder="مثال: تبديل شفرات دوّار مروحة السحب والترشيح الرئيسية"
                    className="text-start w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-white focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">الخطر المترتب</label>
                  <input 
                    type="text" 
                    required
                    value={hazardAr} 
                    onChange={e => setHazardAr(e.target.value)}
                    placeholder="مثال: الانحشار الميكانيكي تحت شفرات المروحة أو تحركها فجأة"
                    className="text-start w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">العواقب المحتملة</label>
                  <input 
                    type="text" 
                    required
                    value={consequenceAr} 
                    onChange={e => setConsequenceAr(e.target.value)}
                    placeholder="مثال: بتر في الأطراف أو تهتك جلدي جراء دوران غير مخطط للمروحة"
                    className="text-start w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" 
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Task / Job Description</label>
                  <input 
                    type="text" 
                    required 
                    value={taskEn} 
                    onChange={e => setTaskEn(e.target.value)}
                    placeholder="e.g. Replacing high-voltage fan drive rotor blades"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-white focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Identified Hazard</label>
                  <input 
                    type="text" 
                    required 
                    value={hazardEn} 
                    onChange={e => setHazardEn(e.target.value)}
                    placeholder="e.g. Mechanical entrapment, crushed fingers, falling into pulley space"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Worst Possible Consequence</label>
                  <input 
                    type="text" 
                    required 
                    value={consequenceEn} 
                    onChange={e => setConsequenceEn(e.target.value)}
                    placeholder="e.g. Amputation of hand, severe trauma from rotating impact"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-sm" 
                  />
                </div>
              </>
            )}

            <div>
              {language === 'ar' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">منطقة العمل بالمصنع</label>
                  <input 
                    type="text" 
                    required 
                    value={areaAr} 
                    onChange={e => {
                      setAreaAr(e.target.value);
                      setAreaEn(e.target.value);
                    }}
                    placeholder="مثال: برج تسخين الفرن"
                    className="text-start w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-white focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Work Area / Machinery Location</label>
                  <input 
                    type="text" 
                    required 
                    value={areaEn} 
                    onChange={e => {
                      setAreaEn(e.target.value);
                      setAreaAr(e.target.value);
                    }}
                    placeholder="e.g. Kiln Preheater Tower"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-white focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
              )}
            </div>
          </div>

          {/* 5x5 Matrix selection */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Brain className="w-4 h-4" />
              <span>{language === 'ar' ? '1. تقييم كود الخطر المبدئي (5x5 Risk Assessment Matrix)' : '1. Initial 5x5 Hazard Score Assessment'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'ar' ? `احتمالية حدوث الخطر (الاحتمالية: ${likelihood} من 5)` : `Probability Matrix: Likelihood (${likelihood} of 5)`}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setLikelihood(n)}
                        className={`py-2 text-xs font-mono font-bold rounded border transition-colors ${
                          likelihood === n 
                            ? 'bg-indigo-650 bg-indigo-600 text-white border-indigo-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
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
                    {language === 'ar' ? `خطورة الضرر المحتملة (الخطورة: ${severity} من 5)` : `Hazard Severity: Severity (${severity} of 5)`}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSeverity(n)}
                        className={`py-2 text-xs font-mono font-bold rounded border transition-colors ${
                          severity === n 
                            ? 'bg-indigo-600 text-white border-indigo-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-150'
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

              <div className="flex flex-col justify-center items-center p-4 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'تقييم الخطر الكلي المبدئي' : 'Calculated Risk Rating'}</span>
                <span className={`text-4xl font-mono font-bold px-5 py-2.5 rounded-xl border mt-2 shadow-inner select-none ${getRiskScoreColor(likelihood * severity)}`}>
                  {likelihood * severity}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-neutral-400 mt-2">
                  {getRiskLevelText(likelihood * severity)}
                </span>
              </div>
            </div>
          </div>

          {/* Hierarchy of Controls Section */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4" />
              <span>{language === 'ar' ? '2. الهرمية المعتمدة للتحكم في المخاطر (Hierarchy of Controls)' : '2. Mapping Hierarchy of Controls (NEBOSH Standards)'}</span>
            </h4>
            <p className="text-xs text-slate-400 leading-normal">{language === 'ar' ? 'تعديل بيئة العمل تبدأ تنازليا من الإزالة البدنية للخطر وتختتم كدعم ثانوي بمعدات الوقاية الشخصية.' : 'Prioritize physical elimination & engineering systems over mere procedural warnings or PPE.'}</p>

            <div className="space-y-4 pt-1">
              
              {/* Elimination */}
              <div className="border-s- border-s--500 ps- py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>1. ELIMINATION | {language === 'ar' ? 'إزالة مادية ملموسة للتهديد' : 'Physical Elimination'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{language === 'ar' ? 'إزالة الخطر تمامًا' : 'Safest methodology'}</span>
                </div>
                {language === 'ar' ? (
                  <input type="text" value={eliminationAr} onChange={e => setEliminationAr(e.target.value)} placeholder="إجراءات إزالة الخطر بالعربية" className="text-start text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                ) : (
                  <input type="text" value={eliminationEn} onChange={e => setEliminationEn(e.target.value)} placeholder="Elimination measures (English)" className="text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-white" />
                )}
              </div>

              {/* Substitution */}
              <div className="border-s- border-s--500 ps- py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>2. SUBSTITUTION | {language === 'ar' ? 'استبدال مادة بمادة ومعدة أقل ضرراً' : 'Hazard Substitution'}</span>
                </div>
                {language === 'ar' ? (
                  <input type="text" value={substitutionAr} onChange={e => setSubstitutionAr(e.target.value)} placeholder="الاستبدال بالعربية" className="text-start text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                ) : (
                  <input type="text" value={substitutionEn} onChange={e => setSubstitutionEn(e.target.value)} placeholder="Substitution methods (English)" className="text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                )}
              </div>

              {/* Engineering Controls */}
              <div className="border-s- border-s--500 ps- py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>3. ENGINEERING CONTROLS | {language === 'ar' ? 'التحكم الهندسي (حواجز، عزل، تهوية)' : 'Engineering Controls'}</span>
                </div>
                {language === 'ar' ? (
                  <input type="text" value={engineeringAr} onChange={e => setEngineeringAr(e.target.value)} placeholder="التحكم الهندسي والتهوية بالعربية" className="text-start text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                ) : (
                  <input type="text" value={engineeringEn} onChange={e => setEngineeringEn(e.target.value)} placeholder="Engineering measures (English)" className="text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                )}
              </div>

              {/* Administrative */}
              <div className="border-s- border-s--500 ps- py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>4. ADMINISTRATIVE CONTROLS | {language === 'ar' ? 'التحكم الإداري (تناوب، تصاريح، تدريب)' : 'Administrative Controls'}</span>
                </div>
                {language === 'ar' ? (
                  <input type="text" value={administrativeAr} onChange={e => setAdministrativeAr(e.target.value)} placeholder="التحكمات الإدارية وتناوب الورديات" className="text-start text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                ) : (
                  <input type="text" value={administrativeEn} onChange={e => setAdministrativeEn(e.target.value)} placeholder="Administrative measures (English)" className="text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                )}
              </div>

              {/* PPE */}
              <div className="border-s- border-s--500 ps- py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>5. PERSONAL PROTECTIVE EQUIPMENT (PPE) | {language === 'ar' ? 'معدات الوقاية الشخصية' : 'Personal Protective Equipment'}</span>
                </div>
                {language === 'ar' ? (
                  <input type="text" value={ppeAr} onChange={e => setPpeAr(e.target.value)} placeholder="معدات الوقاية المطلوبة بدقة بالعربية" className="text-start text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                ) : (
                  <input type="text" value={ppeEn} onChange={e => setPpeEn(e.target.value)} placeholder="Required PPE (English)" className="text-xs p-2 w-full rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                )}
              </div>

            </div>
          </div>

          {/* Residual risk */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-orange-500" />
              <span>{language === 'ar' ? '3. تقييم كود الخطر المتبقي (Expected Residual Risk Rating)' : '3. Final Residual Risk Rating After Safeguards'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {language === 'ar' ? `الاحتمالية المتبقية (${resLikelihood} من 5)` : `Residual Likelihood (${resLikelihood} of 5)`}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setResLikelihood(n)}
                        className={`py-1 text-xs font-mono font-bold rounded border transition-colors ${
                          resLikelihood === n 
                            ? 'bg-orange-600 text-white border-orange-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {language === 'ar' ? `الخطورة المتبقية (${resSeverity} من 5)` : `Residual Severity (${resSeverity} of 5)`}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setResSeverity(n)}
                        className={`py-1 text-xs font-mono font-bold rounded border transition-colors ${
                          resSeverity === n 
                            ? 'bg-orange-600 text-white border-orange-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center p-4 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الخطر المتبقي المقدر' : 'Residual Rating'}</span>
                <span className={`text-3xl font-mono font-bold px-4 py-1.5 rounded-lg border mt-2 ${getRiskScoreColor(resLikelihood * resSeverity)}`}>
                  {resLikelihood * resSeverity}
                </span>
                <span className="text-xs text-slate-500 font-bold mt-1">
                  {getRiskLevelText(resLikelihood * resSeverity)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveView('LIST')}
              className="px-5 py-2 rounded font-bold text-xs text-slate-500 border border-slate-250 dark:border-slate-800 hover:bg-slate-50"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-650 text-white font-bold text-xs rounded shadow transition-all"
            >
              {language === 'ar' ? 'إرسال للمراجعة والاعتماد' : 'Submit HIRA for HSE Signoff'}
            </button>
          </div>
        </form>
      )}

      {/* --- 3. AUDIT / HIRA DETAILED VIEW WITH WORKFLOW APPROVALS --- */}
      {activeView === 'DETAIL' && activeHira && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <button 
              onClick={() => setActiveView('LIST')}
              className="text-slate-500 hover:text-slate-850 dark:hover:text-white flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'العودة لتقييمات HIRA' : 'Back to HIRAs'}</span>
            </button>

            {currentRole === 'HSE' && activeHira.status === 'PENDING_HSE' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApproveHira(activeHira.id, false)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'رفض' : 'Reject'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveHira(activeHira.id, true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'اعتماد التقييم' : 'Approve & Standardize'}</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {isCompanyAdmin && activeHira && (
                <>
                  <button
                    type="button"
                    onClick={() => startEditHira(activeHira)}
                    className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer hover:bg-indigo-100 transition-colors"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'تعديل التقييم ✏️' : 'Edit HIRA ✏️'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(language === 'ar' ? `⚠️ هل أنت متأكد كأدمن من مسح تقييم المخاطر [${activeHira.id}] نهائياً؟` : `⚠️ Delete HIRA [${activeHira.id}]?`)) {
                        onDeleteHira(activeHira.id);
                        setActiveView('LIST');
                      }
                    }}
                    className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>{language === 'ar' ? 'حذف التقييم 🗑️' : 'Delete HIRA 🗑️'}</span>
                  </button>
                </>
              )}

              {activeHira.status === 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => onCreatePermitFromHira && onCreatePermitFromHira(activeHira)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>{language === 'ar' ? 'إنشاء تصريح عمل لهذه المهمة' : 'Create PTW for this Task'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
            <div>
              <span className="font-mono text-xs font-bold text-orange-500 uppercase tracking-wider">{activeHira.id}</span>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                {language === 'ar' ? activeHira.taskAr : activeHira.taskEn}
              </h3>
            </div>

            <div className="flex gap-4 p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 rounded-lg text-xs">
              <div className="w-1/2">
                <span className="font-bold text-slate-500 uppercase tracking-widest">{language === 'ar' ? 'المنطقة:' : 'Assessed Area:'}</span>
                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-300">{language === 'ar' ? activeHira.areaAr : activeHira.areaEn}</p>
              </div>
              <div className="w-1/2">
                <span className="font-bold text-slate-500 uppercase tracking-widest">{language === 'ar' ? 'محرر من قبل:' : 'Assessor Details:'}</span>
                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-300">{activeHira.assessedBy} • {activeHira.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg text-sm">
                <span className="font-bold text-red-500 flex items-center gap-1.5 mb-1 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{language === 'ar' ? 'الخطر المعزول المحدد مسبقاً' : 'Core Identified Hazard'}</span>
                </span>
                <p className="font-medium text-slate-700 dark:text-slate-300">{language === 'ar' ? activeHira.hazardAr : activeHira.hazardEn}</p>
              </div>

              <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg text-sm">
                <span className="font-bold text-red-500 flex items-center gap-1.5 mb-1 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{language === 'ar' ? 'عاقبة المخاطرة الفورية' : 'Potential Consequence'}</span>
                </span>
                <p className="font-medium text-slate-700 dark:text-slate-300">{language === 'ar' ? activeHira.consequenceAr : activeHira.consequenceEn}</p>
              </div>
            </div>
          </div>

          {/* Hierarchy details read-only panel */}
          <div className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b pb-2">{language === 'ar' ? 'تدابير السيطرة المطبقة (Hierarchy Control Matrix)' : 'Applied Safeguards & Safety Barrier Matrix'}</h4>

            <div className="space-y-4 text-xs font-sans">
              {[
                { label: 'ELIMINATION | إزالة مادية', keyEn: 'eliminationEn', keyAr: 'eliminationAr', color: 'border-s--500 bg-red-50/15 dark:bg-red-950/5' },
                { label: 'SUBSTITUTION | استبدال فني', keyEn: 'substitutionEn', keyAr: 'substitutionAr', color: 'border-s--500 bg-amber-50/15' },
                { label: 'ENGINEERING CONTROLS | تحكم هندسي', keyEn: 'engineeringEn', keyAr: 'engineeringAr', color: 'border-s--500 bg-indigo-50/15' },
                { label: 'ADMINISTRATIVE CONTROLS | تدابير ورقية وتدريب', keyEn: 'administrativeEn', keyAr: 'administrativeAr', color: 'border-s--500 bg-sky-50/15' },
                { label: 'PPE | معدات الوقاية الشخصية الوقائية', keyEn: 'ppeEn', keyAr: 'ppeAr', color: 'border-s--500' }
              ].map((lvl, index) => {
                const textEn = activeHira.controls[lvl.keyEn as keyof HiraControlMeasures];
                const textAr = activeHira.controls[lvl.keyAr as keyof HiraControlMeasures];

                return (
                  <div key={index} className={`border-s- ${lvl.color} p-3 rounded bg-slate-50/50 dark:bg-slate-950`}>
                    <strong className="text-slate-650 font-bold block mb-1 text-[11px] text-slate-600 dark:text-slate-450">{lvl.label}</strong>
                    {textEn ? (
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200 leading-normal">{textEn}</p>
                        <p className="text-slate-400 text-[11px] text-start mt-1 font-semibold">{textAr}</p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">{language === 'ar' ? 'غير مطلوب أو غير قابل للتطبيق لهذه المهمة.' : 'No control mapped in this level.'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scoring Summary Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl grid grid-cols-2 gap-4">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-950 rounded text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'تقييم الخطر المبدئي' : 'Initial Likelihood × Severity'}</span>
              <span className="text-base font-mono font-bold text-slate-500 block mt-1">{activeHira.initialLikelihood} × {activeHira.initialSeverity}</span>
              <span className={`inline-block mt-1.5 font-bold font-mono text-sm px-3 py-1 rounded border ${getRiskScoreColor(activeHira.initialRiskScore)}`}>
                {activeHira.initialRiskScore} ({getRiskLevelText(activeHira.initialRiskScore).split('|')[0].trim()})
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-950 rounded text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'تقييم الخطر المتبقي' : 'Residual Likelihood × Severity'}</span>
              <span className="text-base font-mono font-bold text-slate-500 block mt-1">{activeHira.residualLikelihood} × {activeHira.residualSeverity}</span>
              <span className={`inline-block mt-1.5 font-bold font-mono text-sm px-3 py-1 rounded border ${getRiskScoreColor(activeHira.residualRiskScore)}`}>
                {activeHira.residualRiskScore} ({getRiskLevelText(activeHira.residualRiskScore).split('|')[0].trim()})
              </span>
            </div>
          </div>

          {activeHira.approvedBy && (
            <div className="bg-emerald-50 dark:bg-emerald-950/25 border-s-4 border-s-emerald-500 p-4 rounded-lg text-xs" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <strong className="text-emerald-800 dark:text-emerald-450 font-bold block mb-1">{language === 'ar' ? 'توثيق الاعتماد والتوحيد النهائي:' : 'HIRA Approval Documentation Record:'}</strong>
              <p className="text-slate-700 dark:text-slate-350">{language === 'ar' ? `الحالة: (${activeHira.status}) - تم الاعتماد/المراجعة بواسطة: ${activeHira.approvedBy} في التاريخ: ${activeHira.approvedAt}` : `Status: (${activeHira.status}) - Reviewed by ${activeHira.approvedBy} on ${activeHira.approvedAt}`}</p>
            </div>
          )}

          {activeHira.status !== 'APPROVED' && (
            <div className="flex gap-3 justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const reviewer = currentUser ? (language === 'ar' ? currentUser.fullNameAr : currentUser.fullNameEn) : (language === 'ar' ? 'مشرف السلامة' : 'Safety Supervisor');
                  onUpdateHira({
                    ...activeHira,
                    status: 'REJECTED',
                    approvedBy: reviewer,
                    approvedAt: new Date().toISOString().substring(0, 10)
                  });
                }}
                className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                ❌ {language === 'ar' ? 'رفض تقييم المخاطر' : 'Reject HIRA'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const reviewer = currentUser ? (language === 'ar' ? currentUser.fullNameAr : currentUser.fullNameEn) : (language === 'ar' ? 'مشرف السلامة' : 'Safety Supervisor');
                  onUpdateHira({
                    ...activeHira,
                    status: 'APPROVED',
                    approvedBy: reviewer,
                    approvedAt: new Date().toISOString().substring(0, 10)
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                ✅ {language === 'ar' ? 'اعتماد تقييم المخاطر صراحةً' : 'Approve & Certify HIRA'}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
