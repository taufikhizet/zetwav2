/**
 * Session Service - Re-export from folder
 * @deprecated Import directly from './session/index.js' instead
 */

export { sessionService } from './session/index.js';
export type {
  SessionStatus,
  WebhookEvent,
  WebhookEventInput,
  CreateSessionInput,
  UpdateSessionInput,
  CreateWebhookInput,
  UpdateWebhookInput,
} from './session/types.js';
