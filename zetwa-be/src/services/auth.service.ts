/**
 * Auth Service - Re-export from folder
 * @deprecated Import directly from './auth/index.js' instead
 */

export { authService, AuthService } from './auth/index.js';
export type {
  RegisterInput,
  LoginInput,
  UserProfile,
  AuthResponse,
  TokenPair,
  UpdateProfileInput,
} from './auth/types.js';
