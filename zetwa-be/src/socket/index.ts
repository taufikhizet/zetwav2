import { Server as SocketServer, type Socket } from 'socket.io';
import { type Server } from 'http';
import { verifyAccessToken } from '../services/jwt.service.js';
import { apiKeyService } from '../services/api-key/index.js';
import { whatsappService } from '../services/whatsapp.service.js';
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { convertQRToImage } from '../utils/qrcode.js';
import { prisma } from '../lib/prisma.js';

const logger = createLogger('socket');

interface AuthenticatedSocket extends Socket {
  userId?: string;
  authType?: 'jwt' | 'apikey';
}

export const setupSocketIO = (server: Server): SocketServer => {
  const io = new SocketServer(server, {
    cors: {
      origin: config.server.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      const apiKey = socket.handshake.auth.apiKey || socket.handshake.query.apiKey;

      if (token) {
        const payload = await verifyAccessToken(token as string);
        socket.userId = payload.userId;
        socket.authType = 'jwt';
        return next();
      }

      if (apiKey) {
        const result = await apiKeyService.validateKey(apiKey as string);
        if (result) {
          socket.userId = result.userId;
          socket.authType = 'apikey';
          return next();
        }
      }

      next(new Error('Authentication required'));
    } catch (error) {
      logger.warn({ error }, 'Socket authentication failed');
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info({ userId: socket.userId, socketId: socket.id }, 'Client connected');

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Subscribe to session events
    socket.on('subscribe:session', async (sessionId: string) => {
      // Verify user owns this session before allowing subscription
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      try {
        const session = await prisma.waSession.findFirst({
          where: {
            id: sessionId,
            userId: socket.userId,
          },
          select: { id: true },
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found or access denied' });
          logger.warn({ socketId: socket.id, sessionId, userId: socket.userId }, 'Unauthorized session subscription attempt');
          return;
        }

        socket.join(`session:${sessionId}`);
        logger.debug({ socketId: socket.id, sessionId }, 'Subscribed to session');
      } catch (error) {
        logger.error({ error, socketId: socket.id, sessionId }, 'Failed to verify session ownership');
        socket.emit('error', { message: 'Failed to subscribe to session' });
      }
    });

    // Unsubscribe from session
    socket.on('unsubscribe:session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      logger.debug({ socketId: socket.id, sessionId }, 'Unsubscribed from session');
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info({ userId: socket.userId, socketId: socket.id, reason }, 'Client disconnected');
    });
  });

  // Setup WhatsApp event forwarding
  setupWhatsAppEventForwarding(io);

  return io;
};

const setupWhatsAppEventForwarding = (io: SocketServer): void => {
  // QR Code event - convert raw QR to image before sending
  whatsappService.on('qr', async (data: { sessionId: string; userId?: string; qr: string }) => {
    try {
      // Convert raw QR string to base64 image
      const qrImage = await convertQRToImage(data.qr);
      
      io.to(`session:${data.sessionId}`).emit('session:qr', {
        sessionId: data.sessionId,
        qr: qrImage,
        timestamp: new Date().toISOString(),
      });

      if (data.userId) {
        io.to(`user:${data.userId}`).emit('session:qr', {
          sessionId: data.sessionId,
          qr: qrImage,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error({ error, sessionId: data.sessionId }, 'Failed to convert QR code');
    }
  });

  // Authenticated event
  whatsappService.on('authenticated', (data: { sessionId: string; userId?: string }) => {
    io.to(`session:${data.sessionId}`).emit('session:authenticated', {
      sessionId: data.sessionId,
      timestamp: new Date().toISOString(),
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('session:authenticated', {
        sessionId: data.sessionId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Ready event
  whatsappService.on('ready', (data: { sessionId: string; userId?: string; info?: unknown }) => {
    io.to(`session:${data.sessionId}`).emit('session:ready', {
      sessionId: data.sessionId,
      info: data.info,
      timestamp: new Date().toISOString(),
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('session:ready', {
        sessionId: data.sessionId,
        info: data.info,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Disconnected event
  whatsappService.on('disconnected', (data: { sessionId: string; userId?: string; reason?: string }) => {
    io.to(`session:${data.sessionId}`).emit('session:disconnected', {
      sessionId: data.sessionId,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('session:disconnected', {
        sessionId: data.sessionId,
        reason: data.reason,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // QR Timeout event - when max QR retries reached (abandoned session)
  whatsappService.on('qr_timeout', (data: { sessionId: string; userId?: string; reason?: string }) => {
    io.to(`session:${data.sessionId}`).emit('session:qr_timeout', {
      sessionId: data.sessionId,
      reason: data.reason,
      message: 'QR code expired. Session was not connected in time.',
      timestamp: new Date().toISOString(),
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('session:qr_timeout', {
        sessionId: data.sessionId,
        reason: data.reason,
        message: 'QR code expired. Session was not connected in time.',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Auth Timeout event
  whatsappService.on('auth_timeout', (data: { sessionId: string; userId?: string; reason?: string }) => {
    io.to(`session:${data.sessionId}`).emit('session:auth_timeout', {
      sessionId: data.sessionId,
      reason: data.reason,
      message: 'Authentication timed out. Please try again.',
      timestamp: new Date().toISOString(),
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('session:auth_timeout', {
        sessionId: data.sessionId,
        reason: data.reason,
        message: 'Authentication timed out. Please try again.',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Message received event
  whatsappService.on('message', (data: { sessionId: string; userId?: string; message?: unknown }) => {
    io.to(`session:${data.sessionId}`).emit('message:received', {
      sessionId: data.sessionId,
      message: data.message,
      timestamp: new Date().toISOString(),
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('message:received', {
        sessionId: data.sessionId,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Message sent event
  whatsappService.on('message_sent', (data: { sessionId: string; userId?: string; message?: unknown }) => {
    io.to(`session:${data.sessionId}`).emit('message:sent', {
      sessionId: data.sessionId,
      message: data.message,
      timestamp: new Date().toISOString(),
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('message:sent', {
        sessionId: data.sessionId,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Message ACK event
  whatsappService.on('message_ack', (data: { sessionId: string; messageId?: string; ack?: unknown }) => {
    io.to(`session:${data.sessionId}`).emit('message:ack', {
      sessionId: data.sessionId,
      messageId: data.messageId,
      ack: data.ack,
      timestamp: new Date().toISOString(),
    });
  });

  // State change event
  whatsappService.on('state_change', (data: { sessionId: string; state?: unknown }) => {
    io.to(`session:${data.sessionId}`).emit('session:state', {
      sessionId: data.sessionId,
      state: data.state,
      timestamp: new Date().toISOString(),
    });
  });

  // Auth failure event
  whatsappService.on('auth_failure', (data: { sessionId: string; userId?: string; message?: string }) => {
    io.to(`session:${data.sessionId}`).emit('session:auth_failure', {
      sessionId: data.sessionId,
      message: data.message,
      timestamp: new Date().toISOString(),
    });

    if (data.userId) {
      io.to(`user:${data.userId}`).emit('session:auth_failure', {
        sessionId: data.sessionId,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    }
  });
};
