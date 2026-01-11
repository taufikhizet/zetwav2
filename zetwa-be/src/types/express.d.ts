import { Request } from 'express';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      apiKeyId?: string;
      authType?: 'jwt' | 'apikey';
      permissions?: string[];
    }
  }
}

// Route parameter interfaces
export interface SessionIdParams {
  sessionId: string;
}

export interface WebhookIdParams extends SessionIdParams {
  webhookId: string;
}

export interface ApiKeyIdParams {
  keyId: string;
}

export interface MessageIdParams extends SessionIdParams {
  messageId: string;
}

// Typed request with params
export type TypedRequest<P = {}, B = unknown> = Request<P, unknown, B>;
