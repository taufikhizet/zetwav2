/**
 * API Key Module - Index
 * 
 * Re-exports all API key functionality from a single entry point.
 */

// Service
export { ApiKeyService, apiKeyService } from './api-key.service.js';

// Types & Constants
export {
  API_KEY_SCOPES,
  SCOPE_DESCRIPTIONS,
  SCOPE_CATEGORIES,
  DEFAULT_SCOPES,
  API_KEY_CONFIG,
  API_KEY_SELECT_FIELDS,
  type ApiKeyScope,
  type CreateApiKeyInput,
  type UpdateApiKeyInput,
  type ValidateKeyResult,
  type ApiKeyStats,
} from './api-key.types.js';

// Validation utilities
export {
  validateApiKeyName,
  validateScopes,
  validateDescription,
  validateExpiresAt,
  isValidKeyFormat,
  hasScope,
} from './api-key.validation.js';
