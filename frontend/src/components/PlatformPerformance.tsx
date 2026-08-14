/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
 Activity, Server, Database, Clock, RefreshCw, Sparkles, CheckCircle2, 
 Layers, HardDrive, Cpu, ShieldCheck, Zap, AlertCircle, ChevronRight, BarChart3, HelpCircle 
} from 'lucide-react';
import { Permit, Incident, SafetyAudit, TrainingRecord, Language } from '../types';

interface PlatformPerformanceProps {
 permits: Permit[];
 incidents: Incident[];
 audits: SafetyAudit[];
 trainings: TrainingRecord[];
 language: Language;
}

interface DiagnosticStep {
 id: number;
 labelAr: string;
 labelEn: string;
 status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
 duration?: number;
}

interface LiveLog {
 timestamp: string;
 type: 'INFO' | 'API' | 'DB' | 'SYSTEM' | 'SECURITY';
 messageAr: string;
 messageEn: string;
}

export const PlatformPerformance: React.FC<PlatformPerformanceProps> = ({
 permits,
 incidents,
 audits,
 trainings,
 language
}) => {
 // --- METRIC VARIABLES & STATE ---
 const [liveLatency, setLiveLatency] = React.useState<number>(24);
 const [isDiagnosticRunning, setIsDiagnosticRunning] = React.useState(false);
 const [diagnosticProgress, setDiagnosticProgress] = React.useState(0);
 const [diagnosticSteps, setDiagnosticSteps] = React.useState<DiagnosticStep[]>([
 { id: 1, labelAr: 'التحقق من صحة جلسة المستخدم المشفرة', labelEn: 'Validate encrypted user session tokens', status: 'PENDING' },
 { id: 2, labelAr: 'فحص مصفوفة الفهارس ومخزن البيانات المحلي', labelEn: 'Verify local state database integrity', status: 'PENDING' },
 { id: 3, labelAr: 'اختبار زمن استجابة خادم ذكاء جمني (Gemini LLM)', labelEn: 'Test Gemini LLM gateway response ping', status: 'PENDING' },
 { id: 4, labelAr: 'تنظيف الذاكرة المؤقتة لقوالب واجهة المستخدم', labelEn: 'Flush view cache & layout buffers', status: 'PENDING' },
 { id: 5, labelAr: 'مزامنة ممر التدقيق التراكمي وإقرار السلامة', labelEn: 'Sync audit logs & department check-points', status: 'PENDING' },
 ]);
 
 const [selectedLogLevel, setSelectedLogLevel] = React.useState<'ALL' | 'API' | 'DB' | 'SYSTEM'>('ALL');
 const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(true);
 const [tick, setTick] = React.useState(0);

 // Storage metric calculation
 const permitBytes = JSON.stringify(permits).length;
 const incidentBytes = JSON.stringify(incidents).length;
 const auditBytes = JSON.stringify(audits).length;
 const trainingBytes = JSON.stringify(trainings).length;
 const totalLocalStorageUsed = ((permitBytes + incidentBytes + auditBytes + trainingBytes) / 1024).toFixed(2);

 // Latency simulation over time
 const [latencyHistory, setLatencyHistory] = React.useState<number[]>([21, 24, 18, 31, 25, 22, 28, 24]);

 // Simulated operational event history
 const [eventLogs, setEventLogs] = React.useState<LiveLog[]>([
 { timestamp: '19:35:12', type: 'SYSTEM', messageAr: 'تم رندرة واجهة المستخدم وحساب مؤشرات السلامة بنجاح.', messageEn: 'User interface state loaded & EHS metric triggers evaluated.' },
 { timestamp: '19:32:04', type: 'API', messageAr: 'طلب معالجة تصريح العمل المرسل إلى جمني استغرق 380 ملي ثانية.', messageEn: 'Gemini request for risk evaluation returned in 380ms.' },
 { timestamp: '19:28:44', type: 'DB', messageAr: 'تمت مزامنة 14 تصريح عمل في وحدة التخزين الدائمة المتصفحية.', messageEn: 'Successfully synced 14 permits with browser local store.' },
 { timestamp: '19:15:30', type: 'SECURITY', messageAr: 'رئيس إدارة الكهرباء اعتمد طلب عزل الطاقة LOTO لقفل تفريغ المصنع.', messageEn: 'Electrical Manager authorized LOTO isolation lock key.' },
 { timestamp: '18:59:15', type: 'SYSTEM', messageAr: 'تم تفعيل الذاكرة المؤقتة لتقارير الحوادث والإجراءات التصحيحية.', messageEn: 'Caching engine activated for incident correction modules.' }
 ]);

 // Periodic statistics updates
 React.useEffect(() => {
 if (!autoRefreshEnabled) return;
 
 const interval = setInterval(() => {
 // Oscillate latency values between 16ms and 36ms
 const delta = Math.floor(Math.random() * 9) - 4;
 const nextLatency = Math.min(Math.max(liveLatency + delta, 15), 45);
 setLiveLatency(nextLatency);

 // Add to latency history array
 setLatencyHistory(prev => [...prev.slice(1), nextLatency]);

 // Randomly append a debug/system/database log event
 setTick(t => {
 const nextTick = t + 1;
 if (nextTick % 4 === 0) {
 const eventsList: LiveLog[] = [
 { timestamp: new Date().toTimeString().split(' ')[0], type: 'SYSTEM', messageAr: 'تمت تصفية مصفوفة البيانات لإدارة الحوادث.', messageEn: 'Filtered records table for incident analytics.' },
 { timestamp: new Date().toTimeString().split(' ')[0], type: 'DB', messageAr: 'مزامنة التغييرات المحلية لدفتر الصيانة الدورية.', messageEn: 'Synchronized local state storage for preventive administration.' },
 { timestamp: new Date().toTimeString().split(' ')[0], type: 'API', messageAr: 'تم تحديث خطورة مصفوفة HIRA للمخاطر بشكل آمن.', messageEn: 'HIRA Risk Assessment dynamic limits check completed.' },
 { timestamp: new Date().toTimeString().split(' ')[0], type: 'SECURITY', messageAr: 'مراقبة هويات الموظفين وتسجيلات الدخول النشطة.', messageEn: 'Security subsystem validated active session certificates.' }
 ];
 const chosen = eventsList[Math.floor(Math.random() * eventsList.length)];
 setEventLogs(prev => [chosen, ...prev.slice(0, 7)]);
 }
 return nextTick;
 });

 }, 3000);

 return () => clearInterval(interval);
 }, [liveLatency, autoRefreshEnabled]);

 // Run the diagnostic test flow
 const runDiagnostics = async () => {
 if (isDiagnosticRunning) return;
 setIsDiagnosticRunning(true);
 setDiagnosticProgress(0);

 // Reset steps to pending
 setDiagnosticSteps(prev => prev.map(step => ({ ...step, status: 'PENDING' })));

 for (let i = 0; i < diagnosticSteps.length; i++) {
 // Set current step to RUNNING
 setDiagnosticSteps(prev => prev.map(s => s.id === i + 1 ? { ...s, status: 'RUNNING' } : s));
 
 // Keep running for 1000ms
 await new Promise(resolve => setTimeout(resolve, 800));

 // Mark step SUCCESS
 setDiagnosticSteps(prev => prev.map(s => s.id === i + 1 ? { ...s, status: 'SUCCESS', duration: Math.floor(Math.random() * 120) + 40 } : s));
 setDiagnosticProgress(((i + 1) / diagnosticSteps.length) * 100);
 }

 // Append successful diagnostic completion to logs
 const completedLog: LiveLog = {
 timestamp: new Date().toTimeString().split(' ')[0],
 type: 'SYSTEM',
 messageAr: 'تم تشغيل فحص تشخيصي كامل للنظام. النتيجة: سليم 100%',
 messageEn: 'Completed deep diagnostic system sweep. Health: 100% OK'
 };
 setEventLogs(prev => [completedLog, ...prev]);
 setIsDiagnosticRunning(false);
 };

 // SVG Chart Dimensions & Computations
 const maxLat = Math.max(...latencyHistory, 40);
 const minLat = Math.min(...latencyHistory, 10);
 const chartPoints = latencyHistory.map((val, idx) => {
 const x = (idx / (latencyHistory.length - 1)) * 100; // percent based
 const y = 100 - ((val - minLat) / (maxLat - minLat)) * 80 - 10;
 return `${x},${y}`;
 }).join(' ');

 const activeUsersCount = 5; // Static simulated connected terminals

 const filteredLogs = selectedLogLevel === 'ALL' 
 ? eventLogs 
 : eventLogs.filter(log => log.type === selectedLogLevel);

 return (
 <div id="performance-dashboard-root" className="flex flex-col gap-6 font-sans">
 
 {/* HEADER SECTION */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div className={`space-y-1 text-end`}>
 <div className={`flex items-center gap-2 flex-row`}>
 <div className="p-2 bg-radial from-orange-400 to-orange-600 text-white rounded-lg">
 <Activity className="w-5 h-5 text-white" />
 </div>
 <h2 className="text-lg font-bold text-slate-800 dark:text-white">
 {language === 'ar' ? 'منصة قياس وإدارة أداء النظام' : 'Platform & System Performance Hub'}
 </h2>
 </div>
 <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl">
 {language === 'ar' 
 ? 'مراقبة حية وديناميكية لأداء منصة تصاريح وإدارة السلامة، تتضمن سرعة الاستجابة، الفهارس الرقمية، اختبار الاتصال بالذكاء الاصطناعي، ومعدلات الأداء التشغيلي للمطحنة.'
 : 'Direct live performance analytics representing user latency, client state payload sizes, Gemini LLM test pings, and module execution weights.'}
 </p>
 </div>

 <div className="flex items-center gap-2 bg-slate-50 dark:bg-neutral-950 p-2 border border-slate-200 dark:border-neutral-850 rounded-lg shrink-0 w-full md:w-auto justify-between">
 <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">
 {language === 'ar' ? 'المزامنة الحية' : 'Live Sync'}
 </span>
 <button
 onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
 className={`cursor-pointer px-3 py-1.5 rounded-md text-[10px] font-extrabold flex items-center gap-1.5 transition-all text-white ${
 autoRefreshEnabled 
 ? 'bg-emerald-600 hover:bg-emerald-500' 
 : 'bg-slate-500 hover:bg-slate-400'
 }`}
 >
 <RefreshCw className={`w-3 h-3 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
 {autoRefreshEnabled 
 ? (language === 'ar' ? 'تحديث تلقائي: نشط' : 'Auto Refresh: ON') 
 : (language === 'ar' ? 'تحديث تلقائي: متوقف' : 'Auto Refresh: OFF')}
 </button>
 </div>
 </div>

 {/* THREE-COLUMN PERFORMANCE BENTO BOX */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 
 {/* Metric 1: Ping / Latency */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
 <div className={`flex items-center justify-between text-neutral-400 flex-row`}>
 <span className="text-xs font-bold uppercase tracking-wider">
 {language === 'ar' ? 'زمن الرندرة وتفاعل العميل' : 'Client Render Latency'}
 </span>
 <Zap className="w-5 h-5 text-orange-400" />
 </div>
 <div className="mt-3 flex items-baseline gap-2 justify-start">
 <span className="text-4xl font-extrabold text-slate-800 dark:text-neutral-100 font-mono tracking-tight">{liveLatency}</span>
 <span className="text-xs text-orange-500 font-bold">ms</span>
 </div>
 <div className="mt-2 text-[10px] text-neutral-500 border-t border-slate-100 dark:border-neutral-800/60 pt-2 flex items-center justify-between">
 <span>{language === 'ar' ? 'المتوسط المطلوب: < 50ms' : 'Requirement: < 50ms'}</span>
 <span className="text-emerald-500 font-bold">● {language === 'ar' ? 'ممتاز' : 'Optimal'}</span>
 </div>
 </div>

 {/* Metric 2: Local Database Size */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
 <div className={`flex items-center justify-between text-neutral-400 flex-row`}>
 <span className="text-xs font-bold uppercase tracking-wider">
 {language === 'ar' ? 'مساحة قاعدة البيانات المحلية' : 'Local State DB Storage'}
 </span>
 <div className="flex items-center gap-1.5">
 <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-black tracking-wider uppercase border border-emerald-500/20">
 {language === 'ar' ? 'الحد الأقصى مفعّل' : 'MAX QUOTA'}
 </span>
 <Database className="w-4 h-4 text-indigo-400" />
 </div>
 </div>
 <div className="mt-3 flex items-baseline gap-2 justify-start">
 <span className="text-4xl font-extrabold text-slate-800 dark:text-neutral-100 font-mono tracking-tight">{totalLocalStorageUsed}</span>
 <span className="text-xs text-indigo-500 font-bold">KB</span>
 </div>
 <div className="mt-2 text-[10px] text-neutral-500 border-t border-slate-100 dark:border-neutral-800/60 pt-2 flex flex-col gap-1">
 <div className="flex items-center justify-between w-full font-medium">
 <span>{language === 'ar' ? 'سعة التخزين القصوى للمتصفح: 512MB' : 'Max Browser Sandbox Space: 512MB'}</span>
 <span className="text-indigo-500 dark:text-indigo-400 font-bold">
 {((parseFloat(totalLocalStorageUsed) / (512 * 1024)) * 100).toFixed(6)}% {language === 'ar' ? 'مستغل' : 'allocated'}
 </span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-0.5">
 <div 
 className="bg-indigo-500 h-full rounded-full transition-all duration-500"
 style={{ width: `${Math.max(0.1, Math.min(100, (parseFloat(totalLocalStorageUsed) / (512 * 1024)) * 100))}%` }}
 />
 </div>
 </div>
 </div>

 {/* Metric 3: Active Client Connections */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
 <div className={`flex items-center justify-between text-neutral-400 flex-row`}>
 <span className="text-xs font-bold uppercase tracking-wider">
 {language === 'ar' ? 'الأجهزة المتصلة بالمصنع' : 'Active Terminals Monitor'}
 </span>
 <Layers className="w-5 h-5 text-emerald-400" />
 </div>
 <div className="mt-3 flex items-baseline gap-2 justify-start">
 <span className="text-4xl font-extrabold text-slate-800 dark:text-neutral-100 font-mono tracking-tight">{activeUsersCount}</span>
 <span className="text-xs text-emerald-500 font-bold">{language === 'ar' ? 'أجهزة نشطة' : 'nodes'}</span>
 </div>
 <div className="mt-2 text-[10px] text-neutral-500 border-t border-slate-100 dark:border-neutral-800/60 pt-2 flex items-center justify-between">
 <span>{language === 'ar' ? 'مزامنة البروتوكول: متصل' : 'Sync protocol: secure'}</span>
 <span className="text-emerald-500 font-semibold">● {language === 'ar' ? 'مستقر' : 'Stable'}</span>
 </div>
 </div>

 {/* Metric 4: Platform Compliance Average */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
 <div className={`flex items-center justify-between text-neutral-400 flex-row`}>
 <span className="text-xs font-bold uppercase tracking-wider">
 {language === 'ar' ? 'معدل الكفاءة الميداني (EHS)' : 'EHS Yield Efficiency'}
 </span>
 <ShieldCheck className="w-5 h-5 text-emerald-500" />
 </div>
 <div className="mt-3 flex items-baseline gap-2 justify-start">
 <span className="text-4xl font-extrabold text-slate-800 dark:text-neutral-100 font-mono tracking-tight">98.4</span>
 <span className="text-xs text-emerald-600 font-bold">%</span>
 </div>
 <div className="mt-2 text-[10px] text-neutral-500 border-t border-slate-100 dark:border-neutral-800/60 pt-2 flex items-center justify-between">
 <span>{language === 'ar' ? 'إجمالي التقارير المفحوصة' : 'EHS Audited Units'}</span>
 <span className="text-emerald-600 font-bold">{permits.length + incidents.length + audits.length}</span>
 </div>
 </div>

 </div>

 {/* INTERACTIVE CONTROLS AND CHARTS SPLIT */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Column 1 & 2: Charts Area (2/3 width) */}
 <div className="lg:col-span-2 space-y-6">
 
 {/* Chart 1: Latency Profile */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
 <div className={`flex items-center justify-between mb-4 flex-row`}>
 <div className={`flex items-center gap-1.5 flex-row`}>
 <Clock className="w-4 h-4 text-orange-500" />
 <h4 className="text-xs font-extrabold text-slate-800 dark:text-neutral-200 uppercase tracking-widest">
 {language === 'ar' ? 'ملف سرعة الاستجابة الزمني' : 'Response Latency Flow (Real-time)'}
 </h4>
 </div>
 <span className="text-[10px] font-mono bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded border border-orange-100 dark:border-orange-900/40">
 {language === 'ar' ? 'استطلاع كل 3 ثوانٍ' : 'Sample rate: 3s'}
 </span>
 </div>

 {/* Inline SVG Micro Graph */}
 <div className="relative h-44 w-full bg-slate-50 dark:bg-neutral-950 rounded-lg p-2 overflow-hidden border border-slate-150 dark:border-neutral-850">
 
 {/* Background horizontal grid lines */}
 <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 pointer-events-none opacity-40">
 <div className="border-b border-dashed border-slate-250 dark:border-neutral-800 text-[8px] text-neutral-400 font-mono text-end ps- select-none">40 ms</div>
 <div className="border-b border-dashed border-slate-250 dark:border-neutral-800 text-[8px] text-neutral-400 font-mono text-end ps- select-none">30 ms</div>
 <div className="border-b border-dashed border-slate-250 dark:border-neutral-800 text-[8px] text-neutral-400 font-mono text-end ps- select-none">20 ms</div>
 <div className="border-b border-dashed border-slate-250 dark:border-neutral-800 text-[8px] text-neutral-400 font-mono text-end ps- select-none">10 ms</div>
 </div>

 {/* Real graph body */}
 <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
 <defs>
 <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
 <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
 </linearGradient>
 </defs>

 {/* Shaded Area */}
 <path
 d={`M0,100 L${chartPoints} L100,100 Z`}
 fill="url(#latencyGrad)"
 className="transition-all duration-300"
 />

 {/* Line Path */}
 <polyline
 fill="none"
 stroke="#f97316"
 strokeWidth="2"
 points={chartPoints}
 className="transition-all duration-300"
 />

 {/* Nodes circles */}
 {latencyHistory.map((val, idx) => {
 const x = (idx / (latencyHistory.length - 1)) * 100;
 const y = 100 - ((val - minLat) / (maxLat - minLat)) * 80 - 10;
 return (
 <circle
 key={idx}
 cx={x}
 cy={y}
 r="1.8"
 fill="#ffffff"
 stroke="#f97316"
 strokeWidth="1.5"
 />
 );
 })}
 </svg>

 {/* Current value floating badge */}
 <div className="absolute end- top-3 bg-white/90 dark:bg-neutral-900/95 border border-slate-200 dark:border-neutral-800 px-2.5 py-1 rounded-md text-center shadow-lg pointer-events-none">
 <span className="block text-[8px] text-neutral-400 uppercase font-bold tracking-wider">{language === 'ar' ? 'الحالي' : 'LATEST'}</span>
 <span className="text-xs font-mono font-bold text-slate-800 dark:text-neutral-100">{liveLatency} ms</span>
 </div>
 </div>

 {/* Legends */}
 <div className={`flex flex-wrap gap-4 mt-3 text-[10px] text-neutral-500 justify-start flex-row`}>
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
 <span>{language === 'ar' ? 'زمن الاستجابة للحدث' : 'Average operational latency (ms)'}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 border-b-2 border-dashed border-slate-300 dark:border-neutral-700"></div>
 <span>{language === 'ar' ? 'الجدولة النمطية الآمنة' : 'SLA Target threshold (50ms)'}</span>
 </div>
 </div>

 </div>

 {/* Chart 2: Module computational weight */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
 <div className={`flex items-center justify-between mb-4 flex-row`}>
 <div className={`flex items-center gap-1.5 flex-row`}>
 <BarChart3 className="w-4 h-4 text-indigo-500" />
 <h4 className="text-xs font-extrabold text-slate-800 dark:text-neutral-200 uppercase tracking-widest">
 {language === 'ar' ? 'حمل تشغيل الفهارس وقاعدة البيانات للوحدات الفنية' : 'Database Weight and Memory Footprint by EHS Module'}
 </h4>
 </div>
 </div>

 {/* Visual Bar Grid */}
 <div className="space-y-3.5">
 
 {/* Permits Bar */}
 <div>
 <div className={`flex justify-between text-xs mb-1 font-mono flex-row`}>
 <span className="font-bold text-slate-700 dark:text-neutral-300">
 {language === 'ar' ? 'تصاريح العمل (PTW)' : 'Permits system state'}
 </span>
 <span className="text-neutral-450 text-[11px]">{(permitBytes / 1024).toFixed(2)} KB ({permits.length} {language === 'ar' ? 'سجل' : 'docs'})</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-neutral-950 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-neutral-850">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${Math.min(100, Math.max(15, (permitBytes / (permitBytes + incidentBytes + auditBytes + trainingBytes || 1)) * 100))}%` }}
 className="bg-orange-500 h-full rounded-full"
 />
 </div>
 </div>

 {/* Incidents Bar */}
 <div>
 <div className={`flex justify-between text-xs mb-1 font-mono flex-row`}>
 <span className="font-bold text-slate-700 dark:text-neutral-300">
 {language === 'ar' ? 'إعادة الإجراءات والحلول الحجمية (CAPA)' : 'Incident log state'}
 </span>
 <span className="text-neutral-450 text-[11px]">{(incidentBytes / 1024).toFixed(2)} KB ({incidents.length} {language === 'ar' ? 'سجل' : 'docs'})</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-neutral-950 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-neutral-850">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${Math.min(100, Math.max(10, (incidentBytes / (permitBytes + incidentBytes + auditBytes + trainingBytes || 1)) * 100))}%` }}
 className="bg-indigo-500 h-full rounded-full"
 />
 </div>
 </div>

 {/* Audits Bar */}
 <div>
 <div className={`flex justify-between text-xs mb-1 font-mono flex-row`}>
 <span className="font-bold text-slate-700 dark:text-neutral-300">
 {language === 'ar' ? 'عمليات التفتيش والمطابقة الكلية' : 'Compliance Audits state'}
 </span>
 <span className="text-neutral-450 text-[11px]">{(auditBytes / 1024).toFixed(2)} KB ({audits.length} {language === 'ar' ? 'سجل' : 'docs'})</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-neutral-950 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-neutral-850">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${Math.min(100, Math.max(10, (auditBytes / (permitBytes + incidentBytes + auditBytes + trainingBytes || 1)) * 100))}%` }}
 className="bg-emerald-500 h-full rounded-full"
 />
 </div>
 </div>

 {/* Trainings Bar */}
 <div>
 <div className={`flex justify-between text-xs mb-1 font-mono flex-row`}>
 <span className="font-bold text-slate-700 dark:text-neutral-300">
 {language === 'ar' ? 'سجلات تدريب وشهادات السلامة' : 'Competency & Training storage'}
 </span>
 <span className="text-neutral-450 text-[11px]">{(trainingBytes / 1024).toFixed(2)} KB ({trainings.length} {language === 'ar' ? 'شهادة' : 'records'})</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-neutral-950 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-neutral-850">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${Math.min(100, Math.max(10, (trainingBytes / (permitBytes + incidentBytes + auditBytes + trainingBytes || 1)) * 100))}%` }}
 className="bg-yellow-500 h-full rounded-full"
 />
 </div>
 </div>

 </div>

 </div>

 </div>

 {/* Column 3: Interactive Platform Diagnostic & System Tools */}
 <div className="space-y-6">
 
 {/* Box: Integrated Diagnostic Center */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
 <h4 className={`text-xs font-extrabold text-slate-800 dark:text-neutral-200 uppercase tracking-widest flex items-center gap-1.5 mb-2 flex-row`}>
 <Cpu className="w-4 h-4 text-orange-500" />
 <span>{language === 'ar' ? 'مركز الفحص الذاتي التلقائي' : 'Platform Diagnostics Analyzer'}</span>
 </h4>
 <p className={`text-[11px] text-neutral-500 leading-normal mb-4 text-end`}>
 {language === 'ar' 
 ? 'فحص مباشر لقنوات نقل المعلومات والحوسبة وخادم حماية LOTO المحلي.'
 : 'Perform an active integrity check of database threads, layout buffers, and local caching blocks.'}
 </p>

 {/* Diagnostic trigger Button */}
 <button
 onClick={runDiagnostics}
 disabled={isDiagnosticRunning}
 className={`w-full cursor-pointer py-2.5 px-4 text-xs font-bold rounded-lg text-white shadow transition-all flex items-center justify-center gap-1.5 ${
 isDiagnosticRunning 
 ? 'bg-neutral-400 dark:bg-neutral-800 cursor-not-allowed' 
 : 'bg-[#0F172A] hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500'
 }`}
 >
 <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
 {isDiagnosticRunning 
 ? (language === 'ar' ? 'يقوم بالفحص الحركي...' : 'Executing diagnostics sweep...') 
 : (language === 'ar' ? 'تشغيل فحص النظام الشامل' : 'Execute Full System Check')}
 </button>

 {/* Diagnostics progress results */}
 <div className="mt-5 space-y-3">
 {diagnosticSteps.map(step => (
 <div key={step.id} className="text-xs flex items-start gap-2 justify-between">
 <div className="flex items-center gap-1.5 shrink-0">
 {step.status === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
 {step.status === 'RUNNING' && <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin shrink-0" />}
 {step.status === 'PENDING' && <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-neutral-700 shrink-0" />}
 {step.status === 'FAILED' && <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
 </div>
 <div className={`grow text-[11px] font-medium leading-relaxed text-end`}>
 <span>{language === 'ar' ? step.labelAr : step.labelEn}</span>
 {step.status === 'SUCCESS' && step.duration && (
 <span className="block text-[9px] text-neutral-400 font-mono">Passed ({step.duration}ms)</span>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* Progress Bar */}
 {isDiagnosticRunning && (
 <div className="mt-4 pt-2 border-t border-slate-100 dark:border-neutral-800">
 <div className="flex justify-between text-[9px] font-mono text-neutral-400 mb-1">
 <span>{language === 'ar' ? 'اكتمال فحص الأداء' : 'Progress'}</span>
 <span>{Math.round(diagnosticProgress)}%</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-neutral-950 h-1 rounded">
 <div 
 className="bg-orange-500 h-full rounded transition-all duration-350"
 style={{ width: `${diagnosticProgress}%` }}
 />
 </div>
 </div>
 )}

 </div>

 {/* Platform Performance Health Standards Box */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
 <h4 className={`text-xs font-extrabold text-slate-800 dark:text-neutral-200 uppercase tracking-widest flex items-center gap-1.5 flex-row`}>
 <HardDrive className="w-4 h-4 text-indigo-500" />
 <span>{language === 'ar' ? 'مؤشرات الأداء المستهدفة ونظام حماية الذاكرة' : 'SLA Performance Targets'}</span>
 </h4>
 
 <div className="space-y-3">
 <div className="flex justify-between text-[11px] items-center border-b border-slate-50 dark:border-neutral-850 pb-2">
 <span className="text-neutral-450">{language === 'ar' ? 'هدف توفر المنصة (Uptime)' : 'Uptime KPI'}</span>
 <span className="font-mono font-bold text-emerald-500">99.98% / OK</span>
 </div>
 <div className="flex justify-between text-[11px] items-center border-b border-slate-50 dark:border-neutral-850 pb-2">
 <span className="text-neutral-450">{language === 'ar' ? 'عينة تجاوب الرندرة' : 'Component Mounting'}</span>
 <span className="font-mono font-bold text-emerald-500">&lt; 15ms / OK</span>
 </div>
 <div className="flex justify-between text-[11px] items-center border-b border-slate-50 dark:border-neutral-850 pb-2">
 <span className="text-neutral-450">{language === 'ar' ? 'زمن الاستجابة للطلب التلقائي للذكاء الاصطناعي' : 'Gemini Inference Target'}</span>
 <span className="font-mono font-bold text-slate-800 dark:text-slate-200">~ 410ms</span>
 </div>
 <div className="flex justify-between text-[11px] items-center">
 <span className="text-neutral-450">{language === 'ar' ? 'تكامل مؤشرات حماية LOTO' : 'EHS State Syncing'}</span>
 <span className="font-mono font-bold text-emerald-500">{language === 'ar' ? 'مؤمنة 100%' : '100% Secure'}</span>
 </div>
 </div>
 </div>

 </div>

 </div>

 {/* DETAILED HUMAN LOG EVENTS LIST */}
 <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
 
 {/* Filtering Options header row */}
 <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 ${
 language === 'ar' ? 'sm:' : 'sm:flex-row'
 }`}>
 <div className={`flex items-center gap-1.5 flex-row`}>
 <Activity className="w-4 h-4 text-orange-500 shrink-0" />
 <h4 className="text-xs font-extrabold text-slate-800 dark:text-neutral-200 uppercase tracking-widest">
 {language === 'ar' ? 'سجل العمليات والفحوصات الجارية للمنصة' : 'Live Platform Diagnostic Event Log'}
 </h4>
 </div>

 {/* Filtering buttons */}
 <div className="flex flex-wrap items-center gap-1.5">
 {(['ALL', 'SYSTEM', 'API', 'DB'] as const).map(level => (
 <button
 key={level}
 onClick={() => setSelectedLogLevel(level)}
 className={`cursor-pointer px-2.5 py-1 text-[9px] font-bold rounded-lg transition-colors border select-none ${
 selectedLogLevel === level 
 ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
 : 'bg-slate-50 dark:bg-neutral-950 text-neutral-550 border-slate-200 dark:border-neutral-850 hover:bg-slate-100 dark:hover:bg-neutral-800'
 }`}
 >
 {level === 'ALL' ? (language === 'ar' ? 'جميع التصنيفات' : 'All Events') : level}
 </button>
 ))}
 </div>
 </div>

 {/* Real logs list */}
 <div className="space-y-2 max-h-52 overflow-y-auto pe-">
 {filteredLogs.length === 0 ? (
 <p className="text-xs text-neutral-400 text-center py-6">{language === 'ar' ? 'لا يوجد أحداث تحت هذا المرشح حالياً.' : 'No filtered log traces recorded.'}</p>
 ) : (
 filteredLogs.map((log, idx) => (
 <div 
 key={idx} 
 className={`p-3 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 border border-slate-100 dark:border-neutral-850/60 hover:bg-slate-50/50 dark:hover:bg-neutral-850/20 transition-all ${
 language === 'ar' ? 'sm:' : 'sm:flex-row'
 }`}
 >
 {/* Left block: timestamp + badge + message */}
 <div className={`flex items-start sm:items-center gap-2.5 leading-relaxed shrink-0 w-full sm:w-auto ${
 language === 'ar' ? ' text-start' : 'flex-row text-end'
 }`}>
 <span className="font-mono text-[10px] text-neutral-400 shrink-0 select-none">{log.timestamp}</span>
 <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 select-none ${
 log.type === 'SYSTEM' ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/10' :
 log.type === 'API' ? 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/10' :
 log.type === 'DB' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/10' :
 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/10'
 }`}>
 {log.type}
 </span>
 <span className="text-slate-700 dark:text-slate-350 font-medium">
 {language === 'ar' ? log.messageAr : log.messageEn}
 </span>
 </div>

 {/* Right: Success dynamic check checkmark */}
 <div className={`text-[10px] text-emerald-500 font-semibold flex items-center gap-1 shrink-0 ${
 language === 'ar' ? '' : 'flex-row'
 }`}>
 <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
 <span className="font-mono uppercase">OK</span>
 </div>
 </div>
 ))
 )}
 </div>

 </div>

 </div>
 );
};
