import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc } from "firebase/firestore";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { UserProfile } from "../types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_FIREBASE")) {
  console.error("Firebase config is missing or invalid in .env!");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Import EHS module seeds
import { 
  INITIAL_PERMITS_SEED, 
  INITIAL_INCIDENTS, 
  INITIAL_HIRAS, 
  INITIAL_AUDITS, 
  INITIAL_TRAINING 
} from "./initialEhsData";

// Define the 6 default users matching App.tsx
const DEFAULT_USERS_SEED: UserProfile[] = [
  {
    empCode: 'ADMIN01',
    password: 'admin',
    sandboxRole: 'HSE',
    customRole: 'SAFETY_MANAGER',
    username: 'admin',
    fullNameAr: 'مدير النظام (admin)',
    fullNameEn: 'System Administrator (admin)',
    roleAr: 'مدير النظام',
    roleEn: 'System Administrator',
    departmentAr: 'إدارة السلامة والصحة المهنية',
    departmentEn: 'Safety & Occupational Health Administration (HSE)',
    canCreatePermit: true,
    canApproveElectrical: true,
    canApproveProduction: true,
    canApproveSafety: true
  },
  {
    empCode: 'EMP101',
    password: '123',
    sandboxRole: 'REQUESTER',
    customRole: 'EMPLOYEE',
    username: 'ahmad_eng',
    fullNameAr: 'م. أحمد المنفذ',
    fullNameEn: 'Eng. Ahmed Al-Monafed',
    roleAr: 'مشرف الفريق المنفذ',
    roleEn: 'Maintenance Engineer',
    departmentAr: 'إدارة الصيانة',
    departmentEn: 'Maintenance Administration'
  },
  {
    empCode: 'EMP102',
    password: '123',
    sandboxRole: 'PRODUCTION',
    customRole: 'PRODUCTION_DEPT',
    username: 'turki_prod',
    fullNameAr: 'م. تركي اليوسف',
    fullNameEn: 'Eng. Turki Al-Yousef',
    roleAr: 'مدير إدارة التشغيل والتحكم (الإنتاج)',
    roleEn: 'Production Manager',
    departmentAr: 'إدارة الإنتاج والتشغيل',
    departmentEn: 'Production & Operations Administration'
  },
  {
    empCode: 'EMP103',
    password: '123',
    sandboxRole: 'ELECTRICAL',
    customRole: 'ELECTRICAL_DEPT',
    username: 'ali_elec',
    fullNameAr: 'م. علي عبد الله',
    fullNameEn: 'Eng. Ali Abdullah',
    roleAr: 'رئيس إدارة الكهرباء والـ LOTO',
    roleEn: 'Electrical Manager',
    departmentAr: 'إدارة الكهرباء',
    departmentEn: 'Electrical Administration'
  },
  {
    empCode: 'EMP104',
    password: '123',
    sandboxRole: 'HSE',
    customRole: 'SAFETY_SUPERVISOR',
    username: 'asaad_hse',
    fullNameAr: 'م. أسعد الشمراني',
    fullNameEn: 'Eng. Asaad Al-Shamrani',
    roleAr: 'مشرف سيفيتي (HSE Inspector)',
    roleEn: 'HSE Safety Supervisor',
    departmentAr: 'إدارة السلامة والصحة المهنية',
    departmentEn: 'Safety & Occupational Health Administration (HSE)'
  },
  {
    empCode: 'EMP105',
    password: '123',
    sandboxRole: 'HSE',
    customRole: 'SAFETY_MANAGER',
    username: 'samer_mgr',
    fullNameAr: 'م. سامر الأحمد',
    fullNameEn: 'Eng. Samer Al-Ahmad',
    roleAr: 'مدير سيفيتي المعتمد (HSE Manager)',
    roleEn: 'EHS Safety Manager',
    departmentAr: 'إدارة السلامة والصحة المهنية',
    departmentEn: 'Safety & Occupational Health Administration (HSE)'
  }
];

async function seedCollection(collectionName: string, items: any[], idKey: string) {
  console.log(`Seeding ${collectionName} with ${items.length} items...`);
  const batch = writeBatch(db);
  items.forEach((item) => {
    const docId = item[idKey];
    if (docId) {
      const docRef = doc(db, collectionName, docId);
      batch.set(docRef, item);
    }
  });
  await batch.commit();
  console.log(`Successfully seeded ${collectionName}!`);
}

async function run() {
  try {
    await seedCollection('ehs_users', DEFAULT_USERS_SEED, 'empCode');
    await seedCollection('ptw_records', INITIAL_PERMITS_SEED, 'id');
    await seedCollection('ehs_incidents', INITIAL_INCIDENTS, 'id');
    await seedCollection('ehs_hiras', INITIAL_HIRAS, 'id');
    await seedCollection('ehs_audits', INITIAL_AUDITS, 'id');
    await seedCollection('ehs_trainings', INITIAL_TRAINING, 'id');
    console.log("\n=========================================");
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=========================================\n");
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
}

run();
