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
import { emailService } from '../email.service.js';
import { nanoid } from 'nanoid';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

// Initialize Google Client (You would typically put the Client ID in env)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Request Password Reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return success even if email doesn't exist (Security Best Practice)
  // to prevent email enumeration attacks
  if (!user) {
    logger.info({ email }, 'Password reset requested for non-existent email');
    return;
  }

  // Generate reset token
  const resetToken = nanoid(32);
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    },
  });

  await emailService.sendPasswordResetEmail(user.email, resetToken);
}

/**
 * Reset Password
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  if (newPassword.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Revoke all sessions for security
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });
}

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
  const verificationToken = nanoid(32);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      verificationToken,
      isVerified: false, // Force verification
    },
  });

  logger.info({ userId: user.id, email: user.email }, 'User registered');

  // Send verification email
  await emailService.sendVerificationEmail(user.email, verificationToken);

  // Generate tokens (User is logged in but unverified)
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
      isOnboardingCompleted: user.isOnboardingCompleted,
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
      isOnboardingCompleted: user.isOnboardingCompleted,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Verify Email
 */
export async function verifyEmail(token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    throw new BadRequestError('Invalid verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      isActive: true,
    },
  });
}

/**
 * Resend Verification Email
 */
export async function resendVerification(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (user.isVerified) {
    throw new BadRequestError('User already verified');
  }

  const verificationToken = nanoid(32);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken }
  });

  await emailService.sendVerificationEmail(user.email, verificationToken);
}

/**
 * Social Login
 */
export async function socialLogin(provider: 'google' | 'github', token: string): Promise<AuthResponse> {
  let email: string;
  let name: string;
  let googleId: string | undefined;
  let githubId: string | undefined;
  let avatar: string | undefined;

  if (provider === 'google') {
    // Verify Google Token
    // For simplicity/dev if no client ID is set, we might skip verify or use a simple fetch
    // But let's try to do it right if possible, or fallback to fetching userinfo endpoint
    try {
        // Option 1: Using google-auth-library (Requires Client ID)
        // const ticket = await googleClient.verifyIdToken({
        //   idToken: token,
        //   audience: process.env.GOOGLE_CLIENT_ID,
        // });
        // const payload = ticket.getPayload();
        
        // Option 2: Simple UserInfo endpoint (easier for generic tokens)
        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        email = res.data.email;
        name = res.data.name;
        googleId = res.data.sub;
        avatar = res.data.picture;
    } catch (err) {
        throw new UnauthorizedError('Invalid Google Token');
    }
  } else {
    // GitHub
    try {
        const res = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${token}` }
        });
        email = res.data.email; // Note: Email might be private, handled below
        name = res.data.name || res.data.login;
        githubId = res.data.id.toString();
        avatar = res.data.avatar_url;

        if (!email) {
             // Fetch emails if private
             const emailsRes = await axios.get('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const primary = emailsRes.data.find((e: any) => e.primary);
            email = primary ? primary.email : emailsRes.data[0].email;
        }
    } catch (err) {
        throw new UnauthorizedError('Invalid GitHub Token');
    }
  }

  // Find or Create User
  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (user) {
    // Link account if not linked
    if (provider === 'google' && !user.googleId) {
        await prisma.user.update({ where: { id: user.id }, data: { googleId } });
    }
    if (provider === 'github' && !user.githubId) {
        await prisma.user.update({ where: { id: user.id }, data: { githubId } });
    }
  } else {
    // Create new user (Social users are verified by default)
    user = await prisma.user.create({
        data: {
            email: email.toLowerCase(),
            name,
            password: await hashPassword(nanoid()), // Random password
            isVerified: true,
            isOnboardingCompleted: false, // Still need onboarding
            googleId,
            githubId,
            avatar,
        }
    });
  }

  // Generate tokens
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user.id, user.email),
    generateRefreshToken(user.id, user.email),
  ]);

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
      isOnboardingCompleted: user.isOnboardingCompleted,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Complete Onboarding
 */
export async function completeOnboarding(userId: string, data: { profession: string; usagePurpose: string; referralSource: string }): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            profession: data.profession,
            usagePurpose: data.usagePurpose,
            referralSource: data.referralSource,
            isOnboardingCompleted: true,
        }
    });
}
