import axios, { type AxiosError } from 'axios';
import * as crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { whatsappService } from './whatsapp.service.js';
import { sleep } from '../utils/helpers.js';
import type { WebhookEvent } from '@prisma/client';

const logger = createLogger('webhook-service');

export interface WebhookPayload {
  event: string;
  sessionId: string;
  timestamp: string;
  data: unknown;
}

class WebhookService {
  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners from WhatsApp service
   */
  private setupEventListeners(): void {
    // Message received
    whatsappService.on('message', async (data) => {
      await this.dispatch(data.sessionId, 'MESSAGE_RECEIVED', data);
    });

    // Message sent
    whatsappService.on('message_sent', async (data) => {
      await this.dispatch(data.sessionId, 'MESSAGE_SENT', data);
    });

    // Message acknowledged
    whatsappService.on('message_ack', async (data) => {
      await this.dispatch(data.sessionId, 'MESSAGE_ACK', data);
    });

    // QR code generated
    whatsappService.on('qr', async (data) => {
      await this.dispatch(data.sessionId, 'QR_RECEIVED', data);
    });

    // Session authenticated
    whatsappService.on('authenticated', async (data) => {
      await this.dispatch(data.sessionId, 'AUTHENTICATED', data);
    });

    // Session ready
    whatsappService.on('ready', async (data) => {
      await this.dispatch(data.sessionId, 'READY', data);
    });

    // Session disconnected
    whatsappService.on('disconnected', async (data) => {
      await this.dispatch(data.sessionId, 'DISCONNECTED', data);
    });

    // Auth failure
    whatsappService.on('auth_failure', async (data) => {
      await this.dispatch(data.sessionId, 'AUTH_FAILURE', data);
    });

    // State change
    whatsappService.on('state_change', async (data) => {
      await this.dispatch(data.sessionId, 'STATE_CHANGE', data);
    });
  }

  /**
   * Dispatch webhook to all registered endpoints
   */
  async dispatch(
    sessionId: string,
    event: WebhookEvent | 'ALL',
    data: unknown
  ): Promise<void> {
    try {
      // Get all active webhooks for this session
      const webhooks = await prisma.webhook.findMany({
        where: {
          sessionId,
          isActive: true,
          OR: [
            { events: { has: event } },
            { events: { has: 'ALL' } },
          ],
        },
      });

      if (webhooks.length === 0) {
        logger.debug({ sessionId, event }, 'No webhooks registered for event');
        return;
      }

      const payload: WebhookPayload = {
        event,
        sessionId,
        timestamp: new Date().toISOString(),
        data,
      };

      // Send to all webhooks in parallel
      const results = await Promise.allSettled(
        webhooks.map((webhook) => this.sendWebhook(webhook.id, webhook, payload))
      );

      // Log results
      results.forEach((result, index) => {
        const webhook = webhooks[index];
        if (result.status === 'rejected') {
          logger.error(
            { webhookId: webhook?.id, error: result.reason },
            'Webhook dispatch failed'
          );
        }
      });
    } catch (error) {
      logger.error({ sessionId, event, error }, 'Error dispatching webhooks');
    }
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWebhook(
    webhookId: string,
    webhook: {
      url: string;
      headers: unknown;
      secret: string | null;
      timeout: number;
      retryCount: number;
    },
    payload: WebhookPayload
  ): Promise<void> {
    const payloadString = JSON.stringify(payload);
    let lastError: Error | null = null;
    let statusCode: number | undefined;
    let response: string | undefined;
    const startTime = Date.now();

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Zetwa-Webhook/1.0',
      'X-Zetwa-Event': payload.event,
      'X-Zetwa-Timestamp': payload.timestamp,
      'X-Zetwa-Session': payload.sessionId,
    };

    // Add custom headers
    if (webhook.headers && typeof webhook.headers === 'object') {
      Object.assign(headers, webhook.headers);
    }

    // Add signature if secret is set
    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payloadString)
        .digest('hex');
      headers['X-Zetwa-Signature'] = `sha256=${signature}`;
    }

    // Retry loop
    for (let attempt = 1; attempt <= webhook.retryCount; attempt++) {
      try {
        const axiosResponse = await axios.post(webhook.url, payload, {
          headers,
          timeout: webhook.timeout,
          validateStatus: (status) => status >= 200 && status < 300,
        });

        statusCode = axiosResponse.status;
        response = JSON.stringify(axiosResponse.data);

        // Log successful webhook
        await this.logWebhook(webhookId, payload.event, payload, {
          statusCode,
          response,
          duration: Date.now() - startTime,
          attempts: attempt,
          success: true,
        });

        logger.debug(
          { webhookId, event: payload.event, statusCode, attempt },
          'Webhook sent successfully'
        );

        return;
      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;

        statusCode = axiosError.response?.status;
        response = axiosError.response?.data
          ? JSON.stringify(axiosError.response.data)
          : axiosError.message;

        logger.warn(
          {
            webhookId,
            event: payload.event,
            attempt,
            maxAttempts: webhook.retryCount,
            statusCode,
            error: axiosError.message,
          },
          'Webhook attempt failed'
        );

        // Don't retry on client errors (4xx)
        if (statusCode && statusCode >= 400 && statusCode < 500) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < webhook.retryCount) {
          const delay = config.webhook.retryDelay * Math.pow(2, attempt - 1);
          await sleep(delay);
        }
      }
    }

    // Log failed webhook
    await this.logWebhook(webhookId, payload.event, payload, {
      statusCode,
      response,
      error: lastError?.message,
      duration: Date.now() - startTime,
      attempts: webhook.retryCount,
      success: false,
    });

    logger.error(
      { webhookId, event: payload.event, error: lastError?.message },
      'Webhook failed after all retries'
    );
  }

  /**
   * Log webhook delivery attempt
   */
  private async logWebhook(
    webhookId: string,
    event: string,
    payload: unknown,
    result: {
      statusCode?: number;
      response?: string;
      error?: string;
      duration: number;
      attempts: number;
      success: boolean;
    }
  ): Promise<void> {
    try {
      await prisma.webhookLog.create({
        data: {
          webhookId,
          event,
          payload: payload as object,
          statusCode: result.statusCode,
          response: result.response?.substring(0, 10000), // Limit response size
          error: result.error,
          duration: result.duration,
          attempts: result.attempts,
          success: result.success,
        },
      });
    } catch (error) {
      logger.error({ webhookId, error }, 'Failed to log webhook');
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId: string): Promise<{
    success: boolean;
    statusCode?: number;
    response?: string;
    error?: string;
    duration: number;
  }> {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: { session: true },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testPayload: WebhookPayload = {
      event: 'TEST',
      sessionId: webhook.sessionId,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Zetwa',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    const payloadString = JSON.stringify(testPayload);
    const startTime = Date.now();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Zetwa-Webhook/1.0',
      'X-Zetwa-Event': 'TEST',
      'X-Zetwa-Timestamp': testPayload.timestamp,
    };

    if (webhook.headers && typeof webhook.headers === 'object') {
      Object.assign(headers, webhook.headers);
    }

    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payloadString)
        .digest('hex');
      headers['X-Zetwa-Signature'] = `sha256=${signature}`;
    }

    try {
      const response = await axios.post(webhook.url, testPayload, {
        headers,
        timeout: webhook.timeout,
        validateStatus: () => true,
      });

      return {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        response: JSON.stringify(response.data).substring(0, 1000),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: axiosError.message,
        duration: Date.now() - startTime,
      };
    }
  }
}

export const webhookService = new WebhookService();
