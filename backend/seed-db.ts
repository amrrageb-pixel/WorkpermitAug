import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { USER_PROFILES } from "../frontend/src/utils/initialData";
import { 
  INITIAL_PERMITS_SEED, 
  INITIAL_INCIDENTS, 
  INITIAL_HIRAS, 
  INITIAL_AUDITS, 
  INITIAL_TRAINING 
} from "../frontend/src/utils/initialEhsData";

const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("\n=================================================================");
  console.error("ERROR: File 'serviceAccountKey.json' not found inside backend folder!");
  console.error("Please place your downloaded Service Account JSON file in the following path:");
  console.error(serviceAccountPath);
  console.error("=================================================================\n");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedCollection(collectionName: string, items: any[], idKey: string) {
  console.log(`Seeding ${collectionName} with ${items.length} items...`);
  const batch = db.batch();
  items.forEach((item) => {
    const docId = item[idKey];
    if (docId) {
      const docRef = db.collection(collectionName).doc(docId);
      batch.set(docRef, item);
    }
  });
  await batch.commit();
  console.log(`Successfully seeded ${collectionName}!`);
}

async function run() {
  try {
    await seedCollection('ehs_users', USER_PROFILES, 'empCode');
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
