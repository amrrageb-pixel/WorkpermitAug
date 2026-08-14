import React from 'react';
import { UserProfile, SandboxRole, Language } from '../types';
import { 
 UserPlus, ShieldCheck, Check, Trash2, Lock, Shield, 
 Activity, User, Search, UserCheck, ShieldAlert, Award,
 Users2, Landmark, HelpCircle, HardHat, Edit, X, Settings
} from 'lucide-react';

export const FACTORY_ADMINISTRATIONS = [
 { ar: 'مدير مصنع / إدارة المصنع', en: 'Factory Manager Office', deptAr: 'إدارة المصنع (مدير مصنع)', deptEn: 'Factory Management' },
 { ar: 'إدارة السلامة والصحة المهنية', en: 'Safety / HSE Administration', deptAr: 'إدارة السلامة والصحة المهنية', deptEn: 'Safety & Occupational Health Administration (HSE)' },
 { ar: 'إدارة الصيانة', en: 'Maintenance Administration', deptAr: 'إدارة الصيانة', deptEn: 'Maintenance Administration' },
 { ar: 'إدارة الصيانة الوقائية', en: 'Preventive Maintenance Administration', deptAr: 'إدارة الصيانة الوقائية', deptEn: 'Preventive Maintenance Administration' },
 { ar: 'إدارة الكهرباء والـ LOTO', en: 'Electrical Administration', deptAr: 'إدارة الكهرباء', deptEn: 'Electrical Administration' },
 { ar: 'إدارة المعمل والجودة', en: 'Laboratory & Quality Administration', deptAr: 'إدارة المعمل والجودة', deptEn: 'Laboratory & Quality Administration' },
 { ar: 'إدارة الجودة', en: 'Quality Administration', deptAr: 'إدارة الجودة', deptEn: 'Quality Control Administration' },
 { ar: 'إدارة التعبئة والتغليف', en: 'Packaging & Packing Administration', deptAr: 'إدارة التعبئة', deptEn: 'Packaging Administration' },
 { ar: 'إدارة الأمن الصناعي', en: 'Security / Industrial Security Administration', deptAr: 'إدارة الأمن', deptEn: 'Security Administration' },
 { ar: 'الشؤون الإدارية', en: 'Administrative Affairs', deptAr: 'الشئون الإدارية', deptEn: 'Administrative Affairs' },
 { ar: 'إدارة المبيعات', en: 'Sales Administration', deptAr: 'إدارة المبيعات', deptEn: 'Sales Administration' },
 { ar: 'إدارة التسويق', en: 'Marketing Administration', deptAr: 'إدارة التسويق', deptEn: 'Marketing Administration' },
 { ar: 'الشؤون القانونية', en: 'Legal Affairs Office', deptAr: 'الشئون القانونية', deptEn: 'Legal Affairs' },
 { ar: 'إدارة المشتريات والمخازن', en: 'Procurement & Warehousing Administration', deptAr: 'إدارة المشتريات والمخازن', deptEn: 'Procurement & Warehousing Administration' },
 { ar: 'إدارة الموارد البشرية (HR)', en: 'Human Resources (HR) Administration', deptAr: 'إدارة الموارد البشرية', deptEn: 'Human Resources Administration' },
 { ar: 'إدارة الإنتاج والتشغيل', en: 'Production & Operation Administration', deptAr: 'إدارة الإنتاج والتشغيل', deptEn: 'Production & Operations' },
 { ar: 'إدارة التخطيط والمتابعة', en: 'Planning & Monitoring Administration', deptAr: 'إدارة التخطيط والمتابعة', deptEn: 'Planning & Monitoring Administration' },
 { ar: 'إدارة المشروعات والهندسة', en: 'Projects & Engineering Administration', deptAr: 'إدارة المشروعات والهندسة', deptEn: 'Projects & Engineering Administration' },
 { ar: 'إدارة تكنولوجيا المعلومات (IT)', en: 'Information Technology (IT) Administration', deptAr: 'إدارة تكنولوجيا المعلومات', deptEn: 'IT Administration' },
 { ar: 'إدارة البيئة والاستدامة', en: 'Environment & Sustainability Administration', deptAr: 'إدارة البيئة والاستدامة', deptEn: 'Environment & Sustainability' },
 { ar: 'إدارة الشؤون المالية والحسابات', en: 'Financial Affairs & Accounting Administration', deptAr: 'إدارة الشؤون المالية والحسابات', deptEn: 'Financial Affairs' },
 { ar: 'إدارة النقل واللوجستيات', en: 'Logistics & Transport Administration', deptAr: 'إدارة النقل واللوجستيات', deptEn: 'Transport & Logistics' },
 { ar: 'إدارة العلاقات العامة والإعلام', en: 'Public Relations Administration', deptAr: 'إدارة العلاقات العامة والإعلام', deptEn: 'Public Relations' }
];

interface UserManagerProps {
 users: UserProfile[];
 onAddUser: (user: UserProfile) => void;
 onDeleteUser: (empCode: string) => void;
 onUpdateUser: (user: UserProfile) => void;
 onBatchUpdateUsers?: (users: UserProfile[]) => void;
 language: Language;
}

export function UserManager({ users, onAddUser, onDeleteUser, onUpdateUser, onBatchUpdateUsers, language }: UserManagerProps) {
 const [fullNameAr, setFullNameAr] = React.useState('');
 const [fullNameEn, setFullNameEn] = React.useState('');
 const [empCode, setEmpCode] = React.useState('');
 const [username, setUsername] = React.useState('');
 const [password, setPassword] = React.useState('');
 
 // Custom permissions criteria checkboxes
 const [canCreatePermit, setCanCreatePermit] = React.useState<boolean>(false);
 const [canApproveElectrical, setCanApproveElectrical] = React.useState<boolean>(false);
 const [canApproveProduction, setCanApproveProduction] = React.useState<boolean>(false);
 const [canApproveSafety, setCanApproveSafety] = React.useState<boolean>(false);

 // Default to Maintenance Administration
 const [departmentAr, setDepartmentAr] = React.useState('إدارة الصيانة');
 const [departmentEn, setDepartmentEn] = React.useState('Maintenance Administration');
 const [permitVersion, setPermitVersion] = React.useState<'v1' | 'v2'>('v1');
 const [globalPermitVersion, setGlobalPermitVersion] = React.useState<'v1' | 'v2'>('v1');
 
 const [searchTerm, setSearchTerm] = React.useState('');
 const [errorMsg, setErrorMsg] = React.useState('');
 const [successMsg, setSuccessMsg] = React.useState('');

 const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);

 const startEditUser = (user: UserProfile) => {
 setEditingUser(user);
 setFullNameAr(user.fullNameAr);
 setFullNameEn(user.fullNameEn);
 setEmpCode(user.empCode);
 setUsername(user.username);
 // Left blank on purpose: passwords are no longer stored on the profile doc, and leaving
 // this field empty means "keep the current password" (see handleSubmit below).
 setPassword('');
 setCanCreatePermit(!!user.canCreatePermit);
 setCanApproveElectrical(!!user.canApproveElectrical);
 setCanApproveProduction(!!user.canApproveProduction);
 setCanApproveSafety(!!user.canApproveSafety);
 setDepartmentAr(user.departmentAr || 'إدارة الصيانة');
 setDepartmentEn(user.departmentEn || 'Maintenance Administration');
 setPermitVersion(user.permitVersion || 'v1');
 setErrorMsg('');
 setSuccessMsg('');
 };

 const cancelEditUser = () => {
 setEditingUser(null);
 setFullNameAr('');
 setFullNameEn('');
 setEmpCode('');
 setUsername('');
 setPassword('');
 setCanCreatePermit(false);
 setCanApproveElectrical(false);
 setCanApproveProduction(false);
 setCanApproveSafety(false);
 setDepartmentAr('إدارة الصيانة');
 setDepartmentEn('Maintenance Administration');
 setPermitVersion('v1');
 setErrorMsg('');
 setSuccessMsg('');
 };

 const handleAdminSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
 const val = e.target.value;
 const selected = FACTORY_ADMINISTRATIONS.find(item => item.deptAr === val);
 if (selected) {
 setDepartmentAr(selected.deptAr);
 setDepartmentEn(selected.deptEn);
 }
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 setErrorMsg('');
 setSuccessMsg('');

 // Password is only required when creating a new user — leaving it blank while editing
 // means "keep the current password" (see startEditUser above).
 if (!fullNameAr.trim() || !fullNameEn.trim() || !empCode.trim() || !username.trim() || (!editingUser && !password.trim())) {
 setErrorMsg(language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة الكود، الاسم، واسم الحساب.' : 'Please fill all required fields: Code, Names, Username and Password.');
 return;
 }

 if (!canCreatePermit && !canApproveElectrical && !canApproveProduction && !canApproveSafety) {
 setErrorMsg(language === 'ar' ? 'الرجاء اختيار صلاحية واحدة على الأقل للموظف!' : 'Please check at least one capability for the employee!');
 return;
 }

 // Check duplicate employee code or username against OTHER users
 if (users.some(u => u.empCode === empCode.trim().toUpperCase() && (!editingUser || u.empCode !== editingUser.empCode))) {
 setErrorMsg(language === 'ar' ? 'هذا الرقم الوظيفي مسجل مسبقاً لمستخدم آخر!' : 'This Employee ID is already registered to another user!');
 return;
 }

 if (users.some(u => u.username === username.trim().toLowerCase() && (!editingUser || u.empCode !== editingUser.empCode))) {
 setErrorMsg(language === 'ar' ? 'اسم المستخدم هذا مأخوذ مسبقاً! يرجى اختيار اسم مستخدم مغاير.' : 'This username is already taken! Please choose another.');
 return;
 }

 // Derive primary roles based on permissions checked
 let sandboxRole: SandboxRole = 'REQUESTER';
 let customRole: any = 'EMPLOYEE';
 let roleAr = 'موظف معتمد';
 let roleEn = 'Certified Employee';

 if (canApproveSafety) {
 sandboxRole = 'HSE';
 customRole = 'SAFETY_SUPERVISOR';
 roleAr = 'مشرف سيفيتي معتمد';
 roleEn = 'Certified HSE Supervisor';
 } else if (canApproveElectrical) {
 sandboxRole = 'ELECTRICAL';
 customRole = 'ELECTRICAL_DEPT';
 roleAr = 'مسؤول عزل كهربائي (LOTO)';
 roleEn = 'Electrical Isolation Officer (LOTO)';
 } else if (canApproveProduction) {
 sandboxRole = 'PRODUCTION';
 customRole = 'PRODUCTION_DEPT';
 roleAr = 'مسؤول موافقة الإنتاج';
 roleEn = 'Production Clearance Officer';
 } else if (canCreatePermit) {
 sandboxRole = 'REQUESTER';
 customRole = 'EMPLOYEE';
 roleAr = 'طالب تصريح عمل مكلّف';
 roleEn = 'Authorized Permit Requester';
 }

 const newUser: UserProfile = {
 empCode: empCode.toUpperCase().trim(),
 username: username.toLowerCase().trim(),
 password,
 sandboxRole,
 customRole: editingUser && (editingUser.customRole === 'SAFETY_MANAGER' || editingUser.username === 'admin') ? editingUser.customRole : customRole,
 fullNameAr: fullNameAr.trim(),
 fullNameEn: fullNameEn.trim(),
 roleAr: editingUser && (editingUser.customRole === 'SAFETY_MANAGER' || editingUser.username === 'admin') ? (editingUser.roleAr || 'مدير النظام') : roleAr,
 roleEn: editingUser && (editingUser.customRole === 'SAFETY_MANAGER' || editingUser.username === 'admin') ? (editingUser.roleEn || 'System Admin') : roleEn,
 departmentAr,
 departmentEn,
 permitVersion,
 canCreatePermit,
 canApproveElectrical,
 canApproveProduction,
 canApproveSafety
 };

 if (editingUser) {
 onUpdateUser(newUser);
 setSuccessMsg(language === 'ar' ? 'تم تحديث بيانات وصلاحيات الحساب بنجاح!' : 'User account details and capabilities updated successfully!');
 setEditingUser(null);
 } else {
 onAddUser(newUser);
 setSuccessMsg(language === 'ar' ? 'تمت إضافة المستخدم وتخصيص صلاحياته الرقمية بنجاح!' : 'User registered and digital authorization capabilities assigned successfully!');
 }
 
 // Clear Form
 setFullNameAr('');
 setFullNameEn('');
 setEmpCode('');
 setUsername('');
 setPassword('');
 setCanCreatePermit(false);
 setCanApproveElectrical(false);
 setCanApproveProduction(false);
 setCanApproveSafety(false);
 // Reset to default administration
 setDepartmentAr('إدارة الصيانة');
 setDepartmentEn('Maintenance Administration');

 setTimeout(() => {
 setSuccessMsg('');
 }, 5000);
 };

 const handleApplyVersionToAll = () => {
    if (!onBatchUpdateUsers) return;
    const confirmMsg = language === 'ar' 
      ? `هل أنت متأكد من تطبيق ${globalPermitVersion === 'v2' ? 'النسخة الثانية' : 'النسخة الأولى (NEBOSH)'} على كافة موظفي الشركة؟`
      : `Are you sure you want to apply ${globalPermitVersion === 'v2' ? 'Version 2' : 'Version 1 (NEBOSH)'} to ALL employees?`;
    if (window.confirm(confirmMsg)) {
      const updatedList = users.map(u => ({ ...u, permitVersion: globalPermitVersion }));
      onBatchUpdateUsers(updatedList);
    }
  };

  const filteredUsers = users.filter(u => {
    const term = (searchTerm || '').toLowerCase();
    return (u.fullNameAr || '').includes(term) || 
           (u.fullNameEn || '').toLowerCase().includes(term) || 
           (u.empCode || '').toLowerCase().includes(term) ||
           (u.username || '').toLowerCase().includes(term);
  });

 // Stats
 const managersCount = users.filter(u => u.customRole === 'SAFETY_MANAGER').length;
 const supervisorsCount = users.filter(u => u.customRole === 'SAFETY_SUPERVISOR').length;
 const employeesCount = users.filter(u => u.customRole === 'EMPLOYEE' || !u.customRole).length;
 const systemCount = users.length;

 return (
 <div className="flex flex-col gap-6 text-start font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 
 {/* 1. Header and Icon */}
 <div className={`p-5 bg-[#0F172A] border border-slate-700/60 text-white rounded-xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${language === 'ar' ? '' : ''}`}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-lg shadow-inner shrink-0">
 <Users2 className="w-5 h-5 text-white" />
 </div>
 <div>
 <h2 className="text-lg font-extrabold text-white">
 {language === 'ar' ? 'بوابة إدارة المستخدمين وصلاحيات السيفيتي' : 'Safety Personnel & User Portal'}
 </h2>
 <p className="text-xs text-slate-400 mt-0.5">
 {language === 'ar' 
 ? 'لوحة تسجيل الموظفين وتخصيص صلاحيات التوقيع الرقمي (مدير سيفيتي، مشرف، موظف مكلّف)' 
 : 'Register staff and define digital sign-off and approval bounds (Safety manager, supervisor, issuer)'}
 </p>
 </div>
 </div>
 </div>

 {/* 2. Visual Metrics Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 <div className="bg-white dark:bg-neutral-900 border border-neutral-150 p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm">
 <div>
 <p className="text-[10px] text-neutral-400 uppercase font-bold">{language === 'ar' ? 'إجمالي مستخدمي المصنع' : 'Total Factory Staff'}</p>
 <p className="text-xl font-black text-slate-800 dark:text-white mt-1 font-mono">{systemCount}</p>
 </div>
 <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-600">
 <Activity className="w-5 h-5" />
 </div>
 </div>

 <div className="bg-white dark:bg-neutral-900 border border-neutral-150 p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm">
 <div>
 <p className="text-[10px] text-neutral-400 uppercase font-bold">{language === 'ar' ? 'مدير سيفيتي معتمد' : 'Safety Managers (HSE Lead)'}</p>
 <p className="text-xl font-black text-rose-600 mt-1 font-mono">{managersCount}</p>
 </div>
 <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-600">
 <Award className="w-5 h-5" />
 </div>
 </div>

 <div className="bg-white dark:bg-neutral-900 border border-neutral-150 p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm">
 <div>
 <p className="text-[10px] text-neutral-400 uppercase font-bold">{language === 'ar' ? 'مشرف سيفيتي ومفتش' : 'Safety Supervisors (Field)'}</p>
 <p className="text-xl font-black text-amber-500 mt-1 font-mono">{supervisorsCount}</p>
 </div>
 <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
 <ShieldCheck className="w-5 h-5" />
 </div>
 </div>

 <div className="bg-white dark:bg-neutral-900 border border-neutral-150 p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm">
 <div>
 <p className="text-[10px] text-neutral-400 uppercase font-bold">{language === 'ar' ? 'موظفين وفنيين صيانة' : 'Operators & Employees'}</p>
 <p className="text-xl font-black text-indigo-500 mt-1 font-mono">{employeesCount}</p>
 </div>
 <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-500">
 <HardHat className="w-5 h-5" />
 </div>
 </div>
 </div>

 {/* 2.5 Global Permit Version Settings */}
 <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
   <div className="text-start">
     <h3 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-2">
       <Settings className="w-4 h-4 text-orange-500" />
       {language === 'ar' ? 'الإعداد العام لنسخة التصريح للشركة' : 'Global Company Permit Version'}
     </h3>
     <p className="text-xs text-neutral-500 mt-1">
       {language === 'ar' ? 'اختر نسخة التصريح وقم بتطبيقها على جميع الموظفين في الشركة دفعة واحدة' : 'Select the permit version to apply to all employees in the company at once'}
     </p>
   </div>
   <div className="flex flex-col sm:flex-row items-center gap-3 bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shrink-0 w-full md:w-auto">
     <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300 font-bold">
       <input type="radio" name="globalPermitVersion" value="v1" checked={globalPermitVersion === 'v1'} onChange={() => setGlobalPermitVersion('v1')} className="accent-orange-500 w-4 h-4" />
       {language === 'ar' ? 'النسخة الأولى' : 'Version 1'}
     </label>
     <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300 font-bold">
       <input type="radio" name="globalPermitVersion" value="v2" checked={globalPermitVersion === 'v2'} onChange={() => setGlobalPermitVersion('v2')} className="accent-orange-500 w-4 h-4" />
       {language === 'ar' ? 'النسخة الثانية' : 'Version 2'}
     </label>
     {onBatchUpdateUsers && (
       <button 
         type="button" 
         onClick={handleApplyVersionToAll}
         className="w-full sm:w-auto ml-0 sm:ml-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-[11px] font-bold transition-colors shadow-sm"
       >
         {language === 'ar' ? 'تطبيق على الكل' : 'Apply to All'}
       </button>
     )}
   </div>
 </div>

 {/* 3. Main Split Panel (List vs registration Form) */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Left pane: Users Table/Card List (takes 2 cols) */}
 <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 flex flex-col gap-4">
 
 <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
 <h3 className="text-sm font-bold text-neutral-800 dark:text-white">
 {language === 'ar' ? 'قائمة الفنيين والمسؤولين المسجلين بالمصنع' : 'Registered Plant Users Registry'}
 </h3>
 
 {/* Search filter input */}
 <div className="relative w-full sm:w-64">
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder={language === 'ar' ? 'ابحث بالاسم أو الكود الوظيفي...' : 'Search by ID, Name or Username...'}
 className="w-full text-xs pe- ps- py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-orange-500"
 />
 <Search className="w-4 h-4 text-neutral-400 absolute end- top-2" />
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-xs text-start border-collapse">
 <thead>
 <tr className="border-b border-neutral-150 dark:border-neutral-800 text-neutral-450 font-bold bg-neutral-50 dark:bg-neutral-950">
 <th className="p-3">{language === 'ar' ? 'الرقم الوظيفي' : 'ID Code'}</th>
 <th className="p-3">{language === 'ar' ? 'الاسم والمهنة' : 'FullName & Corporate Role'}</th>
 <th className="p-3">{language === 'ar' ? 'حساب الدخول' : 'Access Account'}</th>
 <th className="p-3">{language === 'ar' ? 'الصلاحية والمسؤوليات' : 'Safety Role authority'}</th>
 <th className="p-3 text-center">{language === 'ar' ? 'فعل' : 'Action'}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
 {filteredUsers.length === 0 ? (
 <tr>
 <td colSpan={5} className="p-8 text-center text-neutral-400 italic">
 {language === 'ar' ? '⚠️ لم يتم العثور على أي كادر مطابق للبحث.' : '⚠️ No matching workers found.'}
 </td>
 </tr>
 ) : (
 filteredUsers.map((user, idx) => {
 // Badge Styling based on permission role
 let roleBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400';
 let roleBadgeLabelAr = 'موظف';
 let roleBadgeLabelEn = 'Employee';

 if (user.customRole === 'SAFETY_MANAGER' || user.username === 'admin') {
 roleBadgeColor = 'bg-rose-50 text-rose-800 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450';
 roleBadgeLabelAr = '🛡️ مدير النظام (System Admin)';
 roleBadgeLabelEn = '🛡️ System Admin';
 } else if (user.canApproveSafety) {
 roleBadgeColor = 'bg-amber-50 text-amber-800 border-amber-250 dark:bg-yellow-950/20 dark:text-amber-400';
 roleBadgeLabelAr = '⚙️ مشرف سيفيتي (Supervisor)';
 roleBadgeLabelEn = '⚙️ Safety Supervisor';
 } else if (user.canApproveElectrical) {
 roleBadgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400';
 roleBadgeLabelAr = '🔑 رئيس الكهرباء (LOTO Cert)';
 roleBadgeLabelEn = '🔑 Electrical Manager';
 } else if (user.canApproveProduction) {
 roleBadgeColor = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400';
 roleBadgeLabelAr = '🔨 رئيس الإنتاج (Prod Clearance)';
 roleBadgeLabelEn = '🔨 Production Dept';
 }

 const isSeedUser = ['EMP101', 'EMP102', 'EMP103', 'EMP104', 'ADMIN01'].includes(user.empCode);

 return (
 <tr key={user.empCode} className="hover:bg-slate-50/50 dark:hover:bg-neutral-850/30 transition-colors">
 <td className="p-3 font-bold text-slate-800 dark:text-slate-200 font-mono">{user.empCode}</td>
 <td className="p-3">
 <p className="font-bold text-slate-900 dark:text-white leading-tight">
 {language === 'ar' ? user.fullNameAr : user.fullNameEn}
 </p>
 <p className="text-[10px] text-neutral-400 mt-0.5">
 {language === 'ar' ? user.roleAr : user.roleEn} • <span className="font-semibold">{language === 'ar' ? user.departmentAr : user.departmentEn}</span>
 </p>
 </td>
 <td className="p-3 font-mono text-neutral-600 dark:text-neutral-300 pointer-events-none select-none">
 <p className="text-xs font-bold">@{user.username}</p>
 <p className="text-[9px] text-neutral-400">pwd: {user.username === 'admin' ? 'admin' : '••••'}</p>
 </td>
 <td className="p-3 space-y-1">
 <div>
 <span className={`px-2 py-0.5 rounded border text-[10px] font-bold inline-block leading-none ${roleBadgeColor}`}>
 {language === 'ar' ? roleBadgeLabelAr : roleBadgeLabelEn}
 </span>
 </div>
 
 {/* Render fine-grained capabilities */}
 <div className="flex flex-wrap gap-1 mt-1 justify-start">
 {user.canCreatePermit && (
 <span className="bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-900 px-1 py-0.5 rounded text-[8px] font-bold font-sans">
 {language === 'ar' ? '✍️ إنشاء تصاريح' : 'Permit Requester'}
 </span>
 )}
 {user.canApproveElectrical && (
 <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 px-1 py-0.5 rounded text-[8px] font-bold font-sans">
 {language === 'ar' ? '🔑 عزل الكهرباء' : 'Electrical Isolation'}
 </span>
 )}
 {user.canApproveProduction && (
 <span className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900 px-1 py-0.5 rounded text-[8px] font-bold font-sans">
 {language === 'ar' ? '🔨 موافقة الإنتاج' : 'Production Clearance'}
 </span>
 )}
 {user.canApproveSafety && (
 <span className="bg-amber-50 dark:bg-yellow-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900 px-1 py-0.5 rounded text-[8px] font-bold font-sans">
 {language === 'ar' ? '🛡️ مشرف سيفيتي' : 'Safety Supervisor'}
 </span>
 )}
 </div>
 <div className="mt-1">
 <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
 {language === 'ar' ? `نسخة التصريح: ${user.permitVersion === 'v2' ? 'الثانية (V2)' : 'الأولى (V1)'}` : `Permit Version: ${user.permitVersion === 'v2' ? 'V2' : 'V1'}`}
 </span>
 </div>
 </td>
 <td className="p-3">
 <div className="flex items-center justify-center gap-1.5">
 {/* Edit Button */}
 <button
 onClick={() => startEditUser(user)}
 className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50 flex items-center justify-center transition-colors"
 title={language === 'ar' ? 'تعديل هذا المستخدم وسلطات التوقيع له' : 'Edit user details and sign-off authority'}
 >
 <Edit className="w-3.5 h-3.5" />
 </button>

 {/* Delete Button */}
 <button
 disabled={isSeedUser}
 onClick={() => {
 if (confirm(language === 'ar' ? `هل أنت متأكد من حذف حساب: ${user.fullNameAr}؟` : `Are you sure you want to delete account: ${user.fullNameEn}?`)) {
 onDeleteUser(user.empCode);
 }
 }}
 className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors ${
 isSeedUser 
 ? 'border-neutral-100 text-neutral-300 dark:border-neutral-855 dark:text-neutral-700 cursor-not-allowed' 
 : 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-950/40 dark:text-rose-450 dark:hover:bg-rose-950/20'
 }`}
 title={isSeedUser ? (language === 'ar' ? 'ملف تجريبي أساسي لا يحذف' : 'System seed account - cannot be deleted') : (language === 'ar' ? 'حذف هذا المستخدم' : 'Delete user')}
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Right pane: Add User Form (takes 1 cols) */}
 <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 flex flex-col gap-4">
 <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 flex items-center justify-between">
 {editingUser ? (
 <button
 type="button"
 onClick={cancelEditUser}
 className="text-[10px] px-2 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold rounded flex items-center gap-1 transition-all"
 title={language === 'ar' ? 'إلغاء التعديل والعودة لإضافة مستخدم جديد' : 'Cancel edit and register a new user'}
 >
 <X className="w-3 h-3" />
 <span>{language === 'ar' ? 'إلغاء' : 'Cancel'}</span>
 </button>
 ) : <div className="w-1" />}
 
 <div className="flex items-center gap-2 justify-end">
 {editingUser ? <Edit className="w-4 h-4 text-amber-500" /> : <UserPlus className="w-4 h-4 text-orange-500" />}
 <h3 className="text-sm font-extrabold text-neutral-800 dark:text-white">
 {editingUser 
 ? (language === 'ar' ? 'تحديث الصلاحيات وبيانات الحساب' : 'Edit Capabilities & Account')
 : (language === 'ar' ? 'المكتب الرقمي: إضافة حساب جديد' : 'New Account Registration Form')}
 </h3>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="space-y-3">
 {errorMsg && (
 <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-2.5 rounded-lg">
 {errorMsg}
 </div>
 )}
 {successMsg && (
 <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs p-2.5 rounded-lg">
 {successMsg}
 </div>
 )}

 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">
 {language === 'ar' ? 'الاسم الكامل بالعربية *' : 'Full Name (Arabic) *'}
 </label>
 <input
 type="text"
 required
 value={fullNameAr}
 onChange={(e) => setFullNameAr(e.target.value)}
 placeholder="مثال: م. كمال صالح"
 className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg text-slate-800 dark:text-slate-200"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">
 {language === 'ar' ? 'الاسم الكامل بالإنجليزية *' : 'Full Name (English) *'}
 </label>
 <input
 type="text"
 required
 value={fullNameEn}
 onChange={(e) => setFullNameEn(e.target.value)}
 placeholder="e.g. Eng. Kamal Saleh"
 className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg text-slate-800 dark:text-slate-200"
 />
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">
 {language === 'ar' ? 'الرقم الوظيفي *' : 'Employee ID *'}
 </label>
 <input
 type="text"
 required
 disabled={!!editingUser}
 value={empCode}
 onChange={(e) => setEmpCode(e.target.value)}
 placeholder="e.g. EMP106"
 className={`w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg font-mono text-slate-800 dark:text-slate-200 ${editingUser ? 'opacity-65 cursor-not-allowed bg-neutral-100 dark:bg-neutral-900 font-bold' : ''}`}
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">
 {language === 'ar' ? 'الإدارة التابع لها *' : 'Administration *'}
 </label>
 <select
 id="admin-predefined-select"
 onChange={handleAdminSelectChange}
 value={FACTORY_ADMINISTRATIONS.find(item => item.deptAr === departmentAr)?.deptAr || FACTORY_ADMINISTRATIONS[2].deptAr}
 className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-855 rounded-lg text-slate-800 dark:text-slate-200"
 >
 {FACTORY_ADMINISTRATIONS.map(admin => (
 <option key={admin.deptAr} value={admin.deptAr}>
 {language === 'ar' ? admin.ar : admin.en}
 </option>
 ))}
 </select>
 </div>
 </div>

  <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg">
  <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">
  {language === 'ar' ? 'نسخة نموذج التصريح *' : 'Permit Form Version *'}
  </label>
  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
  <div className="flex gap-4">
      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300 font-bold">
      <input type="radio" name="permitVersion" value="v1" checked={permitVersion === 'v1'} onChange={() => setPermitVersion('v1')} className="accent-orange-500" />
      {language === 'ar' ? 'النسخة الأولى (NEBOSH)' : 'Version 1 (NEBOSH)'}
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300 font-bold">
      <input type="radio" name="permitVersion" value="v2" checked={permitVersion === 'v2'} onChange={() => setPermitVersion('v2')} className="accent-orange-500" />
      {language === 'ar' ? 'النسخة الثانية' : 'Version 2'}
      </label>
    </div>
  </div>
  </div>

  <div className="grid grid-cols-2 gap-2 mt-2">
 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">
 {language === 'ar' ? 'اسم الحساب والدخول *' : 'Username *'}
 </label>
 <input
 type="text"
 required
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 placeholder="e.g. kamal_saleh"
 className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg font-mono text-end text-slate-800 dark:text-slate-200"
 dir="ltr"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-neutral-500 mb-1">
 {language === 'ar' ? 'كلمة المرور *' : 'Password *'}
 </label>
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg font-mono text-end text-slate-800 dark:text-slate-200"
 dir="ltr"
 />
 </div>
 </div>

 {/* Custom fine-grained employee permissions checkboxes checklist */}
 <div className="bg-slate-50 dark:bg-neutral-950 p-3 rounded-lg border border-slate-200 dark:border-neutral-850 space-y-2 mt-2">
 <span className="block text-[11px] font-black text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-neutral-800 pb-1">
 {language === 'ar' ? 'مستوى الصلاحيات (اختيار متعدد) *' : 'Authorization Levels (Multi-select) *'}
 </span>
 
 <div className="space-y-2 pt-1 font-sans text-start">
 <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-900/45 p-1 rounded-md justify-start text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
 <input
 type="checkbox"
 checked={canCreatePermit}
 onChange={(e) => setCanCreatePermit(e.target.checked)}
 className="w-3.5 h-3.5 accent-orange-500 rounded cursor-pointer shrink-0"
 />
 <span>{language === 'ar' ? 'صلاحية إنشاء تصاريح العمل' : 'Ability to create work permit.'}</span>
 </label>

 <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-900/45 p-1 rounded-md justify-start text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
 <input
 type="checkbox"
 checked={canApproveElectrical}
 onChange={(e) => setCanApproveElectrical(e.target.checked)}
 className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer shrink-0"
 />
 <span>{language === 'ar' ? 'صلاحية إجراء العزل الكهربائي (LOTO)' : 'Ability to conduct electrical LOTO.'}</span>
 </label>

 <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-900/45 p-1 rounded-md justify-start text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
 <input
 type="checkbox"
 checked={canApproveProduction}
 onChange={(e) => setCanApproveProduction(e.target.checked)}
 className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer shrink-0"
 />
 <span>{language === 'ar' ? 'صلاحية تأكيد جاهزية الإنتاج والتشغيل' : 'Ability to confirm production readiness.'}</span>
 </label>

 <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-neutral-900/45 p-1 rounded-md justify-start text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
 <input
 type="checkbox"
 checked={canApproveSafety}
 onChange={(e) => setCanApproveSafety(e.target.checked)}
 className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer shrink-0"
 />
 <span>{language === 'ar' ? 'صلاحية تأكيد إجراءات السلامة كمسؤول سلامة' : 'Ability to confirm the safety procedures as a safety officer.'}</span>
 </label>
 </div>
 </div>

 <div className="pt-2">
 <button
 type="submit"
 className={`w-full bg-gradient-to-r text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer ${
 editingUser
 ? 'from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500'
 : 'from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500'
 }`}
 >
 <UserCheck className="w-4 h-4 ms-" />
 <span>
 {editingUser
 ? (language === 'ar' ? 'حفظ ومزامنة التعديلات 💾' : 'Save Changes & Update 💾')
 : (language === 'ar' ? 'مزامنة وإرسال الحساب 💾' : 'Submit & Create Account 💾')}
 </span>
 </button>
 </div>
 </form>
 </div>

 </div>

 </div>
 );
}
