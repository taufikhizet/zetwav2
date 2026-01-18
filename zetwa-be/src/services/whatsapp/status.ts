/**
 * WhatsApp Status/Stories Functions
 */

import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import type { WASession } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import type { Client } from 'whatsapp-web.js';

// In-memory cache for statuses: sessionId -> Status[]
const statusCache = new Map<string, any[]>();

// Helper to get Puppeteer page
function getPage(client: Client): any {
  // @ts-ignore
  return client.pupPage;
}

/**
 * Handle incoming status update (from real-time events)
 */
export async function handleStatusUpdate(sessionId: string, message: any) {
  try {
    // Basic validation
    if (!message || (message.id && message.id.remote !== 'status@broadcast' && message.key?.remoteJid !== 'status@broadcast')) {
      return;
    }

    const currentCache = statusCache.get(sessionId) || [];
    
    // Serialize if needed
    let serialized = message;
    if (typeof message.serialize === 'function') {
        serialized = message.serialize();
    } else if (!message._serialized && !message.body && !message.type) {
        // If it's a raw object without shape, skip
        return;
    }

    // Avoid duplicates
    const id = serialized.id?._serialized || serialized.id;
    const exists = currentCache.some((s: any) => (s.id?._serialized || s.id) === id);
    
    if (!exists) {
        // Add to cache
        currentCache.push(serialized);
        // Sort by timestamp (newest last)
        currentCache.sort((a: any, b: any) => (a.t || 0) - (b.t || 0));
        
        // Limit cache size per session (e.g. 1000 statuses) to prevent leak
        if (currentCache.length > 1000) {
            currentCache.splice(0, currentCache.length - 1000);
        }
        
        statusCache.set(sessionId, currentCache);
        logger.debug({ sessionId, statusId: id }, 'Cached new status update');
    }
  } catch (error) {
    logger.error({ sessionId, error }, 'Error handling status update');
  }
}

/**
 * Get all statuses (Internal helper)
 */
async function getAllStatuses(session: WASession) {
  try {
    // Priority 1: Direct Store Access (reflects UI state of "Status" tab)
    const directStatuses = await fetchStatusesDirectly(session);
    
    // Update cache if we got fresh data
    if (directStatuses && directStatuses.length > 0) {
        // Merge with existing cache to keep history
        const currentCache = statusCache.get(session.sessionId) || [];
        const newIds = new Set(directStatuses.map((s: any) => s.id?._serialized || s.id));
        
        // Keep old ones that are NOT in new list? 
        // Or just replace? 
        // If we replace, we might lose statuses that WWebJS "forgot" but we want to keep.
        // Better to merge: Keep old ones, add new ones, update existing ones.
        
        const merged = [...currentCache];
        directStatuses.forEach((newStatus: any) => {
            const index = merged.findIndex((s: any) => (s.id?._serialized || s.id) === (newStatus.id?._serialized || newStatus.id));
            if (index >= 0) {
                merged[index] = newStatus;
            } else {
                merged.push(newStatus);
            }
        });
        
        // Filter out very old statuses (> 24h)
        const now = Math.floor(Date.now() / 1000);
        const filtered = merged.filter((s: any) => (now - (s.t || 0)) < 86400); // 24 hours
        
        statusCache.set(session.sessionId, filtered);
        return filtered;
    }

    // Priority 2: Fallback to Cache
    // If direct fetch failed (returned empty), use our memory cache
    const cached = statusCache.get(session.sessionId);
    if (cached && cached.length > 0) {
        logger.info({ sessionId: session.sessionId, count: cached.length }, 'Serving statuses from memory cache');
        return cached;
    }

    // Priority 3: Standard fetch (Last Resort)
    logger.debug({ sessionId: session.sessionId }, 'Direct status fetch empty and cache empty, trying standard fetch');
    const chat = await session.client.getChatById('status@broadcast');
    const messages = await chat.fetchMessages({ limit: 100 });
    
    if (messages && messages.length > 0) {
        // Update cache with these too
        // serialize messages first
        const serializedMsgs = messages.map(m => {
            if (typeof (m as any).serialize === 'function') return (m as any).serialize();
            return m;
        });
        statusCache.set(session.sessionId, serializedMsgs);
        return serializedMsgs;
    }
    
    return [];
  } catch (error) {
    logger.warn({ sessionId: session.sessionId, error }, 'Failed to fetch status messages');
    // Fallback to cache on error
    return statusCache.get(session.sessionId) || [];
  }
}

/**
 * Fetch statuses directly from Store.Status, Store.Chat, and Store.Msg
 * (Robust implementation to handle cache misses)
 */
async function fetchStatusesDirectly(session: WASession) {
  const page = getPage(session.client);
  if (!page) return [];

  try {
    // Wait for Store to be defined (critical for refreshes/reloads)
    try {
        await page.waitForFunction('window.Store && window.Store.Status', { timeout: 2000 });
    } catch (e) {
        // Continue even if timeout, maybe it's partially loaded
    }

    const rawStatuses = await page.evaluate(async () => {
      try {
        const allFoundMessages: any[] = [];
        const seenIds = new Set();

        // Helper to check if a user is Me
        // @ts-ignore
        const meUser = window.Store.User && window.Store.User.getMaybeMePnUser ? window.Store.User.getMaybeMePnUser() : undefined;
        
        const isMeUser = (user: any) => {
            if (!user || !meUser) return false;
            if (typeof user === 'string') {
                return user === meUser._serialized || user.split('@')[0] === meUser.user;
            }
            if (user._serialized) return user._serialized === meUser._serialized;
            if (user.user) return user.user === meUser.user;
            if (user.equals) return user.equals(meUser);
            return false;
        };

        const addMessage = (msg: any) => {
            if (!msg) return;
            try {
                const id = msg.id?._serialized || msg.id;
                if (!id || seenIds.has(id)) return;
                
                // Validate it's a status
                const isStatus = 
                    msg.isStatusV3 || 
                    (msg.id && msg.id.remote === 'status@broadcast') ||
                    (msg.key && msg.key.remoteJid === 'status@broadcast');

                if (!isStatus) return;

                seenIds.add(id);

                // Ensure fromMe is correct
                // Check authorship
                let isFromMe = (msg.id && msg.id.fromMe) || msg.fromMe === true;
                
                if (!isFromMe) {
                    const author = msg.author || msg.id?.participant || msg.participant;
                    if (isMeUser(author)) {
                        isFromMe = true;
                    }
                }

                // Serialize
                // @ts-ignore
                if (window.WWebJS && window.WWebJS.getMessageModel) {
                   // @ts-ignore
                   const serialized = window.WWebJS.getMessageModel(msg);
                   if (isFromMe) serialized.fromMe = true;
                   allFoundMessages.push(serialized);
                } else {
                   // Fallback serialization
                   let serialized: any = {};
                   if (typeof msg.serialize === 'function') {
                       serialized = msg.serialize();
                   } else {
                       // Shallow copy safe properties
                       serialized = {
                           id: msg.id,
                           body: msg.body,
                           type: msg.type,
                           t: msg.t,
                           caption: msg.caption,
                           fromMe: isFromMe, 
                           _serialized: id,
                           author: msg.author,
                           participant: msg.participant
                       };
                   }
                   
                   if (!serialized.id) serialized.id = msg.id;
                   if (isFromMe) serialized.fromMe = true;
                   
                   allFoundMessages.push(serialized);
                }
            } catch (err) {
                // Ignore single message errors
            }
        };

        // Helper to get array from collection
        const getModels = (collection: any) => {
            if (!collection) return [];
            if (typeof collection.getModelsArray === 'function') return collection.getModelsArray();
            if (Array.isArray(collection.models)) return collection.models;
            if (Array.isArray(collection)) return collection;
            return [];
        };

        // STRATEGY 1: Store.Status (The standard optimized view)
        // @ts-ignore
        if (window.Store && window.Store.Status) {
            // @ts-ignore
            const models = getModels(window.Store.Status);
            models.forEach((model: any) => {
                if (model.msgs && model.msgs.length > 0) {
                    // Handle both array and collection
                    const msgs = getModels(model.msgs);
                    msgs.forEach(addMessage);
                }
            });
        }

        // STRATEGY 2: Store.Chat (The chat history)
        // @ts-ignore
        if (window.Store && window.Store.Chat) {
            // @ts-ignore
            const statusChat = window.Store.Chat.get('status@broadcast');
            if (statusChat && statusChat.msgs) {
                const msgs = getModels(statusChat.msgs);
                msgs.forEach(addMessage);
            }
        }

        // STRATEGY 3: Store.Msg (The raw message database)
        // @ts-ignore
        if (window.Store && window.Store.Msg) {
             // @ts-ignore
             const msgs = getModels(window.Store.Msg);
             msgs.forEach((msg: any) => {
                 if (msg.id && msg.id.remote === 'status@broadcast') {
                     addMessage(msg);
                 }
             });
        }

        return allFoundMessages;
      } catch (e) {
        return [];
      }
    });

    return rawStatuses.map((msgData: any) => {
        // Helper to safely get serialized ID
        const getSerialized = (id: any) => {
            if (!id) return undefined;
            if (typeof id === 'string') return id;
            return id._serialized || id;
        };

        // Determine correct caption/body logic
        let caption = msgData.caption;
        let body = msgData.body;
        
        const isMedia = msgData.type === 'image' || msgData.type === 'video' || msgData.type === 'audio';
        
        if (isMedia) {
            if (!caption) {
                if (typeof body === 'string' && body.length < 1000 && !body.startsWith('/9j/')) {
                     caption = body;
                }
            }
        } else {
            if (!caption && body) caption = body;
        }

        return {
            id: msgData.id,
            timestamp: msgData.t,
            body: body, // Keep original body available just in case
            type: msgData.type,
            fromMe: (msgData.id && typeof msgData.id === 'object' ? msgData.id.fromMe : msgData.fromMe) ?? false,
            author: getSerialized(msgData.author),
            from: getSerialized(msgData.from),
            caption: caption,
            // Add other fields as needed
            _serialized: msgData.id?._serialized || (typeof msgData.id === 'string' ? msgData.id : undefined)
        };
    });

  } catch (error) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to fetch statuses directly');
    return [];
  }
}



/**
 * Get my statuses
 */
export async function getMyStatuses(session: WASession): Promise<Array<{
  id: string;
  timestamp: number;
  caption?: string;
  type: string;
  body?: string;
}>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // Use the same approach as getContactStatuses: fetch all and filter
  const messages = await getAllStatuses(session);
  
  // Filter for 'fromMe'
  const myStatuses = messages.filter((msg: any) => {
      // Check fromMe property
      if (msg.fromMe === true) return true;
      if (msg.id && typeof msg.id === 'object' && msg.id.fromMe === true) return true;
      return false;
  });

  // Dedup by ID
  const seenIds = new Set();
  const uniqueStatuses: any[] = [];
  
  for (const msg of myStatuses) {
      const id = msg.id?._serialized || (typeof msg.id === 'string' ? msg.id : msg.id?._serialized);
      if (id && !seenIds.has(id)) {
          seenIds.add(id);
          uniqueStatuses.push(msg);
      }
  }

  // Sort chronological (oldest first for stories)
  uniqueStatuses.sort((a, b) => a.timestamp - b.timestamp);

  return uniqueStatuses
    .map((msg: any) => {
      // Logic to prevent showing base64 body as caption for media
      const isMedia = msg.type === 'image' || msg.type === 'video' || msg.type === 'audio';
      let caption = msg.caption || '';
      
      if (!isMedia && !caption && msg.body) {
          // For text, fallback to body
          caption = msg.body;
      } else if (isMedia && !caption && msg.body) {
          // For media, check if body is not base64 thumbnail
          if (typeof msg.body === 'string' && msg.body.length < 1000 && !msg.body.startsWith('/9j/')) {
              caption = msg.body;
          }
      }

      return {
        id: msg.id?._serialized || (typeof msg.id === 'string' ? msg.id : msg.id?._serialized) || 'unknown',
        timestamp: msg.timestamp,
        caption: caption,
        type: msg.type,
        body: msg.body || ''
      };
    });
}

/**
 * Get all contacts' statuses
 */
export async function getContactStatuses(session: WASession): Promise<Array<{
  contactId: string;
  name?: string;
  statuses: Array<{ 
    id: string; 
    timestamp: number; 
    caption?: string; 
    type: string;
    body?: string;
  }>;
}>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const messages = await getAllStatuses(session);
  const otherStatuses = messages.filter((msg: any) => !msg.fromMe);
  
  // Group by author (which is the contact ID for statuses)
  const grouped: Record<string, any[]> = {};
  
  for (const msg of otherStatuses) {
    const author = msg.author || msg.from; // Should be author for status
    if (!grouped[author]) {
      grouped[author] = [];
    }
    grouped[author].push(msg);
  }

  const result = [];
  for (const [contactId, msgs] of Object.entries(grouped)) {
    // Skip if contactId is invalid or [object Object]
    if (!contactId || contactId === '[object Object]') continue;

    let name = contactId;
    try {
        const contact = await session.client.getContactById(contactId);
        if (typeof contact.name === 'string' && contact.name) name = contact.name;
        else if (typeof contact.pushname === 'string' && contact.pushname) name = contact.pushname;
        else if (typeof contact.number === 'string' && contact.number) name = contact.number;
    } catch (e) {
        // ignore
    }

    result.push({
      contactId,
      name,
      statuses: msgs.map((msg: any) => {
        // Logic to prevent showing base64 body as caption for media
        const isMedia = msg.type === 'image' || msg.type === 'video' || msg.type === 'audio';
        let caption = msg.caption || '';
        
        if (!isMedia && !caption && msg.body) {
            // For text, fallback to body
            caption = msg.body;
        } else if (isMedia && !caption && msg.body) {
            // For media, check if body is not base64 thumbnail
            if (typeof msg.body === 'string' && msg.body.length < 1000 && !msg.body.startsWith('/9j/')) {
                caption = msg.body;
            }
        }

        return {
            id: msg.id._serialized || msg.id,
            timestamp: msg.timestamp,
            caption: caption,
            type: msg.type,
            body: msg.body
        };
      })
    });
  }

  return result;
}

/**
 * Get specific contact's statuses
 */
export async function getContactStatus(
  session: WASession,
  contactId: string
): Promise<Array<{ 
  id: string; 
  timestamp: number; 
  caption?: string;
  type: string;
  body?: string;
}>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const messages = await getAllStatuses(session);
  
  return messages
    .filter((msg: any) => !msg.fromMe && (msg.author === contactId || msg.from === contactId))
    .map((msg: any) => {
        // Logic to prevent showing base64 body as caption for media
        const isMedia = msg.type === 'image' || msg.type === 'video' || msg.type === 'audio';
        let caption = msg.caption || '';
        
        if (!isMedia && !caption && msg.body) {
            // For text, fallback to body
            caption = msg.body;
        } else if (isMedia && !caption && msg.body) {
            // For media, check if body is not base64 thumbnail
            if (typeof msg.body === 'string' && msg.body.length < 1000 && !msg.body.startsWith('/9j/')) {
                caption = msg.body;
            }
        }

        return {
            id: msg.id._serialized || msg.id,
            timestamp: msg.timestamp,
            caption: caption,
            type: msg.type,
            body: msg.body
        };
    });
}

/**
 * Post text status
 */
export async function postTextStatus(
  session: WASession,
  text: string,
  backgroundColor?: string,
  font?: number
): Promise<{ statusId: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    const extra: any = {};
    if (font != null) {
      extra.fontStyle = font;
    }
    
    // Handle background color
    if (backgroundColor) {
        // Remove # if present
        const hex = backgroundColor.replace('#', '');
        // WAHA uses 'FF' + hex then parseInt(..., 16)
        // Ensure we pass it as a number if that's what's expected, 
        // or as a hex string if that's what the library expects.
        // Looking at WAHA's code: extra.backgroundColor = status.backgroundColor;
        // It seems it passes the value directly.
        // But in standard whatsapp-web.js, it might expect a number or a specific format.
        // Let's assume hex string is fine or we convert it.
        // Wait, WAHA's code just assigns it. 
        // If the user sends a hex string, it is passed as is.
        extra.backgroundColor = parseInt('FF' + hex, 16);
    } else {
        // Default color
        extra.backgroundColor = parseInt('FF' + '507597', 16); 
    }

    const options = { extra };
    
    // Use standard sendMessage to status@broadcast
    const result = await session.client.sendMessage('status@broadcast', text, options);
    
    return { statusId: result.id._serialized };

  } catch (error: any) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to post text status');
    throw new BadRequestError(error.message || 'Failed to post text status');
  }
}

/**
 * Post media status
 */
export async function postMediaStatus(
  session: WASession,
  mediaUrl?: string,
  mediaBase64?: string,
  mimetype?: string,
  caption?: string
): Promise<{ statusId: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  let media: MessageMedia;

  try {
    if (mediaUrl) {
        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data).toString('base64');
        const contentType = response.headers['content-type'] || mimetype || 'image/jpeg';
        media = new MessageMedia(contentType, base64);
    } else if (mediaBase64 && mimetype) {
        media = new MessageMedia(mimetype, mediaBase64);
    } else {
        throw new BadRequestError('Either mediaUrl or mediaBase64 with mimetype is required');
    }

    // Send to status@broadcast
    const result = await session.client.sendMessage('status@broadcast', media, {
        caption,
    });

    logger.info({ sessionId: session.sessionId }, 'Media status posted');

    return { statusId: result.id._serialized };
  } catch (error: any) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to post media status');
    throw new BadRequestError(error.message || 'Failed to post media status');
  }
}

/**
 * Delete status
 */
export async function deleteStatus(session: WASession, statusId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    // Standard delete
    const msg = await session.client.getMessageById(statusId);
    if (msg) {
        await msg.delete(true);
        return;
    }
    
    // WAHA/Store fallback if message not found in cache
    // @ts-ignore
    if (typeof session.client.revokeStatusMessage === 'function') {
        // Ensure ID format is correct for status
        let messageId = statusId;
        // WAHA logic: if (!request.id.startsWith('true_status@broadcast_')) ...
        // But statusId passed here should already be serialized.
        
        // @ts-ignore
        await session.client.revokeStatusMessage(messageId);
        return;
    }

    throw new Error('Message not found or cannot be deleted');
  } catch (error: any) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to delete status');
    throw new BadRequestError(error.message || 'Failed to delete status');
  }
}

/**
 * Mark status as seen
 */
export async function markStatusSeen(session: WASession, statusId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
      // Try to get message and send seen
      const msg = await session.client.getMessageById(statusId);
      if (msg) {
          // Status seen is different? 
          // WAHA doesn't implement it in the file I saw, but maybe standard sendSeen works?
          // Typically for status we send a specific stanza.
          // Let's assume standard sendSeen might not work for status but we can try.
          // Or just leave it as not supported.
          throw new BadRequestError('Marking status as seen is not supported yet');
      }
      throw new BadRequestError('Status message not found');
  } catch (error: any) {
      throw error;
  }
}
