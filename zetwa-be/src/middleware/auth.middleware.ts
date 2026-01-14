import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.service.js';
import { apiKeyService } from '../services/api-key/index.js';
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
      scopes?: string[];
    }
  }
}

/**
 * Get client IP address from request
 */
const getClientIp = (req: Request): string | undefined => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips?.trim();
  }
  return req.ip || req.socket?.remoteAddress;
};

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
      // JWT users get all scopes (admin level)
      req.scopes = ['*'];

      return next();
    }

    // Check for API Key in Authorization header
    if (authHeader.startsWith('ApiKey ') || authHeader.startsWith('X-API-Key ')) {
      const apiKey = authHeader.startsWith('ApiKey ') 
        ? authHeader.slice(7) 
        : authHeader.slice(10);
      
      const ipAddress = getClientIp(req);
      const result = await apiKeyService.validateKey(apiKey, ipAddress);

      if (!result) {
        throw new UnauthorizedError('Invalid API key');
      }

      req.userId = result.userId;
      req.apiKeyId = result.apiKeyId;
      req.authType = 'apikey';
      req.scopes = result.scopes;

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

    const ipAddress = getClientIp(req);
    const result = await apiKeyService.validateKey(apiKey, ipAddress);

    if (!result) {
      throw new UnauthorizedError('Invalid API key');
    }

    req.userId = result.userId;
    req.apiKeyId = result.apiKeyId;
    req.authType = 'apikey';
    req.scopes = result.scopes;

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
 * Scope check middleware factory
 * Validates that the request has the required scope(s)
 */
export const requireScope = (...requiredScopes: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userScopes = req.scopes || [];

    // Check if user has wildcard (admin level)
    if (userScopes.includes('*')) {
      return next();
    }

    const hasAllScopes = requiredScopes.every((scope) => {
      // Check exact match
      if (userScopes.includes(scope)) {
        return true;
      }

      // Check resource wildcard (e.g., 'sessions:*' matches 'sessions:read')
      const [resource] = scope.split(':');
      if (userScopes.includes(`${resource}:*`)) {
        return true;
      }

      return false;
    });

    if (!hasAllScopes) {
      return next(new ForbiddenError(`Missing required scope(s): ${requiredScopes.join(', ')}`));
    }

    next();
  };
};

/**
 * Legacy permission check middleware (for backward compatibility)
 * @deprecated Use requireScope instead
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userScopes = req.scopes || [];

    // Check if user has wildcard (admin level)
    if (userScopes.includes('*')) {
      return next();
    }

    // Map old permissions to new scopes
    const scopeMap: Record<string, string[]> = {
      read: ['sessions:read', 'messages:read', 'contacts:read', 'groups:read', 'media:read', 'webhooks:read'],
      write: ['sessions:write', 'messages:send', 'contacts:write', 'groups:write', 'media:write', 'webhooks:write'],
      admin: ['*'],
    };

    const hasPermission = requiredPermissions.every((perm) => {
      const requiredScopes = scopeMap[perm] || [];
      return requiredScopes.some((scope) => userScopes.includes(scope));
    });

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
