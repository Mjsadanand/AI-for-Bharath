# Audio Transcription for Clinical Documentation

## Overview

The Clinical Documentation page (`/clinical-docs`) supports **audio-to-text transcription** for creating clinical notes. Doctors can either **live-record** a patient consultation or **upload a pre-recorded audio file**. The system transcribes it using **Amazon Transcribe Medical** — an AWS service purpose-built for clinical vocabulary with 100,000+ medical terms, drug names, and ICD codes.

The transcript feeds directly into the **ClinicalDocAgent** Bedrock pipeline — a ReAct agent using Amazon Nova Premier that extracts medical entities and generates a structured SOAP note.

## AWS Services Used

| Feature | AWS Service | Benefit |
|---------|------------|--------|
| **Audio storage** | Amazon S3 | AES-256 encrypted; auto-deleted after transcription |
| **Clinical transcription** | Amazon Transcribe Medical | 100k+ clinical vocabulary; PRIMARYCARE specialty |
| **Note generation** | Amazon Bedrock (Nova Premier) | Structured SOAP note from transcript via ReAct agent |
| **Live recording preview** | Browser Web Speech API | Instant feedback (free, browser-native) |

## Why Amazon Transcribe Medical

Generic ASR models (including Whisper) were not trained on clinical vocabulary and commonly misrecognise:
- Drug names: *lisinopril*, *metformin*, *atorvastatin*
- Clinical abbreviations: *PRN*, *b.i.d.*, *q.d.*, *STAT*
- Procedures and diagnoses: *echocardiogram*, *tachyarrhythmia*, *hyperlipidaemia*

Amazon Transcribe Medical's expanded clinical vocabulary eliminates these transcription errors before they corrupt AI-generated clinical notes.

## How It Works

### Live Recording Flow
1. Doctor clicks **"Live Record"** in the Voice/Transcript tab
2. Browser requests microphone permission
3. **MediaRecorder** captures raw audio (WebM/Opus)
4. **Web Speech API** shows a real-time preview in the textarea
5. Doctor clicks **"Stop Recording"**
6. Audio blob is uploaded to backend → **Amazon S3** (AES-256 encrypted)
7. **Amazon Transcribe Medical** job is submitted (`PRIMARYCARE` / `CONVERSATION`)
8. Backend polls until job completes (median < 60s); result fetched from S3
9. High-accuracy clinical transcript replaces the interim preview
10. Doctor reviews/edits, then clicks **"Process Transcript"** → Bedrock agent

### Upload Recording Flow
1. Doctor drags-and-drops or picks an audio file
2. Supported formats: WAV, MP3, M4A, WebM, OGG, FLAC (max 25 MB)
3. File is sent to backend → S3 upload → Transcribe Medical job
4. Transcript appears in the textarea
5. Doctor reviews/edits, then submits to the Bedrock pipeline

### Why Two-Stage Live Recording?
- **Web Speech API** gives instant feedback but has lower accuracy for medical terminology
- **Amazon Transcribe Medical** provides significantly higher accuracy for clinical vocabulary, but requires a round-trip
- Result: doctors see words appear in real-time, and get a polished, clinically-accurate version within seconds

## Setup

### 1. Create an Amazon S3 Bucket

```bash
aws s3api create-bucket --bucket carenet-clinical-audio --region us-east-1

# Enable encryption
aws s3api put-bucket-encryption --bucket carenet-clinical-audio \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Block all public access
aws s3api put-public-access-block --bucket carenet-clinical-audio \
  --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'
```

### 2. IAM Permissions (add to your AWS credentials)

```json
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
```

### 3. Add to backend `.env`

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=carenet-clinical-audio
```

### 4. Restart backend

```bash
cd backend && npm run dev
```

> **Note:** Live recording still works without the S3 bucket (using browser Web Speech API for preview), but final high-accuracy transcription and file uploads require `AWS_S3_BUCKET_NAME`.

## Files Changed

| File | Change |
|------|--------|
| `backend/controllers/transcriptionController.ts` | Replaced Groq Whisper with Amazon Transcribe Medical + S3 |
| `backend/config/validateEnv.ts` | Replaced `GROQ_API_KEY` with `AWS_S3_BUCKET_NAME` |
| `backend/package.json` | Replaced Groq fetch with `@aws-sdk/client-s3` + `@aws-sdk/client-transcribe` |
| `frontend/src/pages/clinical/ClinicalDocsPage.tsx` | Recording + upload UI (unchanged) |

## API Endpoint

### `POST /api/clinical-docs/transcribe`

**Auth:** Bearer token (doctor role only)

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `audio` | File | Audio file (max 25 MB) |

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": "Patient presents with persistent headache...",
    "language": "en-US",
    "duration": 45.2,
    "provider": "Amazon Transcribe Medical",
    "specialty": "PRIMARYCARE",
    "model": "amazon-transcribe-medical-v1"
  }
}
```

## How It Works

### Live Recording Flow
1. Doctor clicks **"Live Record"** in the Voice/Transcript tab
2. Browser requests microphone permission
3. **MediaRecorder** captures raw audio (WebM/Opus)
4. **Web Speech API** provides an instant real-time transcript preview in the textarea
5. Doctor clicks **"Stop Recording"**
6. The recorded audio blob is uploaded to the backend → **Groq Whisper API**
7. The high-accuracy Whisper transcript replaces the interim Web Speech API text
8. Doctor can review/edit, then click **"Process Transcript"**

### Upload Recording Flow
1. Doctor clicks **"Upload Audio"** or drags-and-drops an audio file
2. Supported formats: WAV, MP3, M4A, WebM, OGG, FLAC (max 25 MB)
3. File is sent to backend → **Groq Whisper API**
4. Transcript appears in the textarea
5. Doctor reviews/edits, then submits

### Why Two-Stage Live Recording?
- **Web Speech API** gives instant feedback but has lower accuracy for medical terminology
- **Groq Whisper** (`whisper-large-v3-turbo`) provides significantly higher accuracy, especially for clinical vocabulary, but requires a round-trip
- The result: doctors see their words appearing in real-time, and get a polished, more accurate version seconds after stopping

## Setup

### 1. Get a free Groq API Key

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Create an API key

### 2. Add to backend `.env`

```env
GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Restart backend

```bash
cd backend && npm run dev
```

> **Note:** Live recording still works without the API key (using browser Web Speech API), but file uploads and high-accuracy transcription require `GROQ_API_KEY`.

## Files Changed

| File | Change |
|------|--------|
| `backend/controllers/transcriptionController.ts` | **New** — Handles audio upload → Groq Whisper API |
| `backend/routes/clinicalDocRoutes.ts` | Added `/transcribe` route with multer middleware |
| `backend/config/validateEnv.ts` | Added `GROQ_API_KEY` to recommended env vars |
| `backend/package.json` | Added `multer` + `@types/multer` dependencies |
| `frontend/src/pages/clinical/ClinicalDocsPage.tsx` | Rewrote `NewNoteModal` with recording + upload UI |

## API Endpoint

### `POST /api/clinical-docs/transcribe`

**Auth:** Bearer token (doctor role only)

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `audio` | File | Audio file (max 25 MB) |

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": "Patient presents with persistent headache...",
    "language": "en",
    "duration": 45.2,
    "segments": [
      { "start": 0.0, "end": 3.5, "text": "Patient presents with..." }
    ]
  }
}
```

## Accuracy Notes

- **Whisper large-v3-turbo** is one of the most accurate speech-to-text models available
- `temperature: 0` is set for deterministic, most-likely transcriptions
- Language is pinned to English (`en`) for medical terminology accuracy
- The transcript is always editable — doctors can correct any errors before processing
- Groq free tier: **14,400 audio-seconds/day** (~240 minutes)
