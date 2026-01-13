import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  updateWaNameSchema,
  updateWaAboutSchema,
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
 */
router.get('/', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const profile = await whatsappService.getProfile(req.params.sessionId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/sessions/:sessionId/profile/name
 * @desc Update WhatsApp display name
 */
router.patch(
  '/name',
  validateBody(updateWaNameSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.setProfileName(
        req.params.sessionId,
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
 * @route PATCH /api/sessions/:sessionId/profile/about
 * @desc Update WhatsApp about/status
 */
router.patch(
  '/about',
  validateBody(updateWaAboutSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.setProfileAbout(
        req.params.sessionId,
        req.body.about
      );

      res.json({
        success: true,
        message: 'Profile about updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PATCH /api/sessions/:sessionId/profile/picture
 * @desc Update WhatsApp profile picture
 */
router.patch(
  '/picture',
  validateBody(updateWaProfilePicSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.setProfilePicture(
        req.params.sessionId,
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
 */
router.delete('/picture', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.removeProfilePicture(req.params.sessionId);

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
 */
router.get('/business', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const businessProfile = await whatsappService.getBusinessProfile(req.params.sessionId);

    res.json({
      success: true,
      data: businessProfile,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
