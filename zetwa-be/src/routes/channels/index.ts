import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createChannelSchema, listChannelsQuerySchema } from '../../schemas/index.js';

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route GET /api/sessions/:sessionId/channels
 * @desc List channels
 * @scope channels:read
 */
router.get(
  '/',
  requireScope('channels:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      
      const channels = await whatsappService.listChannels(req.params.sessionId as string);
      
      res.json({
        success: true,
        data: channels
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/channels
 * @desc Create channel
 * @scope channels:write
 */
router.post(
  '/',
  requireScope('channels:write'),
  validateBody(createChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      
      const { name, description, picture } = req.body;
      const channel = await whatsappService.createChannel(
        req.params.sessionId as string,
        name,
        description,
        picture
      );
      
      res.json({
        success: true,
        message: 'Channel created',
        data: channel
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/channels/:id
 * @desc Get channel info
 * @scope channels:read
 */
router.get(
  '/:id',
  requireScope('channels:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      
      const channel = await whatsappService.getChannel(req.params.sessionId as string, req.params.id as string);
      
      res.json({
        success: true,
        data: channel
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/sessions/:sessionId/channels/:id
 * @desc Delete channel
 * @scope channels:write
 */
router.delete(
  '/:id',
  requireScope('channels:write'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      
      await whatsappService.deleteChannel(req.params.sessionId as string, req.params.id as string);
      
      res.json({
        success: true,
        message: 'Channel deleted'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
