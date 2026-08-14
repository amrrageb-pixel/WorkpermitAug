import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  runTransaction,
  type Firestore
} from "firebase/firestore";
import {
  UserProfile,
  Permit,
  Incident,
  HiraAssessment,
  SafetyAudit,
  TrainingRecord,
  Tenant,
  SaaSAuditLogEntry
} from "../types";
import { getApiUrl } from "./api";

import {
  getAuth,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser
} from "firebase/auth";

const env = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is supplied and valid
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { auth };

let authReadyPromise: Promise<FirebaseUser | null> | null = null;

/**
 * Resolves once Firebase Auth has finished restoring any persisted session on page load.
 * `auth.currentUser` can briefly be null immediately after a reload even for a signed-in
 * user, so callers that need a token right away should await this first.
 */
function waitForAuthReady(): Promise<FirebaseUser | null> {
  if (!auth) return Promise.resolve(null);
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth!, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
  return authReadyPromise;
}

/**
 * Establishes a real Firebase Auth session from the custom token minted by the backend's
 * /api/auth/login endpoint after it verifies the user's password server-side. This is what
 * makes `request.auth` meaningful in Firestore rules — nothing about role or tenant scoping
 * is trusted from the client alone.
 */
export async function loginWithCustomToken(token: string): Promise<FirebaseUser | null> {
  if (!auth) return null;
  try {
    const cred = await signInWithCustomToken(auth, token);
    return cred.user;
  } catch (err) {
    console.error("Firebase custom-token sign-in failed:", err);
    return null;
  }
}

export async function logoutWithFirebaseAuth(): Promise<boolean> {
  if (!auth) return false;
  try {
    await signOut(auth);
    return true;
  } catch (err) {
    console.error("Firebase Auth logout failed:", err);
    return false;
  }
}

/**
 * ID token for the current Firebase Auth session, used to authenticate calls to admin-only
 * backend endpoints (e.g. /api/users/set-password). Returns null if not signed in.
 */
export async function getCallerIdToken(): Promise<string | null> {
  if (!auth) return null;
  const user = auth.currentUser || (await waitForAuthReady());
  if (!user) return null;
  return user.getIdToken();
}

/**
 * Sets or resets a user's password via the backend's admin-only endpoint. This is the ONLY
 * way a password should ever be written when Firebase is configured — Firestore rules reject
 * any client write to the `password` field directly, so `dbSaveUser`/`dbSaveUsersBatch` must
 * never include it.
 */
export async function setUserPasswordSecure(
  tenantId: string,
  empCode: string,
  newPassword: string,
  mustChangePassword = true
): Promise<{ success: boolean; error?: string }> {
  const idToken = await getCallerIdToken();
  if (!idToken) {
    return { success: false, error: "Not signed in." };
  }
  try {
    const response = await fetch(getApiUrl() + "/api/users/set-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ tenantId, empCode, newPassword, mustChangePassword }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Failed to set password." };
    }
    return { success: true };
  } catch (error) {
    console.error("Error calling set-password:", error);
    return { success: false, error: "Failed to reach the server." };
  }
}

// Recursively strip undefined values from an object (Firestore rejects undefined)
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' && value !== null ? sanitizeForFirestore(value) : value;
    }
  }
  return cleaned;
}

// Helper to write a single item to Firestore
async function setFirestoreDoc(collectionName: string, id: string, data: any, merge = false) {
  if (!db) return false;
  try {
    const sanitized = sanitizeForFirestore(data);
    await setDoc(doc(db, collectionName, id), sanitized, { merge });
    return true;
  } catch (error) {
    console.error(`Error saving to Firestore collection ${collectionName}:`, error);
    return false;
  }
}

// Helper to delete a single item from Firestore
async function deleteFirestoreDoc(collectionName: string, id: string) {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting from Firestore collection ${collectionName}:`, error);
    return false;
  }
}

// Helper to fetch all items from a collection
async function getFirestoreDocs<T>(collectionName: string): Promise<T[] | null> {
  if (!db) return null;
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ ...doc.data() } as T);
    });
    return items;
  } catch (error) {
    console.error(`Error fetching from Firestore collection ${collectionName}:`, error);
    return null;
  }
}

// Firestore rejects a writeBatch with more than 500 operations, so any bulk save (a full
// tenant seed, a large import) is split into chunks of at most this size and committed as
// separate batches.
const FIRESTORE_BATCH_LIMIT = 500;

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Writes an arbitrary (collectionPath, id, data) list across as many 500-op batches as needed. */
async function commitDocsInChunks(
  writes: { collectionPath: string; id: string; data: any }[],
  merge = false
): Promise<boolean> {
  if (!db) return false;
  try {
    for (const group of chunkArray(writes, FIRESTORE_BATCH_LIMIT)) {
      const batch = writeBatch(db);
      group.forEach(({ collectionPath, id, data }) => {
        const ref = doc(db!, collectionPath, id);
        batch.set(ref, sanitizeForFirestore(data), { merge });
      });
      await batch.commit();
    }
    return true;
  } catch (error) {
    console.error("Error committing chunked batch writes:", error);
    return false;
  }
}

// Helper to batch save items
async function saveFirestoreBatch<T extends { id?: string; empCode?: string }>(
  collectionName: string,
  items: T[],
  idKey: 'id' | 'empCode'
) {
  const writes = items
    .map((item) => ({ id: (idKey === 'empCode' ? item.empCode : item.id) as string | undefined, data: item }))
    .filter((w): w is { id: string; data: T } => !!w.id)
    .map(({ id, data }) => ({ collectionPath: collectionName, id, data }));
  return commitDocsInChunks(writes);
}

// --- USER OPERATIONS ---
export async function dbGetUsers(tenantIds?: string[]): Promise<UserProfile[] | null> {
  if (!db) return null;
  try {
    let ids = tenantIds;
    if (!ids) {
      const tenants = await dbGetTenants();
      ids = tenants ? tenants.map(t => t.id) : [];
    }
    const allUsers: UserProfile[] = [];
    for (const tenantId of ids) {
      const querySnapshot = await getDocs(collection(db, 'ehs_tenants', tenantId, 'users'));
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && (data.empCode || data.username)) {
          allUsers.push({ ...data } as UserProfile);
        }
      });
    }
    return allUsers;
  } catch (error) {
    console.error("Error fetching users per tenant:", error);
    return null;
  }
}

// `password` is never written here — Firestore rules reject any client write that includes
// it, and the field lives in a separate `credentials` collection the client can't touch at
// all. Use setUserPasswordSecure() to set/change a password.
export async function dbSaveUser(user: UserProfile) {
  if (!user.tenantId) return false;
  const { password: _omit, ...profile } = user;
  return setFirestoreDoc(`ehs_tenants/${user.tenantId}/users`, user.empCode, profile, true);
}

export async function dbSaveUsersBatch(users: UserProfile[]) {
  const writes = users.map((user) => {
    const tenantId = user.tenantId || 'tenant-demo';
    const { password: _omit, ...profile } = user;
    return { collectionPath: `ehs_tenants/${tenantId}/users`, id: user.empCode, data: profile };
  });
  return commitDocsInChunks(writes, true);
}

export async function dbDeleteUser(empCode: string, tenantId?: string) {
  if (!tenantId) return false;
  return deleteFirestoreDoc(`ehs_tenants/${tenantId}/users`, empCode);
}

// --- PERMIT OPERATIONS ---
export async function dbGetPermits(tenantIds?: string[]): Promise<Permit[] | null> {
  if (!db) return null;
  try {
    let ids = tenantIds;
    if (!ids) {
      const tenants = await dbGetTenants();
      ids = tenants ? tenants.map(t => t.id) : [];
    }
    const allItems: Permit[] = [];
    for (const tenantId of ids) {
      const querySnapshot = await getDocs(collection(db, 'ehs_tenants', tenantId, 'ptw_records'));
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.id) {
          allItems.push({ ...data } as Permit);
        }
      });
    }
    return allItems;
  } catch (error) {
    console.error("Error fetching permits per tenant:", error);
    return null;
  }
}

export async function dbSavePermit(permit: Permit) {
  const tenantId = permit.tenantId || 'tenant-demo';
  return setFirestoreDoc(`ehs_tenants/${tenantId}/ptw_records`, permit.id, permit);
}

export interface TransactionalSaveResult {
  success: boolean;
  /** True when another writer changed the record after this edit started (lost-update race). */
  conflict?: boolean;
  latest?: Permit;
}

/**
 * Optimistic-concurrency permit write: aborts instead of silently overwriting when the
 * document's `version` no longer matches what this edit was based on — e.g. two approvers
 * (Production and Electrical) both had the permit open and submit within moments of each
 * other. The loser gets the latest record back instead of clobbering the winner's write.
 */
export async function dbSavePermitTransactional(
  permit: Permit,
  expectedVersion: number | undefined
): Promise<TransactionalSaveResult> {
  if (!db) return { success: false };
  const tenantId = permit.tenantId || 'tenant-demo';
  const ref = doc(db, 'ehs_tenants', tenantId, 'ptw_records', permit.id);

  try {
    let conflict = false;
    let latest: Permit | undefined;

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const currentVersion = snap.exists() ? ((snap.data() as any).version || 0) : 0;

      if (snap.exists() && expectedVersion !== undefined && currentVersion !== expectedVersion) {
        conflict = true;
        latest = { ...(snap.data() as any) } as Permit;
        return;
      }

      tx.set(ref, sanitizeForFirestore({ ...permit, version: currentVersion + 1 }));
    });

    if (conflict) return { success: false, conflict: true, latest };
    return { success: true };
  } catch (error) {
    console.error("Error in transactional permit save:", error);
    return { success: false };
  }
}

export async function dbSavePermitsBatch(permits: Permit[]) {
  const writes = permits.map((permit) => ({
    collectionPath: `ehs_tenants/${permit.tenantId || 'tenant-demo'}/ptw_records`,
    id: permit.id,
    data: permit
  }));
  return commitDocsInChunks(writes);
}

export async function dbDeletePermit(id: string, tenantId?: string) {
  const tId = tenantId || 'tenant-demo';
  return deleteFirestoreDoc(`ehs_tenants/${tId}/ptw_records`, id);
}

// --- INCIDENT OPERATIONS ---
export async function dbGetIncidents(tenantIds?: string[]): Promise<Incident[] | null> {
  if (!db) return null;
  try {
    let ids = tenantIds;
    if (!ids) {
      const tenants = await dbGetTenants();
      ids = tenants ? tenants.map(t => t.id) : [];
    }
    const allItems: Incident[] = [];
    for (const tenantId of ids) {
      const querySnapshot = await getDocs(collection(db, 'ehs_tenants', tenantId, 'ehs_incidents'));
      querySnapshot.forEach((doc) => {
        allItems.push({ ...doc.data() } as Incident);
      });
    }
    return allItems;
  } catch (error) {
    console.error("Error fetching incidents per tenant:", error);
    return null;
  }
}

export async function dbSaveIncident(incident: Incident) {
  const tenantId = incident.tenantId || 'tenant-demo';
  return setFirestoreDoc(`ehs_tenants/${tenantId}/ehs_incidents`, incident.id, incident);
}

export async function dbSaveIncidentsBatch(incidents: Incident[]) {
  const writes = incidents.map((incident) => ({
    collectionPath: `ehs_tenants/${incident.tenantId || 'tenant-demo'}/ehs_incidents`,
    id: incident.id,
    data: incident
  }));
  return commitDocsInChunks(writes);
}

export async function dbDeleteIncident(id: string, tenantId?: string) {
  const tId = tenantId || 'tenant-demo';
  return deleteFirestoreDoc(`ehs_tenants/${tId}/ehs_incidents`, id);
}

// --- HIRA OPERATIONS ---
export async function dbGetHiras(tenantIds?: string[]): Promise<HiraAssessment[] | null> {
  if (!db) return null;
  try {
    let ids = tenantIds;
    if (!ids) {
      const tenants = await dbGetTenants();
      ids = tenants ? tenants.map(t => t.id) : [];
    }
    const allItems: HiraAssessment[] = [];
    for (const tenantId of ids) {
      const querySnapshot = await getDocs(collection(db, 'ehs_tenants', tenantId, 'ehs_hiras'));
      querySnapshot.forEach((doc) => {
        allItems.push({ ...doc.data() } as HiraAssessment);
      });
    }
    return allItems;
  } catch (error) {
    console.error("Error fetching hiras per tenant:", error);
    return null;
  }
}

export async function dbSaveHira(hira: HiraAssessment) {
  const tenantId = hira.tenantId || 'tenant-demo';
  return setFirestoreDoc(`ehs_tenants/${tenantId}/ehs_hiras`, hira.id, hira);
}

export async function dbSaveHirasBatch(hiras: HiraAssessment[]) {
  const writes = hiras.map((hira) => ({
    collectionPath: `ehs_tenants/${hira.tenantId || 'tenant-demo'}/ehs_hiras`,
    id: hira.id,
    data: hira
  }));
  return commitDocsInChunks(writes);
}

export async function dbDeleteHira(id: string, tenantId?: string) {
  const tId = tenantId || 'tenant-demo';
  return deleteFirestoreDoc(`ehs_tenants/${tId}/ehs_hiras`, id);
}

// --- AUDIT OPERATIONS ---
export async function dbGetAudits(tenantIds?: string[]): Promise<SafetyAudit[] | null> {
  if (!db) return null;
  try {
    let ids = tenantIds;
    if (!ids) {
      const tenants = await dbGetTenants();
      ids = tenants ? tenants.map(t => t.id) : [];
    }
    const allItems: SafetyAudit[] = [];
    for (const tenantId of ids) {
      const querySnapshot = await getDocs(collection(db, 'ehs_tenants', tenantId, 'ehs_audits'));
      querySnapshot.forEach((doc) => {
        allItems.push({ ...doc.data() } as SafetyAudit);
      });
    }
    return allItems;
  } catch (error) {
    console.error("Error fetching audits per tenant:", error);
    return null;
  }
}

export async function dbSaveAudit(audit: SafetyAudit) {
  const tenantId = audit.tenantId || 'tenant-demo';
  return setFirestoreDoc(`ehs_tenants/${tenantId}/ehs_audits`, audit.id, audit);
}

export async function dbSaveAuditsBatch(audits: SafetyAudit[]) {
  const writes = audits.map((audit) => ({
    collectionPath: `ehs_tenants/${audit.tenantId || 'tenant-demo'}/ehs_audits`,
    id: audit.id,
    data: audit
  }));
  return commitDocsInChunks(writes);
}

export async function dbDeleteAudit(id: string, tenantId?: string) {
  const tId = tenantId || 'tenant-demo';
  return deleteFirestoreDoc(`ehs_tenants/${tId}/ehs_audits`, id);
}

// --- TRAINING OPERATIONS ---
export async function dbGetTrainings(tenantIds?: string[]): Promise<TrainingRecord[] | null> {
  if (!db) return null;
  try {
    let ids = tenantIds;
    if (!ids) {
      const tenants = await dbGetTenants();
      ids = tenants ? tenants.map(t => t.id) : [];
    }
    const allItems: TrainingRecord[] = [];
    for (const tenantId of ids) {
      const querySnapshot = await getDocs(collection(db, 'ehs_tenants', tenantId, 'ehs_trainings'));
      querySnapshot.forEach((doc) => {
        allItems.push({ ...doc.data() } as TrainingRecord);
      });
    }
    return allItems;
  } catch (error) {
    console.error("Error fetching trainings per tenant:", error);
    return null;
  }
}

export async function dbSaveTraining(training: TrainingRecord) {
  const tenantId = training.tenantId || 'tenant-demo';
  return setFirestoreDoc(`ehs_tenants/${tenantId}/ehs_trainings`, training.id, training);
}

export async function dbSaveTrainingsBatch(trainings: TrainingRecord[]) {
  const writes = trainings.map((training) => ({
    collectionPath: `ehs_tenants/${training.tenantId || 'tenant-demo'}/ehs_trainings`,
    id: training.id,
    data: training
  }));
  return commitDocsInChunks(writes);
}

export async function dbDeleteTraining(id: string, tenantId?: string) {
  const tId = tenantId || 'tenant-demo';
  return deleteFirestoreDoc(`ehs_tenants/${tId}/ehs_trainings`, id);
}

// --- TENANT OPERATIONS ---
export async function dbGetTenants(): Promise<Tenant[] | null> {
  return getFirestoreDocs<Tenant>('ehs_tenants');
}

export async function dbSaveTenant(tenant: Tenant) {
  return setFirestoreDoc('ehs_tenants', tenant.id, tenant);
}

export async function dbSaveTenantsBatch(tenants: Tenant[]) {
  return saveFirestoreBatch('ehs_tenants', tenants, 'id');
}

export async function dbDeleteTenant(id: string) {
  return deleteFirestoreDoc('ehs_tenants', id);
}

// --- LOCAL-DEMO-MODE HASHING & AUDITING ---
// hashPassword is SHA-256 (fast, unsalted) and is ONLY appropriate for the offline/no-Firebase
// demo mode, where there is no server to hash on. Whenever Firebase is configured, real
// password verification and hashing (bcrypt) happens server-side in backend/auth.ts via
// /api/auth/login, /api/auth/reset-password, and /api/users/set-password — never here.

export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function dbLogActivity(_entry: Omit<SaaSAuditLogEntry, 'id' | 'timestamp'>) {
  // Activity logging to Firebase Firestore has been completely stopped to conserve Firebase storage space and write quotas.
  return true;
}

export async function dbClearAuditLogs(tenantId?: string): Promise<boolean> {
  if (!db) return false;
  try {
    const colRef = tenantId 
      ? collection(db, 'ehs_tenants', tenantId, 'audit_logs')
      : collection(db, 'global_audit_logs');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return true;
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error clearing audit logs from Firebase:", error);
    return false;
  }
}

export async function dbGetAuditLogs(tenantId?: string): Promise<SaaSAuditLogEntry[] | null> {
  if (!db) return null;
  try {
    const allLogs: SaaSAuditLogEntry[] = [];
    if (tenantId) {
      const q = query(
        collection(db, 'ehs_tenants', tenantId, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        allLogs.push(doc.data() as SaaSAuditLogEntry);
      });
    } else {
      const q = query(
        collection(db, 'global_audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        allLogs.push(doc.data() as SaaSAuditLogEntry);
      });
    }
    return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return null;
  }
}
