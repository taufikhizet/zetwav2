/**
 * API Key Module - Main Service
 * 
 * Business logic for API key management.
 */

import { prisma } from '../../lib/prisma.js';
import { generateApiKey, hashApiKey } from '../../utils/helpers.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { createLogger } from '../../utils/logger.js';
import {
  type CreateApiKeyInput,
  type UpdateApiKeyInput,
  type ValidateKeyResult,
  type ApiKeyStats,
  API_KEY_SELECT_FIELDS,
  DEFAULT_SCOPES,
} from './api-key.types.js';
import {
  validateApiKeyName,
  validateScopes,
  validateDescription,
  validateExpiresAt,
  isValidKeyFormat,
  hasScope,
} from './api-key.validation.js';

const logger = createLogger('api-key-service');

// ============================================
// API KEY SERVICE CLASS
// ============================================

export class ApiKeyService {
  /**
   * Create a new API key
   * Returns the full key ONLY on creation - it cannot be retrieved again
   */
  async create(userId: string, input: CreateApiKeyInput) {
    // Validate inputs
    const name = validateApiKeyName(input.name);
    const description = validateDescription(input.description);
    const scopes = input.scopes ? validateScopes(input.scopes) : DEFAULT_SCOPES;
    const expiresAt = validateExpiresAt(input.expiresAt);

    // Check for duplicate name
    const existingKey = await prisma.apiKey.findFirst({
      where: { userId, name },
    });

    if (existingKey) {
      throw new ForbiddenError('An API key with this name already exists');
    }

    // Generate API key
    const key = generateApiKey();
    const keyHash = hashApiKey(key);
    const keyPrefix = key.slice(0, 12);
    const keySuffix = key.slice(-4);

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        description,
        keyPrefix,
        keyHash,
        keySuffix,
        userId,
        scopes,
        expiresAt,
      },
      select: API_KEY_SELECT_FIELDS,
    });

    logger.info({ userId, apiKeyId: apiKey.id, scopes }, 'API key created');

    return {
      ...apiKey,
      key,
      keyPreview: `${keyPrefix}...${keySuffix}`,
    };
  }

  /**
   * List all API keys for a user
   */
  async list(userId: string) {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: API_KEY_SELECT_FIELDS,
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map((key) => ({
      ...key,
      keyPreview: `${key.keyPrefix}...${key.keySuffix}`,
    }));
  }

  /**
   * Get a single API key by ID
   */
  async getById(userId: string, keyId: string) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: {
        ...API_KEY_SELECT_FIELDS,
        userId: true,
      },
    });

    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    const { userId: _, ...keyData } = apiKey;

    return {
      ...keyData,
      keyPreview: `${apiKey.keyPrefix}...${apiKey.keySuffix}`,
    };
  }

  /**
   * Update an API key
   */
  async update(userId: string, keyId: string, data: UpdateApiKeyInput) {
    await this.getById(userId, keyId);

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      const name = validateApiKeyName(data.name);

      // Check for duplicate name
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          userId,
          name,
          id: { not: keyId },
        },
      });

      if (existingKey) {
        throw new ForbiddenError('An API key with this name already exists');
      }

      updateData.name = name;
    }

    if (data.description !== undefined) {
      updateData.description = validateDescription(data.description);
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const apiKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: updateData,
      select: API_KEY_SELECT_FIELDS,
    });

    logger.info({ userId, apiKeyId: keyId, changes: Object.keys(updateData) }, 'API key updated');

    return {
      ...apiKey,
      keyPreview: `${apiKey.keyPrefix}...${apiKey.keySuffix}`,
    };
  }

  /**
   * Delete an API key
   */
  async delete(userId: string, keyId: string) {
    await this.getById(userId, keyId);

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    logger.info({ userId, apiKeyId: keyId }, 'API key deleted');

    return { success: true };
  }

  /**
   * Validate an API key and return user info if valid
   */
  async validateKey(key: string, ipAddress?: string): Promise<ValidateKeyResult | null> {
    if (!isValidKeyFormat(key)) {
      return null;
    }

    const keyHash = hashApiKey(key);

    const apiKey = await prisma.apiKey.findFirst({
      where: { keyHash },
      include: { user: true },
    });

    if (!apiKey) {
      logger.debug({ keyPrefix: key.slice(0, 12) }, 'API key not found');
      return null;
    }

    if (!apiKey.isActive) {
      logger.debug({ apiKeyId: apiKey.id }, 'API key is inactive');
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      logger.debug({ apiKeyId: apiKey.id }, 'API key has expired');
      return null;
    }

    if (!apiKey.user.isActive) {
      logger.debug({ apiKeyId: apiKey.id, userId: apiKey.userId }, 'User is inactive');
      return null;
    }

    // Update usage tracking asynchronously
    this.updateUsageTracking(apiKey.id, ipAddress).catch((err) => {
      logger.error({ err, apiKeyId: apiKey.id }, 'Failed to update usage tracking');
    });

    return {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      scopes: apiKey.scopes,
    };
  }

  /**
   * Regenerate an API key
   */
  async regenerate(userId: string, keyId: string) {
    await this.getById(userId, keyId);

    const key = generateApiKey();
    const keyHash = hashApiKey(key);
    const keyPrefix = key.slice(0, 12);
    const keySuffix = key.slice(-4);

    const apiKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        keyPrefix,
        keyHash,
        keySuffix,
        usageCount: 0,
        lastUsedAt: null,
        lastIpAddress: null,
      },
      select: API_KEY_SELECT_FIELDS,
    });

    logger.info({ userId, apiKeyId: keyId }, 'API key regenerated');

    return {
      ...apiKey,
      key,
      keyPreview: `${keyPrefix}...${keySuffix}`,
    };
  }

  /**
   * Update scopes for an API key
   */
  async updateScopes(userId: string, keyId: string, scopes: string[]) {
    await this.getById(userId, keyId);

    const validScopes = validateScopes(scopes);

    const apiKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: { scopes: validScopes },
      select: API_KEY_SELECT_FIELDS,
    });

    logger.info({ userId, apiKeyId: keyId, scopes: validScopes }, 'API key scopes updated');

    return {
      ...apiKey,
      keyPreview: `${apiKey.keyPrefix}...${apiKey.keySuffix}`,
    };
  }

  /**
   * Get API key statistics
   */
  async getStats(userId: string): Promise<ApiKeyStats> {
    const now = new Date();

    const [totalKeys, activeKeys, expiredKeys, totalUsage] = await Promise.all([
      prisma.apiKey.count({ where: { userId } }),
      prisma.apiKey.count({ where: { userId, isActive: true } }),
      prisma.apiKey.count({
        where: {
          userId,
          expiresAt: { lt: now },
        },
      }),
      prisma.apiKey.aggregate({
        where: { userId },
        _sum: { usageCount: true },
      }),
    ]);

    return {
      totalKeys,
      activeKeys,
      inactiveKeys: totalKeys - activeKeys,
      expiredKeys,
      totalUsage: totalUsage._sum.usageCount || 0,
    };
  }

  /**
   * Revoke all API keys for a user
   */
  async revokeAll(userId: string) {
    const result = await prisma.apiKey.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    logger.info({ userId, count: result.count }, 'All API keys revoked');

    return { revokedCount: result.count };
  }

  /**
   * Delete expired API keys (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    const result = await prisma.apiKey.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Deleted expired API keys');
    }

    return result.count;
  }

  /**
   * Check if a scope is allowed
   */
  hasScope(scopes: string[], requiredScope: string): boolean {
    return hasScope(scopes, requiredScope);
  }

  /**
   * Update usage tracking (called asynchronously)
   */
  private async updateUsageTracking(apiKeyId: string, ipAddress?: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        lastUsedAt: new Date(),
        lastIpAddress: ipAddress || null,
        usageCount: { increment: 1 },
      },
    });
  }
}

// Singleton instance
export const apiKeyService = new ApiKeyService();
