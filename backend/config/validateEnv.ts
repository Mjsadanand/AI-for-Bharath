// ─── Startup Environment Validation ──────────────────────────────────────────
//
// Validates all required environment variables before the server starts.
// Fail fast with clear messages rather than cryptic runtime errors.

const REQUIRED_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
] as const;

const RECOMMENDED_VARS = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
] as const;

export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // JWT_SECRET strength check
  if (process.env.JWT_SECRET) {
    const secret = process.env.JWT_SECRET;
    if (secret.length < 32 || secret === 'your_super_secret_key') {
      console.warn(
        '⚠️  WARNING: JWT_SECRET is weak or default. Generate a strong secret: `openssl rand -base64 64`'
      );
    }
  }

  // NODE_ENV check
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'; // Default to production (secure)
    console.warn('⚠️  NODE_ENV not set — defaulting to "production"');
  }

  // Check AWS vars (warn only — agents won't work but server can still run)
  for (const varName of RECOMMENDED_VARS) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Set them in .env or environment before starting the server.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn(
      `⚠️  Missing optional environment variables: ${warnings.join(', ')}`
    );
    console.warn('   AI agent features will not work without AWS credentials.');
  }
}
