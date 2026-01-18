import type { Client } from 'whatsapp-web.js';
import type { WASession, SessionStatus, TypedEventEmitter } from '../types.js';
import { prisma } from '../../../lib/prisma.js';
import { webhookService } from '../../webhook.service.js';
import { logger } from '../../../utils/logger.js';

export function setupConnectionHandlers(
  client: Client,
  sessionId: string,
  sessions: Map<string, WASession>,
  events: TypedEventEmitter,
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void
): void {
  // QR Code event
  client.on('qr', async (qr) => {
    logger.info({ sessionId }, 'QR code received');

    const session = sessions.get(sessionId);
    if (session) {
      session.qrCode = qr;
      session.status = 'SCAN_QR';
    }

    updateSessionStatus(sessionId, 'SCAN_QR');

    // Save QR to database
    await prisma.waSession.update({
      where: { id: sessionId },
      data: {
        qrCode: qr,
        lastQrAt: new Date(),
        status: 'QR_READY',
      },
    });

    // Emit to socket and webhook
    events.emit('qr', { sessionId, userId: session?.userId, qr });
    webhookService.emit(sessionId, 'session.qr', { qr });
  });

  // Authenticated event
  client.on('authenticated', async () => {
    logger.info({ sessionId }, 'Session authenticated');

    const session = sessions.get(sessionId);
    if (session) {
      session.status = 'AUTHENTICATED';
    }

    updateSessionStatus(sessionId, 'AUTHENTICATED');

    await prisma.waSession.update({
      where: { id: sessionId },
      data: {
        status: 'AUTHENTICATING',
        qrCode: null,
      },
    });

    events.emit('authenticated', { sessionId, userId: session?.userId });
    webhookService.emit(sessionId, 'session.authenticated', {});
  });

  // Ready event
  client.on('ready', async () => {
    logger.info({ sessionId }, 'Session ready');

    const session = sessions.get(sessionId);
    if (!session) return;

    session.status = 'CONNECTED';

    // Get client info
    const info = client.info;
    const phoneNumber = info?.wid?.user || '';
    const pushName = info?.pushname || '';

    session.phoneNumber = phoneNumber;
    session.pushName = pushName;

    updateSessionStatus(sessionId, 'CONNECTED');

    // Get profile picture
    let profilePicUrl: string | undefined;
    try {
      profilePicUrl = await client.getProfilePicUrl(info.wid._serialized);
    } catch {
      // Profile picture might not be available
    }

    await prisma.waSession.update({
      where: { id: sessionId },
      data: {
        status: 'CONNECTED',
        phoneNumber,
        pushName,
        profilePicUrl,
        connectedAt: new Date(),
        qrCode: null,
      },
    });

    events.emit('ready', { sessionId, userId: session.userId, info: { phoneNumber, pushName } });
    webhookService.emit(sessionId, 'session.ready', { phoneNumber, pushName, profilePicUrl });
  });

  // Disconnected event
  client.on('disconnected', async (reason) => {
    logger.warn({ sessionId, reason }, 'Session disconnected');

    const session = sessions.get(sessionId);
    if (session) {
      session.status = 'DISCONNECTED';
    }

    updateSessionStatus(sessionId, 'DISCONNECTED');

    await prisma.waSession.update({
      where: { id: sessionId },
      data: {
        status: 'DISCONNECTED',
        disconnectedAt: new Date(),
      },
    });

    events.emit('disconnected', { sessionId, userId: session?.userId, reason: String(reason) });
    webhookService.emit(sessionId, 'session.disconnected', { reason });
  });

  // Auth failure event
  client.on('auth_failure', async (error) => {
    const errorMessage = String(error);
    const isQRTimeout = errorMessage.toLowerCase().includes('timeout') || 
                        errorMessage.toLowerCase().includes('retry') ||
                        errorMessage.toLowerCase().includes('qr');
    
    logger.error({ sessionId, error, isQRTimeout }, 'Authentication failed');

    const session = sessions.get(sessionId);
    if (session) {
      session.status = 'FAILED';
      session.qrCode = undefined; // Clear stale QR
    }

    updateSessionStatus(sessionId, 'FAILED');

    await prisma.waSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
        qrCode: null,
      },
    });

    // Emit both auth_failure and qr_timeout
    events.emit('auth_failure', { sessionId, userId: session?.userId, message: errorMessage });
    webhookService.emit(sessionId, 'session.failed', { error: errorMessage });
    
    if (isQRTimeout) {
      events.emit('qr_timeout', { 
        sessionId, 
        userId: session?.userId, 
        reason: 'QR code was not scanned in time' 
      });
      webhookService.emit(sessionId, 'session.qr_timeout', { 
        reason: 'QR code expired after max retries' 
      });
    }
  });

  // State change event
  client.on('change_state', async (state) => {
    logger.debug({ sessionId, state }, 'State changed');

    // Map WhatsApp state to our status
    let status: SessionStatus = 'DISCONNECTED';
    switch (state) {
      case 'CONNECTED':
        status = 'CONNECTED';
        break;
      case 'OPENING':
      case 'PAIRING':
        status = 'AUTHENTICATING';
        break;
      case 'TIMEOUT':
      case 'CONFLICT':
      case 'UNLAUNCHED':
        status = 'DISCONNECTED';
        break;
    }

    const session = sessions.get(sessionId);
    if (session && session.status !== status) {
      session.status = status;
      updateSessionStatus(sessionId, status);
    }
  });
}
