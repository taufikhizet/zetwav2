import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  HOST: z.string().default('0.0.0.0'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // API Key
  API_KEY_PREFIX: z.string().default('zetwa_'),

  // WhatsApp
  WA_SESSION_PATH: z.string().default('./wa-sessions'),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  WA_HEADLESS: z.string().transform((v) => v === 'true').default('true'),

  // Webhook
  WEBHOOK_TIMEOUT: z.string().transform(Number).default('30000'),
  WEBHOOK_RETRY_ATTEMPTS: z.string().transform(Number).default('3'),
  WEBHOOK_RETRY_DELAY: z.string().transform(Number).default('5000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('16777216'),
  UPLOAD_PATH: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',

  server: {
    port: parsed.data.PORT,
    host: parsed.data.HOST,
    frontendUrl: parsed.data.FRONTEND_URL,
  },

  database: {
    url: parsed.data.DATABASE_URL,
  },

  redis: {
    url: parsed.data.REDIS_URL,
  },

  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },

  apiKey: {
    prefix: parsed.data.API_KEY_PREFIX,
  },

  whatsapp: {
    sessionPath: parsed.data.WA_SESSION_PATH,
    puppeteerPath: parsed.data.PUPPETEER_EXECUTABLE_PATH,
    headless: parsed.data.WA_HEADLESS,
  },

  webhook: {
    timeout: parsed.data.WEBHOOK_TIMEOUT,
    retryAttempts: parsed.data.WEBHOOK_RETRY_ATTEMPTS,
    retryDelay: parsed.data.WEBHOOK_RETRY_DELAY,
  },

  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    maxRequests: parsed.data.RATE_LIMIT_MAX_REQUESTS,
  },

  logging: {
    level: parsed.data.LOG_LEVEL,
  },

  upload: {
    maxFileSize: parsed.data.MAX_FILE_SIZE,
    path: parsed.data.UPLOAD_PATH,
  },
} as const;

export type Config = typeof config;
