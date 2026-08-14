import React from 'react';
import { BadgeDollarSign, BarChart3, CalendarDays, CheckCircle2, ReceiptText, Sparkles } from 'lucide-react';
import type { Language, Tenant, UserProfile } from '../types';
import { UNLIMITED } from '../utils/subscriptions';

interface CompanyBillingAnalyticsProps {
  company?: Tenant;
  currentUser?: UserProfile;
  users: UserProfile[];
  language: Language;
  onUpgradePlan?: (plan: Tenant['plan']) => void;
  onBack?: () => void;
}

const PLAN_DETAILS: Record<Tenant['plan'], { price: string; description: string; features: string[] }> = {
  STARTER: {
    price: '$49/mo',
    description: 'For small teams getting started with digital permit control.',
    features: ['Up to 20 users', 'Core permit workflows', 'Basic analytics']
  },
  PROFESSIONAL: {
    price: '$149/mo',
    description: 'For scaling operations needing richer oversight and collaboration.',
    features: ['Up to 100 users', 'Advanced reporting', 'Priority support']
  },
  ENTERPRISE: {
    price: '$399/mo',
    description: 'For multi-site organizations that need full governance and automation.',
    features: ['Unlimited users', 'Custom roles', 'Dedicated success manager']
  }
};

export function CompanyBillingAnalytics({ company, currentUser, users, language, onUpgradePlan, onBack }: CompanyBillingAnalyticsProps) {
  const tenantUsers = users.filter((user) => user.tenantId === company?.id);
  const seatUsage = company && company.maxUsers !== UNLIMITED
    ? Math.min(100, Math.round((tenantUsers.length / (company.maxUsers || 1)) * 100))
    : 0;
  const [selectedPlan, setSelectedPlan] = React.useState<Tenant['plan'] | null>(null);
  const [checkoutName, setCheckoutName] = React.useState('');
  const [checkoutEmail, setCheckoutEmail] = React.useState('');
  const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);

  const invoices = [
    { id: 'INV-1042', amount: '$149.00', status: language === 'ar' ? 'مدفوع' : 'Paid', due: '2026-07-10' },
    { id: 'INV-1038', amount: '$49.00', status: language === 'ar' ? 'معلق' : 'Pending', due: '2026-08-01' }
  ];

  const usageTrend = [42, 58, 49, 71, 67, 84];
  const chartPoints = usageTrend
    .map((value, index) => `${(index / (usageTrend.length - 1)) * 100},${100 - value}`)
    .join(' ');

  const handleSelectPlan = (plan: Tenant['plan']) => {
    if (company?.plan === plan) return;
    setSelectedPlan(plan);
    setCheckoutSuccess(false);
  };

  const handleConfirmCheckout = () => {
    if (!selectedPlan) return;
    onUpgradePlan?.(selectedPlan);
    setCheckoutSuccess(true);
    setSelectedPlan(null);
  };

  const handleExportInvoice = () => {
    const payload = {
      company: company?.name || 'Company',
      plan: company?.plan || 'STARTER',
      amount: company?.plan === 'ENTERPRISE' ? '$399.00' : company?.plan === 'PROFESSIONAL' ? '$149.00' : '$49.00',
      dueDate: '2026-08-01'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${company?.id || 'company'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Billing & Analytics</p>
              <h1 className="text-2xl font-bold">{company?.name || 'Company billing'}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {language === 'ar'
                  ? 'إدارة الاشتراك، الاستخدام، والفواتير من شاشة موحدة.'
                  : 'Manage subscriptions, usage, and invoices from a single production-ready workspace.'}
              </p>
            </div>
            <button onClick={onBack} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
              {language === 'ar' ? 'العودة إلى نظرة سريعة' : 'Back to overview'}
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{language === 'ar' ? 'الخطط المتاحة' : 'Plan options'}</h2>
                <p className="text-sm text-slate-600">{language === 'ar' ? 'اختر خطة مناسبة لنمو الشركة.' : 'Choose the right plan for your company growth.'}</p>
              </div>
              <div className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                <Sparkles className="me- inline h-4 w-4" />
                {company?.plan || 'STARTER'}
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {(['STARTER', 'GROWTH', 'ENTERPRISE'] as Tenant['plan'][]).map((plan) => {
                const isActive = company?.plan === plan;
                return (
                  <div key={plan} className={`rounded-xl border p-4 ${isActive ? 'border-orange-300 bg-orange-50 shadow-sm' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{plan}</h3>
                      {isActive ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{PLAN_DETAILS[plan].description}</p>
                    <p className="mt-4 text-2xl font-bold">{PLAN_DETAILS[plan].price}</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {PLAN_DETAILS[plan].features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{feature}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
                    >
                      {isActive ? (language === 'ar' ? 'الخطة الحالية' : 'Current plan') : (language === 'ar' ? 'ترقية' : 'Upgrade')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold">{language === 'ar' ? 'إحصائيات الاستخدام' : 'Usage analytics'}</h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{language === 'ar' ? 'استخدام المقاعد' : 'Seat usage'}</span>
                  <span className="font-semibold">{tenantUsers.length}/{company?.maxUsers || 20}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-orange-500" style={{ width: `${seatUsage}%` }} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{language === 'ar' ? 'اتجاه الاستخدام' : 'Usage trend'}</span>
                  <span className="font-semibold text-orange-600">+18%</span>
                </div>
                <svg viewBox="0 0 100 100" className="h-24 w-full">
                  <line x1="0" y1="100" x2="100" y2="100" stroke="#e2e8f0" strokeWidth="1" />
                  <polyline points={chartPoints} fill="none" stroke="#f97316" strokeWidth="3" />
                </svg>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-400">{language === 'ar' ? 'التصاريح النشطة' : 'Active permits'}</p>
                  <p className="mt-1 text-xl font-semibold">{Math.max(3, tenantUsers.length)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs uppercase text-slate-400">{language === 'ar' ? 'الموافقات المعلقة' : 'Pending approvals'}</p>
                  <p className="mt-1 text-xl font-semibold">{Math.max(1, Math.floor(tenantUsers.length / 3))}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold">{language === 'ar' ? 'الفواتير الأخيرة' : 'Recent invoices'}</h2>
            </div>
            <div className="mb-3 flex items-center justify-end">
              <button onClick={handleExportInvoice} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                {language === 'ar' ? 'تصدير الفاتورة' : 'Export invoice'}
              </button>
            </div>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div>
                    <div className="font-semibold">{invoice.id}</div>
                    <div className="text-sm text-slate-500">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due'}: {invoice.due}</div>
                  </div>
                  <div className="text-start">
                    <div className="font-semibold">{invoice.amount}</div>
                    <div className="text-sm text-emerald-600">{invoice.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold">{language === 'ar' ? 'حالة الاشتراك' : 'Subscription status'}</h2>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <BadgeDollarSign className="h-4 w-4" />
                {language === 'ar' ? 'اشتراك نشط' : 'Active subscription'}
              </div>
              <p className="mt-2 text-sm text-emerald-700">
                {language === 'ar'
                  ? 'سيتم تجديد الخطة تلقائيًا خلال 14 يومًا.'
                  : 'Your plan renews automatically in 14 days.'}
              </p>
            </div>
            {selectedPlan ? (
              <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                <div className="font-semibold">{language === 'ar' ? 'إتمام الاشتراك' : 'Complete subscription'}</div>
                <p className="mt-1">{language === 'ar' ? 'أدخل بياناتك لتأكيد الترقية إلى' : 'Confirm your upgrade to'} {selectedPlan}.</p>
                <div className="mt-3 grid gap-3">
                  <input value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} placeholder={language === 'ar' ? 'اسم صاحب البطاقة' : 'Cardholder name'} className="rounded-lg border border-orange-200 bg-white px-3 py-2" />
                  <input value={checkoutEmail} onChange={(e) => setCheckoutEmail(e.target.value)} placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email address'} className="rounded-lg border border-orange-200 bg-white px-3 py-2" />
                </div>
                <button onClick={handleConfirmCheckout} className="mt-3 rounded-lg bg-orange-600 px-3 py-2 font-semibold text-white">
                  {language === 'ar' ? 'تأكيد الترقية' : 'Confirm upgrade'}
                </button>
              </div>
            ) : null}
            {checkoutSuccess ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {language === 'ar' ? 'تم تأكيد الترقية بنجاح.' : 'Your subscription upgrade was confirmed successfully.'}
              </div>
            ) : null}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>{language === 'ar' ? 'المالك' : 'Owner'}: {currentUser?.fullNameEn || company?.ownerEmail || 'Team admin'}</p>
              <p className="mt-1">{language === 'ar' ? 'البريد' : 'Email'}: {company?.ownerEmail || 'billing@company.local'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
