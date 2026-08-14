import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, deriveClaims, isAdminCapableRole, makeUid } from '../auth.ts';

test('hashPassword produces a bcrypt hash, and verifyPassword accepts the matching plaintext', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.ok(hash.startsWith('$2'), 'expected a bcrypt hash');
  assert.notEqual(hash, 'correct horse battery staple');

  const { valid, upgradedHash } = await verifyPassword('correct horse battery staple', hash);
  assert.equal(valid, true);
  assert.equal(upgradedHash, undefined, 'bcrypt hashes should not be flagged for migration');
});

test('verifyPassword rejects a wrong password', async () => {
  const hash = await hashPassword('correct-password');
  const { valid } = await verifyPassword('wrong-password', hash);
  assert.equal(valid, false);
});

test('verifyPassword transparently accepts and migrates a legacy unsalted SHA-256 hash', async () => {
  // sha256("123") — the exact seed hash the old client-side scheme shipped in the JS bundle.
  const legacyHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
  const { valid, upgradedHash } = await verifyPassword('123', legacyHash);

  assert.equal(valid, true);
  assert.ok(upgradedHash, 'a successful legacy match should produce a bcrypt hash to persist');
  assert.ok(upgradedHash!.startsWith('$2'));

  // The upgraded hash must itself verify going forward, closing the loop.
  const second = await verifyPassword('123', upgradedHash);
  assert.equal(second.valid, true);
  assert.equal(second.upgradedHash, undefined);
});

test('verifyPassword rejects a wrong password against a legacy hash without upgrading it', async () => {
  const legacyHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
  const { valid, upgradedHash } = await verifyPassword('not-123', legacyHash);
  assert.equal(valid, false);
  assert.equal(upgradedHash, undefined);
});

test('verifyPassword rejects when there is no stored hash at all', async () => {
  const { valid } = await verifyPassword('anything', undefined);
  assert.equal(valid, false);
});

test('deriveClaims maps role and tenant, and recognizes the platform admin seed pattern', () => {
  const claims = deriveClaims({ tenantId: 'tenant-demo', empCode: 'E1', customRole: 'SAFETY_MANAGER' });
  assert.deepEqual(claims, { tenantId: 'tenant-demo', empCode: 'E1', role: 'SAFETY_MANAGER', platformAdmin: false });

  const platformAdminByRole = deriveClaims({ tenantId: 'tenant-x', empCode: 'PA-1', customRole: 'PLATFORM_ADMIN' });
  assert.equal(platformAdminByRole.platformAdmin, true);

  const platformAdminBySeed = deriveClaims({ tenantId: 'tenant-2m', empCode: 'PA-ADMIN', username: 'admin' });
  assert.equal(platformAdminBySeed.platformAdmin, true);

  const regularAdminUsername = deriveClaims({ tenantId: 'tenant-demo', empCode: 'ADMIN01', username: 'admin' });
  assert.equal(regularAdminUsername.platformAdmin, false, 'username "admin" alone, outside tenant-2m, is not a platform admin');
});

test('isAdminCapableRole recognizes admin-capable roles and rejects ordinary ones', () => {
  assert.equal(isAdminCapableRole('SAFETY_MANAGER'), true);
  assert.equal(isAdminCapableRole('SUPER_ADMIN'), true);
  assert.equal(isAdminCapableRole('EMPLOYEE'), false);
  assert.equal(isAdminCapableRole('PRODUCTION_DEPT'), false);
});

test('makeUid produces a stable, filesystem/Firestore-safe id from tenant + empCode', () => {
  assert.equal(makeUid('tenant-demo', 'EMP101'), 'tenant-demo__EMP101');
  // Same inputs must always produce the same uid (it's used as both the Firebase Auth uid
  // and the credentials-collection document id).
  assert.equal(makeUid('tenant-demo', 'EMP101'), makeUid('tenant-demo', 'EMP101'));
});
