<p align="center">
  <img src="https://img.shields.io/badge/CARENET-AI-0ea5e9?style=for-the-badge&logo=heart&logoColor=white" alt="CARENET AI" />
</p>

<h1 align="center">CARENET AI — Intelligent Healthcare Assistant Platform</h1>

<p align="center">
  A comprehensive, AI-powered healthcare management system delivering clinical documentation, predictive analytics, medical translation, research synthesis, and workflow automation — all within a unified, role-based platform.
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

**CARENET AI** is a full-stack healthcare assistant platform designed to streamline clinical workflows, enhance patient care, and support medical research through intelligent automation. The system serves four distinct user roles — **Doctors**, **Patients**, **Researchers**, and **Administrators** — each with a tailored dashboard and feature set.

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

| Layer          | Technology                                                                              |
|----------------|----------------------------------------------------------------------------------------|
| **Frontend**   | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, React Router 7, Recharts, Lucide React |
| **Backend**    | Node.js, Express 5, TypeScript 5.9, Mongoose 9                                        |
| **Database**   | MongoDB                                                                                 |
| **Auth**       | JSON Web Tokens (JWT), bcryptjs                                                         |
| **HTTP Client**| Axios with interceptors                                                                 |
| **UI/UX**      | Headless UI, React Hot Toast, Google Fonts (Inter)                                     |
| **Dev Tools**  | ESLint, tsx (watch mode), Vite dev server with API proxy, React Compiler               |

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
JWT_SECRET=your-secure-jwt-secret-key

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
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
