import express, { type NextFunction, type Request, type Response } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createTenantContext, filterTenantData, type TenantContext } from "./saas";
import { admin, getAdminAuth, getAdminFirestore, getAdminInitError } from "./firebaseAdmin";
import { verifyPassword, hashPassword, deriveClaims, isAdminCapableRole, makeUid, type AuthClaims } from "./auth";

// Password hashes live in a dedicated `credentials` collection (doc id = makeUid(tenantId, empCode)),
// never on the user profile doc — Firestore rules deny all client access to this collection
// outright, so only this server (via the Admin SDK) ever reads or writes a password hash.
function credentialsRef(adminDb: admin.firestore.Firestore, tenantId: string, empCode: string) {
  return adminDb.collection("credentials").doc(makeUid(tenantId, empCode));
}

dotenv.config();

const app = express();
const PORT = 3000;

// Trust proxy for accurate client IP identification on Vercel
app.set("trust proxy", 1);

// Inject security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // Inline style attributes are used by the UI's animation library (motion/framer-motion);
      // this is a standard, low-severity trade-off vs. a full nonce-based style pipeline.
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: [
        "'self'",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com",
        "https://generativelanguage.googleapis.com",
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://permit-to-work-system-33-frontend.vercel.app",
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation: request source origin not trusted"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// API rate limiter: max 100 requests per 15 mins per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter: max 10 attempts per 15 mins per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many authentication attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);

// Lazy-initialized Gemini client with Telemetry headers
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Ensure pre-empted fallback answers for offline / keyless testing
const getFallbackRecommendations = (promptType: string, task: string) => {
  if (promptType === "HIRA_AI") {
    return `### 💡 NEBOSH AI Controls for: "${task || 'Working in Confined Area'}"

**1. Elimination & Substitution:**
* Consider if mechanical diagnostic probes can perform internal thickness checks before sending workers inside.

**2. Engineering Controls:**
* **Mechanical Pinning:** Securely wedge structural elements to stop accidental weight transfer.
* **Positive Energy Isolation:** Enforce complete Lockout/Tagout (LOTO) on primary breakers.
* **Forced Air Exchange:** Mount pneumatic blowing devices to sweep the environment of toxic clinker particulates.

**3. Administrative Controls:**
* **Continuous Multi-Gas Sensing:** Require gas testing certificates every 2 hours (O2 target 19.5%-23.5%, LEL < 10%).
* **Safety Watcher:** Station an experienced observer continuously at the manhole.

**4. Required PPE:**
* Flame-retardant welding suit, double-lanyard body harness, and calibrated personal gas monitors.`;
  } else if (promptType === "PREDICTIVE_ANALYTICS") {
    return `### 📊 Predictive EHS Risk Analysis & Forecasts

1. **Hot Spot Zones:** The **Cement Mill Shell** and **Kiln preheater towers** present elevated potential for high-severity hazards (falls, entrapment).
2. **Key Contributor:** 65% of reported Near Misses link directly to hurried shift handovers or lack of individual lock application (LOTO omissions).
3. **Preventive Directive (ISO 45001):** Advise HSE Leads to run random audits on contractor padlock boxes during the coming 48-hour mechanical maintenance sweep.`;
  } else {
    return `### 🛡️ HSE Action Plan & Recommendations

* **Review Control Suitability:** Ensure a qualified supervisor inspects physical barricades before starting work.
* **Conduct Tool-Box Talk:** Disseminate NEBOSH General Certificate lessons to all mechanical sub-contractors on the shift.
* **Confirm Isolations:** Never rely on supervisor master keys; mandate personal locks at LOTO stations.`;
  }
};

// Resolves the tenant id encoded in a "username@companyname" login identifier.
function resolveTenantIdFromEmployeeId(employeeId: string): { username: string; tenantId: string } {
  const trimmed = employeeId.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex === -1) {
    return { username: trimmed.toLowerCase(), tenantId: "tenant-2m" };
  }
  const username = trimmed.substring(0, atIndex).toLowerCase();
  const companyPart = trimmed.substring(atIndex + 1).toLowerCase();
  const tenantId = companyPart === "2m" ? "tenant-2m" : `tenant-${companyPart}`;
  return { username, tenantId };
}

// Verifies the caller's Firebase Auth ID token (issued after a successful /api/auth/login)
// and attaches the tenant/role claims minted at login time. Required for any endpoint that
// mutates data on the caller's behalf, since Firestore rules alone cannot validate a password.
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return res.status(503).json({ error: "Secure auth is not configured on this server", detail: getAdminInitError() });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    (req as Request & { callerClaims: AuthClaims }).callerClaims = {
      tenantId: (decoded as any).tenantId,
      empCode: (decoded as any).empCode,
      role: (decoded as any).role,
      platformAdmin: !!(decoded as any).platformAdmin,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired session token" });
  }
}

// --- API ROUTES ---

const tenants: TenantContext[] = [
  createTenantContext({ id: "tenant-demo", name: "Demo Manufacturing Co.", plan: "ENTERPRISE", maxUsers: 250, status: "ACTIVE" }),
  createTenantContext({ id: "tenant-solar", name: "Solar Grid Operations", plan: "GROWTH", maxUsers: 100, status: "TRIAL" })
];

const mockPermits = [
  { id: "permit-1", tenantId: "tenant-demo", title: "Hot work", status: "ACTIVE" },
  { id: "permit-2", tenantId: "tenant-solar", title: "Confined space", status: "PENDING_DEPT" }
];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiKeyAvailable: !!process.env.GEMINI_API_KEY });
});

app.get("/api/tenants", (req, res) => {
  res.json({ tenants });
});

// In-memory store for reset codes
const resetCodes = new Map<string, string>();

app.post("/api/auth/forgot-password", async (req, res) => {
  const { employeeId } = req.body as { employeeId?: string };
  if (!employeeId) {
    return res.status(400).json({ error: "Employee ID (username@companyname) is required" });
  }

  // If Admin SDK is available, verify the user actually exists before issuing a code.
  // (Without it, Firestore is treated as unconfigured / local-demo mode, so this check is skipped.)
  const adminDb = getAdminFirestore();
  if (adminDb) {
    const { username, tenantId } = resolveTenantIdFromEmployeeId(employeeId);
    try {
      const snapshot = await adminDb.collection("ehs_tenants").doc(tenantId).collection("users").get();
      const exists = snapshot.docs.some((d) => {
        const data = d.data();
        return data.username?.toLowerCase() === username || data.empCode?.toUpperCase() === username.toUpperCase();
      });
      if (!exists) {
        return res.status(404).json({ error: "Username not found under this company." });
      }
    } catch (error) {
      console.error("[forgot-password] lookup failed:", error);
      return res.status(500).json({ error: "Failed to verify account." });
    }
  }

  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes.set(employeeId.toLowerCase().trim(), code);

  // Define target email
  const targetEmail = "eng.alspagh@gmail.com";

  // Create transporter (checks env variables first, falls back to mock)
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);

  let emailSent = false;
  let errorMsg = "";

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"EHS Platform Control" <${smtpUser}>`,
        to: targetEmail,
        subject: "Permit-to-Work System - Password Reset Code",
        text: `Hello Admin,

A password reset request was initiated for Employee ID: ${employeeId}.
Your 6-digit verification code is: ${code}

Please enter this code on the application's verification screen to complete the reset.

Regards,
EHS Platform System`,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-top: 0;">EHS Platform Control</h2>
          <p>Hello Admin,</p>
          <p>A password reset request was initiated for employee: <strong>${employeeId}</strong>.</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${code}</span>
          </div>
          <p>Please enter this code on the application's verification screen to complete the password reset.</p>
          <p style="color: #64748b; font-size: 11px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">This is an automated safety alert notification.</p>
        </div>`
      });

      emailSent = true;
      console.log(`[EMAIL SUCCESS] Verification code ${code} sent to ${targetEmail}`);
    } catch (e: any) {
      console.error("[EMAIL ERROR] Failed to send email via SMTP:", e);
      errorMsg = e.message || "SMTP error";
    }
  }

  // Fallback / simulation print in console for developer/debug visibility
  console.log(`\n=========================================\n`);
  console.log(`[EMAIL SIMULATION] Reset Code generated!`);
  console.log(`Target: ${targetEmail}`);
  console.log(`Employee ID: ${employeeId}`);
  console.log(`Verification Code: ${code}`);
  console.log(`=========================================\n`);

  res.json({
    success: true,
    emailSent,
    message: emailSent 
      ? `Verification code successfully sent to ${targetEmail}.`
      : `Code generated and logged to console. (To enable SMTP email sending, configure SMTP_USER and SMTP_PASS environment variables).`,
    code: (process.env.NODE_ENV !== "production" && !smtpUser) ? code : undefined
  });
});

app.post("/api/auth/verify-reset-code", (req, res) => {
  const { employeeId, code } = req.body as { employeeId?: string; code?: string };
  if (!employeeId || !code) {
    return res.status(400).json({ error: "Employee ID and verification code are required" });
  }

  const savedCode = resetCodes.get(employeeId.toLowerCase().trim());
  if (savedCode && savedCode === code.trim()) {
    res.json({ success: true, message: "Verification code is valid" });
  } else {
    res.status(400).json({ error: "Invalid verification code" });
  }
});

// Finalizes a password reset. Requires the same 6-digit code issued by /forgot-password so this
// endpoint can't be used as a bare "set anyone's password" primitive even if called directly.
app.post("/api/auth/reset-password", async (req, res) => {
  const { employeeId, code, newPassword } = req.body as { employeeId?: string; code?: string; newPassword?: string };
  if (!employeeId || !code || !newPassword) {
    return res.status(400).json({ error: "Employee ID, verification code, and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const savedCode = resetCodes.get(employeeId.toLowerCase().trim());
  if (!savedCode || savedCode !== code.trim()) {
    return res.status(400).json({ error: "Invalid or expired verification code" });
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return res.status(503).json({ error: "Secure password reset is not configured on this server yet.", detail: getAdminInitError() });
  }

  const { username, tenantId } = resolveTenantIdFromEmployeeId(employeeId);
  try {
    const usersRef = adminDb.collection("ehs_tenants").doc(tenantId).collection("users");
    const snapshot = await usersRef.get();
    const match = snapshot.docs.find((d) => {
      const data = d.data();
      return data.username?.toLowerCase() === username || data.empCode?.toUpperCase() === username.toUpperCase();
    });

    if (!match) {
      return res.status(404).json({ error: "User not found." });
    }

    const newHash = await hashPassword(newPassword);
    const matchData = match.data();
    await credentialsRef(adminDb, tenantId, matchData.empCode || match.id).set({ password: newHash }, { merge: true });
    await usersRef.doc(match.id).set({ mustChangePassword: false }, { merge: true });
    if (matchData.password) {
      await usersRef.doc(match.id).update({ password: admin.firestore.FieldValue.delete() });
    }

    resetCodes.delete(employeeId.toLowerCase().trim());
    res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("[reset-password] failed:", error);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, tenantId, password } = req.body as { identifier?: string; tenantId?: string; password?: string };
  if (!identifier || !tenantId || !password) {
    return res.status(400).json({ error: "identifier, tenantId, and password are required" });
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminFirestore();
  if (!adminAuth || !adminDb) {
    return res.status(503).json({
      error: "Secure authentication is not configured on this server yet.",
      detail: getAdminInitError(),
    });
  }

  try {
    const usersRef = adminDb.collection("ehs_tenants").doc(tenantId).collection("users");
    const snapshot = await usersRef.get();
    const doc = snapshot.docs.find((d) => {
      const data = d.data();
      return data.empCode?.toUpperCase() === identifier.toUpperCase() || data.username?.toLowerCase() === identifier.toLowerCase();
    });

    let userData: any = doc?.data();
    let userDocId = doc?.id;
    let passwordVerified = false;

    if (userData) {
      const credRef = credentialsRef(adminDb, tenantId, userData.empCode);
      const credSnap = await credRef.get();
      // Prefer the dedicated credentials collection; fall back to a legacy password hash that
      // may still be sitting on the user profile doc from before this collection existed.
      const storedHash = credSnap.exists ? credSnap.data()?.password : userData.password;
      const { valid, upgradedHash } = await verifyPassword(password, storedHash);
      passwordVerified = valid;

      if (valid && upgradedHash) {
        await credRef.set({ password: upgradedHash }, { merge: true });
        if (userData.password && userDocId) {
          // Migration complete — stop co-locating the hash with the (broadly readable) profile doc.
          await usersRef.doc(userDocId).update({ password: admin.firestore.FieldValue.delete() });
        }
      }
    }

    // One-time bootstrap path for the very first platform admin, when no Firestore user exists
    // yet. Disabled unless the operator explicitly sets PLATFORM_ADMIN_BOOTSTRAP_PASSWORD — no
    // credential is hardcoded in source or shipped to the browser. Once a real admin user is
    // created through the app, this env var should be unset.
    if (!passwordVerified) {
      const bootstrapPwd = process.env.PLATFORM_ADMIN_BOOTSTRAP_PASSWORD;
      const isBootstrapCandidate = !userData && identifier.toLowerCase() === "admin" && bootstrapPwd && password === bootstrapPwd;
      if (isBootstrapCandidate) {
        userData = {
          empCode: "PA-ADMIN",
          username: "admin",
          tenantId,
          customRole: "PLATFORM_ADMIN",
          fullNameEn: "Platform Administrator",
          fullNameAr: "مدير المنصة",
          roleEn: "Platform Administrator",
          roleAr: "مدير المنصة",
          mustChangePassword: true,
        };
        passwordVerified = true;
      }
    }

    if (!userData || !passwordVerified) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const claims = deriveClaims({ ...userData, tenantId });
    const uid = makeUid(claims.tenantId, userData.empCode);
    const token = await adminAuth.createCustomToken(uid, claims as unknown as Record<string, any>);

    const { password: _omit, ...sanitizedUser } = userData;
    res.json({ token, user: { ...sanitizedUser, tenantId: claims.tenantId } });
  } catch (error) {
    console.error("[login] failed:", error);
    res.status(500).json({ error: "Login failed due to a server error." });
  }
});

// Admin-only: sets or resets another user's password. Never accepts a raw client-side hash —
// only this endpoint (or /api/auth/reset-password) may write the `password` field, which
// Firestore rules also enforce by rejecting any client write that includes it.
app.post("/api/users/set-password", requireAuth, async (req, res) => {
  const { tenantId, empCode, newPassword, mustChangePassword } = req.body as {
    tenantId?: string; empCode?: string; newPassword?: string; mustChangePassword?: boolean;
  };
  if (!tenantId || !empCode || !newPassword) {
    return res.status(400).json({ error: "tenantId, empCode, and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const caller = (req as Request & { callerClaims: AuthClaims }).callerClaims;
  const isSelfService = caller.tenantId === tenantId && caller.empCode === empCode;
  const authorized = caller.platformAdmin || (caller.tenantId === tenantId && isAdminCapableRole(caller.role)) || isSelfService;
  if (!authorized) {
    return res.status(403).json({ error: "You do not have permission to set passwords for this company." });
  }
  // Self-service password changes may not also grant themselves elevated mustChangePassword control.
  const effectiveMustChange = isSelfService ? false : (mustChangePassword ?? true);

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return res.status(503).json({ error: "Secure auth is not configured on this server", detail: getAdminInitError() });
  }

  try {
    const hash = await hashPassword(newPassword);
    await credentialsRef(adminDb, tenantId, empCode).set({ password: hash }, { merge: true });
    const userDocRef = adminDb.collection("ehs_tenants").doc(tenantId).collection("users").doc(empCode);
    await userDocRef.set({ mustChangePassword: effectiveMustChange }, { merge: true });
    const existing = await userDocRef.get();
    if (existing.exists && existing.data()?.password) {
      await userDocRef.update({ password: admin.firestore.FieldValue.delete() });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("[set-password] failed:", error);
    res.status(500).json({ error: "Failed to set password." });
  }
});

app.get("/api/tenant/permits", (req, res) => {
  const tenantId = req.query.tenantId as string | undefined;
  if (!tenantId) {
    return res.status(400).json({ error: "tenantId is required" });
  }

  res.json({ permits: filterTenantData(mockPermits, tenantId) });
});

// AI Safety recommendations endpoint
app.post("/api/ai/recommendations", async (req, res) => {
  const { promptType, task, currentStatus } = req.body;

  try {
    const client = getGeminiClient();
    if (!client) {
      // Return high-quality preseeded fallback advice immediately to prevent crash
      const fallback = getFallbackRecommendations(promptType, task);
      return res.json({ 
        recommendation: fallback,
        source: "Local Safety Brain (No API Key set)" 
      });
    }

    let searchPrompt = "";
    if (promptType === "HIRA_AI") {
      searchPrompt = `You are a NEBOSH-certified senior safety consultant. Provide a highly professional, bilingual (English + Arabic), bullet-by-bullet list of Hazard Control measures for the task: "${task || 'Welding in Cement Mill'}". 
      Structure your suggestions strictly around the Hierarchy of Controls (Elimination, Substitution, Engineering Controls, Administrative Controls, PPE). 
      Make the suggestions specific, technical, and ready to include in a cement plant safety plan. Keep the tone humble and authoritative.`;
    } else if (promptType === "PREDICTIVE_ANALYTICS") {
      searchPrompt = `You are an EHS Lead Analyst. Provide predictive analytics and risk forecasts for a heavy industrial cement manufacturing facility. 
      Mention hot-spot zones (e.g. Raw Mills, Kiln towers), the probability of incident types like Near Misses or property damage based on recent activities under status: "${currentStatus || 'REPORTED'}". 
      Add a 3-point recommendation under ISO 45001 standard. Keep the length concise and highly scannable, in Arabic and English.`;
    } else {
      searchPrompt = `Given the safety incident or hazard task "${task || 'Working in elevated platform'}", suggest 4 immediate corrective actions (CAPA) following safety standard ISO 45001 rules. Give output in a clear bilingual (En/Ar) format.`;
    }

    // Call modern gemini-3.5-flash model
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: searchPrompt
    });

    const recommendationText = response.text || getFallbackRecommendations(promptType, task);

    res.json({
      recommendation: recommendationText,
      source: "Gemini 3.5 Flash Safety Assistant"
    });

  } catch (error: any) {
    console.error("Gemini API Error in safety proxy:", error);
    // Graceful error recovery fallback
    res.json({
      recommendation: getFallbackRecommendations(promptType, task),
      source: "Local EHS Recovery System (Error fallback)"
    });
  }
});

// --- SERVER STATIC FILES IN PRODUCTION ---
async function start() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "../frontend/dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    app.get("/", (req, res) => {
      res.json({ message: "EHS Plant System API Server is running" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EHS Plant System API running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  start();
}

export default app;
