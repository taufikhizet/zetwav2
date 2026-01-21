import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  updateWaNameSchema,
  updateWaStatusSchema,
  updateWaProfilePicSchema,
} from '../../schemas/profile.schema.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route GET /api/sessions/:sessionId/profile
 * @desc Get WhatsApp profile info
 * @scope profile:read
 */
router.get('/', requireScope('profile:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.store.getSafe(req.params.sessionId);
    const profile = await whatsappService.profile.getProfile(session);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/sessions/:sessionId/profile/name
 * @desc Update WhatsApp display name
 * @scope profile:write
 */
router.put(
  '/name',
  requireScope('profile:write'),
  validateBody(updateWaNameSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);

      await whatsappService.profile.setProfileName(
        session,
        req.body.name
      );

      res.json({
        success: true,
        message: 'Profile name updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/sessions/:sessionId/profile/status
 * @desc Update WhatsApp about/status
 * @scope profile:write
 */
router.put(
  '/status',
  requireScope('profile:write'),
  validateBody(updateWaStatusSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);

      await whatsappService.profile.setProfileStatus(
        session,
        req.body.status
      );

      res.json({
        success: true,
        message: 'Profile status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/sessions/:sessionId/profile/picture
 * @desc Update WhatsApp profile picture
 * @scope profile:write
 */
router.put(
  '/picture',
  requireScope('profile:write'),
  validateBody(updateWaProfilePicSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);

      await whatsappService.profile.setProfilePicture(
        session,
        req.body.imageUrl,
        req.body.imageBase64
      );

      res.json({
        success: true,
        message: 'Profile picture updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/sessions/:sessionId/profile/picture
 * @desc Remove WhatsApp profile picture
 * @scope profile:write
 */
router.delete('/picture', requireScope('profile:write'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.store.getSafe(req.params.sessionId);

    await whatsappService.profile.removeProfilePicture(session);

    res.json({
      success: true,
      message: 'Profile picture removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/profile/business
 * @desc Get WhatsApp Business profile info (Business accounts only)
 * @scope profile:read
 */
router.get('/business', requireScope('profile:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.store.getSafe(req.params.sessionId);

    const businessProfile = await whatsappService.profile.getBusinessProfile(session);

    res.json({
      success: true,
      data: businessProfile,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
