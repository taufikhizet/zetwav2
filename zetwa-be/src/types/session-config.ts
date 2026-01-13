/**
 * Session Configuration Types
 * Based on WAHA's comprehensive session configuration
 */

/**
 * Proxy configuration for the session
 */
export interface ProxyConfig {
  /** Proxy server address (e.g., "localhost:3128" or "http://proxy.example.com:8080") */
  server: string;
  /** Proxy authentication username */
  username?: string;
  /** Proxy authentication password */
  password?: string;
}

/**
 * Webhook retry policy types
 */
export type RetryPolicy = 'linear' | 'exponential' | 'constant';

/**
 * Webhook retry configuration
 */
export interface RetriesConfig {
  /** Delay between retries in seconds */
  delaySeconds?: number;
  /** Maximum number of retry attempts */
  attempts?: number;
  /** Retry policy: linear, exponential, or constant backoff */
  policy?: RetryPolicy;
}

/**
 * Custom header for webhooks
 */
export interface CustomHeader {
  name: string;
  value: string;
}

/**
 * HMAC configuration for webhook security
 */
export interface HmacConfig {
  /** Secret key for HMAC signature */
  key?: string;
}

/**
 * Webhook configuration for session
 */
export interface WebhookConfig {
  /** Webhook URL endpoint */
  url: string;
  /** Events to subscribe to */
  events: string[];
  /** HMAC configuration for webhook signature */
  hmac?: HmacConfig;
  /** Retry configuration */
  retries?: RetriesConfig;
  /** Custom headers to send with webhook requests */
  customHeaders?: CustomHeader[];
}

/**
 * Store configuration for session data persistence
 */
export interface StoreConfig {
  /** Enable or disable the store for contacts, chats, and messages */
  enabled: boolean;
  /** 
   * Enable full sync on session initialization (when scanning QR code).
   * Full sync will download all contacts, chats, and messages from the phone.
   * If disabled, only messages earlier than 90 days will be downloaded.
   */
  fullSync?: boolean;
}

/**
 * Engine-specific configuration (for NOWEB/Baileys-based engine)
 */
export interface NowebConfig {
  /** Store configuration for contacts, chats, messages */
  store?: StoreConfig;
  /** Mark the session as online when it connects to the server */
  markOnline?: boolean;
}

/**
 * Configuration for ignoring specific event types
 */
export interface IgnoreConfig {
  /** Ignore status@broadcast (stories) events */
  status?: boolean;
  /** Ignore group events */
  groups?: boolean;
  /** Ignore channel events */
  channels?: boolean;
  /** Ignore broadcast events */
  broadcast?: boolean;
}

/**
 * Client session configuration - how the session appears in WhatsApp
 */
export interface ClientConfig {
  /** Device name shown in WhatsApp (e.g., "MacOS", "Windows", "Ubuntu") */
  deviceName?: string;
  /** Browser name shown in WhatsApp (e.g., "Chrome", "Firefox", "Safari") */
  browserName?: string;
}

/**
 * Main session configuration object
 */
export interface SessionConfig {
  /** Webhooks configured for this session */
  webhooks?: WebhookConfig[];
  /** 
   * Metadata for the session (custom key-value pairs).
   * You'll get 'metadata' in all webhooks.
   */
  metadata?: Record<string, string>;
  /** Proxy configuration for the session */
  proxy?: ProxyConfig;
  /** Enable debug mode for verbose logging */
  debug?: boolean;
  /** Ignore settings for specific event types */
  ignore?: IgnoreConfig;
  /** 
   * Client configuration - how the session appears in WhatsApp.
   * Format: 'Browser (Device)' - e.g., "Chrome (MacOS)"
   */
  client?: ClientConfig;
  /** Engine-specific configuration (for NOWEB/Baileys) */
  noweb?: NowebConfig;
}

/**
 * Input for creating a new session
 */
export interface CreateSessionInput {
  /** Session name (alphanumeric, hyphens, underscores only) */
  name: string;
  /** Optional description */
  description?: string;
  /** Session configuration */
  config?: SessionConfig;
  /** Start session immediately after creation (default: true) */
  start?: boolean;
}

/**
 * Input for updating an existing session
 */
export interface UpdateSessionInput {
  /** New session name */
  name?: string;
  /** New description */
  description?: string;
  /** Updated session configuration */
  config?: SessionConfig;
}

/**
 * Session status types matching WAHA's lifecycle
 */
export type SessionStatus =
  | 'STOPPED'
  | 'STARTING'
  | 'SCAN_QR_CODE'
  | 'WORKING'
  | 'FAILED';

/**
 * Session information returned by the API
 */
export interface SessionInfo {
  /** Session ID */
  id: string;
  /** Session name */
  name: string;
  /** Session description */
  description?: string;
  /** Current session status */
  status: SessionStatus;
  /** Session configuration */
  config?: SessionConfig;
  /** Connected phone number */
  phoneNumber?: string;
  /** WhatsApp push name (display name) */
  pushName?: string;
  /** Profile picture URL */
  profilePicUrl?: string;
  /** Current QR code (if in SCAN_QR_CODE status) */
  qrCode?: string;
  /** Whether the session is currently online */
  isOnline?: boolean;
  /** Timestamp of last activity */
  lastActivityAt?: Date;
  /** Timestamp when session was connected */
  connectedAt?: Date;
  /** Timestamp when session was created */
  createdAt: Date;
}

/**
 * Me (authenticated user) information
 */
export interface MeInfo {
  /** WhatsApp ID (phone number with @c.us suffix) */
  id: string;
  /** LID (LinkedIn-style ID used in groups) */
  lid?: string;
  /** Full JID with device number */
  jid?: string;
  /** Push name (display name) */
  pushName?: string;
  /** Phone number */
  phoneNumber?: string;
}

/**
 * QR code format options
 */
export type QRCodeFormat = 'image' | 'raw';

/**
 * QR code query options
 */
export interface QRCodeQuery {
  format?: QRCodeFormat;
}

/**
 * QR code response
 */
export interface QRCodeResponse {
  /** QR code value (base64 image or raw string based on format) */
  value?: string;
  /** Current session status */
  status: SessionStatus;
  /** Message describing the current state */
  message?: string;
  /** Whether the user can retry (restart session) */
  canRetry?: boolean;
}

/**
 * Request pairing code input
 */
export interface RequestCodeInput {
  /** Phone number in international format (e.g., "12132132130") */
  phoneNumber: string;
  /** 
   * Method for receiving the code: "sms" or "voice".
   * Leave empty for Web pairing (pairing code displayed on screen).
   */
  method?: 'sms' | 'voice';
}

/**
 * Pairing code response
 */
export interface PairingCodeResponse {
  /** The pairing code (formatted as XXXX-XXXX) */
  code: string;
}
