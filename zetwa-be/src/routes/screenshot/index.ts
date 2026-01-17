import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { logger } from '../../utils/logger.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route GET /api/sessions/:sessionId/screenshot
 * @desc Get session screenshot (useful for debugging or QR code)
 * @scope session:read
 */
router.get(
  '/',
  requireScope('session:read'),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const buffer = await whatsappService.getScreenshot(req.params.sessionId);

      if (!buffer) {
        res.status(404).json({
          success: false,
          message: 'Screenshot not available (session might be starting or headless mode prevents it)',
        });
        return;
      }

      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
