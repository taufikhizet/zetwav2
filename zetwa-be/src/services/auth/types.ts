/**
 * Auth Service Types
 */

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isVerified: boolean;
  isOnboardingCompleted: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
}
