/**
 * Session CRUD - Create Operations
 * Handles session creation and inline webhook setup
 */

import { WebhookEvent } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import { whatsappService } from '../../whatsapp/index.js';
import { ConflictError } from '../../../utils/errors.js';
import { logger } from '../../../utils/logger.js';
import { normalizeEvents, headersToObject } from '../utils.js';
import { ALL_WAHA_EVENTS, DEFAULT_WEBHOOK_TIMEOUT, DEFAULT_RETRY_CONFIG } from '../constants.js';
import type { CreateSessionInput, SessionConfig } from '../types.js';

/**
 * Create webhooks from inline webhook config
 * Internal use - called during session creation
 */
export async function createWebhooksFromConfig(sessionId: string, webhooks: SessionConfig['webhooks']) {
  if (!webhooks || webhooks.length === 0) return [];
  
  const createdWebhooks = [];
  
  for (const webhookConfig of webhooks) {
    if (!webhookConfig.url) continue;
    
    try {
      // Map string events to WebhookEvent enum
      // If '*' or 'ALL' is present, expand to all individual WAHA events
      let events: WebhookEvent[];
      
      if (!webhookConfig.events?.length) {
        // Default to all events
        events = ALL_WAHA_EVENTS;
      } else if (webhookConfig.events.some(e => e === '*' || e === 'ALL')) {
        // Wildcard - expand to all WAHA events
        events = ALL_WAHA_EVENTS;
      } else {
        // Map individual events
        events = normalizeEvents(webhookConfig.events);
      }
      
      // Remove duplicates
      const uniqueEvents = [...new Set(events)];
      
      // Generate webhook name: use provided name, fallback to URL hostname
      let webhookName = 'Webhook';
      if (webhookConfig.name && webhookConfig.name.trim()) {
        webhookName = webhookConfig.name.trim();
      } else {
        try {
          webhookName = new URL(webhookConfig.url).hostname || 'Webhook';
        } catch {
          webhookName = 'Webhook';
        }
      }
      
      // Convert timeout from seconds to milliseconds, default 30000ms
      const timeoutMs = webhookConfig.timeout 
        ? webhookConfig.timeout * 1000 
        : DEFAULT_WEBHOOK_TIMEOUT;
      
      // Build custom headers JSON
      const customHeaders = headersToObject(webhookConfig.customHeaders);
      
      // Convert inline webhook config to database format
      const webhook = await prisma.webhook.create({
        data: {
          name: webhookName,
          url: webhookConfig.url,
          sessionId,
          events: uniqueEvents,
          // Store custom headers as separate column (new schema)
          customHeaders: customHeaders ?? undefined,
          // Store HMAC secret
          secret: webhookConfig.hmac?.key ?? null,
          // Store retry config in dedicated columns (new schema)
          retryAttempts: webhookConfig.retries?.attempts ?? DEFAULT_RETRY_CONFIG.attempts,
          retryDelay: webhookConfig.retries?.delaySeconds ?? DEFAULT_RETRY_CONFIG.delaySeconds,
          retryPolicy: webhookConfig.retries?.policy ?? DEFAULT_RETRY_CONFIG.policy,
          timeout: timeoutMs,
        },
      });
      
      createdWebhooks.push(webhook);
      logger.info({ webhookId: webhook.id, sessionId, url: webhookConfig.url, name: webhookName }, 'Inline webhook created');
    } catch (error) {
      logger.warn({ sessionId, url: webhookConfig.url, error }, 'Failed to create inline webhook');
    }
  }
  
  return createdWebhooks;
}

/**
 * Create a new WhatsApp session
 */
export async function create(userId: string, input: CreateSessionInput) {
  const { name, description, config, start = true } = input;

  // Check if session name already exists for this user
  const existing = await prisma.waSession.findUnique({
    where: {
      userId_name: {
        userId,
        name,
      },
    },
  });

  if (existing) {
    throw new ConflictError(`Session with name "${name}" already exists`);
  }

  // Create session in database with dedicated config columns
  const session = await prisma.waSession.create({
    data: {
      name,
      description,
      userId,
      status: start ? 'INITIALIZING' : 'FAILED', // Use FAILED as "STOPPED" equivalent
      
      // Debug mode
      debug: config?.debug ?? false,
      
      // Client configuration
      deviceName: config?.client?.deviceName,
      browserName: config?.client?.browserName,
      
      // Proxy configuration
      proxyServer: config?.proxy?.server,
      proxyUsername: config?.proxy?.username,
      proxyPassword: config?.proxy?.password,
      
      // Event ignore configuration
      ignoreStatus: config?.ignore?.status ?? false,
      ignoreGroups: config?.ignore?.groups ?? false,
      ignoreChannels: config?.ignore?.channels ?? false,
      ignoreBroadcast: config?.ignore?.broadcast ?? false,
      
      // NOWEB engine configuration
      nowebStoreEnabled: config?.noweb?.store?.enabled ?? true,
      nowebFullSync: config?.noweb?.store?.fullSync ?? false,
      nowebMarkOnline: config?.noweb?.markOnline ?? true,
      
      // User custom metadata only (not config)
      metadata: config?.metadata ? JSON.parse(JSON.stringify(config.metadata)) : undefined,
    },
  });

  // Create webhooks from inline config if provided
  if (config?.webhooks && config.webhooks.length > 0) {
    await createWebhooksFromConfig(session.id, config.webhooks);
  }

  // Start WhatsApp client if start option is true
  if (start) {
    try {
      await whatsappService.createSession(session.id, userId, config);
    } catch (error: unknown) {
      // If WhatsApp client fails, delete the database record and webhooks
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ sessionId: session.id, error: errorMessage }, 'Failed to start session, cleaning up');
      
      // Delete webhooks first (cascade should handle this, but be explicit)
      await prisma.webhook.deleteMany({ where: { sessionId: session.id } });
      await prisma.waSession.delete({ where: { id: session.id } });
      
      // Re-throw with better error message
      throw error;
    }
  }

  logger.info({ sessionId: session.id, userId, start }, 'Session created');

  return session;
}
