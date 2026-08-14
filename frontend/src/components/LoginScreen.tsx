/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Factory, Lock, ArrowRight, Activity, ShieldAlert, Globe } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { t, getLocalizedValue } from '../utils/translations';
import { DEFAULT_TENANTS, getTenantFeatureHints, getTenantPlanLabel } from '../utils/saas';
import { UNLIMITED } from '../utils/subscriptions';
import { Tenant } from '../types';
import { isFirebaseConfigured, hashPassword, loginWithCustomToken } from '../utils/firebase';
import { getApiUrl } from '../utils/api';

interface LoginScreenProps {
 companies: Tenant[];
 users: UserProfile[];
 onLogin: (user: UserProfile) => void;
 language: Language;
 onLanguageChange?: (lang: Language) => void;
 isSuperAdminPortal?: boolean;
}

function sanitizeInput(val: string): string {
 return val
 .trim()
 .replace(/&/g, "&amp;")
 .replace(/</g, "&lt;")
 .replace(/>/g, "&gt;")
 .replace(/"/g, "&quot;")
 .replace(/'/g, "&#039;");
}

export function LoginScreen({ companies, users, onLogin, language, onLanguageChange, isSuperAdminPortal }: LoginScreenProps) {
 const [selectedCompanyId, setSelectedCompanyId] = React.useState(companies[0]?.id || 'tenant-demo');
 const [employeeId, setEmployeeId] = React.useState('');
 const [password, setPassword] = React.useState('');
 const [isLoading, setIsLoading] = React.useState(false);
 const [error, setError] = React.useState('');

 // Forgot Password flow states
 const [showForgotModal, setShowForgotModal] = React.useState(false);
 const [forgotStep, setForgotStep] = React.useState<'INPUT_ID' | 'VERIFY_CODE' | 'NEW_PASSWORD'>('INPUT_ID');
 const [forgotEmployeeId, setForgotEmployeeId] = React.useState('');
 const [verificationCode, setVerificationCode] = React.useState('');
 const [newForgotPwd, setNewForgotPwd] = React.useState('');
 const [confirmForgotPwd, setConfirmForgotPwd] = React.useState('');
 const [forgotFeedback, setForgotFeedback] = React.useState('');
 const [forgotError, setForgotError] = React.useState('');
 const [forgotLoading, setForgotLoading] = React.useState(false);
 const [autofilledCode, setAutofilledCode] = React.useState('');

 const handleRequestResetCode = async (e: React.FormEvent) => {
 e.preventDefault();
 setForgotError('');
 setForgotFeedback('');
 setForgotLoading(true);

 const inputId = sanitizeInput(forgotEmployeeId);

 try {
 const atIndex = inputId.indexOf('@');
 let usernamePart = '';
 let companyPart = '';

 if (atIndex === -1) {
 if (isSuperAdminPortal && inputId.toLowerCase() === 'admin') {
 usernamePart = 'admin';
 companyPart = '2m';
 } else {
 setForgotError(language === 'ar' 
 ? 'الرجاء إدخال اسم المستخدم بالتنسيق الصحيح (username@companyname)' 
 : 'Please enter in format: username@companyname');
 setForgotLoading(false);
 return;
 }
 } else {
 usernamePart = inputId.substring(0, atIndex).toLowerCase();
 companyPart = inputId.substring(atIndex + 1).toLowerCase();
 }

 // Verify tenant
 const targetTenantId = companyPart === '2m' ? 'tenant-2m' : `tenant-${companyPart}`;
 let matchedTenant = companies.find(c => 
 c.id.toLowerCase() === targetTenantId.toLowerCase() || 
 c.id.toLowerCase() === companyPart || 
 c.name.toLowerCase() === companyPart
 );

 if (!matchedTenant && (targetTenantId === 'tenant-2m' || companyPart === '2m')) {
 matchedTenant = {
 id: 'tenant-2m',
 name: '2M SaaS Management Portal',
 plan: 'ENTERPRISE',
 maxUsers: UNLIMITED,
 status: 'ACTIVE',
 expiryDate: '2030-12-31',
 startDate: '2026-01-01',
 storageLimitGb: UNLIMITED,
 storageUsedBytes: 0,
 enabledModules: ['PTW', 'HIRA', 'INCIDENT', 'CONTRACTOR', 'AUDIT', 'LOTO']
 };
 }

 if (!matchedTenant) {
 setForgotError(language === 'ar' ? 'الشركة المدخلة غير مسجلة في النظام.' : 'The entered company is not registered.');
 setForgotLoading(false);
 return;
 }

 // Verify user exists. When Firebase is configured this check now happens server-side
 // (the backend is the only party allowed to read the tenant's user roster with the
 // password-reset flow's privileges) — the client no longer pre-fetches user records.
 if (!isFirebaseConfigured) {
 const matchedUser = users.find(u => u.username === usernamePart && u.tenantId === matchedTenant.id);
 if (!matchedUser) {
 setForgotError(language === 'ar' ? 'اسم المستخدم غير مسجل تحت هذه الشركة.' : 'Username not found under this company.');
 setForgotLoading(false);
 return;
 }
 }

 // Call Backend API to send code
 const response = await fetch(getApiUrl() + "/api/auth/forgot-password", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ employeeId: inputId })
 });
 const data = await response.json();

 if (data.success) {
 setForgotFeedback(language === 'ar' 
 ? 'تم إرسال كود التحقق بنجاح إلى إيميل الآدمن: eng.alspagh@gmail.com' 
 : 'Verification code sent to admin email: eng.alspagh@gmail.com');
 
 // Expose code locally for debug/simulation convenience if SMTP is not configured
 if (data.code) {
 setAutofilledCode(data.code);
 setForgotFeedback(prev => prev + ` (Simulation Code: ${data.code})`);
 }
 
 setForgotStep('VERIFY_CODE');
 } else {
 setForgotError(data.error || 'Failed to request code.');
 }
 } catch (err) {
 console.error(err);
 setForgotError(language === 'ar' ? 'فشل الاتصال بالسيرفر.' : 'Failed to connect to server.');
 } finally {
 setForgotLoading(false);
 }
 };

 const handleVerifyResetCode = async (e: React.FormEvent) => {
 e.preventDefault();
 setForgotError('');
 setForgotFeedback('');
 setForgotLoading(true);

 const inputId = sanitizeInput(forgotEmployeeId);
 const inputCode = sanitizeInput(verificationCode);

 try {
 const response = await fetch(getApiUrl() + "/api/auth/verify-reset-code", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ employeeId: inputId, code: inputCode })
 });
 const data = await response.json();

 if (data.success) {
 setForgotStep('NEW_PASSWORD');
 setForgotFeedback(language === 'ar' ? 'تم التحقق من الكود بنجاح. يرجى إدخال كلمة المرور الجديدة.' : 'Code verified successfully. Enter new password.');
 } else {
 setForgotError(data.error || 'Invalid verification code.');
 }
 } catch (err) {
 console.error(err);
 setForgotError(language === 'ar' ? 'فشل التحقق من الكود.' : 'Failed to verify code.');
 } finally {
 setForgotLoading(false);
 }
 };

 const handleResetPassword = async (e: React.FormEvent) => {
 e.preventDefault();
 setForgotError('');
 setForgotFeedback('');
 
 if (newForgotPwd !== confirmForgotPwd) {
 setForgotError(language === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
 return;
 }

 if (newForgotPwd.length < 6) {
 setForgotError(language === 'ar' ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
 return;
 }

 setForgotLoading(true);

 try {
 if (isFirebaseConfigured) {
 // The server re-validates the same verification code before touching any record —
 // it owns password hashing/storage entirely; the client never writes this field.
 const response = await fetch(getApiUrl() + "/api/auth/reset-password", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ employeeId: sanitizeInput(forgotEmployeeId), code: sanitizeInput(verificationCode), newPassword: newForgotPwd })
 });
 const data = await response.json();
 if (!data.success) {
 setForgotError(data.error || (language === 'ar' ? 'فشل إعادة تعيين كلمة المرور.' : 'Failed to reset password.'));
 setForgotLoading(false);
 return;
 }
 } else {
 const atIndex = forgotEmployeeId.indexOf('@');
 const usernamePart = atIndex === -1 ? 'admin' : forgotEmployeeId.substring(0, atIndex).trim().toLowerCase();
 const companyPart = atIndex === -1 ? '2m' : forgotEmployeeId.substring(atIndex + 1).trim().toLowerCase();
 const targetTenantId = companyPart === '2m' ? 'tenant-2m' : `tenant-${companyPart}`;

 const index = users.findIndex(u => u.username === usernamePart && u.tenantId === targetTenantId);
 if (index === -1) {
 setForgotError('User not found.');
 setForgotLoading(false);
 return;
 }
 users[index].password = await hashPassword(newForgotPwd);
 }

 setForgotFeedback(language === 'ar' ? 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.' : 'Password reset successfully. You can now login.');
 
 setTimeout(() => {
 setShowForgotModal(false);
 setForgotStep('INPUT_ID');
 setForgotEmployeeId('');
 setVerificationCode('');
 setNewForgotPwd('');
 setConfirmForgotPwd('');
 setForgotFeedback('');
 }, 2500);

 } catch (err) {
 console.error(err);
 setForgotError(language === 'ar' ? 'فشل إعادة تعيين كلمة المرور.' : 'Failed to reset password.');
 } finally {
 setForgotLoading(false);
 }
 };

 React.useEffect(() => {
 if (companies.length > 0 && !companies.find(c => c.id === selectedCompanyId)) {
 setSelectedCompanyId(companies[0].id);
 }
 }, [companies]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setIsLoading(true);

 const inputId = sanitizeInput(employeeId);
 // Not HTML-escaped: this value is only ever compared/hashed, never rendered into the DOM,
 // and escaping it would silently corrupt any password containing &, <, >, " or '.
 const inputPwd = password;

 try {
 let usernamePart = '';
 let companyPart = '';

 const atIndex = inputId.indexOf('@');
 if (atIndex === -1) {
 if (isSuperAdminPortal && inputId.toLowerCase() === 'admin' && inputPwd === 'admin') {
 usernamePart = 'admin';
 companyPart = '2m';
 } else {
 setError(language === 'ar' 
 ? 'الرجاء إدخال اسم المستخدم بالتنسيق الصحيح (username@companyname)' 
 : 'Please enter the Login ID in format: username@companyname');
 setIsLoading(false);
 return;
 }
 } else {
 usernamePart = inputId.substring(0, atIndex).toLowerCase();
 companyPart = inputId.substring(atIndex + 1).toLowerCase();
 }

 // Find tenant
 const targetTenantId = companyPart === '2m' ? 'tenant-2m' : `tenant-${companyPart}`;
 let matchedTenant = companies.find(c => 
 c.id.toLowerCase() === targetTenantId.toLowerCase() || 
 c.id.toLowerCase() === companyPart || 
 c.name.toLowerCase() === companyPart
 );

 if (!matchedTenant && (targetTenantId === 'tenant-2m' || companyPart === '2m')) {
 // Fallback matched tenant for platform management
 matchedTenant = {
 id: 'tenant-2m',
 name: '2M SaaS Management Portal',
 plan: 'ENTERPRISE',
 maxUsers: UNLIMITED,
 status: 'ACTIVE',
 expiryDate: '2030-12-31',
 startDate: '2026-01-01',
 storageLimitGb: UNLIMITED,
 storageUsedBytes: 0
 };
 }

 if (!matchedTenant) {
 setError(language === 'ar' ? 'الشركة المدخلة غير مسجلة في النظام.' : 'The entered company is not registered.');
 setIsLoading(false);
 return;
 }

 if (isFirebaseConfigured) {
 // Real path: the backend verifies the password server-side (bcrypt, with transparent
 // migration of legacy hashes) and mints a Firebase custom token carrying tenant/role
 // claims. No user record or password hash is ever fetched by the browser.
 const response = await fetch(getApiUrl() + "/api/auth/login", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ identifier: usernamePart, tenantId: matchedTenant.id, password: inputPwd })
 });
 const data = await response.json();

 setIsLoading(false);

 if (!response.ok || !data.token) {
 setError(data.error || t('Invalid Employee ID or password', language));
 return;
 }

 const firebaseUser = await loginWithCustomToken(data.token);
 if (!firebaseUser) {
 setError(language === 'ar' ? 'فشل إنشاء جلسة الدخول الآمنة.' : 'Failed to establish a secure session.');
 return;
 }

 onLogin(data.user as UserProfile);
 return;
 }

 // Offline/local-demo mode (no Firebase configured): there is no server to verify
 // against, so credentials are checked against the in-memory seed users only.
 const SEED_HASH_ADMIN = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
 const SEED_HASH_123 = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
 let loginUsers: UserProfile[] = [...users];

 if (matchedTenant.id === 'tenant-2m' || matchedTenant.id === '2m') {
 const platformAdmins: UserProfile[] = [
 {
 empCode: 'PA-ADMIN',
 username: 'admin',
 password: SEED_HASH_ADMIN,
 customRole: 'PLATFORM_ADMIN',
 fullNameAr: 'المدير العام للمشروع',
 fullNameEn: 'General Project Manager',
 roleAr: 'المدير العام',
 roleEn: 'General Platform Admin',
 tenantId: matchedTenant.id
 },
 {
 empCode: 'PA-01',
 username: 'alspagh',
 password: SEED_HASH_123,
 customRole: 'PLATFORM_ADMIN',
 fullNameAr: 'أبو السباع (Platform Admin)',
 fullNameEn: 'Alspagh (Platform Admin)',
 roleAr: 'مدير المنصة',
 roleEn: 'Platform Administrator',
 tenantId: matchedTenant.id
 },
 {
 empCode: 'PA-02',
 username: 'amrrageb',
 password: SEED_HASH_123,
 customRole: 'PLATFORM_ADMIN',
 fullNameAr: 'عمرو رجب (Platform Admin)',
 fullNameEn: 'Amr Rageb (Platform Admin)',
 roleAr: 'مدير المنصة',
 roleEn: 'Platform Administrator',
 tenantId: matchedTenant.id
 }
 ];

 platformAdmins.forEach(admin => {
 if (!loginUsers.some(u => u.username === admin.username)) {
 loginUsers.push(admin);
 }
 });
 }

 const systemAdmin: UserProfile = {
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
 canApproveSafety: true,
 tenantId: matchedTenant.id
 };
 if (!loginUsers.some(u => u.username === 'admin')) {
 loginUsers.push(systemAdmin);
 }

 const hashedEntered = await hashPassword(inputPwd);

 const matchedUser = loginUsers.find((u) => {
 const isMatchedCredentials =
 (u.empCode.toUpperCase() === usernamePart.toUpperCase() ||
 u.username.toLowerCase() === usernamePart) &&
 u.password === hashedEntered;

 if (!isMatchedCredentials) return false;

 return u.tenantId === matchedTenant.id;
 });

 setIsLoading(false);
 if (matchedUser) {
 onLogin(matchedUser);
 return;
 }

 setError(t('Invalid Employee ID or password', language));
 } catch (err) {
 console.error("Login verification failed:", err);
 setIsLoading(false);
 setError(language === 'ar' ? 'حدث خطأ أثناء التحقق من البيانات.' : 'An error occurred during verification.');
 }
 };

 return (
 <div className="min-h-screen bg-[#F1F5F9] dark:bg-neutral-950 flex flex-col font-sans relative overflow-hidden">
 {/* Background Ambience */}
 <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
 <div className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] rounded-full bg-orange-500/5 blur-3xl absolute -top-1/4 -end-/4" />
 <div className="w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] rounded-full bg-blue-500/5 blur-3xl absolute -bottom-1/4 -start-/4" />
 </div>

 {/* Header */}
 <header className="bg-[#0F172A] border-b border-slate-700 py-4 px-6 shadow-md text-white z-10 relative">
 <div className="max-w-7xl mx-auto flex items-center justify-between">
 <div className={`flex items-center gap-3 flex-row`}>
 <div className="w-9 h-9 bg-orange-500 rounded flex items-center justify-center font-bold text-lg text-white shadow-inner flex-shrink-0">
 <Factory className="w-5 h-5 text-white" />
 </div>
 <div className={language === 'ar' ? 'text-start' : 'text-end'}>
 <h1 className={`text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 flex-row`}>
 <span>{t("CementMaster PTW", language)}</span>
 <span className="text-orange-500">|</span>
 <span className="text-xs font-semibold text-slate-400">{t("Operations Hub", language)}</span>
 </h1>
 </div>
 </div>

 {/* Language selection dropdown/toggle on the top-right */}
 {onLanguageChange && (
 <div className="flex gap-1.5">
 <button
 type="button"
 onClick={() => onLanguageChange('ar')}
 className={`px-2 py-1 text-xs rounded transition-all font-bold bg-slate-800 text-slate-400 hover:text-white`}
 >
 العربية
 </button>
 <button
 type="button"
 onClick={() => onLanguageChange('en')}
 className={`px-2 py-1 text-xs rounded transition-all font-bold ${language === 'en' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
 >
 EN
 </button>
 <button
 type="button"
 onClick={() => onLanguageChange('zh')}
 className={`px-2 py-1 text-xs rounded transition-all font-bold ${language === 'zh' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
 >
 中文
 </button>
 </div>
 )}
 </div>
 </header>

 {/* Login Form */}
 <main className="flex-1 flex items-center justify-center p-4 z-10 relative">
 <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
 <div className="p-8">
 <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
 </div>
 
 <div className="text-center mb-8">
 <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
 {isSuperAdminPortal 
 ? (language === 'ar' ? 'بوابة المدير العام للمشروع' : 'Super Admin Portal')
 : t('System Login', language)}
 </h2>
 <p className="text-sm text-slate-500 dark:text-slate-400">
 {isSuperAdminPortal 
 ? (language === 'ar' ? 'الرجاء إدخال اسم المستخدم وكلمة المرور الخاصة بإدارة المشروع' : 'Please enter the system administrator credentials')
 : t('Please enter your employee ID and password', language)}
 </p>

 </div>

 <form onSubmit={handleSubmit} className="space-y-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 <div>
 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
 {language === 'ar' ? 'معرف الدخول (username@company)' : (language === 'zh' ? '登录ID (username@company)' : 'Login ID (username@company)')}
 </label>
 <input
 type="text"
 required
 value={employeeId}
 onChange={(e) => setEmployeeId(e.target.value)}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 dark:text-white transition-colors text-sm font-sans"
 placeholder={language === 'ar' ? 'مثال: username@company' : 'e.g. username@company'}
 />
 </div>

 <div>
 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
 {t('Password', language)}
 </label>
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 dark:text-white transition-colors"
 placeholder="••••••••"
 />
 </div>

 <div className="flex items-center justify-between text-sm">
 <label className="flex items-center gap-2 cursor-pointer">
 <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
 <span className="text-slate-600 dark:text-slate-400">{t('Remember me', language)}</span>
 </label>
 {/* 
 <button
 type="button"
 onClick={() => {
 setForgotEmployeeId(employeeId);
 setShowForgotModal(true);
 setForgotStep('INPUT_ID');
 setForgotError('');
 setForgotFeedback('');
 }}
 className="text-orange-600 dark:text-orange-400 font-medium hover:underline focus:outline-none bg-transparent border-0 cursor-pointer"
 >
 {t('Forgot password?', language)}
 </button>
 */}
 </div>

 {error && (
 <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-3 py-2 text-sm rounded-lg">
 {error}
 </div>
 )}

 <button
 type="submit"
 disabled={isLoading}
 className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
 >
 {isLoading ? (
 <Activity className="w-5 h-5 animate-spin" />
 ) : (
 <>
 <span>{t('Access Control Hub', language)}</span>
 <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
 </>
 )}
 </button>
 </form>

 {/* Commented out quick demo logins */}
 <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center animate-fade-in">
 <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
 <ShieldAlert className="w-4 h-4" />
 <span>{t('Secure login, audited for safety compliance', language)}</span>
 </div>
 </div>
 </div>
 </div>
 </main>

 {/* FORGOT PASSWORD MODAL OVERLAY */}
 {showForgotModal && (
 <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 
 {/* Modal Header */}
 <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between border-b border-slate-700">
 <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
 <Lock className="w-4 h-4 text-orange-500" />
 <span>{language === 'ar' ? 'استعادة كلمة المرور' : 'Reset Password'}</span>
 </h3>
 <button 
 type="button" 
 onClick={() => setShowForgotModal(false)}
 className="text-slate-400 hover:text-white transition-colors text-lg font-bold bg-transparent border-0 cursor-pointer"
 >
 ✕
 </button>
 </div>

 {/* Modal Body */}
 <div className="p-6 text-slate-850 dark:text-slate-105">
 
 {/* Feedback messages */}
 {forgotFeedback && (
 <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 px-3 py-2.5 text-xs rounded-lg font-medium leading-relaxed animate-fade-in">
 {forgotFeedback}
 </div>
 )}
 {forgotError && (
 <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-3 py-2.5 text-xs rounded-lg font-medium">
 {forgotError}
 </div>
 )}

 {/* STEP 1: Enter Username & Company */}
 {forgotStep === 'INPUT_ID' && (
 <form onSubmit={handleRequestResetCode} className="space-y-4">
 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
 {language === 'ar'
 ? 'الرجاء إدخال معرف الدخول الخاص بك. سيقوم النظام بتوليد كود أمان وإرساله فوراً إلى إيميل مدير النظام العام: eng.alspagh@gmail.com'
 : 'Please enter your login ID. The system will generate a security code and send it to the general manager email: eng.alspagh@gmail.com'}
 </p>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans text-end">
 {language === 'ar' ? 'معرف الدخول (username@companyname)' : 'Login ID (username@companyname)'}
 </label>
 <input
 type="text"
 required
 value={forgotEmployeeId}
 onChange={(e) => setForgotEmployeeId(e.target.value)}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white transition-colors text-sm font-sans"
 placeholder="e.g. admin@2m"
 />
 </div>
 <button
 type="submit"
 disabled={forgotLoading}
 className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer text-sm"
 >
 {forgotLoading ? (
 <Activity className="w-4 h-4 animate-spin" />
 ) : (
 <span>{language === 'ar' ? 'إرسال كود التحقق' : 'Send Verification Code'}</span>
 )}
 </button>
 </form>
 )}

 {/* STEP 2: Verify code */}
 {forgotStep === 'VERIFY_CODE' && (
 <form onSubmit={handleVerifyResetCode} className="space-y-4">
 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
 {language === 'ar'
 ? 'لقد تم إرسال كود من 6 أرقام إلى eng.alspagh@gmail.com. الرجاء إدخاله أدناه للمتابعة.'
 : 'A 6-digit code has been sent to eng.alspagh@gmail.com. Please enter it below to proceed.'}
 </p>
 
 {autofilledCode && (
 <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5 text-[11px] text-orange-600 dark:text-orange-400 mb-2 flex items-center justify-between" dir="ltr">
 <span>{language === 'ar' ? 'كود المحاكاة المولد:' : 'Simulated Code Generated:'} <strong className="font-mono text-sm tracking-widest">{autofilledCode}</strong></span>
 <button 
 type="button" 
 onClick={() => setVerificationCode(autofilledCode)}
 className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded font-bold hover:bg-orange-600 cursor-pointer border-0"
 >
 {language === 'ar' ? 'نسخ الكود' : 'Autofill'}
 </button>
 </div>
 )}

 <div>
 <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 text-end">
 {language === 'ar' ? 'كود التحقق (6 أرقام)' : 'Verification Code (6 Digits)'}
 </label>
 <input
 type="text"
 required
 maxLength={6}
 value={verificationCode}
 onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white transition-colors text-center text-lg font-mono tracking-[0.4em]"
 placeholder="000000"
 />
 </div>
 <div className="flex gap-2">
 <button
 type="submit"
 disabled={forgotLoading}
 className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer text-sm"
 >
 {forgotLoading ? (
 <Activity className="w-4 h-4 animate-spin" />
 ) : (
 <span>{language === 'ar' ? 'التحقق من الكود' : 'Verify Code'}</span>
 )}
 </button>
 <button
 type="button"
 onClick={() => setForgotStep('INPUT_ID')}
 className="px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-lg text-sm border-0 cursor-pointer"
 >
 {language === 'ar' ? 'رجوع' : 'Back'}
 </button>
 </div>
 </form>
 )}

 {/* STEP 3: Reset Password */}
 {forgotStep === 'NEW_PASSWORD' && (
 <form onSubmit={handleResetPassword} className="space-y-4">
 <div>
 <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 text-end">
 {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
 </label>
 <input
 type="password"
 required
 value={newForgotPwd}
 onChange={(e) => setNewForgotPwd(e.target.value)}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white transition-colors text-sm"
 placeholder="••••••••"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 text-end">
 {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
 </label>
 <input
 type="password"
 required
 value={confirmForgotPwd}
 onChange={(e) => setConfirmForgotPwd(e.target.value)}
 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white transition-colors text-sm"
 placeholder="••••••••"
 />
 </div>
 <button
 type="submit"
 disabled={forgotLoading}
 className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer text-sm"
 >
 {forgotLoading ? (
 <Activity className="w-4 h-4 animate-spin" />
 ) : (
 <span>{language === 'ar' ? 'حفظ كلمة المرور' : 'Save & Reset Password'}</span>
 )}
 </button>
 </form>
 )}

 </div>
 </div>
 </div>
 )}
 </div>
 );
}
