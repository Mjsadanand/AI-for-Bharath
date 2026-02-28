import { Response } from 'express';
import ClinicalNote from '../models/ClinicalNote.js';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';

// Medical terminology dictionary for translation
const medicalTerms: Record<string, string> = {
  'hypertension': 'high blood pressure — your blood pushes too hard against your artery walls',
  'hyperlipidemia': 'high cholesterol — too much fat in your blood',
  'diabetes mellitus': 'diabetes — your body has trouble managing sugar levels in your blood',
  'type 2 diabetes': 'a condition where your body cannot use insulin properly, causing high blood sugar',
  'tachycardia': 'fast heart rate — your heart beats faster than normal',
  'bradycardia': 'slow heart rate — your heart beats slower than normal',
  'dyspnea': 'difficulty breathing or shortness of breath',
  'edema': 'swelling caused by fluid buildup in your body',
  'anemia': 'low red blood cells — you may feel tired because your blood carries less oxygen',
  'arrhythmia': 'irregular heartbeat — your heart may beat too fast, too slow, or irregularly',
  'pneumonia': 'lung infection — your lungs fill with fluid making it hard to breathe',
  'bronchitis': 'inflammation of the breathing tubes in your lungs, causing cough',
  'pharyngitis': 'sore throat — inflammation of the back of your throat',
  'sinusitis': 'sinus infection — inflammation of the spaces behind your nose and forehead',
  'gastritis': 'stomach inflammation — irritation of the stomach lining',
  'hypothyroidism': 'underactive thyroid — your thyroid gland does not make enough hormones',
  'arthritis': 'joint inflammation — causes pain and stiffness in your joints',
  'atorvastatin': 'a medication to lower cholesterol and reduce heart disease risk',
  'metformin': 'a medication to lower blood sugar levels in type 2 diabetes',
  'lisinopril': 'a blood pressure medication (ACE inhibitor)',
  'amoxicillin': 'an antibiotic to treat bacterial infections',
  'omeprazole': 'a medication to reduce stomach acid (proton pump inhibitor)',
  'ibuprofen': 'a pain reliever and anti-inflammatory medication (NSAID)',
  'acetaminophen': 'a pain reliever and fever reducer (Tylenol)',
  'q.d.': 'once a day',
  'b.i.d.': 'twice a day',
  't.i.d.': 'three times a day',
  'q.i.d.': 'four times a day',
  'p.r.n.': 'as needed',
  'p.o.': 'by mouth',
  'stat': 'immediately',
  'mg': 'milligrams',
  'ml': 'milliliters',
};

// @desc    Translate a clinical note to patient-friendly language
// @route   POST /api/translator/translate
export const translateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clinicalNoteId, text } = req.body;

    let textToTranslate = text || '';

    if (clinicalNoteId) {
      const note = await ClinicalNote.findById(clinicalNoteId);
      if (!note) {
        res.status(404).json({ success: false, message: 'Clinical note not found' });
        return;
      }
      textToTranslate = `
Chief Complaint: ${note.chiefComplaint}
History: ${note.historyOfPresentIllness || 'Not provided'}
Assessment: ${note.assessment.map((a) => `${a.diagnosis} (${a.severity})`).join(', ')}
Plan: ${note.plan.map((p) => p.treatment).join('; ')}
Prescriptions: ${note.prescriptions.map((p) => `${p.medication} ${p.dosage} ${p.frequency}`).join(', ')}
      `;
    }

    if (!textToTranslate.trim()) {
      res.status(400).json({ success: false, message: 'No text to translate' });
      return;
    }

    // Translate medical terms
    let translatedText = textToTranslate;
    const translatedTerms: { original: string; simplified: string }[] = [];

    Object.entries(medicalTerms).forEach(([term, explanation]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(translatedText)) {
        translatedTerms.push({ original: term, simplified: explanation });
        translatedText = translatedText.replace(regex, `${term} (${explanation})`);
      }
    });

    // Generate patient-friendly summary
    const summary = {
      originalText: textToTranslate.trim(),
      simplifiedText: translatedText.trim(),
      translatedTerms,
      medicationInstructions: extractMedicationInstructions(textToTranslate),
      riskWarnings: generateRiskWarnings(textToTranslate),
      lifestyleRecommendations: generateLifestyleRecommendations(textToTranslate),
    };

    res.json({ success: true, data: summary });
  } catch (error: any) {
    handleControllerError(res, error, 'Translation operation failed');
  }
};

// @desc    Ask a question about medical content
// @route   POST /api/translator/ask
export const askQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { question, context } = req.body;

    if (!question) {
      res.status(400).json({ success: false, message: 'Question is required' });
      return;
    }

    // Simple Q&A response generation
    const response = generateAnswer(question, context || '');

    res.json({
      success: true,
      data: {
        question,
        answer: response.answer,
        relatedTopics: response.relatedTopics,
        disclaimer: 'This information is for educational purposes only. Always consult your healthcare provider for medical advice.',
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Translation operation failed');
  }
};

// @desc    Get medication instructions in plain language
// @route   POST /api/translator/medication-instructions
export const getMedicationInstructions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { medications } = req.body;

    if (!medications || !Array.isArray(medications)) {
      res.status(400).json({ success: false, message: 'Medications array is required' });
      return;
    }

    const instructions = medications.map((med: any) => ({
      medication: med.name,
      simpleName: medicalTerms[med.name.toLowerCase()] || `Medication: ${med.name}`,
      dosage: med.dosage,
      frequency: medicalTerms[med.frequency?.toLowerCase()] || med.frequency,
      instructions: `Take ${med.dosage} of ${med.name} ${medicalTerms[med.frequency?.toLowerCase()] || med.frequency}`,
      sideEffects: getCommonSideEffects(med.name),
      warnings: getMedicationWarnings(med.name),
    }));

    res.json({ success: true, data: instructions });
  } catch (error: any) {
    handleControllerError(res, error, 'Translation operation failed');
  }
};

// Helper functions
function extractMedicationInstructions(text: string) {
  const instructions: string[] = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('amoxicillin')) {
    instructions.push('Take Amoxicillin as prescribed – complete the full course even if you feel better');
  }
  if (lowerText.includes('ibuprofen')) {
    instructions.push('Take Ibuprofen with food to avoid stomach upset');
  }
  if (lowerText.includes('metformin')) {
    instructions.push('Take Metformin with meals to reduce stomach side effects');
  }
  if (lowerText.includes('atorvastatin')) {
    instructions.push('Take Atorvastatin at bedtime for best effect');
  }

  return instructions;
}

function generateRiskWarnings(text: string) {
  const warnings: string[] = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('diabetes') || lowerText.includes('blood sugar')) {
    warnings.push('Monitor your blood sugar regularly as advised by your doctor');
  }
  if (lowerText.includes('hypertension') || lowerText.includes('blood pressure')) {
    warnings.push('High blood pressure increases risk of heart disease and stroke – take medications as prescribed');
  }
  if (lowerText.includes('cholesterol')) {
    warnings.push('High cholesterol can lead to heart problems – follow dietary recommendations');
  }

  return warnings;
}

function generateLifestyleRecommendations(text: string) {
  const recommendations: string[] = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('diabetes') || lowerText.includes('blood sugar')) {
    recommendations.push('Maintain a balanced diet low in refined sugars');
    recommendations.push('Exercise regularly – at least 30 minutes of moderate activity 5 days a week');
  }
  if (lowerText.includes('hypertension') || lowerText.includes('blood pressure')) {
    recommendations.push('Reduce sodium (salt) intake');
    recommendations.push('Manage stress through relaxation techniques');
  }
  if (lowerText.includes('cholesterol')) {
    recommendations.push('Eat more fruits, vegetables, and whole grains');
    recommendations.push('Limit saturated and trans fats');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain a healthy diet and regular exercise routine');
    recommendations.push('Get adequate sleep (7-9 hours per night)');
    recommendations.push('Stay hydrated – drink 8 glasses of water daily');
  }

  return recommendations;
}

function getCommonSideEffects(medication: string): string[] {
  const sideEffects: Record<string, string[]> = {
    amoxicillin: ['Nausea', 'Diarrhea', 'Skin rash', 'Stomach pain'],
    ibuprofen: ['Stomach upset', 'Headache', 'Dizziness', 'Nausea'],
    metformin: ['Nausea', 'Diarrhea', 'Stomach pain', 'Loss of appetite'],
    atorvastatin: ['Muscle pain', 'Joint pain', 'Nausea', 'Headache'],
    lisinopril: ['Dry cough', 'Dizziness', 'Headache', 'Fatigue'],
  };
  return sideEffects[medication.toLowerCase()] || ['Consult your doctor about possible side effects'];
}

function getMedicationWarnings(medication: string): string[] {
  const warnings: Record<string, string[]> = {
    amoxicillin: ['Do not take if allergic to penicillin', 'Complete the full course'],
    ibuprofen: ['Take with food', 'Do not exceed recommended dose', 'Avoid if you have stomach ulcers'],
    metformin: ['Take with meals', 'Avoid excessive alcohol', 'Report any unusual muscle pain'],
    atorvastatin: ['Take at bedtime', 'Avoid grapefruit', 'Report unexplained muscle pain'],
  };
  return warnings[medication.toLowerCase()] || ['Follow your doctor\'s instructions carefully'];
}

function generateAnswer(question: string, context: string) {
  const lowerQ = question.toLowerCase();
  let answer = 'I recommend discussing this specific question with your healthcare provider for personalized advice.';
  const relatedTopics: string[] = [];

  if (lowerQ.includes('side effect') || lowerQ.includes('reaction')) {
    answer = 'Side effects vary by medication. Common ones include nausea, headache, and dizziness. If you experience severe or unexpected side effects, contact your doctor immediately.';
    relatedTopics.push('Medication Safety', 'When to Contact Your Doctor');
  } else if (lowerQ.includes('diet') || lowerQ.includes('eat') || lowerQ.includes('food')) {
    answer = 'A balanced diet rich in fruits, vegetables, whole grains, and lean proteins is generally recommended. Your specific dietary needs may vary based on your condition.';
    relatedTopics.push('Nutrition', 'Dietary Guidelines');
  } else if (lowerQ.includes('exercise') || lowerQ.includes('activity')) {
    answer = 'Regular physical activity of 30 minutes a day, 5 days a week is generally recommended. Start slowly and increase gradually. Always check with your doctor before starting a new exercise program.';
    relatedTopics.push('Physical Activity', 'Exercise Safety');
  } else if (lowerQ.includes('medication') || lowerQ.includes('medicine') || lowerQ.includes('drug')) {
    answer = 'Always take medications exactly as prescribed. Do not stop or change dosages without consulting your doctor. Store medications properly and check expiration dates.';
    relatedTopics.push('Medication Management', 'Prescription Safety');
  }

  return { answer, relatedTopics };
}
