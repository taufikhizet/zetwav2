import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { setPresenceSchema, subscribePresenceSchema } from '../../schemas/presence.schema.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface ContactParams extends SessionParams {
  contactId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route POST /api/sessions/:sessionId/presence
 * @desc Set presence status (online, offline, typing, etc.)
 * @scope presence:write
 */
router.post(
  '/',
  requireScope('presence:write'),
  validateBody(setPresenceSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { presence, chatId } = req.body;
      
      await whatsappService.setPresence(
        req.params.sessionId,
        presence,
        chatId
      );

      res.json({
        success: true,
        message: `Presence set to ${presence}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/presence/subscribe
 * @desc Subscribe to presence updates for a contact
 * @scope presence:read
 */
router.post(
  '/subscribe',
  requireScope('presence:read'),
  validateBody(subscribePresenceSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.subscribePresence(
        req.params.sessionId,
        req.body.contactId
      );

      res.json({
        success: true,
        message: 'Subscribed to presence updates',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/presence/:contactId
 * @desc Get presence status of a contact
 * @scope presence:read
 */
router.get('/:contactId', requireScope('presence:read'), async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const presence = await whatsappService.getPresence(
      req.params.sessionId,
      req.params.contactId
    );

    res.json({
      success: true,
      data: presence,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/presence/typing
 * @desc Send typing indicator to a chat
 * @scope presence:write
 */
router.post('/typing/:chatId', requireScope('presence:write'), async (req: Request<SessionParams & { chatId: string }>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.sendTyping(
      req.params.sessionId,
      req.params.chatId,
      true
    );

    res.json({
      success: true,
      message: 'Typing indicator sent',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/sessions/:sessionId/presence/typing/:chatId
 * @desc Stop typing indicator
 * @scope presence:write
 */
router.delete('/typing/:chatId', requireScope('presence:write'), async (req: Request<SessionParams & { chatId: string }>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.sendTyping(
      req.params.sessionId,
      req.params.chatId,
      false
    );

    res.json({
      success: true,
      message: 'Typing indicator stopped',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/presence/recording/:chatId
 * @desc Send recording audio indicator to a chat
 * @scope presence:write
 */
router.post('/recording/:chatId', requireScope('presence:write'), async (req: Request<SessionParams & { chatId: string }>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.sendRecording(
      req.params.sessionId,
      req.params.chatId,
      true
    );

    res.json({
      success: true,
      message: 'Recording indicator sent',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/sessions/:sessionId/presence/recording/:chatId
 * @desc Stop recording audio indicator
 * @scope presence:write
 */
router.delete('/recording/:chatId', requireScope('presence:write'), async (req: Request<SessionParams & { chatId: string }>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.sendRecording(
      req.params.sessionId,
      req.params.chatId,
      false
    );

    res.json({
      success: true,
      message: 'Recording indicator stopped',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/presence/seen/:chatId
 * @desc Mark messages as seen in a chat
 * @scope presence:write
 */
router.post('/seen/:chatId', requireScope('presence:write'), async (req: Request<SessionParams & { chatId: string }>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.markSeen(
      req.params.sessionId,
      req.params.chatId
    );

    res.json({
      success: true,
      message: 'Messages marked as seen',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
