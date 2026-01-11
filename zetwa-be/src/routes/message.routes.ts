import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import { whatsappService } from '../services/whatsapp.service.js';
import { sessionService } from '../services/session.service.js';
import { prisma } from '../lib/prisma.js';
import { authenticateAny } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { messageLimiter } from '../middleware/rate-limit.middleware.js';
import { sendMessageSchema, sendMediaSchema, messageQuerySchema } from '../schemas/index.js';
import { BadRequestError } from '../utils/errors.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface NumberParams extends SessionParams {
  number: string;
}

interface ContactParams extends SessionParams {
  contactId: string;
}

const router = Router();

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route POST /api/sessions/:sessionId/messages/send
 * @desc Send a text message
 */
router.post(
  '/:sessionId/messages/send',
  messageLimiter,
  validateBody(sendMessageSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      // Verify session ownership
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { to, message, quotedMessageId, mentions } = req.body;

      const sentMessage = await whatsappService.sendMessage(
        req.params.sessionId,
        to,
        message,
        { quotedMessageId, mentions }
      );

      res.json({
        success: true,
        message: 'Message sent',
        data: {
          messageId: sentMessage.id._serialized,
          to: sentMessage.to,
          timestamp: sentMessage.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/messages/send-media
 * @desc Send a media message
 */
router.post(
  '/:sessionId/messages/send-media',
  messageLimiter,
  validateBody(sendMediaSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      // Verify session ownership
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { to, mediaUrl, mediaBase64, mimetype, filename, caption } = req.body;

      let media: MessageMedia;

      if (mediaUrl) {
        // Download media from URL
        try {
          const response = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
          });

          const contentType = response.headers['content-type'] || mimetype || 'application/octet-stream';
          const base64 = Buffer.from(response.data).toString('base64');

          media = new MessageMedia(contentType, base64, filename);
        } catch (error) {
          throw new BadRequestError('Failed to download media from URL');
        }
      } else if (mediaBase64) {
        if (!mimetype) {
          throw new BadRequestError('mimetype is required when using mediaBase64');
        }
        media = new MessageMedia(mimetype, mediaBase64, filename);
      } else {
        throw new BadRequestError('Either mediaUrl or mediaBase64 is required');
      }

      const sentMessage = await whatsappService.sendMedia(
        req.params.sessionId,
        to,
        media,
        { caption }
      );

      res.json({
        success: true,
        message: 'Media sent',
        data: {
          messageId: sentMessage.id._serialized,
          to: sentMessage.to,
          timestamp: sentMessage.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/messages
 * @desc Get messages for session
 */
router.get('/:sessionId/messages', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    // Verify session ownership
    await sessionService.getById(req.userId!, req.params.sessionId);

    const query = messageQuerySchema.parse(req.query);
    const { page, limit, direction, type, chatId, startDate, endDate } = query;

    const where: Record<string, unknown> = {
      sessionId: req.params.sessionId,
    };

    if (direction) where.direction = direction;
    if (type) where.type = type;
    if (chatId) where.chatId = chatId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) (where.timestamp as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.timestamp as Record<string, Date>).lte = new Date(endDate);
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          chat: {
            select: {
              id: true,
              name: true,
              isGroup: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/chats
 * @desc Get chats for session
 */
router.get('/:sessionId/chats', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    // Verify session ownership
    await sessionService.getById(req.userId!, req.params.sessionId);

    const chats = await prisma.chat.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });

    res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/chats/live
 * @desc Get live chats from WhatsApp
 */
router.get('/:sessionId/chats/live', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    // Verify session ownership
    await sessionService.getById(req.userId!, req.params.sessionId);

    const chats = await whatsappService.getChats(req.params.sessionId);

    const formattedChats = chats.map((chat) => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      isMuted: chat.isMuted,
      unreadCount: chat.unreadCount,
      timestamp: chat.timestamp,
    }));

    res.json({
      success: true,
      data: formattedChats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/contacts
 * @desc Get contacts for session
 */
router.get('/:sessionId/contacts', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    // Verify session ownership
    await sessionService.getById(req.userId!, req.params.sessionId);

    const contacts = await prisma.contact.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/contacts/live
 * @desc Get live contacts from WhatsApp
 */
router.get('/:sessionId/contacts/live', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    // Verify session ownership
    await sessionService.getById(req.userId!, req.params.sessionId);

    const contacts = await whatsappService.getContacts(req.params.sessionId);

    const formattedContacts = contacts
      .filter((c) => c.isMyContact || c.isWAContact)
      .map((contact) => ({
        id: contact.id._serialized,
        name: contact.name,
        pushname: contact.pushname,
        number: contact.number,
        isMyContact: contact.isMyContact,
        isBusiness: contact.isBusiness,
      }));

    res.json({
      success: true,
      data: formattedContacts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/check-number/:number
 * @desc Check if a number is registered on WhatsApp
 */
router.get(
  '/:sessionId/check-number/:number',
  async (req: Request<NumberParams>, res: Response, next: NextFunction) => {
    try {
      // Verify session ownership
      await sessionService.getById(req.userId!, req.params.sessionId);

      const isRegistered = await whatsappService.isRegistered(
        req.params.sessionId,
        req.params.number
      );

      res.json({
        success: true,
        data: {
          number: req.params.number,
          isRegistered,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/profile-pic/:contactId
 * @desc Get profile picture URL for a contact
 */
router.get(
  '/:sessionId/profile-pic/:contactId',
  async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
    try {
      // Verify session ownership
      await sessionService.getById(req.userId!, req.params.sessionId);

      const url = await whatsappService.getProfilePicUrl(
        req.params.sessionId,
        req.params.contactId
      );

      res.json({
        success: true,
        data: {
          contactId: req.params.contactId,
          profilePicUrl: url || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
