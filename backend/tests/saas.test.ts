import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessFeature, createTenantContext, filterTenantData, getPlanFeatures, getUserPermissions, hasPermission } from '../saas.ts';

test('grants admin permissions and blocks tenant leakage', () => {
  const tenant = createTenantContext({
    id: 'tenant-a',
    name: 'Alpha Works',
    plan: 'ENTERPRISE',
    maxUsers: 250,
    status: 'ACTIVE'
  });

  const admin = {
    id: 'user-1',
    username: 'admin',
    tenantId: 'tenant-a',
    role: 'SUPER_ADMIN',
    permissions: ['users.manage', 'permits.approve', 'tenants.view']
  };

  assert.deepEqual(getUserPermissions(admin), ['users.manage', 'permits.approve', 'tenants.view']);
  assert.equal(hasPermission(admin, 'users.manage'), true);
  assert.equal(hasPermission(admin, 'permits.create'), false);

  const records = [
    { id: 'one', tenantId: 'tenant-a', title: 'Permit A' },
    { id: 'two', tenantId: 'tenant-b', title: 'Permit B' }
  ];

  assert.deepEqual(filterTenantData(records, tenant.id), [{ id: 'one', tenantId: 'tenant-a', title: 'Permit A' }]);
});

test('enables plan-specific features and blocks unsupported access', () => {
  const starter = createTenantContext({
    id: 'tenant-starter',
    name: 'Starter Works',
    plan: 'STARTER',
    maxUsers: 10,
    status: 'TRIAL'
  });

  const enterprise = createTenantContext({
    id: 'tenant-enterprise',
    name: 'Enterprise Works',
    plan: 'ENTERPRISE',
    maxUsers: 250,
    status: 'ACTIVE'
  });

  assert.deepEqual(getPlanFeatures(starter), ['basic-permits', 'basic-reports']);
  assert.deepEqual(getPlanFeatures(enterprise), ['basic-permits', 'basic-reports', 'advanced-ai', 'audit-exports']);
  assert.equal(canAccessFeature(starter, 'advanced-ai'), false);
  assert.equal(canAccessFeature(enterprise, 'advanced-ai'), true);
});
