/**
 * Webhook Types - WAHA-inspired comprehensive webhook configuration
 */

// Retry policy options
export type RetryPolicy = 'linear' | 'exponential' | 'constant'

// HMAC configuration for webhook signature verification
export interface HmacConfig {
  /** Secret key for HMAC signature */
  key?: string
}

// Retry configuration for failed webhook deliveries
export interface RetriesConfig {
  /** Delay in seconds between retries */
  delaySeconds?: number
  /** Maximum number of retry attempts (0-15) */
  attempts?: number
  /** Retry delay policy */
  policy?: RetryPolicy
}

// Custom header for webhook requests
export interface CustomHeader {
  /** Header name (e.g., X-Custom-Header) */
  name: string
  /** Header value */
  value: string
}

// Inline webhook configuration (embedded in session config)
export interface InlineWebhookConfig {
  /** Optional webhook name (auto-generated from URL if not provided) */
  name?: string
  /** Webhook URL endpoint */
  url: string
  /** Events to subscribe to */
  events: string[]
  /** HMAC configuration for signature verification */
  hmac?: HmacConfig
  /** Retry configuration */
  retries?: RetriesConfig
  /** Custom headers to include in webhook requests */
  customHeaders?: CustomHeader[]
  /** Request timeout in seconds (default: 30) */
  timeout?: number
}

// Full webhook configuration (stored in database)
export interface WebhookConfig extends InlineWebhookConfig {
  /** Webhook ID */
  id: string
  /** Webhook name */
  name: string
  /** Is webhook active */
  isActive: boolean
  /** Request timeout in milliseconds */
  timeout: number
  /** Created timestamp */
  createdAt: string
  /** Log count */
  _count?: {
    logs: number
  }
}

// Webhook create input
export interface CreateWebhookInput {
  name: string
  url: string
  events?: string[]
  hmac?: HmacConfig
  retries?: RetriesConfig
  customHeaders?: CustomHeader[]
  secret?: string
  timeout?: number
}

// Webhook update input
export interface UpdateWebhookInput extends Partial<CreateWebhookInput> {
  isActive?: boolean
}

// Webhook events - WAHA-compatible events list
export const WEBHOOK_EVENTS = [
  // Session events
  { value: 'session.status', label: 'Session Status', category: 'Session', description: 'Session connection status changes' },
  
  // Message events
  { value: 'message', label: 'Message (Incoming)', category: 'Messages', description: 'New incoming messages' },
  { value: 'message.any', label: 'Message (Any)', category: 'Messages', description: 'All messages (incoming and outgoing)' },
  { value: 'message.ack', label: 'Message ACK', category: 'Messages', description: 'Message delivery/read receipts' },
  { value: 'message.reaction', label: 'Message Reaction', category: 'Messages', description: 'Reactions on messages' },
  { value: 'message.revoked', label: 'Message Revoked', category: 'Messages', description: 'Deleted messages' },
  { value: 'message.edited', label: 'Message Edited', category: 'Messages', description: 'Edited messages' },
  { value: 'message.waiting', label: 'Message Waiting', category: 'Messages', description: 'Messages waiting to be sent' },
  
  // Group events
  { value: 'group.join', label: 'Group Join', category: 'Groups', description: 'Member joined a group' },
  { value: 'group.leave', label: 'Group Leave', category: 'Groups', description: 'Member left a group' },
  { value: 'group.update', label: 'Group Update', category: 'Groups', description: 'Group settings changed' },
  
  // Presence events
  { value: 'presence.update', label: 'Presence Update', category: 'Presence', description: 'Online/offline/typing status' },
  
  // Poll events
  { value: 'poll.vote', label: 'Poll Vote', category: 'Polls', description: 'Votes on polls' },
  { value: 'poll.vote.failed', label: 'Poll Vote Failed', category: 'Polls', description: 'Failed poll votes' },
  
  // Call events
  { value: 'call.received', label: 'Call Received', category: 'Calls', description: 'Incoming call' },
  { value: 'call.accepted', label: 'Call Accepted', category: 'Calls', description: 'Call was answered' },
  { value: 'call.rejected', label: 'Call Rejected', category: 'Calls', description: 'Call was rejected' },
  
  // Label events
  { value: 'label.upsert', label: 'Label Created/Updated', category: 'Labels', description: 'Label created or updated' },
  { value: 'label.deleted', label: 'Label Deleted', category: 'Labels', description: 'Label was deleted' },
  { value: 'label.chat.added', label: 'Label Added to Chat', category: 'Labels', description: 'Label added to a chat' },
  { value: 'label.chat.deleted', label: 'Label Removed from Chat', category: 'Labels', description: 'Label removed from a chat' },
  
  // Contact events
  { value: 'contact.update', label: 'Contact Update', category: 'Contacts', description: 'Contact info updated' },
  
  // Chat events
  { value: 'chat.archive', label: 'Chat Archive', category: 'Chats', description: 'Chat archived/unarchived' },
  
  // Wildcard - only used in UI, not stored in database
  { value: '*', label: 'All Events', category: 'Special', description: 'Subscribe to all events' },
] as const

// All WAHA event values (excluding wildcard *)
// Used to detect if all events are selected
export const ALL_WAHA_EVENT_VALUES = WEBHOOK_EVENTS
  .filter(e => e.value !== '*')
  .map(e => e.value)

/**
 * Check if all events are selected
 * @param events Array of event strings from database (may be in underscore or dot format)
 */
export function isAllEventsSelected(events: string[]): boolean {
  if (events.includes('*') || events.includes('ALL')) return true
  
  // Normalize events to dot format for comparison
  const normalizedEvents = events.map(e => e.replace(/_/g, '.'))
  
  // Check if all WAHA events are present
  return ALL_WAHA_EVENT_VALUES.every(wahaEvent => 
    normalizedEvents.includes(wahaEvent)
  )
}

// Group events by category
export const WEBHOOK_EVENTS_BY_CATEGORY = WEBHOOK_EVENTS.reduce((acc, event) => {
  if (!acc[event.category]) {
    acc[event.category] = []
  }
  acc[event.category].push(event)
  return acc
}, {} as Record<string, typeof WEBHOOK_EVENTS[number][]>)

// Event categories order
export const EVENT_CATEGORIES = [
  'Special',
  'Session',
  'Messages',
  'Groups',
  'Contacts',
  'Chats',
  'Presence',
  'Calls',
  'Polls',
  'Labels',
] as const