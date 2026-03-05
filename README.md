<p align="center">
  <img src="https://img.shields.io/badge/CARENET-AI-0ea5e9?style=for-the-badge&logo=heart&logoColor=white" alt="CARENET AI" />
  <img src="https://img.shields.io/badge/AWS-Bedrock-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="Amazon Bedrock" />
  <img src="https://img.shields.io/badge/Amazon%20Transcribe-Medical-8A2BE2?style=for-the-badge&logo=amazonaws&logoColor=white" alt="Amazon Transcribe Medical" />
  <img src="https://img.shields.io/badge/Amazon%20S3-Storage-569A31?style=for-the-badge&logo=amazons3&logoColor=white" alt="Amazon S3" />
</p>

<h1 align="center">CARENET AI — Intelligent Healthcare Assistant Platform</h1>

<p align="center">
  A comprehensive, AI-powered healthcare management system delivering clinical documentation, predictive analytics, medical translation, research synthesis, and workflow automation — all within a unified, role-based platform.
</p>

<p align="center">
  <strong>Built entirely on AWS Generative AI</strong> — Amazon Bedrock (Nova Premier) powers five specialized ReAct agents;
  Amazon Transcribe Medical handles clinical-grade speech-to-text; Amazon S3 secures all audio assets.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-ISC-green" alt="License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Patients](#patients)
  - [Clinical Documentation](#clinical-documentation)
  - [Medical Translator](#medical-translator)
  - [Predictive Analytics](#predictive-analytics)
  - [Research](#research)
  - [Workflow Management](#workflow-management)
  - [Dashboard](#dashboard)
- [User Roles & Permissions](#user-roles--permissions)
- [Data Models](#data-models)
- [Frontend Pages](#frontend-pages)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**CARENET AI** is a full-stack healthcare assistant platform designed to streamline clinical workflows, enhance patient care, and support medical research through intelligent automation.

> **Hackathon Track — Using Generative AI on AWS**  
> This project leverages Amazon Bedrock, Amazon Transcribe Medical, and Amazon S3 as its core AI and infrastructure services. Every AI capability in the platform runs through AWS — there are no third-party AI providers.

---

## Why AI is Required

Healthcare documentation, risk assessment, and patient communication are complex, high-stakes tasks where rule-based automation alone falls short:

| Challenge | Why Rule-Based Fails | How Generative AI Solves It |
|-----------|---------------------|-----------------------------|
| **Clinical note generation** | Free-form transcripts have infinite variation in phrasing, structure, and medical vocabulary | Amazon Bedrock agents parse any natural-language transcript and produce structured SOAP notes with ICD-coded diagnoses |
| **Medical entity extraction** | Medical terminology changes constantly; regex/dictionaries miss context | LLM tool-use extracts symptoms, medications, procedures with confidence scoring |
| **Patient-friendly translation** | A static 30-term dictionary cannot explain a complex multi-diagnosis report | Bedrock generates context-aware explanations tailored to individual patient reports |
| **Predictive risk scoring** | Scoring rules become outdated; cannot reason over narrative clinical context | Bedrock synthesizes vitals, medications, chronic conditions, and recent notes to produce holistic risk assessments with evidence citations |
| **Research synthesis** | Keyword search returns papers; it cannot compare evidence or identify contradictions | Bedrock agents surface common findings, conflicts, and trends across multiple papers |
| **Clinical audio transcription** | Generic ASR misses medical vocabulary (drug names, procedures, ICD codes) | Amazon Transcribe Medical ships with a 100,000+ term clinical vocabulary purpose-built for doctor-patient conversations |

**The system literally cannot function without AI** — there is no manual substitute for real-time clinical note generation from speech, or for synthesising evidence across 50 research papers in seconds.

---

## AWS Services Architecture

### Generative AI Layer — Amazon Bedrock

| Agent | Purpose | Model | Tool-Use Pattern |
|-------|---------|-------|------------------|
| **ClinicalDocAgent** | Transcript → structured SOAP note with ICD codes | `us.amazon.nova-premier-v1:0` | `get_patient_record` + `create_clinical_note` |
| **TranslatorAgent** | Clinical note → patient-friendly language | `us.amazon.nova-premier-v1:0` | `get_clinical_note` + `format_simplified_report` |
| **PredictiveAgent** | Patient data → multi-category risk assessment | `us.amazon.nova-premier-v1:0` | `get_patient_health_data` + `create_risk_assessment` |
| **ResearchAgent** | Query → evidence synthesis across papers | `us.amazon.nova-premier-v1:0` | `search_papers` + `compare_evidence` |
| **WorkflowAgent** | Clinical output → appointments / claims / labs | `us.amazon.nova-premier-v1:0` | `create_appointment` + `create_insurance_claim` |

All agents share a **ReAct-style agentic loop** implemented in [`BedrockAgent.ts`](backend/agents/core/BedrockAgent.ts) using the Bedrock **Converse API** with native tool-use. The [`Orchestrator`](backend/agents/core/Orchestrator.ts) chains all five agents sequentially, passing state between steps.

**Bedrock implementation details:**
- SDK: `@aws-sdk/client-bedrock-runtime` v3
- API: `ConverseCommand` with tool configuration
- Retry logic: exponential backoff on `ThrottlingException`, `ServiceUnavailableException`, `InternalServerException`
- Per-call timeout: 90 seconds; max iterations per agent: 8
- Model: Amazon Nova Premier — chosen for its best-in-class reasoning on clinical narratives

### Speech Intelligence — Amazon Transcribe Medical

The clinical documentation workflow uses **Amazon Transcribe Medical** for audio → text conversion:

```
Doctor records consultation
         │
         ▼
  POST /api/clinical-docs/transcribe
         │
         ▼  Step 1
  ┌─────────────────────────────────────────┐
  │  Amazon S3  (carenet-audio/<job>.webm)  │  ← AES-256 server-side encrypted
  └────────────────────┬────────────────────┘
                       │  Step 2
                       ▼
  ┌─────────────────────────────────────────┐
  │  Amazon Transcribe Medical              │
  │  • Specialty: PRIMARYCARE               │
  │  • Type: CONVERSATION                   │
  │  • 100k+ clinical vocabulary terms      │
  └────────────────────┬────────────────────┘
                       │  Step 3  (polls until COMPLETED)
                       ▼
  ┌─────────────────────────────────────────┐
  │  S3 transcript output JSON              │  ← Fetched + parsed by backend
  └────────────────────┬────────────────────┘
                       │  Step 4
                       ▼
  Transcript text returned to frontend
  → Feeds into ClinicalDocAgent pipeline
```

**Why Amazon Transcribe Medical over generic ASR:**  
Generic models do not reliably recognise drug names (e.g. *lisinopril*, *metformin*), clinical abbreviations (*PRN*, *b.i.d.*), or ICD-coded conditions. Transcribe Medical's purpose-built vocabulary eliminates transcription errors that would corrupt downstream AI-generated notes.

### Storage — Amazon S3

| Path prefix | Content | Lifecycle |
|-------------|---------|----------|
| `carenet-audio/<job>.*` | Temporary audio upload before Transcribe job | Deleted after job completes |
| `carenet-transcripts/<job>.json` | Transcribe Medical output JSON | Retained for audit |

All objects are server-side encrypted (`AES256`). IAM policy grants minimum required permissions (`s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`) scoped to the `AWS_S3_BUCKET_NAME` bucket.

### What Value the AI Layer Adds

| Without AI | With AI (CARENET) |
|------------|-------------------|
| Doctor spends 15-20 min writing notes after each consultation | Structured SOAP note generated from a spoken transcript in < 30 seconds |
| Patients receive jargon-filled discharge papers they cannot understand | Personalised plain-language summary with medication guides generated instantly |
| Cardiovascular risk detected only at next annual check-up | Continuous automated risk scoring triggers alerts the moment vitals or conditions change |
| Researching evidence for a treatment takes hours across multiple papers | Evidence synthesis across all stored research papers in one query |
| Insurance claim coding requires manual CPT/ICD lookup | Workflow agent auto-populates ICD codes from the clinical note |

--- The system serves four distinct user roles — **Doctors**, **Patients**, **Researchers**, and **Administrators** — each with a tailored dashboard and feature set.

The platform integrates AI-driven capabilities including natural language processing for clinical documentation, predictive risk scoring, medical terminology translation for patient comprehension, and evidence-based research synthesis.

---

## Key Features

### 🩺 AI-Powered Clinical Documentation
- Generate structured clinical notes from free-text transcripts
- Automated extraction of medical entities (symptoms, diagnoses, medications, procedures, lab tests) with confidence scoring
- Support for multiple note types: progress notes, initial consultations, follow-ups, discharge summaries, and procedure notes
- Built-in verification workflow (pending → verified / rejected / amended)

### 📊 Predictive Risk Analytics
- Multi-category risk assessment (Cardiovascular, Metabolic, Respiratory)
- Risk scoring based on chronic conditions, vital signs, and BMI calculations
- Evidence-based recommendations citing AHA, ADA, and WHO guidelines
- Predictive modeling with probability estimates and timeframes
- Real-time alert system with critical/warning levels and acknowledgment tracking

### 🌐 Medical Report Translator
- Converts clinical terminology into patient-friendly language using a 30+ term medical dictionary
- Interactive Q&A engine for patient questions about conditions, medications, diet, and exercise
- Auto-generated medication guides with purpose, instructions, side effects, and warnings
- Risk warnings and lifestyle recommendation generation

### 🔬 Research Synthesis Engine
- Full-text search across research papers with category filtering (Cardiology, Neurology, Oncology, etc.)
- Evidence comparison across multiple papers with common findings and contradictions analysis
- Trend analysis with growth percentages across research topics
- Save/bookmark functionality for papers of interest

### ⚙️ Workflow Automation
- **Appointment Management** — Scheduling with conflict detection, status tracking, and priority levels
- **Insurance Claims** — End-to-end lifecycle (draft → submitted → processing → approved/denied/appealed) with internal audit trails
- **Lab Results** — Full lifecycle management with reference ranges, abnormal flagging, and review tracking

### 📈 Role-Based Dashboards
- **Doctor** — Today's schedule, patient count, pending notes, active risk alerts, quick actions
- **Patient** — Health score, upcoming appointments, lab results, medications, risk assessment visualization
- **Admin** — System-wide metrics (users, patients, notes, alerts, claims, labs), quick management actions
- **Researcher** — Paper statistics, trending topics, quick access to research and analytics

---

## Tech Stack

| Layer          | Technology                                                                                  |
|----------------|---------------------------------------------------------------------------------------------|
| **AWS AI/ML**  | Amazon Bedrock (Nova Premier), Amazon Transcribe Medical, Amazon S3                         |
| **Frontend**   | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, React Router 7, Recharts, Lucide React   |
| **Backend**    | Node.js, Express 5, TypeScript 5.9, Mongoose 9                                              |
| **AWS SDK**    | `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-transcribe`, `@aws-sdk/client-s3`       |
| **Database**   | MongoDB (Mongoose 9)                                                                        |
| **Auth**       | JSON Web Tokens (JWT), bcryptjs, Google OAuth 2.0                                           |
| **HTTP Client**| Axios with interceptors                                                                     |
| **UI/UX**      | Headless UI, React Hot Toast, Google Fonts (Inter)                                          |
| **Dev Tools**  | ESLint, tsx (watch mode), Vite dev server with API proxy, React Compiler                    |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CARENET AI Platform                         │
├─────────────────────────┬───────────────────────────────────────────┤
│      Frontend (React)   │           Backend (Express)               │
│                         │                                           │
│  ┌───────────────────┐  │  ┌─────────────┐  ┌──────────────────┐   │
│  │  Auth Context      │  │  │  Middleware  │  │   Controllers    │   │
│  │  (JWT + localStorage│  │  │  ┌────────┐ │  │  ┌────────────┐ │   │
│  │   carenet_token)   │  │  │  │  Auth   │ │  │  │  Auth      │ │   │
│  └───────┬───────────┘  │  │  │  (JWT)   │ │  │  │  Patient   │ │   │
│          │              │  │  ├────────┤ │  │  │  Clinical  │ │   │
│  ┌───────▼───────────┐  │  │  │  Audit  │ │  │  │  Translator│ │   │
│  │  Axios Instance    │──┼──│  │  Logger │ │  │  │  Predictive│ │   │
│  │  (Bearer Token +   │  │  │  └────────┘ │  │  │  Research  │ │   │
│  │   401 Interceptor) │  │  └─────────────┘  │  │  Workflow  │ │   │
│  └───────┬───────────┘  │                    │  │  Dashboard │ │   │
│          │              │                    │  └────────────┘ │   │
│  ┌───────▼───────────┐  │  ┌─────────────┐  └────────┬─────────┘   │
│  │  Pages (Role-Based)│  │  │   Routes    │──────────┘             │
│  │  • Doctor Dashboard│  │  │  /api/auth  │                        │
│  │  • Patient Dashboard│ │  │  /api/patients│  ┌──────────────┐    │
│  │  • Admin Dashboard  │ │  │  /api/clinical│  │   MongoDB    │    │
│  │  • Researcher Dash. │ │  │  /api/translator│ │  (Mongoose)  │    │
│  │  • Clinical Docs   │  │  │  /api/predictive│ │  9 Models    │    │
│  │  • Translator      │  │  │  /api/research │ └──────────────┘    │
│  │  • Predictive      │  │  │  /api/workflow │                     │
│  │  • Research        │  │  │  /api/dashboard│                     │
│  │  • Workflow        │  │  └─────────────┘                        │
│  └───────────────────┘  │                                           │
└─────────────────────────┴───────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or yarn/pnpm)
- **MongoDB** ≥ 6.x (local instance or MongoDB Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/carenet-ai.git
cd carenet-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/carenet

# Authentication
JWT_SECRET=your-secure-jwt-secret-key-min-32-chars

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# ─── Amazon Web Services ───────────────────────────────────────────────────────
# All AI features run through AWS — credentials must have permissions for:
#   bedrock:InvokeModel   (Amazon Bedrock — all 5 agents)
#   s3:PutObject / GetObject / DeleteObject   (Amazon S3 — audio uploads)
#   transcribe:StartMedicalTranscriptionJob / GetMedicalTranscriptionJob
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Amazon S3 bucket for clinical audio uploads + Transcribe Medical output
# Create bucket with default AES-256 encryption and Block Public Access enabled
AWS_S3_BUCKET_NAME=carenet-clinical-audio

# Google OAuth (optional — enables Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**IAM Policy (minimum required permissions):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/us.amazon.nova-premier-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::carenet-clinical-audio/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartMedicalTranscriptionJob",
        "transcribe:GetMedicalTranscriptionJob"
      ],
      "Resource": "*"
    }
  ]
}
```

### Running the Application

**Development Mode:**

```bash
# Terminal 1 — Start the backend (with hot reload)
cd backend
npm run dev

# Terminal 2 — Start the frontend (Vite dev server)
cd frontend
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to the backend at `http://localhost:5000`.

**Production Build:**

```bash
# Build backend
cd backend
npm run build        # Compiles TypeScript to dist/

# Build frontend
cd frontend
npm run build        # Outputs to dist/

# Start production server
cd backend
npm start            # Runs node dist/index.js
```

---

## Project Structure

```
carenet-ai/
├── backend/
│   ├── index.ts                    # Express app entry point
│   ├── package.json                # Backend dependencies & scripts
│   ├── tsconfig.json               # TypeScript configuration (ES2022, strict)
│   ├── config/
│   │   └── db.ts                   # MongoDB connection via Mongoose
│   ├── controllers/
│   │   ├── authController.ts       # Registration, login, profile management
│   │   ├── patientController.ts    # Patient CRUD, vitals, medications
│   │   ├── clinicalDocController.ts# Clinical notes, transcript processing, entity extraction
│   │   ├── translatorController.ts # Medical-to-patient translation, Q&A, medication guides
│   │   ├── predictiveController.ts # Risk assessment, scoring, alerts, recommendations
│   │   ├── researchController.ts   # Paper search, trends, evidence comparison
│   │   ├── workflowController.ts   # Appointments, insurance claims, lab results
│   │   └── dashboardController.ts  # Role-specific dashboard data aggregation
│   ├── middleware/
│   │   ├── auth.ts                 # JWT authentication & role-based authorization
│   │   └── auditLogger.ts         # Request audit logging (user, IP, action, module)
│   ├── models/
│   │   ├── User.ts                 # User accounts with bcrypt password hashing
│   │   ├── Patient.ts              # Comprehensive patient profiles (vitals, meds, history)
│   │   ├── Appointment.ts          # Scheduling with conflict detection & priority
│   │   ├── AuditLog.ts             # Audit trail entries
│   │   ├── ClinicalNote.ts         # Clinical documentation with AI entity extraction
│   │   ├── InsuranceClaim.ts       # Claims lifecycle with internal audit trail
│   │   ├── LabResult.ts            # Lab tests with reference ranges & review tracking
│   │   ├── ResearchPaper.ts        # Research papers with full-text search index
│   │   └── RiskAssessment.ts       # Multi-category risk scoring & predictions
│   └── routes/
│       ├── authRoutes.ts           # /api/auth/*
│       ├── patientRoutes.ts        # /api/patients/*
│       ├── clinicalDocRoutes.ts    # /api/clinical-docs/*
│       ├── translatorRoutes.ts     # /api/translator/*
│       ├── predictiveRoutes.ts     # /api/predictive/*
│       ├── researchRoutes.ts       # /api/research/*
│       ├── workflowRoutes.ts       # /api/workflow/*
│       └── dashboardRoutes.ts      # /api/dashboard/*
│
├── frontend/
│   ├── index.html                  # HTML entry with Inter font
│   ├── package.json                # Frontend dependencies & scripts
│   ├── vite.config.ts              # Vite + React Compiler + Tailwind + API proxy
│   ├── tsconfig.json               # TypeScript project references
│   ├── eslint.config.js            # ESLint configuration
│   └── src/
│       ├── main.tsx                # React entry (BrowserRouter + AuthProvider + Toaster)
│       ├── App.tsx                 # Route definitions with role-based guards
│       ├── index.css               # Global styles
│       ├── components/
│       │   ├── layout/
│       │   │   ├── DashboardLayout.tsx  # Responsive sidebar + top bar shell
│       │   │   └── ProtectedRoute.tsx   # Auth & role-based route guard
│       │   └── ui/
│       │       └── Cards.tsx           # StatCard, Card, Badge, EmptyState, LoadingSpinner
│       ├── contexts/
│       │   └── AuthContext.tsx     # Auth state management (JWT + localStorage)
│       ├── hooks/
│       │   └── useAuth.ts         # Auth context consumer hook
│       ├── lib/
│       │   └── api.ts             # Axios instance with token & 401 interceptors
│       ├── pages/
│       │   ├── auth/              # LoginPage, RegisterPage
│       │   ├── dashboard/         # DashboardPage, Doctor/Patient/Admin/Researcher dashboards
│       │   ├── patients/          # PatientsPage (list + detail view)
│       │   ├── clinical/          # ClinicalDocsPage (notes + transcript processing)
│       │   ├── translator/        # TranslatorPage (translate, Q&A, medication guide)
│       │   ├── predictive/        # PredictivePage (risk assessments + alerts)
│       │   ├── research/          # ResearchPage (paper search + trends)
│       │   └── workflow/          # WorkflowPage (appointments, claims, labs)
│       └── types/
│           └── index.ts           # Shared TypeScript interfaces
│
└── README.md
```

---

## API Reference

Base URL: `http://localhost:5000/api`

Health Check: `GET /api/health` → `{ status: "ok", service: "CARENET AI Backend", timestamp }`

### Authentication

| Method | Endpoint           | Auth | Description                      |
|--------|--------------------|------|----------------------------------|
| POST   | `/auth/register`   | No   | Register a new user account      |
| POST   | `/auth/login`      | No   | Authenticate and receive JWT     |
| GET    | `/auth/me`         | Yes  | Get current user profile         |
| PUT    | `/auth/profile`    | Yes  | Update current user profile      |

**Register Request Body:**
```json
{
  "name": "Dr. Jane Smith",
  "email": "jane@hospital.com",
  "password": "securepassword",
  "role": "doctor",
  "specialization": "Cardiology",
  "licenseNumber": "MD-12345"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "Dr. Jane Smith", "role": "doctor", ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Patients

| Method | Endpoint                    | Auth         | Description                     |
|--------|-----------------------------|--------------|---------------------------------|
| GET    | `/patients`                 | Doctor/Admin | List all patients (paginated, searchable) |
| GET    | `/patients/me/profile`      | Any          | Get own patient profile         |
| GET    | `/patients/:id`             | Doctor/Admin | Get patient by ID               |
| PUT    | `/patients/:id`             | Doctor/Admin | Update patient record           |
| POST   | `/patients/:id/vitals`      | Doctor/Admin | Add vital signs entry           |
| POST   | `/patients/:id/medications` | Doctor       | Add medication to patient       |

### Clinical Documentation

| Method | Endpoint                          | Auth         | Description                          |
|--------|-----------------------------------|--------------|--------------------------------------|
| POST   | `/clinical-docs`                  | Doctor       | Create a new clinical note           |
| GET    | `/clinical-docs`                  | Any          | List clinical notes (paginated)      |
| GET    | `/clinical-docs/:id`              | Any          | Get clinical note by ID              |
| POST   | `/clinical-docs/process-transcript`| Doctor      | Generate structured note from transcript |
| GET    | `/clinical-docs/patient/:patientId`| Any         | Get notes for specific patient       |
| PUT    | `/clinical-docs/:id/verify`       | Doctor       | Verify, reject, or amend a note      |

### Medical Translator

| Method | Endpoint                            | Auth | Description                             |
|--------|-------------------------------------|------|-----------------------------------------|
| POST   | `/translator/translate`             | Any  | Translate clinical report to patient-friendly language |
| POST   | `/translator/ask`                   | Any  | Ask a medical question                  |
| POST   | `/translator/medication-instructions`| Any | Get medication guide with instructions   |

### Predictive Analytics

| Method | Endpoint                                              | Auth         | Description                    |
|--------|-------------------------------------------------------|--------------|--------------------------------|
| POST   | `/predictive/assess/:patientId`                       | Doctor/Admin | Run risk assessment for patient|
| GET    | `/predictive/alerts`                                  | Doctor/Admin | Get all active alerts          |
| GET    | `/predictive/patient/:patientId`                      | Any          | Get patient assessments        |
| GET    | `/predictive/latest/:patientId`                       | Any          | Get latest assessment          |
| PUT    | `/predictive/:assessmentId/alerts/:alertIndex/acknowledge` | Doctor/Admin | Acknowledge an alert      |

### Research

| Method | Endpoint                  | Auth | Description                             |
|--------|---------------------------|------|-----------------------------------------|
| GET    | `/research/search`        | Any  | Search papers (query + category filter) |
| GET    | `/research/trends`        | Any  | Get trending research topics            |
| POST   | `/research/compare`       | Any  | Compare evidence across papers          |
| GET    | `/research/paper/:id`     | Any  | Get paper details                       |
| POST   | `/research/paper/:id/save`| Any  | Toggle save/bookmark on paper           |

### Workflow Management

| Method | Endpoint              | Auth         | Description                  |
|--------|-----------------------|--------------|------------------------------|
| POST   | `/workflow/appointments`| Any         | Create appointment           |
| GET    | `/workflow/appointments`| Any         | List appointments (role-scoped)|
| PUT    | `/workflow/appointments/:id`| Any     | Update appointment status    |
| POST   | `/workflow/claims`     | Doctor/Admin | Create insurance claim       |
| GET    | `/workflow/claims`     | Doctor/Admin | List claims                  |
| PUT    | `/workflow/claims/:id` | Doctor/Admin | Update claim status          |
| POST   | `/workflow/labs`       | Doctor/Admin | Create lab result            |
| GET    | `/workflow/labs`       | Doctor/Admin | List lab results             |
| PUT    | `/workflow/labs/:id`   | Doctor/Admin | Update lab result            |

### Dashboard

| Method | Endpoint               | Auth       | Description                 |
|--------|------------------------|------------|-----------------------------|
| GET    | `/dashboard/doctor`    | Doctor     | Doctor dashboard data       |
| GET    | `/dashboard/patient`   | Patient    | Patient dashboard data      |
| GET    | `/dashboard/admin`     | Admin      | Admin dashboard data        |
| GET    | `/dashboard/researcher`| Researcher | Researcher dashboard data   |

---

## User Roles & Permissions

CARENET AI implements a comprehensive **Role-Based Access Control (RBAC)** system with four user roles:

| Role         | Dashboard         | Patients | Clinical Docs | Translator | Predictive | Research | Workflow |
|--------------|-------------------|----------|---------------|------------|------------|----------|----------|
| **Doctor**   | Doctor Dashboard  | ✅ Full  | ✅ Full       | ✅         | ✅ Full    | ✅       | ✅ Full  |
| **Patient**  | Patient Dashboard | ❌       | ❌            | ✅         | ❌         | ❌       | ❌       |
| **Researcher** | Researcher Dashboard | ❌  | ❌            | ✅         | ❌         | ✅       | ❌       |
| **Admin**    | Admin Dashboard   | ✅ Full  | ✅ Full       | ✅         | ✅ Full    | ❌       | ✅ Full  |

- Authorization is enforced at **both** the backend (middleware) and frontend (route guards + dynamic navigation).
- Patients registering are automatically assigned a medical profile.

---

## Data Models

The application uses **9 Mongoose models** to structure healthcare data:

| Model              | Description                                                                                  |
|--------------------|----------------------------------------------------------------------------------------------|
| **User**           | User accounts with roles, bcrypt-hashed passwords (salt factor 12), and active status        |
| **Patient**        | Comprehensive medical profiles — vitals, medications, allergies, chronic conditions, emergency contact, insurance, risk factors |
| **Appointment**    | Scheduling with type (consultation/follow-up/emergency/checkup/procedure), priority levels, and compound indexes |
| **ClinicalNote**   | Clinical documentation with AI-extracted entities, verification workflow, and prescription support |
| **RiskAssessment** | Multi-category risk scoring (0-100), predictions with probabilities, and acknowledgeable alerts |
| **InsuranceClaim** | Claims lifecycle management with internal audit trail tracking every status transition        |
| **LabResult**      | Lab tests with per-parameter results, reference ranges, and normal/abnormal/critical status   |
| **ResearchPaper**  | Research papers with text indexes for full-text search and user bookmarks                     |
| **AuditLog**       | System-wide audit trail — user actions, modules, IP addresses, and user agents                |

---

## Frontend Pages

| Page                | Route              | Description                                                              |
|---------------------|--------------------|--------------------------------------------------------------------------|
| **Login**           | `/login`           | Split-screen with branding panel showcasing 4 core AI capabilities       |
| **Register**        | `/register`        | Multi-role registration with dynamic fields per role                     |
| **Dashboard**       | `/dashboard`       | Auto-switches to role-specific dashboard (Doctor/Patient/Admin/Researcher)|
| **Patients**        | `/patients`        | Patient list with search, stats overview, and detailed profile view      |
| **Clinical Docs**   | `/clinical-docs`   | Note management with dual-mode creation (structured form / transcript)   |
| **Translator**      | `/translator`      | Three-tab interface: Report Translation, Q&A, Medication Guide           |
| **Predictive**      | `/predictive`      | Risk assessments with visual progress bars, predictions, and alert panel |
| **Research**        | `/research`        | Paper search with category filters, trending topics, and bookmarks       |
| **Workflow**        | `/workflow`        | Three-tab management: Appointments, Insurance Claims, Lab Results        |

---

## Security

- **Password Hashing** — bcrypt with a salt factor of 12
- **JWT Authentication** — 30-day token expiration with Bearer token scheme
- **Role-Based Authorization** — Dual enforcement at middleware and UI levels
- **CORS Configuration** — Restricted to configured `CLIENT_URL` origin with credentials support
- **Audit Logging** — All authenticated actions logged with user ID, IP address, user-agent, module, and action
- **Password Protection** — Password field excluded from queries by default (`select: false`)
- **Active Status Check** — Disabled accounts are rejected at the authentication middleware level
- **Input Validation** — Request body size limited to 10MB; structured validation on user inputs
- **Error Handling** — Global error handler with stack traces only in development mode
- **Auto-Logout** — Frontend automatically clears credentials and redirects on 401 responses

---

## Scripts Reference

### Backend (`backend/`)

| Script         | Command              | Description                              |
|----------------|----------------------|------------------------------------------|
| `npm run dev`  | `tsx watch index.ts` | Start dev server with hot reload         |
| `npm run build`| `tsc`                | Compile TypeScript to `dist/`            |
| `npm start`    | `node dist/index.js` | Run production build                     |

### Frontend (`frontend/`)

| Script           | Command               | Description                             |
|------------------|------------------------|-----------------------------------------|
| `npm run dev`    | `vite`                 | Start Vite dev server (port 5173)       |
| `npm run build`  | `tsc -b && vite build` | Type-check and build for production     |
| `npm run lint`   | `eslint .`             | Run ESLint across the codebase          |
| `npm run preview`| `vite preview`         | Preview production build locally        |

---

---

## AWS Infrastructure Deployment

The recommended production deployment targets **Amazon ECS on Fargate** (serverless containers) fronted by **Amazon API Gateway**, with MongoDB Atlas or **Amazon DocumentDB** as the data store.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CARENET AI — AWS Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Users / Doctors                                                           │
│        │                                                                    │
│        ▼                                                                    │
│  ┌───────────────────┐                                                     │
│  │ AWS Amplify / S3   │  ← Static frontend (React + Vite build)            │
│  └──────────┬────────┘                                                     │
│             │                                                               │
│             ▼                                                               │
│  ┌───────────────────┐                                                     │
│  │ Amazon API Gateway │  ← Rate limiting, auth, CORS, request routing       │
│  └──────────┬────────┘                                                     │
│             │                                                               │
│             ▼                                                               │
│  ┌───────────────────┐                                                     │
│  │ Amazon ECS Fargate │  ← Express backend (containerised, auto-scaling)   │
│  └───┬─────────┬──────┘                                                     │
│       │         │                                                          │
│       ▼         ▼                                                          │
│  ┌─────────┐ ┌─────────────────────────────────────────────┐          │
│  │ MongoDB  │ │          AWS Managed Services                    │          │
│  │ (Atlas)  │ │  ═════════════════════════════════════════  │          │
│  └─────────┘ │  ║ Amazon Bedrock (Nova Premier)            ║  │          │
│            │  ║   5 ReAct agents (clinical, translator,      ║  │          │
│            │  ║   predictive, research, workflow)            ║  │          │
│            │  ═════════════════════════════════════════  │          │
│            │  ═════════════════════════════════════════  │          │
│            │  ║ Amazon Transcribe Medical                ║  │          │
│            │  ║   PRIMARYCARE / CONVERSATION specialty      ║  │          │
│            │  ═════════════════════════════════════════  │          │
│            │  ═════════════════════════════════════════  │          │
│            │  ║ Amazon S3                                 ║  │          │
│            │  ║   Audio uploads + transcript output         ║  │          │
│            │  ═════════════════════════════════════════  │          │
│            └─────────────────────────────────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quick Deploy to AWS ECS

```bash
# 1. Build and push backend container to Amazon ECR
aws ecr create-repository --repository-name carenet-backend
docker build -t carenet-backend ./backend
docker tag carenet-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/carenet-backend:latest
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/carenet-backend:latest

# 2. Create ECS cluster and service
aws ecs create-cluster --cluster-name carenet-cluster
# (Create task definition referencing the ECR image with env vars from Secrets Manager)
# (Create Fargate service attached to an ALB)

# 3. Deploy frontend to AWS Amplify
aws amplify create-app --name carenet-frontend
# (Connect to Git repo — Amplify auto-builds and deploys on push)

# 4. Create S3 bucket for clinical audio
aws s3api create-bucket --bucket carenet-clinical-audio --region us-east-1
aws s3api put-bucket-encryption --bucket carenet-clinical-audio --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-public-access-block --bucket carenet-clinical-audio --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'
```

### AWS Service Summary

| AWS Service | Role in CARENET | SDK Package |
|-------------|-----------------|-------------|
| **Amazon Bedrock** | 5 ReAct AI agents — clinical docs, translation, risk scoring, research synthesis, workflow | `@aws-sdk/client-bedrock-runtime` |
| **Amazon Transcribe Medical** | Clinical-vocabulary speech-to-text for doctor consultation recordings | `@aws-sdk/client-transcribe` |
| **Amazon S3** | Encrypted storage of audio uploads and transcript output | `@aws-sdk/client-s3` |
| **Amazon ECS (Fargate)** | Serverless container hosting for the Express backend | — |
| **Amazon ECR** | Container registry for backend Docker image | — |
| **AWS Amplify** | CI/CD + hosting for the React frontend | — |
| **Amazon API Gateway** | API routing, rate limiting, and auth at the edge | — |

---

## Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** to the branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

Please follow the existing code style and ensure all TypeScript types are properly defined.

---

## License

This project is licensed under the **ISC License**.

---

<p align="center">
  Built with ❤️ for better healthcare
</p>
# CARENET AI — Healthcare Assistant Platform

> **AI-for-Bharath** | Full-Stack AI-Powered Healthcare Management System

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database & Models](#database--models)
5. [Backend API Routes](#backend-api-routes)
6. [Frontend Pages & Routing](#frontend-pages--routing)
7. [Authentication & Security](#authentication--security)
8. [AI & Analytical Features](#ai--analytical-features)
9. [Running the Project](#running-the-project)

---

## Project Overview

CARENET AI is a full-stack healthcare management platform designed for Indian healthcare (`AI-for-Bharath`). It serves **four distinct user roles** — Doctors, Patients, Researchers, and Admins — with a unified dashboard tailored to each role.

**Core capabilities:**
- Clinical documentation with transcript processing
- AI-powered predictive health risk scoring
- Medical term translator (plain-language for patients)
- Research paper search & evidence comparison
- Hospital workflow — appointments, lab results, insurance claims
- Role-based access control throughout

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | ~5.9 | Type safety |
| Vite | 7 | Build tool & dev server |
| Tailwind CSS | v4 | Styling |
| React Router | v7 | Client-side routing |
| Axios | ^1.13 | HTTP client |
| Recharts | ^3.7 | Data visualization / charts |
| Headless UI | ^2.2 | Accessible UI components |
| Lucide React | ^0.575 | Icon library |
| React Hot Toast | ^2.6 | Notifications |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | Express 5 | REST API server |
| TypeScript | ^5.9 | Type safety |
| tsx | ^4.21 | Dev runtime (ts-node alternative) |
| MongoDB + Mongoose | Mongoose 9 | Database & ODM |
| jsonwebtoken | ^9.0 | JWT authentication |
| bcryptjs | ^3.0 | Password hashing (salt: 12) |
| dotenv | ^17.3 | Environment variables |
| cors | ^2.8 | Cross-origin requests |

---

## Project Structure

```
AI-for-Bharath/
├── backend/
│   ├── index.ts                  # App entry point — Express setup, middleware, routes
│   ├── package.json
│   ├── tsconfig.json
│   ├── config/
│   │   └── db.ts                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.ts     # Register, login, profile
│   │   ├── patientController.ts  # Patient CRUD, vitals, medications
│   │   ├── clinicalDocController.ts  # Clinical notes, transcripts
│   │   ├── translatorController.ts   # Medical term translation
│   │   ├── predictiveController.ts   # AI risk scoring & alerts
│   │   ├── researchController.ts     # Paper search & evidence
│   │   ├── workflowController.ts     # Appointments, labs, claims
│   │   └── dashboardController.ts    # Role-specific dashboard data
│   ├── middleware/
│   │   ├── auth.ts               # JWT protect + role authorize
│   │   └── auditLogger.ts        # Audit trail logging
│   ├── models/
│   │   ├── User.ts
│   │   ├── Patient.ts
│   │   ├── ClinicalNote.ts
│   │   ├── RiskAssessment.ts
│   │   ├── Appointment.ts
│   │   ├── InsuranceClaim.ts
│   │   ├── LabResult.ts
│   │   ├── ResearchPaper.ts
│   │   └── AuditLog.ts
│   └── routes/
│       ├── authRoutes.ts
│       ├── patientRoutes.ts
│       ├── clinicalDocRoutes.ts
│       ├── translatorRoutes.ts
│       ├── predictiveRoutes.ts
│       ├── researchRoutes.ts
│       ├── workflowRoutes.ts
│       └── dashboardRoutes.ts
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── src/
        ├── App.tsx               # Root routing — public vs protected
        ├── main.tsx              # App entry, providers
        ├── index.css             # Global styles
        ├── assets/
        ├── components/
        │   ├── layout/
        │   │   ├── DashboardLayout.tsx   # Sidebar + topbar shell
        │   │   └── ProtectedRoute.tsx    # Auth + role guard
        │   └── ui/
        │       └── Cards.tsx
        ├── contexts/
        │   └── AuthContext.tsx    # Global auth state, login/logout
        ├── hooks/
        │   └── useAuth.ts         # useContext hook for AuthContext
        ├── lib/
        │   └── api.ts             # Axios instance + interceptors
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.tsx
        │   │   └── RegisterPage.tsx
        │   ├── dashboard/
        │   │   ├── DashboardPage.tsx      # Role-switch router
        │   │   ├── DoctorDashboard.tsx
        │   │   ├── PatientDashboard.tsx
        │   │   ├── AdminDashboard.tsx
        │   │   └── ResearcherDashboard.tsx
        │   ├── clinical/
        │   │   └── ClinicalDocsPage.tsx
        │   ├── patients/
        │   │   └── PatientsPage.tsx
        │   ├── translator/
        │   │   └── TranslatorPage.tsx
        │   ├── predictive/
        │   │   └── PredictivePage.tsx
        │   ├── research/
        │   │   └── ResearchPage.tsx
        │   └── workflow/
        │       └── WorkflowPage.tsx
        └── types/
            └── index.ts           # Shared TypeScript interfaces
```

---

## Database & Models

### `User`
Core authentication document. All roles share this model.

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Unique, lowercase |
| `password` | String | Bcrypt hashed, hidden by default |
| `role` | Enum | `doctor` / `patient` / `researcher` / `admin` |
| `specialization` | String | Doctors only |
| `licenseNumber` | String | Doctors only |
| `phone` | String | Optional |
| `isActive` | Boolean | Soft-disable accounts |

---

### `Patient`
Extended health profile linked 1:1 to a `User` with role `patient`.

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → User | Unique link |
| `dateOfBirth` | Date | |
| `gender` | Enum | male / female / other |
| `bloodGroup` | String | |
| `allergies` | String[] | |
| `chronicConditions` | String[] | Used by risk scoring |
| `insurance` | Object | Provider, policy number, expiry |
| `medicalHistory` | Array | Condition, date, status, notes |
| `medications` | Array | Name, dosage, frequency, prescriber |
| `vitalSigns` | Array | BP, HR, temp, weight, height, O₂ sat — time-series |
| `riskFactors` | Array | Factor, severity, identified date |
| `emergencyContact` | Object | Name, phone, relation |

---

### `ClinicalNote`
Full SOAP-style clinical documentation.

| Field | Type | Notes |
|---|---|---|
| `patientId` | ObjectId → Patient | |
| `providerId` | ObjectId → User | Attending doctor |
| `noteType` | Enum | consultation / follow-up / emergency / procedure / discharge |
| `chiefComplaint` | String | |
| `historyOfPresentIllness` | String | |
| `physicalExam` | Object | General, vitals, findings[] |
| `assessment` | Array | Diagnosis, ICD code, severity |
| `plan` | Array | Treatment, medications, follow-up, referrals |
| `extractedEntities` | Array | symptom/diagnosis/medication/procedure flags + confidence |
| `transcript` | String | Raw voice input |
| `prescriptions` | Array | Medication, dosage, frequency, duration |
| `verificationStatus` | Enum | pending / verified / rejected / amended |

---

### `RiskAssessment`
AI-generated health risk output per patient.

| Field | Type | Notes |
|---|---|---|
| `patientId` | ObjectId → Patient | |
| `riskScores` | Array | Per category: score (0–100), level, contributing factors |
| `overallRisk` | Enum | low / moderate / high / critical |
| `confidenceLevel` | Number | 0.0 – 1.0 |
| `predictions` | Array | Condition, probability, timeframe, preventable flag |
| `recommendations` | Array | Type, description, priority, evidence basis |
| `alerts` | Array | Warning/critical + acknowledgement tracking |
| `followUpRequired` | Boolean | |

---

### `Appointment`

| Field | Type | Notes |
|---|---|---|
| `patientId` | ObjectId → Patient | |
| `doctorId` | ObjectId → User | |
| `scheduledDate` | Date | |
| `duration` | Number | Minutes, default 30 |
| `type` | Enum | consultation / follow-up / emergency / checkup / procedure |
| `status` | Enum | scheduled / confirmed / in-progress / completed / cancelled / no-show |
| `priority` | Enum | low / normal / high / urgent |

---

### `InsuranceClaim`

| Field | Type | Notes |
|---|---|---|
| `claimNumber` | String | Unique |
| `diagnosisCodes` | Array | ICD code + description |
| `procedureCodes` | Array | CPT code + description |
| `totalAmount` | Number | |
| `status` | Enum | draft → submitted → processing → approved/denied/appealed |
| `auditTrail` | Array | Every status change logged with actor + timestamp |

---

### `LabResult`

| Field | Type | Notes |
|---|---|---|
| `testName` | String | |
| `results` | Array | Parameter, value, unit, reference range, normal/abnormal/critical |
| `status` | Enum | ordered → collected → processing → completed → reviewed |

---

### `ResearchPaper`

| Field | Type | Notes |
|---|---|---|
| `externalId` | String | PubMed ID |
| `title` / `abstract` | String | Full-text indexed for search |
| `keyFindings` | String[] | |
| `citations` | Number | |
| `savedBy` | ObjectId[] → User | Bookmarked by users |

---

## Backend API Routes

> All routes prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register user (auto-creates Patient profile if role=patient) |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/me` | Protected | Get current user + patient profile |
| PUT | `/profile` | Protected | Update user profile |

---

### Patients — `/api/patients`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/me/profile` | patient | Own patient profile |
| GET | `/` | doctor, admin | List all patients |
| GET | `/:id` | All | Get patient by ID |
| PUT | `/:id` | All | Update patient data |
| POST | `/:id/vitals` | doctor, admin | Add vital signs entry |
| POST | `/:id/medications` | doctor | Add medication to patient |

---

### Clinical Docs — `/api/clinical-docs`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/` | doctor | Create clinical note |
| GET | `/` | All | List clinical notes |
| POST | `/process-transcript` | doctor | Convert voice transcript to structured note |
| GET | `/patient/:patientId` | All | Notes for specific patient |
| GET | `/:id` | All | Get specific note |
| PUT | `/:id/verify` | doctor | Verify / reject / amend note |

---

### Translator — `/api/translator`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/translate` | Translate clinical note or raw text to plain patient language |
| POST | `/ask` | Patient Q&A (health questions answered in plain language) |
| POST | `/medication-instructions` | Plain-language medication instructions |

---

### Predictive Analytics — `/api/predictive`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/assess/:patientId` | doctor, admin | Run AI risk assessment |
| GET | `/alerts` | doctor, admin | All active unacknowledged alerts |
| GET | `/patient/:patientId` | All | All assessments for a patient |
| GET | `/latest/:patientId` | All | Most recent assessment |
| PUT | `/:assessmentId/alerts/:alertIndex/acknowledge` | doctor, admin | Acknowledge an alert |

---

### Research — `/api/research`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/search` | Search research papers (full-text) |
| GET | `/trends` | Medical research trends |
| POST | `/compare` | Compare evidence across papers |
| GET | `/paper/:id` | Get a specific paper |
| POST | `/paper/:id/save` | Save paper to user's collection |

---

### Workflow — `/api/workflow`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/appointments` | All | Create appointment |
| GET | `/appointments` | All | List appointments (scoped by role) |
| PUT | `/appointments/:id` | All | Update appointment |
| POST | `/claims` | doctor, admin | Create insurance claim |
| GET | `/claims` | doctor, admin | List claims |
| PUT | `/claims/:id` | doctor, admin | Update claim status |
| POST | `/labs` | doctor, admin | Create lab result |
| GET | `/labs` | All | View lab results |
| PUT | `/labs/:id` | doctor, admin | Update lab result |

---

### Dashboard — `/api/dashboard`

| Method | Endpoint | Role |
|---|---|---|
| GET | `/doctor` | doctor |
| GET | `/patient` | patient |
| GET | `/admin` | admin |
| GET | `/researcher` | researcher |

---

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server status + timestamp |

---

## Frontend Pages & Routing

### Public Routes
| Path | Page | Notes |
|---|---|---|
| `/login` | LoginPage | Redirects to `/dashboard` if already logged in |
| `/register` | RegisterPage | Redirects to `/dashboard` if already logged in |

### Protected Routes (inside `DashboardLayout`)
| Path | Page | Allowed Roles |
|---|---|---|
| `/dashboard` | Role-aware dashboard (4 variants) | All |
| `/patients` | Patient list & management | doctor, admin |
| `/clinical-docs` | Clinical documentation | doctor, admin |
| `/translator` | Medical translator | All |
| `/predictive` | Risk assessments & alerts | doctor, admin |
| `/research` | Research papers & trends | doctor, researcher, admin |
| `/workflow` | Appointments, labs, claims | doctor, admin |

### Dashboard Variants (auto-selected by role)
- **DoctorDashboard** — patient overview, upcoming appointments, recent notes, active alerts
- **PatientDashboard** — own vitals, medications, appointments, risk score
- **AdminDashboard** — system stats, all users, platform metrics
- **ResearcherDashboard** — trending research, saved papers, evidence tools

---

## Authentication & Security

- **JWT** issued on login/register — 30-day expiry
- Stored in `localStorage` as `carenet_token` + `carenet_user`
- **Axios interceptor** auto-attaches `Authorization: Bearer <token>` on every request
- On `401` response → clears storage + redirects to `/login`
- Backend `protect` middleware — verifies JWT + checks `user.isActive`
- Backend `authorize(...roles)` middleware — enforces role-based access per route
- Passwords hashed with **bcrypt** (12 salt rounds)
- CORS configured for `http://localhost:5173` (Vite dev server)

---

## AI & Analytical Features

### 1. Predictive Risk Scoring (Rule-Based)
Analyzes patient's `chronicConditions`, `vitalSigns`, and `medications` to compute scores across three categories:

| Category | Risk Factors Evaluated |
|---|---|
| Cardiovascular | Hypertension, diabetes, hyperlipidemia, high BP vitals, abnormal heart rate |
| Metabolic | Diabetes, obesity, BMI calculation from height/weight vitals |
| Respiratory | Asthma, COPD, pneumonia, low oxygen saturation |

Generates recommendations citing real clinical guidelines (AHA 2024, ADA Standards, ACC/AHA).

### 2. Medical Translator (Dictionary-Based)
Translates 30+ medical terms and Latin abbreviations into plain patient-friendly English:
- Conditions: hypertension, hyperlipidemia, tachycardia, arrhythmia, etc.
- Medications: metformin, atorvastatin, lisinopril, amoxicillin, etc.
- Abbreviations: `q.d.`, `b.i.d.`, `p.r.n.`, `stat`, `p.o.`, etc.

### 3. Clinical Note Processing
Converts raw voice transcripts into structured SOAP-format clinical notes with entity extraction (symptoms, diagnoses, medications, procedures) and confidence scoring.

### 4. Evidence Comparison
Compares clinical evidence across multiple research papers for a given condition or treatment.

---

## Running the Project

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Environment Variables
Create a `.env` file in `backend/`:

```env
MONGO_URI=mongodb://localhost:27017/carenet
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Run in Development

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

### Build for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

---

## User Roles Summary

| Role | Key Permissions |
|---|---|
| **doctor** | Full access — patients, clinical notes, predictive, workflow, research |
| **patient** | Own profile, own vitals, appointments, translator, own lab results |
| **researcher** | Research module, dashboard; read-only clinical data |
| **admin** | All access — system management, all users, all data |
