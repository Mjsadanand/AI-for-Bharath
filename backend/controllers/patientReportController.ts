import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';
import AuditLog from '../models/AuditLog.js';
import { createPatientReportAgent } from '../agents/patient/PatientReportAgent.js';
import type { AgentContext } from '../agents/core/types.js';

// ── Dictionary fallback for when agent is unavailable ───────────────────────

const medicalTerms: Record<string, string> = {
  hypertension: 'high blood pressure',
  hyperlipidemia: 'high cholesterol',
  'diabetes mellitus': 'diabetes (high blood sugar)',
  'type 2 diabetes': 'a condition where your body cannot use insulin properly',
  tachycardia: 'fast heart rate',
  bradycardia: 'slow heart rate',
  dyspnea: 'difficulty breathing',
  edema: 'swelling from fluid buildup',
  anemia: 'low red blood cells (may cause tiredness)',
  arrhythmia: 'irregular heartbeat',
  pneumonia: 'lung infection',
  bronchitis: 'inflammation of breathing tubes',
  pharyngitis: 'sore throat',
  sinusitis: 'sinus infection',
  gastritis: 'stomach inflammation',
  hypothyroidism: 'underactive thyroid',
  arthritis: 'joint inflammation',
  'myocardial infarction': 'heart attack',
  cerebrovascular: 'related to blood vessels in the brain',
  thrombosis: 'blood clot',
  benign: 'not cancerous / harmless',
  malignant: 'cancerous',
  metastasis: 'cancer spread to other parts of the body',
  prognosis: 'expected outcome of a condition',
  'acute': 'sudden or short-term',
  'chronic': 'long-lasting',
  bilateral: 'on both sides',
  contraindicated: 'should not be used',
  'renal': 'related to kidneys',
  hepatic: 'related to liver',
  cardiac: 'related to heart',
  pulmonary: 'related to lungs',
  'mg': 'milligrams',
  'ml': 'milliliters',
  'q.d.': 'once a day',
  'b.i.d.': 'twice a day',
  't.i.d.': 'three times a day',
  'q.i.d.': 'four times a day',
  'p.r.n.': 'as needed',
  'p.o.': 'by mouth',
  stat: 'immediately',
  atorvastatin: 'cholesterol-lowering medication',
  metformin: 'blood sugar-lowering medication',
  lisinopril: 'blood pressure medication',
  amoxicillin: 'antibiotic for bacterial infections',
  omeprazole: 'stomach acid reducer',
  ibuprofen: 'pain reliever and anti-inflammatory',
  acetaminophen: 'pain reliever and fever reducer',
  prednisone: 'steroid to reduce inflammation',
  albuterol: 'inhaler for breathing problems',
  gabapentin: 'nerve pain medication',
  losartan: 'blood pressure medication',
  amlodipine: 'blood pressure medication',
  metoprolol: 'heart rate and blood pressure medication',
  levothyroxine: 'thyroid hormone replacement',
};

/**
 * Simplify medical text into patient-friendly language (no AI/LLM needed).
 * Uses term replacement + structural reformatting.
 */
function simplifyMedicalText(rawText: string): {
  simplified: string;
  termsExplained: Array<{ term: string; meaning: string }>;
  sections: Array<{ title: string; content: string }>;
  warnings: string[];
  tips: string[];
} {
  const lowerText = rawText.toLowerCase();
  const termsExplained: Array<{ term: string; meaning: string }> = [];

  // Find and collect medical terms present in the text
  let explained = rawText;
  for (const [term, meaning] of Object.entries(medicalTerms)) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    if (regex.test(explained)) {
      termsExplained.push({ term, meaning });
      explained = explained.replace(regex, `**${term}** (${meaning})`);
    }
  }

  // Extract possible sections
  const sections: Array<{ title: string; content: string }> = [];
  const sectionPatterns = [
    { pattern: /(?:chief\s*complaint|reason\s*for\s*visit)[:\s]*(.*?)(?=\n[A-Z]|\n\n|$)/is, title: 'Why You Visited' },
    { pattern: /(?:assessment|diagnosis|impression)[:\s]*(.*?)(?=\n[A-Z]|\n\n|$)/is, title: 'What Was Found' },
    { pattern: /(?:plan|treatment|recommendations?)[:\s]*(.*?)(?=\n[A-Z]|\n\n|$)/is, title: 'What To Do Next' },
    { pattern: /(?:medications?|prescriptions?|rx)[:\s]*(.*?)(?=\n[A-Z]|\n\n|$)/is, title: 'Your Medications' },
    { pattern: /(?:history|hpi|present\s*illness)[:\s]*(.*?)(?=\n[A-Z]|\n\n|$)/is, title: 'Your History' },
    { pattern: /(?:physical\s*exam|examination|findings)[:\s]*(.*?)(?=\n[A-Z]|\n\n|$)/is, title: 'Exam Results' },
    { pattern: /(?:lab\s*results?|test\s*results?|blood\s*work)[:\s]*(.*?)(?=\n[A-Z]|\n\n|$)/is, title: 'Test Results' },
    { pattern: /(?:follow[\s-]*up|next\s*steps?|return)[:\s]*(.*?)(?=\n[A-Z]|\n\n|$)/is, title: 'Follow-Up' },
  ];

  for (const { pattern, title } of sectionPatterns) {
    const match = rawText.match(pattern);
    if (match?.[1]?.trim()) {
      let content = match[1].trim();
      // Replace terms in section content too
      for (const [term, meaning] of Object.entries(medicalTerms)) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        content = content.replace(regex, `${term} (${meaning})`);
      }
      sections.push({ title, content });
    }
  }

  // If no sections detected, create a general summary section
  if (sections.length === 0) {
    sections.push({ title: 'Report Summary', content: explained });
  }

  // Generate warnings based on content
  const warnings: string[] = [];
  if (lowerText.includes('urgent') || lowerText.includes('emergency') || lowerText.includes('stat'))
    warnings.push('This report mentions urgent or emergency items. Please follow up with your doctor promptly.');
  if (lowerText.includes('allergic') || lowerText.includes('allergy'))
    warnings.push('Allergy information was mentioned. Make sure your healthcare team knows about all your allergies.');
  if (lowerText.includes('surgery') || lowerText.includes('procedure') || lowerText.includes('operation'))
    warnings.push('A surgical procedure is mentioned. Discuss all details, risks, and recovery with your doctor.');
  if (lowerText.includes('abnormal') || lowerText.includes('elevated') || lowerText.includes('irregular'))
    warnings.push('Some results may be outside normal range. Your doctor will explain what this means for you.');

  // General health tips
  const tips: string[] = [
    'Keep all follow-up appointments with your doctor.',
    'Take medications exactly as prescribed — do not stop without asking your doctor.',
    'If you experience any new or worsening symptoms, contact your healthcare provider immediately.',
  ];
  if (lowerText.includes('blood pressure') || lowerText.includes('hypertension'))
    tips.push('Reduce salt intake and exercise regularly to help manage blood pressure.');
  if (lowerText.includes('diabetes') || lowerText.includes('blood sugar'))
    tips.push('Monitor your blood sugar regularly and follow your diet plan.');

  const simplified = sections.map(s => `## ${s.title}\n${s.content}`).join('\n\n');

  return { simplified, termsExplained, sections, warnings, tips };
}

// @desc    Analyze/simplify uploaded report text for patient understanding
// @route   POST /api/patient-reports/analyze
export const analyzeReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reportText, imageCount } = req.body;

    const text = (typeof reportText === 'string' ? reportText.trim() : '');

    if (!text && (!imageCount || imageCount === 0)) {
      res.status(400).json({
        success: false,
        message: 'Please provide report text or upload at least one image.',
      });
      return;
    }

    // If no text provided (images only), return a quick placeholder
    if (!text) {
      await logAnalysis(req, 0, imageCount || 0, 'fallback');
      res.json({
        success: true,
        data: {
          simplified: '',
          sections: [{ title: 'Images Uploaded', content: `You uploaded ${imageCount} report image(s). For a detailed AI breakdown, please enter or paste the text from your reports above.` }],
          termsExplained: [],
          warnings: [],
          tips: ['Take clear, well-lit photos of your reports for best results.', 'Ask your doctor or pharmacist to explain anything you do not understand.'],
          disclaimer: 'This simplified explanation is for your understanding only. It does not replace professional medical advice. Always discuss your reports with your healthcare provider.',
          source: 'none',
        },
      });
      return;
    }

    // ── Try AI Agent first ──────────────────────────────────────────────
    let result: {
      simplified: string;
      sections: Array<{ title: string; content: string }>;
      termsExplained: Array<{ term: string; meaning: string }>;
      warnings: string[];
      tips: string[];
    } | null = null;
    let source: 'agent' | 'fallback' = 'fallback';

    try {
      const agent = createPatientReportAgent();

      const context: AgentContext = {
        patientId: req.user!._id.toString(),
        providerId: req.user!._id.toString(),
        pipelineState: {
          pipelineId: `patient_report_${Date.now()}`,
          patientId: req.user!._id.toString(),
          providerId: req.user!._id.toString(),
          stepResults: {},
          errors: [],
          startedAt: new Date(),
          currentStep: 'patient_report',
          status: 'running',
        },
      };

      const userMessage = imageCount && imageCount > 0
        ? `The patient uploaded ${imageCount} image(s) of their medical report and also typed/pasted the following report text. Please simplify and explain this report:\n\n${text}`
        : `The patient typed/pasted the following medical report text. Please simplify and explain it:\n\n${text}`;

      const agentResult = await agent.run(userMessage, context);

      if (agentResult.success && agentResult.artifacts?.patientReport) {
        const rpt = agentResult.artifacts.patientReport;
        result = {
          simplified: rpt.simplified || '',
          sections: rpt.sections || [],
          termsExplained: rpt.termsExplained || [],
          warnings: rpt.warnings || [],
          tips: rpt.tips || [],
        };
        source = 'agent';
        console.log(`  ✅ [PatientReport] Agent completed in ${agentResult.durationMs}ms`);
      } else {
        console.warn('  ⚠️ [PatientReport] Agent returned no artifacts, falling back to dictionary.');
      }
    } catch (agentErr) {
      console.error('  ❌ [PatientReport] Agent failed, using dictionary fallback:', agentErr);
    }

    // ── Fallback: dictionary-based simplification ───────────────────────
    if (!result) {
      result = simplifyMedicalText(text);
      source = 'fallback';
    }

    // Audit log
    await logAnalysis(req, text.length, imageCount || 0, source);

    res.json({
      success: true,
      data: {
        simplified: result.simplified,
        sections: result.sections,
        termsExplained: result.termsExplained,
        warnings: result.warnings,
        tips: result.tips,
        disclaimer:
          'This simplified explanation is for your understanding only. It does not replace professional medical advice. Always discuss your reports with your healthcare provider.',
        source,
      },
    });
  } catch (error: unknown) {
    handleControllerError(res, error, 'Failed to analyze report');
  }
};

// ── Helper: write audit log ─────────────────────────────────────────────────
async function logAnalysis(req: AuthRequest, charCount: number, imageCount: number, source: string) {
  try {
    await AuditLog.create({
      userId: req.user!._id,
      action: 'analyze_report',
      module: 'translator',
      resourceType: 'patient-report',
      details: `Patient analyzed report (${charCount} chars, ${imageCount} images, source: ${source})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      result: 'success',
    });
  } catch (logErr) {
    console.error('Audit log error:', logErr);
  }
}

// @desc    Get patient's report analysis history
// @route   GET /api/patient-reports/history
export const getReportHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await AuditLog.find({
      userId: req.user!._id,
      action: 'analyze_report',
      module: 'translator',
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('details createdAt result');

    res.json({ success: true, data: logs });
  } catch (error: unknown) {
    handleControllerError(res, error, 'Failed to fetch report history');
  }
};
