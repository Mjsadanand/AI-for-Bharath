<p align="center">
  <img src="https://img.shields.io/badge/CARENET-AI-0ea5e9?style=for-the-badge&logo=heart&logoColor=white" alt="CARENET AI" />
</p>

<h1 align="center">CARENET AI — Intelligent Healthcare Assistant Platform</h1>

<p align="center">
  A comprehensive, AI-powered healthcare management system with AWS Bedrock-powered agents for clinical documentation, risk prediction, medical translation, research synthesis, and workflow automation. Features a 5-agent pipeline that processes patient data through advanced AI models.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/AWS-Bedrock-FF9900?logo=amazon&logoColor=white" alt="AWS Bedrock" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white" alt="Capacitor" />
  <img src="https://img.shields.io/badge/License-ISC-green" alt="License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [🤖 AI-Powered Agent Pipeline](#-ai-powered-agent-pipeline-052run)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [📁 Project Structure](#-project-structure)
- [🌐 API Reference](#-api-reference)
- [🗃️ Database Models & Relationships](#️-database-models--relationships)
- [📱 Frontend Pages & Mobile Support](#-frontend-pages--mobile-support)
- [👥 User Roles & Permissions](#-user-roles--permissions-rbac)
- [🔒 Security & Compliance](#-security--compliance-features)
- [🚀 Deployment & Production](#-deployment--production)
- [🚀 Scripts & Development](#-scripts--development-commands)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## Overview

**CARENET AI** is an intelligent healthcare assistant platform powered by a sophisticated **5-agent AI pipeline** using AWS Bedrock Nova models. The system streamlines clinical workflows, enhances patient care, and supports medical research through advanced automation and AI-driven insights.

Serving four distinct user roles — **Doctors**, **Patients**, **Researchers**, and **Administrators** — each with tailored dashboards and feature sets, the platform integrates cutting-edge AI capabilities including:

- **AWS Bedrock Nova AI Models** with multi-model fallback (Premier → Pro → Lite)
- **Voice Transcription** via Groq Whisper API with live recording support
- **5-Agent Sequential Pipeline** processing patient data through clinical → translation → prediction → research → workflow automation
- **Smart Caching** with SHA-256 keys to prevent duplicate processing costs
- **Mobile Support** via Capacitor with native iOS/Android capabilities
- **Real-time Pipeline Monitoring** with Server-Sent Events (SSE)

---

## Key Features

## 🤖 AI-Powered Agent Pipeline ($0.52/run)

The core innovation of CARENET AI is its **5-agent sequential pipeline** powered by AWS Bedrock Nova models:

| Agent | Purpose | Cost | Key Features |
|-------|---------|------|-------------|
| **Clinical Documentation** | Transcript → structured SOAP notes | $0.047 | Entity extraction, confidence scoring, verification workflow |
| **Medical Translator** | Clinical → patient-friendly language | $0.053 | 30+ term dictionary, Q&A engine, medication guides |
| **Predictive Analytics** | Risk scoring & health predictions | $0.081 | Multi-category assessment, evidence-based recommendations |
| **Research Synthesis** | Literature search & evidence analysis | $0.151 | Full-text search, trend analysis, contradiction detection |
| **Workflow Automation** | Auto-create tasks & appointments | $0.186 | Insurance claims, lab orders, scheduling automation |
| **Full Pipeline** | All 5 agents in sequence | **$0.52** | Parallel execution phases, ~3min runtime |

### 🎤 Voice & Transcription
- **Live Recording** + pre-recorded file upload support
- **Groq Whisper API** integration (240 min/day free tier)
- **Real-time Processing** with progress tracking via SSE

### 🧠 Multi-Model AI Reliability
- **Primary**: `us.amazon.nova-premier-v1:0` (highest quality)
- **Fallback 1**: `us.amazon.nova-pro-v1:0` (higher throughput)
- **Fallback 2**: `us.amazon.nova-lite-v1:0` (budget-friendly at $0.30/pipeline)

### 📱 Cross-Platform Mobile Support
**Capacitor 8** with native capabilities:
- Camera, Geolocation, Push Notifications
- Haptic Feedback, Network Detection, Clipboard
- File System Access, Device Info
- Native iOS/Android deployment ready

### 🔄 Smart Caching & Cost Optimization
- **SHA-256 Cache Keys** (patientId + transcript)
- **1-hour TTL** prevents duplicate $0.52 charges during demos
- **50% cost reduction** in demo/testing scenarios
- **Automatic eviction** after 24 hours

### 🏥 Clinical Workflow Features
- **SOAP Note Generation** with entity extraction & confidence scoring
- **Multi-Category Risk Assessment** (Cardiovascular, Metabolic, Respiratory)
- **Evidence-Based Recommendations** citing AHA/ADA/WHO guidelines
- **Critical Alert System** with acknowledgment tracking
- **Appointment Scheduling** with conflict detection
- **Insurance Claim Lifecycle** management with audit trails
- **Lab Result Tracking** with abnormal value flagging

### 📊 Role-Based Dashboards
- **Doctor** — Patient overview, schedules, pending notes, active alerts, quick actions
- **Patient** — Health scores, vitals tracking, appointments, risk visualization
- **Admin** — System-wide metrics, user management, platform analytics
- **Researcher** — Paper trends, evidence synthesis, bookmark collections

---

## Tech Stack

### Backend Infrastructure
| Technology | Version | Purpose |
|------------|---------|----------|
| **Node.js + Express** | Express 5.2.1 | REST API server with advanced middleware |
| **TypeScript** | 5.9 (ES2022) | Type safety with strict configuration |
| **MongoDB + Mongoose** | 9.2.2 | NoSQL database with ODM and schema validation |
| **AWS Bedrock** | Nova Premier/Pro/Lite | AI model inference with multi-model fallback |
| **JWT + bcryptjs** | - | Authentication with 12-round salt hashing |
| **Groq Whisper** | - | Voice transcription API (240 min/day free) |
| **Google OAuth 2.0** | - | Social authentication with profile completion |
| **Security Stack** | Helmet, Rate Limiting, NoSQL Sanitization | Production-ready security hardening |

### Frontend & Mobile
| Technology | Version | Purpose |
|------------|---------|----------|
| **React** | 19 | UI framework with latest features |
| **Vite** | 7.3.1 | Build tool with HMR and optimizations |
| **Tailwind CSS** | 4 | Utility-first styling with custom plugin |
| **React Router** | 7 | Client-side routing with data loading |
| **Capacitor** | 8 | Native iOS/Android deployment |
| **Framer Motion** | 12.34.3 | Advanced animations and transitions |
| **Recharts** | 3.7.0 | Data visualization and analytics charts |
| **Headless UI** | 2.0 | Accessible, unstyled UI components |
| **Axios** | 1.13.5 | HTTP client with interceptors |

### Development & DevOps
| Tool | Purpose |
|------|----------|
| **tsx** | TypeScript execution in development |
| **Docker** | Multi-stage containerization |
| **ESLint** | Code quality and consistency |
| **Zod** | Runtime type validation |
| **Multer** | File upload handling |
| **CORS** | Cross-origin request management |

---

## Architecture

```mermaid
graph TB
    subgraph "Frontend (React 19 + Capacitor)"
        UI["🎨 UI Layer
        • React Router 7
        • Tailwind CSS 4
        • Framer Motion"]
        Auth["🔐 Auth Context
        • JWT + localStorage
        • Google OAuth"]
        Mobile["📱 Mobile Layer
        • Capacitor 8
        • iOS/Android"]
    end
    
    subgraph "Backend (Express 5 + TypeScript)"
        API["🌐 API Gateway
        • 11 Route Groups
        • Rate Limiting
        • CORS Security"]
        Pipeline["🤖 AI Pipeline
        • 5 Bedrock Agents
        • SHA-256 Caching
        • SSE Streaming"]
        Auth2["🛡️ Auth Middleware
        • JWT Verification
        • Role Authorization"]
    end
    
    subgraph "AI Services"
        Bedrock["☁️ AWS Bedrock
        • Nova Premier/Pro/Lite
        • Multi-model Fallback
        • $0.52/pipeline"]
        Groq["🎤 Groq Whisper
        • Voice Transcription
        • 240 min/day free"]
    end
    
    subgraph "Data Layer"
        MongoDB["🗃️ MongoDB
        • 9 Models
        • Mongoose ODM
        • Audit Logging"]
        Cache["⚡ Memory Cache
        • Pipeline Results
        • 1hr TTL
        • Cost Optimization"]
    end
    
    UI --> Auth
    UI --> API
    Auth --> Auth2
    API --> Pipeline
    API --> MongoDB
    Pipeline --> Bedrock
    Pipeline --> Groq
    Pipeline --> Cache
    Mobile --> API
    
    classDef ai fill:#ff6b6b,stroke:#fff,color:#fff
    classDef data fill:#4ecdc4,stroke:#fff,color:#fff
    classDef compute fill:#45b7d1,stroke:#fff,color:#fff
    
    class Bedrock,Groq,Pipeline ai
    class MongoDB,Cache data
    class API,Auth2,UI,Auth,Mobile compute
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x (required for latest dependencies)
- **npm** ≥ 9.x (or yarn/pnpm)
- **MongoDB** ≥ 6.x (local instance or MongoDB Atlas)
- **AWS Account** (for Bedrock AI pipeline)
- **Groq Account** (optional - for voice transcription)

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

# Create environment file
cd ../backend
cp .env.example .env  # Then edit with your credentials
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Core Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/carenet
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/carenet

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-chars-long

# AWS Bedrock (Required for AI Pipeline)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Google OAuth (Optional - for social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Voice Transcription (Optional - for voice features)
GROQ_API_KEY=your-groq-api-key
```

⚠️ **Production Notes:**
- `JWT_SECRET` must be at least 32 characters for security
- AWS credentials are required for the AI pipeline to function
- Without Groq API key, voice transcription features will be disabled
- Google OAuth enables "Sign in with Google" functionality

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

**Mobile Development (Optional):**

```bash
# Build web app first
cd frontend
npm run build

# iOS Development
npx cap add ios
npx cap open ios

# Android Development  
npx cap add android
npx cap open android
```

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

**Docker Deployment:**

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or manual Docker build
cd backend
docker build -t carenet-backend .
docker run -p 5000:5000 --env-file .env carenet-backend
```

### Health Check

Verify the backend is running:
```bash
curl http://localhost:5000/api/health
# Response: {"status":"ok","service":"CARENET AI Backend","timestamp":"..."}
```

---

## 📁 Project Structure

```
carenet-ai/
├── backend/                        # Express.js Backend
│   ├── index.ts                    # App entry + middleware setup
│   ├── package.json                # Dependencies & scripts
│   ├── tsconfig.json               # TypeScript config (ES2022, strict)
│   ├── Dockerfile                  # Multi-stage container build
│   ├── agents/                     # 🤖 AI Agent Implementations
│   │   ├── core/
│   │   │   ├── BedrockAgent.ts         # AWS Bedrock base class
│   │   │   ├── Orchestrator.ts         # Pipeline coordinator
│   │   │   └── types.ts                # Agent interfaces
│   │   ├── clinical/ClinicalDocAgent.ts    # SOAP note generation
│   │   ├── translator/TranslatorAgent.ts   # Medical translation
│   │   ├── predictive/PredictiveAgent.ts   # Risk assessment 
│   │   ├── research/ResearchAgent.ts       # Literature synthesis
│   │   ├── workflow/WorkflowAgent.ts       # Task automation
│   │   └── patient/PatientReportAgent.ts   # Patient summaries
│   ├── config/
│   │   ├── db.ts                   # MongoDB connection
│   │   └── validateEnv.ts          # Environment validation  
│   ├── controllers/                # 🎮 Route Handlers (12 files)
│   │   ├── authController.ts       # Registration, login, profile
│   │   ├── agentController.ts      # Agent telemetry & health
│   │   ├── pipelineController.ts   # Full agent pipeline
│   │   ├── patientController.ts    # Patient CRUD, vitals, meds
│   │   ├── clinicalDocController.ts # Clinical notes + transcripts
│   │   ├── translatorController.ts  # Medical translation API
│   │   ├── predictiveController.ts  # Risk scoring + alerts
│   │   ├── researchController.ts    # Paper search + trends
│   │   ├── workflowController.ts    # Appointments, claims, labs
│   │   ├── dashboardController.ts   # Role-specific dashboards
│   │   ├── googleAuthController.ts  # OAuth endpoints
│   │   └── transcriptionController.ts # Voice processing
│   ├── middleware/
│   │   ├── auth.ts                 # JWT + role authorization
│   │   ├── auditLogger.ts         # Request audit trails
│   │   ├── errorHandler.ts        # Global error handling
│   │   ├── security.ts            # Security headers
│   │   └── validation.ts          # Input validation
│   ├── models/                     # 🗃️ Database Models (9 models)
│   │   ├── User.ts                 # Auth + user profiles
│   │   ├── Patient.ts              # Medical profiles + vitals
│   │   ├── ClinicalNote.ts         # SOAP notes + entities
│   │   ├── RiskAssessment.ts       # AI risk predictions
│   │   ├── Appointment.ts          # Scheduling + conflicts
│   │   ├── InsuranceClaim.ts       # Claims lifecycle
│   │   ├── LabResult.ts            # Lab tests + results
│   │   ├── ResearchPaper.ts        # Literature database
│   │   └── AuditLog.ts             # System audit trail
│   ├── routes/                     # 🗺️ API Route Definitions (11 groups)
│   │   ├── authRoutes.ts           # /api/auth/*
│   │   ├── agentRoutes.ts          # /api/agents/*
│   │   ├── pipelineRoutes.ts       # /api/pipeline/*
│   │   ├── patientRoutes.ts        # /api/patients/*
│   │   ├── clinicalDocRoutes.ts    # /api/clinical-docs/*
│   │   ├── translatorRoutes.ts     # /api/translator/*
│   │   ├── predictiveRoutes.ts     # /api/predictive/*
│   │   ├── researchRoutes.ts       # /api/research/*
│   │   ├── workflowRoutes.ts       # /api/workflow/*
│   │   └── dashboardRoutes.ts      # /api/dashboard/*
│   └── scripts/                    # 🔧 Utility Scripts
│       ├── testAgent.ts            # Single agent testing
│       ├── testAllAgents.ts        # Full pipeline testing
│       ├── testBedrock.ts          # AWS connectivity test
│       └── backfillPatientCodes.ts # Data migration
│
└── frontend/                       # React + Capacitor Frontend
    ├── index.html                  # HTML entry with Inter font
    ├── package.json                # Frontend dependencies
    ├── vite.config.ts              # Build + proxy config
    ├── capacitor.config.ts         # Mobile deployment config
    ├── eslint.config.js            # Code quality rules
    ├── android/                    # Android build files
    ├── ios/                        # iOS build files
    └── src/
        ├── main.tsx                # React entry + providers
        ├── App.tsx                 # Routing + auth guards
        ├── index.css               # Global styles
        ├── components/              # 🧩 UI Components
        │   ├── layout/
        │   │   ├── DashboardLayout.tsx  # Sidebar + topbar shell
        │   │   └── ProtectedRoute.tsx   # Auth + role guards
        │   └── ui/
        │       └── Cards.tsx           # Reusable card components
        ├── contexts/
        │   └── AuthContext.tsx     # Global auth state
        ├── hooks/
        │   └── useAuth.ts         # Auth context hook
        ├── lib/
        │   └── api.ts             # Axios + interceptors
        ├── pages/                   # 📱 Application Pages (12 groups)
        │   ├── auth/              # LoginPage, RegisterPage
        │   ├── dashboard/         # Role-specific dashboards
        │   ├── agents/            # Agent monitoring
        │   ├── pipeline/          # Pipeline execution UI
        │   ├── patients/          # Patient list + profiles
        │   ├── clinical/          # Clinical documentation
        │   ├── translator/        # Medical translation
        │   ├── predictive/        # Risk assessment
        │   ├── research/          # Paper search + trends
        │   ├── workflow/          # Appointments + claims
        │   └── landing/           # Marketing page
        └── types/
            └── index.ts           # Shared TypeScript types
```
```

---

## 🌐 API Reference

> All routes prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

Base URL: `http://localhost:5000/api`
Health Check: `GET /api/health` → `{ status: "ok", service: "CARENET AI Backend", timestamp }`

### 🤖 Agent Pipeline — `/api/pipeline`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/run/:patientId` | doctor, admin | **Trigger full 5-agent pipeline** (🔥 $0.52 cost) |
| **GET** | `/status/:patientId` | doctor, admin | Real-time pipeline execution status |
| **GET** | `/stream/:patientId` | doctor, admin | Server-Sent Events stream for progress |
| **GET** | `/cache/stats` | admin | Pipeline cache statistics |
| **DELETE** | `/cache/:patientId` | admin | Clear specific patient cache |

💰 **Pipeline Cost Breakdown:**
- Clinical Documentation: $0.047
- Medical Translation: $0.053  
- Predictive Analytics: $0.081
- Research Synthesis: $0.151
- Workflow Automation: $0.186
- **Total: $0.518/execution**

### 🔐 Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|---------|----- |-------------|
| POST | `/register` | Public | Register new user (auto-creates Patient profile if role=patient) |
| POST | `/login` | Public | Authenticate and receive JWT (30-day expiration) |
| POST | `/google` | Public | Google OAuth authentication |
| GET | `/me` | Protected | Get current user + patient profile |
| PUT | `/profile` | Protected | Update user profile |
| POST | `/role-selection` | Protected | Complete profile after OAuth signup |

**Register Request Example:**
```json
{
  "name": "Dr. Sarah Johnson",
  "email": "sarah@hospital.com",
  "password": "SecurePass123",
  "role": "doctor",
  "specialization": "Cardiology",
  "licenseNumber": "MD-67890"
}
```

### 🥼 Patients — `/api/patients`

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/me/profile` | patient | Get own patient profile |
| GET | `/` | doctor, admin | List all patients (searchable, role-scoped) |
| GET | `/:id` | doctor, admin | Get patient by ID |
| PUT | `/:id` | doctor, admin | Update patient record |
| POST | `/:id/vitals` | doctor, admin | Add vital signs entry |
| POST | `/:id/medications` | doctor | Add medication to patient |

### 📝 Clinical Documentation — `/api/clinical-docs`

| Method | Endpoint | Auth | Description |
|--------|---------|----- |-------------|
| **POST** | `/` | doctor | **Create new clinical note** |
| **POST** | `/process-transcript` | doctor | **Convert voice transcript → structured SOAP note** |
| GET | `/` | Any | List clinical notes (paginated, role-scoped) |
| GET | `/:id` | Any | Get clinical note by ID |
| GET | `/patient/:patientId` | Any | Get notes for specific patient |
| PUT | `/:id/verify` | doctor | Verify, reject, or amend a note |

### 🌐 Medical Translator — `/api/translator`

| Method | Endpoint | Description |
|--------|---------|--------------|
| **POST** | `/translate` | **Translate clinical report to patient-friendly language** (30+ term dictionary) |
| **POST** | `/ask` | **Medical Q&A engine** for patient questions |
| **POST** | `/medication-instructions` | **Generate medication guide** with dosing, side effects, warnings |

### 📊 Predictive Analytics — `/api/predictive`

| Method | Endpoint | Roles | Description |
|--------|---------|----- |--------------|
| **POST** | `/assess/:patientId` | doctor, admin | **Run multi-category risk assessment** (Cardiovascular, Metabolic, Respiratory) |
| GET | `/alerts` | doctor, admin | Get all active unacknowledged alerts |
| GET | `/patient/:patientId` | Any | Get all assessments for patient |
| GET | `/latest/:patientId` | Any | Get most recent risk assessment |
| PUT | `/:assessmentId/alerts/:alertIndex/acknowledge` | doctor, admin | Acknowledge specific alert |

### 🔬 Research — `/api/research`

| Method | Endpoint | Description |
|--------|---------|--------------|
| **GET** | `/search` | **Search research papers** (full-text + category filters) |
| **GET** | `/trends` | **Get trending medical research topics** with growth percentages |
| **POST** | `/compare` | **Compare evidence across multiple papers** (common findings + contradictions) |
| GET | `/paper/:id` | Get specific paper details |
| POST | `/paper/:id/save` | Bookmark/unbookmark paper for user |

### ⚙️ Workflow Management — `/api/workflow`

| Method | Endpoint | Roles | Description |
|--------|---------|----- |--------------|
| **POST** | `/appointments` | Any | **Create appointment** with conflict detection |
| GET | `/appointments` | Any | List appointments (role-scoped) |
| PUT | `/appointments/:id` | Any | Update appointment status |
| **POST** | `/claims` | doctor, admin | **Create insurance claim** with audit trail |
| GET | `/claims` | doctor, admin | List claims with lifecycle status |
| PUT | `/claims/:id` | doctor, admin | Update claim status (triggers audit) |
| **POST** | `/labs` | doctor, admin | **Create lab result** with reference ranges |
| GET | `/labs` | Any | View lab results (role-scoped) |
| PUT | `/labs/:id` | doctor, admin | Update lab result (triggers review workflow) |

### 📡 Agent Telemetry — `/api/agents`

| Method | Endpoint | Auth | Description |
|--------|---------|----- |--------------|
| GET | `/telemetry` | Any | Agent performance metrics (runs, success rate, latency, token usage) |
| GET | `/health` | Any | Agent health status across all 5 agents |
| POST | `/test/:agentType` | admin | Test individual agent functionality |

### 📈 Dashboard — `/api/dashboard`

| Method | Endpoint | Role | Dashboard Data Includes |
|--------|---------|----- |--------------------------|
| GET | `/doctor` | doctor | Patient count, appointments, pending notes, active alerts, quick actions |
| GET | `/patient` | patient | Health score, vital trends, upcoming appointments, risk assessment |
| GET | `/admin` | admin | System metrics, user counts, platform analytics, management tools |
| GET | `/researcher` | researcher | Paper statistics, trending topics, bookmark collections |
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

## 🗃️ Database Models & Relationships

CARENET AI uses **9 comprehensive Mongoose models** for healthcare data management:

### Core Authentication

**👥 User** — Primary authentication model
```typescript
{
  name: string              // Full name
  email: string             // Unique, lowercase
  password: string          // bcrypt hashed (12 rounds), hidden by default
  role: 'doctor' | 'patient' | 'researcher' | 'admin'
  specialization?: string   // For doctors
  licenseNumber?: string    // For doctors
  phone?: string
  authProvider: 'local' | 'google'  // OAuth support
  isProfileComplete: boolean        // OAuth workflow flag
  isActive: boolean         // Soft account disabling
  createdAt: Date
}
```

**🥼 Patient** — Extended medical profile (1:1 with User)
```typescript
{
  userId: ObjectId          // Unique link to User
  patientCode: string       // Auto-generated: PT-0001, PT-0002...
  dateOfBirth: Date
  gender: 'male' | 'female' | 'other'
  bloodGroup: string
  allergies: string[]       // Known allergies
  chronicConditions: string[] // Used by risk scoring
  insurance: {
    provider: string
    policyNumber: string
    expiryDate: Date
  }
  medicalHistory: [{
    condition: string
    diagnosedDate: Date
    status: 'active' | 'resolved' | 'chronic'
    notes: string
  }]
  medications: [{
    name: string
    dosage: string
    frequency: string
    prescribedBy: ObjectId  // → User (doctor)
    startDate: Date
    endDate?: Date
    isActive: boolean
  }]
  vitalSigns: [{ // Time-series data
    recordedAt: Date
    bloodPressure: { systolic: number, diastolic: number }
    heartRate: number
    temperature: number
    weight: number
    height: number
    oxygenSaturation: number
    recordedBy: ObjectId    // → User
  }]
  riskFactors: [{
    factor: string
    severity: 'low' | 'moderate' | 'high'
    identifiedDate: Date
  }]
  emergencyContact: {
    name: string
    phone: string
    relation: string
  }
}
```

### Clinical Documentation

**📋 ClinicalNote** — SOAP-structured medical documentation
```typescript
{
  patientId: ObjectId       // → Patient
  providerId: ObjectId      // → User (attending doctor)
  sessionDate: Date
  noteType: 'consultation' | 'follow-up' | 'emergency' | 'procedure' | 'discharge'
  
  // SOAP Structure
  chiefComplaint: string
  historyOfPresentIllness: string
  physicalExam: {
    general: string
    vitalSigns: object
    findings: string[]
  }
  assessment: [{
    diagnosis: string
    icdCode?: string
    severity: 'mild' | 'moderate' | 'severe'
    confidence: number      // 0.0 - 1.0
  }]
  plan: [{
    type: 'treatment' | 'medication' | 'follow-up' | 'referral' | 'lab'
    description: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }]
  
  // AI Processing
  transcript?: string       // Original voice input
  extractedEntities: [{
    entity: string
    type: 'symptom' | 'diagnosis' | 'medication' | 'procedure' | 'lab_test'
    confidence: number
    context: string
  }]
  
  // Workflow
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'amended'
  verifiedBy?: ObjectId    // → User
  verifiedAt?: Date
  
  prescriptions: [{
    medication: string
    dosage: string
    frequency: string
    duration: string
    instructions: string
  }]
  
  followUpRequired: boolean
  followUpDate?: Date
}
```

**⚖️ RiskAssessment** — AI-generated health risk predictions
```typescript
{
  patientId: ObjectId       // → Patient
  assessmentDate: Date
  
  riskScores: [{
    category: 'Cardiovascular' | 'Metabolic' | 'Respiratory'
    score: number           // 0-100
    level: 'low' | 'moderate' | 'high' | 'critical'
    contributingFactors: string[]
  }]
  
  overallRisk: 'low' | 'moderate' | 'high' | 'critical'
  confidenceLevel: number   // 0.0 - 1.0
  
  predictions: [{
    condition: string
    probability: number     // 0.0 - 1.0
    timeframe: string       // "6 months", "1 year", etc.
    preventable: boolean
  }]
  
  recommendations: [{
    type: 'lifestyle' | 'medication' | 'monitoring' | 'referral'
    description: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    evidenceBasis: string   // Citation (AHA 2024, etc.)
  }]
  
  alerts: [{
    type: 'warning' | 'critical' | 'info'
    message: string
    acknowledged: boolean
    acknowledgedBy?: ObjectId // → User
    acknowledgedAt?: Date
  }]
  
  followUpRequired: boolean
  nextAssessmentDate?: Date
}
```

### Workflow Management

**📅 Appointment** — Scheduling with conflict detection
```typescript
{
  patientId: ObjectId       // → Patient
  doctorId: ObjectId        // → User
  scheduledDate: Date
  duration: number          // Minutes (default: 30)
  type: 'consultation' | 'follow-up' | 'emergency' | 'checkup' | 'procedure'
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notes?: string
  reasonForVisit: string
  
  // Conflict Detection
  isConflict: boolean
  conflictReason?: string
  
  // Follow-up Tracking
  parentAppointmentId?: ObjectId  // Links follow-ups
  reminderSent: boolean
  
  createdAt: Date
  updatedAt: Date
}
```

**📋 InsuranceClaim** — Claims lifecycle with full audit trail
```typescript
{
  claimNumber: string       // Unique identifier
  patientId: ObjectId       // → Patient
  providerId: ObjectId      // → User (doctor)
  
  diagnosisCodes: [{
    code: string           // ICD-10 code
    description: string
  }]
  procedureCodes: [{
    code: string           // CPT code  
    description: string
    cost: number
  }]
  
  totalAmount: number
  submittedAmount: number
  approvedAmount?: number
  
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'denied' | 'appealed'
  
  auditTrail: [{
    action: string           // Status change
    performedBy: ObjectId    // → User
    timestamp: Date
    notes?: string
  }]
  
  submittedAt?: Date
  processedAt?: Date
  responseDate?: Date
  denialReason?: string
  
  supportingDocuments: string[]  // File paths
}
```

**🧬 LabResult** — Laboratory test management
```typescript
{
  patientId: ObjectId       // → Patient
  orderedBy: ObjectId       // → User (doctor)
  testName: string
  
  results: [{
    parameter: string
    value: number | string
    unit: string
    referenceRange: string
    status: 'normal' | 'abnormal' | 'critical'
  }]
  
  status: 'ordered' | 'collected' | 'processing' | 'completed' | 'reviewed'
  
  orderedDate: Date
  collectedDate?: Date
  completedDate?: Date
  reviewedDate?: Date
  reviewedBy?: ObjectId     // → User
  
  abnormalFlags: string[]   // Flagged abnormal parameters
  criticalValues: string[]  // Critical parameters requiring immediate attention
  
  interpretation: string
  recommendations: string
  
  laboratoryId: string
  technicianNotes?: string
}
```

### Research & Knowledge

**📜 ResearchPaper** — Medical literature database
```typescript
{
  externalId: string        // PubMed ID, DOI, etc.
  title: string            // Full-text indexed
  abstract: string         // Full-text indexed
  authors: string[]
  journal: string
  publishedDate: Date
  category: 'Cardiology' | 'Neurology' | 'Oncology' | 'Pediatrics' | 'General'
  
  keyFindings: string[]
  methodology: string
  conclusions: string
  
  citations: number
  impactFactor?: number
  
  savedBy: ObjectId[]      // → User (bookmarks)
  
  tags: string[]
  doi?: string
  pubmedLink?: string
  fullTextAvailable: boolean
}
```

### System Monitoring

**📋 AuditLog** — Complete system audit trail
```typescript
{
  userId?: ObjectId        // → User (null for system actions)
  action: string           // Descriptive action
  module: string          // Controller/area
  details?: object        // Additional context
  ipAddress: string
  userAgent: string
  timestamp: Date
  
  // Request tracking
  method: string          // HTTP method
  endpoint: string        // API endpoint
  statusCode: number      // Response code
  responseTime: number    // Milliseconds
  
  // Data changes (for sensitive operations)
  beforeData?: object
  afterData?: object
}
```

### Database Indexes & Performance

**Key Indexes:**
- `Patient`: Compound index on `(userId, patientCode)`
- `ClinicalNote`: Compound index on `(patientId, providerId, sessionDate)`
- `RiskAssessment`: Single index on `(patientId, -assessmentDate)` for latest retrieval
- `Appointment`: Compound index on `(doctorId, scheduledDate)` for conflict detection
- `ResearchPaper`: Text index on `(title, abstract)` for full-text search
- `AuditLog`: Compound index on `(timestamp, -userId)` for audit queries

---

## 📱 Frontend Pages & Mobile Support

### Role-Based Navigation Structure

| Page Group | Routes | Allowed Roles | Key Features |
|------------|--------|---------------|-------------|
| **Public** | `/login`, `/register` | None | OAuth + local auth, role selection |
| **Dashboard** | `/dashboard` | All | Auto-switches to role-specific view |
| **Patients** | `/patients` | doctor, admin | Search, profiles, medical history |
| **Clinical** | `/clinical-docs` | doctor, admin | SOAP notes, voice transcription |
| **Translation** | `/translator` | All | Medical → patient language, Q&A |
| **Predictive** | `/predictive` | doctor, admin | Risk scoring, alert management |
| **Research** | `/research` | doctor, researcher, admin | Paper search, evidence synthesis |
| **Workflow** | `/workflow` | doctor, admin | Appointments, claims, labs |
| **Agents** | `/agents` | All | Pipeline monitoring, telemetry |
| **Pipeline** | `/pipeline` | doctor, admin | Real-time execution tracking |

### Dashboard Variants by Role

**🥼 Doctor Dashboard**
- Today's schedule with patient conflicts
- Patient count & quick patient search
- Pending clinical notes requiring verification  
- Active critical alerts requiring acknowledgment
- Quick actions: New note, Schedule appointment, Run assessment

**👤 Patient Dashboard**
- Personal health score visualization
- Vital signs trends (BP, weight, heart rate)
- Upcoming appointments & medication reminders
- Latest risk assessment with colored progress bars
- Educational content based on conditions

**🛡️ Admin Dashboard** 
- System-wide metrics: users, patients, notes, alerts
- Platform analytics: API usage, error rates, costs
- User management: registrations, role changes
- Quick management actions: Backup, cache clear

**🔬 Researcher Dashboard**
- Trending research topics with growth percentages
- Personal bookmark collections
- Recent evidence comparisons
- Citation network analysis

### 📱 Mobile App Features (Capacitor 8)

**Native Capabilities:**
- 📷 Camera integration for document capture
- 🗺️ Geolocation for appointment check-ins
- 🔔 Push notifications for critical alerts
- 📋 Clipboard integration for easy data entry
- 🔊 Haptic feedback for confirmations
- 🌐 Network status detection
- 📁 File system access for voice recordings
- 📵 Device info for audit logging

**Cross-Platform Deployment:**
```bash
# iOS Development
npx cap add ios && npx cap open ios

# Android Development
npx cap add android && npx cap open android

# Live reload during development
npx cap run ios --livereload --external
npx cap run android --livereload --external
```

## 👥 User Roles & Permissions (RBAC)

CARENET AI implements **comprehensive Role-Based Access Control** across both backend middleware and frontend route guards:

| Feature | Doctor | Patient | Researcher | Admin |
|---------|:------:|:-------:|:----------:|:-----:|
| **Dashboard Access** | ✅ Custom | ✅ Custom | ✅ Custom | ✅ Custom |
| **Patient Records** | ✅ Full CRUD | ❌ Own only | ❌ None | ✅ Full CRUD |
| **Clinical Documentation** | ✅ Create/Verify | ❌ View own | ❌ None | ✅ All access |
| **Voice Transcription** | ✅ Full access | ❌ None | ❌ None | ✅ Full access |
| **Medical Translation** | ✅ All features | ✅ Basic access | ✅ Research only | ✅ All features |
| **Risk Assessment** | ✅ Run/Acknowledge | ❌ View own | ❌ None | ✅ Full access |
| **Research Papers** | ✅ Search/Save | ❌ None | ✅ Full access | ✅ All access |
| **Workflow Management** | ✅ Full CRUD | ❌ View own | ❌ None | ✅ Full access |
| **Agent Pipeline** | ✅ Execute/Monitor | ❌ None | ❌ None | ✅ Full access |
| **System Telemetry** | ✅ View metrics | ❌ None | ✅ Research metrics | ✅ Full analytics |

### Authorization Enforcement Layers

1. **Backend Middleware** (`auth.ts`)
   - JWT verification
   - Role-based route protection
   - Resource ownership validation

2. **Frontend Route Guards** (`ProtectedRoute.tsx`)
   - Authentication state checks
   - Role-based navigation hiding
   - Automatic redirects for unauthorized access

3. **Dynamic UI Components**
   - Conditional rendering based on user role
   - Feature-specific permission checks
   - Role-appropriate action buttons

## 🔒 Security & Compliance Features

### Authentication & Authorization
- **Password Security**: bcryptjs with 12-round salt hashing
- **JWT Tokens**: 30-day expiration with secure secret (32+ chars required)
- **OAuth Integration**: Google OAuth 2.0 with profile completion flow
- **Role-Based Access**: 4-tier authorization (doctor/patient/researcher/admin)
- **Session Management**: Auto-logout on token expiration, secure storage

### API Security Hardening

| Security Layer | Implementation | Configuration |
|----------------|----------------|---------------|
| **CORS Protection** | Strict origin validation | `CLIENT_URL` whitelist only |
| **Rate Limiting** | express-rate-limit | Global: 100 req/15min, Auth: 10 attempts/15min |
| **Input Sanitization** | mongo-sanitize | NoSQL injection prevention |
| **Security Headers** | Helmet.js | CSP, HSTS (1 year), referrer policy |
| **Body Size Limits** | Express built-in | 100KB max (DoS prevention) |
| **Error Handling** | Custom middleware | Stack traces only in development |

### Audit & Compliance

**📋 Complete Audit Trail** (`AuditLog` model):
- Every authenticated action logged
- User ID, IP address, user-agent tracking
- Module, action type, and timestamp
- Request/response tracking with performance metrics
- Data change tracking for sensitive operations

**🏥 HIPAA Considerations**:
- Comprehensive audit logging for medical data access
- Role-based access control for patient information
- Encryption in transit (TLS) and at rest (MongoDB)
- Data model supports field-level encryption
- User activity monitoring and alerting

### Environment Security

**⚠️ Production Requirements**:
```env
# Strong authentication
JWT_SECRET=minimum-32-character-secure-secret-key

# Database security  
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/carenet?retryWrites=true&w=majority

# HTTPS-only cookies in production
NODE_ENV=production
CLIENT_URL=https://carenet-ai.com

# API keys rotation
AWS_ACCESS_KEY_ID=rotated-monthly
GROQ_API_KEY=rate-limited-production-key
```

## 🚀 Deployment & Production

### Docker Deployment

**Multi-stage Dockerfile optimizations**:
- Node 20-alpine base (minimal attack surface)
- Non-root `carenet` user for security
- Health check endpoint integration
- Production dependency optimization

```dockerfile
# Backend Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS production
RUN addgroup -g 1001 -S carenet && adduser -S carenet -u 1001
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY . .
USER carenet
EXPOSE 5000
HEALTHCHECK CMD curl -f http://localhost:5000/api/health || exit 1
CMD ["npm", "start"]
```

### AWS Deployment Options

**☁️ Recommended AWS Architecture**:
- **ECS Fargate**: Serverless container deployment
- **Application Load Balancer**: HTTPS termination, health checks
- **DocumentDB**: MongoDB-compatible managed database
- **CloudWatch**: Logging and monitoring
- **Route 53**: DNS and SSL certificate management

**💰 Cost Optimization**:
- Use Nova Lite model ($0.30/pipeline vs $0.52)
- Implement request caching for frequent queries
- Auto-scaling based on CPU/memory utilization
- Spot instances for non-critical workloads

### Performance & Monitoring

**📈 Key Performance Metrics**:
- Agent pipeline execution time (~3 minutes average)
- Database query performance (MongoDB indexes)
- API response times (95th percentile < 500ms)
- Error rates by endpoint and user role

**🔍 Health Monitoring**:
- `/api/health` endpoint with detailed status
- AWS Bedrock service availability checks
- Database connection health
- Agent telemetry and success rates

### CI/CD Pipeline Integration

**GitHub Actions Workflow**:
```yaml
name: Deploy CARENET AI
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and test
        run: |
          cd backend && npm test
          cd ../frontend && npm test
      - name: Deploy to AWS ECS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        run: |
          aws ecs update-service --cluster carenet --service carenet-backend
```

---

## 🚀 Scripts & Development Commands

### Backend Scripts (`backend/package.json`)

| Command | Script | Description |
|---------|--------| ------------|
| `npm run dev` | `tsx watch index.ts` | **Development server** with hot reload |
| `npm run build` | `tsc` | **Compile TypeScript** to `dist/` directory |
| `npm start` | `node dist/index.js` | **Run production** build |
| `npm test` | `jest` | **Run test suite** (if configured) |
| `npm run test:agents` | `tsx scripts/testAllAgents.ts` | **Test all 5 AI agents** sequentially |
| `npm run test:bedrock` | `tsx scripts/testBedrock.ts` | **Test AWS Bedrock** connectivity |
| `npm run backfill` | `tsx scripts/backfillPatientCodes.ts` | **Migrate patient codes** (PT-0001 format) |

### Frontend Scripts (`frontend/package.json`)

| Command | Script | Description |
|---------|--------| ------------|
| `npm run dev` | `vite` | **Development server** (port 5173) with API proxy |
| `npm run build` | `tsc -b && vite build` | **Production build** with type checking |
| `npm run preview` | `vite preview` | **Preview production** build locally |
| `npm run lint` | `eslint .` | **Code quality** checks with ESLint |
| `npm run lint:fix` | `eslint . --fix` | **Auto-fix** ESLint issues |

### Mobile Development Commands

| Platform | Command | Description |
|----------|---------|-------------|
| **iOS** | `npx cap add ios && npx cap open ios` | **Setup and launch** Xcode project |
| **Android** | `npx cap add android && npx cap open android` | **Setup and launch** Android Studio |
| **Live Reload** | `npx cap run ios --livereload --external` | **Development** with live reload |
| **Build** | `npx cap build ios` | **Production build** for App Store |

### Production Deployment

| Environment | Commands | Notes |
|-------------|----------|-------|
| **Docker** | `docker-compose up --build` | Complete stack deployment |
| **AWS ECS** | `aws ecs update-service --cluster carenet` | Container orchestration |
| **Heroku** | `git push heroku main` | Platform-as-a-service deployment |
| **PM2** | `pm2 start ecosystem.config.js` | Process management |

---

## 🐛 Troubleshooting

### Common Issues & Solutions

**❌ Agent Pipeline Failures**
```bash
# Check AWS credentials
npm run test:bedrock

# Test individual agents
npm run test:agents

# Clear pipeline cache
curl -X DELETE http://localhost:5000/api/pipeline/cache/PATIENT_ID
```

**❌ Authentication Problems**
```bash
# Verify JWT secret strength
echo $JWT_SECRET | wc -c  # Should be 32+

# Check token expiration
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/auth/me
```

**❌ Database Connection Issues**
```bash
# Test MongoDB connectivity
mongo $MONGO_URI --eval "db.adminCommand('ping')"

# Check connection string format
echo $MONGO_URI | grep -E '^mongodb(\+srv)?://'
```

**❌ Mobile Build Problems**
```bash
# Clean Capacitor cache
npx cap clean
npx cap sync

# Rebuild native projects
npx cap add ios --force
npx cap add android --force
```

### Performance Optimization

**🚀 Backend Optimization**:
- Enable MongoDB connection pooling
- Implement Redis for session storage
- Add response compression middleware
- Use CDN for static assets

**🚀 Frontend Optimization**:
- Implement React.lazy() for code splitting
- Add service worker for offline support
- Optimize bundle size with tree shaking
- Use React Query for data caching

---

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Install** dependencies: `npm install` (both backend and frontend)
4. **Set up** environment: Copy `.env.example` to `.env` and configure
5. **Develop** with hot reload: `npm run dev` in both directories
6. **Test** your changes: `npm test` and manual testing
7. **Commit** your changes: `git commit -m "feat: add amazing feature"`
8. **Push** to your branch: `git push origin feature/amazing-feature`
9. **Open** a Pull Request with detailed description

### Code Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Follow the project's linting rules
- **Prettier**: Code formatting consistency
- **Conventional Commits**: Use semantic commit messages
- **Testing**: Add tests for new features
- **Documentation**: Update README for new endpoints/features

### Pull Request Guidelines

- ✅ Include clear description of changes
- ✅ Add appropriate labels (feature, bugfix, docs)
- ✅ Ensure all CI checks pass
- ✅ Update documentation if needed
- ✅ Test on both desktop and mobile
- ✅ Verify agent pipeline functionality

---

## 📄 License

This project is licensed under the **ISC License** - see the LICENSE file for details.

---

## 🚀 Roadmap

### Upcoming Features

**Q2 2026**:
- [ ] Real-time collaboration on clinical notes
- [ ] Advanced analytics dashboard with ML insights
- [ ] Integration with HL7 FHIR standards
- [ ] Multi-language support for international deployment

**Q3 2026**:
- [ ] Wearable device integration (Apple Health, Fitbit)
- [ ] Telemedicine video calling features
- [ ] Advanced AI models for diagnostic assistance
- [ ] Blockchain-based patient consent management

**Q4 2026**:
- [ ] Federated learning across healthcare networks
- [ ] Genomic data integration and analysis
- [ ] Advanced predictive models for population health
- [ ] Enterprise SSO and Active Directory integration

---

<p align="center">
  <strong>Built with ❤️ for better healthcare</strong><br>
  <em>Powered by AWS Bedrock • Secured by design • Mobile-first approach</em>
</p>

<p align="center">
  <a href="#top">🔝 Back to Top</a>
</p>
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
