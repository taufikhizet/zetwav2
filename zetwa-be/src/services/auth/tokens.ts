/**
 * Auth Service - Token Management
 */

import { prisma } from '../../lib/prisma.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiration,
} from '../jwt.service.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import type { TokenPair } from './types.js';

/**
 * Refresh access and refresh tokens
 */
export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  // Verify the refresh token
  const payload = await verifyRefreshToken(refreshToken);

  // Use transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    // Check if refresh token exists and is not revoked
    const storedToken = await tx.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Revoke old refresh token (rotation)
    await tx.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const [newAccessToken, newRefreshToken] = await Promise.all([
      generateAccessToken(payload.userId, payload.email),
      generateRefreshToken(payload.userId, payload.email),
    ]);

    // Store new refresh token
    await tx.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: payload.userId,
        expiresAt: getRefreshTokenExpiration(),
      },
    });

    logger.debug({ userId: payload.userId }, 'Tokens refreshed');

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  });
}

/**
 * Logout user (revoke single refresh token)
 */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revokedAt: new Date() },
  });
}

/**
 * Logout all sessions for user
 */
export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  logger.info({ userId }, 'All sessions logged out');
}
