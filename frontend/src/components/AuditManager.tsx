import React from 'react';
import { SafetyAudit, AuditCheckItem, Language } from '../types';
import { 
  ClipboardCheck, Clipboard, Plus, 
  Check, X, CircleSlash, ArrowLeft, FileText
} from 'lucide-react';

interface AuditManagerProps {
  audits: SafetyAudit[];
  onAddAudit: (audit: SafetyAudit) => void;
  onUpdateAudit: (audit: SafetyAudit) => void;
  language: Language;
}

export const AuditManager: React.FC<AuditManagerProps> = ({
  audits,
  onAddAudit,
  language
}) => {
  const [activeView, setActiveView] = React.useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [selectedAuditId, setSelectedAuditId] = React.useState<string | null>(null);

  // Form states to create a new audit
  const [titleEn, setTitleEn] = React.useState('');
  const [titleAr, setTitleAr] = React.useState('');
  const [checklistItems, setChecklistItems] = React.useState<AuditCheckItem[]>([
    { id: 'ch-1', labelEn: 'Guarding elements are physical locked on Rotating Machinery (Belt Gears)', labelAr: 'مصدات وحواجز الحماية مثبتة بإحكام حول الأجزاء الدوارة (محركات التروس)', compliance: 'NA' },
    { id: 'ch-2', labelEn: 'Electrical switchboards and main breakers are unblocked and isolated', labelAr: 'القواطع الرئيسية وبطاقات عزل اللوحات الكهربائية واضحة ومغلقة', compliance: 'NA' },
    { id: 'ch-3', labelEn: 'General Housekeeping: walkways are completely free of clinker dust spikes', labelAr: 'ترتيب ونظافة الموقع: ممرات الهروب خالية من تراكم غبار وبقايا الكلنكر', compliance: 'NA' },
    { id: 'ch-4', labelEn: 'Escape doors are unlocked, illuminated and fire signs are properly visible', labelAr: 'مخارج الطوارئ مضاءة وغير مغلقة وتتواجد لوحات التوجيه بوضوح', compliance: 'NA' },
    { id: 'ch-5', labelEn: 'Fire extinguishers are in-date, tagged, and pressure needles are in green', labelAr: 'طفايات الحريق سارية الصلاحية ومميزة ببطاقات الفحص ونسبة المؤشر خضراء', compliance: 'NA' }
  ]);

  const [newItemEn, setNewItemEn] = React.useState('');
  const [newItemAr, setNewItemAr] = React.useState('');
  const [correctiveText, setCorrectiveText] = React.useState('');

  const activeAudit = audits.find(a => a.id === selectedAuditId);

  // Quick custom checklist items creator inside form
  const handleAddCustomCheckItem = (e: React.FormEvent) => {
    e.preventDefault();
    const textToUse = language === 'ar' ? (newItemAr || newItemEn) : (newItemEn || newItemAr);
    if (!textToUse.trim()) return;

    const added: AuditCheckItem = {
      id: `ch-custom-${Date.now()}`,
      labelEn: newItemEn || newItemAr,
      labelAr: newItemAr || newItemEn,
      compliance: 'NA'
    };

    setChecklistItems([...checklistItems, added]);
    setNewItemEn('');
    setNewItemAr('');
  };

  const handleCreateAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const titleToUse = language === 'ar' ? (titleAr || titleEn) : (titleEn || titleAr);
    if (!titleToUse.trim()) return;

    // Calculate score
    const scoredList = checklistItems.map(item => ({ ...item, compliance: item.compliance === 'NA' ? 'COMPLIANT' : item.compliance }));
    const compliantCount = scoredList.filter(c => c.compliance === 'COMPLIANT').length;
    const nonCompliantCount = scoredList.filter(c => c.compliance === 'NON_COMPLIANT').length;
    const totalConsidered = compliantCount + nonCompliantCount;
    const calculatedScore = totalConsidered > 0 ? (compliantCount / totalConsidered) * 100 : 100;

    const newAudit: SafetyAudit = {
      id: `AUDIT-2026-0${Math.floor(10 + Math.random() * 89)}`,
      titleEn: titleEn || titleAr,
      titleAr: titleAr || titleEn,
      conductedBy: language === 'ar' ? 'أخصائي السلامة الميداني' : 'Eng. Asaad Al-Shamrani',
      date: new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
      items: scoredList,
      score: parseFloat(calculatedScore.toFixed(1)),
      correctiveActionsNeeded: correctiveText.trim() ? correctiveText : undefined
    };

    onAddAudit(newAudit);
    
    // reset form
    setTitleEn('');
    setTitleAr('');
    setCorrectiveText('');
    setChecklistItems([
      { id: 'ch-1', labelEn: 'Guarding elements are locked on Rotating Machinery (Belt Gears)', labelAr: 'مصدات وحواجز الحماية مثبتة بإحكام حول الأجزاء الدوارة (محركات التروس)', compliance: 'NA' },
      { id: 'ch-2', labelEn: 'Electrical switchboards and main breakers are unblocked and isolated', labelAr: 'القواطع الرئيسية وبطاقات عزل اللوحات الكهربائية واضحة ومغلقة', compliance: 'NA' },
      { id: 'ch-3', labelEn: 'General Housekeeping: walkways are completely free of clinker dust spikes', labelAr: 'ترتيب ونظافة الموقع: ممرات الهروب خالية من تراكم غبار وبقايا الكلنكر', compliance: 'NA' },
      { id: 'ch-4', labelEn: 'Escape doors are unlocked, illuminated and fire signs are properly visible', labelAr: 'مخارج الطوارئ مضاءة وغير مغلقة وتتواجد لوحات التوجيه بوضوح', compliance: 'NA' },
      { id: 'ch-5', labelEn: 'Fire extinguishers are in-date, tagged, and pressure needles are in green', labelAr: 'طفايات الحريق سارية الصلاحية ومميزة ببطاقات الفحص ونسبة المؤشر خضراء', compliance: 'NA' }
    ]);

    setActiveView('LIST');
  };

  const handleUpdateItemCompliance = (itemId: string, status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NA', commentText?: string) => {
    const updatedItems = checklistItems.map(it => {
      if (it.id === itemId) {
        return { ...it, compliance: status, comment: commentText !== undefined ? commentText : it.comment } as AuditCheckItem;
      }
      return it;
    });
    setChecklistItems(updatedItems);
  };

  const getScoreColorText = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreColorBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200';
    if (score >= 70) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200';
    return 'bg-red-50 dark:bg-red-950/20 border-red-200';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-orange-500" />
            <span>{language === 'ar' ? 'رحلات تفتيش جولات السلامة وتدقيق الامتثال' : 'Safety Inspections & Compliance Audits'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar' 
              ? 'إدارة لجان تفتيش الأمان الميدانية، قياس مؤشرات التوافق والامتثال الكلي، وتسجيل خطط العمل التصحيحية.'
              : 'Run safety checks, calculate live compliance percentages, and specify mandatory remediation actions.'}
          </p>
        </div>

        {activeView === 'LIST' && (
          <button
            onClick={() => setActiveView('FORM')}
            className="bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm select-none transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إجراء تدقيق سلامة جديد' : 'Conduct Safety Audit'}</span>
          </button>
        )}
      </div>

      {/* --- 1. LIST AUDITS --- */}
      {activeView === 'LIST' && (
        <div className="space-y-4">
          {audits.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Clipboard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{language === 'ar' ? 'لا توجد تقارير تدقيق مسجلة.' : 'No safety audits recorded.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {audits.map((audit) => (
                <div 
                  key={audit.id}
                  onClick={() => {
                    setSelectedAuditId(audit.id);
                    setActiveView('DETAIL');
                  }}
                  className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-orange-500 rounded-xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-2 grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{audit.id}</span>
                      <span className="text-[10px] sm:text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 px-2.5 py-0.5 rounded border border-emerald-200/50">
                        {language === 'ar' ? 'تدقيق مكتمل ومؤرشف' : 'Verified Complete'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                      {language === 'ar' ? audit.titleAr : audit.titleEn}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{language === 'ar' ? 'المفتش الخبير:' : 'Auditor:'} {audit.conductedBy}</span>
                      <span>{audit.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 min-w-[120px] justify-between border-t md:border-t-0 pt-3 md:pt-0">
                    <div className={`p-2.5 border rounded-lg text-center w-full shadow-sm ${getScoreColorBg(audit.score)}`}>
                      <div className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-0.5">{language === 'ar' ? 'نسبة الامتثال' : 'Compliance Rate'}</div>
                      <span className={`text-2xl font-bold font-mono ${getScoreColorText(audit.score)}`}>
                        {audit.score}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- 2. AUDIT CREATION FORM --- */}
      {activeView === 'FORM' && (
        <form onSubmit={handleCreateAudit} className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'ar' ? 'تجهيز وإجراء جولة تفتيشية' : 'Custom Inspection Checklist Form'}</span>
            <button 
              type="button" 
              onClick={() => setActiveView('LIST')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'تراجع' : 'Back to list'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {language === 'ar' ? 'عنوان التدقيق والتفتيش الميداني' : 'Safety Audit Title'}
            </label>
            <input 
              type="text" 
              required 
              value={language === 'ar' ? titleAr : titleEn} 
              onChange={e => {
                setTitleAr(e.target.value);
                setTitleEn(e.target.value);
              }}
              placeholder={language === 'ar' ? 'مثال: التدقيق الأسبوعي لوحدة طحن الإسمنت الخط الأول' : 'e.g. Mechanical Grinding Mill Line 1 Weekly Audit'}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" 
            />
          </div>

          {/* CHECKLIST WORKFLOW */}
          <div className="space-y-4 border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 tracking-wider uppercase border-b pb-2">
              {language === 'ar' ? '1. مراجعة واستيفاء بنود فحص السلامة الميدانية' : '1. Core Safety Verification Actions'}
            </h4>

            <div className="space-y-4 pt-2">
              {checklistItems.map((item, index) => (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 p-4 rounded-lg flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
                >
                  <div className="space-y-1 grow max-w-xl">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {language === 'ar' ? `البند ${index + 1}` : `POINT ${index + 1}`}
                    </span>
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200 font-sans leading-normal">
                      {language === 'ar' ? item.labelAr : item.labelEn}
                    </p>
                    
                    {item.compliance === 'NON_COMPLIANT' && (
                      <div className="mt-2 text-start">
                        <input
                          type="text"
                          placeholder={language === 'ar' ? 'أدخل تفاصيل المخالفة والمشكلة...' : 'Specify hazard or deviation observed...'}
                          value={item.comment || ''}
                          onChange={(e) => handleUpdateItemCompliance(item.id, 'NON_COMPLIANT', e.target.value)}
                          className="w-full text-xs p-1.5 border border-red-200 bg-red-50/20 dark:border-red-900 rounded"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5 grow-0 w-full md:w-auto shrink-0 justify-end">
                    <button
                      type="button"
                      onClick={() => handleUpdateItemCompliance(item.id, 'COMPLIANT')}
                      className={`px-3 py-1.5 text-xs rounded font-bold border transition-all flex items-center gap-1 w-1/3 md:w-auto justify-center ${
                        item.compliance === 'COMPLIANT' 
                          ? 'bg-emerald-600 text-white border-emerald-700' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-450 hover:bg-slate-100 border-slate-200 dark:border-slate-850'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'آمن' : 'Safe'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateItemCompliance(item.id, 'NON_COMPLIANT')}
                      className={`px-3 py-1.5 text-xs rounded font-bold border transition-all flex items-center gap-1 w-1/3 md:w-auto justify-center ${
                        item.compliance === 'NON_COMPLIANT' 
                          ? 'bg-red-600 text-white border-red-700' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-450 hover:bg-slate-100 border-slate-200 dark:border-slate-850'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'مخالف' : 'Violated'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateItemCompliance(item.id, 'NA')}
                      className={`px-3 py-1.5 text-xs rounded font-bold border transition-all flex items-center gap-1 w-1/3 md:w-auto justify-center ${
                        item.compliance === 'NA' 
                          ? 'bg-slate-400 text-white border-slate-500' 
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-450 hover:bg-slate-100 border-slate-200 dark:border-slate-850'
                      }`}
                    >
                      <CircleSlash className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'غير مطبق' : 'N/A'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form to add custom checklist point */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-col md:flex-row gap-3 items-end">
              <div className="grow space-y-2">
                <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                  {language === 'ar' ? 'إضافة بند فحص مخصص:' : 'Add Custom Check Point:'}
                </span>
                <input 
                  type="text" 
                  value={language === 'ar' ? newItemAr : newItemEn} 
                  onChange={e => {
                    setNewItemAr(e.target.value);
                    setNewItemEn(e.target.value);
                  }} 
                  placeholder={language === 'ar' ? 'مثال: يجب التحقق من صلاحية حبال سحب الإيقاف الفوري الممتدة' : 'e.g. Emergency shutdown pull cords must be verified'} 
                  className="w-full text-xs p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded" 
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomCheckItem}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs p-2.5 rounded shrink-0 flex items-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إدراج بالاستمارة' : 'Insert Item'}</span>
              </button>
            </div>
          </div>

          {/* Remediation notes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
              {language === 'ar' ? 'توصيات التدقيق والإجراءات المباشرة المفروضة' : 'Mandatory Corrective Action Summary & Guidance'}
            </label>
            <textarea
              rows={3}
              value={correctiveText}
              onChange={e => setCorrectiveText(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب خطة إجرائية تفصيلية للتصحيح السريع والمسؤول المباشر لجميع الملاحظات غير الممتثلة...' : 'Write down required steps to rectify non-complying checklist issues...'}
              className="w-full text-xs p-3 border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-lg focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveView('LIST')}
              className="px-5 py-2 border border-slate-250 dark:border-slate-850 rounded text-slate-500 font-bold text-xs"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded shadow-md transition-all"
            >
              {language === 'ar' ? 'حفظ وإيداع ملف التدقيق' : 'Save & Close Safety Audit'}
            </button>
          </div>
        </form>
      )}

      {/* --- 3. AUDIT DETAILS AND SCORES VIEW --- */}
      {activeView === 'DETAIL' && activeAudit && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <button 
              onClick={() => setActiveView('LIST')}
              className="text-slate-500 hover:text-slate-850 dark:hover:text-white flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'العودة لتقارير التدقيق' : 'Back to audits'}</span>
            </button>

            <span className="text-[11px] font-mono font-bold text-slate-400">{activeAudit.id}</span>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'ar' ? activeAudit.titleAr : activeAudit.titleEn}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span>{language === 'ar' ? 'المفتش:' : 'Safety Auditor:'} {activeAudit.conductedBy}</span>
                  <span>{activeAudit.date}</span>
                </div>
              </div>

              <div className={`p-4 border rounded-lg text-center ${getScoreColorBg(activeAudit.score)}`}>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  {language === 'ar' ? 'نسبة الامتثال' : 'Safety Percentage'}
                </span>
                <div className={`text-3xl font-mono font-bold mt-1 ${getScoreColorText(activeAudit.score)}`}>
                  {activeAudit.score}%
                </div>
              </div>
            </div>

            {/* Checklist results */}
            <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 rounded-lg overflow-hidden shrink-0">
              <h4 className="text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-3 border-b">
                {language === 'ar' ? 'فحص البنود التفصيلية والنتائج:' : 'Safety Checklist Points Status:'}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                {activeAudit.items.map((item, index) => (
                  <div key={item.id} className="p-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {language === 'ar' ? `البند ${index + 1}` : `ITEM ${index + 1}`}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200 leading-normal">
                        {language === 'ar' ? item.labelAr : item.labelEn}
                      </p>
                      {item.comment && (
                        <div className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                          <strong>{language === 'ar' ? 'ملاحظة التدقيق السلبي:' : 'Audit Non-Conformity Warning:'}</strong> {item.comment}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {item.compliance === 'COMPLIANT' ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border border-emerald-300 px-3 py-1 rounded text-xs font-bold block text-center min-w-[100px]">
                          {language === 'ar' ? 'ممتثل' : 'Compliant'}
                        </span>
                      ) : item.compliance === 'NON_COMPLIANT' ? (
                        <span className="bg-red-50 dark:bg-red-950/25 text-red-600 dark:text-red-400 border border-red-300 px-3 py-1 rounded text-xs font-bold block text-center min-w-[100px]">
                          {language === 'ar' ? 'مخالف' : 'Non-Compliant'}
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-450 border px-3 py-1 rounded text-xs font-bold block text-center min-w-[100px]">
                          {language === 'ar' ? 'غير مطبق' : 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Corrective measures needed */}
            {activeAudit.correctiveActionsNeeded && (
              <div className="p-4 bg-orange-50/50 dark:bg-neutral-900 border-s-4 border-orange-500 rounded text-xs">
                <strong className="text-orange-700 dark:text-orange-400 block mb-1.5 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span>{language === 'ar' ? 'المعايير المفروضة وخطة إزالة المخالفات الصادرة:' : 'Assigned Corrective Safeguard Requirements:'}</span>
                </strong>
                <p className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{activeAudit.correctiveActionsNeeded}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
