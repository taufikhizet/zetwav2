import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { blockContactSchema } from '../../schemas/contacts.schema.js';

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
 * @route POST /api/sessions/:sessionId/contacts/:contactId/block
 * @desc Block/Unblock a contact
 * @scope contacts:write
 */
router.post(
  '/:contactId/block',
  requireScope('contacts:write'),
  validateBody(blockContactSchema),
  async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      if (req.body.block) {
        await whatsappService.blockContact(req.params.sessionId, req.params.contactId);
      } else {
        await whatsappService.unblockContact(req.params.sessionId, req.params.contactId);
      }

      res.json({
        success: true,
        message: req.body.block ? 'Contact blocked' : 'Contact unblocked',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/contacts/:contactId/about
 * @desc Get contact about info
 * @scope contacts:read
 */
router.get(
  '/:contactId/about',
  requireScope('contacts:read'),
  async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const about = await whatsappService.getContactAbout(
        req.params.sessionId,
        req.params.contactId
      );

      res.json({
        success: true,
        data: { about },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/contacts/:contactId/profile-picture
 * @desc Get contact profile picture
 * @scope contacts:read
 */
router.get(
  '/:contactId/profile-picture',
  requireScope('contacts:read'),
  async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const profilePicUrl = await whatsappService.getProfilePicUrl(
        req.params.sessionId,
        req.params.contactId
      );

      res.json({
        success: true,
        data: { profilePicUrl },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
