import React from 'react';
import { 
  Building2, PlusCircle, ShieldCheck, Users2, KeyRound, 
  Trash2, Crown, Settings, Activity, Database, Check, X, ShieldAlert, LogOut 
} from 'lucide-react';
import type { Language, Tenant, UserProfile, SaaSAuditLogEntry } from '../types';
import { UNLIMITED } from '../utils/subscriptions';

interface AdminConsoleProps {
  companies: Tenant[];
  users: UserProfile[];
  auditLogs: SaaSAuditLogEntry[];
  onCreateCompany: (company: Tenant) => void;
  onCreateUser: (user: UserProfile) => void;
  onDeleteUser: (empCode: string) => void;
  onUpgradePlan: (companyId: string, plan: Tenant['plan']) => void;
  onUpdateCompany: (company: Tenant) => void;
  onDeleteCompany: (companyId: string) => void;
  language: Language;
  onLogout: () => void;
  onClearAuditLogs?: () => void;
}

const emptyCompanyForm = {
  name: '',
  plan: 'STARTER' as Tenant['plan'],
  maxUsers: 25,
  status: 'TRIAL' as Tenant['status'],
  description: '',
  logoUrl: '',
  expiryDate: '2028-12-31',
  startDate: '2026-01-01',
  storageLimitGb: 5,
  enabledModules: ['PTW'] as string[]
};

const emptyUserForm = {
  fullNameEn: '',
  fullNameAr: '',
  username: '',
  password: '',
  empCode: '',
  tenantId: '',
  isCompanyAdmin: false
};

const AVAILABLE_MODULES = [
  { id: 'PTW', nameAr: 'تصاريح العمل (PTW)', nameEn: 'Permits to Work' },
  { id: 'HIRA', nameAr: 'تقييم المخاطر (HIRA)', nameEn: 'HIRA Risk Matrix' },
  { id: 'INCIDENT', nameAr: 'إدارة الحوادث', nameEn: 'Incident Management' },
  { id: 'CONTRACTOR', nameAr: 'إدارة مقاولي الموقع', nameEn: 'Contractor Management' },
  { id: 'AUDIT', nameAr: 'عمليات التدقيق', nameEn: 'Compliance Audits' },
  { id: 'LOTO', nameAr: 'عزل الطاقة LOTO', nameEn: 'LOTO Lockout' }
];

export function AdminConsole({ 
  companies, 
  users, 
  auditLogs,
  onCreateCompany, 
  onCreateUser, 
  onDeleteUser, 
  onUpgradePlan,
  onUpdateCompany,
  onDeleteCompany,
  language,
  onLogout,
  onClearAuditLogs
}: AdminConsoleProps) {
  const [companyForm, setCompanyForm] = React.useState(emptyCompanyForm);
  const [userForm, setUserForm] = React.useState(emptyUserForm);
  const [feedback, setFeedback] = React.useState('');
  
  // Inline edit state
  const [editingCompanyId, setEditingCompanyId] = React.useState<string | null>(null);
  const [editCompanyState, setEditCompanyState] = React.useState<Tenant | null>(null);

  // Filters for Audit Log
  const [auditSearch, setAuditSearch] = React.useState('');
  const [auditTenantFilter, setAuditTenantFilter] = React.useState('');

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setCompanyForm((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCompany = (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyForm.name.trim()) {
      setFeedback(language === 'ar' ? 'يرجى إدخال اسم الشركة.' : 'Please enter a company name.');
      return;
    }

    const newCompany: Tenant = {
      id: `tenant-${(companyForm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: (companyForm.name || '').trim(),
      plan: companyForm.plan,
      maxUsers: companyForm.maxUsers,
      status: companyForm.status,
      description: (companyForm.description || '').trim(),
      ownerEmail: `${(companyForm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '.')}@company.local`,
      logoUrl: companyForm.logoUrl.trim(),
      startDate: companyForm.startDate,
      expiryDate: companyForm.expiryDate,
      storageLimitGb: companyForm.storageLimitGb,
      storageUsedBytes: 0,
      enabledModules: companyForm.enabledModules
    };

    onCreateCompany(newCompany);
    setCompanyForm(emptyCompanyForm);
    setUserForm((prev) => ({ ...prev, tenantId: newCompany.id }));
    setFeedback(language === 'ar' ? 'تم إنشاء الشركة بنجاح.' : 'Company created successfully.');
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleCreateUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!userForm.fullNameEn.trim() || !userForm.username.trim() || !userForm.password.trim() || !userForm.empCode.trim() || !userForm.tenantId) {
      setFeedback(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة وتحديد الشركة.' : 'Please fill the required fields and choose a company.');
      return;
    }

    const selectedCompany = companies.find((company) => company.id === userForm.tenantId);
    const currentCompanyUsers = users.filter((entry) => entry.tenantId === userForm.tenantId);
    if (selectedCompany && selectedCompany.maxUsers !== UNLIMITED && currentCompanyUsers.length >= selectedCompany.maxUsers) {
      setFeedback(language === 'ar' ? 'تم الوصول إلى الحد الأقصى لعدد المستخدمين لهذه الشركة.' : 'This company has reached its maximum user limit.');
      return;
    }

    const role = userForm.username.toLowerCase().includes('hse') ? 'SAFETY_SUPERVISOR' : 'EMPLOYEE';
    const newUser: UserProfile = {
      empCode: userForm.empCode.trim().toUpperCase(),
      username: userForm.username.trim().toLowerCase(),
      password: userForm.isCompanyAdmin ? 'admin' : userForm.password,
      mustChangePassword: true, // force change password on first login
      sandboxRole: 'REQUESTER',
      customRole: userForm.isCompanyAdmin ? 'SUPER_ADMIN' : role,
      fullNameAr: userForm.fullNameAr.trim() || userForm.fullNameEn.trim(),
      fullNameEn: userForm.fullNameEn.trim(),
      roleAr: userForm.isCompanyAdmin ? 'مدير الشركة' : (role === 'SAFETY_SUPERVISOR' ? 'مشرف سيفيتي' : 'موظف'),
      roleEn: userForm.isCompanyAdmin ? 'Company Administrator' : (role === 'SAFETY_SUPERVISOR' ? 'HSE Supervisor' : 'Employee'),
      departmentAr: 'إدارة التشغيل',
      departmentEn: 'Operations Administration',
      tenantId: userForm.tenantId,
      permissions: userForm.isCompanyAdmin
        ? ['permits.create', 'permits.view', 'permits.approve', 'users.manage', 'tenants.view']
        : role === 'SAFETY_SUPERVISOR'
          ? ['permits.create', 'permits.view', 'permits.approve', 'users.manage']
          : ['permits.create', 'permits.view']
    };

    onCreateUser(newUser);
    setUserForm(emptyUserForm);
    setFeedback(language === 'ar' ? 'تم إضافة المستخدم إلى الشركة بنجاح.' : 'User onboarded to the company successfully.');
    setTimeout(() => setFeedback(''), 4000);
  };

  const startEditing = (company: Tenant) => {
    setEditingCompanyId(company.id);
    setEditCompanyState({ ...company });
  };

  const cancelEditing = () => {
    setEditingCompanyId(null);
    setEditCompanyState(null);
  };

  const saveCompanySettings = () => {
    if (editCompanyState) {
      onUpdateCompany(editCompanyState);
      setEditingCompanyId(null);
      setEditCompanyState(null);
      setFeedback(language === 'ar' ? 'تم تحديث إعدادات الشركة.' : 'Company settings updated.');
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  const toggleModuleInForm = (moduleId: string) => {
    setCompanyForm(prev => {
      const active = prev.enabledModules.includes(moduleId);
      return {
        ...prev,
        enabledModules: active 
          ? prev.enabledModules.filter(m => m !== moduleId)
          : [...prev.enabledModules, moduleId]
      };
    });
  };

  const toggleModuleInEdit = (moduleId: string) => {
    if (!editCompanyState) return;
    const modules = editCompanyState.enabledModules || [];
    const active = modules.includes(moduleId);
    setEditCompanyState({
      ...editCompanyState,
      enabledModules: active 
        ? modules.filter(m => m !== moduleId)
        : [...modules, moduleId]
    });
  };

  const filteredLogs = (auditLogs || []).filter(log => {
    if (!log) return false;
    const userName = (log.userName || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const search = (auditSearch || '').toLowerCase();
    const matchesSearch = userName.includes(search) || action.includes(search);
    const matchesTenant = auditTenantFilter ? log.tenantId === auditTenantFilter : true;
    return matchesSearch && matchesTenant;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 p-6 text-slate-800 dark:text-neutral-100 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        
        {/* Header Block */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">2M EHS SaaS Platform</p>
              <h1 className="text-2xl font-extrabold tracking-tight mt-1">
                {language === 'ar' ? 'لوحة إدارة المنصة الكبرى (Platform Admin)' : 'Platform Administrator Management Console'}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {language === 'ar'
                  ? 'تسجيل شركات جديدة، وتخصيص خطط الاشتراك، وإدارة وحدات النظام النشطة، والاطلاع على سجلات الأمان.'
                  : 'Onboard new companies, allocate plans, manage system modules, and track platform activity logs.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-orange-200 dark:border-orange-950/20 bg-orange-50 dark:bg-orange-500/10 px-4 py-3 text-sm text-orange-700 dark:text-orange-300">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  {language === 'ar' ? 'صلاحيات كاملة للمدير العام' : 'Platform Administrator Access Verified'}
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold px-4 py-3 text-sm transition-all duration-150 flex items-center gap-2 border border-slate-700 dark:border-slate-300 cursor-pointer shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>{language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
              </button>
            </div>
          </div>
        </div>

        {feedback ? (
          <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-500/10 px-4 py-3 text-sm text-orange-700 dark:text-orange-400 animate-pulse">
            {feedback}
          </div>
        ) : null}

        {/* Action Panel Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* Create Company */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Building2 className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-bold">{language === 'ar' ? 'تسجيل شركة جديدة (Tenant)' : 'Register a New Company (Tenant)'}</h2>
            </div>
            
            <form className="space-y-4" onSubmit={handleCreateCompany}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'اسم الشركة' : 'Company Name'}</span>
                  <input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-white" required />
                </label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'باقة الاشتراك' : 'Subscription Plan'}</span>
                  <select value={companyForm.plan} onChange={(e) => setCompanyForm({ ...companyForm, plan: e.target.value as Tenant['plan'] })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-white">
                    <option value="STARTER">Starter ($100/yr)</option>
                    <option value="PROFESSIONAL">Professional ($500/yr)</option>
                    <option value="ENTERPRISE">Enterprise ($1000/yr)</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</span>
                  <input type="date" value={companyForm.startDate} onChange={(e) => setCompanyForm({ ...companyForm, startDate: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</span>
                  <input type="date" value={companyForm.expiryDate} onChange={(e) => setCompanyForm({ ...companyForm, expiryDate: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'الحد الأقصى للمستخدمين' : 'Max Seat Limit'}</span>
                  <input type="number" min="1" value={companyForm.maxUsers} onChange={(e) => setCompanyForm({ ...companyForm, maxUsers: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-white" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'سعة التخزين (GB)' : 'Storage Limit (GB)'}</span>
                  <input type="number" min="1" value={companyForm.storageLimitGb} onChange={(e) => setCompanyForm({ ...companyForm, storageLimitGb: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                  <select value={companyForm.status} onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value as Tenant['status'] })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-white">
                    <option value="ACTIVE">Active</option>
                    <option value="TRIAL">Trial</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </label>
              </div>

              {/* Modules selector */}
              <div>
                <span className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? 'الوحدات المفعلة للشركة' : 'Enabled EHS Modules'}
                </span>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  {AVAILABLE_MODULES.map(m => {
                    const active = companyForm.enabledModules.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={active} 
                          onChange={() => toggleModuleInForm(m.id)}
                          className="rounded border-slate-300 dark:border-slate-800 text-orange-500 focus:ring-orange-500 h-3.5 w-3.5" 
                        />
                        <span>{language === 'ar' ? m.nameAr : m.nameEn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="mb-1.5 block">{language === 'ar' ? 'الوصف' : 'Description'}</span>
                <textarea value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-white" rows={2} />
              </label>

              <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition-colors w-full py-2.5 font-bold text-white text-sm">
                <PlusCircle className="h-4 w-4" />
                {language === 'ar' ? 'تسجيل الشركة وبدء تهيئة السيرفر' : 'Register Tenant Company'}
              </button>
            </form>
          </div>

          {/* Onboard User */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
              <Users2 className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-bold">{language === 'ar' ? 'حجز مستخدمين لشركة' : 'Onboard User for a Company'}</h2>
            </div>
            
            <form className="space-y-4" onSubmit={handleCreateUser}>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="mb-1.5 block">{language === 'ar' ? 'اختيار الشركة' : 'Select Company'}</span>
                <select value={userForm.tenantId} onChange={(e) => setUserForm({ ...userForm, tenantId: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-white" required>
                  <option value="">{language === 'ar' ? 'اختر شركة' : 'Choose a company'}</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </label>
              
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'الاسم بالإنجليزية' : 'Full Name (EN)'}</span>
                  <input value={userForm.fullNameEn} onChange={(e) => setUserForm({ ...userForm, fullNameEn: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-3 py-2 text-sm text-slate-800 dark:text-white" required />
                </label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'الاسم بالعربية' : 'Full Name (AR)'}</span>
                  <input value={userForm.fullNameAr} onChange={(e) => setUserForm({ ...userForm, fullNameAr: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-3 py-2 text-sm text-slate-800 dark:text-white" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</span>
                  <input value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-3 py-2 text-sm text-slate-800 dark:text-white" required />
                </label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="mb-1.5 block">{language === 'ar' ? 'كلمة المرور' : 'Password'}</span>
                  <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-3 py-2 text-sm text-slate-800 dark:text-white" required={!userForm.isCompanyAdmin} placeholder={userForm.isCompanyAdmin ? "admin (default)" : "••••••••"} />
                </label>
              </div>

              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="mb-1.5 block">{language === 'ar' ? 'رمز الموظف (ID)' : 'Employee Code / ID'}</span>
                <input value={userForm.empCode} onChange={(e) => setUserForm({ ...userForm, empCode: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-3 py-2 text-sm text-slate-800 dark:text-white" required />
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={Boolean(userForm.isCompanyAdmin)} 
                  onChange={(e) => setUserForm({ ...userForm, isCompanyAdmin: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-800 text-orange-500 h-4 w-4"
                />
                <span>{language === 'ar' ? 'تعيين كمدير للشركة (SUPER_ADMIN)' : 'Assign as Company Administrator (SUPER_ADMIN)'}</span>
              </label>

              <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors w-full py-2.5 font-bold text-white text-sm">
                <KeyRound className="h-4 w-4" />
                {language === 'ar' ? 'إنشاء حساب الموظف' : 'Onboard Company Employee'}
              </button>
            </form>
          </div>
        </div>

        {/* Tenant List Settings with inline editing */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <h2 className="text-lg font-bold">{language === 'ar' ? 'لوحة تنظيم الشركات المشتركة' : 'Subscribed Company Tenants Directory'}</h2>
            <span className="text-xs bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded text-slate-500 font-semibold font-mono">
              {companies.length} tenants • {users.length} users
            </span>
          </div>

          <div className="space-y-4">
            {companies.filter(Boolean).map((company) => {
              if (!company || !company.id) return null;
              const companyUsers = users.filter((user) => user && user.tenantId === company.id);
              const isEditing = editingCompanyId === company.id;
              
              return (
                <div key={company.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 dark:text-white">{company.name}</span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 font-bold font-mono">
                          ID: {company.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{company.description || (language === 'ar' ? 'شركة مسجلة على المنصة' : 'Registered tenant company')}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <>
                          <button 
                            onClick={() => startEditing(company)} 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'تعديل الإعدادات' : 'Edit settings'}</span>
                          </button>
                          <button 
                            onClick={() => onDeleteCompany(company.id)} 
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {isEditing && editCompanyState ? (
                    <div className="mt-4 p-4 border border-orange-200 dark:border-orange-950 bg-white dark:bg-slate-900 rounded-xl space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-orange-500">
                        {language === 'ar' ? 'إعدادات باقة الاشتراك والحدود' : 'Configure Plan Options & Boundaries'}
                      </h4>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-xs font-semibold text-slate-500">
                          <span className="mb-1 block">{language === 'ar' ? 'الباقة' : 'Plan'}</span>
                          <select 
                            value={editCompanyState.plan} 
                            onChange={(e) => setEditCompanyState({ ...editCompanyState, plan: e.target.value as Tenant['plan'] })}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-white"
                          >
                            <option value="STARTER">Starter</option>
                            <option value="PROFESSIONAL">Professional</option>
                            <option value="ENTERPRISE">Enterprise</option>
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          <span className="mb-1 block">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                          <select 
                            value={editCompanyState.status} 
                            onChange={(e) => setEditCompanyState({ ...editCompanyState, status: e.target.value as Tenant['status'] })}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-white"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="TRIAL">Trial</option>
                            <option value="SUSPENDED">Suspended</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="text-xs font-semibold text-slate-500">
                          <span className="mb-1 block">{language === 'ar' ? 'الحد الأقصى للمستخدمين' : 'Max Active Users'}</span>
                          <input 
                            type="number" 
                            value={editCompanyState.maxUsers} 
                            onChange={(e) => setEditCompanyState({ ...editCompanyState, maxUsers: Number(e.target.value) })}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-white"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          <span className="mb-1 block">{language === 'ar' ? 'سعة التخزين القصوى (GB)' : 'Max Storage (GB)'}</span>
                          <input 
                            type="number" 
                            value={editCompanyState.storageLimitGb || 5} 
                            onChange={(e) => setEditCompanyState({ ...editCompanyState, storageLimitGb: Number(e.target.value) })}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-white"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          <span className="mb-1 block">{language === 'ar' ? 'تاريخ انتهاء الاشتراك' : 'Subscription Expiry'}</span>
                          <input 
                            type="date" 
                            value={editCompanyState.expiryDate || ''} 
                            onChange={(e) => setEditCompanyState({ ...editCompanyState, expiryDate: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-white"
                          />
                        </label>
                      </div>

                      {/* Edit modules checkboxes */}
                      <div>
                        <span className="mb-2 block text-xs font-semibold text-slate-500">
                          {language === 'ar' ? 'تفعيل/تعطيل الوحدات' : 'Toggle System Modules'}
                        </span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850">
                          {AVAILABLE_MODULES.map(m => {
                            const active = (editCompanyState.enabledModules || []).includes(m.id);
                            return (
                              <label key={m.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={active} 
                                  onChange={() => toggleModuleInEdit(m.id)}
                                  className="rounded text-orange-500 h-3.5 w-3.5" 
                                />
                                <span>{language === 'ar' ? m.nameAr : m.nameEn}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={saveCompanySettings} 
                          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save settings'}</span>
                        </button>
                        <button 
                          onClick={cancelEditing} 
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'إلغاء' : 'Cancel'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Metric Badges for Subscriptions */
                    <div className="mt-3 grid gap-3 grid-cols-2 md:grid-cols-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center shadow-sm">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-tight">{language === 'ar' ? 'الباقة والحالة' : 'Plan & Status'}</span>
                        <span className="text-xs font-bold block text-slate-700 dark:text-slate-200 mt-1 flex items-center justify-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          {company.plan} • <span className={company.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'}>{company.status}</span>
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center shadow-sm">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-tight">{language === 'ar' ? 'نهاية الترخيص' : 'License Expiry'}</span>
                        <span className="text-xs font-bold block text-slate-700 dark:text-slate-200 mt-1">
                          {company.expiryDate || 'N/A'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center shadow-sm">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-tight">{language === 'ar' ? 'المقاعد المستغلة' : 'Seat Occupancy'}</span>
                        <span className="text-xs font-bold block text-slate-700 dark:text-slate-200 mt-1">
                          {companyUsers.length} / {company.maxUsers === UNLIMITED ? '∞' : company.maxUsers} {language === 'ar' ? 'موظف' : 'seats'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center shadow-sm">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-tight">{language === 'ar' ? 'استهلاك التخزين' : 'Storage Size'}</span>
                        <span className="text-xs font-bold block text-slate-700 dark:text-slate-200 mt-1 flex items-center justify-center gap-1">
                          <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{company.storageLimitGb === UNLIMITED ? '∞' : (company.storageLimitGb || 5)} GB</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Modules badges */}
                  {!isEditing && (
                    <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase me-">{language === 'ar' ? 'الوحدات المفتوحة:' : 'Enabled Modules:'}</span>
                      {(company.enabledModules || ['PTW']).map(mod => (
                        <span key={mod} className="text-[10px] bg-orange-100 dark:bg-orange-550/20 text-orange-700 dark:text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-200/40 dark:border-orange-500/10">
                          {mod}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Users of company */}
                  {!isEditing && (
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                        <Users2 className="w-3.5 h-3.5" />
                        <span className="font-bold">{language === 'ar' ? 'حسابات إدارة النظام التابعة للشركة:' : 'Company onboarded employee registry:'}</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {companyUsers.length > 0 ? companyUsers.map((user) => (
                          <div key={user.empCode} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 px-3 py-2 text-xs">
                            <div>
                              <div className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1">
                                <span>{user.fullNameEn}</span>
                                {user.customRole === 'SUPER_ADMIN' && (
                                  <span className="bg-orange-500/10 text-orange-500 px-1 rounded text-[8px] font-bold">Admin</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {user.username}@{(company.id || '').replace('tenant-', '')} • {user.empCode}
                              </div>
                            </div>
                            {user.username !== 'admin' && (
                              <button onClick={() => onDeleteUser(user.empCode)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" title={language === 'ar' ? 'حذف المستخدم' : 'Delete user'}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )) : (
                          <div className="sm:col-span-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-2 text-center text-xs text-slate-400">
                            {language === 'ar' ? 'لا يوجد مستخدمون مسجلون لهذه الشركة بعد.' : 'No users onboarded yet.'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: GLOBAL AUDIT LOGS DISPLAY */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-855 pb-4">
            <div>
              <div className="flex items-center gap-2 text-orange-500">
                <Activity className="h-5 w-5 animate-pulse" />
                <h2 className="text-lg font-bold">{language === 'ar' ? 'سجل العمليات العام (Audit Trail)' : 'Global Compliance Audit Trail'}</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ar' ? 'مراقبة فورية للعمليات الأمنية وتغيير كلمات المرور وتسجيل الدخول عبر المنصة.' : 'Real-time stream of all user activities and operations logged across tenants.'}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span>🔒 {language === 'ar' ? 'تم إيقاف كتابة السجلات في Firebase لحفظ المساحة وتقليل استهلاك Firestore' : 'Firebase Audit Logging Stopped to Conserve Storage & Quotas'}</span>
              </div>
            </div>

            {/* Logs Search & Filter UI */}
            <div className="flex flex-wrap gap-2 items-center">
              {onClearAuditLogs && (
                <button
                  type="button"
                  onClick={onClearAuditLogs}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  title={language === 'ar' ? 'تفريغ السجلات القديمة المخزنة' : 'Purge Firebase audit logs'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تفريغ سجلات Firebase القديمة 🗑️' : 'Purge Firebase Logs 🗑️'}</span>
                </button>
              )}
              <input 
                type="text" 
                placeholder={language === 'ar' ? 'بحث عن مستخدم أو عملية...' : 'Search user or action...'}
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-3 py-1.5 text-xs text-slate-800 dark:text-white w-48 font-sans"
              />
              <select
                value={auditTenantFilter}
                onChange={(e) => setAuditTenantFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-3 py-1.5 text-xs text-slate-800 dark:text-white font-sans"
              >
                <option value="">{language === 'ar' ? 'جميع الشركات' : 'All Companies'}</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-end text-xs text-slate-600 dark:text-slate-350" dir="ltr">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-250 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">{language === 'ar' ? 'الوقت' : 'Timestamp'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'الشركة' : 'Tenant ID'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'العملية' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                      {log.tenantName}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-orange-600 dark:text-orange-400">
                      {log.userName} ({log.userId})
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                      {language === 'ar' ? 'لا يوجد عمليات مسجلة متوافقة مع البحث.' : 'No audit records match the current filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
