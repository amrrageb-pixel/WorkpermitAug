import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, FileStack, CheckCircle, Smartphone, Sparkles, ChevronRight } from 'lucide-react';
import { Permit, SandboxRole, UserProfile, Language } from '../types';
import { PushNotificationService, PushNotificationPayload } from '../utils/pushNotificationService';

interface NotificationsPanelProps {
 permits: Permit[];
 currentUser?: UserProfile;
 currentRole: SandboxRole;
 language: Language;
 onSelectPermit: (id: string) => void;
}

type NotificationViewMode = 'ACTIVITY' | 'PUSH_LOGS';

export function NotificationsPanel({ 
 permits, 
 currentUser, 
 currentRole, 
 language, 
 onSelectPermit 
}: NotificationsPanelProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [viewMode, setViewMode] = useState<NotificationViewMode>('ACTIVITY');
 const [pushLogs, setPushLogs] = useState<PushNotificationPayload[]>([]);
 const panelRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleClick = (e: MouseEvent) => {
 if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
 setIsOpen(false);
 }
 };
 if (isOpen) {
 document.addEventListener('mousedown', handleClick);
 }
 return () => document.removeEventListener('mousedown', handleClick);
 }, [isOpen]);

 // Load and subscribe to real-time push logs
 useEffect(() => {
 setPushLogs(PushNotificationService.getLogs());

 const unsubscribe = PushNotificationService.onNotificationReceived(() => {
 setPushLogs(PushNotificationService.getLogs());
 });

 return () => {
 unsubscribe();
 };
 }, []);

 const pendingActions = permits.filter(p => {
 const canCreate = !!currentUser?.canCreatePermit;
 const canElectrical = !!currentUser?.canApproveElectrical;
 const canProduction = !!currentUser?.canApproveProduction;
 const canSafety = !!currentUser?.canApproveSafety;

 let match = false;
 if (canCreate && (p.status === 'DRAFT' || p.status === 'ACTIVE')) {
 match = true;
 }
 if (canProduction && (p.status === 'PENDING_DEPT' && p.productionRequired && !p.productionApproval)) {
 match = true;
 }
 if (canElectrical && (p.status === 'PENDING_DEPT' && p.electricalRequired && !p.electricalApproval)) {
 match = true;
 }
 if (canSafety && (p.status === 'HSE_REVIEW' || p.status === 'PENDING_CLOSE')) {
 match = true;
 }
 return match;
 });

 const recentAudits = permits
 .flatMap(p => p.auditTrail.map(a => ({ permit: p, audit: a })))
 .filter(({ permit, audit }) => {
 const canCreate = !!currentUser?.canCreatePermit;
 const canElectrical = !!currentUser?.canApproveElectrical;
 const canProduction = !!currentUser?.canApproveProduction;
 const canSafety = !!currentUser?.canApproveSafety;

 if (canCreate) return true;
 if (canProduction && permit.productionRequired) return true;
 if (canElectrical && permit.electricalRequired) return true;
 if (canSafety) return true;
 return false;
 })
 .sort((a, b) => new Date(b.audit.timestamp).getTime() - new Date(a.audit.timestamp).getTime())
 .slice(0, 8);

 const pendingCount = pendingActions.length;

 return (
 <div className="relative" ref={panelRef}>
 <button
 id="bell-notification-btn"
 onClick={() => setIsOpen(!isOpen)}
 className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 relative text-orange-400"
 title={language === 'ar' ? 'مركز الإشعارات التفاعلي' : 'Interactive Notifications Hub'}
 >
 <Bell className="w-5 h-5" />
 {pendingCount > 0 && (
 <span className="absolute -top-1 -end- w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 text-[9px] font-bold text-white flex items-center justify-center">
 {pendingCount}
 </span>
 )}
 </button>

 {isOpen && (
 <div 
 className={`absolute top-full mt-2 w-80 max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xl z-50 flex flex-col end- origin-top-right`}
 dir={language === 'ar' ? 'rtl' : 'ltr'}
 >
 {/* Header */}
 <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur z-10">
 <h3 className="font-bold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
 <Bell className="w-4 h-4 text-orange-500" />
 {language === 'ar' ? 'مركز الإشعارات التفاعلي' : 'Notifications Hub'}
 </h3>
 {pendingCount > 0 && (
 <span className="text-[10px] bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0">
 {pendingCount} {language === 'ar' ? 'مطلوب' : 'Actionable'}
 </span>
 )}
 </div>

 {/* Tab Selector */}
 <div className="grid grid-cols-2 border-b border-slate-100 dark:border-neutral-850 text-xs text-center shrink-0">
 <button
 onClick={() => setViewMode('ACTIVITY')}
 className={`py-2.5 font-bold border-b-2 transition-colors cursor-pointer ${
 viewMode === 'ACTIVITY' 
 ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-slate-50/50 dark:bg-neutral-850/50' 
 : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
 }`}
 >
 📋 {language === 'ar' ? 'النشاط والإجراءات' : 'Activity & Actions'}
 </button>
 <button
 onClick={() => setViewMode('PUSH_LOGS')}
 className={`py-2.5 font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 ${
 viewMode === 'PUSH_LOGS' 
 ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-slate-50/50 dark:bg-neutral-850/50' 
 : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
 }`}
 >
 <Smartphone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
 <span>{language === 'ar' ? 'سجل الهاتف الفوري' : 'Phone Push Logs'}</span>
 {pushLogs.length > 0 && (
 <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
 )}
 </button>
 </div>

 <div className="flex-1 overflow-y-auto">
 {viewMode === 'ACTIVITY' ? (
 <>
 {/* Pending Actions Section */}
 {pendingActions.length > 0 && (
 <div className="px-3 py-2 bg-orange-50/70 dark:bg-orange-500/5">
 <h4 className="text-[10px] font-black text-orange-800 dark:text-orange-400 uppercase tracking-widest mb-2 px-1">
 {language === 'ar' ? '⚠️ تصاريح معلقة بانتظار إجراء دورك:' : '⚠️ ACTIONS PENDING YOUR ROLE:'}
 </h4>
 <div className="space-y-1.5">
 {pendingActions.map(p => (
 <button
 key={`action-${p.id}`}
 onClick={() => {
 onSelectPermit(p.id);
 setIsOpen(false);
 }}
 className="w-full text-start bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-orange-200 dark:border-orange-500/20 shadow-sm hover:border-orange-400 dark:hover:border-orange-500/50 transition-colors flex flex-col gap-1 cursor-pointer"
 >
 <div className="flex items-center justify-between gap-2">
 <span className="font-mono text-[10px] font-bold text-orange-600 dark:text-orange-400">{p.id}</span>
 <div className="flex items-center gap-1 text-orange-500">
 <AlertTriangle className="w-3.5 h-3.5" />
 </div>
 </div>
 <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 line-clamp-1">
 {p.title}
 </span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Recent Audits Section */}
 <div className="p-3">
 <h4 className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-1">
 {language === 'ar' ? 'سجل النشاطات والموافقات:' : 'PERMIT SYSTEM ACTIVITY LOG:'}
 </h4>
 <div className="space-y-2">
 {recentAudits.length > 0 ? (
 recentAudits.map(({ permit, audit }, idx) => (
 <button
 key={`audit-${audit.id}-${idx}`}
 onClick={() => {
 onSelectPermit(permit.id);
 setIsOpen(false);
 }}
 className="w-full text-start bg-slate-50 dark:bg-neutral-800/30 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-neutral-700 flex flex-col gap-1.5 cursor-pointer"
 >
 <div className="flex items-center justify-between gap-2">
 <span className="font-mono text-[10px] font-bold text-slate-500">{permit.id}</span>
 <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
 <Clock className="w-2.5 h-2.5" />
 {new Date(audit.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
 </div>
 </div>
 <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium">
 {language === 'ar' ? audit.actionAr : audit.actionEn}
 </p>
 <span className="text-[9px] text-slate-500 flex items-center gap-1">
 <FileStack className="w-3 h-3 text-orange-500" />
 {language === 'ar' ? audit.actorRoleAr : audit.actorRoleEn}
 </span>
 </button>
 ))
 ) : (
 <div className="text-center py-6 text-slate-400 dark:text-neutral-500">
 <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-300" />
 <p className="text-xs">{language === 'ar' ? 'لا يوجد نشاطات مسجلة بعد' : 'No recent activities recorded'}</p>
 </div>
 )}
 </div>
 </div>
 </>
 ) : (
 /* Phone Push logs view */
 <div className="p-3">
 <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 px-1">
 {language === 'ar' ? 'تاريخ إشعارات الأجهزة الفورية:' : 'DEVICE PUSH HISTORICAL ALERTS:'}
 </h4>
 <div className="space-y-2 max-h-[350px] overflow-y-auto pe-">
 {pushLogs.length > 0 ? (
 pushLogs.map((log) => {
 const isSelfRole = log.targetRole === currentRole;

 return (
 <div
 key={`push-log-${log.id}`}
 className={`p-2.5 rounded-lg border text-start text-xs transition-all relative ${
 isSelfRole 
 ? 'bg-orange-500/5 border-orange-500/30' 
 : 'bg-slate-50 dark:bg-neutral-800/20 border-slate-100 dark:border-neutral-850'
 }`}
 >
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-[9px] font-black uppercase text-orange-400 font-mono tracking-widest">
 {log.targetRole}
 </span>
 <span className="text-[9px] text-slate-400 font-mono">
 {new Date(log.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
 </span>
 </div>
 <h5 className="font-bold text-slate-800 dark:text-neutral-200">
 {log.title}
 </h5>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
 {log.body}
 </p>
 {log.permitId && (
 <div className="mt-1.5 flex justify-end">
 <span className="text-[9px] bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
 {log.permitId}
 </span>
 </div>
 )}
 </div>
 );
 })
 ) : (
 <div className="text-center py-8 text-slate-400 dark:text-neutral-500">
 <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
 <p className="text-xs">
 {language === 'ar' ? 'لم يتم دفع أي إشعار فوري بعد' : 'No push notifications received yet'}
 </p>
 <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] mx-auto">
 {language === 'ar' 
 ? 'قم بتقديم أو اعتماد تصاريح لتشغيل تنبيهات الهواتف الفورية.' 
 : 'Submit or clearance a permit to see immediate alerts trigger.'}
 </p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
