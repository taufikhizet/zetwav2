import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
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
  sendPollVoteSchema,
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
 * @scope messages:send
 */
router.post(
  '/reaction',
  requireScope('messages:send'),
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
 * @scope messages:send
 */
router.delete(
  '/reaction',
  requireScope('messages:send'),
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
 * @scope messages:send
 */
router.post(
  '/send-location',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendLocationSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { to, latitude, longitude, description, url, quotedMessageId, reply_to } = req.body;
      const finalQuotedMessageId = quotedMessageId || reply_to || undefined;

      const result = await whatsappService.sendLocation(
        req.params.sessionId,
        to,
        latitude,
        longitude,
        description || undefined,
        url || undefined,
        // @ts-ignore - Check if service supports options
        { quotedMessageId: finalQuotedMessageId }
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
 * @scope messages:send
 */
router.post(
  '/send-contact',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendContactSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { to, contact, quotedMessageId, reply_to } = req.body;
      const finalQuotedMessageId = quotedMessageId || reply_to || undefined;

      // Sanitize contact object to remove nulls
      const cleanContact = {
        ...contact,
        organization: contact.organization || undefined,
        email: contact.email || undefined
      };

      const result = await whatsappService.sendContact(
        req.params.sessionId,
        to,
        cleanContact,
        { quotedMessageId: finalQuotedMessageId }
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
 * @scope messages:send
 */
router.post(
  '/send-poll',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendPollSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { to, name, options, multipleAnswers, selectableCount, quotedMessageId, reply_to } = req.body;
      const finalQuotedMessageId = quotedMessageId || reply_to || undefined;

      // Determine selectable count: 
      // 1. If selectableCount is provided, use it
      // 2. If multipleAnswers is true, allow all options
      // 3. Default to 1
      let finalSelectableCount = 1;
      if (selectableCount) {
        finalSelectableCount = selectableCount;
      } else if (multipleAnswers) {
        finalSelectableCount = options.length;
      }

      const result = await whatsappService.sendPoll(
        req.params.sessionId,
        to,
        name,
        options,
        { 
          selectableCount: finalSelectableCount,
          quotedMessageId: finalQuotedMessageId 
        }
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
 * @route POST /api/sessions/:sessionId/messages/poll-vote
 * @desc Vote on a poll
 * @scope messages:send
 */
router.post(
  '/poll-vote',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendPollVoteSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.sendPollVote(
        req.params.sessionId,
        req.body.to,
        req.body.pollMessageId,
        req.body.selectedOptions
      );
      
      res.json({
        success: true,
        message: 'Poll vote sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/messages/send-buttons
 * @desc Send a message with buttons (may not work due to WhatsApp restrictions)
 * @scope messages:send
 */
router.post(
  '/send-buttons',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendButtonsSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { to, body, buttons, title, footer, quotedMessageId, reply_to } = req.body;
      const finalQuotedMessageId = quotedMessageId || reply_to || undefined;

      const result = await whatsappService.sendButtons(
        req.params.sessionId,
        to,
        body,
        buttons,
        title || undefined,
        footer || undefined,
        // @ts-ignore - Check if service supports options
        { quotedMessageId: finalQuotedMessageId }
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
 * @scope messages:send
 */
router.post(
  '/send-list',
  requireScope('messages:send'),
  messageLimiter,
  validateBody(sendListSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { to, body, buttonText, sections, title, footer, quotedMessageId, reply_to } = req.body;
      const finalQuotedMessageId = quotedMessageId || reply_to;

      const result = await whatsappService.sendList(
        req.params.sessionId,
        to,
        body,
        buttonText,
        sections,
        title,
        footer,
        // @ts-ignore - Check if service supports options
        { quotedMessageId: finalQuotedMessageId }
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
 * @scope messages:send
 */
router.post(
  '/forward',
  requireScope('messages:send'),
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
 * @scope messages:send
 */
router.delete('/:messageId', requireScope('messages:send'), async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
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
 * @scope messages:send
 */
router.patch(
  '/:messageId',
  requireScope('messages:send'),
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
 * @scope messages:send
 */
router.post('/:messageId/star', requireScope('messages:send'), async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
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
 * @scope messages:read
 */
router.get('/starred', requireScope('messages:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
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
 * @scope media:read
 */
router.get('/:messageId/download', requireScope('media:read'), async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
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
 * @scope messages:read
 */
router.get('/:messageId/info', requireScope('messages:read'), async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
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
