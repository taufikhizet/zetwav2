import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { messageLimiter } from '../../middleware/rate-limit.middleware.js';
import {
  sendReactionSchema,
  sendLocationSchema,
  sendContactSchema,
  sendPollSchema,
  sendButtonsSchema,
  sendListSchema,
  forwardMessageSchema,
  messageActionSchema,
  editMessageSchema,
  starMessageSchema,
} from '../../schemas/messages-extended.schema.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface MessageParams extends SessionParams {
  messageId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route POST /api/sessions/:sessionId/messages/reaction
 * @desc Send a reaction to a message
 */
router.post(
  '/reaction',
  messageLimiter,
  validateBody(sendReactionSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.sendReaction(
        req.params.sessionId,
        req.body.messageId,
        req.body.reaction
      );

      res.json({
        success: true,
        message: 'Reaction sent',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/sessions/:sessionId/messages/reaction
 * @desc Remove a reaction from a message
 */
router.delete(
  '/reaction',
  validateBody(messageActionSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.removeReaction(
        req.params.sessionId,
        req.body.messageId
      );

      res.json({
        success: true,
        message: 'Reaction removed',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/messages/send-location
 * @desc Send a location message
 */
router.post(
  '/send-location',
  messageLimiter,
  validateBody(sendLocationSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.sendLocation(
        req.params.sessionId,
        req.body.to,
        req.body.latitude,
        req.body.longitude,
        req.body.description,
        req.body.url
      );

      res.json({
        success: true,
        message: 'Location sent',
        data: {
          messageId: result.id._serialized,
          to: result.to,
          timestamp: result.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/messages/send-contact
 * @desc Send a contact/vCard message
 */
router.post(
  '/send-contact',
  messageLimiter,
  validateBody(sendContactSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.sendContact(
        req.params.sessionId,
        req.body.to,
        req.body.contact
      );

      res.json({
        success: true,
        message: 'Contact sent',
        data: {
          messageId: result.id._serialized,
          to: result.to,
          timestamp: result.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/messages/send-poll
 * @desc Send a poll message
 */
router.post(
  '/send-poll',
  messageLimiter,
  validateBody(sendPollSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.sendPoll(
        req.params.sessionId,
        req.body.to,
        req.body.name,
        req.body.options,
        req.body.allowMultipleAnswers
      );

      res.json({
        success: true,
        message: 'Poll sent',
        data: {
          messageId: result.id._serialized,
          to: result.to,
          timestamp: result.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/messages/send-buttons
 * @desc Send a message with buttons (may not work due to WhatsApp restrictions)
 */
router.post(
  '/send-buttons',
  messageLimiter,
  validateBody(sendButtonsSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.sendButtons(
        req.params.sessionId,
        req.body.to,
        req.body.body,
        req.body.buttons,
        req.body.title,
        req.body.footer
      );

      res.json({
        success: true,
        message: 'Buttons message sent',
        data: {
          messageId: result.id._serialized,
          to: result.to,
          timestamp: result.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/messages/send-list
 * @desc Send a list message (may not work due to WhatsApp restrictions)
 */
router.post(
  '/send-list',
  messageLimiter,
  validateBody(sendListSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.sendList(
        req.params.sessionId,
        req.body.to,
        req.body.body,
        req.body.buttonText,
        req.body.sections,
        req.body.title,
        req.body.footer
      );

      res.json({
        success: true,
        message: 'List message sent',
        data: {
          messageId: result.id._serialized,
          to: result.to,
          timestamp: result.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/messages/forward
 * @desc Forward a message to another chat
 */
router.post(
  '/forward',
  messageLimiter,
  validateBody(forwardMessageSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.forwardMessage(
        req.params.sessionId,
        req.body.messageId,
        req.body.to
      );

      res.json({
        success: true,
        message: 'Message forwarded',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/sessions/:sessionId/messages/:messageId
 * @desc Delete a message (for everyone or just for me)
 */
router.delete('/:messageId', async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const forEveryone = req.query.forEveryone === 'true';

    await whatsappService.deleteMessage(
      req.params.sessionId,
      req.params.messageId,
      forEveryone
    );

    res.json({
      success: true,
      message: forEveryone ? 'Message deleted for everyone' : 'Message deleted for me',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/sessions/:sessionId/messages/:messageId
 * @desc Edit a sent message
 */
router.patch(
  '/:messageId',
  validateBody(editMessageSchema.pick({ newContent: true })),
  async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.editMessage(
        req.params.sessionId,
        req.params.messageId,
        req.body.newContent
      );

      res.json({
        success: true,
        message: 'Message edited successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/messages/:messageId/star
 * @desc Star or unstar a message
 */
router.post('/:messageId/star', async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const star = req.body.star !== false; // Default to true

    await whatsappService.starMessage(
      req.params.sessionId,
      req.params.messageId,
      star
    );

    res.json({
      success: true,
      message: star ? 'Message starred' : 'Message unstarred',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/messages/starred
 * @desc Get all starred messages
 */
router.get('/starred', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const messages = await whatsappService.getStarredMessages(req.params.sessionId);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/messages/:messageId/download
 * @desc Download media from a message
 */
router.get('/:messageId/download', async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const media = await whatsappService.downloadMedia(
      req.params.sessionId,
      req.params.messageId
    );

    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/messages/:messageId/info
 * @desc Get message info (read by, delivered to, etc.)
 */
router.get('/:messageId/info', async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const info = await whatsappService.getMessageInfo(
      req.params.sessionId,
      req.params.messageId
    );

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
