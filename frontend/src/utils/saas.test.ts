import { describe, it, expect } from 'vitest';
import { isPermitExpired, getEffectivePermitStatus, canApprovePermits, canManageUsers, filterTenantRecords } from './saas';
import type { Permit, UserProfile } from '../types';

// Minimal fixture: only the fields the functions under test actually read are meaningful;
// the rest are structurally required by the Permit type but irrelevant here.
function makePermit(overrides: Partial<Permit>): Permit {
  return {
    id: 'PTW-1', tenantId: 'tenant-demo', title: 'Test', type: 'HOT', location: 'Kiln',
    requesterName: 'Tester', requesterRoleAr: '', requesterRoleEn: '', description: '',
    hazards: [], startDate: '', endDate: '', status: 'DRAFT',
    productionRequired: false, productionApproval: false,
    electricalRequired: false, electricalApproval: false,
    lotoRequired: false, gasTestRequired: false, hseApproval: false,
    requiredPPE: [], safetyPrecautionConfirmations: {}, workers: [], auditTrail: [],
    ...overrides,
  } as Permit;
}

describe('isPermitExpired / getEffectivePermitStatus', () => {
  it('is never expired while still DRAFT/ACTIVE-bound but before end time', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const permit = makePermit({ status: 'ACTIVE', endDate: future });
    expect(isPermitExpired(permit)).toBe(false);
    expect(getEffectivePermitStatus(permit)).toBe('ACTIVE');
  });

  it('reports expired once an ACTIVE permit is past its endDate', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const permit = makePermit({ status: 'ACTIVE', endDate: past });
    expect(isPermitExpired(permit)).toBe(true);
    expect(getEffectivePermitStatus(permit)).toBe('EXPIRED');
  });

  it('does not flag non-ACTIVE permits as expired regardless of endDate', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const permit = makePermit({ status: 'PENDING_DEPT', endDate: past });
    expect(isPermitExpired(permit)).toBe(false);
  });

  it('does not crash and reports not-expired when endDate is missing', () => {
    const permit = makePermit({ status: 'ACTIVE', endDate: undefined as unknown as string });
    expect(isPermitExpired(permit)).toBe(false);
  });
});

describe('canApprovePermits / canManageUsers', () => {
  function makeUser(overrides: Partial<UserProfile>): UserProfile {
    return {
      empCode: 'E1', username: 'u1', fullNameAr: '', fullNameEn: '', roleAr: '', roleEn: '',
      ...overrides,
    } as UserProfile;
  }

  it('grants approval capability only via an explicit approve flag or permission', () => {
    expect(canApprovePermits(makeUser({ canApproveSafety: true }))).toBe(true);
    expect(canApprovePermits(makeUser({ permissions: ['permits.approve'] }))).toBe(true);
    expect(canApprovePermits(makeUser({}))).toBe(false);
    expect(canApprovePermits(undefined)).toBe(false);
  });

  it('grants user management to admin-capable roles and the seeded admin account, not to a plain employee', () => {
    expect(canManageUsers(makeUser({ customRole: 'SAFETY_MANAGER' }))).toBe(true);
    expect(canManageUsers(makeUser({ username: 'admin' }))).toBe(true);
    expect(canManageUsers(makeUser({ customRole: 'EMPLOYEE' }))).toBe(false);
  });
});

describe('filterTenantRecords', () => {
  it('only returns records scoped to the requested tenant', () => {
    const records = [
      { tenantId: 'tenant-a', id: 1 },
      { tenantId: 'tenant-b', id: 2 },
      { tenantId: 'tenant-a', id: 3 },
    ];
    expect(filterTenantRecords(records, 'tenant-a').map(r => r.id)).toEqual([1, 3]);
  });
});
