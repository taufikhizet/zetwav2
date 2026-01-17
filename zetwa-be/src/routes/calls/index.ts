import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { rejectCallSchema } from '../../schemas/index.js';

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route POST /api/sessions/:sessionId/calls/reject
 * @desc Reject incoming call
 * @scope calls:write
 */
router.post(
  '/reject',
  requireScope('calls:write'), // Ensure this scope exists or use generic
  validateBody(rejectCallSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      
      const { callId } = req.body;
      
      await whatsappService.rejectCall(req.params.sessionId as string, callId);
      
      res.json({
        success: true,
        message: 'Call rejected'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
