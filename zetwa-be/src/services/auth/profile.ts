/**
 * Auth Service - User Profile Management
 */

import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../utils/helpers.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { logoutAll } from './tokens.js';
import type { UpdateProfileInput } from './types.js';

/**
 * Get user profile
 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      isVerified: true,
      isOnboardingCompleted: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          sessions: true,
          apiKeys: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      isVerified: true,
      isOnboardingCompleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isValidPassword = await verifyPassword(user.password, currentPassword);

  if (!isValidPassword) {
    throw new BadRequestError('Current password is incorrect');
  }

  if (newPassword.length < 8) {
    throw new BadRequestError('New password must be at least 8 characters');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Revoke all refresh tokens for security
  await logoutAll(userId);

  logger.info({ userId }, 'Password changed');
}
