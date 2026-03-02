# CARENET AI — Token Usage & Cost Catalog

## Model: Amazon Nova Premier (`us.amazon.nova-premier-v1:0`)

| Tier | Input (per 1M tokens) | Output (per 1M tokens) |
|------|----------------------|------------------------|
| **Nova Premier** (current) | **$2.50** | **$10.00** |
| Nova Pro (alternative) | $0.80 | $3.20 |
| Nova Lite (budget) | $0.06 | $0.24 |

> Verify latest prices: https://aws.amazon.com/bedrock/pricing/ → Amazon tab

---

## Per-Agent Token Breakdown

### How tokens accumulate per Converse API call
Each iteration (API call) sends:
- **System prompt** (~400–600 tokens) — sent every call
- **Tool schemas** (~500–1,000 tokens) — sent every call
- **Full conversation history** — grows with each iteration
- **Model response** — output tokens

### 1. Clinical Documentation Agent
| Metric | Value |
|--------|-------|
| **Purpose** | Process patient transcripts → structured SOAP notes |
| **System prompt** | ~439 tokens |
| **Tools** | 2 (`get_patient_record`, `create_clinical_note`) |
| **Tool schemas** | ~755 tokens |
| **Expected iterations** | 3–4 |
| **Typical user input** | 500–3,000 words transcript (~750–4,500 tokens) |

**Estimated tokens per run:**

| Iteration | Input tokens | Output tokens |
|-----------|-------------|---------------|
| 1. Initial (prompt + transcript) | ~2,000–5,500 | ~300 (tool call) |
| 2. After tool result (get patient) | ~2,800–6,300 | ~400 (tool call) |
| 3. After tool result (create note) | ~4,000–7,500 | ~500 (final) |
| **TOTAL** | **~8,800–19,300** | **~1,200** |

**Cost per run: $0.034 – $0.060**

---

### 2. Patient Report Simplifier
| Metric | Value |
|--------|-------|
| **Purpose** | Convert medical report → patient-friendly language |
| **System prompt** | ~593 tokens |
| **Tools** | 1 (`format_simplified_report`) |
| **Tool schemas** | ~458 tokens |
| **Expected iterations** | 2 |
| **Typical user input** | 200–2,000 words report (~300–3,000 tokens) |

**Estimated tokens per run:**

| Iteration | Input tokens | Output tokens |
|-----------|-------------|---------------|
| 1. Initial (prompt + report) | ~1,400–3,800 | ~600 (tool call with structured output) |
| 2. After tool result | ~2,500–4,900 | ~400 (final summary) |
| **TOTAL** | **~3,900–8,700** | **~1,000** |

**Cost per run: $0.020 – $0.032**

> ℹ️ This agent is NOT part of the standard pipeline — invoked on-demand only.

---

### 3. Predictive Analytics Agent
| Metric | Value |
|--------|-------|
| **Purpose** | Risk scoring, condition prediction, clinical alerts |
| **System prompt** | ~569 tokens |
| **Tools** | 3 (`get_patient_health_data`, `get_recent_clinical_notes`, `create_risk_assessment`) |
| **Tool schemas** | ~912 tokens |
| **Expected iterations** | 4–5 |
| **Typical user input** | Pipeline context + patientId (~200–500 tokens) |

**Estimated tokens per run:**

| Iteration | Input tokens | Output tokens |
|-----------|-------------|---------------|
| 1. Initial | ~1,700 | ~200 (tool call) |
| 2. After health data | ~3,200 | ~200 (tool call) |
| 3. After clinical notes | ~5,500 | ~300 (reasoning) |
| 4. Create risk assessment | ~6,500 | ~800 (large tool call) |
| 5. Final response | ~8,000 | ~400 |
| **TOTAL** | **~24,900** | **~1,900** |

**Cost per run: $0.081**

---

### 4. Research Synthesis Agent
| Metric | Value |
|--------|-------|
| **Purpose** | Search medical literature, synthesize findings |
| **System prompt** | ~496 tokens |
| **Tools** | 4 (`get_patient_conditions`, `search_research_papers`, `get_paper_details`, `save_research_synthesis`) |
| **Tool schemas** | ~665 tokens |
| **Expected iterations** | 6–8 |
| **Typical user input** | Pipeline context with conditions (~300–600 tokens) |

**Estimated tokens per run:**

| Iteration | Input tokens | Output tokens |
|-----------|-------------|---------------|
| 1. Initial | ~1,500 | ~200 |
| 2. After conditions | ~2,500 | ~200 |
| 3. Search #1 | ~3,500 | ~200 |
| 4. Paper details #1 | ~5,000 | ~200 |
| 5. Search #2 | ~6,500 | ~200 |
| 6. Paper details #2 | ~8,500 | ~200 |
| 7. Save synthesis | ~10,000 | ~1,000 |
| 8. Final response | ~12,000 | ~500 |
| **TOTAL** | **~49,500** | **~2,700** |

**Cost per run: $0.151**

> ⚠️ **Most expensive agent** — multiple search + paper retrieval iterations.

---

### 5. Medical Translator Agent
| Metric | Value |
|--------|-------|
| **Purpose** | Clinical notes → patient-friendly explanations with medication guides |
| **System prompt** | ~461 tokens |
| **Tools** | 3 (`get_clinical_note`, `get_patient_context`, `save_translation`) |
| **Tool schemas** | ~679 tokens |
| **Expected iterations** | 3–4 |
| **Typical user input** | Clinical note ID + patient ID (~150 tokens) |

**Estimated tokens per run:**

| Iteration | Input tokens | Output tokens |
|-----------|-------------|---------------|
| 1. Initial | ~1,300 | ~200 (tool call) |
| 2. After clinical note | ~3,000 | ~200 (tool call) |
| 3. After patient context | ~4,500 | ~800 (save translation) |
| 4. Final response | ~6,000 | ~400 |
| **TOTAL** | **~14,800** | **~1,600** |

**Cost per run: $0.053**

---

### 6. Workflow Automation Agent
| Metric | Value |
|--------|-------|
| **Purpose** | Create appointments, insurance claims, lab orders |
| **System prompt** | ~598 tokens |
| **Tools** | 5 (`get_doctor_schedule`, `create_appointment`, `create_insurance_claim`, `create_lab_order`, `get_patient_insurance`) |
| **Tool schemas** | ~1,033 tokens |
| **Expected iterations** | 6–10 |
| **Typical user input** | Full pipeline context (~500–1,500 tokens) |

**Estimated tokens per run:**

| Iteration | Input tokens | Output tokens |
|-----------|-------------|---------------|
| 1. Initial | ~2,200 | ~200 |
| 2. Get schedule | ~3,500 | ~300 |
| 3. Create appointment | ~4,500 | ~300 |
| 4. Get insurance | ~5,500 | ~200 |
| 5. Create claim | ~6,800 | ~400 |
| 6. Create lab order #1 | ~8,000 | ~300 |
| 7. Create lab order #2 | ~9,500 | ~300 |
| 8. Create lab order #3 | ~11,000 | ~300 |
| 9. Final response | ~12,000 | ~500 |
| **TOTAL** | **~63,000** | **~2,800** |

**Cost per run: $0.186**

> ⚠️ **Highest iteration count** — creates multiple DB records per run.

---

## Full Pipeline Cost (5 Agents)

The standard pipeline runs these agents in sequence:  
`Clinical Doc → Translator → Predictive → Research → Workflow`

| Agent | Input tokens | Output tokens | Cost |
|-------|-------------|---------------|------|
| Clinical Documentation | ~14,000 | ~1,200 | $0.047 |
| Medical Translator | ~14,800 | ~1,600 | $0.053 |
| Predictive Analytics | ~24,900 | ~1,900 | $0.081 |
| Research Synthesis | ~49,500 | ~2,700 | $0.151 |
| Workflow Automation | ~63,000 | ~2,800 | $0.186 |
| **PIPELINE TOTAL** | **~166,200** | **~10,200** | **$0.518** |

### Per-pipeline summary
- **~176K total tokens** per full pipeline run
- **~$0.52 per patient pipeline run** (average)
- **Could range $0.35 – $0.75** depending on transcript length and iterations

---

## Budget Calculator ($100 Credits)

| Usage Pattern | Cost/run | Runs for $100 | Per day (30 days) |
|---------------|----------|---------------|-------------------|
| **Full 5-agent pipeline** | ~$0.52 | **~192 runs** | ~6 patients/day |
| **Clinical Doc only** | ~$0.047 | ~2,127 runs | ~70/day |
| **Patient Report (standalone)** | ~$0.032 | ~3,125 runs | ~104/day |
| **Predictive only** | ~$0.081 | ~1,234 runs | ~41/day |
| **Research only** | ~$0.151 | ~662 runs | ~22/day |
| **Translator only** | ~$0.053 | ~1,886 runs | ~62/day |
| **Workflow only** | ~$0.186 | ~537 runs | ~17/day |

---

## Cost-Saving Tips

### 1. Switch to Nova Pro for lighter tasks ($0.80/$3.20 per 1M)
Set per-agent model in `.env` or hardcode cheaper models for simpler agents:
- **Patient Report** → Nova Pro (simple rewriting, no complex reasoning)
- **Translator** → Nova Pro (text transformation, not analytical)
- This cuts those agents' costs by ~68%

### 2. Switch to Nova Lite for testing ($0.06/$0.24 per 1M)
For development/testing, use Nova Lite — **96% cheaper** than Premier:
```
BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0
```
Full pipeline on Nova Lite: **~$0.013 per run** (7,692 test runs for $100)

### 3. Reduce max iterations
Lower `maxIterations` on Research (10→6) and Workflow (12→8) agents  
to cap runaway token usage from excessive tool calls.

### 4. Run individual agents instead of full pipeline
Not every patient visit needs all 5 agents. Use individual endpoints:
- `/api/clinical/notes` — just clinical documentation
- `/api/predictive/assess` — just risk assessment
- etc.

---

## Model Comparison (to help you decide)

| Model | Input/1M | Output/1M | Full Pipeline Cost | Quality |
|-------|----------|-----------|-------------------|---------|
| **Nova Premier** | $2.50 | $10.00 | **$0.52** | Best (tool use, reasoning) |
| Nova Pro | $0.80 | $3.20 | ~$0.17 | Good (may miss nuances) |
| Nova Lite | $0.06 | $0.24 | ~$0.013 | Basic (testing only) |
| Claude Sonnet 4* | $3.00 | $15.00 | ~$0.80 | Excellent (when available) |

*Claude Sonnet 4 requires separate Marketplace subscription

---

## Monitoring Your Spend
1. **AWS Console → Billing → Bills** — check daily
2. **Budget alarm** already set at $80 (from earlier setup)
3. **Token tracking** — each agent logs `tokensUsed: { input, output }` in its response
4. Check server logs for per-request usage:
   ```
   ✅ [ClinicalDocAgent] Completed in 12340ms (3 tool calls)
   ```

---

*Last updated: March 1, 2026*  
*Prices sourced from AWS Bedrock on-demand pricing (us-east-1)*  
*Token estimates are averages — actual usage varies with input length and model behavior*
