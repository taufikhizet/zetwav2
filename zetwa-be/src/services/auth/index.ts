/**
 * Auth Service
 * Main entry point for authentication
 */

// Export types
export type {
  RegisterInput,
  LoginInput,
  UserProfile,
  AuthResponse,
  TokenPair,
  UpdateProfileInput,
} from './types.js';

// Import modules
import * as authentication from './authentication.js';
import * as tokens from './tokens.js';
import * as profile from './profile.js';

/**
 * Auth Service Class
 * Combines all authentication functionality
 */
export class AuthService {
  // Authentication
  register = authentication.register;
  login = authentication.login;
  verifyEmail = authentication.verifyEmail;
  resendVerification = authentication.resendVerification;
  requestPasswordReset = authentication.requestPasswordReset;
  resetPassword = authentication.resetPassword;
  socialLogin = authentication.socialLogin;
  completeOnboarding = authentication.completeOnboarding;

  // Token management
  refreshTokens = tokens.refreshTokens;
  logout = tokens.logout;
  logoutAll = tokens.logoutAll;

  // Profile management
  getProfile = profile.getProfile;
  updateProfile = profile.updateProfile;
  changePassword = profile.changePassword;
}

export const authService = new AuthService();
