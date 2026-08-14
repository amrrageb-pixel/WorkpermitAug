/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Permit, SandboxRole, PermitStatus, AuditLogEntry, UserProfile, Language } from '../types';
import { PERMIT_TYPES_INFO, STATUS_INFO, STANDARD_HAZARDS, STANDARD_PPES, NEBOSH_CONTROL_MEASURES, HANDBACK_CHECKLIST, PDF_CHECKLISTS, OSHA_CHECKLISTS } from '../utils/initialData';
import { PushNotificationService } from '../utils/pushNotificationService';
import { isPermitExpired } from '../utils/saas';
import {
 CheckCircle, XCircle, Lock, Gauge, FileText,
 User, Clock, AlertTriangle, ShieldCheck, HelpCircle,
 Construction, Trash2, Calendar, MapPin, Users, HeartHandshake,
 Award, ShieldAlert, Sparkles, UserCheck, Siren, Flame
} from 'lucide-react';

interface PermitDetailProps {
 permit: Permit;
 currentRole: SandboxRole;
 currentUser?: UserProfile;
 language: Language;
 onUpdatePermit: (updated: Permit) => void;
 onDeletePermit?: (id: string) => void;
 onBackToDashboard: () => void;
 /** All permits in scope, used for SIMOPS (simultaneous-operations) spatial conflict checks. */
 allPermits?: Permit[];
}

export const PermitDetail: React.FC<PermitDetailProps> = React.memo(({
 permit,
 currentRole,
 currentUser,
 language,
 onUpdatePermit,
 onDeletePermit,
 onBackToDashboard,
 allPermits = []
}) => {
 const canActAsProduction = !!currentUser?.canApproveProduction;
 const canActAsElectrical = !!currentUser?.canApproveElectrical;
 const canActAsSafety = !!currentUser?.canApproveSafety;
 const canActAsRequester = !!currentUser?.canCreatePermit;
 const isCompanyAdmin = currentUser?.customRole === 'SUPER_ADMIN' || currentUser?.customRole === 'SAFETY_MANAGER' || currentUser?.customRole === 'SAFETY_SUPERVISOR' || currentUser?.username?.includes('admin') || currentUser?.username === 'admin' || currentRole === 'HSE';

 // Local state for actions
 const [commentText, setCommentText] = React.useState('');
 const [lotoDetails, setLotoDetails] = React.useState<LotoDetail[]>(permit.lotoDetails || []);
  
 // LOTO row-builder inputs
 const [lotoPt, setLotoPt] = React.useState('');
 const [lotoEnergy, setLotoEnergy] = React.useState<'ELECTRICAL' | 'MECHANICAL' | 'HYDRAULIC' | 'PNEUMATIC' | 'OTHER'>('ELECTRICAL');
 const [lotoTag, setLotoTag] = React.useState('');
 const [lotoIsolator, setLotoIsolator] = React.useState('');
 const [lotoDbb, setLotoDbb] = React.useState(false);
 // Stored-energy isolations (trapped hydraulic/pneumatic pressure, or breaking a process
 // line) require Double Block & Bleed, not just "the valve is closed" — OSHA 1910.147.
 const lotoRequiresDbb = lotoEnergy === 'HYDRAULIC' || lotoEnergy === 'PNEUMATIC' || permit.type === 'LINE_BREAKING';

 const addLoto = () => {
   if (!lotoPt || !lotoTag) return;
   if (lotoRequiresDbb && !lotoDbb) {
     alert(language === 'ar'
       ? 'هذا العزل يتطلب تأكيد "الحجب المزدوج والتنفيس" (Double Block and Bleed) قبل إضافته.'
       : 'This isolation requires confirming Double Block and Bleed before it can be added.');
     return;
   }
   setLotoDetails(prev => [...prev, {
     id: `loto-${Date.now()}`,
     isolationPoint: lotoPt,
     energyType: lotoEnergy,
     lockTagNumber: lotoTag,
     isolatorName: lotoIsolator,
     doubleBlockAndBleedVerified: lotoRequiresDbb ? lotoDbb : undefined
   }]);
   setLotoPt(''); setLotoTag(''); setLotoIsolator(''); setLotoDbb(false);
 };
 
 // NFPA 51B / OSHA 1910.252: a fire watch must remain at a hot-work location for a period
 // after work stops, to catch smoldering ignition before it becomes a fire.
 const [fireWatchMinutes, setFireWatchMinutes] = React.useState(30);
 const [fireWatchConfirmed, setFireWatchConfirmed] = React.useState(false);

 // New local states for NEBOSH features
 const [extensionHours, setExtensionHours] = React.useState(2);
 const [handoverNotes, setHandoverNotes] = React.useState('');
 const [handoverSignoff, setHandoverSignoff] = React.useState(false);
 const [handbackChecks, setHandbackChecks] = React.useState<{[key: string]: boolean}>({});
 
 // Gas test state
 const [o2, setO2] = React.useState(20.9);
 const [lel, setLel] = React.useState(0);
 const [co, setCo] = React.useState(0);
 const [h2s, setH2s] = React.useState(0);
 const [gasSubmitted, setGasSubmitted] = React.useState(false);

 // Precautions check confirmation
 const [checkedPrecautions, setCheckedPrecautions] = React.useState<{[key: string]: boolean}>(
 permit.safetyPrecautionConfirmations || {}
 );

 // SIMOPS: other live permits sharing this permit's location
 const [conflictAcknowledged, setConflictAcknowledged] = React.useState(!!permit.conflictAcknowledged);
 const simopsConflicts = React.useMemo(() => {
   const loc = permit.location?.trim().toLowerCase();
   if (!loc) return [];
   return allPermits.filter(p =>
     p.id !== permit.id &&
     p.location?.trim().toLowerCase() === loc &&
     (p.status === 'ACTIVE' || p.status === 'HSE_REVIEW')
   );
 }, [allPermits, permit.id, permit.location]);
 const hasUnresolvedSimopsConflict = simopsConflicts.length > 0 && !conflictAcknowledged;

 // NEBOSH/OSHA: a worker with an expired (or missing) required certification for this
 // permit type may not be authorized to work under it — computed at add-time in the permit
 // form against real TrainingRecord data (see utils/competency.ts) and enforced again here.
 const expiredCompetencyWorkers = (permit.competencyWorkers || []).filter(w => w.competencyStatus === 'EXPIRED');

  const isExpired = isPermitExpired(permit);
  const effectiveStatus: PermitStatus = isExpired ? 'EXPIRED' : permit.status;

  const typeInfo = PERMIT_TYPES_INFO[permit.type];
  const statusInfo = STATUS_INFO[effectiveStatus];

  const isGasReTestRequired = permit.gasTestRequired && permit.gasTestPassed && permit.gasTestedAt && (
    (Date.now() - new Date(permit.gasTestedAt).getTime()) > 2 * 60 * 60 * 1000
  );

  const rolesMap: Record<SandboxRole, { ar: string, en: string, nameAr: string, nameEn: string }> = {
    REQUESTER: { ar: 'مشرف الفريق المنفذ', en: 'Site Requester', nameAr: 'مشرف التنفيذ والصيانة', nameEn: 'Maintenance Lead' },
    PRODUCTION: { ar: 'مدير التشغيل والتحكم (الإنتاج)', en: 'Production Manager', nameAr: 'مسؤول الإنتاج والتشغيل', nameEn: 'Production Supervisor' },
    ELECTRICAL: { ar: 'رئيس إدارة الكهرباء والـ LOTO', en: 'Electrical Manager', nameAr: 'مسؤول الكهرباء والعزل', nameEn: 'Electrical Lead' },
    HSE: { ar: 'مشرف سيفيتي (HSE Inspector)', en: 'HSE Officer', nameAr: 'مسؤول السلامة والصحة المهنية', nameEn: 'HSE Safety Officer' }
  };

  const isMatchingActor = !!currentUser;
  
  const actorName = isMatchingActor 
    ? (language === 'ar' ? (currentUser.fullNameAr || currentUser.fullNameEn || currentUser.username) : (currentUser.fullNameEn || currentUser.fullNameAr || currentUser.username)) 
    : (language === 'ar' ? rolesMap[currentRole].nameAr : rolesMap[currentRole].nameEn);
  
  const actorRoleAr = isMatchingActor 
    ? (currentUser.roleAr || rolesMap[currentRole].ar) 
    : rolesMap[currentRole].ar;
  
  const actorRoleEn = isMatchingActor 
    ? (currentUser.roleEn || rolesMap[currentRole].en) 
    : rolesMap[currentRole].en;

  const createAuditEntry = (actionAr: string, actionEn: string, comment: string): AuditLogEntry => {
    return {
      id: `L-${Date.now()}`,
      timestamp: new Date().toISOString().substring(0, 16).replace('T', ' '),
      actionAr,
      actionEn,
      actorName,
      actorRoleAr,
      actorRoleEn,
      comment
    };
  };

 // HANDLERS
 
 // 1. Submit Draft
 const handleSubmitDraft = () => {
 const freshLog = createAuditEntry('تقديم طلب التصريح للاعتماد المبدئي', 'Submitted permit for approvals', 'تأكيد اكتمال متطلبات الصيانة والمقاولين الميدانية.');
 
 // Determine next state: if no department approval is required, go directly to HSE_REVIEW
 const needsDept = permit.productionRequired || permit.electricalRequired;
 const nextStatus: PermitStatus = needsDept ? 'PENDING_DEPT' : 'HSE_REVIEW';

 // Push notification logic
 const targetRole: SandboxRole = permit.productionRequired 
 ? 'PRODUCTION' 
 : (permit.electricalRequired ? 'ELECTRICAL' : 'HSE');
 
 PushNotificationService.sendNotification(
 language === 'ar' ? `🚨 طلب تصريح بانتظار الاجراء: ${permit.id}` : `🚨 Permit Awaiting Action: ${permit.id}`,
 language === 'ar'
 ? `طلب تصريح "${permit.title}" في "${permit.location}" بانتظار تدابير العزل التشغيلي والكهربائي.`
 : `Permit "${permit.title}" in "${permit.location}" is pending isolation/clearance reviews.`,
 {
 targetRole,
 permitId: permit.id,
 actionRequired: true
 }
 );

 onUpdatePermit({
 ...permit,
 status: nextStatus,
 auditTrail: [...permit.auditTrail, freshLog]
 });
 };

 // 2. Production Approval or Reject
 const handleProductionAction = (approve: boolean) => {
 if (!commentText.trim()) {
 alert(language === 'ar' ? 'الرجاء إدخال تعليق أو ملاحظة مبررة قبل الاعتماد.' : 'Please add a comment explaining your clearance review.');
 return;
 }

 const actionTextAr = approve ? 'اعتماد وإقرار التشغيل والإنتاج' : 'رفض طلب التصريح من إدارة الإنتاج';
 const actionTextEn = approve ? 'Approved production physical clearance' : 'Rejected permit by Production Administration';
 
 const freshLog = createAuditEntry(actionTextAr, actionTextEn, commentText);

 let nextStatus = permit.status;
 
 if (approve) {
 const isElectricalPending = permit.electricalRequired && !permit.electricalApproval;
 // If electrical is required but not yet approved (and not current role), keep in PENDING_DEPT. 
 // Else, if Electrical is already approved (or not required), move to HSE_REVIEW!
 nextStatus = isElectricalPending ? 'PENDING_DEPT' : 'HSE_REVIEW';
 
 // Notify next role
 if (isElectricalPending) {
 PushNotificationService.sendNotification(
 language === 'ar' ? `⚡ عزل كهربائي مطلوب: ${permit.id}` : `⚡ Electrical Isolation Needed: ${permit.id}`,
 language === 'ar'
 ? `اعتمدت إدارة الإنتاج خلو الموقع. يرجى عزل الطاقة وتثبيت أقفال LOTO.`
 : `Production clearance received. Electrical isolation & LOTO padlocks are now required.`,
 {
 targetRole: 'ELECTRICAL',
 permitId: permit.id,
 actionRequired: true
 }
 );
 } else {
 PushNotificationService.sendNotification(
 language === 'ar' ? `🛡️ معاينة ومراجعة سلامة: ${permit.id}` : `🛡️ HSE Review Required: ${permit.id}`,
 language === 'ar'
 ? `تم الحصول على موافقات الإدارات. بانتظار تدقيق السلامة وفحص الغازات.`
 : `Department clearances obtained. Awaiting HSE supervisor on-site safety checks & gas monitoring.`,
 {
 targetRole: 'HSE',
 permitId: permit.id,
 actionRequired: true
 }
 );
 }
 } else {
 nextStatus = 'REJECTED';
 
 PushNotificationService.sendNotification(
 language === 'ar' ? `❌ رفض طلب التصريح: ${permit.id}` : `❌ Permit Request Rejected: ${permit.id}`,
 language === 'ar'
 ? `تم رفض الطلب بواسطة (${actorName}): ${commentText}`
 : `Permit was rejected by (${actorName}): ${commentText}`,
 {
 targetRole: 'REQUESTER',
 permitId: permit.id,
 actionRequired: false
 }
 );
 }

 onUpdatePermit({
 ...permit,
 status: nextStatus,
 productionApproval: approve,
 productionApprover: actorName,
 productionComment: commentText,
 productionApprovedAt: new Date().toISOString().substring(0, 16),
 auditTrail: [...permit.auditTrail, freshLog]
 });
 
 setCommentText('');
 };

 // 3. Electrical Approval with LOTO or Reject
 const handleElectricalAction = (approve: boolean) => {
 if (approve && permit.productionRequired && !permit.productionApproval) {
 alert(language === 'ar' 
 ? 'عذراً! موافقة واعتماد إدارة الإنتاج إلزامية قبل إجراء العزل الكهربائي وتطبيق LOTO.' 
 : 'Error! Production department approval and clearance are mandatory before completing electrical isolation and LOTO.');
 return;
 }
 if (approve && permit.lotoRequired && lotoDetails.length === 0) {
 alert(language === 'ar' ? 'الرجاء إضافة نقاط العزل (LOTO) وتوثيقها في السجل أدناه.' : 'Please add Energy Isolation Points (LOTO) to the registry below.');
 return;
 }
 if (approve) {
 const unverifiedStoredEnergy = lotoDetails.filter(l =>
 (l.energyType === 'HYDRAULIC' || l.energyType === 'PNEUMATIC' || permit.type === 'LINE_BREAKING') && !l.doubleBlockAndBleedVerified
 );
 if (unverifiedStoredEnergy.length > 0) {
 alert(language === 'ar'
 ? `يوجد ${unverifiedStoredEnergy.length} نقطة عزل تتطلب تأكيد الحجب المزدوج والتنفيس قبل الاعتماد.`
 : `${unverifiedStoredEnergy.length} isolation point(s) require Double Block & Bleed confirmation before approval.`);
 return;
 }
 }
 if (!commentText.trim()) {
 alert(language === 'ar' ? 'الرجاء إدخال تعليق مبرر لعملية عزل الطاقة.' : 'Please add a commentary details for lock isolation.');
 return;
 }

 const actionTextAr = approve 
 ? `اعتماد خطة عزل الطاقة وتطبيق ${lotoDetails.length} أقفال LOTO`
 : 'رفض طلب عزل الطاقة من قبل إدارة الكهرباء والـ LOTO';
 const actionTextEn = approve 
 ? `Acknowledged electrical safety isolation, applied ${lotoDetails.length} LOTO locks`
 : 'Rejected electricity isolation request';

 const freshLog = createAuditEntry(actionTextAr, actionTextEn, commentText);

 let nextStatus = permit.status;

 if (approve) {
 const isProductionPending = permit.productionRequired && !permit.productionApproval;
 // Check if Production still needs to approve. If yes, stay in PENDING_DEPT. If no, advance to HSE_REVIEW!
 nextStatus = isProductionPending ? 'PENDING_DEPT' : 'HSE_REVIEW';
 
 if (isProductionPending) {
 PushNotificationService.sendNotification(
 language === 'ar' ? `🏗️ خلو خط التشغيل مطلوب: ${permit.id}` : `🏗️ Production Clearance Needed: ${permit.id}`,
 language === 'ar'
 ? `تم عزل اللوحات وتثبيت أقفال LOTO. يرجى إيقاف المغذيات والسيور ميكانيكياً.`
 : `Electrical LOTO complete. Awaiting Production department physical clearance.`,
 {
 targetRole: 'PRODUCTION',
 permitId: permit.id,
 actionRequired: true
 }
 );
 } else {
 PushNotificationService.sendNotification(
 language === 'ar' ? `🛡️ مراجعة وفحص سلامة: ${permit.id}` : `🛡️ HSE Review Required: ${permit.id}`,
 language === 'ar'
 ? `تم اكتمال عزل LOTO والموافقات التشغيلية. بانتظار تدقيق السلامة وفحص الغازات.`
 : `LOTO lock-out complete. Awaiting HSE supervisor on-site safety review & gas test.`,
 {
 targetRole: 'HSE',
 permitId: permit.id,
 actionRequired: true
 }
 );
 }
 } else {
 nextStatus = 'REJECTED';
 
 PushNotificationService.sendNotification(
 language === 'ar' ? `❌ رفض قفل LOTO وعزل الطاقة: ${permit.id}` : `❌ LOTO Isolation Rejected: ${permit.id}`,
 language === 'ar'
 ? `تم رفض طلب عزل الطاقة من م. علي (الكهرباء): ${commentText}`
 : `Energy isolation rejected by Electrical Manager Ali: ${commentText}`,
 {
 targetRole: 'REQUESTER',
 permitId: permit.id,
 actionRequired: false
 }
 );
 }

 onUpdatePermit({
 ...permit,
 status: nextStatus,
 electricalApproval: approve,
 electricalApprover: actorName,
 electricalComment: commentText,
 electricalApprovedAt: new Date().toISOString().substring(0, 16),
 lotoDetails: approve ? lotoDetails : permit.lotoDetails,
 auditTrail: [...permit.auditTrail, freshLog]
 });

 setCommentText('');
 };

 // 4. HSE Gas Testing
 const handlePerformGasTest = () => {
   const oxygenPassed = o2 >= 19.5 && o2 <= 23.5;
   const lelPassed = lel < 10;
   const coPassed = co < 35;
   const h2sPassed = h2s < 10;
   const passed = oxygenPassed && lelPassed && coPassed && h2sPassed;

   const testComment = `قراءات الفحص: الأكسجين ${o2}% (${oxygenPassed ? 'آمن' : 'مخالف'})، المتفجرات LEL %${lel} (${lelPassed ? 'آمن' : 'مخالف'})، أول أكسيد الكربون CO ${co}ppm (${coPassed ? 'آمن' : 'مخالف'})، كبريتيد الهيدروجين H2S ${h2s}ppm (${h2sPassed ? 'آمن' : 'مخالف'}).`;
   
   const freshLog = createAuditEntry(
     passed ? 'فحص الهواء والغازات بنجاح' : 'إجراء فحص الغازات (مؤشرات خطرة!)', 
     passed ? 'Atmospheric gas assessment completed successfully' : 'Atmospheric gas test failed safety thresholds', 
     testComment
   );

   PushNotificationService.sendNotification(
     language === 'ar' ? `💨 نتيجة فحص الغازات: ${permit.id}` : `💨 Gas Test Result: ${permit.id}`,
     language === 'ar'
       ? `فحص الهواء: O₂: ${o2}%, LEL: %${lel}, CO: ${co}ppm, H₂S: ${h2s}ppm. النتيجة: ${passed ? 'مطابق وآمن ✅' : 'خطر وغير مطابقة ❌'}`
       : `Gas values: O2: ${o2}%, LEL: ${lel}%, CO: ${co}ppm, H2S: ${h2s}ppm. Status: ${passed ? 'Safe ✅' : 'Danger Threshold Exceeded ❌'}`,
     {
       targetRole: 'HSE',
       permitId: permit.id,
       actionRequired: passed
     }
   );

 alert(passed 
 ? (language === 'ar' ? '✅ الهواء والغازات مطابقة لمقاييس السلامة! يمكنك الآن إصدار التصريح.' : '✅ Atmospheric test bounds passed. High safety margin established.')
 : (language === 'ar' ? '❌ مستويات خطيرة للغاز الخانق، لا تصدر التصريح ودع مروحة الشفط تعمل لربع وردية!' : '❌ Dangerous respiratory metrics measured on-site! Hold authorization.')
 );

 onUpdatePermit({
 ...permit,
 gasO2Level: o2,
 gasLELLevel: lel,
 gasCOLevel: co,
 gasH2SLevel: h2s,
 gasTestPassed: passed,
 gasTester: actorName,
 gasTestedAt: new Date().toISOString().substring(0, 16),
 auditTrail: [...permit.auditTrail, freshLog]
 });

 setGasSubmitted(true);
 };

 // 5. HSE Final Issue (Approve) or Reject
 const handleHseAction = (approve: boolean) => {
 if (approve && permit.gasTestRequired && !permit.gasTestPassed) {
 alert(language === 'ar' ? 'لا يمكن إصدار التصريح قبل إجراء فحص الغازات وتجاوزه بنجاح!' : 'Gas monitoring must pass safety limits prior to permit issuing.');
 return;
 }
 if (approve && expiredCompetencyWorkers.length > 0) {
 alert(language === 'ar'
 ? `لا يمكن إصدار التصريح: العامل/العمال التالية أسماؤهم بدون شهادة كفاءة سارية لهذا النوع من العمل: ${expiredCompetencyWorkers.map(w => w.name).join('، ')}. يجب إزالتهم من التصريح أو تحديث شهاداتهم أولاً.`
 : `Cannot issue permit: the following worker(s) lack a valid certification for this work type: ${expiredCompetencyWorkers.map(w => w.name).join(', ')}. Remove them from the permit or update their training records first.`);
 return;
 }
 if (approve && permit.type === 'CONFINED' && (!permit.rescueEquipmentOnStandby || !permit.communicationMethod)) {
 alert(language === 'ar'
 ? 'لا يمكن إصدار تصريح مكان مغلق بدون تأكيد جاهزية معدات الإنقاذ ووسيلة الاتصال مع العامل بالداخل (OSHA 1910.146).'
 : 'Cannot issue a confined-space permit without confirmed rescue equipment readiness and a communication method with the entrant (OSHA 1910.146).');
 return;
 }
 if (approve && hasUnresolvedSimopsConflict) {
 alert(language === 'ar'
 ? 'يوجد تصريح آخر نشط في نفس الموقع (SIMOPS). يرجى مراجعة التعارض والإقرار به أدناه قبل إصدار التصريح.'
 : 'Another permit is active at this same location (SIMOPS conflict). Review and acknowledge it below before issuing this permit.');
 return;
 }
 if (!commentText.trim()) {
 alert(language === 'ar' ? 'الرجاء تدوين التوجيهات النهائية لسلامة طاقم العمل.' : 'Please describe safety directions in your review comments.');
 return;
 }

 const actionTextAr = approve ? 'إصدار تصريح العمل واعتماده سارياً للعمل' : 'رفض نهائي لطلب التصريح بدواعي السلامة المهنية';
 const actionTextEn = approve ? 'Authorized, issued and signed active PTW' : 'Rejected permit request by HSE';

 const freshLog = createAuditEntry(actionTextAr, actionTextEn, commentText);

 // Notify requester
 if (approve) {
 PushNotificationService.sendNotification(
 language === 'ar' ? `✅ تصريح العمل جاهز ونشط: ${permit.id}` : `✅ Permit Is Now ACTIVE: ${permit.id}`,
 language === 'ar'
 ? `اعتمدت إدارة السلامة تصريح "${permit.title}" وهو جاهز لبدء العمل في الموقع تحت إشرافك.`
 : `Safety Department approved & issued permit "${permit.title}". Site work is authorized to start under EHS compliance.`,
 {
 targetRole: 'REQUESTER',
 permitId: permit.id,
 actionRequired: false
 }
 );
 } else {
 PushNotificationService.sendNotification(
 language === 'ar' ? `❌ رفض طلب التصريح نهائياً: ${permit.id}` : `❌ Permit Final Rejection: ${permit.id}`,
 language === 'ar'
 ? `تم رفض التصريح نهائياً من م. أسعد (HSE): ${commentText}`
 : `Permit was rejected by HSE Safety Supervisor Asaad: ${commentText}`,
 {
 targetRole: 'REQUESTER',
 permitId: permit.id,
 actionRequired: false
 }
 );
 }

 onUpdatePermit({
 ...permit,
 status: approve ? 'ACTIVE' : 'REJECTED',
 hseApproval: approve,
 hseApprover: actorName,
 hseComment: commentText,
 hseApprovedAt: new Date().toISOString().substring(0, 16),
 safetyPrecautionConfirmations: checkedPrecautions,
 conflictAcknowledged: approve ? conflictAcknowledged : permit.conflictAcknowledged,
 auditTrail: [...permit.auditTrail, freshLog]
 });

 setCommentText('');
 };

 // 6. Requester asks for Closure
 const handleRequestClosure = () => {
 if (!commentText.trim()) {
 alert(language === 'ar' ? 'الرجاء إدخال تعليق يثبت خروج العمال وفك المحابس ميكانيكياً.' : 'Please add remarks stating workers clearance and lock dismantle requests.');
 return;
 }
 
 // Check if all HANDBACK_CHECKLIST items are checked
 const allChecked = HANDBACK_CHECKLIST.every(item => handbackChecks[item.id]);
 if (!allChecked) {
 alert(language === 'ar' ? 'يجب تأكيد جميع بنود الإغلاق والمراجعة أولاً.' : 'All handback checklist items must be confirmed before closure.');
 return;
 }

 // OSHA 1910.147: every isolation lock applied for this permit must be individually
 // removed and attributed before the permit can proceed to closure.
 if (permit.lotoRequired && lotoDetails.length > 0) {
 const allLocksCleared = lotoDetails.every(l => l.isRemoved && l.removerName?.trim());
 if (!allLocksCleared) {
 alert(language === 'ar'
 ? 'يجب تسجيل إزالة كل قفل عزل (LOTO) مع اسم من قام بإزالته قبل طلب الإغلاق.'
 : 'Every LOTO isolation lock must be marked removed, with the remover named, before requesting closure.');
 return;
 }
 }

 // NFPA 51B / OSHA 1910.252: hot work requires a confirmed post-work fire watch before closure.
 if (permit.type === 'HOT' && !fireWatchConfirmed) {
 alert(language === 'ar'
 ? `يجب تأكيد مراقبة الحريق لمدة ${fireWatchMinutes} دقيقة بعد توقف أعمال اللحام/القطع، والتأكد من عدم وجود اشتعال متأخر، قبل طلب الإغلاق.`
 : `You must confirm a ${fireWatchMinutes}-minute post-work fire watch, with no delayed ignition observed, before requesting closure.`);
 return;
 }

 const freshLog = createAuditEntry(
 'تقديم طلب إغلاق ميكانيكي وميداني للموقع', 
 'Requested chemical cleanup and mechanical license closure', 
 commentText
 );

 // Notify HSE
 PushNotificationService.sendNotification(
 language === 'ar' ? `🧹 طلب إغلاق وتفتيش نظافة الموقع: ${permit.id}` : `🧹 Housekeeping & Closure Audit Required: ${permit.id}`,
 language === 'ar'
 ? `قام م. أحمد بإنهاء أعمال الصيانة وتصفية العمال في تصريح "${permit.title}". يرجى تفتيش الموقع وإغلاق LOTO.`
 : `Eng. Ahmed reported maintenance work complete & site cleared for permit "${permit.title}". Please inspect housekeeping & archive.`,
 {
 targetRole: 'HSE',
 permitId: permit.id,
 actionRequired: true
 }
 );

 onUpdatePermit({
 ...permit,
 status: 'PENDING_CLOSE',
 supervisorVerified: false, // Reset supervisor verification for closure audit
 lotoDetails: permit.lotoRequired ? lotoDetails : permit.lotoDetails,
 typeSpecificChecks: permit.type === 'HOT'
 ? { ...permit.typeSpecificChecks, fireWatchMinutes, fireWatchConfirmed }
 : permit.typeSpecificChecks,
 auditTrail: [...permit.auditTrail, freshLog]
 });

 setCommentText('');
 };

 const markLotoRemoved = (lockId: string, removerName: string) => {
 setLotoDetails(prev => prev.map(l => l.id === lockId
 ? { ...l, isRemoved: !!removerName.trim(), removerName, removedAt: removerName.trim() ? new Date().toISOString().substring(0, 16) : undefined }
 : l
 ));
 };

 // NEBOSH Gap A: Suspension & Reinstatement
 const handleSuspendPermit = () => {
 if (!commentText.trim()) {
 alert(language === 'ar' ? 'الرجاء إدخال سبب التعليق (مثل: إنذار حريق عام).' : 'Please enter suspension reason.');
 return;
 }
 const freshLog = createAuditEntry('تعليق التصريح', 'Suspended Permit', commentText);
 onUpdatePermit({
 ...permit,
 status: 'SUSPENDED',
 auditTrail: [...permit.auditTrail, freshLog]
 });
 setCommentText('');
 };

 const handleReinstatePermit = () => {
 if (permit.gasTestRequired && !permit.gasTestPassed) {
 alert(language === 'ar' ? 'لا يمكن إعادة تفعيل التصريح قبل إجراء فحص غازات جديد.' : 'Cannot reinstate without a new passed gas test.');
 return;
 }
 if (expiredCompetencyWorkers.length > 0) {
 alert(language === 'ar'
 ? `لا يمكن إعادة التفعيل: العامل/العمال التالية أسماؤهم بدون شهادة كفاءة سارية: ${expiredCompetencyWorkers.map(w => w.name).join('، ')}.`
 : `Cannot reinstate: the following worker(s) lack a valid certification: ${expiredCompetencyWorkers.map(w => w.name).join(', ')}.`);
 return;
 }
 if (!commentText.trim()) {
 alert(language === 'ar' ? 'الرجاء إدخال تعليق الموافقة.' : 'Please add approval comments.');
 return;
 }
 const freshLog = createAuditEntry('إعادة تفعيل التصريح', 'Reinstated Permit', commentText);
 onUpdatePermit({
 ...permit,
 status: 'ACTIVE',
 auditTrail: [...permit.auditTrail, freshLog]
 });
 setCommentText('');
 };

 // NEBOSH Gap B: Shift Handover
 const handleShiftHandover = () => {
 if (!handoverNotes.trim() || !handoverSignoff) {
 alert(language === 'ar' ? 'الرجاء كتابة ملاحظات التسليم والإقرار بالموافقة.' : 'Please enter handover notes and sign off.');
 return;
 }
 const freshLog = createAuditEntry('تسليم الوردية', 'Shift Handover', handoverNotes);
 onUpdatePermit({
 ...permit,
 auditTrail: [...permit.auditTrail, freshLog]
 });
 setHandoverNotes('');
 setHandoverSignoff(false);
 alert(language === 'ar' ? 'تم توثيق تسليم الوردية بنجاح.' : 'Shift handover recorded successfully.');
 };

 // NEBOSH Gap C: Permit Extension
 const handleExtendPermit = () => {
 if (extensionHours <= 0 || !commentText.trim()) {
 alert(language === 'ar' ? 'الرجاء تحديد عدد الساعات ومبرر التمديد.' : 'Please specify hours and justification.');
 return;
 }
 const freshLog = createAuditEntry(`تمديد التصريح لـ ${extensionHours} ساعات`, `Extended permit by ${extensionHours} hours`, commentText);
 onUpdatePermit({
 ...permit,
 auditTrail: [...permit.auditTrail, freshLog]
 });
 setCommentText('');
 setExtensionHours(2);
 alert(language === 'ar' ? 'تم توثيق طلب التمديد والموافقة عليه.' : 'Extension documented and approved.');
 };

 // 6b. Safety Supervisor Field Checkpoint Verification
 const handleSupervisorVerify = () => {
 if (permit.gasTestRequired && !permit.gasTestPassed) {
 alert(language === 'ar' ? 'لا يمكن إكمال تفقد المشرف قبل إجراء فحص الغازات وتجاوزه بنجاح!' : 'Gas monitoring must pass safety limits prior to supervisor safety confirmation.');
 return;
 }
 if (expiredCompetencyWorkers.length > 0) {
 alert(language === 'ar'
 ? `لا يمكن تفعيل التصريح: العامل/العمال التالية أسماؤهم بدون شهادة كفاءة سارية لهذا النوع من العمل: ${expiredCompetencyWorkers.map(w => w.name).join('، ')}.`
 : `Cannot activate permit: the following worker(s) lack a valid certification for this work type: ${expiredCompetencyWorkers.map(w => w.name).join(', ')}.`);
 return;
 }
 if (permit.type === 'CONFINED' && (!permit.rescueEquipmentOnStandby || !permit.communicationMethod)) {
 alert(language === 'ar'
 ? 'لا يمكن تفعيل تصريح مكان مغلق بدون تأكيد جاهزية معدات الإنقاذ ووسيلة الاتصال مع العامل بالداخل (OSHA 1910.146).'
 : 'Cannot activate a confined-space permit without confirmed rescue equipment readiness and a communication method with the entrant (OSHA 1910.146).');
 return;
 }
 if (hasUnresolvedSimopsConflict) {
 alert(language === 'ar'
 ? 'يوجد تصريح آخر نشط في نفس الموقع (SIMOPS). يرجى مراجعة التعارض والإقرار به أدناه قبل التفعيل.'
 : 'Another permit is active at this same location (SIMOPS conflict). Review and acknowledge it below before activating this permit.');
 return;
 }
 if (!commentText.trim()) {
 alert(language === 'ar' ? 'الرجاء إدخال توجيهات المراقبة الميدانية المعتمدة من قبلكم.' : 'Please add safety supervisor comments for the field audit record.');
 return;
 }

 const freshLog = createAuditEntry(
 'تثبت ومعاينة السلامة ميدانياً وإصدار التصريح', 
 'On-site safety checks verified and permit active release', 
 commentText
 );

 const verifierName = actorName;

 // Notify requester
 PushNotificationService.sendNotification(
 language === 'ar' ? `✅ تفعيل وتدقيق السلامة بالميدان: ${permit.id}` : `✅ Field Inspection Complete (Active): ${permit.id}`,
 language === 'ar'
 ? `أجرى المشرف ${verifierName} معاينة للموقع واعتمد سلامة التدابير الوقائية. تصريح العمل نشط الآن.`
 : `EHS Supervisor ${verifierName} completed on-site audit. The permit is now fully ACTIVE.`,
 {
 targetRole: 'REQUESTER',
 permitId: permit.id,
 actionRequired: false
 }
 );

 onUpdatePermit({
 ...permit,
 status: 'ACTIVE',
 supervisorVerified: true,
 supervisorVerifier: actorName,
 supervisorVerifiedAt: new Date().toISOString().substring(0, 16),
 supervisorComment: commentText,
 hseApproval: true,
 hseApprover: actorName,
 hseApprovedAt: new Date().toISOString().substring(0, 16),
 hseComment: commentText,
 safetyPrecautionConfirmations: checkedPrecautions,
 conflictAcknowledged: conflictAcknowledged || permit.conflictAcknowledged,
 auditTrail: [...permit.auditTrail, freshLog]
 });

 alert(language === 'ar' ? '✓ تم تسجيل التحقق الميداني والتدابير الوقائية وتفعيل تصريح العمل بنجاح!' : '✓ Field verification completed. Permit is now ACTIVE for work.');
 setCommentText('');
 };

 // 6c. Safety Supervisor Post-Work Environmental Handover Verification
 const handleSupervisorCloseVerify = () => {
 if (!commentText.trim()) {
 alert(language === 'ar' ? 'الرجاء تدوين حالة نظافة محيط عمل الصيانة وخلو الموقع.' : 'Please add field observations concerning housekeeping and site clearance.');
 return;
 }

 const freshLog = createAuditEntry(
 'تفتيش النظافة الميدانية وإغلاق وأرشفة التصريح نهائياً', 
 'Post-work site cleanliness inspected and filed for final archival', 
 commentText
 );

 // Notify requester and department
 PushNotificationService.sendNotification(
 language === 'ar' ? `📁 تم إغلاق وأرشفة التصريح مغلقاً: ${permit.id}` : `📁 Permit Closed and Archived: ${permit.id}`,
 language === 'ar'
 ? `تم فحص نظافة موقع التصريح "${permit.title}" وتأكيد سلامة تصفية الموقع بالكامل ومغادرته.`
 : `Housekeeping audited. Permit "${permit.title}" is archived. All locks and isolating gears removed.`,
 {
 targetRole: 'REQUESTER',
 permitId: permit.id,
 actionRequired: false
 }
 );

 onUpdatePermit({
 ...permit,
 status: 'CLOSED',
 supervisorVerified: true,
 supervisorComment: `[معاينة النظافة]: ${commentText}`,
 auditTrail: [...permit.auditTrail, freshLog]
 });

 alert(language === 'ar' ? '✓ تم توثيق المعاينة الميدانية وإغلاق وأرشفة تصريح العمل بنجاح!' : '✓ Post-work checks completed and permit is archived as CLOSED.');
 setCommentText('');
 };

 // 7. HSE Closes permit permanently
 const handleFinalClose = () => {
 const confirmation = window.confirm(
 language === 'ar' 
 ? 'هل تؤكد إخلاء الموقع بالكامل من المعدات ونظافة محيط العمل، لإنهاء تفعيل التصريح وأرشفته مغلقاً؟' 
 : 'Do you confirm that workers cleared the site, gears have been cleaned, and energy locks dismantled for final permit archival?'
 );

 if (!confirmation) return;

 const freshLog = createAuditEntry(
 'معاينة الموقع وتأكيد النظافة وإغلاق التصريح نهائياً بأمان', 
 'Site audit confirmed clean, filed and closed permanently', 
 commentText || (language === 'ar' ? 'الفحص الميداني ممتاز، تمت تصفية الأقفال وإعطاء إذن معاودة التشغيل.' : 'Physical check concluded. Site is clean. Power returned.')
 );

 PushNotificationService.sendNotification(
 language === 'ar' ? `📁 إغلاق نهائي لتصريح العمل: ${permit.id}` : `📁 Permit Permanently Closed: ${permit.id}`,
 language === 'ar'
 ? `أغلق م. أسعد تصريح "${permit.title}" نهائياً وأرشيفه بأمان ومصادر الطاقة استرجعت.`
 : `HSE closed permit "${permit.title}". Electrical/hydraulic power sources restored to active operation.`,
 {
 targetRole: 'REQUESTER',
 permitId: permit.id,
 actionRequired: false
 }
 );

 onUpdatePermit({
 ...permit,
 status: 'CLOSED',
 auditTrail: [...permit.auditTrail, freshLog]
 });

 setCommentText('');
 };

 // Local helper for checking precautions
 const togglePrecaution = (preid: string) => {
 const newVal = !checkedPrecautions[preid];
 const updated = { ...checkedPrecautions, [preid]: newVal };
 setCheckedPrecautions(updated);
 };

 return (
 <div id="details-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-md p-5 text-start font-sans flex flex-col gap-6">
 
 {/* 1. Header Section: Title + Navigation */}
 <div id="details-heading" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
 
 <div>
 <div className="flex flex-wrap items-center gap-2 mb-2 justify-start ">
 <span className="text-xl font-bold font-mono text-orange-600 shrink-0">{permit.id}</span>
 <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${typeInfo.color}`}>
 {language === 'ar' ? typeInfo.labelAr : typeInfo.labelEn}
 </span>
 <span className={`text-xs font-bold px-3 py-0.5 rounded-md border ${statusInfo.color}`}>
 {language === 'ar' ? statusInfo.labelAr : statusInfo.labelEn}
 </span>
 </div>
 <h2 id="deep-detail-title" className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100 leading-snug">
 {permit.title}
 </h2>
 </div>

 <div className="flex gap-2">
  {onDeletePermit && (isCompanyAdmin || (permit.status === 'DRAFT' && canActAsRequester)) && (
 <button
 id="delete-draft-btn"
 onClick={() => {
 if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف مسودة التصريح هذه نهائياً؟' : 'Are you sure you want to permanently delete this draft permit?')) {
 onDeletePermit(permit.id);
 }
 }}
 className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-950/40 text-red-650 hover:bg-red-50 hover:text-red-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
 >
 <Trash2 id="trash-ico" className="w-4 h-4" />
 <span>{language === 'ar' ? 'مسح المسودة' : 'Delete Draft'}</span>
 </button>
 )}

 <button
 id="back-list-btn"
 onClick={onBackToDashboard}
 className="px-3.5 py-1.5 border border-neutral-200 dark:border-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold cursor-pointer focus:outline-none"
 >
 {language === 'ar' ? 'العودة للمؤشرات 📋' : 'Back to Dashboard 📋'}
 </button>
 </div>

 </div>

  {/* EMERGENCY RESPONSE ACTION CARD (Phase 5) */}
  <div className="bg-red-500/10 border-2 border-red-500/30 p-4 rounded-xl space-y-3 text-start">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-sm">
        <Siren className="w-5 h-5 animate-pulse text-red-500" />
        <span>{language === 'ar' ? '🚨 خطة وإجراءات الطوارئ للموقع (Emergency Response Plan)' : '🚨 Site Emergency Response Plan'}</span>
      </div>
      {(permit.emergencyContactPhone || permit.emergencyContact) && (
        <a 
          href={`tel:${permit.emergencyContactPhone || permit.emergencyContact}`} 
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          <span>📞 {language === 'ar' ? 'اتصال عاجل' : 'Call Emergency'}</span>
        </a>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
      <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
        <span className="text-[10px] text-neutral-400 block font-bold">{language === 'ar' ? 'جهة اتصالات الطوارئ:' : 'Emergency Contact:'}</span>
        <span className="font-extrabold text-neutral-800 dark:text-neutral-200">{permit.emergencyContactName || permit.emergencyContact || 'HSE Rescue Team'}</span>
      </div>
      <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
        <span className="text-[10px] text-neutral-400 block font-bold">{language === 'ar' ? 'نقطة التجمع بالإخلاء:' : 'Evacuation Assembly Point:'}</span>
        <span className="font-extrabold text-red-700 dark:text-red-400">{permit.assemblyPoint || permit.emergencyAssemblyPoint || (language === 'ar' ? 'نقطة التجمع الرئيسية A' : 'Main Muster Point A')}</span>
      </div>
      <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
        <span className="text-[10px] text-neutral-400 block font-bold">{language === 'ar' ? 'أقرب مركز إسعاف طبي:' : 'Nearest Medical Facility:'}</span>
        <span className="font-extrabold text-neutral-800 dark:text-neutral-200">{permit.nearestMedicalFacility || (language === 'ar' ? 'عيادة الموقع الطبية الرئيسية' : 'Main Site Clinic')}</span>
      </div>
    </div>
  </div>

 {/* VISUAL WORKFLOW ROADMAP (خارطة مسار وسير العمل بالتصريح) */}
 <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-850">
 <h4 className="text-[11px] font-black text-neutral-500 uppercase tracking-wider mb-3 select-none flex items-center justify-start gap-1.5 ">
 <HelpCircle className="w-4 h-4 text-orange-500" />
 <span>{language === 'ar' ? 'خارطة مسار وخط سير تصريح العمل الرقمي (NEBOSH Workflow)' : 'Permit Lifecycle & EHS Workflow Roadmap'}</span>
 </h4>
 
 <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 {[
 { key: 'DRAFT', ar: '١. مسودة مبدئية', en: '1. Initial Draft' },
 { key: 'PENDING_DEPT', ar: '٢. إقرار العزل', en: '2. Dept Clearance' },
 { key: 'HSE_REVIEW', ar: '٣. مراجعة السلامة', en: '3. EHS Audit' },
 { key: 'ACTIVE', ar: '٤. تصريح نشط', en: '4. Active Permit' },
 { key: 'PENDING_CLOSE', ar: '٥. طلب الإغلاق', en: '5. Pre-Closure' },
 { key: 'CLOSED', ar: '٦. مغلق ومؤرشف', en: '6. Safety Archived' }
 ].map((step, idx) => {
 const statusesOrder: PermitStatus[] = ['DRAFT', 'PENDING_DEPT', 'HSE_REVIEW', 'ACTIVE', 'PENDING_CLOSE', 'CLOSED'];
 const normalizedStatus = permit.status === 'SUSPENDED' ? 'ACTIVE' : permit.status;
 const currentIdx = statusesOrder.indexOf(normalizedStatus);
 const stepIdx = statusesOrder.indexOf(step.key as PermitStatus);
 
 const isCurrent = normalizedStatus === step.key;
 const isCompleted = stepIdx < currentIdx && permit.status !== 'REJECTED';
 
 let bgClass = 'bg-neutral-100 border-neutral-200 text-neutral-400 dark:bg-neutral-900 dark:border-neutral-850';
 let iconElement = <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />;
 
 if (isCurrent) {
 if (permit.status === 'REJECTED') {
 bgClass = 'bg-rose-500 border-rose-500 text-white shadow-md';
 iconElement = <XCircle className="w-3.5 h-3.5 text-white" />;
 } else {
 bgClass = 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20';
 iconElement = <div className="w-2 h-2 rounded-full bg-white dark:bg-neutral-900 animate-ping" />;
 }
 } else if (isCompleted) {
 bgClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400';
 iconElement = <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
 }
 
 return (
 <div 
 key={step.key} 
 className={`py-2 px-2.1 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all select-none ${bgClass}`}
 >
 <div className="flex items-center gap-1.5 ">
 {iconElement}
 <span className="text-[10px] sm:text-xs font-bold leading-tight select-none">
 {language === 'ar' ? step.ar : step.en}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* 2. NEBOSH STRUCTURED SECTIONS */}
 <div id="nebosh-structured-sections" className="flex flex-col gap-5">
 
 {/* SECTION 1: Identification & Basic Info */}
 <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl text-start">
 <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center justify-start gap-1 ">
 <FileText className="w-4 h-4 text-orange-500" />
 <span>{language === 'ar' ? 'القسم الأول: تعريف المهمة والموقع' : 'Section 1: Task Identification'}</span>
 </h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-lg border border-neutral-150 dark:border-neutral-850">
 <p className="text-[10px] text-neutral-400">{language === 'ar' ? 'وصف العمل' : 'Description of Work'}</p>
 <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">{permit.description}</p>
 </div>

 <div className="bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-lg border border-neutral-150 dark:border-neutral-850">
 <p className="text-[10px] text-neutral-400">{language === 'ar' ? 'الموقع الجغرافي' : 'Location'}</p>
 <div className="flex items-center gap-2 mt-1 justify-start ">
 <MapPin className="w-3.5 h-3.5 text-neutral-500" />
 <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{permit.location}</p>
 </div>
 </div>

 <div className="bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-lg border border-neutral-150 dark:border-neutral-850">
 <p className="text-[10px] text-neutral-400">{language === 'ar' ? 'فترة الصلاحية المجدولة' : 'Validity Term'}</p>
 <div className="flex items-center gap-2 mt-1 justify-start ">
 <Calendar className="w-3.5 h-3.5 text-neutral-500" />
 <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-mono">
 {permit.startDate.replace('T', ' ')} &mdash; {permit.endDate.replace('T', ' ')}
 </p>
 </div>
 </div>

 {permit.hiraId || permit.internalRiskAssessment ? (
 <div className="bg-emerald-500/10 p-3.5 rounded-lg border border-emerald-500/20">
 <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{language === 'ar' ? 'تقييم المخاطر' : 'Risk Assessment'}</p>
 <div className="flex items-center gap-2 mt-1 justify-start ">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
 <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
   {permit.internalRiskAssessment ? (language === 'ar' ? 'تقييم داخلي / فحص موقعي' : 'Internal / On-site Assessment') : permit.hiraId}
 </p>
 </div>
 </div>
 ) : null}
 </div>
 </div>

 {/* SECTION 2: Detailed NEBOSH Checklists */}
 {permit.neboshChecklists && Object.keys(permit.neboshChecklists).length > 0 && (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl text-start">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center justify-start gap-1 ">
        <CheckCircle className="w-4 h-4 text-orange-500" />
        <span>{language === 'ar' ? 'القسم الثاني: قوائم التحقق الإلزامية' : 'Section 2: Mandatory Checklists'}</span>
      </h3>
      <div className="flex flex-col gap-4">
        {Object.entries(permit.neboshChecklists).map(([listId, itemsMap]) => {
          const checklistKey = listId as keyof typeof PDF_CHECKLISTS;
          const listItems = PDF_CHECKLISTS[checklistKey];
          if (!listItems) return null;

          const titleObj = [
            { id: 'ppe', ar: '(A) مهمات الوقاية المطلوبة لأداء العمل', en: '(A) Required PPE' },
            { id: 'general', ar: '(B) التحقق من الامتثال للسلامة عامة', en: '(B) General Safety Compliance' },
            { id: 'hotWork', ar: '(C) أعمال ساخنة (قطع/لحام/تجليخ)', en: '(C) Hot Work (Cutting/Welding/Grinding)' },
            { id: 'hotMaterial', ar: '(D) مواد ساخنة (لا تفتح الأبواب مطلقاً)', en: '(D) Hot Materials' },
            { id: 'lifting', ar: '(E) أعمال رفع', en: '(E) Lifting Operations' },
            { id: 'confinedSpace', ar: '(F) دخول أماكن مغلقة', en: '(F) Confined Space Entry' },
            { id: 'workAtHeight', ar: '(G) أعمال على ارتفاع', en: '(G) Working at Height' }
          ].find(t => t.id === listId);

          return (
            <div key={listId} className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border border-neutral-150 dark:border-neutral-850">
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {language === 'ar' ? titleObj?.ar : titleObj?.en}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                {listItems.map((item) => {
                  if ('isHeader' in item && item.isHeader) {
                     return (
                       <div key={item.id} className="col-span-1 md:col-span-2 mt-2">
                         <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{language === 'ar' ? item.labelAr : item.labelEn}</span>
                       </div>
                     );
                  }
                  const isChecked = !!(itemsMap && itemsMap[item.id as keyof typeof itemsMap]);
                  return (
                    <div key={item.id} className="flex items-start gap-2">
                      {isChecked ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 border border-neutral-300 dark:border-neutral-600 rounded mt-0.5 shrink-0"></div>
                      )}
                      <span className={`text-xs ${isChecked ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-500'}`}>
                        {language === 'ar' ? item.labelAr : item.labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

  {/* SECTION 2B: Detailed OSHA Checklists */}
  {permit.oshaChecklists && Object.keys(permit.oshaChecklists).length > 0 && (
    <div className="bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl text-start mt-4">
      <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center justify-start gap-1 ">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <span>{language === 'ar' ? 'القسم الثاني (ب): قوائم فحص OSHA الإلزامية' : 'Section 2B: Mandatory OSHA Checklists'}</span>
      </h3>
      <div className="flex flex-col gap-4">
        {Object.entries(permit.oshaChecklists).map(([category, itemsMap]) => {
          if (!itemsMap || Object.keys(itemsMap).length === 0) return null;
          
          const catLabels: Record<string, {ar: string, en: string}> = {
            lotoVerification: { ar: 'التحقق من عزل الطاقة (LOTO)', en: 'LOTO Verification' },
            confinedSpace: { ar: 'الأماكن المغلقة', en: 'Confined Space' },
            hotWork: { ar: 'العمل الساخن', en: 'Hot Work' },
            generalSafety: { ar: 'السلامة العامة', en: 'General Safety' }
          };

          return (
            <div key={category} className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-3 border-b border-emerald-100 dark:border-emerald-900/30 pb-2">
                {language === 'ar' ? catLabels[category]?.ar : catLabels[category]?.en}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                {Object.entries(itemsMap).map(([itemId, isChecked]) => {
                  if (!isChecked) return null;
                  const itemDef = OSHA_CHECKLISTS[category as keyof typeof OSHA_CHECKLISTS]?.find(x => x.id === itemId);
                  const label = itemDef ? (language === 'ar' ? itemDef.labelAr : itemDef.labelEn) : itemId;
                  return (
                    <div key={itemId} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-neutral-800 dark:text-neutral-200">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

 {/* SECTION 3: Hazards & Control Measures */}
 <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl text-start">
 <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center justify-start gap-1 ">
 <ShieldAlert className="w-4 h-4 text-orange-500" />
 <span>{language === 'ar' ? 'القسم الثالث: المخاطر وتدابير التحكم' : 'Section 3: Hazards & Control Measures'}</span>
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-3.5 rounded-lg">
 <h4 className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-2">{language === 'ar' ? 'المخاطر المحددة' : 'Identified Hazards'}</h4>
 <div className="flex flex-col gap-1.5">
 {permit.hazards?.length > 0 ? permit.hazards.map(hazid => {
 const h = STANDARD_HAZARDS.find(x => x.id === hazid);
 return (
 <div key={hazid} className="text-xs text-neutral-800 dark:text-neutral-300 flex gap-2 justify-start items-start">
 <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
 <span>{language === 'ar' ? h?.labelAr : h?.labelEn}</span>
 </div>
 );
 }) : (
 <p className="text-[11px] text-neutral-400 italic">{language === 'ar' ? 'لا يوجد مخاطر قياسية' : 'No standard hazards identified'}</p>
 )}
 </div>
 </div>

 <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-3.5 rounded-lg">
 <h4 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-2">{language === 'ar' ? 'تدابير التحكم والوقاية' : 'Control Measures & PPE'}</h4>
 
 {permit.controlMeasures && Object.keys(permit.controlMeasures).length > 0 && (
 <div className="mb-3 flex flex-col gap-1">
 {Object.entries(permit.controlMeasures).filter(([_, checked]) => checked).map(([cid]) => {
 const cm = NEBOSH_CONTROL_MEASURES.find(c => c.id === cid);
 if (!cm) return null;
 return (
 <div key={cid} className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 justify-start ">
 <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
 <span>{language === 'ar' ? cm.labelAr : cm.labelEn}</span>
 </div>
 );
 })}
 </div>
 )}
 
 <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-800/30">
 {permit.requiredPPE?.map((ppeid) => {
 const ppe = STANDARD_PPES.find(p => p.id === ppeid);
 return (
 <span key={ppeid} className="bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
 <ShieldCheck className="w-3 h-3" />
 {language === 'ar' ? ppe?.labelAr : ppe?.labelEn}
 </span>
 );
 })}
 </div>
 </div>
 </div>
 </div>

 {/* SECTION 3: Competency & Workers */}
 <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl text-start">
 <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center justify-start gap-1 ">
 <Users className="w-4 h-4 text-orange-500" />
 <span>{language === 'ar' ? 'القسم الثالث: الكفاءة وفريق العمل' : 'Section 3: Competency & Workers'}</span>
 </h3>
 
 <div className="bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-lg border border-neutral-150 dark:border-neutral-850 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
 <div className="flex-1">
 <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs px-2.5 py-1.5 rounded font-bold inline-block mb-2">
 ⚙️ {language === 'ar' ? `المشرف: ${permit.requesterName}` : `Lead: ${permit.requesterName}`}
 </span>
 <div className="flex flex-wrap gap-1.5">
 {permit.workers?.map((w, i) => (
 <span key={i} className="text-[11px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded text-neutral-700 dark:text-neutral-300 shadow-sm">👷 {w}</span>
 ))}
 </div>
 </div>

 <div className="flex flex-col gap-2 text-[11px] min-w-[220px] bg-white dark:bg-neutral-900 p-3 rounded border border-neutral-150 dark:border-neutral-800 shadow-sm">
 <div className="flex items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
 <span className="text-neutral-500 font-bold">{language === 'ar' ? 'اجتماع السلامة TBT:' : 'Toolbox Talk:'}</span>
 {permit.toolboxTalkCompleted ? (
 <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {language === 'ar' ? 'تم التنفيذ' : 'Completed'}</span>
 ) : (
 <span className="text-neutral-400 flex items-center gap-1"><XCircle className="w-3 h-3"/> {language === 'ar' ? 'غير مسجل' : 'Not recorded'}</span>
 )}
 </div>
 <div className="flex items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
 <span className="text-neutral-500 font-bold">{language === 'ar' ? 'تدريب العمال:' : 'Workers Briefed:'}</span>
 {permit.allWorkersBriefed ? (
 <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {language === 'ar' ? 'تمت الإحاطة' : 'Briefed'}</span>
 ) : (
 <span className="text-neutral-400 flex items-center gap-1"><XCircle className="w-3 h-3"/> {language === 'ar' ? 'غير مسجل' : 'Not recorded'}</span>
 )}
 </div>
 <div className="flex items-center justify-between gap-3">
 <span className="text-neutral-500 font-bold">{language === 'ar' ? 'شهادات العمال:' : 'Certifications:'}</span>
 <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 rounded">
 {permit.workerCertifications?.length || 0} {language === 'ar' ? 'شهادات' : 'Certs'}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* SECTION 4: Emergency Procedures */}
 <div className="bg-red-50/30 dark:bg-red-950/10 border border-red-150 dark:border-red-900/30 p-4 rounded-xl text-start">
 <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center justify-start gap-1 ">
 <HeartHandshake className="w-4 h-4 text-red-500" />
 <span>{language === 'ar' ? 'القسم الرابع: إجراءات الطوارئ والإنقاذ' : 'Section 4: Emergency Procedures'}</span>
 </h3>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
 <p className="text-[10px] text-neutral-400 mb-1">{language === 'ar' ? 'نقطة التجمع' : 'Assembly Point'}</p>
 <p className="text-xs font-bold text-red-700 dark:text-red-400">{permit.emergencyAssemblyPoint || '---'}</p>
 </div>
 <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
 <p className="text-[10px] text-neutral-400 mb-1">{language === 'ar' ? 'جهة الاتصال' : 'Emergency Contact'}</p>
 <p className="text-xs font-bold text-red-700 dark:text-red-400">{permit.emergencyContact || '---'}</p>
 </div>
 <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col justify-center">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">{language === 'ar' ? 'صندوق إسعافات' : 'First Aid Kit'}</span>
 {permit.firstAidKitConfirmed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-neutral-300" />}
 </div>
 </div>
 <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col justify-center">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">{language === 'ar' ? 'معدات إنقاذ' : 'Rescue Equip'}</span>
 {permit.rescueEquipmentOnStandby ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-neutral-300" />}
 </div>
 </div>
 </div>
 </div>

 </div>

 {/* 3. Dynamic Controls Panel (Approval State Actions) */}
 <div id="dynamic-action-panel" className="border-t border-neutral-100 dark:border-neutral-800 pt-5 text-start">
 <div id="action-panel-banner" className="bg-gradient-to-r from-neutral-50 to-orange-500/5 dark:from-neutral-950 dark:to-orange-950/20 p-4 rounded-xl border border-orange-500/10 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-start">
 <div>
 <span id="role-context-badge" className="bg-orange-500 text-white font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase select-none">
 {language === 'ar' ? 'النظام التفاعلي للصلاحية الحالية' : `ACTIVE ROLE: ${currentRole}`}
 </span>
 <p className="text-xs font-bold text-neutral-800 dark:text-neutral-205 mt-1">
 {language === 'ar' 
 ? `جاري المراجعة بصفتك: ${currentRole} - ${permit.status}`
 : `Currently inspecting permit as specialized role: ${currentRole}`}
 </p>
 </div>
 <p className="text-[11px] text-neutral-500 leading-normal max-w-md">
 {language === 'ar'
 ? 'تتغير الخيارات والمدخلات الفنية أدناه ديناميكياً لتلائم مسؤوليات الإدارة المحدّدة في شريط المحاكاة العلوي.'
 : 'Action triggers, safety checklist confirmations and isolation forms below will adapt depending on your role.'}
 </p>
 </div>

 {/* Workflow Action Modules based on State */}
 
 {/* State A: DRAFT - Requester submits */}
 {permit.status === 'DRAFT' && (
 <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h5 className="text-xs font-extrabold text-neutral-450 uppercase">{language === 'ar' ? 'تأكيد تقديم طلب تصريح العمل' : 'Submit Draft for Department Clearance'}</h5>
 <p className="text-xs text-neutral-500 mt-1">
 {language === 'ar' 
 ? 'بتقديم هذا الطلب، سيتم إرساله للتحكم المبدئي للإدارات التشغيلية المكلّفة بالإنتاج وعزل الكهرباء LOTO.'
 : 'By submitting, this document will queue on Production stops and Electrical LOTO isolation desks.'}
 </p>
 </div>
 
 {canActAsRequester ? (
 <button
 id="submit-requester-btn"
 onClick={handleSubmitDraft}
 className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all focus:outline-none"
 >
 🚀 {language === 'ar' ? 'إرسال الطلب للاعتماد' : 'Submit for Approvals'}
 </button>
 ) : (
 <div className="text-xs text-neutral-400 italic">
 {language === 'ar' ? '⚠️ فقط "طالب التصريح" مخول بإرسال المسودة.' : '⚠️ Switch role to permit creator to submit.'}
 </div>
 )}
 </div>
 )}

 {/* State B: PENDING_DEPT - Department isolation */}
 {permit.status === 'PENDING_DEPT' && (
 <div className="space-y-4">
 
 {/* 1. Production Clearance Status */}
 {permit.productionRequired && (
 <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800/80 flex flex-col gap-3">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-900 pb-2 ">
 <div className="flex items-center gap-1.5 justify-start">
 <Construction className="w-4 h-4 text-indigo-500" />
 <h5 className="text-xs font-extrabold text-neutral-450 uppercase">{language === 'ar' ? 'إقرار إيقاف المغذيات وخلو خطوط التشغيل (إدارة الإنتاج والتشغيل)' : 'Production Stop & Material Clearance'}</h5>
 </div>
 {permit.productionApproval ? (
 <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
 {language === 'ar' ? `✓ معتمد من ${permit.productionApprover}` : `✓ Approved by ${permit.productionApprover}`}
 </span>
 ) : (
 <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
 {language === 'ar' ? '⏳ بانتظار إقرار الإنتاج' : '⏳ Awaiting Production Clearance'}
 </span>
 )}
 </div>

 {permit.productionApproval ? (
 <p className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-line text-start">
 <strong>{language === 'ar' ? 'ملاحظة الإنتاج: ' : 'Comment: '}</strong>{permit.productionComment}
 </p>
 ) : (
 canActAsProduction && (
 <div className="space-y-2 mt-1">
 <label className="block text-xs font-bold text-neutral-500 text-start">{language === 'ar' ? 'تقرير معاينة الموقع وخطة الإيقاف ميكانيكياً:' : 'Production comments & line isolation status:'}</label>
 <textarea
 id="prod-comment-text"
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 placeholder={language === 'ar' ? 'اكتب تفاصيل إيقاف السيور أو تفريغ المواد وصلاحية دخول العمال للموقع...' : 'e.g. Belt feed has been stopped and conveyor SC-03 isolated from control panels...'}
 className="w-full text-xs p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-orange-500"
 rows={2}
 />
 <div className="flex gap-2 justify-end">
 <button
 id="prod-reject-btn"
 onClick={() => handleProductionAction(false)}
 className="px-4 py-1.5 border border-red-200 hover:bg-red-50 text-red-650 font-bold rounded-lg text-xs cursor-pointer focus:outline-none"
 >
 ❌ {language === 'ar' ? 'رفض التصريح ومطالبة بتأجيل الصيانة' : 'Reject Draft'}
 </button>
 <button
 id="prod-approve-btn"
 onClick={() => handleProductionAction(true)}
 className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow focus:outline-none"
 >
 ✓ {language === 'ar' ? 'اعتماد وخلو الإنتاج' : 'Approve Clearance'}
 </button>
 </div>
 </div>
 )
 )}
 </div>
 )}

 {/* 2. Electrical Isolation & LOTO */}
 {permit.electricalRequired && (
 <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800/80 flex flex-col gap-3">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-900 pb-2 ">
 <div className="flex items-center gap-1.5 justify-start">
 <Lock className="w-4 h-4 text-purple-500" />
 <h5 className="text-xs font-extrabold text-neutral-450 uppercase">{language === 'ar' ? 'إجراء عزل الطاقة والـ LOTO وتأمين اللوحات (إدارة الكهرباء)' : 'Electrical Safety & Lockout/Tagout (LOTO)'}</h5>
 </div>
 {permit.electricalApproval ? (
 <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
 {language === 'ar' ? `✓ تم التوثيق (${permit.lotoDetails?.length || 0} نقطة)` : `✓ Verified (${permit.lotoDetails?.length || 0} Points)`}
 </span>
 ) : (
 <span className="bg-rose-50 text-rose-800 border border-rose-250 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
 {language === 'ar' ? '⏳ بانتظار عزل الطاقة LOTO' : '⏳ Awaiting Isolation Locks'}
 </span>
 )}
 </div>

 {permit.electricalApproval ? (
   <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 text-start">
  {permit.lotoDetails && permit.lotoDetails.length > 0 ? (
    <div className="space-y-2 mb-3">
    {permit.lotoDetails.map((l, idx) => (
      <div key={l.id} className="flex justify-between items-center bg-purple-50/50 dark:bg-purple-900/10 p-2 rounded border border-purple-100 dark:border-purple-900/30 text-xs text-neutral-700 dark:text-neutral-300">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">{idx + 1}</span>
          <span>📍 {l.isolationPoint}</span>
          <span className="text-neutral-400">|</span>
          <span>⚡ {l.energyType}</span>
          <span className="text-neutral-400">|</span>
          <span>🔒 {l.lockTagNumber}</span>
          {l.isolatorName && <><span className="text-neutral-400">|</span><span>👤 {l.isolatorName}</span></>}
        </div>
      </div>
    ))}
    </div>
  ) : (
    <p className="text-xs text-neutral-500 mb-3">{language === 'ar' ? 'لا يوجد نقاط LOTO مسجلة.' : 'No LOTO points registered.'}</p>
  )}
  <p className="text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800"><strong>{language === 'ar' ? 'تقرير الكهرباء: ' : 'Comment: '}</strong>{permit.electricalComment}</p>
  </div>
 ) : (
 canActAsElectrical && (
 <div className="space-y-3 mt-1 text-start">
 {permit.productionRequired && !permit.productionApproval && (
 <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-3 rounded-lg text-xs font-bold text-start flex items-center gap-2 ">
 <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
 <span className="text-amber-700 dark:text-amber-300">
 {language === 'ar' 
 ? 'تنبيه هام: موافقة واعتماد إدارة الإنتاج إلزامية أولاً قبل تفعيل العزل الكهربائي وتطبيق LOTO.' 
 : 'Important Notice: Production department approval is strictly mandatory before starting electrical isolation and LOTO.'}
 </span>
 </div>
 )}

   <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg">
  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
  <input
  disabled={permit.productionRequired && !permit.productionApproval}
  placeholder={language === 'ar' ? 'نقطة العزل' : 'Isolation Point'}
  value={lotoPt}
  onChange={e => setLotoPt(e.target.value)}
  className="text-xs p-2 border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
  />
  <select
  disabled={permit.productionRequired && !permit.productionApproval}
  value={lotoEnergy}
  onChange={e => setLotoEnergy(e.target.value as any)}
  className="text-xs p-2 border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
  >
  <option value="ELECTRICAL">{language === 'ar' ? '⚡ كهربائي' : '⚡ Electrical'}</option>
  <option value="MECHANICAL">{language === 'ar' ? '⚙️ ميكانيكي' : '⚙️ Mechanical'}</option>
  <option value="HYDRAULIC">{language === 'ar' ? '💧 هيدروليكي' : '💧 Hydraulic'}</option>
  <option value="PNEUMATIC">{language === 'ar' ? '💨 نيوماتيكي' : '💨 Pneumatic'}</option>
  <option value="OTHER">{language === 'ar' ? '🔧 أخرى' : '🔧 Other'}</option>
  </select>
  <input
  disabled={permit.productionRequired && !permit.productionApproval}
  placeholder={language === 'ar' ? 'رقم القفل/البطاقة' : 'Lock/Tag #'}
  value={lotoTag}
  onChange={e => setLotoTag(e.target.value)}
  className="text-xs p-2 border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
  />
  <input
  disabled={permit.productionRequired && !permit.productionApproval}
  placeholder={language === 'ar' ? 'اسم المنفذ' : 'Isolator Name'}
  value={lotoIsolator}
  onChange={e => setLotoIsolator(e.target.value)}
  className="text-xs p-2 border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
  />
  <button
  type="button"
  disabled={permit.productionRequired && !permit.productionApproval}
  onClick={addLoto}
  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded p-2 text-xs font-bold transition-colors"
  >
  {language === 'ar' ? '+ إضافة' : '+ Add LOTO'}
  </button>
  </div>

  {lotoRequiresDbb && (
  <label className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded p-2 mb-2 cursor-pointer text-xs">
  <input type="checkbox" checked={lotoDbb} onChange={e => setLotoDbb(e.target.checked)} className="w-3.5 h-3.5" />
  <span className="font-bold text-amber-800 dark:text-amber-400">
  {language === 'ar'
   ? 'تم تنفيذ الحجب المزدوج والتنفيس (Double Block & Bleed) — تم فتح نقطة تنفيس بين نقطتي العزل وتأكيد انعدام الضغط المتبقي'
   : 'Double Block & Bleed performed — a vent point between the two isolation points confirms zero residual pressure'}
  </span>
  </label>
  )}

  {lotoDetails.length > 0 && (
  <div className="space-y-1.5 mt-2 border-t border-neutral-100 dark:border-neutral-800 pt-2">
  {lotoDetails.map((l, idx) => (
  <div key={l.id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800 p-2 rounded border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300">
  <div className="flex items-center gap-3">
  <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">{idx + 1}</span>
  <span>📍 {l.isolationPoint}</span>
  <span className="text-neutral-400">|</span>
  <span>⚡ {l.energyType}</span>
  <span className="text-neutral-400">|</span>
  <span>🔒 {l.lockTagNumber}</span>
  {l.isolatorName && <><span className="text-neutral-400">|</span><span>👤 {l.isolatorName}</span></>}
  {(l.energyType === 'HYDRAULIC' || l.energyType === 'PNEUMATIC' || permit.type === 'LINE_BREAKING') && (
  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${l.doubleBlockAndBleedVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
  {l.doubleBlockAndBleedVerified
   ? (language === 'ar' ? '✓ حجب مزدوج وتنفيس' : '✓ Double Block & Bleed')
   : (language === 'ar' ? '⚠ بدون تنفيس' : '⚠ No Bleed Verified')}
  </span>
  )}
  </div>
  <button type="button" onClick={() => setLotoDetails(prev => prev.filter(x => x.id !== l.id))} className="text-red-500 hover:text-red-700 p-1">
  <Trash2 className="w-3.5 h-3.5" />
  </button>
  </div>
  ))}
  </div>
  )}
  </div>

 <div className="space-y-1">
 <label className="block text-[11px] font-bold text-neutral-500">{language === 'ar' ? 'تقرير وخطوات عزل مصادر التيار عن المغذيات:' : 'Lock remarks & terminal switches isolated:'}</label>
 <textarea
 id="elec-comment-text"
 disabled={permit.productionRequired && !permit.productionApproval}
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 placeholder={language === 'ar' ? 'اكتب تفاصيل سحب المفاتيح وقطع التغذية وتجربة الضغط العكسي للموتور...' : 'e.g. Isolated MCC motor breaker and chained locking chain onto physical panel block...'}
 className={`w-full text-xs p-2.5 bg-white dark:bg-neutral-900 border rounded-lg focus:outline-none focus:border-orange-500 ${
 permit.productionRequired && !permit.productionApproval
 ? 'border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
 : 'border-neutral-200 dark:border-neutral-800'
 }`}
 rows={2}
 />
 </div>

 <div className="flex gap-2 justify-end">
 <button
 id="elec-reject-btn"
 disabled={permit.productionRequired && !permit.productionApproval}
 onClick={() => handleElectricalAction(false)}
 className={`px-4 py-1.5 border font-bold rounded-lg text-xs cursor-pointer focus:outline-none ${
 permit.productionRequired && !permit.productionApproval
 ? 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
 : 'border-red-200 hover:bg-red-50 text-red-650'
 }`}
 >
 ❌ {language === 'ar' ? 'رفض وإصدار مخالفة عزل' : 'Refuse Installation'}
 </button>
 <button
 id="elec-approve-btn"
 disabled={permit.productionRequired && !permit.productionApproval}
 onClick={() => handleElectricalAction(true)}
 className={`px-4 py-1.5 font-bold rounded-lg text-xs cursor-pointer shadow focus:outline-none transition-all ${
 permit.productionRequired && !permit.productionApproval
 ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-neutral-300 dark:border-neutral-700'
 : 'bg-purple-600 hover:bg-purple-500 text-white'
 }`}
 >
 🔑 {language === 'ar' ? 'إقرار العزل وتأكيد القفل' : 'Apply Isolation Lock'}
 </button>
 </div>
 </div>
 )
 )}

 </div>
 )}

 {!canActAsProduction && !canActAsElectrical && (
 <p className="text-center text-xs text-neutral-400 italic">
 {language === 'ar' ? '🔒 يجب تبديل الدور أو امتلاك صلاحيات الإنتاج/الكهرباء لاعتماد العزل والخطوات التشغيلية.' : '🔒 Switch roles or obtain Production/Electrical approvals to process clearance.'}
 </p>
 )}

 </div>
 )}

 {/* State C: HSE_REVIEW - Safety Specialist signs */}
 {permit.status === 'HSE_REVIEW' && (
 <div className="space-y-4">

 {/* Expired worker competency — hard block, no override (unlike SIMOPS, this cannot be acknowledged away) */}
 {expiredCompetencyWorkers.length > 0 && (
 <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 text-start space-y-2">
 <div className="flex items-center gap-1.5 justify-start text-red-600 dark:text-red-400">
 <ShieldAlert className="w-5 h-5" />
 <h5 className="text-xs font-extrabold uppercase">
 {language === 'ar' ? 'شهادات كفاءة منتهية — لا يمكن إصدار التصريح' : 'Expired Competency — Permit Cannot Be Issued'}
 </h5>
 </div>
 <p className="text-xs text-neutral-700 dark:text-neutral-300">
 {language === 'ar'
 ? 'العمال التاليون بدون سجل تدريب ساري لهذا النوع من العمل. أزلهم من قائمة العمال أو حدّث سجلات تدريبهم في وحدة التدريب قبل المتابعة.'
 : 'These workers have no valid, unexpired training record for this permit type. Remove them from the worker list, or update their training records in the Training module, before proceeding.'}
 </p>
 <ul className="text-xs list-disc ps-4 text-red-700 dark:text-red-400 font-bold">
 {expiredCompetencyWorkers.map(w => <li key={w.id}>{w.name}</li>)}
 </ul>
 </div>
 )}

 {/* SIMOPS spatial conflict — blocks activation until acknowledged */}
 {simopsConflicts.length > 0 && (
 <div className="bg-red-500/5 border-2 border-red-500/30 rounded-xl p-4 text-start space-y-3">
 <div className="flex items-center gap-1.5 justify-start text-red-600 dark:text-red-400">
 <AlertTriangle className="w-5 h-5" />
 <h5 className="text-xs font-extrabold uppercase">
 {language === 'ar' ? 'تعارض SIMOPS: عمليات متزامنة في نفس الموقع' : 'SIMOPS Conflict: Concurrent Operations at This Location'}
 </h5>
 </div>
 <div className="space-y-1.5">
 {simopsConflicts.map(c => (
 <div key={c.id} className="text-xs bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2 flex items-center justify-between">
 <span className="font-mono font-bold text-neutral-600 dark:text-neutral-300">{c.id}</span>
 <span className="text-neutral-700 dark:text-neutral-300">{c.title}</span>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">{c.status}</span>
 </div>
 ))}
 </div>
 <label className="flex items-start gap-2 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300">
 <input
 type="checkbox"
 checked={conflictAcknowledged}
 onChange={(e) => setConflictAcknowledged(e.target.checked)}
 className="mt-0.5 w-4 h-4"
 />
 <span>
 {language === 'ar'
 ? 'راجعت التصاريح المتعارضة أعلاه وأؤكد أن التدابير الوقائية المشتركة (SIMOPS) كافية للسماح بالعمل المتزامن.'
 : 'I have reviewed the conflicting permits above and confirm combined SIMOPS controls are adequate for concurrent work.'}
 </span>
 </label>
 </div>
 )}

 {/* Confined space Entry Gas test if required */}
 {permit.gasTestRequired && (
 <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-start space-y-3">
 <div className="flex items-center gap-1.5 justify-start border-b border-amber-500/10 pb-2 ">
 <Gauge className="w-5 h-5 text-amber-500" />
 <h5 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase">
 {language === 'ar' ? 'جهاز قياس وتحليل غازات الغلاف الجوي المحيط' : 'Confined space gas assessment & analysis'}
 </h5>
 </div>
 
 {permit.gasTestPassed ? (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-neutral-900 border border-emerald-250 p-3 rounded-lg text-center font-mono">
 <div className="text-emerald-700">
 <p className="text-[10px] text-neutral-400 uppercase font-sans font-bold">{language === 'ar' ? 'غاز الأكسجين O₂ (OXYGEN)' : 'O2 (19.5% - 23.5%)'}</p>
 <p className="text-lg font-bold">{permit.gasO2Level}%</p>
 <p className="text-[9px] font-bold">PASS</p>
 </div>
 <div className="text-emerald-700">
 <p className="text-[10px] text-neutral-400 uppercase font-sans font-bold">{language === 'ar' ? 'غاز المتفجرات LEL' : 'LEL (< 10%)'}</p>
 <p className="text-lg font-bold">{permit.gasLELLevel}%</p>
 <p className="text-[9px] font-bold">PASS</p>
 </div>
 <div className="text-emerald-700">
 <p className="text-[10px] text-neutral-400 uppercase font-sans font-bold">{language === 'ar' ? 'أول أكسيد الكربون CO' : 'CO (< 35 ppm)'}</p>
 <p className="text-lg font-bold">{permit.gasCOLevel}ppm</p>
 <p className="text-[9px] font-bold">PASS</p>
 </div>
 <div className="text-emerald-700">
 <p className="text-[10px] text-neutral-400 uppercase font-sans font-bold">{language === 'ar' ? 'كبريتيد الهيدروجين H₂S' : 'H2S (< 10 ppm)'}</p>
 <p className="text-lg font-bold">{permit.gasH2SLevel ?? 0}ppm</p>
 <p className="text-[9px] font-bold">PASS</p>
 </div>
 <p className="col-span-2 md:col-span-4 text-xs font-semibold text-neutral-500 dark:text-emerald-400 border-t border-neutral-100 pt-1 text-start font-sans">
 {language === 'ar' ? `المفتش: ${permit.gasTester} بتاريخ ${permit.gasTestedAt}` : `Inspector: ${permit.gasTester} @ ${permit.gasTestedAt}`}
 </p>
 </div>
 ) : (
 canActAsSafety ? (
 <div className="space-y-3">
 <p className="text-xs text-neutral-500">
 {language === 'ar' 
 ? 'كعنصر من إجراءات الأماكن المغلقة، قم بقياس مستويات الأكسجين (المستهدف ١٩.٥-٢٣.٥٪)، الغاز المتفجر LEL (المستهدف أصغر من ١٠٪) والكربون CO (أصغر من ٣٥ جزء بالمليون) لتأمين بيئة التنفس.' 
 : 'Verify that safe gas levels have been established before authorizing workforce entry.'}
 </p>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">O₂ Level (%):</label>
 <input
 id="o2-gas-input"
 type="number"
 step="0.1"
 value={o2}
 onChange={(e) => setO2(parseFloat(e.target.value) || 0)}
 className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-250 rounded-lg font-mono text-center"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">LEL Level (%):</label>
 <input
 id="lel-gas-input"
 type="number"
 value={lel}
 onChange={(e) => setLel(parseInt(e.target.value) || 0)}
 className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-250 rounded-lg font-mono text-center"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">CO Level (ppm):</label>
 <input
 id="co-gas-input"
 type="number"
 value={co}
 onChange={(e) => setCo(parseInt(e.target.value) || 0)}
 className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-250 rounded-lg font-mono text-center"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">H₂S Level (ppm):</label>
 <input
 id="h2s-gas-input"
 type="number"
 value={h2s}
 onChange={(e) => setH2s(parseInt(e.target.value) || 0)}
 className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-250 rounded-lg font-mono text-center"
 />
 </div>
 </div>
 <div className="flex justify-end">
 <button
 id="gas-test-action-btn"
 onClick={handlePerformGasTest}
 className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs cursor-pointer focus:outline-none"
 >
 🧪 {language === 'ar' ? 'إجراء فحص الهواء بالسينسور' : 'Perform Safe Gas Test'}
 </button>
 </div>
 </div>
 ) : (
 <div className="text-center text-xs p-3 border border-dashed border-amber-300 text-amber-800 rounded bg-amber-50/20">
 {language === 'ar' ? '⏳ بانتظار تبديل الدور أو امتلاك صلاحيات مسؤول السلامة (HSE) لإتمام قراءات الغاز.' : '⏳ Awaiting HSE specialist role or permissions to register Gas readings.'}
 </div>
 )
 )}

 </div>
 )}

 {/* General Precautions Checkboxes for HSE to sign */}
 {canActAsSafety && (
 <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-4 rounded-xl text-start">
 <h5 className="text-xs font-extrabold text-neutral-500 mb-2">{language === 'ar' ? 'التثبت الميداني من التدابير الوقائية:' : 'Verify Precautionary Safeguards Checklist:'}</h5>
 <div className="flex flex-col gap-2 mt-2">
 <label className="flex items-start gap-2.5 cursor-pointer justify-start">
 <input
 id="pp-chk-loto"
 type="checkbox"
 checked={!!checkedPrecautions['loto_chk']}
 onChange={() => togglePrecaution('loto_chk')}
 className="mt-1 accent-orange-650 cursor-pointer"
 />
 <span className="text-xs text-neutral-700 dark:text-neutral-300">
 {language === 'ar' ? 'عزل كلي تام وتأكيد إغلاق أقفال LOTO واللوحات معزولة فيزيائياً' : 'Physical electrical LOTO locks are securely in place'}
 </span>
 </label>
 <label className="flex items-start gap-2.5 cursor-pointer justify-start">
 <input
 id="pp-chk-ppe"
 type="checkbox"
 checked={!!checkedPrecautions['ppe_chk']}
 onChange={() => togglePrecaution('ppe_chk')}
 className="mt-1 accent-orange-650 cursor-pointer"
 />
 <span className="text-xs text-neutral-700 dark:text-neutral-300">
 {language === 'ar' ? 'التحقق من ارتداء طاقم العمل لمعدات الوقاية المحددة لخطورة العمل لسلامتهم' : 'All workers strictly dressed in mandatory task PPEs'}
 </span>
 </label>
 <label className="flex items-start gap-2.5 cursor-pointer justify-start">
 <input
 id="pp-chk-ext"
 type="checkbox"
 checked={!!checkedPrecautions['fire_ext']}
 onChange={() => togglePrecaution('fire_ext')}
 className="mt-1 accent-orange-650 cursor-pointer"
 />
 <span className="text-xs text-neutral-700 dark:text-neutral-300">
 {language === 'ar' ? 'تأمين معدات الإطفاء أو التهوية الكافية ميكانيكياً بالمحيط لمجابهة الحريق' : 'Fire extinguishers and support ventilation are deployed'}
 </span>
 </label>
 </div>
 </div>
 )}

 {/* HSE Comment & Action */}
 {canActAsSafety ? (
 <div className="space-y-4 mt-2 text-start">
 
 {permit.supervisorVerified && (
 <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-start flex items-center gap-2 shadow-inner">
 <Award className="w-5 h-5 text-emerald-600 shrink-0" />
 <div>
 <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-450 leading-tight">
 {language === 'ar' ? `✓ معتمد ميدانياً بواسطة مشرف السلامة: ${permit.supervisorVerifier}` : `✓ On-site checks verified by HSE Supervisor: ${permit.supervisorVerifier}`}
 </p>
 <p className="text-[10px] text-neutral-500 mt-0.5">
 {language === 'ar' ? `توجيهات المشرف: ${permit.supervisorComment}` : `Supervisor remarks: ${permit.supervisorComment}`}
 </p>
 </div>
 </div>
 )}

 <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-3 ">
 <div className="flex items-center gap-1.5 justify-start">
 <ShieldAlert className="w-4 h-4 text-orange-500" />
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
 {language === 'ar' 
 ? `الدخول الحالي: @${currentUser?.username} (${currentUser?.roleAr})` 
 : `Current Account: @${currentUser?.username} (${currentUser?.roleEn})`}
 </span>
 </div>
 </div>

 <label className="block text-xs font-bold text-neutral-500">
 {language === 'ar' ? 'توجيهات السلامة الميدانية والمصادقة:' : 'General safety directives & release remarks:'}
 </label>
 <textarea
 id="hse-comment-box"
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 placeholder={language === 'ar' ? 'اكتب شروط الاستخدام الميداني، مثل: تفقد الحزام الدائم، نسبة الإضاءة، طفاية البودرة، أجهزة المراقبة الأوتوماتيكية...' : 'e.g. Approved. Standby watcher must be deployed at the entry. Lifelines on. Keep detector live...'}
 className="w-full text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-orange-500"
 rows={2}
 />
 
 <div className="flex gap-2 justify-end">
 <button
 id="hse-reject-btn"
 onClick={() => handleHseAction(false)}
 className="px-5 py-2 hover:bg-red-50 text-red-650 border border-red-200 font-bold rounded-lg text-xs cursor-pointer focus:outline-none"
 >
 ❌ {language === 'ar' ? 'رفض الطلب بالكامل' : 'Formal HSE Reject'}
 </button>

 <button
 id="hse-issue-btn"
 onClick={handleSupervisorVerify}
 className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-550 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md focus:outline-none flex items-center justify-center gap-1"
 >
 <UserCheck className="w-4 h-4 shrink-0" />
 <span>{language === 'ar' ? '✓ تأكيد المعاينة وإصدار تصريح العمل' : '✓ Confirm On-Site Checks & Issue Permit'}</span>
 </button>
 </div>
 </div>
 ) : (
 <div className="text-center text-xs p-4 border border-dashed border-neutral-200 text-neutral-450 bg-neutral-50 rounded-lg">
 {language === 'ar' 
 ? '⚠️ يرجى تبديل الدور أو حساب الدخول إلى مسؤول سلامة (مشرف سيفيتي) لاعتماد التدابير الوقائية وتوقيع العبور.' 
 : '⚠️ Technical compliance authority needed. Please login as HSE supervisor to sign checks.'}
 </div>
 )}

 </div>
 )}

 {/* State D: ACTIVE - Requester closes work when completed */}
 {permit.status === 'ACTIVE' && (
 <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-start space-y-3">
 <div className="flex items-center gap-1.5 justify-start ">
 <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0" />
 <h5 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase">
 {language === 'ar' ? 'التصريح ساري لعمل الصيانة بالتنسيق الميداني' : 'Permit is Active - Operation In Progress'}
 </h5>
 </div>
 
 <p className="text-xs text-neutral-600 dark:text-neutral-400">
 {language === 'ar'
 ? 'يخضع موقع الصيانة لمراقبة السلامة الدائمة. عند الانتهاء من العمل وتأمين المعدات، يجب على "طالب التصريح" تقديم طلب إغلاق التصريح للمراجعة وإعادة قفل الكهرباء.'
 : 'Work crew is performing active task on-site. Once completed, cleanup the location, fetch coworkers, and request final license closure.'}
 </p>

 {isGasReTestRequired ? (
 <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 text-start space-y-3">
 <div className="flex items-center gap-1.5 justify-start text-red-600 dark:text-red-400">
 <Gauge className="w-5 h-5 animate-pulse" />
 <h5 className="text-xs font-extrabold uppercase">
 {language === 'ar' ? 'فحص غازات جديد مطلوب — كل الإجراءات الأخرى معلّقة' : 'Fresh Gas Test Required — All Other Actions Locked'}
 </h5>
 </div>
 <p className="text-xs text-neutral-700 dark:text-neutral-300">
 {language === 'ar'
 ? `مرّ أكثر من ساعتين منذ آخر فحص غازات (${permit.gasTestedAt}). لا يمكن متابعة العمل، تسليم الوردية، التمديد، أو طلب الإغلاق قبل إجراء فحص جديد يؤكد سلامة الغلاف الجوي.`
 : `More than 2 hours have passed since the last gas test (${permit.gasTestedAt}). Work continuation, shift handover, extension, and closure are all locked until a fresh atmospheric test confirms it's still safe.`}
 </p>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
 <div>
 <label className="block text-[10px] font-bold text-neutral-500 mb-1">O₂ (%):</label>
 <input type="number" step="0.1" value={o2} onChange={(e) => setO2(Number(e.target.value))} className="w-full text-xs p-2 rounded border focus:outline-none" />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-neutral-500 mb-1">LEL (%):</label>
 <input type="number" step="0.1" value={lel} onChange={(e) => setLel(Number(e.target.value))} className="w-full text-xs p-2 rounded border focus:outline-none" />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-neutral-500 mb-1">CO (ppm):</label>
 <input type="number" value={co} onChange={(e) => setCo(Number(e.target.value))} className="w-full text-xs p-2 rounded border focus:outline-none" />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-neutral-500 mb-1">H₂S (ppm):</label>
 <input type="number" value={h2s} onChange={(e) => setH2s(Number(e.target.value))} className="w-full text-xs p-2 rounded border focus:outline-none" />
 </div>
 </div>
 <button
 onClick={handlePerformGasTest}
 className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md focus:outline-none"
 >
 💨 {language === 'ar' ? 'تسجيل فحص الغازات الجديد' : 'Record New Gas Test'}
 </button>
 </div>
 ) : canActAsRequester ? (
 <div className="space-y-4 pt-2 border-t border-emerald-500/10">
 {/* 1. NEBOSH Shift Handover */}
 <div className="bg-white dark:bg-neutral-900 border border-neutral-200 rounded p-3">
 <h6 className="text-[11px] font-bold text-neutral-600 mb-2 flex items-center justify-start gap-1 ">
 <Users className="w-3.5 h-3.5 text-blue-500" />
 {language === 'ar' ? 'تسليم الوردية الميدانية (Shift Handover)' : 'Shift Handover Notes'}
 </h6>
 <textarea
 value={handoverNotes}
 onChange={(e) => setHandoverNotes(e.target.value)}
 placeholder={language === 'ar' ? 'ملاحظات المشرف المغادر للمشرف المستلم...' : 'Outgoing supervisor notes...'}
 className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 rounded focus:outline-none mb-2"
 rows={1}
 />
 <div className="flex items-center justify-between ">
 <label className="flex items-center justify-start gap-1 cursor-pointer ">
 <input 
 type="checkbox" 
 checked={handoverSignoff}
 onChange={(e) => setHandoverSignoff(e.target.checked)}
 className="w-3.5 h-3.5 text-emerald-600 rounded border-gray-300"
 />
 <span className="text-[10px] text-neutral-600">{language === 'ar' ? 'توقيع وتسليم' : 'Sign-off handover'}</span>
 </label>
 <button onClick={handleShiftHandover} className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-[10px] font-bold rounded">
 {language === 'ar' ? 'توثيق التسليم 🔄' : 'Record Handover 🔄'}
 </button>
 </div>
 </div>

 {/* 2. NEBOSH Suspension */}
 <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded p-3 text-start">
 <h6 className="text-[11px] font-bold text-orange-700 mb-2">{language === 'ar' ? 'تعليق التصريح للطوارئ / التوقف' : 'Suspend Permit (Emergency/Break)'}</h6>
 <div className="flex gap-2 ">
 <input 
 type="text" 
 value={commentText} 
 onChange={(e) => setCommentText(e.target.value)} 
 placeholder={language === 'ar' ? 'سبب التعليق...' : 'Suspension reason...'} 
 className="flex-1 text-xs p-2 rounded border focus:outline-none"
 />
 <button onClick={handleSuspendPermit} className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded text-xs">
 {language === 'ar' ? 'تعليق ⏸️' : 'Suspend ⏸️'}
 </button>
 </div>
 </div>

 {/* 3. NEBOSH Permit Extension */}
 <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 rounded p-3 text-start">
 <h6 className="text-[11px] font-bold text-sky-700 mb-2">{language === 'ar' ? 'طلب تمديد الوقت' : 'Request Extension'}</h6>
 <div className="flex gap-2 items-center ">
 <input 
 type="number" 
 value={extensionHours} 
 onChange={(e) => setExtensionHours(Number(e.target.value))} 
 className="w-16 text-xs p-1.5 border rounded text-center" 
 min="1" max="12"
 />
 <span className="text-[10px] text-neutral-500">{language === 'ar' ? 'ساعات' : 'hours'}</span>
 <button onClick={handleExtendPermit} className="px-3 py-1.5 bg-sky-600 text-white text-[10px] font-bold rounded">
 {language === 'ar' ? 'طلب تمديد ⏱️' : 'Extend ⏱️'}
 </button>
 </div>
 </div>

 {/* Post-work fire watch — NFPA 51B / OSHA 1910.252 */}
 {permit.type === 'HOT' && (
 <div className="bg-orange-50/60 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-900/30 rounded p-3 text-start">
 <h6 className="text-[11px] font-bold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-1">
 <Flame className="w-3.5 h-3.5" />
 {language === 'ar' ? 'مراقبة الحريق بعد انتهاء العمل (Fire Watch)' : 'Post-Work Fire Watch'}
 </h6>
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <span className="text-xs text-neutral-600 dark:text-neutral-400">
 {language === 'ar' ? 'مدة المراقبة (دقائق، 30 كحد أدنى):' : 'Watch duration (minutes, 30 min minimum):'}
 </span>
 <input
 type="number" min={30} value={fireWatchMinutes}
 onChange={e => setFireWatchMinutes(Math.max(30, Number(e.target.value)))}
 className="w-20 text-xs p-1.5 border rounded text-center"
 />
 </div>
 <label className="flex items-center gap-2 text-xs cursor-pointer">
 <input type="checkbox" checked={fireWatchConfirmed} onChange={e => setFireWatchConfirmed(e.target.checked)} className="w-3.5 h-3.5" />
 <span className="font-semibold text-orange-800 dark:text-orange-300">
 {language === 'ar'
 ? `تم إبقاء مراقب حريق في الموقع لمدة ${fireWatchMinutes} دقيقة بعد توقف اللحام/القطع، ولم يُلاحظ أي اشتعال متأخر`
 : `A fire watch remained on-site for ${fireWatchMinutes} minutes after welding/cutting stopped, with no delayed ignition observed`}
 </span>
 </label>
 </div>
 )}

 {/* LOTO lock removal — individually attributed per OSHA 1910.147 */}
 {permit.lotoRequired && lotoDetails.length > 0 && (
 <div className="bg-purple-50/40 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-900/30 rounded p-3 text-start">
 <h6 className="text-[11px] font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-1">
 <Lock className="w-3.5 h-3.5" />
 {language === 'ar' ? 'إزالة أقفال العزل (LOTO) — يجب توثيق كل قفل على حدة' : 'LOTO Lock Removal — each isolation lock must be cleared individually'}
 </h6>
 <div className="space-y-1.5">
 {lotoDetails.map((l) => (
 <div key={l.id} className="flex flex-wrap items-center gap-2 bg-white dark:bg-neutral-900 border border-purple-100 dark:border-purple-900/30 rounded p-2 text-xs">
 <span className="font-mono font-bold text-neutral-600 dark:text-neutral-300 min-w-[90px]">{l.lockTagNumber}</span>
 <span className="text-neutral-500 flex-1">{l.isolationPoint}</span>
 {l.isRemoved ? (
 <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
 ✓ {language === 'ar' ? `أُزيل بواسطة ${l.removerName}` : `Removed by ${l.removerName}`}
 </span>
 ) : (
 <input
 type="text"
 placeholder={language === 'ar' ? 'اسم من أزال القفل...' : 'Name of lock owner removing it...'}
 className="text-xs p-1.5 border rounded w-48 focus:outline-none"
 onBlur={(e) => markLotoRemoved(l.id, e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') markLotoRemoved(l.id, (e.target as HTMLInputElement).value); }}
 />
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* 4. NEBOSH Handback Checklist & Closure */}
 <div className="bg-white dark:bg-neutral-900 border border-neutral-200 rounded p-3 text-start">
 <h6 className="text-[11px] font-bold text-neutral-600 mb-2">{language === 'ar' ? 'القائمة المرجعية لتسليم وإغلاق الموقع (Hand-back Checklist)' : 'Closure Hand-back Checklist'}</h6>
 <div className="grid grid-cols-1 gap-2 mb-3">
 {HANDBACK_CHECKLIST.map(item => (
 <label key={item.id} className="flex items-center justify-start gap-2 cursor-pointer p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded">
 <input 
 type="checkbox" 
 checked={!!handbackChecks[item.id]} 
 onChange={(e) => setHandbackChecks({...handbackChecks, [item.id]: e.target.checked})} 
 className="w-3.5 h-3.5 text-emerald-600 rounded border-gray-300"
 />
 <span className="text-[11px] text-neutral-600 font-medium select-none">{language === 'ar' ? item.labelAr : item.labelEn}</span>
 </label>
 ))}
 </div>

 <textarea
 id="close-req-comment"
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 placeholder={language === 'ar' ? 'اكتب بياناً نهائياً لتأكيد الإغلاق...' : 'Final closure remarks...'}
 className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 rounded focus:outline-none focus:border-emerald-500 mb-2"
 rows={2}
 />
 <div className="flex justify-end">
 <button
 id="request-close-action-btn"
 onClick={handleRequestClosure}
 style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none' }}
 className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-xs cursor-pointer focus:outline-none shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
 >
 🧹 {language === 'ar' ? 'إرسال طلب إغلاق التصريح ميكانيكياً' : 'Submit Closure Request'}
 </button>
 </div>
 </div>
 </div>
 ) : (
 <p className="text-xs text-neutral-450 italic pt-1 border-t border-emerald-500/10">
 {language === 'ar' ? '⏳ غيّم صلاحيتك أو امتلك صلاحيات طالب التصريح لإدارة التصريح أو طلب الإغلاق.' : '⏳ Switch role or obtain permit creator permissions to manage permit.'}
 </p>
 )}
 </div>
 )}

 {/* NEBOSH State: SUSPENDED - Permit halted temporarily */}
 {permit.status === 'SUSPENDED' && (
 <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-start space-y-3">
 <div className="flex items-center gap-1.5 justify-start ">
 <span className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0 animate-pulse" />
 <h5 className="text-xs font-extrabold text-orange-800 dark:text-orange-400 uppercase">
 {language === 'ar' ? '⚠️ التصريح معلق مؤقتاً (مخاطر طارئة أو توقف)' : '⚠️ Permit Suspended (Emergency / Break)'}
 </h5>
 </div>
 
 <p className="text-xs text-neutral-600 dark:text-neutral-400">
 {language === 'ar'
 ? 'تم تعليق العمل بهذا التصريح. لا يمكن استئناف العمل إلا بعد توقيع مسؤول السلامة (HSE) وإجراء فحص غازات جديد.'
 : 'Work is halted. Cannot resume without HSE sign-off and a fresh gas test reading.'}
 </p>

 {canActAsSafety ? (
 <div className="space-y-4 pt-2 border-t border-orange-500/20 text-start">
 <label className="block text-xs font-bold text-neutral-500">{language === 'ar' ? 'تقرير إعادة التفعيل وفحص الغازات:' : 'Reinstatement & Gas Check Remarks:'}</label>
 <textarea
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 placeholder={language === 'ar' ? 'تم إعادة فحص الموقع والموافقة على استئناف العمل...' : 'Site inspected, gas clear, work may resume...'}
 className="w-full text-xs p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 rounded focus:outline-none focus:border-orange-500"
 rows={2}
 />
 <div className="flex justify-end">
 <button
 onClick={handleReinstatePermit}
 className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md focus:outline-none flex items-center justify-center gap-1"
 >
 <ShieldCheck className="w-4 h-4 shrink-0" />
 <span>{language === 'ar' ? 'إعادة تفعيل التصريح ▶️' : 'Reinstate Permit ▶️'}</span>
 </button>
 </div>
 </div>
 ) : (
 <p className="text-xs text-neutral-450 italic pt-1 border-t border-orange-500/10">
 {language === 'ar' ? '⏳ بانتظار مسؤول السلامة (HSE) لإعادة التفعيل.' : '⏳ Awaiting HSE to reinstate the permit.'}
 </p>
 )}
 </div>
 )}

 {/* State E: PENDING_CLOSE - HSE performs cleanup audit */}
 {permit.status === 'PENDING_CLOSE' && (
 <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-start space-y-3">
 <div className="flex items-center gap-1.5 justify-start ">
 <span className="w-2.5 h-2.5 bg-purple-500 rounded-full shrink-0" />
 <h5 className="text-xs font-extrabold text-purple-700 dark:text-purple-400">
 {language === 'ar' ? 'طلب فحص النظافة بعد الصيانة (بانتظار المراجعة)' : 'Pending Site Cleanup & Permanent Closure Audit'}
 </h5>
 </div>
 
 <p className="text-xs text-neutral-600 dark:text-neutral-400">
 {language === 'ar'
 ? 'قدم طالب التصريح إقراراً بانتهاء الصيانة وخروج العمال ومعالجة مخلفات اللحام أو القطع. يجب على مسؤول السلامة (HSE) مراجعة محيط المصنع وتأكيد الإغلاق والأرشفة.'
 : 'Requester stated work crew cleared, tools removed. HSE officer must audit the physical environment and register permanent closure.'}
 </p>

 {canActAsSafety ? (
 <div className="space-y-4 pt-2 border-t border-purple-500/20 text-start">
 
 {permit.supervisorComment && (
 <div className="bg-purple-100/40 dark:bg-purple-955/20 border border-purple-200 rounded-lg p-3 text-start text-xs">
 <p className="font-bold text-purple-800 dark:text-purple-400">
 {language === 'ar' ? '✓ تقرير المعاينة الميدانية للمشرف:' : '✓ Supervisor Housekeeping confirmation report:'}
 </p>
 <p className="text-[10px] text-neutral-500 mt-1">
 {permit.supervisorComment}
 </p>
 </div>
 )}

 <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-3 ">
 <div className="flex items-center gap-1.5 justify-start">
 <ShieldAlert className="w-4 h-4 text-orange-500" />
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
 {language === 'ar' 
 ? `الدخول الحالي: @${currentUser?.username} (${currentUser?.roleAr})` 
 : `Current Account: @${currentUser?.username} (${currentUser?.roleEn})`}
 </span>
 </div>
 </div>

 <label className="block text-xs font-bold text-neutral-500">{language === 'ar' ? 'تقرير التفتيش الميداني وصندوق السلامة:' : 'HSE auditor permanent close remarks:'}</label>
 <textarea
 id="final-close-comment-box"
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 placeholder={language === 'ar' ? 'ملاحظات المعاينة الميدانية لإغلاق تصاريح العمل وأرشفتها بنجاح...' : 'e.g. Audit complete. No hazard remains on work site. Safety locks returned. Power authorized to start...'}
 className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:border-purple-505"
 rows={2}
 />
 
 <div className="flex justify-end">
 <button
 id="final-archive-close-btn"
 onClick={handleSupervisorCloseVerify}
 className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow focus:outline-none flex items-center gap-1.5"
 >
 <UserCheck className="w-4 h-4 shrink-0" />
 <span>{language === 'ar' ? '✓ تسجيل المعاينة وإغلاق وأرشفة التصريح نهائياً' : '✓ Confirm Site Cleanup & Close Permanently'}</span>
 </button>
 </div>
 </div>
 ) : (
 <div className="text-center text-xs p-4 border border-dashed border-neutral-200 text-neutral-450 bg-neutral-50 rounded-lg">
 {language === 'ar' ? '⚠️ يرجى تبديل الدور أو حساب الدخول إلى مسؤول سلامة (مشرف سيفيتي) لإنهاء الفحص وإغلاق التصريح.' : '⚠️ Switch simulation role to HSE (Supervisor) to sign environmental checks and close permit.'}
 </div>
 )}
 </div>
 )}

 {/* State F: CLOSED & REJECTED */}
 {(permit.status === 'CLOSED' || permit.status === 'REJECTED') && (
 <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-150 text-center">
 {permit.status === 'CLOSED' ? (
 <p className="text-xs font-bold text-emerald-600 dark:text-emerald-450 flex items-center justify-center gap-1.5 font-sans">
 <CheckCircle className="w-4 h-4" />
 <span>{language === 'ar' ? 'هذا التصريح مؤرشف بكافة سجلاته التاريخية ومغلق بأمان.' : 'This Permit to Work is fully filed and archived safely.'}</span>
 </p>
 ) : (
 <p className="text-xs font-bold text-rose-600 dark:text-rose-450 flex items-center justify-center gap-1.5 font-sans">
 <XCircle className="w-4 h-4" />
 <span>{language === 'ar' ? 'تم رفض طلب التصريح هذا من قبل الجهات المختصة ولن يتم تفعيله.' : 'This PTW is formally Rejected by specialized department.'}</span>
 </p>
 )}
 </div>
 )}

 </div>

 {/* 4. Steps Progress & Audit Trail Timeline */}
 <div id="audit-trail-section" className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
 <h4 id="audit-title" className="text-sm font-extrabold text-neutral-800 dark:text-neutral-250 mb-4 flex items-center justify-start gap-1.5">
 <FileText className="w-4 h-4 text-orange-500" />
 <span>{language === 'ar' ? 'السجل الإلكتروني وتعليقات المراجعة تزامناً مع الطوابع (Audit Trail)' : 'Electronic Audit Trail & Timestamps'}</span>
 </h4>

 <div className="space-y-4">
 {permit.auditTrail?.slice().reverse().map((log) => (
 <div key={log.id} id={`audit-timeline-item-${log.id}`} className="relative ps- pe- py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-900 rounded-xl text-start flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
 
 {/* Vertical line indicator */}
 <div className="absolute end- top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500/40 to-amber-500/10 rounded-tr rounded-br" />

 <div className="space-y-1.5 w-full">
 <div className="flex flex-wrap items-center justify-between gap-1.5 ">
 <p className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">
 {language === 'ar' ? log.actionAr : log.actionEn}
 </p>
 <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-400 ">
 <Clock id="clock-ico" className="w-3.5 h-3.5" />
 <span>{log.timestamp}</span>
 </div>
 </div>

 <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
 {language === 'ar' ? `${log.actorName} (${log.actorRoleAr})` : `${log.actorName} (${log.actorRoleEn})`}
 </p>

 {log.comment && (
 <p className="text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 p-2 rounded-lg italic">
 {log.comment}
 </p>
 )}
 </div>

 </div>
 ))}
 </div>
 </div>

 </div>
 );
});

PermitDetail.displayName = 'PermitDetail';
