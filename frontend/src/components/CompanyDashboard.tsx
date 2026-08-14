import React from 'react';
import { Building2, ShieldCheck, Users2, Sparkles, ArrowRight, BadgeDollarSign } from 'lucide-react';
import type { Language, Tenant, UserProfile } from '../types';

interface CompanyDashboardProps {
  company?: Tenant;
  currentUser?: UserProfile;
  users?: UserProfile[];
  language: Language;
  onSwitchTenant?: (tenantId: string) => void;
  onOpenBilling?: () => void;
}

export function CompanyDashboard({ company, currentUser, users = [], language, onSwitchTenant, onOpenBilling }: CompanyDashboardProps) {
  const activeCompany = company || { id: 'tenant-demo', name: 'Company', plan: 'STARTER' as const, status: 'ACTIVE' as const, maxUsers: 25, description: '' };
  const safeUsers = Array.isArray(users) ? users : [];
  const tenantUsers = safeUsers.filter((user) => user && user.tenantId === activeCompany.id);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 text-slate-800 dark:text-slate-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {activeCompany.logoUrl ? (
                <img src={activeCompany.logoUrl} alt={activeCompany.name} className="h-14 w-14 rounded-xl border border-slate-200 object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-600">
                  {activeCompany.name?.slice(0, 1).toUpperCase() || 'C'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Company Portal</p>
                <h1 className="text-2xl font-bold">{activeCompany.name || 'Your company'}</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {language === 'ar'
                    ? 'لوحة تحكم مخصصة لإدارة الشركة، المستخدمين، والخطة الحالية.'
                    : 'A dedicated workspace for your company, team members, and current plan.'}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                {activeCompany.plan || 'STARTER'} • {activeCompany.status || 'TRIAL'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold">{language === 'ar' ? 'معلومات الشركة' : 'Company overview'}</h2>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">{activeCompany.description || (language === 'ar' ? 'شركة مدارة عبر المنصة' : 'Managed through the SaaS platform')}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                  <p className="text-xs uppercase text-slate-400">{language === 'ar' ? 'المستخدمون' : 'Users'}</p>
                  <p className="mt-1 text-xl font-semibold">{tenantUsers.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                  <p className="text-xs uppercase text-slate-400">{language === 'ar' ? 'الحد الأقصى' : 'Seat limit'}</p>
                  <p className="mt-1 text-xl font-semibold">{activeCompany.maxUsers || 20}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users2 className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold">{language === 'ar' ? 'فريق الشركة' : 'Your team'}</h2>
            </div>
            <div className="space-y-2">
              {tenantUsers.length > 0 ? tenantUsers.map((user, idx) => (
                <div key={user.empCode || user.username || idx} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-3 py-2 text-sm">
                  <div>
                    <div className="font-semibold">{user.fullNameAr || user.fullNameEn || user.username || 'User'}</div>
                    <div className="text-xs text-slate-500">@{user.username || 'user'}</div>
                  </div>
                  <span className="rounded-full bg-orange-100 dark:bg-orange-950/40 px-2 py-1 text-[11px] font-semibold text-orange-700 dark:text-orange-300">
                    {user.customRole || 'EMPLOYEE'}
                  </span>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 p-3 text-sm text-slate-500">
                  {language === 'ar' ? 'لا يوجد أعضاء بعد.' : 'No members yet.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{language === 'ar' ? 'خيارات الشركة' : 'Company options'}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{language === 'ar' ? 'تبديل بين الشركات أو إدارة خطتك بسهولة.' : 'Switch company context or manage your plan with ease.'}</p>
            </div>
            <div className="rounded-full bg-orange-100 dark:bg-orange-950/40 px-3 py-1 text-sm font-semibold text-orange-700 dark:text-orange-300">
              <Sparkles className="me-1 inline h-4 w-4" />
              {currentUser?.customRole === 'SUPER_ADMIN' ? (language === 'ar' ? 'مدير شركة' : 'Company admin') : (language === 'ar' ? 'عضو' : 'Member')}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {onSwitchTenant && (
              <button onClick={() => onSwitchTenant(activeCompany.id)} className="flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 font-semibold cursor-pointer">
                <ArrowRight className="h-4 w-4" />
                {language === 'ar' ? 'الدخول لنظام تصاريح الشركة' : 'Enter Company EHS System'}
              </button>
            )}
            {onOpenBilling && (
              <button onClick={onOpenBilling} className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <BadgeDollarSign className="h-4 w-4" />
                {language === 'ar' ? 'الفواتير والتحليلات' : 'Billing & analytics'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
