import * as argon2 from 'argon2';
import { nanoid } from 'nanoid';
import * as crypto from 'crypto';
import { config } from '../config/index.js';

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
};

export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
};

// API Key generation
export const generateApiKey = (): string => {
  const randomPart = nanoid(32);
  return `${config.apiKey.prefix}${randomPart}`;
};

export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

// Token generation
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// ID generation
export const generateId = (prefix?: string): string => {
  const id = nanoid(21);
  return prefix ? `${prefix}_${id}` : id;
};

// Webhook signature
export const generateWebhookSignature = (payload: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

// Utility functions
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const parsePhoneNumber = (number: string): string => {
  // Remove all non-numeric characters
  let cleaned = number.replace(/\D/g, '');

  // Handle Indonesian numbers
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  // Ensure it ends with @c.us for WhatsApp
  if (!cleaned.endsWith('@c.us') && !cleaned.endsWith('@g.us')) {
    cleaned = `${cleaned}@c.us`;
  }

  return cleaned;
};

export const formatPhoneNumber = (waId: string): string => {
  // Remove @c.us or @g.us suffix
  return waId.replace(/@[cg]\.us$/, '');
};

export const isGroupId = (waId: string): boolean => {
  return waId.endsWith('@g.us');
};

export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const bytesToSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

export const maskString = (str: string, visibleChars: number = 4): string => {
  if (str.length <= visibleChars * 2) {
    return '*'.repeat(str.length);
  }
  return str.slice(0, visibleChars) + '*'.repeat(str.length - visibleChars * 2) + str.slice(-visibleChars);
};
