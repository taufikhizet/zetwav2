import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createEventSchema } from '../../schemas/index.js';

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route POST /api/sessions/:sessionId/events
 * @desc Send an event (calendar)
 * @scope messages:send
 */
router.post(
  '/',
  requireScope('messages:send'),
  validateBody(createEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      
      const { to, name, description, startTime, endTime, location, canceled } = req.body;
      
      const result = await whatsappService.sendEvent(
        req.params.sessionId as string,
        to,
        {
          name,
          description,
          startTime,
          endTime,
          location,
          canceled
        }
      );
      
      res.json({
        success: true,
        message: 'Event sent',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
