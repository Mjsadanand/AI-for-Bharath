import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { validateEnvironment } from './config/validateEnv.js';

import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import clinicalDocRoutes from './routes/clinicalDocRoutes.js';
import translatorRoutes from './routes/translatorRoutes.js';
import predictiveRoutes from './routes/predictiveRoutes.js';
import researchRoutes from './routes/researchRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import pipelineRoutes from './routes/pipelineRoutes.js';
import agentRoutes from './routes/agentRoutes.js';

import { globalLimiter, authLimiter, sanitizeInput } from './middleware/security.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

dotenv.config();

// ── Validate environment before anything else ───────────────────────────────
validateEnvironment();

// ── Process-level error handlers ────────────────────────────────────────────
process.on('unhandledRejection', (err: any) => {
  console.error('❌ Unhandled Promise Rejection:', err?.message || err);
  // In production, log to monitoring service then shut down gracefully
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// ── Bootstrap ───────────────────────────────────────────────────────────────

async function startServer() {
  // Connect to MongoDB (await ensures failure prevents server start)
  await connectDB();

  const app = express();

  // ── Security Headers (Helmet) ─────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // ── CORS (strict origin validation) ───────────────────────────────────
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS: Origin not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Body parsing (reasonable size limits) ─────────────────────────────
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // ── Global security middleware ────────────────────────────────────────
  app.use(globalLimiter);     // Rate limiting
  app.use(sanitizeInput);     // NoSQL injection prevention

  // ── Request logging (sanitized — no query strings with PHI) ───────────
  app.use((req, _res, next) => {
    const sanitizedUrl = req.path; // Path only, no query params
    console.log(`${new Date().toISOString()} | ${req.method} ${sanitizedUrl}`);
    next();
  });

  // ── Routes ────────────────────────────────────────────────────────────
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/clinical-docs', clinicalDocRoutes);
  app.use('/api/translator', translatorRoutes);
  app.use('/api/predictive', predictiveRoutes);
  app.use('/api/research', researchRoutes);
  app.use('/api/workflow', workflowRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/pipeline', pipelineRoutes);
  app.use('/api/agents', agentRoutes);

  // ── Health check ──────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'CARENET AI Backend',
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  });

  // ── Global error handler (safe — no internal details leaked) ──────────
  app.use(globalErrorHandler);

  // ── Start listening ───────────────────────────────────────────────────
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`🚀 CARENET AI Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      try {
        await mongoose.disconnect();
        console.log('✅ MongoDB disconnected');
      } catch (err) {
        console.error('Error during shutdown:', err);
      }
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return app;
}

const app = startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

export default app;
