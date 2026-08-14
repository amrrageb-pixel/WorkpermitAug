import type { Permit, Tenant, TenantScopedRecord, UserProfile } from '../types';
import { isModuleEnabled, UNLIMITED } from './subscriptions';

export function isPermitExpired(permit: Permit): boolean {
  if (permit.status === 'EXPIRED') return true;
  if (permit.status !== 'ACTIVE') return false;
  if (!permit.endDate) return false;
  const expiryTime = new Date(permit.endDate).getTime();
  return !isNaN(expiryTime) && Date.now() > expiryTime;
}

/**
 * Effective status accounting for time-based expiry that hasn't been persisted yet.
 * Use this instead of raw permit.status wherever "is this permit currently valid to work under"
 * is being decided or displayed.
 */
export function getEffectivePermitStatus(permit: Permit): Permit['status'] {
  return isPermitExpired(permit) ? 'EXPIRED' : permit.status;
}

export const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 'tenant-demo',
    name: 'Demo Manufacturing Co.',
    plan: 'ENTERPRISE',
    maxUsers: 250,
    status: 'ACTIVE',
    expiryDate: '2028-12-31',
    startDate: '2026-01-01',
    storageLimitGb: 100,
    storageUsedBytes: 0,
    enabledModules: ['PTW', 'HIRA', 'INCIDENT', 'CONTRACTOR', 'AUDIT', 'LOTO']
  },
  {
    id: 'tenant-solar',
    name: 'Solar Grid Operations',
    plan: 'STARTER',
    maxUsers: 25,
    status: 'TRIAL',
    expiryDate: '2027-06-30',
    startDate: '2026-01-01',
    storageLimitGb: 5,
    storageUsedBytes: 0,
    enabledModules: ['PTW']
  },
  {
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
  }
];

export function ensureTenantScope<T extends TenantScopedRecord>(record: T, tenantId: string): T {
  return { ...record, tenantId: record.tenantId || tenantId };
}

export function filterTenantRecords<T extends TenantScopedRecord>(records: T[], tenantId: string): T[] {
  return records.filter((record) => (record.tenantId || 'tenant-demo') === tenantId);
}

export function hasSaaSPermission(user?: UserProfile, permission?: string): boolean {
  if (!user || !permission) {
    return false;
  }

  const permissions = user.permissions ?? [];
  return permissions.includes(permission);
}

export function canManageUsers(user?: UserProfile): boolean {
  if (!user) return false;
  const role = user.customRole || '';
  const sandbox = user.sandboxRole || '';
  return hasSaaSPermission(user, 'users.manage') || 
         user.username === 'admin' || 
         ['SAFETY_MANAGER', 'PLATFORM_ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'].includes(role) ||
         sandbox === 'HSE' || sandbox === 'SUPER_ADMIN';
}

export function canApprovePermits(user?: UserProfile): boolean {
  return hasSaaSPermission(user, 'permits.approve') || Boolean(user?.canApproveSafety || user?.canApproveElectrical || user?.canApproveProduction);
}

export function scopeRecordsByTenant<T extends TenantScopedRecord>(records: T[], tenantId: string): T[] {
  return records.map((record) => ensureTenantScope(record, tenantId));
}

export function getTenantDisplayName(tenant?: Tenant): string {
  return tenant?.name || 'Default Tenant';
}

export function isTenantActive(tenant?: Tenant): boolean {
  return tenant?.status === 'ACTIVE' || tenant?.status === 'TRIAL';
}

export function getTenantPlanLabel(tenant?: Tenant): string {
  if (!tenant) {
    return 'Starter';
  }

  switch (tenant.plan) {
    case 'ENTERPRISE':
      return 'Enterprise';
    case 'PROFESSIONAL':
      return 'Professional';
    default:
      return 'Starter';
  }
}

export function getTenantFeatureHints(tenant?: Tenant): string[] {
  if (!tenant) {
    return ['Basic permits', 'Basic reporting'];
  }

  const hints: string[] = [];

  if (isModuleEnabled(tenant, 'PTW')) {
    hints.push('Permits to Work (PTW)');
  }
  if (isModuleEnabled(tenant, 'HIRA')) {
    hints.push('HIRA Risk Assessment');
  }
  if (isModuleEnabled(tenant, 'INCIDENT')) {
    hints.push('Incident Management (CAPA)');
  }
  if (isModuleEnabled(tenant, 'AUDIT')) {
    hints.push('Compliance Audits');
  }
  if (isModuleEnabled(tenant, 'CONTRACTOR')) {
    hints.push('Contractor Management');
  }
  if (isModuleEnabled(tenant, 'LOTO')) {
    hints.push('LOTO Energy Isolation');
  }

  return hints.length > 0 ? hints : ['Basic Reporting'];
}

/**
 * Safely writes to localStorage with automatic quota management & eviction fallback.
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.number === -2147024882) {
      console.warn(`LocalStorage quota exceeded while saving key "${key}". Evicting non-essential logs...`);
      try {
        localStorage.removeItem('ehs_audits_local');
        localStorage.removeItem('ehs_trainings_local');
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.error(`Failed to set item "${key}" even after cache eviction:`, retryErr);
        return false;
      }
    }
    return false;
  }
}

/**
 * Safely parses and reads JSON objects from localStorage with fallback defaults.
 */
export function safeLocalStorageGetItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading key "${key}" from localStorage:`, e);
    return fallback;
  }
}
