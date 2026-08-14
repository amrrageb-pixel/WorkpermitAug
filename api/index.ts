import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

// --- SAAS CONTROLLER HELPERS ---
export type TenantPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';

export interface TenantContext {
  id: string;
  name: string;
  plan: TenantPlan;
  maxUsers: number;
  status: TenantStatus;
}

export interface SaaSUser {
  id: string;
  username: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

export interface TenantScopedRecord {
  tenantId: string;
  [key: string]: unknown;
}

export function createTenantContext(tenant: TenantContext): TenantContext {
  return {
    ...tenant,
    status: tenant.status ?? 'TRIAL'
  };
}

export function getUserPermissions(user: SaaSUser): string[] {
  return user.permissions ?? [];
}

export function hasPermission(user: SaaSUser, permission: string): boolean {
  return getUserPermissions(user).includes(permission);
}

export function filterTenantData<T extends TenantScopedRecord>(records: T[], tenantId: string): T[] {
  return records.filter((record) => record.tenantId === tenantId);
}

export function buildTenantScopedQuery(baseQuery: string, tenantId: string): string {
  return `${baseQuery} WHERE tenant_id = '${tenantId}'`;
}

export function getPlanFeatures(tenant: TenantContext): string[] {
  switch (tenant.plan) {
    case 'ENTERPRISE':
      return ['basic-permits', 'basic-reports', 'advanced-ai', 'audit-exports'];
    case 'GROWTH':
      return ['basic-permits', 'basic-reports', 'advanced-ai'];
    default:
      return ['basic-permits', 'basic-reports'];
  }
}

export function canAccessFeature(tenant: TenantContext, feature: string): boolean {
  return getPlanFeatures(tenant).includes(feature);
}

// --- EXPRESS APP SETUP ---
const app = express();

// Trust proxy for accurate client IP identification on Vercel
app.set("trust proxy", 1);

// Inject security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false,
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

// --- DATA SEEDS ---
const tenants: TenantContext[] = [
  createTenantContext({ id: "tenant-demo", name: "Demo Manufacturing Co.", plan: "ENTERPRISE", maxUsers: 250, status: "ACTIVE" }),
  createTenantContext({ id: "tenant-solar", name: "Solar Grid Operations", plan: "GROWTH", maxUsers: 100, status: "TRIAL" }),
  createTenantContext({ id: "tenant-2m", name: "2M SaaS Management Portal", plan: "ENTERPRISE", maxUsers: Infinity, status: "ACTIVE" })
];

const mockUsers: SaaSUser[] = [
  { id: "u-admin", username: "admin", tenantId: "tenant-demo", role: "SUPER_ADMIN", permissions: ["users.manage", "permits.approve", "tenants.view", "permits.create"] },
  { id: "u-requester", username: "ahmad_eng", tenantId: "tenant-demo", role: "REQUESTER", permissions: ["permits.create", "permits.view"] }
];

const mockPermits = [
  { id: "permit-1", tenantId: "tenant-demo", title: "Hot work", status: "ACTIVE" },
  { id: "permit-2", tenantId: "tenant-solar", title: "Confined space", status: "PENDING_DEPT" }
];

// In-memory store for reset codes
const resetCodes = new Map<string, string>();

// --- API ROUTES ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiKeyAvailable: !!process.env.GEMINI_API_KEY });
});

app.get("/api/tenants", (req, res) => {
  res.json({ tenants });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { employeeId } = req.body as { employeeId?: string };
  if (!employeeId) {
    return res.status(400).json({ error: "Employee ID (username@companyname) is required" });
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

app.post("/api/auth/login", (req, res) => {
  const { username, password, tenantId } = req.body as { username?: string; password?: string; tenantId?: string };
  const user = mockUsers.find((entry) => entry.username === username && password === "123");

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const tenant = tenants.find((entry) => entry.id === (tenantId || user.tenantId));
  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found" });
  }

  res.json({
    token: `tenant-token-${user.id}`,
    user,
    tenant,
    permissions: user.permissions,
    scopedQuery: buildTenantScopedQuery("SELECT * FROM permits", tenant.id)
  });
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
    res.json({
      recommendation: getFallbackRecommendations(promptType, task),
      source: "Local EHS Recovery System (Error fallback)"
    });
  }
});

export default app;
