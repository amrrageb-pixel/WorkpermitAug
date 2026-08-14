import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

export { admin };

let app: admin.app.App | null = null;
let initAttempted = false;
let initError: string | null = null;

/**
 * Lazily initializes the Firebase Admin SDK from either:
 *  - FIREBASE_SERVICE_ACCOUNT_JSON (stringified service account JSON — preferred for hosted deploys), or
 *  - backend/serviceAccountKey.json (local dev convenience file, gitignored, never committed)
 *
 * Admin SDK credentials bypass Firestore Security Rules entirely, which is what lets this
 * server verify passwords and mint custom auth tokens without ever exposing user records
 * to the browser. If neither credential source is present, admin-dependent endpoints report
 * 503 instead of crashing the whole process, so the rest of the API (AI recommendations, etc.)
 * keeps working in environments that haven't configured Firebase yet.
 */
export function getFirebaseAdmin(): admin.app.App | null {
  if (app) return app;
  if (initAttempted) return null;
  initAttempted = true;

  try {
    let credential: admin.credential.Credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(serviceAccount);
    } else {
      const serviceAccountPath = path.resolve(__dirname, "serviceAccountKey.json");
      if (!fs.existsSync(serviceAccountPath)) {
        initError = "No Firebase Admin credential found (FIREBASE_SERVICE_ACCOUNT_JSON env var or backend/serviceAccountKey.json).";
        console.warn(`[firebaseAdmin] ${initError} Secure auth endpoints will return 503 until configured.`);
        return null;
      }
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      credential = admin.credential.cert(serviceAccount);
    }

    app = admin.initializeApp({ credential });
    return app;
  } catch (error: any) {
    initError = error?.message || String(error);
    console.error("[firebaseAdmin] Failed to initialize Firebase Admin SDK:", initError);
    return null;
  }
}

export function getAdminInitError(): string | null {
  return initError;
}

export function getAdminFirestore(): admin.firestore.Firestore | null {
  const a = getFirebaseAdmin();
  return a ? a.firestore() : null;
}

export function getAdminAuth(): admin.auth.Auth | null {
  const a = getFirebaseAdmin();
  return a ? a.auth() : null;
}
