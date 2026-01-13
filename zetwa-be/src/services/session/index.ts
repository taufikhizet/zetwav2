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
} from './types.js';

// Import CRUD and webhook functions
import * as crud from './crud.js';
import * as webhooks from './webhooks.js';

/**
 * Session Service Class
 * Combines all session-related functionality
 */
class SessionService {
  // ================================
  // Session CRUD
  // ================================

  create = crud.create;
  list = crud.list;
  getById = crud.getById;
  update = crud.update;
  delete = crud.remove;
  getQRCode = crud.getQRCode;
  restart = crud.restart;
  logout = crud.logout;
  getStatus = crud.getStatus;

  // ================================
  // Webhook Management
  // ================================

  createWebhook = webhooks.createWebhook;
  getWebhooks = webhooks.getWebhooks;
  updateWebhook = webhooks.updateWebhook;
  deleteWebhook = webhooks.deleteWebhook;
  getWebhookLogs = webhooks.getWebhookLogs;
}

export const sessionService = new SessionService();
