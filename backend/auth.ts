import bcrypt from "bcryptjs";
import * as crypto from "crypto";

const BCRYPT_ROUNDS = 12;

/** Legacy hashes from the old client-side scheme are raw unsalted SHA-256 hex digests (64 chars). */
function isLegacySha256Hash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verifies a password against a stored hash, transparently supporting the legacy unsalted
 * SHA-256 hashes that existed before authentication moved server-side. Returns whether the
 * password matched, and — if it matched a legacy hash — a freshly computed bcrypt hash the
 * caller should persist to upgrade that record on the fly.
 */
export async function verifyPassword(
  plain: string,
  storedHash: string | undefined | null
): Promise<{ valid: boolean; upgradedHash?: string }> {
  if (!storedHash) return { valid: false };

  if (isLegacySha256Hash(storedHash)) {
    const valid = sha256Hex(plain) === storedHash.toLowerCase();
    if (!valid) return { valid: false };
    return { valid: true, upgradedHash: await hashPassword(plain) };
  }

  const valid = await bcrypt.compare(plain, storedHash);
  return { valid };
}

export interface AuthClaims {
  tenantId: string;
  empCode: string;
  role: string;
  platformAdmin: boolean;
}

const ADMIN_CAPABLE_ROLES = new Set([
  "SUPER_ADMIN",
  "SAFETY_MANAGER",
  "PLATFORM_ADMIN",
  "COMPANY_ADMIN",
]);

export function deriveClaims(user: {
  tenantId?: string;
  empCode: string;
  customRole?: string;
  sandboxRole?: string;
  username?: string;
}): AuthClaims {
  const role = user.customRole || user.sandboxRole || "EMPLOYEE";
  const platformAdmin =
    role === "PLATFORM_ADMIN" ||
    (user.username === "admin" && (user.tenantId === "tenant-2m" || user.tenantId === "2m"));

  return {
    tenantId: user.tenantId || "tenant-demo",
    empCode: user.empCode,
    role,
    platformAdmin,
  };
}

export function isAdminCapableRole(role: string): boolean {
  return ADMIN_CAPABLE_ROLES.has(role);
}

/** Stable Firebase Auth uid for a tenant-scoped employee record. */
export function makeUid(tenantId: string, empCode: string): string {
  return `${tenantId}__${empCode}`.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 128);
}
