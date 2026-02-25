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
