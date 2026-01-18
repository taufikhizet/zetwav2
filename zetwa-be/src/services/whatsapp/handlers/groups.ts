import type { Client } from 'whatsapp-web.js';
import type { TypedEventEmitter } from '../types.js';
import { webhookService } from '../../webhook.service.js';
import { logger } from '../../../utils/logger.js';

export function setupGroupHandlers(
  client: Client,
  sessionId: string,
  events: TypedEventEmitter
): void {
  // Group Join (Participant Added)
  client.on('group_join', (notification) => {
    logger.debug({ sessionId, groupId: notification.chatId, type: notification.type }, 'Group participant joined');
    const payload = {
      sessionId,
      groupId: notification.chatId,
      participants: notification.recipientIds,
      type: notification.type,
    };
    events.emit('group_join', payload);
    webhookService.emit(sessionId, 'group.join', payload);
  });

  // Group Leave (Participant Removed/Left)
  client.on('group_leave', (notification) => {
    logger.debug({ sessionId, groupId: notification.chatId, type: notification.type }, 'Group participant left');
    const payload = {
      sessionId,
      groupId: notification.chatId,
      participant: notification.recipientIds[0] || 'unknown', // Usually one person leaves
      type: notification.type,
    };
    events.emit('group_leave', payload);
    webhookService.emit(sessionId, 'group.leave', payload);
  });

  // Group Update (Subject, Desc, etc.)
  client.on('group_update', (notification) => {
    logger.debug({ sessionId, groupId: notification.chatId, type: notification.type }, 'Group updated');
    const payload = {
      sessionId,
      groupId: notification.chatId,
      update: notification.type,
      value: notification.body,
      author: notification.author,
    };
    events.emit('group_update', payload);
    webhookService.emit(sessionId, 'group.update', payload);
  });
}
