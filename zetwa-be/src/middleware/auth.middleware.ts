import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../services/jwt.service.js';
import { apiKeyService } from '../services/api-key.service.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { prisma } from '../lib/prisma.js';

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

/**
 * JWT Authentication middleware
 * Validates Bearer token from Authorization header
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }

    // Check for Bearer token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = await verifyAccessToken(token);

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or deactivated');
      }

      req.userId = payload.userId;
      req.userEmail = payload.email;
      req.authType = 'jwt';
      req.permissions = ['read', 'write', 'admin'];

      return next();
    }

    // Check for API Key
    if (authHeader.startsWith('ApiKey ') || authHeader.startsWith('X-API-Key ')) {
      const apiKey = authHeader.startsWith('ApiKey ') 
        ? authHeader.slice(7) 
        : authHeader.slice(10);
      
      const result = await apiKeyService.validateKey(apiKey);

      if (!result) {
        throw new UnauthorizedError('Invalid API key');
      }

      req.userId = result.userId;
      req.apiKeyId = result.apiKeyId;
      req.authType = 'apikey';
      req.permissions = result.permissions;

      return next();
    }

    throw new UnauthorizedError('Invalid authorization format');
  } catch (error) {
    next(error);
  }
};

/**
 * API Key Authentication middleware
 * Specifically for API key auth from X-API-Key header
 */
export const authenticateApiKey = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedError('No API key provided');
    }

    const result = await apiKeyService.validateKey(apiKey);

    if (!result) {
      throw new UnauthorizedError('Invalid API key');
    }

    req.userId = result.userId;
    req.apiKeyId = result.apiKeyId;
    req.authType = 'apikey';
    req.permissions = result.permissions;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Combined authentication - accepts either JWT or API Key
 */
export const authenticateAny = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string;

  if (authHeader?.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }

  if (apiKeyHeader) {
    return authenticateApiKey(req, res, next);
  }

  if (authHeader?.startsWith('ApiKey ')) {
    return authenticate(req, res, next);
  }

  next(new UnauthorizedError('No authentication provided'));
};

/**
 * Permission check middleware factory
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userPermissions = req.permissions || [];

    const hasPermission = requiredPermissions.every(
      (perm) => userPermissions.includes(perm) || userPermissions.includes('admin')
    );

    if (!hasPermission) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Optional authentication - sets user info if token is valid
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string;

  if (!authHeader && !apiKeyHeader) {
    return next();
  }

  try {
    await authenticateAny(req, res, next);
  } catch {
    // Ignore auth errors for optional auth
    next();
  }
};
