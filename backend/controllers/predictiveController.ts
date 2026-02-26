import { Response } from 'express';
import RiskAssessment from '../models/RiskAssessment.js';
import Patient from '../models/Patient.js';
import { AuthRequest } from '../middleware/auth.js';

// Simulated risk scoring (in production, use ML models)
const calculateRiskScores = (patient: any) => {
  const riskScores: any[] = [];

  // Cardiovascular risk
  let cvScore = 0;
  const conditions = patient.chronicConditions?.map((c: string) => c.toLowerCase()) || [];
  const meds = patient.medications?.map((m: any) => m.name?.toLowerCase()) || [];

  if (conditions.includes('hypertension')) cvScore += 25;
  if (conditions.includes('diabetes')) cvScore += 20;
  if (conditions.includes('hyperlipidemia') || conditions.includes('high cholesterol')) cvScore += 15;

  const latestVitals = patient.vitalSigns?.[patient.vitalSigns.length - 1];
  if (latestVitals?.bloodPressure?.systolic > 140) cvScore += 15;
  if (latestVitals?.heartRate && (latestVitals.heartRate > 100 || latestVitals.heartRate < 50)) cvScore += 10;

  riskScores.push({
    category: 'Cardiovascular',
    score: Math.min(cvScore, 100),
    level: cvScore >= 60 ? 'high' : cvScore >= 30 ? 'moderate' : 'low',
    factors: conditions.filter((c: string) =>
      ['hypertension', 'diabetes', 'hyperlipidemia', 'high cholesterol'].includes(c)
    ),
  });

  // Metabolic risk
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

  // Respiratory risk
  let respScore = 0;
  if (conditions.includes('asthma')) respScore += 20;
  if (conditions.includes('copd')) respScore += 30;
  if (conditions.includes('pneumonia')) respScore += 25;
  if (latestVitals?.oxygenSaturation && latestVitals.oxygenSaturation < 95) respScore += 20;

  riskScores.push({
    category: 'Respiratory',
    score: Math.min(respScore, 100),
    level: respScore >= 50 ? 'high' : respScore >= 20 ? 'moderate' : 'low',
    factors: conditions.filter((c: string) => ['asthma', 'copd', 'pneumonia'].includes(c)),
  });

  return riskScores;
};

const generateRecommendations = (riskScores: any[]) => {
  const recommendations: any[] = [];

  riskScores.forEach((risk) => {
    if (risk.level === 'high' || risk.level === 'critical') {
      if (risk.category === 'Cardiovascular') {
        recommendations.push(
          { type: 'monitoring', description: 'Regular blood pressure monitoring (daily)', priority: 'high', evidenceBasis: 'AHA Guidelines 2024' },
          { type: 'lifestyle', description: 'Low sodium diet (< 2300mg/day)', priority: 'high', evidenceBasis: 'DASH Diet Study' },
          { type: 'screening', description: 'Lipid panel every 3 months', priority: 'high', evidenceBasis: 'ACC/AHA Guidelines' },
        );
      }
      if (risk.category === 'Metabolic') {
        recommendations.push(
          { type: 'monitoring', description: 'Regular blood glucose monitoring', priority: 'high', evidenceBasis: 'ADA Standards of Care' },
          { type: 'lifestyle', description: 'Structured exercise program (150 min/week)', priority: 'high', evidenceBasis: 'WHO Recommendations' },
          { type: 'screening', description: 'HbA1c test every 3 months', priority: 'high', evidenceBasis: 'ADA Guidelines' },
        );
      }
      if (risk.category === 'Respiratory') {
        recommendations.push(
          { type: 'monitoring', description: 'Pulse oximetry monitoring', priority: 'high', evidenceBasis: 'ATS Guidelines' },
          { type: 'lifestyle', description: 'Smoking cessation if applicable', priority: 'urgent', evidenceBasis: 'WHO FCTC' },
        );
      }
    } else if (risk.level === 'moderate') {
      recommendations.push({
        type: 'screening',
        description: `Regular ${risk.category.toLowerCase()} health screening`,
        priority: 'medium',
        evidenceBasis: 'Preventive Medicine Guidelines',
      });
    }
  });

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'lifestyle',
      description: 'Maintain healthy lifestyle with regular check-ups',
      priority: 'low',
      evidenceBasis: 'General Preventive Care',
    });
  }

  return recommendations;
};

// @desc    Get all risk assessments (recent)
// @route   GET /api/predictive/assessments
export const getAllAssessments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const assessments = await RiskAssessment.find()
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('assessedBy', 'name')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await RiskAssessment.countDocuments();

    res.json({
      success: true,
      data: assessments,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate risk assessment for patient
// @route   POST /api/predictive/assess/:patientId
export const assessRisk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    const riskScores = calculateRiskScores(patient);
    const recommendations = generateRecommendations(riskScores);

    // Determine overall risk
    const maxScore = Math.max(...riskScores.map((r) => r.score));
    const overallRisk = maxScore >= 70 ? 'critical' : maxScore >= 50 ? 'high' : maxScore >= 25 ? 'moderate' : 'low';

    // Generate predictions
    const predictions = riskScores
      .filter((r) => r.score > 20)
      .map((r) => ({
        condition: `${r.category} complication`,
        probability: r.score / 100,
        timeframe: r.score >= 50 ? '6 months' : '12 months',
        preventable: true,
      }));

    // Generate alerts for high/critical risks
    const alerts = riskScores
      .filter((r) => r.level === 'high' || r.level === 'critical')
      .map((r) => ({
        type: (r.level === 'critical' ? 'critical' : 'warning') as 'critical' | 'warning' | 'info',
        message: `High ${r.category} risk detected (score: ${r.score}/100)`,
        acknowledged: false,
      }));

    const assessment = await RiskAssessment.create({
      patientId: patient._id,
      assessedBy: req.user?._id,
      riskScores,
      overallRisk,
      confidenceLevel: 0.75 + Math.random() * 0.2,
      evidenceSources: ['Patient vital signs', 'Medical history', 'Chronic conditions', 'Current medications'],
      predictions,
      recommendations,
      alerts,
      followUpRequired: overallRisk === 'high' || overallRisk === 'critical',
      nextAssessmentDate: new Date(Date.now() + (overallRisk === 'critical' ? 7 : 30) * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({ success: true, data: assessment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get risk assessments for patient
// @route   GET /api/predictive/patient/:patientId
export const getPatientAssessments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessments = await RiskAssessment.find({ patientId: req.params.patientId })
      .populate('assessedBy', 'name')
      .sort({ assessmentDate: -1 });

    res.json({ success: true, data: assessments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get latest assessment
// @route   GET /api/predictive/latest/:patientId
export const getLatestAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessment = await RiskAssessment.findOne({ patientId: req.params.patientId })
      .populate('assessedBy', 'name')
      .sort({ assessmentDate: -1 });

    if (!assessment) {
      res.status(404).json({ success: false, message: 'No assessment found' });
      return;
    }

    res.json({ success: true, data: assessment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge alert
// @route   PUT /api/predictive/:assessmentId/alerts/:alertIndex/acknowledge
export const acknowledgeAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assessmentId, alertIndex } = req.params;

    const assessment = await RiskAssessment.findById(assessmentId);
    if (!assessment) {
      res.status(404).json({ success: false, message: 'Assessment not found' });
      return;
    }

    const idx = parseInt(alertIndex as string);
    if (idx >= 0 && idx < assessment.alerts.length) {
      assessment.alerts[idx].acknowledged = true;
      assessment.alerts[idx].acknowledgedBy = req.user!._id;
      assessment.alerts[idx].acknowledgedAt = new Date();
      await assessment.save();
    }

    res.json({ success: true, data: assessment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active alerts (for dashboard)
// @route   GET /api/predictive/alerts
export const getActiveAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessments = await RiskAssessment.find({
      'alerts.acknowledged': false,
    })
      .populate('patientId', 'userId')
      .sort({ assessmentDate: -1 })
      .limit(20);

    const alerts = assessments.flatMap((a) =>
      a.alerts
        .filter((alert) => !alert.acknowledged)
        .map((alert) => ({
          assessmentId: a._id,
          patientId: a.patientId,
          overallRisk: a.overallRisk,
          type: alert.type,
          message: alert.message,
          acknowledged: alert.acknowledged,
        }))
    );

    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
