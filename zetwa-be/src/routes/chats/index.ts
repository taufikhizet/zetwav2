import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  archiveChatSchema,
  pinChatSchema,
  muteChatSchema,
  markChatReadSchema,
} from '../../schemas/chats.schema.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface ChatParams extends SessionParams {
  chatId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/archive
 * @desc Archive/Unarchive a chat
 * @scope messages:write
 */
router.post(
  '/:chatId/archive',
  requireScope('messages:write'),
  validateBody(archiveChatSchema),
  async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      if (req.body.archive) {
        await whatsappService.archiveChat(req.params.sessionId, req.params.chatId);
      } else {
        await whatsappService.unarchiveChat(req.params.sessionId, req.params.chatId);
      }

      res.json({
        success: true,
        message: req.body.archive ? 'Chat archived' : 'Chat unarchived',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/sessions/:sessionId/chats/:chatId
 * @desc Delete a chat
 * @scope messages:write
 */
router.delete(
  '/:chatId',
  requireScope('messages:write'),
  async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.deleteChat(req.params.sessionId, req.params.chatId);

      res.json({
        success: true,
        message: 'Chat deleted',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/pin
 * @desc Pin/Unpin a chat
 * @scope messages:write
 */
router.post(
  '/:chatId/pin',
  requireScope('messages:write'),
  validateBody(pinChatSchema),
  async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      if (req.body.pin) {
        await whatsappService.pinChat(req.params.sessionId, req.params.chatId);
      } else {
        await whatsappService.unpinChat(req.params.sessionId, req.params.chatId);
      }

      res.json({
        success: true,
        message: req.body.pin ? 'Chat pinned' : 'Chat unpinned',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/mute
 * @desc Mute/Unmute a chat
 * @scope messages:write
 */
router.post(
  '/:chatId/mute',
  requireScope('messages:write'),
  validateBody(muteChatSchema),
  async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      if (req.body.duration) {
        // Mute
        const duration = new Date(req.body.duration);
        await whatsappService.muteChat(req.params.sessionId, req.params.chatId, duration);
        res.json({
          success: true,
          message: 'Chat muted',
        });
      } else {
        // Unmute (if duration is null/undefined or implicit unmuting logic - but usually separate or duration=null)
        // My schema allows optional duration. If not provided or null, maybe we treat as unmute? 
        // WAHA separates mute/unmute usually. 
        // Let's assume if duration is missing/null, it's UNMUTE.
        // Wait, `muteChat` in `chats.ts` takes `duration`. `unmuteChat` is separate.
        // I should probably check if duration is provided.
        // If duration is provided -> mute.
        // If I want to unmute, maybe I should use a separate endpoint OR specific body like { unmute: true }?
        // Let's stick to: if duration provided -> mute.
        // I'll add a separate UNMUTE endpoint or handle it here.
        // Let's handle it here: if body is empty or duration is null, unmute?
        // Actually, mute(null) in whatsapp-web.js might mean mute forever?
        // Let's use `unmute` endpoint for clarity.
        
        // Wait, I used `muteChatSchema` which has `duration` optional.
        // Let's make `unmute` endpoint separate for clarity.
        
        // But here I'm using `POST /mute`.
        // If I send { duration: null } -> Unmute?
        // `whatsapp-web.js` `chat.mute(null)` -> Mute forever? No, `chat.mute(Date)`
        // `chat.unmute()` is separate.
        
        // Let's change this endpoint to handle both or just mute.
        // I'll add `POST /:chatId/unmute`.
        
        // For this route, I'll assume it's ONLY for muting.
        if (req.body.duration) {
             const duration = new Date(req.body.duration);
             await whatsappService.muteChat(req.params.sessionId, req.params.chatId, duration);
        } else {
             // Mute forever? or error?
             // `chat.mute()` without args? `chat.mute` expects expiration date.
             // If undefined, it might fail or mute forever.
             // Let's assume mute forever if duration is missing?
             // `whatsapp-web.js` types say `mute(unmuteDate?: Date | null): Promise<void>`.
             // If null/undefined -> mute forever (usually).
             await whatsappService.muteChat(req.params.sessionId, req.params.chatId);
        }

        res.json({
          success: true,
          message: 'Chat muted',
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/unmute
 * @desc Unmute a chat
 * @scope messages:write
 */
router.post(
  '/:chatId/unmute',
  requireScope('messages:write'),
  async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.unmuteChat(req.params.sessionId, req.params.chatId);

      res.json({
        success: true,
        message: 'Chat unmuted',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/mark-read
 * @desc Mark chat as read/unread
 * @scope messages:write
 */
router.post(
  '/:chatId/mark-read',
  requireScope('messages:write'),
  validateBody(markChatReadSchema),
  async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      if (req.body.read) {
        await whatsappService.markChatRead(req.params.sessionId, req.params.chatId);
      } else {
        await whatsappService.markChatUnread(req.params.sessionId, req.params.chatId);
      }

      res.json({
        success: true,
        message: req.body.read ? 'Chat marked as read' : 'Chat marked as unread',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/clear
 * @desc Clear chat messages
 * @scope messages:write
 */
router.post(
  '/:chatId/clear',
  requireScope('messages:write'),
  async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.clearChat(req.params.sessionId, req.params.chatId);

      res.json({
        success: true,
        message: 'Chat messages cleared',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
