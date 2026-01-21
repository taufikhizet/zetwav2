/**
 * WhatsApp Channels (Newsletter) Functions
 */

import type { WASession } from './types.js';
import { SessionNotConnectedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/**
 * List Channels (Newsletters)
 */
export async function listChannels(session: WASession): Promise<any[]> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    // @ts-ignore
    if (session.client.getNewsletters) {
      // @ts-ignore
      const newsletters = await session.client.getNewsletters();
      return newsletters;
    }
    
    // Fallback: try to get from store if available or return empty
    return []; 
  } catch (error) {
    logger.warn({ sessionId: session.sessionId, error }, 'Failed to list channels');
    return [];
  }
}

/**
 * Create Channel
 */
export async function createChannel(
  session: WASession,
  name: string,
  description?: string,
  picture?: string
): Promise<any> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  // @ts-ignore
  if (typeof session.client.createNewsletter !== 'function') {
    throw new Error('Create Newsletter not supported by this engine version');
  }

  try {
    // @ts-ignore
    const result = await session.client.createNewsletter(name, {
      description,
      picture
    });
    
    return result;
  } catch (error) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to create channel');
    throw error;
  }
}

/**
 * Delete Channel
 */
export async function deleteChannel(
  session: WASession,
  id: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    // @ts-ignore
    if (typeof session.client.deleteNewsletter === 'function') {
       // @ts-ignore
       await session.client.deleteNewsletter(id);
       return;
    }
    
    // Alternative: get newsletter object and delete
    // @ts-ignore
    const newsletter = await session.client.getNewsletterById(id);
    if (newsletter && newsletter.delete) {
      await newsletter.delete();
      return;
    }
    
    throw new Error('Delete Newsletter not supported');
  } catch (error) {
    logger.error({ sessionId: session.sessionId, id, error }, 'Failed to delete channel');
    throw error;
  }
}

/**
 * Get Channel Info
 */
export async function getChannel(
  session: WASession,
  id: string
): Promise<any> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    // @ts-ignore
    if (session.client.getNewsletterById) {
       // @ts-ignore
       return await session.client.getNewsletterById(id);
    }
    throw new Error('Get Newsletter not supported');
  } catch (error) {
    logger.error({ sessionId: session.sessionId, id, error }, 'Failed to get channel info');
    throw error;
  }
}

/**
 * Follow Channel
 */
export async function followChannel(
  session: WASession,
  id: string
): Promise<void> {
  if (session.status !== 'CONNECTED') throw new SessionNotConnectedError(session.sessionId);

  try {
    // @ts-ignore
    const newsletter = await session.client.getNewsletterById(id);
    if (newsletter) {
      await newsletter.follow();
    } else {
      throw new Error('Channel not found');
    }
  } catch (error) {
    logger.error({ sessionId: session.sessionId, id, error }, 'Failed to follow channel');
    throw error;
  }
}

/**
 * Unfollow Channel
 */
export async function unfollowChannel(
  session: WASession,
  id: string
): Promise<void> {
  if (session.status !== 'CONNECTED') throw new SessionNotConnectedError(session.sessionId);

  try {
    // @ts-ignore
    const newsletter = await session.client.getNewsletterById(id);
    if (newsletter) {
      await newsletter.unfollow();
    } else {
      throw new Error('Channel not found');
    }
  } catch (error) {
    logger.error({ sessionId: session.sessionId, id, error }, 'Failed to unfollow channel');
    throw error;
  }
}

/**
 * Mute Channel
 */
export async function muteChannel(
  session: WASession,
  id: string
): Promise<void> {
  if (session.status !== 'CONNECTED') throw new SessionNotConnectedError(session.sessionId);

  try {
    // @ts-ignore
    const newsletter = await session.client.getNewsletterById(id);
    if (newsletter) {
      await newsletter.mute();
    } else {
      throw new Error('Channel not found');
    }
  } catch (error) {
    logger.error({ sessionId: session.sessionId, id, error }, 'Failed to mute channel');
    throw error;
  }
}

/**
 * Unmute Channel
 */
export async function unmuteChannel(
  session: WASession,
  id: string
): Promise<void> {
  if (session.status !== 'CONNECTED') throw new SessionNotConnectedError(session.sessionId);

  try {
    // @ts-ignore
    const newsletter = await session.client.getNewsletterById(id);
    if (newsletter) {
      await newsletter.unmute();
    } else {
      throw new Error('Channel not found');
    }
  } catch (error) {
    logger.error({ sessionId: session.sessionId, id, error }, 'Failed to unmute channel');
    throw error;
  }
}

/**
 * Preview Channel Messages
 */
export async function getChannelMessagesPreview(
  session: WASession,
  id: string,
  limit: number = 10
): Promise<any[]> {
  if (session.status !== 'CONNECTED') throw new SessionNotConnectedError(session.sessionId);

  try {
     // @ts-ignore
     const newsletter = await session.client.getNewsletterById(id);
     if (!newsletter) throw new Error('Channel not found');
     
     // Note: fetching messages from channel might be different than chat
     // But usually it's handled similarly in wajs fork
     // Or we use fetchMessages directly on the structure
     
     // @ts-ignore
     if (newsletter.getMessages) {
        const messages = await newsletter.getMessages({ limit });
        return messages;
     }
     
     return [];
  } catch (error) {
    logger.error({ sessionId: session.sessionId, id, error }, 'Failed to preview channel messages');
    throw error;
  }
}

/**
 * Search Channels By View
 */
export async function searchChannelsByView(
  session: WASession,
  view: string = 'RECOMMENDED',
  countries: string[] = ['US'],
  categories: string[] = [],
  limit: number = 50,
  startCursor?: string
): Promise<any> {
  if (session.status !== 'CONNECTED') throw new SessionNotConnectedError(session.sessionId);

  try {
    // @ts-ignore
    // WAWebJS fork usually exposes a generic search method or specific one
    // Assuming structure similar to WAHA's expectation
    // If not available, we might need to use WID 'status@broadcast' or similar internal call
    // But let's try client.getNewsletterDirectory or client.searchNewsletters
    
    // @ts-ignore
    if (session.client.getNewsletterDirectory) {
        // @ts-ignore
        return await session.client.getNewsletterDirectory({
            view,
            countries,
            categories,
            limit,
            after: startCursor
        });
    }
    
    throw new Error('Channel directory search not supported');
  } catch (error) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to search channels by view');
    throw error;
  }
}

/**
 * Search Channels By Text
 */
export async function searchChannelsByText(
  session: WASession,
  text: string,
  categories: string[] = [],
  limit: number = 50,
  startCursor?: string
): Promise<any> {
  if (session.status !== 'CONNECTED') throw new SessionNotConnectedError(session.sessionId);

  try {
    // @ts-ignore
    if (session.client.getNewsletterDirectory) {
        // @ts-ignore
        return await session.client.getNewsletterDirectory({
            view: 'SEARCH',
            query: text,
            categories,
            limit,
            after: startCursor
        });
    }
    
    throw new Error('Channel text search not supported');
  } catch (error) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to search channels by text');
    throw error;
  }
}

/**
 * Get Search Views
 */
export function getChannelSearchViews(): any[] {
    return [
        { value: 'RECOMMENDED', name: 'Recommended' },
        { value: 'TRENDING', name: 'Trending' },
        { value: 'NEW', name: 'New' }
    ];
}

/**
 * Get Search Categories
 */
export function getChannelSearchCategories(): any[] {
    return [
        { value: 'BUSINESS', name: 'Business' },
        { value: 'ENTERTAINMENT', name: 'Entertainment' },
        { value: 'SPORTS', name: 'Sports' },
        { value: 'LIFESTYLE', name: 'Lifestyle' },
        { value: 'ORGANIZATIONS', name: 'Organizations' },
        { value: 'PEOPLE', name: 'People' }
    ];
}

/**
 * Get Search Countries
 */
export function getChannelSearchCountries(): any[] {
    // Simplified list
    return [
        { code: 'US', name: 'United States' },
        { code: 'ID', name: 'Indonesia' },
        { code: 'BR', name: 'Brazil' },
        { code: 'IN', name: 'India' },
        // Add more as needed or fetch from a library
    ];
}
