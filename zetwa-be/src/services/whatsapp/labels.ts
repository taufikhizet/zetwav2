/**
 * WhatsApp Labels Functions (Business API)
 */

import type { WASession, LabelUpdate } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import type { Client } from 'whatsapp-web.js';

// Helper to get Puppeteer page
function getPage(client: Client): any {
  // @ts-ignore
  return client.pupPage;
}

/**
 * Get all labels
 */
export async function getLabels(session: WASession): Promise<Array<{
  id: string;
  name: string;
  color: number;
}>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    const labels = await session.client.getLabels();
    
    // Fallback: If client.getLabels() returns empty, try direct store access
    // This handles cases where whatsapp-web.js might filter or fail silently
    if (!labels || labels.length === 0) {
      const page = getPage(session.client);
      if (page) {
        const rawLabels = await page.evaluate(() => {
          try {
            // @ts-ignore
            if (window.Store && window.Store.Label) {
              // @ts-ignore
              const models = window.Store.Label.getModelsArray();
              return models.map((l: any) => ({
                id: l.id,
                name: l.name,
                hexColor: l.hexColor
              }));
            }
          } catch (e) {
            return null;
          }
          return [];
        });

        if (rawLabels && rawLabels.length > 0) {
          logger.warn({ sessionId: session.sessionId }, 'Client.getLabels() returned empty but Store.Label has data. Using direct data.');
          return rawLabels.map((label: any) => ({
            id: label.id,
            name: label.name,
            color: label.hexColor ? parseInt(label.hexColor.replace('#', ''), 16) : 0,
          }));
        }
      }
    }

    return labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.hexColor ? parseInt(label.hexColor.replace('#', ''), 16) : 0,
    }));
  } catch (error: any) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to get labels');
    throw new BadRequestError(error.message || 'Failed to get labels');
  }
}

/**
 * Create a new label
 */
export async function createLabel(
  session: WASession,
  name: string,
  color?: number
): Promise<{ id: string; name: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const page = getPage(session.client);
  if (!page) {
    throw new BadRequestError('Puppeteer page not available');
  }

  try {
    // Use WAWebBizLabelEditingAction directly as in WAHA
    const labelId: number = await page.evaluate(async (name: string, color: number) => {
      // @ts-ignore
      const action = window.require('WAWebBizLabelEditingAction');
      return await action.labelAddAction(name, color);
    }, name, color || 0);

    return {
      id: labelId.toString(),
      name: name,
    };
  } catch (error: any) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to create label');
    throw new BadRequestError(error.message || 'Failed to create label');
  }
}

/**
 * Get label by ID
 */
export async function getLabelById(
  session: WASession,
  labelId: string
): Promise<{ id: string; name: string; color: number }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  try {
    const label = await session.client.getLabelById(labelId);
    
    if (!label) {
      throw new BadRequestError('Label not found');
    }

    return {
      id: label.id,
      name: label.name,
      color: label.hexColor ? parseInt(label.hexColor.replace('#', ''), 16) : 0,
    };
  } catch (error: any) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to get label by ID');
    throw new BadRequestError(error.message || 'Failed to get label');
  }
}

/**
 * Update a label
 */
export async function updateLabel(
  session: WASession,
  labelId: string,
  updates: LabelUpdate
): Promise<{ id: string; name: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const page = getPage(session.client);
  if (!page) {
    throw new BadRequestError('Puppeteer page not available');
  }
  
  try {
    // Fetch current label to get missing fields if needed, but for update we just pass what we have
    // WAHA implementation: labelEditAction(id, name, predefinedId, color)
    // We need name and color. If not provided in updates, we should probably fetch them.
    let currentName = updates.name;
    let currentColor = updates.color;

    if (!currentName || currentColor === undefined) {
        const currentLabel = await getLabelById(session, labelId);
        if (!currentName) currentName = currentLabel.name;
        if (currentColor === undefined) currentColor = currentLabel.color;
    }

    await page.evaluate(async (id: string, name: string, color: number) => {
      // @ts-ignore
      const action = window.require('WAWebBizLabelEditingAction');
      return await action.labelEditAction(id, name, undefined, color);
    }, labelId, currentName!, currentColor!);
      
    return {
      id: labelId,
      name: currentName!,
    };
  } catch (error: any) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to update label');
    throw new BadRequestError(error.message || 'Failed to update label');
  }
}

/**
 * Delete a label
 */
export async function deleteLabel(session: WASession, labelId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const page = getPage(session.client);
  if (!page) {
    throw new BadRequestError('Puppeteer page not available');
  }

  try {
    // WAHA requires name and color for deletion too
    const label = await getLabelById(session, labelId);

    await page.evaluate(async (id: string, name: string, color: number) => {
      // @ts-ignore
      const action = window.require('WAWebBizLabelEditingAction');
      return await action.labelDeleteAction(id, name, color);
    }, labelId, label.name, label.color);

  } catch (error: any) {
    logger.error({ sessionId: session.sessionId, error }, 'Failed to delete label');
    throw new BadRequestError(error.message || 'Failed to delete label');
  }
}

/**
 * Get chats by label
 */
export async function getChatsByLabel(
  session: WASession,
  labelId: string
): Promise<Array<{ id: string; name: string }>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chats = await session.client.getChatsByLabelId(labelId);
  
  return chats.map((chat) => ({
    id: chat.id._serialized,
    name: chat.name,
  }));
}

/**
 * Assign label to chat
 */
export async function assignLabelToChat(
  session: WASession,
  labelId: string,
  chatId: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(chatId);
  
  // Get current labels and add new one
  const currentLabels: string[] = (chat as unknown as { labels?: string[] }).labels || [];
  if (!currentLabels.includes(labelId)) {
    await chat.changeLabels([...currentLabels, labelId]);
  }
  
  logger.debug({ sessionId: session.sessionId, labelId, chatId }, 'Label assigned to chat');
}

/**
 * Unassign label from chat
 */
export async function unassignLabelFromChat(
  session: WASession,
  labelId: string,
  chatId: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(chatId);
  
  // Get current labels and remove the specified one
  const currentLabels: string[] = (chat as unknown as { labels?: string[] }).labels || [];
  const newLabels = currentLabels.filter((l: string) => l !== labelId);
  await chat.changeLabels(newLabels);
  
  logger.debug({ sessionId: session.sessionId, labelId, chatId }, 'Label removed from chat');
}
