/**
 * API Key Module - Validation Utilities
 * 
 * Validation functions for API key operations.
 */

import { BadRequestError } from '../../utils/errors.js';
import { API_KEY_SCOPES, API_KEY_CONFIG, type ApiKeyScope } from './api-key.types.js';

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate API key name
 */
export function validateApiKeyName(name: string | undefined): string {
  if (!name || name.trim().length < 3) {
    throw new BadRequestError('API key name must be at least 3 characters');
  }

  if (name.length > 100) {
    throw new BadRequestError('API key name cannot exceed 100 characters');
  }

  return name.trim();
}

/**
 * Validate and filter scopes
 */
export function validateScopes(scopes: string[]): string[] {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new BadRequestError('At least one scope is required');
  }

  const validScopes = scopes.filter((scope) =>
    API_KEY_SCOPES.includes(scope as ApiKeyScope)
  );

  if (validScopes.length === 0) {
    throw new BadRequestError(
      `Invalid scopes. Valid scopes are: ${API_KEY_SCOPES.join(', ')}`
    );
  }

  // Return unique scopes
  return [...new Set(validScopes)];
}

/**
 * Check if a scope is allowed for an API key
 */
export function hasScope(scopes: string[], requiredScope: string): boolean {
  // Check exact match
  if (scopes.includes(requiredScope)) {
    return true;
  }

  // Check wildcard (e.g., 'sessions:*' matches 'sessions:read')
  const [resource] = requiredScope.split(':');
  if (scopes.includes(`${resource}:*`)) {
    return true;
  }

  // Check full wildcard
  if (scopes.includes('*')) {
    return true;
  }

  return false;
}

/**
 * Validate API key format
 */
export function isValidKeyFormat(key: string): boolean {
  return (
    typeof key === 'string' &&
    key.startsWith(API_KEY_CONFIG.PREFIX) &&
    key.length === API_KEY_CONFIG.TOTAL_LENGTH
  );
}

/**
 * Validate description
 */
export function validateDescription(description: string | undefined): string | null {
  if (!description) return null;
  
  const trimmed = description.trim();
  if (trimmed.length > 500) {
    throw new BadRequestError('Description cannot exceed 500 characters');
  }
  
  return trimmed || null;
}

/**
 * Validate expiration date
 */
export function validateExpiresAt(expiresAt: Date | undefined): Date | null {
  if (!expiresAt) return null;
  
  const expDate = new Date(expiresAt);
  
  if (isNaN(expDate.getTime())) {
    throw new BadRequestError('Invalid expiration date');
  }
  
  if (expDate <= new Date()) {
    throw new BadRequestError('Expiration date must be in the future');
  }
  
  return expDate;
}
