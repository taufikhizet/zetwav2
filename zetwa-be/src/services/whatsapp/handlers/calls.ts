import type { Client } from 'whatsapp-web.js';
import type { TypedEventEmitter } from '../types.js';
import { webhookService } from '../../webhook.service.js';
import { logger } from '../../../utils/logger.js';

export function setupCallHandlers(
  client: Client,
  sessionId: string,
  events: TypedEventEmitter
): void {
  // Incoming Call
  client.on('incoming_call', (call) => {
    logger.debug({ sessionId, from: call.from }, 'Incoming call received');
    const payload = {
      sessionId,
      call: {
        id: call.id,
        from: call.from,
        isVideo: call.isVideo,
        isGroup: call.isGroup,
        timestamp: call.timestamp,
      },
    };
    events.emit('call', payload);
    webhookService.emit(sessionId, 'call.received', payload);
  });
}
