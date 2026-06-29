import { z, ZodError } from 'zod';
import dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config();

const logger = new Logger('Config');

/* ─────────────────────────────────────────────
   Environment Schema (Zod)
───────────────────────────────────────────── */
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Application
  PORT: z.string().default('2998'),
  DB_PATH: z.string().default('./data/rsnra-auth.db'),
  UPLOADS_DIR: z.string().default('./uploads'),

  // Security
  JWT_SECRET: z.string().min(16, 'JWT_SECRET is required (min 16 chars)'),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:2999,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004'
    ),

  // Admin bootstrap
  ADMIN_EMAIL: z.string().default('admin@rsnra.local'),
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is required'),

  // Cookies
  COOKIE_DOMAIN: z.string().optional(),

  // Public base URL for the auth API (used to construct absolute avatar URLs
  // that work on other services like rsnra-link and resomd).
  AUTH_API_PUBLIC_URL: z.string().default('http://localhost:2998'),

  // OAuth client secrets (first-party clients seeded on first boot)
  OAUTH_CLIENT_RSNRA_LINK_SECRET: z.string().optional(),
  OAUTH_CLIENT_RESOMD_SECRET: z.string().optional(),
});

export type EnvVars = z.infer<typeof envSchema>;

/* ─────────────────────────────────────────────
   Validate Environment Variables
───────────────────────────────────────────── */
let validatedEnv: EnvVars;

try {
  validatedEnv = envSchema.parse(process.env);
  logger.log('✅ Environment variables validated successfully');
} catch (error) {
  if (error instanceof ZodError) {
    logger.error('❌ Invalid environment variables:');
    error.issues.forEach(err => {
      logger.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    logger.error('❌ Environment validation failed with unknown error', error);
  }
  throw new Error('Environment validation failed', { cause: error });
}

export const config = validatedEnv;

/* ─────────────────────────────────────────────
   Validation helper for NestJS ConfigModule
───────────────────────────────────────────── */
export const validateEnv = () => config;
