/**
 * Session CRUD - Update Operations
 * Handles session updates and configuration changes
 */

import { prisma } from '../../../lib/prisma.js';
import { ConflictError } from '../../../utils/errors.js';
import { logger } from '../../../utils/logger.js';
import { getById } from './read.js';
import type { UpdateSessionInput } from '../types.js';

/**
 * Update session
 */
export async function update(userId: string, sessionId: string, input: UpdateSessionInput) {
  const session = await getById(userId, sessionId);

  if (input.name && input.name !== session.name) {
    const existing = await prisma.waSession.findUnique({
      where: {
        userId_name: {
          userId,
          name: input.name,
        },
      },
    });

    if (existing) {
      throw new ConflictError(`Session with name "${input.name}" already exists`);
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  
  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  
  // Handle config update - update dedicated columns
  if (input.config !== undefined) {
    const cfg = input.config;
    
    // Debug mode
    if (cfg.debug !== undefined) {
      updateData.debug = cfg.debug;
    }
    
    // Client configuration - handle empty object to clear values
    if (cfg.client !== undefined) {
      updateData.deviceName = cfg.client.deviceName || null;
      updateData.browserName = cfg.client.browserName || null;
    }
    
    // Proxy configuration
    if (cfg.proxy !== undefined) {
      updateData.proxyServer = cfg.proxy.server || null;
      updateData.proxyUsername = cfg.proxy.username || null;
      updateData.proxyPassword = cfg.proxy.password || null;
    }
    
    // Ignore configuration - always update all fields if ignore is provided
    if (cfg.ignore !== undefined) {
      updateData.ignoreStatus = cfg.ignore.status ?? false;
      updateData.ignoreGroups = cfg.ignore.groups ?? false;
      updateData.ignoreChannels = cfg.ignore.channels ?? false;
      updateData.ignoreBroadcast = cfg.ignore.broadcast ?? false;
    }
    
    // NOWEB engine configuration - always update all fields if noweb is provided
    if (cfg.noweb !== undefined) {
      if (cfg.noweb.store !== undefined) {
        updateData.nowebStoreEnabled = cfg.noweb.store.enabled ?? true;
        updateData.nowebFullSync = cfg.noweb.store.fullSync ?? false;
      }
      updateData.nowebMarkOnline = cfg.noweb.markOnline ?? true;
    }
    
    // User custom metadata (only user-defined key-value pairs)
    if (cfg.metadata !== undefined) {
      updateData.metadata = cfg.metadata && Object.keys(cfg.metadata).length > 0 
        ? JSON.parse(JSON.stringify(cfg.metadata)) 
        : null;
    }
    
    logger.info({ sessionId, configUpdates: Object.keys(updateData).filter(k => !['name', 'description'].includes(k)) }, 'Updating session config');
  }

  const updatedSession = await prisma.waSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  logger.info({ sessionId, userId }, 'Session updated');

  return updatedSession;
}
