import { Tenant, TenantPlan } from '../types';

/**
 * Sentinel for "no limit". `Infinity` cannot round-trip through JSON/Firestore
 * (it serializes to `null`), so plan/tenant limit fields use this instead.
 */
export const UNLIMITED = -1;

export interface PlanDetails {
  plan: TenantPlan;
  nameEn: string;
  nameAr: string;
  priceEn: string;
  priceAr: string;
  maxUsers: number;
  maxPermitsPerMonth: number;
  storageLimitGb: number;
  featuresEn: string[];
  featuresAr: string[];
}

export const SUBSCRIPTION_PLANS: Record<TenantPlan, PlanDetails> = {
  STARTER: {
    plan: 'STARTER',
    nameEn: 'Starter Plan',
    nameAr: 'الباقة المبتدئة (Starter)',
    priceEn: 'USD 100/year',
    priceAr: '100 دولار/سنوياً',
    maxUsers: 25,
    maxPermitsPerMonth: 200,
    storageLimitGb: 5,
    featuresEn: [
      'Up to 25 Active Users',
      'Up to 200 permits/month',
      '5 GB Storage',
      'Basic Dashboard',
      'Email Notifications',
      'Standard Reports',
      'Basic Support'
    ],
    featuresAr: [
      'حتى 25 مستخدم نشط',
      'حتى 200 تصريح عمل شهرياً',
      'مساحة تخزين 5 جيجابايت',
      'لوحة تحكم أساسية',
      'إشعارات البريد الإلكتروني',
      'التقارير القياسية',
      'الدعم الأساسي'
    ]
  },
  PROFESSIONAL: {
    plan: 'PROFESSIONAL',
    nameEn: 'Professional Plan',
    nameAr: 'الباقة الاحترافية (Professional)',
    priceEn: 'USD 500/year',
    priceAr: '500 دولار/سنوياً',
    maxUsers: 100,
    maxPermitsPerMonth: UNLIMITED,
    storageLimitGb: 50,
    featuresEn: [
      'Up to 100 Active Users',
      'Unlimited Permits',
      '50 GB Storage',
      'Mobile Applications',
      'Risk Assessment Module',
      'Incident Management',
      'Contractor Management',
      'KPI Dashboard',
      'API Access',
      'Priority Support'
    ],
    featuresAr: [
      'حتى 100 مستخدم نشط',
      'تصاريح عمل غير محدودة',
      'مساحة تخزين 50 جيجابايت',
      'تطبيقات الجوال',
      'وحدة تقييم المخاطر',
      'إدارة الحوادث',
      'إدارة المقاولين',
      'لوحة تحكم مؤشرات الأداء (KPI)',
      'صلاحية الوصول للـ API',
      'دعم ذو أولوية'
    ]
  },
  ENTERPRISE: {
    plan: 'ENTERPRISE',
    nameEn: 'Enterprise Plan',
    nameAr: 'باقة الشركات الكبرى (Enterprise)',
    priceEn: 'USD 1000/year',
    priceAr: '1000 دولار/سنوياً',
    maxUsers: UNLIMITED,
    maxPermitsPerMonth: UNLIMITED,
    storageLimitGb: UNLIMITED,
    featuresEn: [
      'Unlimited Active Users',
      'Unlimited Permits',
      'Unlimited Storage',
      'Single Sign-On (SSO)',
      'Multi-Site Management',
      'Custom Workflows',
      'Business Intelligence Dashboards',
      'White Label Branding',
      'Dedicated Account Manager',
      'Full API Access',
      'Custom Integrations',
      'Priority Support'
    ],
    featuresAr: [
      'مستخدمين نشطين غير محدودين',
      'تصاريح عمل غير محدودة',
      'مساحة تخزين غير محدودة',
      'تسجيل الدخول الموحد (SSO)',
      'إدارة مواقع متعددة',
      'مسارات عمل مخصصة',
      'لوحات تحكم ذكاء الأعمال (BI)',
      'العلامة التجارية المخصصة (White Label)',
      'مدير حساب خاص ومخصص',
      'وصول كامل للـ API',
      'تكاملات مخصصة',
      'أولوية دعم فائقة'
    ]
  }
};

/**
 * Check if the tenant's subscription has expired.
 */
export function isSubscriptionExpired(tenant: Tenant): boolean {
  if (tenant.id === 'tenant-2m' || tenant.id === '2m') return false; // Management domain
  if (!tenant.expiryDate) return false;
  const expiry = new Date(tenant.expiryDate);
  const now = new Date();
  return now > expiry;
}

/**
 * Checks if the tenant has reached the active user limit.
 */
export function hasReachedUserLimit(tenant: Tenant, currentActiveUserCount: number): boolean {
  const planDetails = SUBSCRIPTION_PLANS[tenant.plan || 'STARTER'];
  const maxUsers = tenant.maxUsers ?? planDetails.maxUsers;
  if (maxUsers === UNLIMITED || maxUsers < 0) return false;
  return currentActiveUserCount >= maxUsers;
}

/**
 * Checks if the tenant has exceeded the storage limit.
 */
export function hasReachedStorageLimit(tenant: Tenant): boolean {
  const planDetails = SUBSCRIPTION_PLANS[tenant.plan || 'STARTER'];
  const limitGb = tenant.storageLimitGb ?? planDetails.storageLimitGb;
  if (limitGb === UNLIMITED || limitGb < 0) return false;

  const usedBytes = tenant.storageUsedBytes || 0;
  const limitBytes = limitGb * 1024 * 1024 * 1024;
  return usedBytes >= limitBytes;
}

/**
 * Check if a specific module is enabled for the tenant.
 */
export function isModuleEnabled(tenant: Tenant, moduleName: string): boolean {
  if (tenant.plan === 'ENTERPRISE') return true;
  
  // Custom module toggles override defaults
  if (tenant.enabledModules) {
    return tenant.enabledModules.includes(moduleName);
  }

  // Professional plan modules
  if (tenant.plan === 'PROFESSIONAL') {
    const proModules = ['PTW', 'HIRA', 'INCIDENT', 'CONTRACTOR'];
    return proModules.includes(moduleName);
  }

  // Starter plan modules
  return moduleName === 'PTW';
}
