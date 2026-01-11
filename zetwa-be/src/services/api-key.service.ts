import { prisma } from '../lib/prisma.js';
import { generateApiKey, hashApiKey } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('api-key-service');

export interface CreateApiKeyInput {
  name: string;
  permissions?: string[];
  expiresAt?: Date;
}

export class ApiKeyService {
  async create(userId: string, input: CreateApiKeyInput) {
    const { name, permissions = ['read', 'write'], expiresAt } = input;

    // Generate API key
    const key = generateApiKey();
    const keyHash = hashApiKey(key);

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: key.slice(0, 12) + '...' + key.slice(-4), // Store masked version for display
        keyHash,
        userId,
        permissions,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    logger.info({ userId, apiKeyId: apiKey.id }, 'API key created');

    // Return the full key only once
    return {
      ...apiKey,
      key, // Return full key only on creation
    };
  }

  async list(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        key: true, // This is the masked version
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(userId: string, keyId: string) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        userId: true,
      },
    });

    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return apiKey;
  }

  async update(userId: string, keyId: string, data: { name?: string; isActive?: boolean }) {
    // Verify ownership
    await this.getById(userId, keyId);

    return prisma.apiKey.update({
      where: { id: keyId },
      data,
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async delete(userId: string, keyId: string) {
    // Verify ownership
    await this.getById(userId, keyId);

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    logger.info({ userId, apiKeyId: keyId }, 'API key deleted');
  }

  async validateKey(key: string): Promise<{
    userId: string;
    apiKeyId: string;
    permissions: string[];
  } | null> {
    const keyHash = hashApiKey(key);

    const apiKey = await prisma.apiKey.findFirst({
      where: { keyHash },
      include: { user: true },
    });

    if (!apiKey) {
      return null;
    }

    if (!apiKey.isActive) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    if (!apiKey.user.isActive) {
      return null;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      permissions: apiKey.permissions,
    };
  }

  async regenerate(userId: string, keyId: string) {
    // Verify ownership
    await this.getById(userId, keyId);

    const key = generateApiKey();
    const keyHash = hashApiKey(key);

    const apiKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        key: key.slice(0, 12) + '...' + key.slice(-4),
        keyHash,
      },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    logger.info({ userId, apiKeyId: keyId }, 'API key regenerated');

    return {
      ...apiKey,
      key, // Return full key only on regeneration
    };
  }
}

export const apiKeyService = new ApiKeyService();
