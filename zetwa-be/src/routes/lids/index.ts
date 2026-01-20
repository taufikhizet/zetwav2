
import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface LidParams extends SessionParams {
  lid: string;
}

interface PhoneParams extends SessionParams {
  phoneNumber: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route GET /api/sessions/:sessionId/lids
 * @desc Get all known LIDs
 * @scope contacts:read
 */
router.get(
  '/',
  requireScope('contacts:read'),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      const lids = await whatsappService.lids.getAllLids(session);
      res.json({
        success: true,
        data: lids,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/lids/count
 * @desc Get LIDs count
 * @scope contacts:read
 */
router.get(
  '/count',
  requireScope('contacts:read'),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      const count = await whatsappService.lids.getLidsCount(session);
      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/lids/pn/:phoneNumber
 * @desc Get LID by phone number
 * @scope contacts:read
 */
router.get(
  '/pn/:phoneNumber',
  requireScope('contacts:read'),
  async (req: Request<PhoneParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      const result = await whatsappService.lids.findLIDByPhoneNumber(session, req.params.phoneNumber);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/lids/:lid
 * @desc Get Phone Number by LID
 * @scope contacts:read
 */
router.get(
  '/:lid',
  requireScope('contacts:read'),
  async (req: Request<LidParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      const result = await whatsappService.lids.findPNByLid(session, req.params.lid);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
