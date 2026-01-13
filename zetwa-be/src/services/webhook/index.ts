/**
 * Webhook Service
 * Main entry point for webhook management
 */

// Export types
export type { WebhookEvent, WebhookPayload, WebhookDeliveryResult, WebhookConfig } from './types.js';

// Import modules
import { dispatch, emit } from './dispatcher.js';
import { testWebhook } from './delivery.js';

/**
 * Webhook Service Class
 */
class WebhookService {
  /**
   * Dispatch webhook to all registered endpoints
   */
  dispatch = dispatch;

  /**
   * Emit event (maps internal event names to webhook events)
   */
  emit = emit;

  /**
   * Test webhook endpoint
   */
  testWebhook = testWebhook;
}

export const webhookService = new WebhookService();
