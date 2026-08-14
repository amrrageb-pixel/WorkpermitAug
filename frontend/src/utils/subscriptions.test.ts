import { describe, it, expect } from 'vitest';
import { hasReachedUserLimit, hasReachedStorageLimit, isSubscriptionExpired, UNLIMITED } from './subscriptions';
import type { Tenant } from '../types';

function makeTenant(overrides: Partial<Tenant>): Tenant {
  return { id: 'tenant-x', name: 'X', plan: 'STARTER', maxUsers: 10, status: 'ACTIVE', ...overrides };
}

describe('UNLIMITED sentinel (regression guard: Infinity does not survive JSON/Firestore round-trips)', () => {
  it('never reports the limit reached for a tenant with UNLIMITED maxUsers, at any count', () => {
    const tenant = makeTenant({ maxUsers: UNLIMITED });
    expect(hasReachedUserLimit(tenant, 0)).toBe(false);
    expect(hasReachedUserLimit(tenant, 999999)).toBe(false);
  });

  it('still enforces a real numeric maxUsers limit', () => {
    const tenant = makeTenant({ maxUsers: 5 });
    expect(hasReachedUserLimit(tenant, 4)).toBe(false);
    expect(hasReachedUserLimit(tenant, 5)).toBe(true);
  });

  it('never reports storage exceeded for UNLIMITED storageLimitGb', () => {
    const tenant = makeTenant({ storageLimitGb: UNLIMITED, storageUsedBytes: Number.MAX_SAFE_INTEGER });
    expect(hasReachedStorageLimit(tenant)).toBe(false);
  });

  it('a value that survives JSON serialization round-trips back to the same sentinel', () => {
    // This is exactly what breaks with Infinity: JSON.parse(JSON.stringify(Infinity)) is null.
    const roundTripped = JSON.parse(JSON.stringify(UNLIMITED));
    expect(roundTripped).toBe(UNLIMITED);
  });
});

describe('isSubscriptionExpired', () => {
  it('treats the platform-management tenant as never expired', () => {
    expect(isSubscriptionExpired(makeTenant({ id: 'tenant-2m', expiryDate: '2000-01-01' }))).toBe(false);
  });

  it('is expired once past the expiryDate', () => {
    expect(isSubscriptionExpired(makeTenant({ expiryDate: '2000-01-01' }))).toBe(true);
  });

  it('is not expired with no expiryDate set', () => {
    expect(isSubscriptionExpired(makeTenant({ expiryDate: undefined }))).toBe(false);
  });
});
