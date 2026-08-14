/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Permit, PermitType, PermitStatus, SandboxRole, UserProfile, Language } from '../types';
import { PERMIT_TYPES_INFO, STATUS_INFO } from '../utils/initialData';
import { getEffectivePermitStatus } from '../utils/saas';
import { 
 Flame, Box, ArrowUpCircle, Lock, Droplets, 
 Search, Plus, CheckCircle, MapPin, AlertCircle, 
 Calendar, LockKeyhole, Gauge, Users, ChevronRight,
 ShieldEllipsis, XCircle, AlertTriangle,
 Zap, Pickaxe, ArrowUpFromLine, Wrench, FlaskConical, Trash2
} from 'lucide-react';

interface DashboardProps {
 permits: Permit[];
 selectedId: string | null;
 onSelectPermit: (id: string) => void;
 onDeletePermit?: (id: string) => void;
 onCreateNewClick: () => void;
 currentRole: SandboxRole;
 currentUser?: UserProfile;
 language: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({
 permits,
 selectedId,
 onSelectPermit,
 onDeletePermit,
 onCreateNewClick,
 currentRole,
 currentUser,
 language
}) => {
 const [searchTerm, setSearchTerm] = React.useState('');
 const [selectedType, setSelectedType] = React.useState<PermitType | 'ALL'>('ALL');
 const [selectedStatus, setSelectedStatus] = React.useState<PermitStatus | 'ALL' | 'PENDING_ALL'>('ALL');

 // Group metrics (effective status accounts for time-based expiry not yet persisted)
 const total = permits.length;
 const activeCount = permits.filter(p => getEffectivePermitStatus(p) === 'ACTIVE').length;
 const expiredCount = permits.filter(p => getEffectivePermitStatus(p) === 'EXPIRED').length;
 const pendingCount = permits.filter(p => p.status === 'PENDING_DEPT' || p.status === 'HSE_REVIEW').length;
 const closedCount = permits.filter(p => p.status === 'CLOSED').length;
 const draftCount = permits.filter(p => p.status === 'DRAFT').length;

 // Filter application
 const filteredPermits = permits.filter((permit) => {
 const matchesSearch = 
 permit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
 permit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
 permit.location.toLowerCase().includes(searchTerm.toLowerCase());
 
 const matchesType = selectedType === 'ALL' || permit.type === selectedType;
 
 let matchesStatus = false;
 if (selectedStatus === 'ALL') {
 matchesStatus = true;
 } else if (selectedStatus === 'PENDING_ALL') {
 matchesStatus = permit.status === 'PENDING_DEPT' || permit.status === 'HSE_REVIEW';
 } else {
 matchesStatus = permit.status === selectedStatus;
 }

 return matchesSearch && matchesType && matchesStatus;
 });

  const getPermitTypeIcon = (type: PermitType) => {
  switch (type) {
  case 'HOT': return <Flame id="pt-icon-hot" className="w-4 h-4 text-red-500" />;
  case 'CONFINED': return <Box id="pt-icon-confined" className="w-4 h-4 text-amber-500" />;
  case 'HEIGHT': return <ArrowUpCircle id="pt-icon-height" className="w-4 h-4 text-indigo-500" />;
  case 'LOTO': return <Lock id="pt-icon-loto" className="w-4 h-4 text-purple-500" />;
  case 'COLD': return <Droplets id="pt-icon-cold" className="w-4 h-4 text-blue-500" />;
  case 'ELECTRICAL': return <Zap id="pt-icon-electrical" className="w-4 h-4 text-yellow-500" />;
  case 'EXCAVATION': return <Pickaxe id="pt-icon-excavation" className="w-4 h-4 text-orange-500" />;
  case 'LIFTING': return <ArrowUpFromLine id="pt-icon-lifting" className="w-4 h-4 text-teal-500" />;
  case 'LINE_BREAKING': return <Wrench id="pt-icon-linebreak" className="w-4 h-4 text-lime-500" />;
  case 'CHEMICAL': return <FlaskConical id="pt-icon-chemical" className="w-4 h-4 text-pink-500" />;
  default: return <Droplets id="pt-icon-default" className="w-4 h-4 text-gray-500" />;
  }
  };

 return (
 <div id="dashboard-container" className="flex flex-col gap-6 font-sans">
 
 {/* 1. Industrial Alert-Safe METRICS SECTION */}
 <div id="metrics-grid" className="grid grid-cols-2 md:grid-cols-5 gap-4 font-sans">
 
 {/* Total Metric */}
 <div 
 id="metric-total" 
 onClick={() => setSelectedStatus('ALL')}
 className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-4 border-t-slate-500 p-4 rounded-lg shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
 selectedStatus === 'ALL' ? 'ring-2 ring-slate-400 border-slate-400 bg-slate-50/50 dark:bg-slate-800/20' : ''
 }`}
 >
 <div className="flex items-center justify-between text-slate-500">
 <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
 {language === 'ar' ? 'إجمالي التصاريح' : 'Total Permits'}
 </span>
 <ShieldEllipsis className="w-5 h-5 text-slate-400" />
 </div>
 <div className="mt-2 flex items-baseline gap-2">
 <span id="metric-total-val" className="text-3xl font-bold text-slate-800 dark:text-white font-mono">{total}</span>
 <span className="text-xs text-slate-500 select-none">PTWs</span>
 </div>
 </div>

 {/* Active Metric */}
 <div 
 id="metric-active" 
 onClick={() => setSelectedStatus('ACTIVE')}
 className={`bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 p-4 rounded-lg shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
 selectedStatus === 'ACTIVE' ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10' : ''
 }`}
 >
 <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
 <span className="text-xs font-semibold uppercase tracking-wider">
 {language === 'ar' ? 'تصاريح نشطة' : 'Active Permits'}
 </span>
 <CheckCircle id="icon-active-metric" className="w-5 h-5 text-emerald-500" />
 </div>
 <div className="mt-2 flex items-baseline gap-1">
 <span id="metric-active-val" className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{activeCount}</span>
 <span className="text-xs text-slate-500 select-none">{language === 'ar' ? 'سارية' : 'live'}</span>
 {expiredCount > 0 && (
 <span id="metric-expired-val" className="ms-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded" title={language === 'ar' ? 'تصاريح انتهت صلاحيتها ولم تُغلق بعد' : 'Permits past their end time, not yet closed'}>
 {expiredCount} {language === 'ar' ? 'منتهي' : 'expired'}
 </span>
 )}
 </div>
 </div>

 {/* Pending approvals */}
 <div 
 id="metric-pending" 
 onClick={() => setSelectedStatus('PENDING_ALL')}
 className={`bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 border-t-4 border-t-orange-500 p-4 rounded-lg shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
 selectedStatus === 'PENDING_ALL' ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50/10 dark:bg-orange-950/10' : ''
 }`}
 >
 <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold">
 <span className="text-xs font-semibold uppercase tracking-wider">
 {language === 'ar' ? 'بانتظار موافقة' : 'Pending Controls'}
 </span>
 <AlertCircle id="icon-pending-metric" className="w-5 h-5 text-orange-500" />
 </div>
 <div className="mt-2 flex items-baseline gap-1">
 <span id="metric-pending-val" className="text-3xl font-bold text-orange-600 dark:text-orange-500 font-mono">{pendingCount}</span>
 <span className="text-xs text-slate-500 select-none">{language === 'ar' ? 'طلب' : 'review'}</span>
 </div>
 </div>

 {/* Closed Metric */}
 <div 
 id="metric-closed" 
 onClick={() => setSelectedStatus('CLOSED')}
 className={`bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 border-t-4 border-t-blue-500 p-4 rounded-lg shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
 selectedStatus === 'CLOSED' ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/10 dark:bg-blue-950/10' : ''
 }`}
 >
 <div className="flex items-center justify-between text-blue-600 dark:text-sky-450">
 <span className="text-xs font-semibold uppercase tracking-wider">
 {language === 'ar' ? 'مغلقة بأمان' : 'Archived Closed'}
 </span>
 <LockKeyhole id="icon-closed-metric" className="w-5 h-5 text-blue-500" />
 </div>
 <div className="mt-2 flex items-baseline gap-1">
 <span id="metric-closed-val" className="text-3xl font-bold text-blue-600 dark:text-sky-400 font-mono">{closedCount}</span>
 <span className="text-xs text-slate-500 select-none">{language === 'ar' ? 'مؤرشف' : 'closed'}</span>
 </div>
 </div>

 {/* Draft Metric */}
 <div 
 id="metric-draft" 
 onClick={() => setSelectedStatus('DRAFT')}
 className={`bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 border-t-4 border-t-slate-400 p-4 rounded-lg shadow-sm flex flex-col justify-between col-span-2 md:col-span-1 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
 selectedStatus === 'DRAFT' ? 'ring-2 ring-slate-400 border-slate-400 bg-slate-50/50 dark:bg-slate-800/20' : ''
 }`}
 >
 <div className="flex items-center justify-between text-slate-500">
 <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
 {language === 'ar' ? 'المسودات' : 'Saved Drafts'}
 </span>
 <Plus id="icon-draft-metric" className="w-5 h-5 text-slate-400" />
 </div>
 <div className="mt-2 flex items-baseline gap-1">
 <span id="metric-draft-val" className="text-3xl font-bold text-slate-500 dark:text-neutral-450 font-mono">{draftCount}</span>
 <span className="text-xs text-slate-500 select-none">{language === 'ar' ? 'طلب' : 'drafts'}</span>
 </div>
 </div>

 </div>

 {/* 2. CONTROLS, SEARCHING & CREATING ROW */}
 <div id="search-controls-wrapper" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
 
 {/* Search input */}
 <div id="search-input-box" className="relative w-full lg:max-w-md">
 <Search id="search-ico" className="absolute start- top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
 <input
 id="ptw-search"
 type="text"
 placeholder={language === 'ar' ? 'البحث بالرمز، العنوان أو مكان العمل...' : 'Search by PTW number, job, or location...'}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full ps- pe- py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
 />
 </div>

 {/* Segregation Filters (Type, Status) */}
 <div id="filters-row" className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
 
 <select
 id="type-filter-select"
 value={selectedType}
 onChange={(e) => setSelectedType(e.target.value as PermitType | 'ALL')}
 className="px-3 py-2 text-xs font-semibold bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer focus:border-orange-500"
 >
 <option value="ALL">
 {language === 'ar' ? 'جميع أنواع التصاريح 📋' : 'All Permit Types 📋'}
 </option>
 {Object.keys(PERMIT_TYPES_INFO).map((typeKey) => (
 <option key={typeKey} value={typeKey}>
 {language === 'ar' ? PERMIT_TYPES_INFO[typeKey as PermitType].labelAr : PERMIT_TYPES_INFO[typeKey as PermitType].labelEn}
 </option>
 ))}
 </select>

 <select
 id="status-filter-select"
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value as PermitStatus | 'ALL' | 'PENDING_ALL')}
 className="px-3 py-2 text-xs font-semibold bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer focus:border-orange-500"
 >
 <option value="ALL">
 {language === 'ar' ? 'جميع حالات التصريح 🚦' : 'All Permit Statuses 🚦'}
 </option>
 {selectedStatus === 'PENDING_ALL' && (
 <option value="PENDING_ALL">
 {language === 'ar' ? 'قيد المراجعة والاعتمادات ⏳' : 'All Pending Approvals ⏳'}
 </option>
 )}
 {Object.keys(STATUS_INFO).map((statusKey) => (
 <option key={statusKey} value={statusKey}>
 {language === 'ar' ? STATUS_INFO[statusKey as PermitStatus].labelAr : STATUS_INFO[statusKey as PermitStatus].labelEn}
 </option>
 ))}
 </select>

 {/* Trigger Request button for users authorized to create permits */}
 {currentUser?.canCreatePermit && (
 <button
 id="draft-trigger-button"
 onClick={onCreateNewClick}
 className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer focus:outline-none shrink-0"
 >
 <Plus id="plus-icon-c" className="w-4 h-4 text-white" />
 <span>{language === 'ar' ? 'إنشاء تصريح جديد' : 'New Permit Draft'}</span>
 </button>
 )}

 </div>

 </div>

 {/* 3. PTWS LIST SECTION */}
 <div id="list-wrapper" className="flex flex-col gap-3">
 {filteredPermits.length === 0 ? (
 <div id="no-permits-card" className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl p-10 text-center flex flex-col items-center justify-center gap-2">
 <AlertCircle id="no-res-icon" className="w-10 h-10 text-neutral-400" />
 <h3 id="no-res-heading" className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
 {language === 'ar' ? 'لم يتم العثور على أي تصاريح' : 'No permits match filters'}
 </h3>
 <p id="no-res-p" className="text-xs text-neutral-400">
 {language === 'ar' 
 ? 'جرب تعديل عبارة البحث أو مرشح النواع لرؤية الطلبات المسجلة.' 
 : 'Modify your search keywords or clear current status selections to explore.'}
 </p>
 </div>
 ) : (
 (() => {
 // Pre-calculate active permits per location for NEBOSH Spatial Conflict Detection
 const activeLocations = permits
 .filter(p => getEffectivePermitStatus(p) === 'ACTIVE' || p.status === 'HSE_REVIEW')
 .reduce((acc, p) => {
 const loc = p.location.trim().toLowerCase();
 acc[loc] = (acc[loc] || 0) + 1;
 return acc;
 }, {} as Record<string, number>);

 return filteredPermits.map((permit) => {
 const isSelected = selectedId === permit.id;
 const typeInfo = PERMIT_TYPES_INFO[permit.type];
 const effectiveStatus = getEffectivePermitStatus(permit);
 const statusInfo = STATUS_INFO[effectiveStatus];

 const isConflicting = (effectiveStatus === 'ACTIVE' || permit.status === 'HSE_REVIEW')
 && activeLocations[permit.location.trim().toLowerCase()] > 1;

 return (
 <div
 key={permit.id}
 id={`permit-card-${permit.id}`}
 onClick={() => onSelectPermit(permit.id)}
 className={`p-5 rounded-lg border-y border-x ${
 language === 'ar' ? 'border-e- border-s- text-start' : 'border-s- border-e- text-end'
 } ${
 permit.status === 'ACTIVE' ? 'border-emerald-500' :
 permit.status === 'PENDING_DEPT' || permit.status === 'HSE_REVIEW' ? 'border-orange-500' :
 permit.status === 'PENDING_CLOSE' ? 'border-blue-500' :
 permit.status === 'CLOSED' ? 'border-slate-300 opacity-80' : 'border-slate-400'
 } ${
 isSelected 
 ? 'bg-orange-50/40 dark:bg-neutral-800 border-orange-500 shadow-md ring-1 ring-orange-500/20' 
 : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
 } transition-all duration-150 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4`}
 >
 
 {/* Main Information */}
 <div id={`info-col-${permit.id}`} className="flex flex-col gap-1 w-full md:max-w-[70%]">
 {/* ID + Type Label + Status Badge */}
 <div id="id-line" className="flex flex-wrap items-center gap-2 mb-1.5 justify-start ">
 
 <span id={`p-id-${permit.id}`} className="font-mono text-xs font-bold text-neutral-500 dark:text-neutral-400">
 {permit.id}
 </span>
 
 <span id={`type-badge-${permit.id}`} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.color}`}>
 {language === 'ar' ? typeInfo.labelAr : typeInfo.labelEn}
 </span>
 
 <span id={`status-badge-${permit.id}`} className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${statusInfo.color}`}>
 {language === 'ar' ? statusInfo.labelAr : statusInfo.labelEn}
 </span>

 {/* Miniature safety indicators */}
 <div id="micro-indicators" className="flex items-center gap-1.5 ms-">
 
 {/* LOTO lock state indicator */}
 {permit.lotoRequired && (
 <div id={`l-indicator-${permit.id}`} className={`flex items-center gap-1 border px-1.5 py-0.5 rounded text-[9px] font-mono leading-none ${
 permit.lotoLockNumber 
 ? 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' 
 : 'border-dashed border-neutral-300 text-neutral-400 dark:border-neutral-700'
 }`}>
 <LockKeyhole id="lock-icon" className="w-2.5 h-2.5 shrink-0" />
 <span>{permit.lotoLockNumber ? permit.lotoLockNumber : 'LOTO NEEDED'}</span>
 </div>
 )}

 {/* Gas Test indicator badge */}
 {permit.gasTestRequired && (
 <div id={`g-indicator-${permit.id}`} className={`flex items-center gap-1 border px-1.5 py-0.5 rounded text-[9px] font-mono leading-none ${
 permit.gasTestPassed 
 ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
 : 'border-dashed border-neutral-300 text-neutral-450'
 }`}>
 <Gauge id="gas-icon" className="w-2.5 h-2.5 shrink-0" />
 <span>O₂: {permit.gasO2Level ? `${permit.gasO2Level}%` : 'PENDING'}</span>
 </div>
 )}

 </div>

 </div>

 <h4 id={`p-title-${permit.id}`} className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
 {permit.title}
 </h4>

 <div id="loc-row" className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1 justify-start">
 <MapPin id="pin-icon" className="w-3.5 h-3.5 text-orange-400 shrink-0" />
 <span id={`p-location-${permit.id}`} className="text-neutral-600 dark:text-neutral-400">{permit.location}</span>
 <span className="text-neutral-300 dark:text-neutral-800">•</span>
 <Users id="workers-icon" className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
 <span>{permit.workers?.length || 0} {language === 'ar' ? 'عمال مكلّفين' : 'workers'}</span>
 </div>

 {isConflicting && (
 <div className="mt-1.5 inline-flex items-center gap-1 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 text-[10px] px-2 py-0.5 rounded border border-red-200 dark:border-red-800/50 self-start">
 <AlertTriangle className="w-3 h-3" />
 <span className="font-bold">
 {language === 'ar' ? '⚠️ تحذير: تعارض جغرافي! يوجد تصاريح نشطة أخرى بنفس الموقع' : '⚠️ Spatial Conflict: Multiple active permits in this location'}
 </span>
 </div>
 )}

 </div>

 {/* Right Meta Column: Timing + Chevron */}
 <div id={`date-col-${permit.id}`} className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800/50 pt-2.5 md:pt-0 shrink-0">
 
 <div className="text-end md:text-start">
 <p className="text-[10px] text-neutral-400 uppercase tracking-wide">
 {language === 'ar' ? 'الجدولة الزمنية' : 'Permit Period'}
 </p>
 <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 font-mono">
 <Calendar id="cal-icon" className="w-3.5 h-3.5 text-neutral-400 invisible md:visible" />
 <span>{permit.startDate.replace('T', ' ')}</span>
 </div>
 </div>

  {onDeletePermit && (currentUser?.customRole === 'SUPER_ADMIN' || currentUser?.customRole === 'SAFETY_MANAGER' || currentUser?.customRole === 'SAFETY_SUPERVISOR' || currentUser?.username?.includes('admin') || currentUser?.username === 'admin' || currentRole === 'HSE') && (
  <button
  type="button"
  onClick={(e) => {
  e.stopPropagation();
  if (confirm(language === 'ar' ? `⚠️ هل أنت متأكد كأدمن من مسح تصريح العمل [${permit.id}] نهائياً؟` : `⚠️ Delete permit [${permit.id}]?`)) {
  onDeletePermit(permit.id);
  }
  }}
  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all border border-red-100 dark:border-red-900/30 cursor-pointer shrink-0"
  title={language === 'ar' ? 'حذف التصريح نهائياً' : 'Delete Permit'}
  >
  <Trash2 className="w-4 h-4 text-red-500" />
  </button>
  )}

 <div className="bg-neutral-50 dark:bg-neutral-800 p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700/60 shrink-0">
 <ChevronRight id="che-icon" className={`w-4 h-4 text-neutral-400 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
 </div>

 </div>

 </div>
 );
 })
 })()
 )}
 </div>

 </div>
 );
};
