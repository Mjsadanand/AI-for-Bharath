/**
 * CARENET AI — Comprehensive Agent Test Suite
 * 
 * Tests each of the 6 agents individually + the full pipeline.
 * Connects to local MongoDB, seeds test data, runs each agent,
 * and validates: tool calls, outputs, artifacts, and token usage.
 *
 * Run:  npx tsx scripts/testAllAgents.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import ClinicalNote from '../models/ClinicalNote.js';
import RiskAssessment from '../models/RiskAssessment.js';
import ResearchPaper from '../models/ResearchPaper.js';
import Appointment from '../models/Appointment.js';
import InsuranceClaim from '../models/InsuranceClaim.js';
import LabResult from '../models/LabResult.js';

import { createClinicalDocAgent } from '../agents/clinical/ClinicalDocAgent.js';
import { createTranslatorAgent } from '../agents/translator/TranslatorAgent.js';
import { createPredictiveAgent } from '../agents/predictive/PredictiveAgent.js';
import { createResearchAgent } from '../agents/research/ResearchAgent.js';
import { createWorkflowAgent } from '../agents/workflow/WorkflowAgent.js';
import { createPatientReportAgent } from '../agents/patient/PatientReportAgent.js';

import type { AgentContext, AgentResult, PipelineState } from '../agents/core/types.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function check(label: string, condition: boolean, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${PASS} ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    failedTests++;
    console.log(`  ${FAIL} ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function printAgentResult(result: AgentResult) {
  console.log(`\n  Agent: ${result.agentName}`);
  console.log(`  Success: ${result.success}`);
  console.log(`  Duration: ${result.durationMs}ms`);
  console.log(`  Tokens: ${result.tokensUsed.input} in / ${result.tokensUsed.output} out`);
  console.log(`  Tool calls: ${result.toolCalls.length}`);
  for (const tc of result.toolCalls) {
    console.log(`    🔧 ${tc.toolName} ${tc.success ? PASS : FAIL} (${tc.durationMs}ms)`);
    console.log(`       Input: ${JSON.stringify(tc.input).slice(0, 150)}`);
    if (tc.output) console.log(`       Output: ${JSON.stringify(tc.output).slice(0, 150)}`);
    if (tc.error) console.log(`       Error: ${tc.error}`);
  }
  console.log(`  Artifacts: ${Object.keys(result.artifacts).join(', ') || '(none)'}`);
  console.log(`  Output (first 200 chars): ${result.output.slice(0, 200)}`);
  if (result.error) console.log(`  Error: ${result.error}`);
}

function makeContext(patientId: string, providerId: string, overrides?: Partial<PipelineState>): AgentContext {
  return {
    patientId,
    providerId,
    pipelineState: {
      pipelineId: `test_${Date.now()}`,
      patientId,
      providerId,
      stepResults: {},
      errors: [],
      startedAt: new Date(),
      currentStep: 'test',
      status: 'running',
      ...overrides,
    },
  };
}

// ─── Seed Test Data ──────────────────────────────────────────────────────────

async function seedTestData() {
  console.log('\n📦 Seeding test data...');

  // Clean up any previous test data
  await User.deleteMany({ email: /^test-agent-/ });
  await Patient.deleteMany({});
  await ClinicalNote.deleteMany({});
  await RiskAssessment.deleteMany({});
  await ResearchPaper.deleteMany({});
  await Appointment.deleteMany({});
  await InsuranceClaim.deleteMany({});
  await LabResult.deleteMany({});

  // Doctor user
  const doctor = await User.create({
    name: 'Dr. Test Agent',
    email: 'test-agent-doctor@carenet.ai',
    password: 'TestP@ss1234',
    role: 'doctor',
  });

  // Patient user
  const patientUser = await User.create({
    name: 'John TestPatient',
    email: 'test-agent-patient@carenet.ai',
    password: 'TestP@ss1234',
    role: 'patient',
  });

  // Patient record
  const patient = await Patient.create({
    userId: patientUser._id,
    dateOfBirth: new Date('1975-06-15'),
    gender: 'male',
    bloodGroup: 'O+',
    allergies: ['penicillin', 'sulfa drugs'],
    chronicConditions: ['type 2 diabetes', 'hypertension', 'hyperlipidemia'],
    emergencyContact: {
      name: 'Jane TestPatient',
      phone: '555-0199',
      relation: 'spouse',
    },
    medications: [
      { name: 'Metformin', dosage: '500mg', frequency: 'twice daily', startDate: new Date('2018-04-01'), prescribedBy: doctor._id },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily', startDate: new Date('2015-09-01'), prescribedBy: doctor._id },
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'once daily at bedtime', startDate: new Date('2020-01-15'), prescribedBy: doctor._id },
    ],
    vitalSigns: [
      {
        date: new Date(),
        bloodPressure: { systolic: 145, diastolic: 92 },
        heartRate: 82,
        temperature: 98.6,
        oxygenSaturation: 97,
        weight: 95,
      },
    ],
    medicalHistory: [
      {
        condition: 'Type 2 Diabetes',
        diagnosedDate: new Date('2018-03-10'),
        status: 'active',
        notes: 'HbA1c trending upward',
      },
      {
        condition: 'Hypertension',
        diagnosedDate: new Date('2015-08-20'),
        status: 'active',
        notes: 'Poorly controlled on current regimen',
      },
    ],
    insurance: {
      provider: 'BlueCross BlueShield',
      policyNumber: 'BCB-TEST-12345',
    },
  });

  // Seed a research paper
  await ResearchPaper.create({
    title: 'SGLT2 Inhibitors in Type 2 Diabetes: Cardiovascular and Renal Outcomes',
    authors: ['Dr. Sarah Chen', 'Dr. Michael Roberts'],
    journal: 'New England Journal of Medicine',
    abstract: 'This meta-analysis examines the cardiovascular and renal protective effects of SGLT2 inhibitors in patients with type 2 diabetes. Data from 12 randomized controlled trials involving 50,000+ patients demonstrates significant reduction in MACE events, heart failure hospitalization, and CKD progression.',
    summary: 'SGLT2 inhibitors show significant cardiovascular and renal benefits in T2D patients beyond glucose lowering.',
    keyFindings: [
      '23% reduction in MACE events',
      '35% reduction in heart failure hospitalization',
      '30% reduction in CKD progression',
      'Benefits independent of glucose-lowering effect',
    ],
    methodology: 'Systematic review and meta-analysis of 12 RCTs',
    limitations: 'Heterogeneity in patient populations across studies',
    keywords: ['diabetes', 'SGLT2', 'cardiovascular', 'renal', 'heart failure'],
    citations: 450,
    category: 'Endocrinology',
  });

  await ResearchPaper.create({
    title: 'Hypertension Management in Diabetic Patients: A 2025 Update',
    authors: ['Dr. James Williams', 'Dr. Emily Park'],
    journal: 'The Lancet',
    abstract: 'Updated guidelines for managing hypertension in patients with comorbid type 2 diabetes. Reviews evidence for ARB/ACE inhibitor therapy, SGLT2 inhibitor co-prescription, and target blood pressure goals. Recommends lower BP targets of 130/80 mmHg for diabetic patients.',
    summary: 'Updated BP targets and treatment algorithms for hypertensive diabetic patients.',
    keyFindings: [
      'Target BP of 130/80 mmHg recommended',
      'ACE/ARB first-line for diabetic hypertension',
      'SGLT2 inhibitors provide dual benefit',
      'Combination therapy often needed',
    ],
    methodology: 'Systematic review of guidelines and RCTs',
    limitations: 'Limited data on elderly populations',
    keywords: ['hypertension', 'diabetes', 'blood pressure', 'ACE inhibitor', 'management'],
    citations: 320,
    category: 'Cardiology',
  });

  console.log(`  Seeded: doctor=${doctor._id}, patient=${patient._id}, patientUser=${patientUser._id}`);
  return { doctor, patient, patientUser };
}

// ─── Test 1: Clinical Documentation Agent ────────────────────────────────────

async function testClinicalDocAgent(patientId: string, providerId: string) {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 1: Clinical Documentation Agent');
  console.log('═'.repeat(70));

  const agent = createClinicalDocAgent();
  const transcript = `
    Doctor: Good morning, John. How are you feeling today?
    Patient: Not great, doctor. I've been having these terrible headaches for the past two weeks. 
    They're mostly on the right side and throbbing. I also feel dizzy sometimes when I stand up.
    Doctor: I see. Are the headaches worse at any particular time of day?
    Patient: Yes, they're worse in the morning and after I eat.
    Doctor: Have you been checking your blood sugar regularly?
    Patient: I have, and it's been running high - around 180 to 220 fasting.
    Doctor: That's concerning. Your blood pressure today is 145/92. Let me check a few things.
    Your neurological exam is normal. Fundoscopic exam shows no papilledema.
    I think your headaches are related to your poorly controlled diabetes and hypertension.
    We need to adjust your medications. I'm going to increase your Metformin to 1000mg twice daily
    and add Amlodipine 5mg for better blood pressure control.
    Patient: Okay, doctor. Should I be worried?
    Doctor: We need to get these numbers under control. I'd like to order an HbA1c test, 
    comprehensive metabolic panel, and lipid panel. Please come back in 2 weeks.
  `;

  const context = makeContext(patientId, providerId, { transcript });
  const userMessage = `Process the following patient encounter transcript and generate a structured clinical note.\n\nPatient ID: ${patientId}\nProvider ID: ${providerId}\n\nTranscript:\n"""\n${transcript}\n"""\n\nFirst retrieve the patient's medical record for context, then analyze the transcript and create the clinical note.`;

  const result = await agent.run(userMessage, context);
  printAgentResult(result);

  check('Agent succeeded', result.success);
  check('Made tool calls', result.toolCalls.length >= 2, `${result.toolCalls.length} tool calls`);
  check('Called get_patient_record', result.toolCalls.some(tc => tc.toolName === 'get_patient_record'));
  check('Called create_clinical_note', result.toolCalls.some(tc => tc.toolName === 'create_clinical_note'));
  check('All tool calls succeeded', result.toolCalls.every(tc => tc.success));
  check('Got clinicalNoteId artifact', !!result.artifacts.clinicalNoteId, result.artifacts.clinicalNoteId);
  check('Tokens tracked', result.tokensUsed.input > 0 && result.tokensUsed.output > 0);
  check('Output text present', result.output.length > 0);

  // Verify DB write
  if (result.artifacts.clinicalNoteId) {
    const note = await ClinicalNote.findById(result.artifacts.clinicalNoteId).lean();
    check('ClinicalNote exists in DB', !!note);
    check('Note has assessment', Array.isArray((note as any)?.assessment) && (note as any).assessment.length > 0);
    check('Note has plan', Array.isArray((note as any)?.plan) && (note as any).plan.length > 0);
  }

  return result;
}

// ─── Test 2: Medical Translator Agent ────────────────────────────────────────

async function testTranslatorAgent(patientId: string, providerId: string, clinicalNoteId: string) {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 2: Medical Translator Agent');
  console.log('═'.repeat(70));

  const agent = createTranslatorAgent();
  const context = makeContext(patientId, providerId, { clinicalNoteId });
  const userMessage = `Translate the clinical documentation into patient-friendly language.\n\nPatient ID: ${patientId}\nClinical Note ID: ${clinicalNoteId}\n\nRetrieve the clinical note and patient context, then generate a complete patient-friendly translation with diagnosis explanations, medication guides, and any risk warnings.`;

  const result = await agent.run(userMessage, context);
  printAgentResult(result);

  check('Agent succeeded', result.success);
  check('Made tool calls', result.toolCalls.length >= 2, `${result.toolCalls.length} tool calls`);
  check('Called get_clinical_note', result.toolCalls.some(tc => tc.toolName === 'get_clinical_note'));
  check('Called get_patient_context', result.toolCalls.some(tc => tc.toolName === 'get_patient_context'));
  check('Called save_translation', result.toolCalls.some(tc => tc.toolName === 'save_translation'));
  check('All tool calls succeeded', result.toolCalls.every(tc => tc.success));
  check('Got translation artifact', !!result.artifacts.translation);
  check('Translation has diagnosisExplanations', Array.isArray(result.artifacts.translation?.diagnosisExplanations));
  check('Translation has medicationGuides', Array.isArray(result.artifacts.translation?.medicationGuides));
  check('Tokens tracked', result.tokensUsed.input > 0 && result.tokensUsed.output > 0);

  return result;
}

// ─── Test 3: Predictive Analytics Agent ──────────────────────────────────────

async function testPredictiveAgent(patientId: string, providerId: string, clinicalNote: any) {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 3: Predictive Analytics Agent');
  console.log('═'.repeat(70));

  const agent = createPredictiveAgent();
  const context = makeContext(patientId, providerId, {
    clinicalNote,
  });
  const userMessage = `Perform a comprehensive risk assessment for this patient based on their medical history and current encounter.\n\nPatient ID: ${patientId}\nProvider ID: ${providerId}\n\nRecent Clinical Context: The patient was just seen for "${clinicalNote?.chiefComplaint || 'headache and poorly controlled diabetes'}". Retrieve the patient health data and recent clinical notes, then create a thorough risk assessment.`;

  const result = await agent.run(userMessage, context);
  printAgentResult(result);

  check('Agent succeeded', result.success);
  check('Made tool calls', result.toolCalls.length >= 2, `${result.toolCalls.length} tool calls`);
  check('Called get_patient_health_data', result.toolCalls.some(tc => tc.toolName === 'get_patient_health_data'));
  check('Called create_risk_assessment', result.toolCalls.some(tc => tc.toolName === 'create_risk_assessment'));
  check('All tool calls succeeded', result.toolCalls.every(tc => tc.success));
  check('Got riskAssessmentId artifact', !!result.artifacts.riskAssessmentId);
  check('Got riskAssessment artifact', !!result.artifacts.riskAssessment);
  check('Tokens tracked', result.tokensUsed.input > 0 && result.tokensUsed.output > 0);

  // Verify DB write
  if (result.artifacts.riskAssessmentId) {
    const assessment = await RiskAssessment.findById(result.artifacts.riskAssessmentId).lean();
    check('RiskAssessment exists in DB', !!assessment);
    check('Has risk scores', Array.isArray((assessment as any)?.riskScores) && (assessment as any).riskScores.length > 0);
  }

  return result;
}

// ─── Test 4: Research Synthesis Agent ────────────────────────────────────────

async function testResearchAgent(patientId: string, providerId: string, clinicalNote: any, riskAssessment: any) {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 4: Research Synthesis Agent');
  console.log('═'.repeat(70));

  const agent = createResearchAgent();
  const context = makeContext(patientId, providerId, {
    clinicalNote,
    riskAssessment,
  });
  const riskLevel = riskAssessment?.overallRisk?.level || 'moderate';
  const userMessage = `Search and synthesize medical research relevant to this patient's conditions and current clinical encounter.\n\nPatient ID: ${patientId}\n\nClinical Context: Patient was seen for "${clinicalNote?.chiefComplaint || 'headache and poorly controlled diabetes'}".\nRisk Assessment: Overall risk level is "${riskLevel}".\n\nRetrieve the patient's conditions, search for relevant research, and create a synthesis.`;

  const result = await agent.run(userMessage, context);
  printAgentResult(result);

  check('Agent succeeded', result.success);
  check('Made tool calls', result.toolCalls.length >= 2, `${result.toolCalls.length} tool calls`);
  check('Called get_patient_conditions', result.toolCalls.some(tc => tc.toolName === 'get_patient_conditions'));
  check('Called search_research_papers', result.toolCalls.some(tc => tc.toolName === 'search_research_papers'));
  check('Called save_research_synthesis', result.toolCalls.some(tc => tc.toolName === 'save_research_synthesis'));
  check('All tool calls succeeded', result.toolCalls.every(tc => tc.success));
  check('Got researchResults artifact', !!result.artifacts.researchResults);
  check('Tokens tracked', result.tokensUsed.input > 0 && result.tokensUsed.output > 0);

  return result;
}

// ─── Test 5: Workflow Automation Agent ───────────────────────────────────────

async function testWorkflowAgent(
  patientId: string,
  providerId: string,
  clinicalNoteId: string,
  clinicalNote: any,
  riskAssessment: any
) {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 5: Workflow Automation Agent');
  console.log('═'.repeat(70));

  const agent = createWorkflowAgent();
  const context = makeContext(patientId, providerId, {
    clinicalNoteId,
    clinicalNote,
    riskAssessment,
  });

  const diagnoses = clinicalNote?.assessment?.map((a: any) => a.diagnosis) || ['Poorly controlled type 2 diabetes', 'Hypertension'];
  const riskLevel = riskAssessment?.overallRisk?.level || 'moderate';
  const recommendations = riskAssessment?.recommendations?.slice(0, 3) || [
    { type: 'screening', recommendation: 'Order HbA1c test', priority: 'urgent' },
  ];

  const userMessage = `Based on the complete clinical encounter results, create appropriate workflow actions.\n\nPatient ID: ${patientId}\nProvider (Doctor) ID: ${providerId}\nClinical Note ID: ${clinicalNoteId}\nChief Complaint: ${clinicalNote?.chiefComplaint || 'Headache and poorly controlled diabetes'}\nDiagnoses: ${JSON.stringify(diagnoses)}\nRisk Level: ${riskLevel}\nRecommendations: ${JSON.stringify(recommendations)}\n\nCreate a follow-up appointment in 2 weeks, an insurance claim, and lab orders for HbA1c, CMP, and lipid panel.`;

  const result = await agent.run(userMessage, context);
  printAgentResult(result);

  check('Agent succeeded', result.success);
  check('Made tool calls', result.toolCalls.length >= 3, `${result.toolCalls.length} tool calls`);
  check('Called create_appointment', result.toolCalls.some(tc => tc.toolName === 'create_appointment'));
  check('Called create_insurance_claim', result.toolCalls.some(tc => tc.toolName === 'create_insurance_claim'));
  check('Called create_lab_order', result.toolCalls.some(tc => tc.toolName === 'create_lab_order'));
  check('All tool calls succeeded', result.toolCalls.every(tc => tc.success));
  check('Tokens tracked', result.tokensUsed.input > 0 && result.tokensUsed.output > 0);

  // Verify DB writes
  const appointmentCount = await Appointment.countDocuments({ patientId });
  const claimCount = await InsuranceClaim.countDocuments({ patientId });
  const labCount = await LabResult.countDocuments({ patientId });
  check('Appointments created in DB', appointmentCount > 0, `${appointmentCount} appointment(s)`);
  check('Insurance claims created in DB', claimCount > 0, `${claimCount} claim(s)`);
  check('Lab orders created in DB', labCount > 0, `${labCount} order(s)`);

  return result;
}

// ─── Test 6: Patient Report Simplifier (Standalone) ──────────────────────────

async function testPatientReportAgent() {
  console.log('\n' + '═'.repeat(70));
  console.log('TEST 6: Patient Report Simplifier (Standalone)');
  console.log('═'.repeat(70));

  const agent = createPatientReportAgent();
  const reportText = `
    LABORATORY REPORT
    Patient: John TestPatient  DOB: 06/15/1975
    
    HbA1c: 8.9% (Reference: <7.0%)  — CRITICAL HIGH
    Fasting Glucose: 210 mg/dL (Reference: 70-100 mg/dL) — HIGH
    Total Cholesterol: 245 mg/dL (Reference: <200 mg/dL) — HIGH
    LDL: 160 mg/dL (Reference: <100 mg/dL) — HIGH
    HDL: 38 mg/dL (Reference: >40 mg/dL) — LOW
    Triglycerides: 220 mg/dL (Reference: <150 mg/dL) — HIGH
    Creatinine: 1.4 mg/dL (Reference: 0.7-1.3 mg/dL) — BORDERLINE HIGH
    BUN: 28 mg/dL (Reference: 7-20 mg/dL) — HIGH
    eGFR: 55 mL/min (Reference: >60 mL/min) — REDUCED
    
    Interpretation: Results indicate poorly controlled diabetes with early 
    signs of diabetic nephropathy. Cardiovascular risk is significantly elevated.
    Urgent follow-up with endocrinology and nephrology recommended.
  `;

  const context: AgentContext = {
    patientId: 'test-standalone',
    providerId: 'test-standalone',
    pipelineState: {
      pipelineId: `patient_report_${Date.now()}`,
      patientId: 'test-standalone',
      providerId: 'test-standalone',
      stepResults: {},
      errors: [],
      startedAt: new Date(),
      currentStep: 'patient_report',
      status: 'running',
    },
  };

  const userMessage = `The patient typed/pasted the following medical report text. Please simplify and explain it:\n\n${reportText}`;

  const result = await agent.run(userMessage, context);
  printAgentResult(result);

  check('Agent succeeded', result.success);
  check('Made tool calls', result.toolCalls.length >= 1, `${result.toolCalls.length} tool calls`);
  check('Called format_simplified_report', result.toolCalls.some(tc => tc.toolName === 'format_simplified_report'));
  check('All tool calls succeeded', result.toolCalls.every(tc => tc.success));
  check('Got patientReport artifact', !!result.artifacts.patientReport);
  check('Report has sections', Array.isArray(result.artifacts.patientReport?.sections));
  check('Report has termsExplained', Array.isArray(result.artifacts.patientReport?.termsExplained));
  check('Tokens tracked', result.tokensUsed.input > 0 && result.tokensUsed.output > 0);

  return result;
}

// ─── Main Runner ─────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║        CARENET AI — Comprehensive Agent Test Suite                  ║');
  console.log('║        Model: ' + (process.env.BEDROCK_MODEL_ID || 'default').padEnd(54) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  // Connect to MongoDB
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/carenet';
  console.log(`\nConnecting to MongoDB: ${uri}`);
  await mongoose.connect(uri);
  console.log('Connected ✅');

  // Seed
  const { doctor, patient } = await seedTestData();
  const patientId = patient._id.toString();
  const providerId = doctor._id.toString();

  let clinicalNoteId: string | undefined;
  let clinicalNote: any;
  let riskAssessment: any;

  // ── Test 1: Clinical Documentation ──
  try {
    const r1 = await testClinicalDocAgent(patientId, providerId);
    if (r1.success && r1.artifacts.clinicalNoteId) {
      clinicalNoteId = r1.artifacts.clinicalNoteId;
      clinicalNote = await ClinicalNote.findById(clinicalNoteId).lean();
    }
  } catch (err: any) {
    console.log(`\n  ${FAIL} Clinical Doc Agent CRASHED: ${err.message}`);
    failedTests++;
    totalTests++;
  }

  // ── Test 2: Medical Translator ──
  if (clinicalNoteId) {
    try {
      await testTranslatorAgent(patientId, providerId, clinicalNoteId);
    } catch (err: any) {
      console.log(`\n  ${FAIL} Translator Agent CRASHED: ${err.message}`);
      failedTests++;
      totalTests++;
    }
  } else {
    console.log(`\n${WARN} Skipping Translator test — no clinical note from prior step`);
  }

  // ── Test 3: Predictive Analytics ──
  try {
    const r3 = await testPredictiveAgent(patientId, providerId, clinicalNote);
    if (r3.success && r3.artifacts.riskAssessment) {
      riskAssessment = r3.artifacts.riskAssessment;
    }
  } catch (err: any) {
    console.log(`\n  ${FAIL} Predictive Agent CRASHED: ${err.message}`);
    failedTests++;
    totalTests++;
  }

  // ── Test 4: Research Synthesis ──
  try {
    await testResearchAgent(patientId, providerId, clinicalNote, riskAssessment);
  } catch (err: any) {
    console.log(`\n  ${FAIL} Research Agent CRASHED: ${err.message}`);
    failedTests++;
    totalTests++;
  }

  // ── Test 5: Workflow Automation ──
  if (clinicalNoteId) {
    try {
      await testWorkflowAgent(patientId, providerId, clinicalNoteId, clinicalNote, riskAssessment);
    } catch (err: any) {
      console.log(`\n  ${FAIL} Workflow Agent CRASHED: ${err.message}`);
      failedTests++;
      totalTests++;
    }
  } else {
    console.log(`\n${WARN} Skipping Workflow test — no clinical note from prior step`);
  }

  // ── Test 6: Patient Report Simplifier (standalone) ──
  try {
    await testPatientReportAgent();
  } catch (err: any) {
    console.log(`\n  ${FAIL} Patient Report Agent CRASHED: ${err.message}`);
    failedTests++;
    totalTests++;
  }

  // ── Summary ──
  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  console.log(`  Total checks: ${totalTests}`);
  console.log(`  Passed:       ${passedTests} ${PASS}`);
  console.log(`  Failed:       ${failedTests} ${failedTests > 0 ? FAIL : PASS}`);
  console.log(`  Pass rate:    ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('═'.repeat(70));

  // Cleanup
  await User.deleteMany({ email: /^test-agent-/ });
  await Patient.deleteMany({ _id: patient._id });
  // Leave clinical notes, risk assessments etc. for inspection

  await mongoose.disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
