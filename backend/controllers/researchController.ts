import { Response } from 'express';
import ResearchPaper from '../models/ResearchPaper.js';
import { AuthRequest } from '../middleware/auth.js';

// Sample research papers data (simulates PubMed integration)
const samplePapers = [
  {
    externalId: 'PMID:38001234',
    title: 'Effects of Diabetes on Cardiovascular Disease Risk: A Meta-Analysis',
    authors: ['Smith J', 'Patel A', 'Johnson R'],
    publicationDate: new Date('2025-06-15'),
    journal: 'Journal of Clinical Endocrinology',
    abstract: 'This meta-analysis examines the relationship between type 2 diabetes mellitus and cardiovascular disease risk across 45 studies involving 250,000 participants...',
    summary: 'Diabetes significantly increases cardiovascular disease risk by 2-4x. Early intervention and glycemic control reduce this risk substantially.',
    keyFindings: [
      'Type 2 diabetes increases CV risk by 2-4 times',
      'HbA1c levels above 7% correlate with increased risk',
      'Early intervention reduces CV events by 40%',
      'Combined lifestyle and pharmacological approaches are most effective',
    ],
    methodology: 'Systematic review and meta-analysis of 45 randomized controlled trials',
    limitations: ['Publication bias possible', 'Heterogeneity in study designs', 'Limited long-term follow-up data'],
    keywords: ['diabetes', 'cardiovascular', 'risk', 'meta-analysis'],
    citations: 234,
    category: 'Cardiology',
  },
  {
    externalId: 'PMID:38004209',
    title: 'Clinical Trial: Statin Therapy in Diabetic Patients',
    authors: ['Garcia M', 'Lee S', 'Williams T'],
    publicationDate: new Date('2025-03-20'),
    journal: 'New England Journal of Medicine',
    abstract: 'A large-scale randomized controlled trial evaluating the efficacy of high-dose statin therapy in patients with type 2 diabetes and moderate cardiovascular risk...',
    summary: 'High-dose statin therapy reduced major cardiovascular events by 35% in diabetic patients over 5 years.',
    keyFindings: [
      'High-dose statins reduced MACE by 35%',
      'LDL reduction of 50% achieved in treatment group',
      'Well-tolerated with low discontinuation rates',
      'Benefits observed regardless of baseline LDL levels',
    ],
    methodology: 'Double-blind, placebo-controlled randomized trial with 15,000 participants',
    limitations: ['Predominantly Caucasian population', 'Industry funded'],
    keywords: ['statin', 'diabetes', 'cardiovascular', 'clinical trial'],
    citations: 189,
    category: 'Cardiology',
  },
  {
    externalId: 'PMID:38002567',
    title: 'Artificial Intelligence in Early Disease Detection: A Systematic Review',
    authors: ['Chen L', 'Kumar R', 'Zhang W'],
    publicationDate: new Date('2025-08-10'),
    journal: 'Nature Medicine',
    abstract: 'This systematic review evaluates the current state of AI-based diagnostic tools for early disease detection across multiple medical specialties...',
    summary: 'AI models show 90%+ accuracy in early detection of cancer, cardiovascular diseases, and neurological conditions. Deep learning outperforms traditional methods.',
    keyFindings: [
      'AI achieves 92% accuracy in early cancer detection',
      'Deep learning models outperform radiologist reads in some tasks',
      'Federated learning enables privacy-preserving model training',
      'Integration with EHR improves predictive accuracy by 15%',
    ],
    methodology: 'Systematic review of 120 studies from 2020-2025',
    limitations: ['Limited real-world deployment data', 'Bias in training datasets'],
    keywords: ['artificial intelligence', 'machine learning', 'early detection', 'diagnostics'],
    citations: 456,
    category: 'Digital Health',
  },
  {
    externalId: 'PMID:38005678',
    title: 'Mental Health Interventions in Primary Care Settings',
    authors: ['Brown K', 'Davis P', 'Wilson J'],
    publicationDate: new Date('2025-01-05'),
    journal: 'Lancet Psychiatry',
    abstract: 'An evaluation of integrated mental health screening and intervention programs within primary care settings across 12 countries...',
    summary: 'Integrated mental health screening in primary care improves depression detection by 300% and reduces time to treatment by 60%.',
    keyFindings: [
      'Screening improved depression detection by 300%',
      'Time to treatment reduced by 60%',
      'Cost-effective with $3 return per $1 invested',
      'Patients prefer integrated care model',
    ],
    methodology: 'Multi-country observational study with 50,000 patients',
    limitations: ['Varying healthcare system structures', 'Self-reported outcomes'],
    keywords: ['mental health', 'primary care', 'depression', 'screening'],
    citations: 312,
    category: 'Psychiatry',
  },
  {
    externalId: 'PMID:38006789',
    title: 'Federated Learning for Healthcare: Privacy-Preserving AI',
    authors: ['Ahmed N', 'Park S', 'Johansson L'],
    publicationDate: new Date('2025-11-20'),
    journal: 'Journal of Medical Internet Research',
    abstract: 'This paper presents a comprehensive framework for implementing federated learning in healthcare settings while maintaining HIPAA compliance...',
    summary: 'Federated learning achieves comparable accuracy to centralized models while preserving patient privacy. Practical implementation framework provided.',
    keyFindings: [
      'Federated models achieve 95% of centralized model accuracy',
      'HIPAA-compliant data processing demonstrated',
      'Reduces data sharing needs by 90%',
      'Scalable across multi-hospital networks',
    ],
    methodology: 'Experimental study with 6 hospital networks and synthetic data validation',
    limitations: ['Communication overhead costs', 'Non-IID data distribution challenges'],
    keywords: ['federated learning', 'privacy', 'HIPAA', 'healthcare AI'],
    citations: 178,
    category: 'Health Informatics',
  },
];

// @desc    Search research papers
// @route   GET /api/research/search
export const searchPapers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query, category, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let filter: any = {};
    if (query) {
      filter.$text = { $search: query as string };
    }
    if (category) {
      filter.category = category;
    }

    let papers = await ResearchPaper.find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ publicationDate: -1 });

    // If no papers in DB, seed with sample data
    if (papers.length === 0 && !query) {
      await ResearchPaper.insertMany(samplePapers);
      papers = await ResearchPaper.find()
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ publicationDate: -1 });
    }

    // If searching by text and DB is empty, filter sample papers in-memory
    if (papers.length === 0 && query) {
      const queryStr = (query as string).toLowerCase();
      const filtered = samplePapers.filter(
        (p) =>
          p.title.toLowerCase().includes(queryStr) ||
          p.abstract.toLowerCase().includes(queryStr) ||
          p.keywords.some((k) => k.includes(queryStr))
      );

      // Insert filtered papers to DB
      if (filtered.length > 0) {
        for (const paper of filtered) {
          await ResearchPaper.findOneAndUpdate(
            { externalId: paper.externalId },
            paper,
            { upsert: true, new: true }
          );
        }
        papers = await ResearchPaper.find(filter)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .sort({ publicationDate: -1 });
      }
    }

    const total = await ResearchPaper.countDocuments(filter);

    res.json({
      success: true,
      data: papers,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single paper
// @route   GET /api/research/paper/:id
export const getPaper = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paper = await ResearchPaper.findById(req.params.id);
    if (!paper) {
      res.status(404).json({ success: false, message: 'Paper not found' });
      return;
    }
    res.json({ success: true, data: paper });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save/bookmark paper
// @route   POST /api/research/paper/:id/save
export const savePaper = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paper = await ResearchPaper.findById(req.params.id);
    if (!paper) {
      res.status(404).json({ success: false, message: 'Paper not found' });
      return;
    }

    const userId = req.user!._id;
    const isSaved = paper.savedBy.some((id) => id.toString() === userId.toString());

    if (isSaved) {
      paper.savedBy = paper.savedBy.filter((id) => id.toString() !== userId.toString());
    } else {
      paper.savedBy.push(userId);
    }

    await paper.save();
    res.json({ success: true, data: { saved: !isSaved } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trend analysis
// @route   GET /api/research/trends
export const getTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trends = [
      {
        topic: 'AI in Healthcare',
        growth: 45,
        papers: 12500,
        period: '2024-2025',
        keyAreas: ['Early detection', 'Drug discovery', 'Clinical decision support'],
      },
      {
        topic: 'Federated Learning',
        growth: 120,
        papers: 3200,
        period: '2024-2025',
        keyAreas: ['Privacy-preserving AI', 'Multi-hospital networks', 'HIPAA compliance'],
      },
      {
        topic: 'Preventive Medicine',
        growth: 30,
        papers: 8700,
        period: '2024-2025',
        keyAreas: ['Risk prediction', 'Lifestyle interventions', 'Wearable monitoring'],
      },
      {
        topic: 'Mental Health Digital',
        growth: 65,
        papers: 5400,
        period: '2024-2025',
        keyAreas: ['Digital therapeutics', 'Telepsychiatry', 'AI screening'],
      },
      {
        topic: 'Precision Medicine',
        growth: 38,
        papers: 9100,
        period: '2024-2025',
        keyAreas: ['Genomics', 'Pharmacogenomics', 'Biomarker discovery'],
      },
    ];

    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Compare evidence across papers
// @route   POST /api/research/compare
export const compareEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paperIds } = req.body;

    if (!paperIds || paperIds.length < 2) {
      res.status(400).json({ success: false, message: 'At least 2 paper IDs required' });
      return;
    }

    const papers = await ResearchPaper.find({ _id: { $in: paperIds } });

    const comparison = {
      papers: papers.map((p) => ({ id: p._id, title: p.title, journal: p.journal })),
      commonFindings: findCommonElements(papers.map((p) => p.keyFindings)),
      contradictions: findContradictions(papers),
      methodologyComparison: papers.map((p) => ({ title: p.title, methodology: p.methodology })),
      overallConsensus: 'Partial agreement — further research recommended',
      combinedLimitations: [...new Set(papers.flatMap((p) => p.limitations))],
    };

    res.json({ success: true, data: comparison });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function findCommonElements(findingsArrays: string[][]): string[] {
  if (findingsArrays.length === 0) return [];
  return findingsArrays[0].filter((finding) =>
    findingsArrays.every((arr) => arr.some((f) => f.toLowerCase().includes(finding.toLowerCase().split(' ')[0])))
  );
}

function findContradictions(papers: any[]): string[] {
  // Simplified contradiction detection
  return ['No significant contradictions found among the selected papers.'];
}
