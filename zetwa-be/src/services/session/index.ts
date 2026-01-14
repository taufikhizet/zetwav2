/**
 * Session Service
 * Main entry point for session management
 */

// Export types
export type {
  SessionStatus,
  WebhookEvent,
  CreateSessionInput,
  UpdateSessionInput,
  CreateWebhookInput,
  UpdateWebhookInput,
  SessionConfig,
  ProxyConfig,
  WebhookConfig,
  IgnoreConfig,
  ClientConfig,
  NowebConfig,
  QRCodeFormat,
  QRCodeQuery,
  QRCodeResponse,
  RequestCodeInput,
  PairingCodeResponse,
  MeInfo,
} from './types.js';

// Export constants
export {
  ALL_WAHA_EVENTS,
  DEFAULT_WEBHOOK_TIMEOUT,
  DEFAULT_RETRY_CONFIG,
  FAILED_STATUSES,
  STALE_STATUSES,
  PAIRING_VALID_STATUSES,
} from './constants.js';

// Export utilities
export { normalizeEvents, eventsToWahaFormat, headersToArray, headersToObject } from './utils.js';

// Export transformers
export { transformWebhookResponse, transformToInlineConfig, type WebhookResponse, type InlineWebhookConfig } from './transformers.js';

// Import operations and webhooks
import * as operations from './operations/index.js';
import * as webhooks from './webhooks.js';

/**
 * Session Service Class
 * Combines all session-related functionality
 */
class SessionService {
  // ================================
  // Session CRUD
  // ================================

  create = operations.create;
  list = operations.list;
  getById = operations.getById;
  update = operations.update;
  delete = operations.remove;
  getQRCode = operations.getQRCode;
  getQRCodeWithFormat = operations.getQRCodeWithFormat;
  restart = operations.restart;
  logout = operations.logout;
  getStatus = operations.getStatus;
  requestPairingCode = operations.requestPairingCode;
  getMeInfo = operations.getMeInfo;

  // ================================
  // Webhook Management
  // ================================

  createWebhook = webhooks.createWebhook;
  getWebhooks = webhooks.getWebhooks;
  getWebhookById = webhooks.getWebhookById;
  updateWebhook = webhooks.updateWebhook;
  deleteWebhook = webhooks.deleteWebhook;
  toggleWebhookActive = webhooks.toggleWebhookActive;
  getWebhookLogs = webhooks.getWebhookLogs;
}

export const sessionService = new SessionService();

// Re-export individual operations for direct use
export { operations, webhooks };
