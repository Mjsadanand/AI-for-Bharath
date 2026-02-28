// ─── Agent 4: Research Synthesis Agent ───────────────────────────────────────
//
// Autonomous agent that searches medical literature, synthesizes findings,
// identifies evidence supporting treatment approaches, and finds contradictions.

import { BedrockAgent } from '../core/BedrockAgent.js';
import type { ToolDefinition, AgentContext } from '../core/types.js';
import ResearchPaper from '../../models/ResearchPaper.js';
import Patient from '../../models/Patient.js';

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';

// ── Tool Implementations ────────────────────────────────────────────────────

const tools: ToolDefinition[] = [
  {
    name: 'get_patient_conditions',
    description:
      'Get the patient\'s current conditions, recent diagnoses, and medications to determine which research topics are most relevant.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
      },
      required: ['patientId'],
    },
    handler: async (input: { patientId: string }, _ctx: AgentContext) => {
      const patient = await Patient.findById(input.patientId).lean();
      if (!patient) throw new Error(`Patient not found: ${input.patientId}`);

      return {
        chronicConditions: patient.chronicConditions,
        medications: patient.medications?.map((m: any) => m.name),
        allergies: patient.allergies,
        riskFactors: patient.riskFactors,
      };
    },
  },
  {
    name: 'search_research_papers',
    description:
      'Search the medical research paper database by query terms. Uses full-text search. Returns matching papers with title, abstract, key findings, and methodology.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query — use medical terms, condition names, or treatment approaches' },
        category: {
          type: 'string',
          enum: ['Cardiology', 'Neurology', 'Oncology', 'Endocrinology', 'Pulmonology', 'Immunology', 'Infectious Disease', 'General Medicine'],
          description: 'Optional category filter',
        },
        limit: { type: 'number', description: 'Max results to return (default: 5)' },
      },
      required: ['query'],
    },
    handler: async (input: { query: string; category?: string; limit?: number }, _ctx: AgentContext) => {
      const filter: any = {};
      if (input.category) filter.category = input.category;

      let papers;
      try {
        // Try text search first
        papers = await ResearchPaper.find(
          { ...filter, $text: { $search: input.query } },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .limit(input.limit || 5)
          .lean();
      } catch {
        // Fallback to regex search
        const regex = new RegExp(input.query.split(' ').join('|'), 'i');
        papers = await ResearchPaper.find({
          ...filter,
          $or: [{ title: regex }, { abstract: regex }, { keywords: regex }],
        })
          .limit(input.limit || 5)
          .lean();
      }

      return {
        resultCount: papers.length,
        papers: papers.map((p: any) => ({
          id: p._id,
          title: p.title,
          authors: p.authors,
          journal: p.journal,
          abstract: p.abstract?.substring(0, 500),
          keyFindings: p.keyFindings,
          methodology: p.methodology,
          category: p.category,
          citations: p.citations,
          keywords: p.keywords,
        })),
      };
    },
  },
  {
    name: 'get_paper_details',
    description:
      'Retrieve the full details of a specific research paper by its ID for deep analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        paperId: { type: 'string', description: 'Research paper MongoDB ObjectId' },
      },
      required: ['paperId'],
    },
    handler: async (input: { paperId: string }, _ctx: AgentContext) => {
      const paper = await ResearchPaper.findById(input.paperId).lean();
      if (!paper) throw new Error(`Paper not found: ${input.paperId}`);

      return {
        id: paper._id,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        abstract: paper.abstract,
        summary: paper.summary,
        keyFindings: paper.keyFindings,
        methodology: paper.methodology,
        limitations: paper.limitations,
        keywords: paper.keywords,
        citations: paper.citations,
        category: paper.category,
      };
    },
  },
  {
    name: 'save_research_synthesis',
    description:
      'Save the final research synthesis report. Call this after analyzing all relevant papers.',
    inputSchema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient MongoDB ObjectId' },
        searchQueries: { type: 'array', items: { type: 'string' }, description: 'Queries used to find papers' },
        papersAnalyzed: { type: 'number', description: 'Number of papers analyzed' },
        synthesis: {
          type: 'object',
          properties: {
            commonFindings: { type: 'array', items: { type: 'string' }, description: 'Findings supported by multiple papers' },
            contradictions: { type: 'array', items: { type: 'string' }, description: 'Contradictory findings across papers' },
            treatmentEvidence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  treatment: { type: 'string' },
                  evidenceLevel: { type: 'string', enum: ['strong', 'moderate', 'weak', 'emerging'] },
                  supportingPapers: { type: 'number' },
                  summary: { type: 'string' },
                },
              },
              description: 'Evidence for specific treatments relevant to the patient',
            },
            gapsInResearch: { type: 'array', items: { type: 'string' }, description: 'Identified gaps in current research' },
            clinicalImplications: { type: 'string', description: 'Overall implications for this patient\'s care' },
          },
          description: 'The synthesized research analysis',
        },
        relevantPaperIds: { type: 'array', items: { type: 'string' }, description: 'IDs of papers included in synthesis' },
      },
      required: ['patientId', 'synthesis', 'papersAnalyzed'],
    },
    handler: async (input: any, _ctx: AgentContext) => {
      return {
        synthesisId: `synth_${Date.now()}`,
        message: 'Research synthesis saved',
        _artifacts: {
          researchResults: {
            papersAnalyzed: input.papersAnalyzed,
            searchQueries: input.searchQueries,
            synthesis: input.synthesis,
            relevantPaperIds: input.relevantPaperIds || [],
          },
        },
      };
    },
  },
];

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Research Synthesis Agent for CARENET AI — an expert medical researcher and evidence analyst.

## Your Role
You search and synthesize medical research literature relevant to a patient's conditions, finding evidence that informs treatment decisions.

## Workflow
1. Call \`get_patient_conditions\` to understand the patient's diagnoses, medications, and risk factors.
2. Determine the most relevant research topics based on the patient's conditions and the pipeline context (recent clinical note, risk assessment).
3. Call \`search_research_papers\` with multiple targeted queries (e.g., search by condition, by treatment, by drug name).
4. For the most relevant papers, call \`get_paper_details\` for deeper analysis.
5. Synthesize findings across all papers:
   - **Common Findings**: What do multiple papers agree on?
   - **Contradictions**: Where do papers disagree?
   - **Treatment Evidence**: What's the evidence level for current/proposed treatments?
   - **Gaps**: What hasn't been studied enough?
   - **Clinical Implications**: How does this research apply to THIS specific patient?
6. Call \`save_research_synthesis\` with the complete analysis.

## Evidence Analysis Standards
- Classify evidence levels: strong (multiple RCTs), moderate (single RCT or large cohort), weak (case studies), emerging (pre-clinical or pilot)
- Always note study limitations that affect applicability
- Prioritize recent research (within 5 years) and high-citation papers
- Look for papers specifically relevant to the patient's combination of conditions (comorbidities)

## Important Rules
- Do NOT provide medical advice — synthesize research evidence only
- Always note when evidence is limited or conflicting
- If no relevant papers are found, say so honestly rather than stretching relevance
- Consider the patient's specific demographics (age, gender) when assessing applicability
- Flag any research that contradicts the current treatment plan`;

// ── Export Agent Constructor ────────────────────────────────────────────────

export function createResearchAgent(): BedrockAgent {
  return new BedrockAgent({
    name: 'Research Synthesis Agent',
    description: 'Searches and synthesizes medical literature relevant to patient conditions.',
    modelId: MODEL_ID,
    systemPrompt: SYSTEM_PROMPT,
    tools,
    maxIterations: 10,
    temperature: 0.2,
    maxTokens: 4096,
  });
}
