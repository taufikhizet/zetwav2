import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import { whatsappService } from '../services/whatsapp.service.js';
import { sessionService } from '../services/session.service.js';
import { authenticateAny, requireScope } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { messageLimiter } from '../middleware/rate-limit.middleware.js';
import { 
  sendMessageSchema, 
  sendMediaSchema, 
  messageQuerySchema,
  sendLocationSchema,
  sendVoiceSchema
} from '../schemas/index.js';
import { BadRequestError } from '../utils/errors.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
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
 * @scope messages:read
 */
router.get('/:sessionId/messages', requireScope('messages:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    // Verify session ownership
    await sessionService.getById(req.userId!, req.params.sessionId);

    const query = messageQuerySchema.parse(req.query);
    const result = await whatsappService.history.getMessages(
      req.params.sessionId,
      {
        page: query.page,
        limit: query.limit,
        direction: query.direction,
        type: query.type,
        chatId: query.chatId,
        startDate: query.startDate,
        endDate: query.endDate,
      }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
