import { Response } from 'express';
import ClinicalNote from '../models/ClinicalNote.js';
import Patient from '../models/Patient.js';
import RiskAssessment from '../models/RiskAssessment.js';
import Appointment from '../models/Appointment.js';
import ResearchPaper from '../models/ResearchPaper.js';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';

// @desc    Run the full CARENET pipeline for a patient
// @route   POST /api/pipeline/run/:patientId
// Step 1: Doctor → Patient (fetch patient data)
// Step 2: Clinical Documentation AI (generate clinical note)
// Step 3: Patient Translator (simplify the report)
// Step 4: Predictive Engine (analyze health data)
// Step 5: Workflow Automation (create follow-up tasks)
// Step 6: Research Synthesizer (find relevant research)
export const runPipeline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { chiefComplaint, historyOfPresentIllness, assessment, plan } = req.body;

    const pipelineResults: any = {
      steps: [],
      completedAt: null,
    };

    // ═══════════════════════════════════════════
    // STEP 1: Doctor ↔ Patient Interaction
    // ═══════════════════════════════════════════
    const patient = await Patient.findById(patientId).populate('userId', 'name email');
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    pipelineResults.steps.push({
      step: 1,
      name: 'Patient Interaction',
      status: 'completed',
      data: {
        patientName: (patient.userId as any)?.name,
        conditions: patient.chronicConditions,
        medications: patient.medications?.map((m) => m.name),
        allergies: patient.allergies,
        latestVitals: patient.vitalSigns?.[patient.vitalSigns.length - 1] || null,
      },
    });

    // ═══════════════════════════════════════════
    // STEP 2: Clinical Documentation AI
    // ═══════════════════════════════════════════
    const assessmentEntries = assessment
      ? (Array.isArray(assessment) ? assessment : [{ diagnosis: assessment, severity: 'moderate' }])
      : [{ diagnosis: chiefComplaint || 'General consultation', severity: 'mild' }];

    const planEntries = plan
      ? (Array.isArray(plan) ? plan : [{ treatment: plan }])
      : [{ treatment: 'Continue monitoring' }];

    // Simulate entity extraction from clinical text
    const fullText = `${chiefComplaint || ''} ${historyOfPresentIllness || ''} ${JSON.stringify(assessmentEntries)}`;
    const extractedEntities = extractEntitiesFromText(fullText);

    const clinicalNote = await ClinicalNote.create({
      patientId: patient._id,
      providerId: req.user?._id,
      noteType: 'consultation',
      chiefComplaint: chiefComplaint || 'General check-up',
      historyOfPresentIllness: historyOfPresentIllness || '',
      assessment: assessmentEntries,
      plan: planEntries,
      extractedEntities,
      verificationStatus: 'pending',
    });

    pipelineResults.steps.push({
      step: 2,
      name: 'Clinical Documentation AI',
      status: 'completed',
      data: {
        noteId: clinicalNote._id,
        noteType: clinicalNote.noteType,
        extractedEntities: clinicalNote.extractedEntities.length,
        assessments: clinicalNote.assessment.length,
      },
    });

    // ═══════════════════════════════════════════
    // STEP 3: Patient Translator
    // ═══════════════════════════════════════════
    const medicalTerms: Record<string, string> = {
      'hypertension': 'high blood pressure',
      'hyperlipidemia': 'high cholesterol',
      'diabetes mellitus': 'diabetes',
      'tachycardia': 'fast heart rate',
      'dyspnea': 'difficulty breathing',
      'edema': 'swelling',
      'anemia': 'low red blood cells',
    };

    let reportText = `Chief Complaint: ${clinicalNote.chiefComplaint}\n`;
    reportText += `Assessment: ${clinicalNote.assessment.map((a) => a.diagnosis).join(', ')}\n`;
    reportText += `Plan: ${clinicalNote.plan.map((p) => p.treatment).join('; ')}\n`;

    let simplifiedText = reportText;
    const translatedTerms: { original: string; simplified: string }[] = [];

    Object.entries(medicalTerms).forEach(([term, explanation]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(simplifiedText)) {
        translatedTerms.push({ original: term, simplified: explanation });
        simplifiedText = simplifiedText.replace(regex, `${term} (${explanation})`);
      }
    });

    pipelineResults.steps.push({
      step: 3,
      name: 'Patient Translator',
      status: 'completed',
      data: {
        originalText: reportText.trim(),
        simplifiedText: simplifiedText.trim(),
        translatedTerms,
        termsSimplified: translatedTerms.length,
      },
    });

    // ═══════════════════════════════════════════
    // STEP 4: Predictive Engine
    // ═══════════════════════════════════════════
    const riskScores = calculatePatientRisk(patient);
    const maxScore = Math.max(...riskScores.map((r) => r.score));
    const overallRisk = maxScore >= 70 ? 'critical' : maxScore >= 50 ? 'high' : maxScore >= 25 ? 'moderate' : 'low';

    const predictions = riskScores
      .filter((r) => r.score > 20)
      .map((r) => ({
        condition: `${r.category} complication`,
        probability: r.score / 100,
        timeframe: r.score >= 50 ? '6 months' : '12 months',
        preventable: true,
      }));

    const alerts = riskScores
      .filter((r) => r.level === 'high')
      .map((r) => ({
        type: 'warning' as const,
        message: `High ${r.category} risk detected (score: ${r.score}/100)`,
        acknowledged: false,
      }));

    const recommendations = generateRecommendationsFromRisk(riskScores);

    const riskAssessment = await RiskAssessment.create({
      patientId: patient._id,
      assessedBy: req.user?._id,
      riskScores,
      overallRisk,
      confidenceLevel: 0.75 + Math.random() * 0.2,
      predictions,
      recommendations,
      alerts,
      followUpRequired: overallRisk === 'high' || overallRisk === 'critical',
      nextAssessmentDate: new Date(Date.now() + (overallRisk === 'critical' ? 7 : 30) * 24 * 60 * 60 * 1000),
    });

    pipelineResults.steps.push({
      step: 4,
      name: 'Predictive Engine',
      status: 'completed',
      data: {
        assessmentId: riskAssessment._id,
        overallRisk,
        riskScores: riskScores.map((r) => ({ category: r.category, score: r.score, level: r.level })),
        predictions: predictions.length,
        alerts: alerts.length,
        recommendations: recommendations.length,
      },
    });

    // ═══════════════════════════════════════════
    // STEP 5: Workflow Automation
    // ═══════════════════════════════════════════
    const workflowActions: any[] = [];

    // Auto-create follow-up appointment for high-risk patients
    if (overallRisk === 'high' || overallRisk === 'critical') {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + (overallRisk === 'critical' ? 3 : 7));
      followUpDate.setHours(9, 0, 0, 0);

      const appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: req.user?._id,
        scheduledDate: followUpDate,
        duration: 30,
        type: 'follow-up',
        priority: overallRisk === 'critical' ? 'urgent' : 'high',
        reason: `Follow-up: ${overallRisk} risk — ${riskScores.filter((r) => r.level === 'high').map((r) => r.category).join(', ')}`,
        status: 'scheduled',
      });
      workflowActions.push({ type: 'appointment_created', id: appointment._id, date: followUpDate });
    }

    // Schedule routine follow-up for all consultations
    if (workflowActions.length === 0) {
      const routineDate = new Date();
      routineDate.setDate(routineDate.getDate() + 30);
      routineDate.setHours(10, 0, 0, 0);

      const appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: req.user?._id,
        scheduledDate: routineDate,
        duration: 15,
        type: 'follow-up',
        priority: 'normal',
        reason: `Routine follow-up for: ${chiefComplaint || 'general consultation'}`,
        status: 'scheduled',
      });
      workflowActions.push({ type: 'routine_followup', id: appointment._id, date: routineDate });
    }

    pipelineResults.steps.push({
      step: 5,
      name: 'Workflow Automation',
      status: 'completed',
      data: {
        actionsCreated: workflowActions.length,
        actions: workflowActions,
      },
    });

    // ═══════════════════════════════════════════
    // STEP 6: Research Synthesizer
    // ═══════════════════════════════════════════
    const conditions = [
      ...patient.chronicConditions,
      ...clinicalNote.assessment.map((a) => a.diagnosis),
    ].filter(Boolean);

    let relevantPapers: any[] = [];
    if (conditions.length > 0) {
      const searchRegex = conditions.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      relevantPapers = await ResearchPaper.find({
        $or: [
          { title: { $regex: searchRegex, $options: 'i' } },
          { abstract: { $regex: searchRegex, $options: 'i' } },
          { keywords: { $in: conditions.map((c) => new RegExp(c, 'i')) } },
        ],
      })
        .limit(5)
        .sort({ citations: -1 });
    }

    pipelineResults.steps.push({
      step: 6,
      name: 'Research Synthesizer',
      status: 'completed',
      data: {
        searchTerms: conditions,
        papersFound: relevantPapers.length,
        papers: relevantPapers.map((p) => ({
          id: p._id,
          title: p.title,
          citations: p.citations,
          category: p.category,
        })),
      },
    });

    pipelineResults.completedAt = new Date();
    pipelineResults.patientId = patient._id;
    pipelineResults.patientName = (patient.userId as any)?.name;
    pipelineResults.clinicalNoteId = clinicalNote._id;
    pipelineResults.riskAssessmentId = riskAssessment._id;

    res.status(201).json({ success: true, data: pipelineResults });
  } catch (error: any) {
    console.error('Pipeline error:', error);
    handleControllerError(res, error, 'Pipeline operation failed');
  }
};

// @desc    Get pipeline status/summary for a patient
// @route   GET /api/pipeline/status/:patientId
export const getPipelineStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const [patient, latestNote, latestAssessment, upcomingAppointments, relevantPapers] = await Promise.all([
      Patient.findById(patientId).populate('userId', 'name email'),
      ClinicalNote.findOne({ patientId }).sort({ createdAt: -1 }),
      RiskAssessment.findOne({ patientId }).sort({ createdAt: -1 }),
      Appointment.find({ patientId, status: { $in: ['scheduled', 'confirmed'] }, scheduledDate: { $gte: new Date() } })
        .sort({ scheduledDate: 1 })
        .limit(5),
      ResearchPaper.find().limit(3).sort({ citations: -1 }),
    ]);

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    const status = {
      patient: {
        id: patient._id,
        name: (patient.userId as any)?.name,
        conditions: patient.chronicConditions,
      },
      step1: { name: 'Patient Interaction', completed: true },
      step2: {
        name: 'Clinical Documentation',
        completed: !!latestNote,
        data: latestNote ? { noteId: latestNote._id, date: latestNote.createdAt, status: latestNote.verificationStatus } : null,
      },
      step3: {
        name: 'Patient Translator',
        completed: !!latestNote,
        data: latestNote ? { available: true, noteId: latestNote._id } : null,
      },
      step4: {
        name: 'Predictive Engine',
        completed: !!latestAssessment,
        data: latestAssessment ? { assessmentId: latestAssessment._id, overallRisk: latestAssessment.overallRisk, date: latestAssessment.createdAt } : null,
      },
      step5: {
        name: 'Workflow Automation',
        completed: upcomingAppointments.length > 0,
        data: { upcomingAppointments: upcomingAppointments.length },
      },
      step6: {
        name: 'Research Synthesizer',
        completed: relevantPapers.length > 0,
        data: { papersAvailable: relevantPapers.length },
      },
    };

    res.json({ success: true, data: status });
  } catch (error: any) {
    handleControllerError(res, error, 'Pipeline operation failed');
  }
};

// =========================================
// Helper Functions
// =========================================

function extractEntitiesFromText(text: string) {
  const entities: { type: string; value: string; confidence: number }[] = [];
  const symptoms = ['pain', 'headache', 'fever', 'cough', 'fatigue', 'nausea', 'dizziness', 'shortness of breath', 'chest pain', 'swelling'];
  const medications = ['metformin', 'lisinopril', 'atorvastatin', 'amoxicillin', 'omeprazole', 'ibuprofen', 'acetaminophen', 'aspirin'];
  const conditions = ['hypertension', 'diabetes', 'hyperlipidemia', 'asthma', 'copd', 'pneumonia', 'arthritis', 'anemia'];

  const lowerText = text.toLowerCase();

  symptoms.forEach((s) => {
    if (lowerText.includes(s)) entities.push({ type: 'symptom', value: s, confidence: 0.85 + Math.random() * 0.1 });
  });
  medications.forEach((m) => {
    if (lowerText.includes(m)) entities.push({ type: 'medication', value: m, confidence: 0.9 + Math.random() * 0.08 });
  });
  conditions.forEach((c) => {
    if (lowerText.includes(c)) entities.push({ type: 'diagnosis', value: c, confidence: 0.8 + Math.random() * 0.15 });
  });

  return entities;
}

function calculatePatientRisk(patient: any) {
  const riskScores: any[] = [];
  const conditions = patient.chronicConditions?.map((c: string) => c.toLowerCase()) || [];
  const latestVitals = patient.vitalSigns?.[patient.vitalSigns.length - 1];

  // Cardiovascular
  let cvScore = 0;
  if (conditions.includes('hypertension')) cvScore += 25;
  if (conditions.includes('diabetes')) cvScore += 20;
  if (conditions.includes('hyperlipidemia')) cvScore += 15;
  if (latestVitals?.bloodPressure?.systolic > 140) cvScore += 15;
  if (latestVitals?.heartRate && (latestVitals.heartRate > 100 || latestVitals.heartRate < 50)) cvScore += 10;

  riskScores.push({
    category: 'Cardiovascular',
    score: Math.min(cvScore, 100),
    level: cvScore >= 60 ? 'high' : cvScore >= 30 ? 'moderate' : 'low',
    factors: conditions.filter((c: string) => ['hypertension', 'diabetes', 'hyperlipidemia'].includes(c)),
  });

  // Metabolic
  let metScore = 0;
  if (conditions.includes('diabetes')) metScore += 30;
  if (conditions.includes('obesity')) metScore += 20;
  if (latestVitals?.weight && latestVitals?.height) {
    const bmi = latestVitals.weight / ((latestVitals.height / 100) ** 2);
    if (bmi > 30) metScore += 25;
    else if (bmi > 25) metScore += 10;
  }

  riskScores.push({
    category: 'Metabolic',
    score: Math.min(metScore, 100),
    level: metScore >= 50 ? 'high' : metScore >= 25 ? 'moderate' : 'low',
    factors: conditions.filter((c: string) => ['diabetes', 'obesity'].includes(c)),
  });

  // Respiratory
  let respScore = 0;
  if (conditions.includes('asthma')) respScore += 20;
  if (conditions.includes('copd')) respScore += 30;
  if (latestVitals?.oxygenSaturation && latestVitals.oxygenSaturation < 95) respScore += 20;

  riskScores.push({
    category: 'Respiratory',
    score: Math.min(respScore, 100),
    level: respScore >= 50 ? 'high' : respScore >= 20 ? 'moderate' : 'low',
    factors: conditions.filter((c: string) => ['asthma', 'copd'].includes(c)),
  });

  return riskScores;
}

function generateRecommendationsFromRisk(riskScores: any[]) {
  const recommendations: any[] = [];
  riskScores.forEach((risk) => {
    if (risk.level === 'high') {
      if (risk.category === 'Cardiovascular') {
        recommendations.push(
          { type: 'monitoring', description: 'Regular blood pressure monitoring', priority: 'high', evidenceBasis: 'AHA Guidelines' },
          { type: 'lifestyle', description: 'Low sodium diet', priority: 'high', evidenceBasis: 'DASH Diet Study' },
        );
      }
      if (risk.category === 'Metabolic') {
        recommendations.push(
          { type: 'monitoring', description: 'Regular blood glucose testing', priority: 'high', evidenceBasis: 'ADA Standards' },
          { type: 'lifestyle', description: 'Exercise 150 min/week', priority: 'high', evidenceBasis: 'WHO Guidelines' },
        );
      }
      if (risk.category === 'Respiratory') {
        recommendations.push(
          { type: 'monitoring', description: 'Pulse oximetry monitoring', priority: 'high', evidenceBasis: 'ATS Guidelines' },
        );
      }
    } else if (risk.level === 'moderate') {
      recommendations.push({
        type: 'screening',
        description: `Regular ${risk.category.toLowerCase()} screening`,
        priority: 'medium',
        evidenceBasis: 'Preventive Guidelines',
      });
    }
  });
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'lifestyle',
      description: 'Maintain healthy lifestyle with regular check-ups',
      priority: 'low',
      evidenceBasis: 'General Care',
    });
  }
  return recommendations;
}
