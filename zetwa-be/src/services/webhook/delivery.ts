/**
 * Webhook Delivery Functions
 * Handles webhook sending with retry logic and signature
 */

import axios, { type AxiosError } from 'axios';
import * as crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { sleep } from '../../utils/helpers.js';
import type { WebhookPayload, WebhookConfig, WebhookDeliveryResult } from './types.js';

/**
 * Create signature for webhook payload
 */
export function createSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Prepare headers for webhook request
 */
export function prepareHeaders(
  webhook: WebhookConfig,
  payload: WebhookPayload
): Record<string, string> {
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
    const payloadString = JSON.stringify(payload);
    const signature = createSignature(payloadString, webhook.secret);
    headers['X-Zetwa-Signature'] = `sha256=${signature}`;
  }

  return headers;
}

/**
 * Log webhook delivery attempt to database
 */
export async function logWebhook(
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
 * Send webhook with retry logic
 */
export async function sendWebhook(
  webhookId: string,
  webhook: WebhookConfig,
  payload: WebhookPayload
): Promise<void> {
  let lastError: Error | null = null;
  let statusCode: number | undefined;
  let response: string | undefined;
  const startTime = Date.now();

  const headers = prepareHeaders(webhook, payload);

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
      await logWebhook(webhookId, payload.event, payload, {
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
  await logWebhook(webhookId, payload.event, payload, {
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
 * Test webhook endpoint
 */
export async function testWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
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

  const startTime = Date.now();

  const headers = prepareHeaders(
    {
      id: webhook.id,
      url: webhook.url,
      headers: webhook.headers,
      secret: webhook.secret,
      timeout: webhook.timeout,
      retryCount: webhook.retryCount,
    },
    testPayload
  );

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
