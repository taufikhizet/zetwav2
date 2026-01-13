/**
 * Auth Service - User Registration and Login
 */

import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../utils/helpers.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiration,
} from '../jwt.service.js';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import type { RegisterInput, LoginInput, AuthResponse } from './types.js';

/**
 * Register a new user
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, name } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Validate password strength
  if (password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
    },
  });

  logger.info({ userId: user.id, email: user.email }, 'User registered');

  // Generate tokens
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user.id, user.email),
    generateRefreshToken(user.id, user.email),
  ]);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiration(),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Login user
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }

  // Verify password
  const isValidPassword = await verifyPassword(user.password, password);

  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logger.info({ userId: user.id, email: user.email }, 'User logged in');

  // Generate tokens
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user.id, user.email),
    generateRefreshToken(user.id, user.email),
  ]);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiration(),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
}
