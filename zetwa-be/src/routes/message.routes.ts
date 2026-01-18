import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import { whatsappService } from '../services/whatsapp.service.js';
import { sessionService } from '../services/session.service.js';
import { prisma } from '../lib/prisma.js';
import { authenticateAny, requireScope } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { messageLimiter } from '../middleware/rate-limit.middleware.js';
import { 
  sendMessageSchema, 
  sendMediaSchema, 
  messageQuerySchema,
  sendPollSchema,
  sendLocationSchema,
  sendContactSchema,
  sendVoiceSchema,
  sendReactionSchema
} from '../schemas/index.js';
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
 * @scope messages:send
 */
router.post(
  '/:sessionId/messages/send',
  requireScope('messages:send'),
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
 * @scope messages:send, media:write
 */
router.post(
  '/:sessionId/messages/send-media',
  requireScope('messages:send', 'media:write'),
  messageLimiter,
  validateBody(sendMediaSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      // Verify session ownership
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { to, mediaUrl, mediaBase64, mimetype, filename, caption, quotedMessageId } = req.body;

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
        { caption, quotedMessageId }
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
 * @route POST /api/sessions/:sessionId/messages/send-voice
 * @desc Send a voice message (PTT)
 * @scope messages:send, media:write
 */
router.post(
  '/:sessionId/messages/send-voice',
  requireScope('messages:send', 'media:write'),
  messageLimiter,
  validateBody(sendVoiceSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      // Verify session ownership
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { to, mediaUrl, mediaBase64, mimetype, quotedMessageId } = req.body;

      let media: MessageMedia;

      if (mediaUrl) {
        try {
          const response = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
          });
          const contentType = response.headers['content-type'] || mimetype || 'audio/ogg';
          const base64 = Buffer.from(response.data).toString('base64');
          media = new MessageMedia(contentType, base64);
        } catch (error) {
          throw new BadRequestError('Failed to download media from URL');
        }
      } else if (mediaBase64) {
        media = new MessageMedia(mimetype || 'audio/ogg', mediaBase64);
      } else {
        throw new BadRequestError('Either mediaUrl or mediaBase64 is required');
      }

      const sentMessage = await whatsappService.sendMedia(
        req.params.sessionId,
        to,
        media,
        { quotedMessageId, sendAudioAsVoice: true }
      );

      res.json({
        success: true,
        message: 'Voice message sent',
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

/*
/**
 * @route POST /api/sessions/:sessionId/messages/send-poll
 * @desc Send a poll message
 * @scope messages:send
 */
/*
router.post(
  '/:sessionId/messages/send-poll',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendPollSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const { to, name, options, selectableCount, quotedMessageId } = req.body;

      const sentMessage = await whatsappService.sendPoll(
        req.params.sessionId,
        to,
        name,
        options,
        { selectableCount, quotedMessageId }
      );

      res.json({
        success: true,
        message: 'Poll sent',
        data: {
          messageId: sentMessage.id._serialized,
          to: sentMessage.to,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
*/

/**
 * @route POST /api/sessions/:sessionId/messages/send-location
 * @desc Send a location message
 * @scope messages:send
 */
router.post(
  '/:sessionId/messages/send-location',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendLocationSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const { to, latitude, longitude, title, quotedMessageId } = req.body;

      const sentMessage = await whatsappService.sendLocation(
        req.params.sessionId,
        to,
        latitude,
        longitude,
        title,
        { quotedMessageId }
      );

      res.json({
        success: true,
        message: 'Location sent',
        data: {
          messageId: sentMessage.id._serialized,
          to: sentMessage.to,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
/**
 * @route POST /api/sessions/:sessionId/messages/send-contact
 * @desc Send a contact message
 * @scope messages:send
 */
/*
router.post(
  '/:sessionId/messages/send-contact',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendContactSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const { to, contactId, quotedMessageId } = req.body;

      const sentMessage = await whatsappService.sendContact(
        req.params.sessionId,
        to,
        contactId,
        { quotedMessageId }
      );

      res.json({
        success: true,
        message: 'Contact sent',
        data: {
          messageId: sentMessage.id._serialized,
          to: sentMessage.to,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
*/

/*
/**
 * @route POST /api/sessions/:sessionId/messages/send-reaction
 * @desc Send a reaction to a message
 * @scope messages:send
 */
/*
router.post(
  '/:sessionId/messages/send-reaction',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendReactionSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const { messageId, reaction } = req.body;

      await whatsappService.sendReaction(
        req.params.sessionId,
        messageId,
        reaction
      );

      res.json({
        success: true,
        message: 'Reaction sent',
      });
    } catch (error) {
      next(error);
    }
  }
);
*/

/**
 * @route GET /api/sessions/:sessionId/messages
 * @desc Get messages for session
 * @scope messages:read
 */
router.get('/:sessionId/messages', requireScope('messages:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    // Verify session ownership
    await sessionService.getById(req.userId!, req.params.sessionId);

    const query = messageQuerySchema.parse(req.query);
    const { page, limit, direction, type, chatId, startDate, endDate } = query;

    const where: Record<string, unknown> = {
      sessionId: req.params.sessionId,
    };

    if (direction && (direction === 'asc' || direction === 'desc')) {
      // It's sort order, not filter
    } else if (direction) {
      where.direction = direction;
    }

    if (type) where.type = type;
    if (chatId) {
      if (chatId.includes('@')) {
        // If chatId is a WhatsApp ID (e.g., 628xxx@c.us), filter by relation
        where.chat = { waChatId: chatId };
      } else {
        // Otherwise assume it's an internal CUID
        where.chatId = chatId;
      }
    }
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
        orderBy: { timestamp: direction === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    // Map messages to include from/to from metadata if not present in schema
    const messagesMapped = messages.map(msg => {
      const metadata = msg.metadata as Record<string, any> || {};
      return {
        ...msg,
        id: msg.waMessageId || msg.id, // Prefer WA ID if available, or maybe we should return object? WAHA returns string.
        _dbId: msg.id, // Keep DB ID just in case
        timestamp: Math.floor(msg.timestamp.getTime() / 1000), // Convert to unix timestamp (seconds)
        from: metadata.from || msg.chatId, // Fallback to chatId if missing (approximate)
        to: metadata.to,
        author: metadata.author,
        _data: metadata, // WAHA compatibility
      };
    });

    res.json({
      success: true,
      data: {
        messages: messagesMapped,
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
 * @scope messages:read
 */
router.get('/:sessionId/chats', requireScope('messages:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    // Verify session ownership
    await sessionService.getById(req.userId!, req.params.sessionId);

    const chats = await prisma.chat.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });

    const formattedChats = chats.map(chat => ({
      ...chat,
      id: chat.waChatId, // Use WhatsApp ID (e.g. 123@c.us) instead of DB ID
      _dbId: chat.id,
      timestamp: chat.lastMessageAt ? Math.floor(chat.lastMessageAt.getTime() / 1000) : 0,
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
 * @route GET /api/sessions/:sessionId/chats/live
 * @desc Get live chats from WhatsApp
 * @scope messages:read
 */
router.get('/:sessionId/chats/live', requireScope('messages:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
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
 * @scope contacts:read
 */
router.get('/:sessionId/contacts', requireScope('contacts:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    // Verify session ownership
    await sessionService.getById(req.userId!, req.params.sessionId);

    const contacts = await prisma.contact.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { name: 'asc' },
    });

    const formattedContacts = contacts.map(contact => ({
      ...contact,
      id: contact.waContactId, // Use WA ID
      _dbId: contact.id,
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
 * @route GET /api/sessions/:sessionId/contacts/live
 * @desc Get live contacts from WhatsApp
 * @scope contacts:read
 */
router.get('/:sessionId/contacts/live', requireScope('contacts:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
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
 * @scope contacts:read
 */
router.get(
  '/:sessionId/check-number/:number',
  requireScope('contacts:read'),
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
 * @scope contacts:read
 */
router.get(
  '/:sessionId/profile-pic/:contactId',
  requireScope('contacts:read'),
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
