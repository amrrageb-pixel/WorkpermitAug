import React from 'react';
import { Brain, Sparkles, Send, Copy, FileSpreadsheet, Loader2, RefreshCw } from 'lucide-react';

import { Language } from '../types';
import { getApiUrl } from '../utils/api';

interface SafetyAiCopilotProps {
  language: Language;
}

export const SafetyAiCopilot: React.FC<SafetyAiCopilotProps> = ({ language }) => {
  const [promptType, setPromptType] = React.useState<'HIRA_AI' | 'PREDICTIVE_ANALYTICS' | 'CAPA_SUGGESTIONS'>('HIRA_AI');
  const [taskText, setTaskText] = React.useState('Welding joint cracks inside secondary clinker cooling silos');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string>('');
  const [source, setSource] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);

  const fetchAiRecommendations = async () => {
    setLoading(true);
    setResult('');
    setSource('');
    try {
      const response = await fetch(`${getApiUrl()}/api/ai/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptType,
          task: taskText,
          currentStatus: 'REPORTED'
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setResult(data.recommendation);
      setSource(data.source || 'Gemini 3.5 Flash Safety Assistant');
    } catch (e) {
      console.error(e);
      setResult(
        language === 'ar'
          ? 'المعذرة، حدث خطأ أثناء الاتصال بمساعد السلامة الذكي. يرجى مراجعة إعدادات الخادم.'
          : 'Failed to retrieve AI predictions. Please verify the backend logs.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-950 dark:to-slate-900 rounded-xl shadow-lg border border-indigo-150 dark:border-indigo-950/40 p-6 flex flex-col gap-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-indigo-100 dark:border-indigo-950 pb-4">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md animate-pulse">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>{language === 'ar' ? 'مساعد نيبوش للتحليل الوقائي بالذكاء الاصطناعي' : 'NEBOSH AI Safety Copilot Console'}</span>
            <span className="text-[10px] uppercase font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded dark:bg-indigo-950 dark:text-indigo-400">ISO 45001 Live</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ar' 
              ? 'توليد توصيات وقائية فورية وهندسة التحكم، وتحليل جودة تصاريح العمل بناءً على نموذج جمني المطور.'
              : 'Generate instant hierarchy controls, predictive failure analysis and risk mitigation recommendations.'}
          </p>
        </div>
      </div>

      {/* Choice Panel */}
      <div className="space-y-4">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block">{language === 'ar' ? 'اختر نمط التحليل والذكاء الاصطناعي:' : 'Choose EHS Analytics Stream:'}</label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setPromptType('HIRA_AI');
              setTaskText('Welding joint cracks inside secondary clinker cooling silos');
            }}
            className={`p-3 text-xs font-bold rounded-lg border text-end flex flex-col justify-between transition-all select-none ${
              promptType === 'HIRA_AI'
                ? 'border-indigo-600 bg-white text-indigo-700 shadow dark:bg-slate-900 dark:text-indigo-400'
                : 'border-slate-200 bg-slate-50/50 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-2 text-indigo-500" />
            <div>
              <span className="block font-bold">{language === 'ar' ? '1. مصفوفة المخاطر HIRA' : '1. Hazard Controls (HIRA)'}</span>
              <span className="text-[10px] text-slate-400 font-normal mt-0.5 block">{language === 'ar' ? 'توليد تدابير وقائية للمهمة' : 'Hierarchy-based controls'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPromptType('PREDICTIVE_ANALYTICS');
              setTaskText('Predictive monthly risk matrix forecast for Cement Mills & Kiln burner line under ongoing shutdowns.');
            }}
            className={`p-3 text-xs font-bold rounded-lg border text-end flex flex-col justify-between transition-all select-none ${
              promptType === 'PREDICTIVE_ANALYTICS'
                ? 'border-indigo-600 bg-white text-indigo-700 shadow dark:bg-slate-900 dark:text-indigo-400'
                : 'border-slate-200 bg-slate-50/50 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mb-2 text-indigo-500" />
            <div>
              <span className="block font-bold">{language === 'ar' ? '2. التنبؤ بالحوادث' : '2. Incident Forecasting'}</span>
              <span className="text-[10px] text-slate-400 font-normal mt-0.5 block">{language === 'ar' ? 'توقع بؤر المخاطر الساخنة' : 'EHS predictive heat spots'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPromptType('CAPA_SUGGESTIONS');
              setTaskText('Electrical contactor burns inside Raw Mill switchgear subpanel');
            }}
            className={`p-3 text-xs font-bold rounded-lg border text-end flex flex-col justify-between transition-all select-none ${
              promptType === 'CAPA_SUGGESTIONS'
                ? 'border-indigo-600 bg-white text-indigo-700 shadow dark:bg-slate-900 dark:text-indigo-400'
                : 'border-slate-200 bg-slate-50/50 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Brain className="w-4 h-4 mb-2 text-indigo-500" />
            <div>
              <span className="block font-bold">{language === 'ar' ? '3. الإجراءات التصحيحية CAPA' : '3. Remediation Plans (CAPA)'}</span>
              <span className="text-[10px] text-slate-400 font-normal mt-0.5 block">{language === 'ar' ? 'حلول فورية للمخالفات' : 'Immediate safeguard rules'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Input query */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">
          {language === 'ar' ? 'وصف تفاصيل المهمة أو الظرف الطارئ:' : 'Describe the hazardous task or EHS scenario:'}
        </label>
        <textarea
          rows={3}
          value={taskText}
          onChange={e => setTaskText(e.target.value)}
          placeholder={language === 'ar' ? 'اكتب وصفاً دقيقاً للمخططات لضمان تحليل آمن مخصص...' : 'Provide complete operational details here...'}
          className="w-full text-xs p-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg sm:text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Action button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={fetchAiRecommendations}
          disabled={loading || !taskText.trim()}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2 select-none cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{language === 'ar' ? 'جارٍ تحليل بيانات السلامة...' : 'Gemini computing controls...'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{language === 'ar' ? 'بدء تحليل نيبوش الذكي' : 'Invoke Safety Copilot'}</span>
            </>
          )}
        </button>
      </div>

      {/* AI Output Window */}
      {result && (
        <div className="bg-slate-950 text-slate-100 rounded-xl p-5 border border-slate-850 space-y-4 shadow-inner" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-450 text-indigo-400 uppercase font-bold tracking-widest font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'التحليلات والمقترحات الصادرة' : 'Verified Safety Suggestions'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9.5px] text-slate-500 font-mono italic">SOURCE: {source}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 px-2 rounded bg-slate-900 border border-slate-850 text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ المقترح' : 'Copy')}</span>
              </button>
            </div>
          </div>

          <div className="text-xs sm:text-sm font-sans leading-relaxed text-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto pe-">
            {result}
          </div>

          <div className="border-t border-slate-900 pt-2 text-[10px] text-slate-500 text-center uppercase tracking-widest font-semibold">
            {language === 'ar' ? 'توصيات استشارية - يرجى دائمًا التحقق الميداني من عزل الغاز والكهرباء بمصانع الإسمنت.' : 'Consultative insights - Always physically verify isolation & toxicity prior to works.'}
          </div>
        </div>
      )}

    </div>
  );
};
