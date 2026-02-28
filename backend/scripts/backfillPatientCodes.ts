/**
 * One-time script to backfill patientCode for existing patients.
 * Run:  npx tsx scripts/backfillPatientCodes.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Patient from '../models/Patient';

async function backfill() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/carenet';
  await mongoose.connect(uri);
  console.log('Connected to', uri);

  const patients = await Patient.find({ $or: [{ patientCode: { $exists: false } }, { patientCode: '' }] }).sort({ createdAt: 1 });

  if (patients.length === 0) {
    console.log('All patients already have a patientCode. Nothing to do.');
  } else {
    console.log(`Found ${patients.length} patient(s) without a patientCode. Backfilling...`);
    for (const p of patients) {
      await p.save(); // pre-save hook assigns the code
      console.log(`  ${p._id} → ${p.patientCode}`);
    }
    console.log('Done!');
  }

  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
