import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

const accessSecretKey = new TextEncoder().encode(config.jwt.accessSecret);
const refreshSecretKey = new TextEncoder().encode(config.jwt.refreshSecret);

const parseExpiration = (exp: string): number => {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiration format: ${exp}`);

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
};

export const generateAccessToken = async (userId: string, email: string): Promise<string> => {
  const expiresIn = parseExpiration(config.jwt.accessExpiresIn);

  return new SignJWT({ userId, email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .setIssuer('zetwa')
    .setAudience('zetwa-api')
    .sign(accessSecretKey);
};

export const generateRefreshToken = async (userId: string, email: string): Promise<string> => {
  const expiresIn = parseExpiration(config.jwt.refreshExpiresIn);

  return new SignJWT({ userId, email, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .setIssuer('zetwa')
    .setAudience('zetwa-api')
    .sign(refreshSecretKey);
};

export const verifyAccessToken = async (token: string): Promise<TokenPayload> => {
  try {
    const { payload } = await jwtVerify(token, accessSecretKey, {
      issuer: 'zetwa',
      audience: 'zetwa-api',
    });

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    return payload as TokenPayload;
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = async (token: string): Promise<TokenPayload> => {
  try {
    const { payload } = await jwtVerify(token, refreshSecretKey, {
      issuer: 'zetwa',
      audience: 'zetwa-api',
    });

    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    return payload as TokenPayload;
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

export const getRefreshTokenExpiration = (): Date => {
  const expiresIn = parseExpiration(config.jwt.refreshExpiresIn);
  return new Date(Date.now() + expiresIn * 1000);
};
