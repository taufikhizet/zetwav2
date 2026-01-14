/**
 * Session Service Utilities
 * Helper functions for session and webhook operations
 */

import { WebhookEvent } from '@prisma/client';
import { ALL_WAHA_EVENTS } from './constants.js';

/**
 * Normalize events from WAHA-style (dot) to database format (underscore)
 * When '*' or 'ALL' is received, expand to all individual events
 */
export function normalizeEvents(events: string[]): WebhookEvent[] {
  // Check if wildcard is present - expand to all WAHA events
  if (events.some(e => e === '*' || e === 'ALL')) {
    return ALL_WAHA_EVENTS;
  }

  const result: WebhookEvent[] = [];
  
  for (const event of events) {
    // Keep legacy uppercase events as-is
    if (event.toUpperCase() === event && event in WebhookEvent) {
      result.push(event as WebhookEvent);
      continue;
    }
    
    // Convert dot to underscore (e.g., message.any -> message_any)
    const normalized = event.replace(/\./g, '_');
    
    // Check if it's a valid WebhookEvent
    if (normalized in WebhookEvent) {
      result.push(normalized as WebhookEvent);
    }
    // Skip unknown events instead of defaulting to ALL
  }
  
  // Return unique events, or all events if result is empty
  return result.length > 0 ? [...new Set(result)] : ALL_WAHA_EVENTS;
}

/**
 * Convert database event format (underscore) to WAHA-style (dot)
 */
export function eventsToWahaFormat(events: WebhookEvent[]): string[] {
  return events.map((event) => {
    // Keep legacy uppercase events as-is (e.g., MESSAGE_RECEIVED)
    if (event.toUpperCase() === event) {
      return event;
    }
    // Convert underscore to dot (e.g., message_any -> message.any)
    return event.replace(/_/g, '.');
  });
}

/**
 * Transform headers JSON object to array format for frontend
 */
export function headersToArray(headers: Record<string, string> | null): Array<{ name: string; value: string }> {
  if (!headers) return [];
  return Object.entries(headers).map(([name, value]) => ({ name, value }));
}

/**
 * Transform headers array to JSON object for database
 */
export function headersToObject(customHeaders?: Array<{ name: string; value: string }> | null): Record<string, string> | null {
  if (!customHeaders || customHeaders.length === 0) {
    return null;
  }
  
  const headers: Record<string, string> = {};
  for (const h of customHeaders) {
    if (h.name && h.value) {
      headers[h.name] = h.value;
    }
  }
  
  return Object.keys(headers).length > 0 ? headers : null;
}
