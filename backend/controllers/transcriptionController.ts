// ─── CARENET AI — Audio Transcription Controller ─────────────────────────────
//
// Transcribes clinical audio using Amazon Transcribe Medical, a purpose-built
// AWS ASR service with an expanded medical vocabulary (100k+ clinical terms).
//
// Flow:
//   1. Upload audio buffer → Amazon S3 (server-side encrypted)
//   2. Submit Amazon Transcribe Medical batch job (PRIMARYCARE / CONVERSATION)
//   3. Poll until job completes (up to 3 minutes)
//   4. Fetch transcript JSON from S3 output
//   5. Clean up the temporary S3 audio object
//   6. Return transcript text + metadata to caller

import {
  TranscribeClient,
  StartMedicalTranscriptionJobCommand,
  GetMedicalTranscriptionJobCommand,
  type TranscriptionJobStatus,
} from '@aws-sdk/client-transcribe';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { handleControllerError } from '../middleware/errorHandler.js';

// ── Constants ────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 3_000;  // 3 seconds between status checks
const MAX_POLL_ATTEMPTS = 60;    // Up to 3 minutes (60 × 3s)
const AUDIO_PREFIX      = 'carenet-audio';
const TRANSCRIPT_PREFIX = 'carenet-transcripts';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map MIME type / file extension to the format string Transcribe expects */
function getMediaFormat(mimetype: string, filename: string): string {
  const ext = (filename.split('.').pop() ?? '').toLowerCase();
  if (ext === 'mp3'  || mimetype.includes('mpeg'))       return 'mp3';
  if (ext === 'mp4'  || ext === 'm4a' || mimetype.includes('mp4'))  return 'mp4';
  if (ext === 'wav'  || mimetype.includes('wav'))        return 'wav';
  if (ext === 'flac' || mimetype.includes('flac'))       return 'flac';
  if (ext === 'ogg'  || mimetype.includes('ogg'))        return 'ogg';
  if (ext === 'amr'  || mimetype.includes('amr'))        return 'amr';
  return 'webm'; // default — browser MediaRecorder output
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Controller ───────────────────────────────────────────────────────────────

/**
 * @desc    Transcribe audio using Amazon Transcribe Medical
 * @route   POST /api/clinical-docs/transcribe
 * @access  Doctor (JWT required)
 */
export const transcribeAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  const awsRegion  = process.env.AWS_REGION        ?? 'us-east-1';
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!bucketName) {
    res.status(503).json({
      success: false,
      message:
        'Transcription service not configured. ' +
        'Set AWS_S3_BUCKET_NAME in your backend .env file. ' +
        'See README → Environment Variables for setup instructions.',
    });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, message: 'No audio file provided' });
    return;
  }

  const s3Client         = new S3Client({ region: awsRegion });
  const transcribeClient = new TranscribeClient({ region: awsRegion });

  const timestamp   = Date.now();
  const mediaFmt    = getMediaFormat(file.mimetype, file.originalname ?? 'audio.webm');
  const jobName     = `carenet-med-${timestamp}`;
  const audioKey    = `${AUDIO_PREFIX}/${jobName}.${mediaFmt}`;
  const outputKey   = `${TRANSCRIPT_PREFIX}/${jobName}.json`;

  try {
    // ── Step 1 · Upload audio to Amazon S3 (server-side encrypted) ────────────
    await s3Client.send(
      new PutObjectCommand({
        Bucket:                  bucketName,
        Key:                     audioKey,
        Body:                    file.buffer,
        ContentType:             file.mimetype,
        ServerSideEncryption:    'AES256',
      }),
    );
    console.log(`[Transcribe] Audio uploaded → s3://${bucketName}/${audioKey}`);

    // ── Step 2 · Start Amazon Transcribe Medical job ───────────────────────────
    //   Specialty=PRIMARYCARE covers general clinical vocabulary.
    //   Type=CONVERSATION is optimal for doctor-patient consultations.
    await transcribeClient.send(
      new StartMedicalTranscriptionJobCommand({
        MedicalTranscriptionJobName: jobName,
        LanguageCode:                'en-US',
        MediaFormat:                 mediaFmt as any,
        Media:                       { MediaFileUri: `s3://${bucketName}/${audioKey}` },
        OutputBucketName:            bucketName,
        OutputKey:                   outputKey,
        Specialty:                   'PRIMARYCARE',
        Type:                        'CONVERSATION',
        Settings: {
          ShowSpeakerLabels:    false,
          ChannelIdentification: false,
        },
      }),
    );
    console.log(`[Transcribe] Medical job started → ${jobName}`);

    // ── Step 3 · Poll until job reaches a terminal state ─────────────────────
    let transcript = '';
    let duration: number | undefined;
    let completed  = false;

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await sleep(POLL_INTERVAL_MS);

      const { MedicalTranscriptionJob } = await transcribeClient.send(
        new GetMedicalTranscriptionJobCommand({ MedicalTranscriptionJobName: jobName }),
      );

      const status = MedicalTranscriptionJob?.TranscriptionJobStatus as TranscriptionJobStatus | undefined;

      if (status === 'COMPLETED') {
        // ── Step 4 · Fetch transcript JSON output from S3 ──────────────────────
        const s3Result = await s3Client.send(
          new GetObjectCommand({ Bucket: bucketName, Key: outputKey }),
        );
        const bodyStr  = (await s3Result.Body?.transformToString('utf-8')) ?? '{}';
        const parsed   = JSON.parse(bodyStr);
        transcript     = parsed?.results?.transcripts?.[0]?.transcript ?? '';
        duration       = parsed?.results?.audio_duration as number | undefined;
        completed      = true;
        console.log(`[Transcribe] Job completed. Transcript length: ${transcript.length} chars`);
        break;
      }

      if (status === 'FAILED') {
        const reason = MedicalTranscriptionJob?.FailureReason ?? 'Unknown error';
        throw new Error(`Amazon Transcribe Medical job failed: ${reason}`);
      }

      // status is QUEUED or IN_PROGRESS — continue polling
    }

    if (!completed) {
      throw new Error(
        'Transcription job timed out after 3 minutes. ' +
        'Please try a shorter recording or enter the transcript manually.',
      );
    }

    // ── Step 5 · Cleanup — delete temporary audio object from S3 ─────────────
    //   Non-fatal: S3 lifecycle rules will catch any missed deletions.
    await s3Client
      .send(new DeleteObjectCommand({ Bucket: bucketName, Key: audioKey }))
      .catch((err) => console.warn('[Transcribe] Could not delete temp audio:', err.message));

    // ── Step 6 · Return transcript to frontend ────────────────────────────────
    res.json({
      success: true,
      data: {
        transcript,
        language:  'en-US',
        duration,
        provider:  'Amazon Transcribe Medical',
        specialty: 'PRIMARYCARE',
        model:     'amazon-transcribe-medical-v1',
      },
    });
  } catch (error: any) {
    // Best-effort S3 cleanup on error path
    await s3Client
      .send(new DeleteObjectCommand({ Bucket: bucketName, Key: audioKey }))
      .catch(() => { /* ignore cleanup errors */ });

    handleControllerError(res, error, 'Failed to transcribe audio');
  }
};
