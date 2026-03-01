import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// @desc    Transcribe audio file using Groq Whisper (whisper-large-v3-turbo)
// @route   POST /api/clinical-docs/transcribe
export const transcribeAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No audio file provided' });
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        success: false,
        message: 'Transcription service not configured. Set GROQ_API_KEY in your backend .env file. Get a free key at https://console.groq.com',
      });
      return;
    }

    // Build multipart form for Groq Whisper API
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('file', blob, file.originalname || 'audio.webm');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'en');
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0'); // Lower temperature → higher accuracy

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Whisper API error:', response.status, errorText);
      res.status(502).json({
        success: false,
        message: 'Transcription service returned an error. Please try again or enter the transcript manually.',
      });
      return;
    }

    const data = await response.json();

    res.json({
      success: true,
      data: {
        transcript: data.text || '',
        language: data.language,
        duration: data.duration,
        segments: data.segments?.map((s: any) => ({
          start: s.start,
          end: s.end,
          text: s.text,
        })),
      },
    });
  } catch (error: any) {
    handleControllerError(res, error, 'Failed to transcribe audio');
  }
};
