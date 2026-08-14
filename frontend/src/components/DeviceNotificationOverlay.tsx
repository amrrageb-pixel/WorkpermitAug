import React, { useEffect, useState } from 'react';
import { PushNotificationPayload, PushNotificationService } from '../utils/pushNotificationService';
import { SandboxRole, UserProfile, Language } from '../types';
import { Bell, ShieldAlert, Sparkles, X, ChevronRight, CornerDownLeft, Laptop, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeviceNotificationOverlayProps {
 users: UserProfile[];
 currentUser: UserProfile;
 language: Language;
 onAutoSwitchUser: (user: UserProfile, permitId: string) => void;
}

export function DeviceNotificationOverlay({ 
 users, 
 currentUser, 
 language, 
 onAutoSwitchUser 
}: DeviceNotificationOverlayProps) {
 const [activeNotifications, setActiveNotifications] = useState<PushNotificationPayload[]>([]);

 // Sound/Chime playback is triggered via service natively when a notification is dispatched

 useEffect(() => {
 // Listen to real-time notification events
 const unsubscribe = PushNotificationService.onNotificationReceived((payload) => {
 // Add the new notification to the screen alerts
 setActiveNotifications(prev => [payload, ...prev]);

 // Auto-dismiss after 8 seconds
 setTimeout(() => {
 setActiveNotifications(prev => prev.filter(n => n.id !== payload.id));
 }, 8000);
 });

 return () => {
 unsubscribe();
 };
 }, []);

 const handleDismiss = (id: string) => {
 setActiveNotifications(prev => prev.filter(n => n.id !== id));
 };

 const handleAction = (notification: PushNotificationPayload) => {
 if (!notification.permitId || !notification.targetRole) return;

 // Find a demo user matching the target role
 let targetUser = users.find(u => u.sandboxRole === notification.targetRole);
 
 // For HSE department, if admin or samer is better suited, prioritize
 if (notification.targetRole === 'HSE') {
 targetUser = users.find(u => u.username === 'asaad_hse') || users.find(u => u.username === 'admin');
 }

 if (targetUser) {
 onAutoSwitchUser(targetUser, notification.permitId);
 // Dismiss the notification banner
 handleDismiss(notification.id);
 }
 };

 return (
 <div className="fixed top-4 end- z-[9999] pointer-events-none flex flex-col gap-3 w-full max-w-sm px-4">
 <AnimatePresence>
 {activeNotifications.map((notification) => {
 // Identify recipient role description
 let recipientTextAr = 'جميع مسؤولي النظام';
 let recipientTextEn = 'All Safety Personnel';
 
 if (notification.targetRole === 'REQUESTER') {
 recipientTextAr = 'الفريق المنفذ (م. أحمد)';
 recipientTextEn = 'Executing Crew (Eng. Ahmed)';
 } else if (notification.targetRole === 'PRODUCTION') {
 recipientTextAr = 'مدير إدارة الإنتاج (م. تركي)';
 recipientTextEn = 'Production Manager (Eng. Turki)';
 } else if (notification.targetRole === 'ELECTRICAL') {
 recipientTextAr = 'رئيس إدارة الكهرباء (م. علي)';
 recipientTextEn = 'Electrical LOTO Manager (Eng. Ali)';
 } else if (notification.targetRole === 'HSE') {
 recipientTextAr = 'إدارة السلامة والصحة المهنية (HSE)';
 recipientTextEn = 'Safety & Occupational Health (HSE)';
 }

 const isActionable = notification.permitId && notification.targetRole;
 const isTargetedForSelf = notification.targetRole === currentUser.sandboxRole;

 return (
 <motion.div
 key={notification.id}
 initial={{ opacity: 0, y: -50, scale: 0.9 }}
 animate={{ 
 opacity: 1, 
 y: 0, 
 scale: 1,
 transition: { type: 'spring', stiffness: 300, damping: 20 }
 }}
 exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
 className="pointer-events-auto bg-slate-900/95 dark:bg-neutral-950/95 backdrop-blur-md border border-orange-500/40 text-white p-4 rounded-xl shadow-2xl flex flex-col gap-2.5 overflow-hidden ring-4 ring-orange-500/10"
 style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
 >
 {/* Dynamic Glow Line */}
 <div className="absolute top-0 start- end- h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

 {/* Notification Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 animate-pulse">
 <Smartphone className="w-4 h-4" />
 </div>
 <div>
 <span className="text-[9px] font-black tracking-widest text-orange-400 uppercase">
 {language === 'ar' ? 'إشعار فوري جديد دُفع للهاتف' : 'IMMEDIATE DEVICE PUSH ALERT'}
 </span>
 <p className="text-[10px] text-slate-400 font-medium leading-none">
 {language === 'ar' ? 'نظام تصاريح العمل الرقمي' : 'Master PTW Hub'}
 </p>
 </div>
 </div>
 
 <button
 onClick={() => handleDismiss(notification.id)}
 className="w-5 h-5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Notification Target Role Alert */}
 <div className="bg-slate-800/60 dark:bg-neutral-900/60 border border-slate-700 rounded-lg p-1.5 flex items-center justify-between text-[11px]">
 <div className="flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping shrink-0" />
 <span className="font-semibold text-slate-300">
 {language === 'ar' ? `المستلم المستهدف:` : `Target Recipient:`}
 </span>
 <span className="font-bold text-amber-300">
 {language === 'ar' ? recipientTextAr : recipientTextEn}
 </span>
 </div>
 {isTargetedForSelf && (
 <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
 {language === 'ar' ? 'دورك الحالي' : 'YOUR ROLE'}
 </span>
 )}
 </div>

 {/* Message Content */}
 <div className="text-start">
 <h4 className={`text-xs font-black text-white text-end`}>
 {notification.title}
 </h4>
 <p className={`text-xs text-slate-300 font-sans mt-1 leading-relaxed text-end`}>
 {notification.body}
 </p>
 </div>

 {/* Action and Dismiss Bar */}
 {isActionable && (
 <div className="flex gap-2 justify-end pt-1 border-t border-slate-800">
 <button
 onClick={() => handleDismiss(notification.id)}
 className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
 >
 {language === 'ar' ? 'تجاهل' : 'Dismiss'}
 </button>
 <button
 onClick={() => handleAction(notification)}
 className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[10px] font-black rounded-lg shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
 >
 <Sparkles className="w-3 h-3 shrink-0" />
 <span>
 {language === 'ar' 
 ? `⚡ تسجيل دخول كـ ${notification.targetRole} وتعديل التصريح` 
 : `⚡ Login as ${notification.targetRole} & Action`}
 </span>
 <ChevronRight className="w-3.5 h-3.5 shrink-0" />
 </button>
 </div>
 )}
 </motion.div>
 );
 })}
 </AnimatePresence>
 </div>
 );
}
