/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Permit, SandboxRole, Incident, HiraAssessment, SafetyAudit, TrainingRecord, UserProfile, Language, Tenant } from './types';
import { USER_PROFILES } from './utils/initialData';
import { t, getLocalizedValue } from './utils/translations';
import { DEFAULT_TENANTS, canManageUsers, canApprovePermits, filterTenantRecords, getTenantDisplayName, getTenantFeatureHints, getTenantPlanLabel, isTenantActive, safeLocalStorageSetItem, safeLocalStorageGetItem } from './utils/saas';
import { 
 INITIAL_PERMITS_SEED, 
 INITIAL_INCIDENTS, 
 INITIAL_HIRAS, 
 INITIAL_AUDITS, 
 INITIAL_TRAINING 
} from './utils/initialEhsData';
import { Dashboard } from './components/Dashboard';
import { PermitDetail } from './components/PermitDetail';
import { PermitForm } from './components/PermitForm';
import { PermitFormV2 } from './components/PermitFormV2';
import { LoginScreen } from './components/LoginScreen';
import { CompanyDashboard } from './components/CompanyDashboard';
import { CompanyBillingAnalytics } from './components/CompanyBillingAnalytics';
import { NotificationsPanel } from './components/NotificationsPanel';
import { PushNotificationService } from './utils/pushNotificationService';
import { DeviceNotificationOverlay } from './components/DeviceNotificationOverlay';
import { SafetyAiCopilot } from './components/SafetyAiCopilot';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded Core EHS Modules for optimized initial bundle loading
const AdminConsole = React.lazy(() => import('./components/AdminConsole').then(m => ({ default: m.AdminConsole })));
const IncidentManager = React.lazy(() => import('./components/IncidentManager').then(m => ({ default: m.IncidentManager })));
const HiraManager = React.lazy(() => import('./components/HiraManager').then(m => ({ default: m.HiraManager })));
const AuditManager = React.lazy(() => import('./components/AuditManager').then(m => ({ default: m.AuditManager })));
const TrainingManager = React.lazy(() => import('./components/TrainingManager').then(m => ({ default: m.TrainingManager })));
const UserManager = React.lazy(() => import('./components/UserManager').then(m => ({ default: m.UserManager })));
const PlatformPerformance = React.lazy(() => import('./components/PlatformPerformance').then(m => ({ default: m.PlatformPerformance })));

const LoadingSpinner: React.FC<{ language?: Language }> = ({ language = 'ar' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-500">
    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs font-bold">{language === 'ar' ? 'جاري تحميل وحدة النظام...' : 'Loading module...'}</span>
  </div>
);

// Firebase Helpers
import {
 isFirebaseConfigured,
 dbGetUsers,
 dbSaveUser,
 dbSaveUsersBatch,
 dbDeleteUser,
 dbGetPermits,
 dbSavePermit,
 dbSavePermitTransactional,
 dbSavePermitsBatch,
 dbDeletePermit,
 dbGetIncidents,
 dbSaveIncident,
 dbSaveIncidentsBatch,
 dbDeleteIncident,
 dbGetHiras,
 dbSaveHira,
 dbSaveHirasBatch,
 dbDeleteHira,
 dbGetAudits,
 dbSaveAudit,
 dbSaveAuditsBatch,
 dbDeleteAudit,
 dbGetTrainings,
 dbSaveTraining,
 dbSaveTrainingsBatch,
 dbDeleteTraining,
 dbGetTenants,
 dbSaveTenant,
 dbSaveTenantsBatch,
 dbDeleteTenant,
 hashPassword,
 setUserPasswordSecure,
 dbLogActivity,
 dbGetAuditLogs,
 dbClearAuditLogs
} from "./utils/firebase";

import {
 isSubscriptionExpired,
 hasReachedUserLimit,
 hasReachedStorageLimit,
 isModuleEnabled,
 UNLIMITED
} from "./utils/subscriptions";

import { SaaSAuditLogEntry } from "./types";


import { 
 ShieldAlert, Wrench, Factory, Activity, CheckCircle, 
 Clock, Flame, Construction, HelpCircle, FileStack, LogOut, Globe,
 Shield, ClipboardCheck, GraduationCap, Brain, Users, Lock as LockIcon, Settings
} from 'lucide-react';
import { motion } from 'motion/react';

type EhsTab = 'PERMITS' | 'INCIDENTS' | 'HIRA' | 'AUDITS' | 'TRAINING' | 'AI_COPILOT' | 'USERS' | 'PERFORMANCE';

const SEED_HASH_ADMIN = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
const SEED_HASH_123 = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

const DEFAULT_USERS_SEED: UserProfile[] = [
 {
 empCode: 'ADMIN01',
 password: SEED_HASH_ADMIN,
 sandboxRole: 'HSE',
 customRole: 'SAFETY_MANAGER',
 username: 'admin',
 fullNameAr: 'مدير النظام (admin)',
 fullNameEn: 'System Administrator (admin)',
 roleAr: 'مدير النظام',
 roleEn: 'System Administrator',
 departmentAr: 'إدارة السلامة والصحة المهنية',
 departmentEn: 'Safety & Occupational Health Administration (HSE)',
 canCreatePermit: true,
 canApproveElectrical: true,
 canApproveProduction: true,
 canApproveSafety: true
 },
 {
 empCode: 'EMP101',
 password: SEED_HASH_123,
 sandboxRole: 'REQUESTER',
 customRole: 'EMPLOYEE',
 username: 'ahmad_eng',
 fullNameAr: 'م. أحمد المنفذ',
 fullNameEn: 'Eng. Ahmed Al-Monafed',
 roleAr: 'مشرف الفريق المنفذ',
 roleEn: 'Maintenance Engineer',
 departmentAr: 'إدارة الصيانة',
 departmentEn: 'Maintenance Administration'
 },
 {
 empCode: 'EMP102',
 password: SEED_HASH_123,
 sandboxRole: 'PRODUCTION',
 customRole: 'PRODUCTION_DEPT',
 username: 'turki_prod',
 fullNameAr: 'م. تركي اليوسف',
 fullNameEn: 'Eng. Turki Al-Yousef',
 roleAr: 'مدير إدارة التشغيل والتحكم (الإنتاج)',
 roleEn: 'Production Manager',
 departmentAr: 'إدارة الإنتاج والتشغيل',
 departmentEn: 'Production & Operations Administration'
 },
 {
 empCode: 'EMP103',
 password: SEED_HASH_123,
 sandboxRole: 'ELECTRICAL',
 customRole: 'ELECTRICAL_DEPT',
 username: 'ali_elec',
 fullNameAr: 'م. علي عبد الله',
 fullNameEn: 'Eng. Ali Abdullah',
 roleAr: 'رئيس إدارة الكهرباء والـ LOTO',
 roleEn: 'Electrical Manager',
 departmentAr: 'إدارة الكهرباء',
 departmentEn: 'Electrical Administration'
 },
 {
 empCode: 'EMP104',
 password: SEED_HASH_123,
 sandboxRole: 'HSE',
 customRole: 'SAFETY_SUPERVISOR',
 username: 'asaad_hse',
 fullNameAr: 'م. أسعد الشمراني',
 fullNameEn: 'Eng. Asaad Al-Shamrani',
 roleAr: 'مشرف سيفيتي (HSE Inspector)',
 roleEn: 'HSE Safety Supervisor',
 departmentAr: 'إدارة السلامة والصحة المهنية',
 departmentEn: 'Safety & Occupational Health Administration (HSE)'
 },
 {
 empCode: 'EMP105',
 password: SEED_HASH_123,
 sandboxRole: 'HSE',
 customRole: 'SAFETY_MANAGER',
 username: 'samer_mgr',
 fullNameAr: 'م. سامر الأحمد',
 fullNameEn: 'Eng. Samer Al-Ahmad',
 roleAr: 'مدير سيفيتي المعتمد (HSE Manager)',
 roleEn: 'EHS Safety Manager',
 departmentAr: 'إدارة السلامة والصحة المهنية',
 departmentEn: 'Safety & Occupational Health Administration (HSE)'
 }
];

export default function App() {
 const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(() => {
 return localStorage.getItem('ehs_is_logged_in') === 'true';
 });
 const [permits, setPermits] = React.useState<Permit[]>([]);
 const [selectedPermitId, setSelectedPermitId] = React.useState<string | null>(null);
 const [users, setUsers] = React.useState<UserProfile[]>([]);
 const [currentUser, setCurrentUser] = React.useState<UserProfile>(() => {
 const stored = localStorage.getItem('ehs_current_user');
 return stored ? JSON.parse(stored) : {
 empCode: 'EMP101',
 password: '123',
 sandboxRole: 'REQUESTER',
 customRole: 'EMPLOYEE',
 username: 'ahmad_eng',
 fullNameAr: 'م. أحمد المنفذ',
 fullNameEn: 'Eng. Ahmed Al-Monafed',
 roleAr: 'مشرف الفريق المنفذ',
 roleEn: 'Maintenance Engineer',
 departmentAr: 'إدارة الصيانة',
 departmentEn: 'Maintenance Administration',
 tenantId: 'tenant-demo',
 permissions: ['permits.create', 'permits.view']
 };
 });
 const [activeTenant, setActiveTenant] = React.useState<Tenant>(() => {
 const stored = localStorage.getItem('ehs_active_tenant');
 return stored ? JSON.parse(stored) : DEFAULT_TENANTS[0];
 });
 const [currentRole, setCurrentRole] = React.useState<SandboxRole>(() => {
 return (localStorage.getItem('ehs_current_role') as SandboxRole) || 'REQUESTER';
 });
 const [language, setLanguage] = React.useState<Language>('ar');
 const [isCreating, setIsCreating] = React.useState<boolean>(false);
 const [prefilledHira, setPrefilledHira] = React.useState<HiraAssessment | null>(null);
 const [currentTime, setCurrentTime] = React.useState<string>('');
 const [tenants, setTenants] = React.useState<Tenant[]>(DEFAULT_TENANTS);
 const [auditLogs, setAuditLogs] = React.useState<SaaSAuditLogEntry[]>([]);
 const [isAdminMode, setIsAdminMode] = React.useState<boolean>(() => {
 return localStorage.getItem('ehs_is_admin_mode') === 'true';
 });
 const [isCompanyDashboardMode, setIsCompanyDashboardMode] = React.useState<boolean>(() => {
 return localStorage.getItem('ehs_is_company_dashboard_mode') === 'true';
 });
 const [isBillingAnalyticsMode, setIsBillingAnalyticsMode] = React.useState<boolean>(() => {
 return localStorage.getItem('ehs_is_billing_analytics_mode') === 'true';
 });
 const [currentPath, setCurrentPath] = React.useState(() => window.location.pathname + window.location.search);

 React.useEffect(() => {
 localStorage.setItem('ehs_is_logged_in', String(isLoggedIn));
 localStorage.setItem('ehs_current_user', JSON.stringify(currentUser));
 localStorage.setItem('ehs_active_tenant', JSON.stringify(activeTenant));
 localStorage.setItem('ehs_current_role', currentRole);
 localStorage.setItem('ehs_is_admin_mode', String(isAdminMode));
 localStorage.setItem('ehs_is_company_dashboard_mode', String(isCompanyDashboardMode));
 localStorage.setItem('ehs_is_billing_analytics_mode', String(isBillingAnalyticsMode));
 }, [isLoggedIn, currentUser, activeTenant, currentRole, isAdminMode, isCompanyDashboardMode, isBillingAnalyticsMode]);

 React.useEffect(() => {
 const handlePopState = () => {
 setCurrentPath(window.location.pathname + window.location.search);
 };
 window.addEventListener('popstate', handlePopState);
 return () => window.removeEventListener('popstate', handlePopState);
 }, []);

 // Sync RTL direction globally with the document root
 React.useEffect(() => {
   document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
   document.documentElement.lang = language;
 }, [language]);

 // Added EHS Module Persistence States
 const [activeTab, setActiveTab] = React.useState<EhsTab>('PERMITS');

 React.useEffect(() => {
 if (!isLoggedIn) return;
 const tabModules: Record<string, string> = {
 'PERMITS': 'PTW',
 'INCIDENTS': 'INCIDENT',
 'HIRA': 'HIRA',
 'AUDITS': 'AUDIT',
 };
 const targetModule = tabModules[activeTab];
 if (targetModule && !isModuleEnabled(activeTenant, targetModule)) {
 if (isModuleEnabled(activeTenant, 'PTW')) {
 setActiveTab('PERMITS');
 } else if (isModuleEnabled(activeTenant, 'INCIDENT')) {
 setActiveTab('INCIDENTS');
 } else if (isModuleEnabled(activeTenant, 'HIRA')) {
 setActiveTab('HIRA');
 } else if (isModuleEnabled(activeTenant, 'AUDIT')) {
 setActiveTab('AUDITS');
 } else {
 setActiveTab('TRAINING');
 }
 }
 }, [activeTenant, activeTab, isLoggedIn]);

 // Guards the tenant-data-loading effect below against out-of-order responses: if the
 // effect re-fires (e.g. currentUser and activeTenant both change within moments of login)
 // before an earlier run's Firestore reads have resolved, the earlier run's results are
 // discarded instead of overwriting the newer, more relevant state.
 const latestLoadRequestRef = React.useRef(0);

 const [incidents, setIncidents] = React.useState<Incident[]>([]);
 const [hiras, setHiras] = React.useState<HiraAssessment[]>([]);
 const [audits, setAudits] = React.useState<SafetyAudit[]>([]);
 const [trainings, setTrainings] = React.useState<TrainingRecord[]>([]);

 const isExpired = isSubscriptionExpired(activeTenant);
 const isSubscriptionBlocked = isExpired && activeTenant.plan !== 'ENTERPRISE';
 const isSubscriptionReadOnly = isExpired && activeTenant.plan === 'ENTERPRISE';

 const checkReadOnly = () => {
 if (isSubscriptionReadOnly && currentUser?.customRole !== 'PLATFORM_ADMIN') {
 alert(language === 'ar' 
 ? '⚠️ لا يمكن إجراء تعديلات. باقة الاشتراك منتهية والنظام في وضع القراءة فقط.' 
 : '⚠️ Cannot make changes. Subscription is expired and system is in Read-Only Mode.');
 return true;
 }
 return false;
 };

 // Register active user to push notifications service
 React.useEffect(() => {
 if (isLoggedIn && currentUser) {
 PushNotificationService.subscribeUser(
 currentUser.empCode, 
 currentUser.username, 
 currentUser.roleEn || '', 
 currentUser.roleAr || ''
 );
 
 // Proactively request browser native notification permission
 PushNotificationService.requestPermission();
 }
 }, [isLoggedIn, currentUser]);

 const saveTenantsState = (updatedList: Tenant[]) => {
 setTenants(updatedList);
 if (!isFirebaseConfigured) {
 safeLocalStorageSetItem('ehs_tenants_local', JSON.stringify(updatedList));
 }
 };

 const handleCreateCompany = async (company: Tenant) => {
 const updated = [company, ...tenants];
 saveTenantsState(updated);
 setActiveTenant(company);

 // Automatically create a company administrator for the new company
 const companyCode = company.id.toUpperCase().replace('TENANT-', '');
 const companyUsername = company.id.toLowerCase().replace('tenant-', '');
 // Offline/local-demo mode only: when Firebase is configured, the actual password is set
 // afterwards via the secure backend endpoint (see below) — never hashed/written client-side.
 const adminHashedPassword = isFirebaseConfigured ? '' : await hashPassword('admin');
 const autoAdmin: UserProfile = {
 empCode: `ADM-${companyCode}`,
 username: `${companyUsername}_admin`,
 password: adminHashedPassword,
 mustChangePassword: true, // force password change on first login
 sandboxRole: 'HSE',
 customRole: 'SUPER_ADMIN',
 fullNameAr: `مدير شركة ${company.name}`,
 fullNameEn: `${company.name} Administrator`,
 roleAr: 'مدير الشركة',
 roleEn: 'Company Administrator',
 departmentAr: 'إدارة النظام',
 departmentEn: 'System Administration',
 tenantId: company.id,
 permissions: ['permits.create', 'permits.view', 'permits.approve', 'users.manage', 'tenants.view']
 };

 // Seed standard employees for this new company so the staff list is not empty
 const standardStaff = DEFAULT_USERS_SEED
   .filter(u => u.username !== 'admin') // skip the global admin
   .map(u => ({
     ...u,
     empCode: `${u.empCode}-${companyCode}`,
     username: `${u.username}_${companyUsername}`,
     tenantId: company.id
   }));

 const updatedUsers = [autoAdmin, ...standardStaff, ...users];
 saveUsersState(updatedUsers);

  if (isFirebaseConfigured) {
    const success = await dbSaveTenant(company);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حفظ الشركة في Firebase!' : '⚠️ Failed to save company to Firebase!');
    }
    await dbSaveUsersBatch([autoAdmin, ...standardStaff]);
    // Passwords are set via the admin-only backend endpoint, never written to Firestore
    // directly. Default seed passwords ('admin' / '123') carry mustChangePassword: true.
    await setUserPasswordSecure(company.id, autoAdmin.empCode, 'admin', true);
    for (const staff of standardStaff) {
      await setUserPasswordSecure(company.id, staff.empCode, '123', true);
    }
  }

  await dbLogActivity({
    userId: currentUser?.empCode || 'system',
    userName: currentUser?.fullNameEn || 'System',
    tenantId: 'system',
    tenantName: 'System Platform',
    action: `Create Company Tenant (${company.id}) - Plan: ${company.plan}`
  });
};

 const handleUpgradeCompanyPlan = async (companyId: string, plan: Tenant['plan']) => {
 const updated = tenants.map((tenant) => tenant.id === companyId ? { ...tenant, plan } : tenant);
 saveTenantsState(updated);
 if (activeTenant && activeTenant.id === companyId) {
 setActiveTenant({ ...activeTenant, plan });
 }
 if (isFirebaseConfigured) {
 const target = updated.find(t => t.id === companyId);
 if (target) {
 const success = await dbSaveTenant(target);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل تحديث اشتراك الشركة في Firebase!' : '⚠️ Failed to update company plan in Firebase!');
 }
 }
 }

 const companyObj = tenants.find(t => t.id === companyId);
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId: companyId,
 tenantName: companyObj?.name || 'Company',
 action: `Upgrade Plan to ${plan}`
 });
 };

 const handleUpdateCompany = async (updatedCompany: Tenant) => {
 const updated = tenants.map((tenant) => tenant.id === updatedCompany.id ? updatedCompany : tenant);
 saveTenantsState(updated);
 if (activeTenant && activeTenant.id === updatedCompany.id) {
 setActiveTenant(updatedCompany);
 }
 if (isFirebaseConfigured) {
 await dbSaveTenant(updatedCompany);
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId: updatedCompany.id,
 tenantName: updatedCompany.name,
 action: `Update Company Properties`
 });
 };

 const handleDeleteCompany = async (companyId: string) => {
 const confirmDelete = window.confirm(language === 'ar' 
 ? 'هل أنت متأكد من حذف هذه الشركة نهائياً مع كافة مستخدميها؟' 
 : 'Are you sure you want to permanently delete this company along with all its users?');
 if (!confirmDelete) return;

 const updated = tenants.filter((tenant) => tenant.id !== companyId);
 saveTenantsState(updated);
 if (isFirebaseConfigured) {
 await dbDeleteTenant(companyId);
 }

 // Delete users belonging to this tenant
 const remainingUsers = users.filter(u => u.tenantId !== companyId);
 setUsers(remainingUsers);

 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId: 'system',
 tenantName: 'System Platform',
 action: `Delete Company Tenant (${companyId})`
 });
 };

 const handleCreateUser = async (user: UserProfile) => {
 const selectedTenant = tenants.find((tenant) => tenant.id === user.tenantId);
 const currentTenantUsers = users.filter((entry) => entry.tenantId === user.tenantId);
 if (selectedTenant && selectedTenant.maxUsers !== UNLIMITED && currentTenantUsers.length >= selectedTenant.maxUsers) {
 alert(language === 'ar' ? '⚠️ تم الوصول إلى الحد الأقصى للمستخدمين لهذه الشركة!' : '⚠️ Maximum user limit reached for this company!');
 return;
 }

 const plainPassword = user.password || '123';
 const userWithHashedPassword = {
 ...user,
 password: isFirebaseConfigured ? '' : await hashPassword(plainPassword)
 };

 const updated = [userWithHashedPassword, ...users];
 saveUsersState(updated);
 if (user.tenantId) {
 setCurrentUser((prev) => ({ ...prev, tenantId: user.tenantId, permissions: user.permissions ?? prev.permissions }));
 }

 if (isFirebaseConfigured) {
 const success = await dbSaveUser(userWithHashedPassword);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حفظ الموظف في Firebase!' : '⚠️ Failed to save employee to Firebase!');
 }
 const pwResult = await setUserPasswordSecure(user.tenantId || 'tenant-demo', user.empCode, plainPassword, user.mustChangePassword ?? true);
 if (!pwResult.success) {
 alert(language === 'ar' ? `⚠️ فشل تعيين كلمة المرور: ${pwResult.error || ''}` : `⚠️ Failed to set password: ${pwResult.error || ''}`);
 }
 }
 };

const handleSwitchTenant = (tenantId: string) => {
 const nextTenant = tenants.find((tenant) => tenant.id === tenantId) || activeTenant;
 if (nextTenant) {
 setActiveTenant(nextTenant);
 setCurrentUser((prev) => ({ ...prev, tenantId: nextTenant.id }));
 setIsCompanyDashboardMode(false);
 setIsBillingAnalyticsMode(false);
 setActiveTab('PERMITS');
 }
 };

  const handleAutoSwitchUser = (targetUser: UserProfile, permitId: string) => {
    // Switch the logged-in user profile & role
    setCurrentUser(targetUser);
    setCurrentRole(targetUser.sandboxRole || 'REQUESTER');
    
    // Switch view context directly to the targeted permit
    setIsCreating(false);
    setActiveTab('PERMITS');
    setSelectedPermitId(permitId);
  };

  // 1. Initial Tenants Loading & Time Clock
  React.useEffect(() => {
    async function initTenants() {
      if (isFirebaseConfigured) {
        try {
          const dbTenants = await dbGetTenants();
          if (dbTenants && dbTenants.length > 0) {
            setTenants(dbTenants);
            const firstActive = dbTenants.find(t => t.status === 'ACTIVE' || t.status === 'TRIAL') || dbTenants[0];
            if (firstActive) setActiveTenant(firstActive);
          } else {
            loadTenantsInMemory();
          }
        } catch (error) {
          console.error("Failed to load tenants from Firebase:", error);
          loadTenantsInMemory();
        }
      } else {
        loadTenantsInMemory();
      }
    }

    function loadTenantsInMemory() {
      const stored = localStorage.getItem('ehs_tenants_local');
      if (stored) {
        const tenantList = JSON.parse(stored);
        setTenants(tenantList);
        const firstActive = tenantList.find((t: Tenant) => t.status === 'ACTIVE' || t.status === 'TRIAL') || tenantList[0];
        if (firstActive) setActiveTenant(firstActive);
      } else {
        setTenants(DEFAULT_TENANTS);
        safeLocalStorageSetItem('ehs_tenants_local', JSON.stringify(DEFAULT_TENANTS));
        const firstActive = DEFAULT_TENANTS.find(t => t.status === 'ACTIVE' || t.status === 'TRIAL') || DEFAULT_TENANTS[0];
        if (firstActive) setActiveTenant(firstActive);
      }
    }

    initTenants();

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('ar-SA', { hour12: false }) + ' (UTC)');
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. Dynamic Tenant-Scoped Data Loading
  React.useEffect(() => {
    let isMounted = true;
    const requestId = ++latestLoadRequestRef.current;
    const isStale = () => !isMounted || requestId !== latestLoadRequestRef.current;

    async function loadTenantData() {
      if (!isLoggedIn || !currentUser) {
        if (isStale()) return;
        setUsers([]); setPermits([]); setIncidents([]); setHiras([]); setAudits([]); setTrainings([]);
        return;
      }

      if (isFirebaseConfigured) {
        try {
          let targetTenantIds: string[] = [];
          if (currentUser.username === 'admin') {
            targetTenantIds = tenants.map(t => t.id);
          } else {
            targetTenantIds = [currentUser.tenantId || 'tenant-demo'];
          }

          // Fetched in parallel rather than sequentially — six independent Firestore reads
          // awaited one at a time was six round-trips end-to-end for no benefit.
          const [dbUsers, dbPermits, dbIncidents, dbHiras, dbAudits, dbTrainings] = await Promise.all([
            dbGetUsers(targetTenantIds),
            dbGetPermits(targetTenantIds),
            dbGetIncidents(targetTenantIds),
            dbGetHiras(targetTenantIds),
            dbGetAudits(targetTenantIds),
            dbGetTrainings(targetTenantIds),
          ]);

          if (isStale()) return;

          if (dbUsers) {
            let userList = dbUsers;
            if (userList.length === 0 && currentUser.username === 'admin') {
              userList = DEFAULT_USERS_SEED;
              await dbSaveUsersBatch(DEFAULT_USERS_SEED);
              // Seed passwords via the secure backend endpoint (never written to Firestore
              // directly by the client). Matches the legacy seed convention: 'admin' for the
              // system administrator account, '123' for everyone else — all forced to rotate.
              for (const seedUser of DEFAULT_USERS_SEED) {
                const seedPassword = seedUser.username === 'admin' ? 'admin' : '123';
                await setUserPasswordSecure(seedUser.tenantId || 'tenant-demo', seedUser.empCode, seedPassword, true);
              }
            }
            setUsers(userList);
          } else {
            loadUsersInMemory();
          }

          if (dbPermits) {
            let permitList = dbPermits;
            if (permitList.length === 0 && currentUser.username === 'admin') {
              permitList = INITIAL_PERMITS_SEED;
              await dbSavePermitsBatch(INITIAL_PERMITS_SEED);
            }
            setPermits(permitList);
            safeLocalStorageSetItem('ehs_permits_local', JSON.stringify(permitList));
          } else {
            loadPermitsInMemory();
          }

          if (dbIncidents) {
            let incidentList = dbIncidents;
            if (incidentList.length === 0 && currentUser.username === 'admin') {
              incidentList = INITIAL_INCIDENTS;
              await dbSaveIncidentsBatch(INITIAL_INCIDENTS);
            }
            setIncidents(incidentList);
            safeLocalStorageSetItem('ehs_incidents_local', JSON.stringify(incidentList));
          } else {
            loadIncidentsInMemory();
          }

          if (dbHiras) {
            let hiraList = dbHiras;
            if (hiraList.length === 0 && currentUser.username === 'admin') {
              hiraList = INITIAL_HIRAS;
              await dbSaveHirasBatch(INITIAL_HIRAS);
            }
            setHiras(hiraList);
            safeLocalStorageSetItem('ehs_hiras_local', JSON.stringify(hiraList));
          } else {
            loadHirasInMemory();
          }

          if (dbAudits) {
            let auditList = dbAudits;
            if (auditList.length === 0 && currentUser.username === 'admin') {
              auditList = INITIAL_AUDITS;
              await dbSaveAuditsBatch(INITIAL_AUDITS);
            }
            setAudits(auditList);
          } else {
            loadAuditsInMemory();
          }

          if (dbTrainings) {
            let trainingList = dbTrainings;
            if (trainingList.length === 0 && currentUser.username === 'admin') {
              trainingList = INITIAL_TRAINING;
              await dbSaveTrainingsBatch(INITIAL_TRAINING);
            }
            setTrainings(trainingList);
          } else {
            loadTrainingsInMemory();
          }

          if (currentUser.customRole === 'PLATFORM_ADMIN' || currentUser.username === 'admin') {
            const logs = await dbGetAuditLogs();
            if (logs && !isStale()) setAuditLogs(logs);
          } else if (currentUser.customRole === 'SUPER_ADMIN') {
            const logs = await dbGetAuditLogs(currentUser.tenantId);
            if (logs && !isStale()) setAuditLogs(logs);
          }
        } catch (error) {
          console.error("Failed to load Firebase data, falling back to in-memory seeds", error);
          if (!isStale()) loadAllInMemory();
        }
      } else {
        if (!isStale()) loadAllInMemory();
      }
    }

    loadTenantData();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, currentUser?.empCode, currentUser?.tenantId, tenants]);

 const handleAdminDeleteUser = async (empCode: string) => {
 const userToDelete = users.find(u => u.empCode === empCode);
 const tenantId = userToDelete?.tenantId || '';
 const updated = users.filter((entry) => entry.empCode !== empCode);
 saveUsersState(updated);

 if (isFirebaseConfigured && tenantId) {
 const success = await dbDeleteUser(empCode, tenantId);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حذف الموظف من Firebase!' : '⚠️ Failed to delete employee from Firebase!');
 }
 }
 };

 function loadUsersInMemory() {
 const stored = localStorage.getItem('ehs_users_local');
 if (stored) {
 setUsers(JSON.parse(stored));
 } else {
 let userList = [...DEFAULT_USERS_SEED];
 const hasAdmin = userList.some((u: any) => u.username === 'admin');
 if (!hasAdmin) {
 userList.unshift({
 empCode: 'ADMIN01',
 password: 'admin',
 sandboxRole: 'HSE',
 customRole: 'SAFETY_MANAGER',
 username: 'admin',
 fullNameAr: 'مدير النظام (admin)',
 fullNameEn: 'System Administrator (admin)',
 roleAr: 'مدير النظام',
 roleEn: 'System Administrator',
 departmentAr: 'إدارة السلامة والصحة المهنية',
 departmentEn: 'Safety & Occupational Health Administration (HSE)',
 canCreatePermit: true,
 canApproveElectrical: true,
 canApproveProduction: true,
 canApproveSafety: true
 });
 }
 setUsers(userList);
 safeLocalStorageSetItem('ehs_users_local', JSON.stringify(userList));
 }
 }

 function loadPermitsInMemory() {
 const stored = safeLocalStorageGetItem<Permit[] | null>('ehs_permits_local', null);
 if (stored) {
 setPermits(stored);
 } else {
 setPermits(INITIAL_PERMITS_SEED);
 safeLocalStorageSetItem('ehs_permits_local', JSON.stringify(INITIAL_PERMITS_SEED));
 }
 }

 function loadIncidentsInMemory() {
 const stored = safeLocalStorageGetItem<Incident[] | null>('ehs_incidents_local', null);
 if (stored) {
 setIncidents(stored);
 } else {
 setIncidents(INITIAL_INCIDENTS);
 safeLocalStorageSetItem('ehs_incidents_local', JSON.stringify(INITIAL_INCIDENTS));
 }
 }

 function loadHirasInMemory() {
 const stored = safeLocalStorageGetItem<HiraAssessment[] | null>('ehs_hiras_local', null);
 if (stored) {
 setHiras(stored);
 } else {
 setHiras(INITIAL_HIRAS);
 safeLocalStorageSetItem('ehs_hiras_local', JSON.stringify(INITIAL_HIRAS));
 }
 }

 function loadAuditsInMemory() {
 const stored = safeLocalStorageGetItem<SafetyAudit[] | null>('ehs_audits_local', null);
 if (stored) {
 setAudits(stored);
 } else {
 setAudits(INITIAL_AUDITS);
 safeLocalStorageSetItem('ehs_audits_local', JSON.stringify(INITIAL_AUDITS));
 }
 }

 function loadTrainingsInMemory() {
 const stored = safeLocalStorageGetItem<TrainingRecord[] | null>('ehs_trainings_local', null);
 if (stored) {
 setTrainings(stored);
 } else {
 setTrainings(INITIAL_TRAINING);
 safeLocalStorageSetItem('ehs_trainings_local', JSON.stringify(INITIAL_TRAINING));
 }
 }

 function loadAllInMemory() {
 loadUsersInMemory();
 loadPermitsInMemory();
 loadIncidentsInMemory();
 loadHirasInMemory();
 loadAuditsInMemory();
 loadTrainingsInMemory();
 }

 // Secure redirect: Prevent non-admin users from accessing the USERS tab
 React.useEffect(() => {
 if (activeTab === 'USERS' && (!currentUser || !canManageUsers(currentUser))) {
 setActiveTab('PERMITS');
 }
 }, [activeTab, currentUser]);

 const handleLogout = async () => {
 if (currentUser) {
 await dbLogActivity({
 userId: currentUser.empCode,
 userName: currentUser.fullNameEn,
 tenantId: activeTenant?.id || 'system',
 tenantName: activeTenant?.name || 'System',
 action: 'Logout'
 });
 }
 setIsLoggedIn(false);
 if (isAdminMode) {
 window.history.pushState({}, '', '/?portal=super-admin');
 } else {
 window.history.pushState({}, '', '/');
 }
 setCurrentPath(window.location.pathname + window.location.search);
 };

 const saveUsersState = (updatedList: UserProfile[]) => {
 setUsers(updatedList);
 if (!isFirebaseConfigured) {
 safeLocalStorageSetItem('ehs_users_local', JSON.stringify(updatedList));
 }
 };

 const handleAddUser = async (newUser: UserProfile) => {
 if (checkReadOnly()) return;
 const tenantId = newUser.tenantId || currentUser?.tenantId || 'tenant-demo';
 
 // Plan User Limit Validation
 const currentTenantUsers = users.filter((entry) => entry.tenantId === tenantId);
 const targetTenant = tenants.find(t => t.id === tenantId) || activeTenant;
 if (targetTenant && hasReachedUserLimit(targetTenant, currentTenantUsers.length)) {
 alert(language === 'ar' 
 ? '⚠️ تم الوصول إلى الحد الأقصى للمستخدمين لهذه الشركة طبقاً لباقة الاشتراك الخاصة بها!' 
 : '⚠️ Maximum user limit reached for this company based on their subscription plan!');
 return;
 }

 const plainPassword = newUser.password || '123';
 const userWithTenant = {
 ...newUser,
 // Offline/local-demo mode only: in Firebase mode the password is set via the secure
 // backend endpoint below, never hashed or written client-side.
 password: isFirebaseConfigured ? '' : await hashPassword(plainPassword),
 tenantId,
 mustChangePassword: newUser.mustChangePassword ?? true
 };

 const updated = [...users, userWithTenant];
 saveUsersState(updated);

 if (isFirebaseConfigured) {
 const success = await dbSaveUser(userWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حفظ المستخدم في Firebase!' : '⚠️ Failed to save user to Firebase!');
 }
 const pwResult = await setUserPasswordSecure(tenantId, newUser.empCode, plainPassword, userWithTenant.mustChangePassword);
 if (!pwResult.success) {
 alert(language === 'ar' ? `⚠️ فشل تعيين كلمة المرور: ${pwResult.error || ''}` : `⚠️ Failed to set password: ${pwResult.error || ''}`);
 }
 }

 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId: tenantId,
 tenantName: targetTenant?.name || 'System',
 action: `Add User (${newUser.username})`
 });
 };

 const handleUpdateUser = async (updatedUser: UserProfile) => {
 if (checkReadOnly()) return;
 const tenantId = updatedUser.tenantId || currentUser?.tenantId || 'tenant-demo';
 const userWithTenant = { ...updatedUser, tenantId };

 // A value under 30 chars means the form carried a freshly-typed plaintext password
 // (existing hashes are much longer), as opposed to an unmodified, already-hashed value.
 const isPasswordChange = !!updatedUser.password && updatedUser.password.length < 30;
 const plainPassword = updatedUser.password;

 if (isPasswordChange) {
 // Offline/local-demo mode only — the Firebase path sets it via the secure endpoint below.
 userWithTenant.password = isFirebaseConfigured ? '' : await hashPassword(plainPassword!);
 }

 const updated = users.map(u => u.empCode === updatedUser.empCode ? userWithTenant : u);
 saveUsersState(updated);

 if (isFirebaseConfigured) {
 const success = await dbSaveUser(userWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل تحديث المستخدم في Firebase!' : '⚠️ Failed to update user to Firebase!');
 }
 if (isPasswordChange && plainPassword) {
 const pwResult = await setUserPasswordSecure(tenantId, updatedUser.empCode, plainPassword, updatedUser.mustChangePassword ?? false);
 if (!pwResult.success) {
 alert(language === 'ar' ? `⚠️ فشل تحديث كلمة المرور: ${pwResult.error || ''}` : `⚠️ Failed to update password: ${pwResult.error || ''}`);
 }
 }
 }

 // If we updated the currently logged in user, refresh their record
 if (currentUser && currentUser.empCode === updatedUser.empCode) {
 setCurrentUser(userWithTenant);
 localStorage.setItem('ehs_active_user_v3', JSON.stringify(userWithTenant));
 }

 const targetTenant = tenants.find(t => t.id === tenantId) || activeTenant;
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId: tenantId,
 tenantName: targetTenant?.name || 'System',
 action: `Update User (${updatedUser.username})`
 });
 };

  const handleBatchUpdateUsers = async (updatedUsers: UserProfile[]) => {
    if (checkReadOnly()) return;
    const tenantId = currentUser?.tenantId || 'tenant-demo';
    
    const updated = users.map(u => {
      const match = updatedUsers.find(up => up.empCode === u.empCode);
      return match ? { ...match, tenantId: u.tenantId || tenantId } : u;
    });
    
    saveUsersState(updated);
    
    if (isFirebaseConfigured) {
      for (const user of updatedUsers) {
        await dbSaveUser({ ...user, tenantId: user.tenantId || tenantId });
      }
    }
    
    if (currentUser) {
      const match = updatedUsers.find(up => up.empCode === currentUser.empCode);
      if (match) {
        setCurrentUser({ ...match, tenantId: currentUser.tenantId || tenantId });
        localStorage.setItem('ehs_active_user_v3', JSON.stringify({ ...match, tenantId: currentUser.tenantId || tenantId }));
      }
    }
    
    alert(language === 'ar' ? 'تم تحديث الموظفين بنجاح!' : 'Users updated successfully!');
  };

 const handleDeleteUser = async (empCode: string) => {
 if (checkReadOnly()) return;
 const userToDelete = users.find(u => u.empCode === empCode);
 const tenantId = userToDelete?.tenantId || '';
 const updated = users.filter(u => u.empCode !== empCode);
 saveUsersState(updated);
 
 if (isFirebaseConfigured && tenantId) {
 const success = await dbDeleteUser(empCode, tenantId);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حذف المستخدم من Firebase!' : '⚠️ Failed to delete user from Firebase!');
 }
 }

 const targetTenant = tenants.find(t => t.id === tenantId) || activeTenant;
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId: tenantId,
 tenantName: targetTenant?.name || 'System',
 action: `Delete User (${userToDelete?.username || empCode})`
 });
 };

 const savePermitsState = (updatedList: Permit[]) => {
 setPermits(updatedList);
 if (!isFirebaseConfigured) {
 safeLocalStorageSetItem('ehs_permits_local', JSON.stringify(updatedList));
 }
 };

 const saveIncidentsState = (updated: Incident[]) => {
 setIncidents(updated);
 if (!isFirebaseConfigured) {
 safeLocalStorageSetItem('ehs_incidents_local', JSON.stringify(updated));
 }
 };

 const saveHirasState = (updated: HiraAssessment[]) => {
 setHiras(updated);
 if (!isFirebaseConfigured) {
 safeLocalStorageSetItem('ehs_hiras_local', JSON.stringify(updated));
 }
 };

 const saveAuditsState = (updated: SafetyAudit[]) => {
 setAudits(updated);
 if (!isFirebaseConfigured) {
 safeLocalStorageSetItem('ehs_audits_local', JSON.stringify(updated));
 }
 };

 const saveTrainingsState = (updated: TrainingRecord[]) => {
 setTrainings(updated);
 if (!isFirebaseConfigured) {
 safeLocalStorageSetItem('ehs_trainings_local', JSON.stringify(updated));
 }
 };

 // Updaters for newly integrated modules
 const handleAddIncident = async (newInc: Incident) => {
 if (checkReadOnly()) return;
 const tenantId = newInc.tenantId || activeTenant?.id || 'tenant-demo';
 const recordWithTenant = { ...newInc, tenantId };
 const list = [recordWithTenant, ...incidents];
 saveIncidentsState(list);
 if (isFirebaseConfigured) {
 const success = await dbSaveIncident(recordWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حفظ بلاغ الحادث في Firebase!' : '⚠️ Failed to save incident to Firebase!');
 }
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Add Incident (${newInc.id})`
 });
 };

 const handleUpdateIncident = async (updated: Incident) => {
 if (checkReadOnly()) return;
 const tenantId = updated.tenantId || activeTenant?.id || 'tenant-demo';
 const recordWithTenant = { ...updated, tenantId };
 const list = incidents.map(i => i.id === updated.id ? recordWithTenant : i);
 saveIncidentsState(list);
 if (isFirebaseConfigured) {
 const success = await dbSaveIncident(recordWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل تحديث بلاغ الحادث في Firebase!' : '⚠️ Failed to update incident in Firebase!');
 }
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Update Incident (${updated.id})`
 });
 };

 const handleDeleteIncident = async (id: string) => {
 if (checkReadOnly()) return;
 const target = incidents.find(i => i.id === id);
 const tenantId = target?.tenantId || activeTenant?.id || 'tenant-demo';
 const list = incidents.filter(i => i.id !== id);
 saveIncidentsState(list);
 if (isFirebaseConfigured) {
 const success = await dbDeleteIncident(id, tenantId);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حذف بلاغ الحادث من Firebase!' : '⚠️ Failed to delete incident from Firebase!');
 }
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Delete Incident (${id})`
 });
 };

 const handleAddHira = async (newHira: HiraAssessment) => {
 if (checkReadOnly()) return;
 const tenantId = newHira.tenantId || activeTenant?.id || 'tenant-demo';
 const recordWithTenant = { ...newHira, tenantId };
 const list = [recordWithTenant, ...hiras];
 saveHirasState(list);
 if (isFirebaseConfigured) {
 const success = await dbSaveHira(recordWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حفظ تقييم المخاطر (HIRA) في Firebase!' : '⚠️ Failed to save HIRA assessment to Firebase!');
 }
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Add Hira Assessment (${newHira.id})`
 });
 };

 const handleUpdateHira = async (updated: HiraAssessment) => {
 if (checkReadOnly()) return;
 const tenantId = updated.tenantId || activeTenant?.id || 'tenant-demo';
 const recordWithTenant = { ...updated, tenantId };
 const list = hiras.map(h => h.id === updated.id ? recordWithTenant : h);
 saveHirasState(list);
 if (isFirebaseConfigured) {
 const success = await dbSaveHira(recordWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل تحديث تقييم المخاطر (HIRA) في Firebase!' : '⚠️ Failed to update HIRA assessment in Firebase!');
 }
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Update Hira Assessment (${updated.id})`
 });
 };

 const handleDeleteHira = async (id: string) => {
 if (checkReadOnly()) return;
 const target = hiras.find(h => h.id === id);
 const tenantId = target?.tenantId || activeTenant?.id || 'tenant-demo';
 const list = hiras.filter(h => h.id !== id);
 saveHirasState(list);
 if (isFirebaseConfigured) {
 const success = await dbDeleteHira(id, tenantId);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حذف تقييم المخاطر (HIRA) من Firebase!' : '⚠️ Failed to delete HIRA assessment from Firebase!');
 }
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Delete Hira Assessment (${id})`
 });
 };

 const handleCreatePermitFromHira = (hira: HiraAssessment) => {
 setPrefilledHira(hira);
 setIsCreating(true);
 setSelectedPermitId(null);
 setActiveTab('PERMITS');
 };

 const handleAddAudit = async (newAudit: SafetyAudit) => {
 if (checkReadOnly()) return;
 const tenantId = newAudit.tenantId || activeTenant?.id || 'tenant-demo';
 const recordWithTenant = { ...newAudit, tenantId };
 const list = [recordWithTenant, ...audits];
 saveAuditsState(list);
 if (isFirebaseConfigured) {
 const success = await dbSaveAudit(recordWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حفظ التدقيق في Firebase!' : '⚠️ Failed to save audit to Firebase!');
 }
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Add Safety Audit (${newAudit.id})`
 });
 };

 const handleUpdateAudit = async (updated: SafetyAudit) => {
 if (checkReadOnly()) return;
 const tenantId = updated.tenantId || activeTenant?.id || 'tenant-demo';
 const recordWithTenant = { ...updated, tenantId };
 const list = audits.map(a => a.id === updated.id ? recordWithTenant : a);
 saveAuditsState(list);
 if (isFirebaseConfigured) {
 const success = await dbSaveAudit(recordWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل تحديث التدقيق في Firebase!' : '⚠️ Failed to update audit in Firebase!');
 }
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Update Safety Audit (${updated.id})`
 });
 };

 const handleAddTraining = async (newTr: TrainingRecord) => {
 if (checkReadOnly()) return;
 const tenantId = newTr.tenantId || activeTenant?.id || 'tenant-demo';
 const recordWithTenant = { ...newTr, tenantId };
 const list = [recordWithTenant, ...trainings];
 saveTrainingsState(list);
 if (isFirebaseConfigured) {
 const success = await dbSaveTraining(recordWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حفظ التدريب في Firebase!' : '⚠️ Failed to save training record to Firebase!');
 }
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Add Training Record (${newTr.id})`
 });
 };

 // Updaters (Existing Permits)
 const handleUpdatePermit = async (updatedPermit: Permit) => {
 if (checkReadOnly()) return;
 const tenantId = updatedPermit.tenantId || activeTenant?.id || 'tenant-demo';
 const recordWithTenant = { ...updatedPermit, tenantId };

 if (isFirebaseConfigured) {
 // Optimistic-concurrency write: aborts instead of overwriting if someone else (e.g. a
 // different approver) saved this same permit after this edit was opened.
 const result = await dbSavePermitTransactional(recordWithTenant, updatedPermit.version);
 if (result.conflict) {
 if (result.latest) {
 savePermitsState(permits.map(p => p.id === updatedPermit.id ? result.latest! : p));
 }
 alert(language === 'ar'
 ? '⚠️ تم تعديل هذا التصريح من مستخدم آخر أثناء مراجعتك. تم تحديث البيانات — يرجى مراجعة أحدث نسخة وإعادة المحاولة.'
 : '⚠️ This permit was updated by someone else while you were reviewing it. The record has been refreshed — please review the latest version and retry.');
 return;
 }
 if (!result.success) {
 alert(language === 'ar' ? '⚠️ فشل تحديث التصريح في Firebase! تم التراجع عن التغيير.' : '⚠️ Failed to update permit in Firebase! Operation rolled back.');
 return;
 }
 savePermitsState(permits.map(p => p.id === updatedPermit.id ? { ...recordWithTenant, version: (updatedPermit.version ?? 0) + 1 } : p));
 } else {
 const newList = permits.map(p => p.id === updatedPermit.id ? recordWithTenant : p);
 savePermitsState(newList);
 }
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Update Permit (${updatedPermit.id}) - Status: ${updatedPermit.status}`
 });
 };

 const handleCreateDraft = async (newPermit: Permit) => {
 if (checkReadOnly()) return;
 const tenantId = newPermit.tenantId || activeTenant?.id || 'tenant-demo';
 const recordWithTenant = { ...newPermit, tenantId };
 const newList = [recordWithTenant, ...permits];
 savePermitsState(newList);
 if (isFirebaseConfigured) {
 const success = await dbSavePermit(recordWithTenant);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حفظ مسودة التصريح في Firebase!' : '⚠️ Failed to save permit draft to Firebase!');
 }
 }
 setIsCreating(false);
 setSelectedPermitId(newPermit.id); // Open it immediately in detailed review
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Create Permit Draft (${newPermit.id})`
 });
 };

 const handleDeletePermit = async (id: string) => {
 if (checkReadOnly()) return;
 const target = permits.find(p => p.id === id);
 const tenantId = target?.tenantId || activeTenant?.id || 'tenant-demo';
 const newList = permits.filter(p => p.id !== id);
 savePermitsState(newList);
 if (isFirebaseConfigured) {
 const success = await dbDeletePermit(id, tenantId);
 if (!success) {
 alert(language === 'ar' ? '⚠️ فشل حذف التصريح من Firebase!' : '⚠️ Failed to delete permit from Firebase!');
 }
 }
 setSelectedPermitId(null);
 await dbLogActivity({
 userId: currentUser?.empCode || 'system',
 userName: currentUser?.fullNameEn || 'System',
 tenantId,
 tenantName: activeTenant?.name || 'System',
 action: `Delete Permit (${id})`
 });
 };

 // Find currently selected permit
 const activePermit = permits.find(p => p.id === selectedPermitId);

 // Stats calculation
 const scopedPermits = filterTenantRecords(permits, activeTenant.id);
 const totalCount = scopedPermits.length;
 const activeCount = scopedPermits.filter(p => p.status === 'ACTIVE').length;
 const closedCount = scopedPermits.filter(p => p.status === 'CLOSED').length;
 const pendingCount = scopedPermits.filter(p => p.status === 'PENDING_DEPT' || p.status === 'HSE_REVIEW').length;

 const getCurrentMonthIncidentsCount = () => {
    const d = new Date();
    const currentMonthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return incidents.filter(inc => {
      const isMine = inc.reportedByEmpCode === currentUser?.empCode || 
                     inc.reportedByName === currentUser?.fullNameEn || 
                     inc.reportedByName === currentUser?.fullNameAr;
      const isInCurrentMonth = inc.date && inc.date.startsWith(currentMonthPrefix);
      return isMine && isInCurrentMonth;
    }).length;
  };


 const activeProfile = currentUser;
 const initialsEn = activeProfile.fullNameEn
 .split(' ')
 .map(n => n.replace(/[^a-zA-Z]/g, '')[0])
 .filter(Boolean)
 .join('')
 .slice(0, 2)
 .toUpperCase();

 if (!isLoggedIn) {
 const isSuperAdminPortal = currentPath === '/super-admin-portal' || currentPath.includes('portal=super-admin');
 return (
 <div className="min-h-screen bg-[#F1F5F9] p-4 flex items-center justify-center">
 <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
 <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
 <div>
 <h2 className="text-xl font-bold text-slate-800">
 {isSuperAdminPortal ? 'EHS Platform Admin Portal' : 'SaaS-ready EHS Platform'}
 </h2>
 <p className="text-sm text-slate-500 font-sans">
 {isSuperAdminPortal 
 ? 'System-wide configuration, billing analytics, and multi-tenant registration control panel.' 
 : 'Tenant-aware login, RBAC controls, and multi-company isolation are now part of the experience.'}
 </p>
 </div>
 {/* Commented out tenant list on login screen */}
 </div>
 <LoginScreen 
 companies={tenants}
 users={users.length > 0 ? users : DEFAULT_USERS_SEED}
 isSuperAdminPortal={isSuperAdminPortal}
 onLogin={async (user) => {
 const tenant = tenants.find((item) => item.id === (user.tenantId || 'tenant-demo')) || tenants[0] || DEFAULT_TENANTS[0];
 
 // Seed mustChangePassword = true for Platform Admins if logged in for the first time with '123'
 const isPlatformAdmin = user.customRole === 'PLATFORM_ADMIN' || user.username === 'admin';
 const mustChange = isPlatformAdmin && user.password === '123';
 
 setCurrentUser({ 
 ...user, 
 tenantId: tenant.id, 
 permissions: user.permissions ?? ['permits.create', 'permits.view'],
 mustChangePassword: user.mustChangePassword ?? mustChange
 });
 setActiveTenant(tenant);
 setCurrentRole(user.sandboxRole || 'REQUESTER');
 setIsLoggedIn(true);
 setIsAdminMode(isPlatformAdmin);
 setIsCompanyDashboardMode(false);
 setIsBillingAnalyticsMode(false);
 
 if (!isPlatformAdmin) {
 setActiveTab('PERMITS');
 }

 // Log successful login activity
 await dbLogActivity({
 userId: user.empCode,
 userName: user.fullNameEn,
 tenantId: tenant.id,
 tenantName: tenant.name,
 action: 'Login'
 });
 }} 
 language={language} 
 onLanguageChange={setLanguage}
 />
 </div>
 </div>
 );
 }

 // --- MANDATORY PASSWORD CHANGE SCREEN ---
 if (isLoggedIn && currentUser?.mustChangePassword) {
 return (
 <div className="min-h-screen bg-[#F1F5F9] dark:bg-neutral-950 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
 <div className="text-center mb-6">
 <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <LockIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
 </div>
 <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 font-sans">
 {language === 'ar' ? 'تغيير كلمة المرور الإلزامي' : 'Mandatory Password Change'}
 </h2>
 <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
 {language === 'ar' 
 ? 'يجب عليك تغيير كلمة المرور الافتراضية عند تسجيل الدخول الأول لأسباب أمنية.' 
 : 'You must change your default password upon first login for security reasons.'}
 </p>
 </div>
 
 <form onSubmit={async (e) => {
 e.preventDefault();
 const newPasswordInput = (e.currentTarget.elements.namedItem('newPassword') as HTMLInputElement).value;
 const confirmPasswordInput = (e.currentTarget.elements.namedItem('confirmPassword') as HTMLInputElement).value;
 
 if (!newPasswordInput || newPasswordInput === '123' || newPasswordInput === 'admin') {
 alert(language === 'ar' 
 ? 'يرجى اختيار كلمة مرور قوية وغير مطابقة للكلمة الافتراضية.' 
 : 'Please choose a strong password that is not the default password.');
 return;
 }
 if (newPasswordInput !== confirmPasswordInput) {
 alert(language === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
 return;
 }
 
 const updatedUser = { ...currentUser, mustChangePassword: false };

 let success = false;
 if (isFirebaseConfigured) {
 success = await dbSaveUser(updatedUser);
 const pwResult = await setUserPasswordSecure(updatedUser.tenantId || 'tenant-demo', updatedUser.empCode, newPasswordInput, false);
 success = success && pwResult.success;
 } else {
 updatedUser.password = await hashPassword(newPasswordInput);
 success = true; // offline mock
 }

 if (success) {
 await dbLogActivity({
 userId: currentUser.empCode,
 userName: currentUser.fullNameEn,
 tenantId: activeTenant?.id || 'system',
 tenantName: activeTenant?.name || 'System',
 action: 'Password Change'
 });
 setCurrentUser(updatedUser);
 setUsers(prev => prev.map(u => u.username === currentUser.username ? updatedUser : u));
 alert(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح.' : 'Password changed successfully.');
 } else {
 alert(language === 'ar' ? 'فشل تحديث كلمة المرور في قاعدة البيانات.' : 'Failed to update password.');
 }
 }} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
 {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
 </label>
 <input
 type="password"
 name="newPassword"
 required
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white font-sans text-sm"
 placeholder="••••••••"
 />
 </div>
 
 <div>
 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
 {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
 </label>
 <input
 type="password"
 name="confirmPassword"
 required
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white font-sans text-sm"
 placeholder="••••••••"
 />
 </div>
 
 <button
 type="submit"
 className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition-all font-sans text-sm"
 >
 {language === 'ar' ? 'تحديث وفتح الحساب' : 'Update & Unlock Account'}
 </button>
 </form>
 </div>
 </div>
 );
 }

 // --- SUBSCRIPTION EXPIRY BLOCKING SCREEN ---

 const handleClearAuditLogs = async () => {
    if (confirm(language === 'ar' ? '⚠️ هل أنت متأكد كأدمن من تفريغ كافة سجلات العمليات القديمة من Firebase لتوفير مساحة Firestore؟' : '⚠️ Are you sure as Admin to purge all old audit log entries from Firebase to free up Firestore space?')) {
      const success = await dbClearAuditLogs();
      if (success) {
        setAuditLogs([]);
        alert(language === 'ar' ? '✅ تم تفريغ سجلات Firebase القديمة وتوفير مساحة القواعد بنجاح!' : '✅ Firebase audit logs cleared successfully!');
      } else {
        alert(language === 'ar' ? '⚠️ حدث خطأ أثناء تفريغ السجلات من Firebase.' : '⚠️ Failed to clear audit logs from Firebase.');
      }
    }
  };
 if (isLoggedIn && isSubscriptionBlocked && currentUser?.customRole !== 'PLATFORM_ADMIN') {
 return (
 <div className="min-h-screen bg-slate-100 dark:bg-neutral-950 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
 <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
 </div>
 <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 font-sans">
 {language === 'ar' ? 'انتهت صلاحية الاشتراك' : 'Subscription Expired'}
 </h2>
 <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-sans">
 {language === 'ar' 
 ? 'انتهت صلاحية اشتراك شركتك في الخدمة. يرجى التواصل مع إدارة النظام لتجديد الاشتراك وتفعيل الحساب.' 
 : 'Your company\'s subscription has expired. Please contact the platform administrator to renew.'}
 </p>
 {currentUser?.customRole === 'SUPER_ADMIN' && (
 <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs text-slate-500 font-sans">
 {language === 'ar' ? 'ملاحظة للمدير: يرجى الاتصال بنا لتجديد الاشتراك.' : 'Note for Administrator: Please contact support to renew.'}
 </div>
 )}
 <button
 onClick={handleLogout}
 className="mt-6 w-full bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg transition-all font-sans text-sm"
 >
 {language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
 </button>
 </div>
 </div>
 );
 }

 if (isAdminMode) {
 return (
 <ErrorBoundary language={language}>
 <React.Suspense fallback={<LoadingSpinner language={language} />}>
 <AdminConsole
 companies={tenants || []}
 users={users || []}
 auditLogs={auditLogs || []}
 onCreateCompany={handleCreateCompany}
 onCreateUser={handleCreateUser}
 onDeleteUser={handleAdminDeleteUser}
 onUpgradePlan={handleUpgradeCompanyPlan}
 onUpdateCompany={handleUpdateCompany}
 onDeleteCompany={handleDeleteCompany}
 language={language}
 onLogout={handleLogout}
 onClearAuditLogs={handleClearAuditLogs}
 />
 </React.Suspense>
 </ErrorBoundary>
 );
 }

 if (isCompanyDashboardMode) {
 return (
 <ErrorBoundary language={language}>
 <React.Suspense fallback={<LoadingSpinner language={language} />}>
 <CompanyDashboard
 company={activeTenant}
 currentUser={currentUser}
 users={users || []}
 language={language}
 onSwitchTenant={handleSwitchTenant}
 onOpenBilling={() => setIsBillingAnalyticsMode(true)}
 />
 </React.Suspense>
 </ErrorBoundary>
 );
 }

 if (isBillingAnalyticsMode) {
 return (
 <ErrorBoundary language={language}>
 <React.Suspense fallback={<LoadingSpinner language={language} />}>
 <CompanyBillingAnalytics
 company={activeTenant}
 currentUser={currentUser}
 users={users || []}
 language={language}
 onUpgradePlan={(plan) => handleUpgradeCompanyPlan(activeTenant.id, plan)}
 onBack={() => {
 setIsBillingAnalyticsMode(false);
 setIsCompanyDashboardMode(true);
 }}
 />
 </React.Suspense>
 </ErrorBoundary>
 );
 }

 return (
 <div className="min-h-screen bg-[#F1F5F9] dark:bg-neutral-950 text-slate-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 {isSubscriptionReadOnly && (
 <div className="bg-amber-500 text-slate-900 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 select-none shadow-sm z-50">
 <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
 <span>
 {language === 'ar' 
 ? '⚠️ انتهت صلاحية اشتراك شركتك! النظام حالياً في وضع القراءة فقط. يرجى من مدير الشركة تجديد الاشتراك لتفعيل إمكانية الإضافة والتعديل.' 
 : '⚠️ Your company\'s subscription has expired! The system is in Read-Only Mode. Please renew to enable adding or editing.'}
 </span>
 </div>
 )}
 
 {/* SECTION 1: INDUSTRIAL BRAND HEADER WITH PROFESSIONAL POLISH THEME */}
 <header id="app-brand-header" className="bg-[#0F172A] border-b border-slate-700 py-4 px-6 shadow-md text-white">
 <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
 
 {/* Logo & Corporate Title */}
 <div className={`flex items-center gap-3 md:flex-row text-end`}>
 <div className="w-9 h-9 bg-orange-500 rounded flex items-center justify-center font-bold text-lg text-white shadow-inner flex-shrink-0 animate-pulse">
 <Factory className="w-5 h-5 text-white" />
 </div>
 <div>
 <h1 id="header-main-title" className={`text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 flex-row`}>
 <span>{t("CementMaster PTW", language)}</span>
 <span className="text-orange-500">|</span>
 <span className="text-xs font-semibold text-slate-400">{t("Operations Hub", language)}</span>
 </h1>
 <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mt-0.5">
 {language === 'ar' 
 ? 'بوابة السلامة الميدانية وتصاريح العمل وعزل الطاقة والغازات'
 : (language === 'zh' ? '现场安全准入、工作许可与上锁挂牌能源隔离监控系统' : 'Safety & Work Control Management System')}
 </p>
 <p className="mt-1 text-[10px] font-semibold text-orange-400">
 {getTenantDisplayName(activeTenant)} • {getTenantPlanLabel(activeTenant)} • {isTenantActive(activeTenant) ? 'Active tenant' : 'Restricted tenant'}
 </p>
 </div>
 </div>

 {/* Core Analytics Quick Metrics from the Theme */}
 <div className="hidden lg:flex gap-5 border-s border-slate-700 ps- pe- border-e">
 <div className="text-center min-w-10">
 <div className="text-orange-400 font-bold text-sm leading-tight font-mono">{activeCount}</div>
 <div className="text-[9px] text-slate-400 uppercase font-medium">{t("Active", language)}</div>
 </div>
 <div className="text-center min-w-10">
 <div className="text-blue-400 font-bold text-sm leading-tight font-mono">{closedCount}</div>
 <div className="text-[9px] text-slate-400 uppercase font-medium">{t("Closed", language)}</div>
 </div>
 <div className="text-center min-w-10">
 <div className="text-red-400 font-bold text-sm leading-tight font-mono">{pendingCount}</div>
 <div className="text-[9px] text-slate-400 uppercase font-medium">{t("Urgent", language)}</div>
 </div>
 <div className="text-center min-w-14 px-2 border-s border-slate-700">
 <div className="text-amber-400 font-bold text-sm leading-tight font-mono animate-pulse">{getCurrentMonthIncidentsCount()}</div>
 <div className="text-[9px] text-amber-500 uppercase font-medium">{t("My Reports/Mo", language)}</div>
 </div>
 </div>

 {/* Active simulated bio with dynamic details and initials circle avatar */}
 <div className={`flex items-center gap-3 flex-row text-end`}>
 <div className="text-start hidden sm:block">
 <p className="text-xs font-bold text-white transition-opacity duration-150">
 {getLocalizedValue(language, activeProfile.fullNameEn, activeProfile.fullNameAr, activeProfile.fullNameZh)}
 </p>
 <div className="flex flex-col items-end gap-0.5">
 <p className="text-[10px] text-orange-400 transition-opacity duration-150 leading-tight">
 {getLocalizedValue(language, activeProfile.roleEn, activeProfile.roleAr, activeProfile.roleZh)}
 </p>
 <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
 <span>{t("My EHS Reports:", language)}</span>
 <strong className="font-mono text-white text-[10px]">{getCurrentMonthIncidentsCount()}</strong>
 </span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <NotificationsPanel 
 permits={permits}
 currentUser={currentUser}
 currentRole={currentRole}
 language={language}
 onSelectPermit={(id) => {
 setIsCreating(false);
 setSelectedPermitId(id);
 }}
 />
 <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center text-xs font-bold text-white select-none shadow-sm shrink-0">
 {initialsEn}
 </div>
 {(currentUser?.customRole === 'COMPANY_ADMIN' || currentUser?.customRole === 'PLATFORM_ADMIN' || currentUser?.customRole === 'SUPER_ADMIN') && (
 <button
 onClick={() => setIsCompanyDashboardMode(true)}
 className="px-2.5 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors border border-slate-700 shrink-0 font-sans"
 title={language === 'ar' ? 'إعدادات الشركة' : 'Company Settings'}
 >
 <Settings className="w-4 h-4 text-orange-400 shrink-0" />
 <span className="text-[10px] font-bold text-slate-200 hidden sm:inline">
 {language === 'ar' ? 'إعدادات الشركة' : 'Settings'}
 </span>
 </button>
 )}
 <button
 onClick={() => setLanguage(lang => {
 if (lang === 'ar') return 'en';
 if (lang === 'en') return 'zh';
 return 'ar';
 })}
 className="px-2.5 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors border border-slate-700 shrink-0 font-sans"
 title={
 language === 'ar' 
 ? 'Switch to English / 切换到英文' 
 : language === 'en' 
 ? '切换为中文 / تغيير للعربية' 
 : 'تغيير للعربية / Switch to English'
 }
 >
 <Globe className="w-4 h-4 text-orange-400 shrink-0" />
 <span className="text-[10px] font-bold text-slate-200">
 {language === 'ar' ? 'العربية' : language === 'en' ? 'EN' : '中文'}
 </span>
 </button>
 <button 
 onClick={handleLogout}
 className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors border border-red-500/20"
 title={t('Log out', language)}
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 </div>

 </div>
 </header>

 {/* SECTION 2: MODULAR EHS SEGMENT SELECTOR */}
 <div className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-10">
 <div className="max-w-7xl mx-auto px-4 flex flex-row gap-1 sm:gap-2 py-3 overflow-x-auto justify-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 
 {isModuleEnabled(activeTenant, 'PTW') && (
 <button
 id="tab-permits"
 onClick={() => { setActiveTab('PERMITS'); setSelectedPermitId(null); setIsCreating(false); }}
 className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
 activeTab === 'PERMITS' 
 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
 }`}
 >
 <FileStack className="w-4 h-4" />
 <span>{t("Permits to Work", language)}</span>
 </button>
 )}

 {isModuleEnabled(activeTenant, 'INCIDENT') && (
 <button
 id="tab-incidents"
 onClick={() => { setActiveTab('INCIDENTS'); setSelectedPermitId(null); setIsCreating(false); }}
 className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
 activeTab === 'INCIDENTS' 
 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
 : 'text-slate-600 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <ShieldAlert className="w-4 h-4" />
 <span>{t("Incident Management", language)}</span>
 </button>
 )}

 {isModuleEnabled(activeTenant, 'HIRA') && (
 <button
 id="tab-hira"
 onClick={() => { setActiveTab('HIRA'); setSelectedPermitId(null); setIsCreating(false); }}
 className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
 activeTab === 'HIRA' 
 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <Shield className="w-4 h-4" />
 <span>{t("HIRA Risk Matrix", language)}</span>
 </button>
 )}

 {isModuleEnabled(activeTenant, 'AUDIT') && (
 <button
 id="tab-audits"
 onClick={() => { setActiveTab('AUDITS'); setSelectedPermitId(null); setIsCreating(false); }}
 className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
 activeTab === 'AUDITS' 
 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <ClipboardCheck className="w-4 h-4" />
 <span>{t("Compliance Audits", language)}</span>
 </button>
 )}

 <button
 id="tab-training"
 onClick={() => { setActiveTab('TRAINING'); setSelectedPermitId(null); setIsCreating(false); }}
 className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
 activeTab === 'TRAINING' 
 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <GraduationCap className="w-4 h-4" />
 <span>{t("Safety Trainings", language)}</span>
 </button>

 <button
 id="tab-ai-copilot"
 onClick={() => { setActiveTab('AI_COPILOT'); setSelectedPermitId(null); setIsCreating(false); }}
 className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
 activeTab === 'AI_COPILOT' 
 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
 }`}
 >
 <Brain className="w-4 h-4 text-orange-500 animate-pulse" />
 <span>{t("Safety AI Copilot", language)}</span>
 </button>

 <button
 id="tab-performance"
 onClick={() => { setActiveTab('PERFORMANCE'); setSelectedPermitId(null); setIsCreating(false); }}
 className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
 activeTab === 'PERFORMANCE' 
 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
 }`}
 >
 <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
 <span>{t("Platform Performance", language)}</span>
 </button>

 {canManageUsers(currentUser) && (
 <button
 id="tab-users"
 onClick={() => { setActiveTab('USERS'); setSelectedPermitId(null); setIsCreating(false); }}
 className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
 activeTab === 'USERS' 
 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
 }`}
 >
 <Users className="w-4 h-4 text-orange-400" />
 <span>{t("Personnel Registry", language)}</span>
 </button>
 )}
 
 </div>
 </div>

 {/* SECTION 3: MAIN LAYOUT */}
 <main className="grow max-w-7xl w-full mx-auto p-4 flex flex-col gap-6">
 <ErrorBoundary language={language}>
 <React.Suspense fallback={<LoadingSpinner language={language} />}>
 
 {activeTab === 'PERMITS' && (
 isCreating ? (
 /* Create Permit view panel */
 <motion.div
 id="fade-form"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.2 }}
 >
 {currentUser?.permitVersion === 'v2' ? (
 <PermitFormV2
 onSaveDraft={handleCreateDraft}
 onCancel={() => { setIsCreating(false); setPrefilledHira(null); }}
 currentUser={currentUser}
 language={language}
 prefilledHira={prefilledHira}
 onClearPrefilledHira={() => setPrefilledHira(null)}
 hiras={hiras}
 permits={permits}
 users={users}
 trainings={trainings}
 onAddHira={handleAddHira}
 />
 ) : (
 <PermitForm
 onSaveDraft={handleCreateDraft}
 onCancel={() => { setIsCreating(false); setPrefilledHira(null); }}
 currentUser={currentUser}
 language={language}
 prefilledHira={prefilledHira}
 onClearPrefilledHira={() => setPrefilledHira(null)}
 hiras={hiras}
 users={users}
 trainings={trainings}
 />
 )}
 </motion.div>
 ) : activePermit ? (
 /* Permit Detail View (Workflow State Machine) */
 <motion.div
 id="fade-detail"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.2 }}
 >
 <PermitDetail
 permit={activePermit}
 currentRole={currentRole}
 currentUser={currentUser}
 language={language}
 onUpdatePermit={handleUpdatePermit}
 onDeletePermit={handleDeletePermit}
 onBackToDashboard={() => setSelectedPermitId(null)}
 allPermits={scopedPermits}
 />
 </motion.div>
 ) : (
 /* Main Analytical Dashboard & Permits list grid */
 <motion.div
 id="fade-dashboard"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.2 }}
 >
 <Dashboard
 permits={permits}
 selectedId={selectedPermitId}
 onSelectPermit={setSelectedPermitId}
 onDeletePermit={handleDeletePermit}
 onCreateNewClick={() => {
 if (currentUser?.canCreatePermit) {
 setIsCreating(true);
 }
 }}
 currentRole={currentRole}
 currentUser={currentUser}
 language={language}
 />
 </motion.div>
 )
 )}

 {activeTab === 'INCIDENTS' && (
 <motion.div
 id="fade-incidents"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 >
 <IncidentManager
 incidents={incidents}
 onAddIncident={handleAddIncident}
 onUpdateIncident={handleUpdateIncident}
 onDeleteIncident={handleDeleteIncident}
 currentRole={currentRole}
 language={language}
 currentUser={currentUser}
 users={users.length > 0 ? users : DEFAULT_USERS_SEED}
 />
 </motion.div>
 )}

 {activeTab === 'HIRA' && (
 <motion.div
 id="fade-hira"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 >
 <HiraManager
 hiras={hiras}
 onAddHira={handleAddHira}
 onUpdateHira={handleUpdateHira}
 onDeleteHira={handleDeleteHira}
 currentRole={currentRole}
 language={language}
 currentUser={currentUser}
 onCreatePermitFromHira={handleCreatePermitFromHira}
 />
 </motion.div>
 )}

 {activeTab === 'AUDITS' && (
 <motion.div
 id="fade-audits"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 >
 <AuditManager
 audits={audits}
 onAddAudit={handleAddAudit}
 onUpdateAudit={handleUpdateAudit}
 language={language}
 />
 </motion.div>
 )}

 {activeTab === 'TRAINING' && (
 <motion.div
 id="fade-training"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 >
 <TrainingManager
 trainings={trainings}
 onAddTraining={handleAddTraining}
 language={language}
 />
 </motion.div>
 )}

 {activeTab === 'AI_COPILOT' && (
 <motion.div
 id="fade-ai-copilot"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 >
 <SafetyAiCopilot
 language={language}
 />
 </motion.div>
 )}

 {activeTab === 'PERFORMANCE' && (
 <motion.div
 id="fade-performance"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 >
 <PlatformPerformance
 permits={permits}
 incidents={incidents}
 audits={audits}
 trainings={trainings}
 language={language}
 />
 </motion.div>
 )}

 {activeTab === 'USERS' && canManageUsers(currentUser) && (
 <motion.div
 id="fade-users"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 >
 <UserManager
 users={filterTenantRecords(users as any, activeTenant?.id || 'tenant-demo') as unknown as UserProfile[]}
 onAddUser={handleAddUser}
 onDeleteUser={handleDeleteUser}
 onUpdateUser={handleUpdateUser}
 onBatchUpdateUsers={handleBatchUpdateUsers}
 language={language}
 />
 </motion.div>
 )}

 </React.Suspense>
 </ErrorBoundary>
 </main>

 {/* SECTION 4: COHESIVE SYSTEM FOOTER */}
 <footer id="app-footer" className="bg-white dark:bg-neutral-900 border-t border-neutral-150 dark:border-neutral-800 py-6 text-center text-xs text-neutral-400">
 <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans justify-row-reverse text-start">
 
 <p id="footer-text-c" className="leading-relaxed">
 {language === 'ar'
 ? 'تطبيق تصاريح العمل الإلكتروني (PTW) • ملتزمون بمعايير إدارة السلامة والصحة المهنية بمصانع الإسمنت.'
 : (language === 'zh' ? '安全作业许可证 (PTW) 系统 • 致力于水泥厂职业健康安全危险源控制准则。' : 'Electronic Permit to Work (PTW) Portal • Committed to HSE cement plant hazards control directives.')}
 </p>
 <div className="flex gap-4 text-[11px] font-semibold text-neutral-450 items-center">
 <span className="text-[10px] bg-slate-100 dark:bg-neutral-850 px-2 py-0.5 rounded text-neutral-500">
 Firebase: {isFirebaseConfigured ? `Connected (${(import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'permit-to-work-system-33'})` : 'Disconnected'}
 </span>
 <span className="flex items-center gap-1 justify-end">
 <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
 <span>{t('LOTO Secure', language)}</span>
 </span>
 <span className="flex items-center gap-1 justify-end">
 <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
 <span>{t('Audited Portal', language)}</span>
 </span>
 </div> </div>
 </footer>

 {isLoggedIn && (
 <DeviceNotificationOverlay
 users={users}
 currentUser={currentUser}
 language={language}
 onAutoSwitchUser={handleAutoSwitchUser}
 />
 )}

 </div>
 );
}
