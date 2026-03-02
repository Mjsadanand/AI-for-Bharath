# Audio Transcription for Clinical Documentation

## Overview

The Clinical Documentation page (`/clinical-docs`) now supports **audio-to-text transcription** for creating clinical notes. Doctors can either **live-record** a patient consultation or **upload a pre-recorded audio file**, and the system will automatically transcribe it to text using AI.

The transcript feeds into the existing clinical note pipeline — AI extracts medical entities (symptoms, diagnoses, medications) and generates a structured note.

## Features

| Feature | Technology | Cost |
|---------|-----------|------|
| **Live Recording** | Browser MediaRecorder API + Web Speech API | Free (built-in) |
| **Audio File Upload** | Drag-and-drop / file picker → Groq Whisper API | Free tier (240 min/day) |
| **Real-time Preview** | Web Speech API (`SpeechRecognition`) | Free (browser-native) |
| **High-accuracy Transcription** | Groq `whisper-large-v3-turbo` | Free tier |

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
