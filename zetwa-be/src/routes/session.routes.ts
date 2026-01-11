import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { sessionService } from '../services/session.service.js';
import { webhookService } from '../services/webhook.service.js';
import { authenticateAny } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createSessionSchema,
  updateSessionSchema,
  createWebhookSchema,
  updateWebhookSchema,
} from '../schemas/index.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface WebhookParams extends SessionParams {
  webhookId: string;
}

const router = Router();

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route GET /api/sessions
 * @desc Get all sessions for current user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await sessionService.list(req.userId!);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions
 * @desc Create a new WhatsApp session
 */
router.post(
  '/',
  validateBody(createSessionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionService.create(req.userId!, req.body);

      res.status(201).json({
        success: true,
        message: 'Session created. Scan QR code to connect.',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId
 * @desc Get session by ID
 */
router.get('/:sessionId', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    const session = await sessionService.getById(req.userId!, req.params.sessionId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/sessions/:sessionId
 * @desc Update session
 */
router.patch(
  '/:sessionId',
  validateBody(updateSessionSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      const session = await sessionService.update(req.userId!, req.params.sessionId, req.body);

      res.json({
        success: true,
        message: 'Session updated',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/sessions/:sessionId
 * @desc Delete session
 */
router.delete('/:sessionId', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.delete(req.userId!, req.params.sessionId);

    res.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/qr
 * @desc Get QR code for session
 */
router.get('/:sessionId/qr', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    const result = await sessionService.getQRCode(req.userId!, req.params.sessionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/status
 * @desc Get session status
 */
router.get('/:sessionId/status', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    const status = await sessionService.getStatus(req.userId!, req.params.sessionId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/restart
 * @desc Restart session
 */
router.post('/:sessionId/restart', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    const result = await sessionService.restart(req.userId!, req.params.sessionId);

    res.json({
      success: true,
      message: result.message,
      data: { status: result.status },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/logout
 * @desc Logout session (disconnect WhatsApp)
 */
router.post('/:sessionId/logout', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    const result = await sessionService.logout(req.userId!, req.params.sessionId);

    res.json({
      success: true,
      message: result.message,
      data: { status: result.status },
    });
  } catch (error) {
    next(error);
  }
});

// ================================
// Webhook Routes
// ================================

/**
 * @route GET /api/sessions/:sessionId/webhooks
 * @desc Get all webhooks for session
 */
router.get('/:sessionId/webhooks', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    const webhooks = await sessionService.getWebhooks(req.userId!, req.params.sessionId);

    res.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/webhooks
 * @desc Create webhook for session
 */
router.post(
  '/:sessionId/webhooks',
  validateBody(createWebhookSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      const webhook = await sessionService.createWebhook(
        req.userId!,
        req.params.sessionId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Webhook created',
        data: webhook,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PATCH /api/sessions/:sessionId/webhooks/:webhookId
 * @desc Update webhook
 */
router.patch(
  '/:sessionId/webhooks/:webhookId',
  validateBody(updateWebhookSchema),
  async (req: Request<WebhookParams>, res: Response, next: NextFunction) => {
    try {
      const webhook = await sessionService.updateWebhook(
        req.userId!,
        req.params.sessionId,
        req.params.webhookId,
        req.body
      );

      res.json({
        success: true,
        message: 'Webhook updated',
        data: webhook,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/sessions/:sessionId/webhooks/:webhookId
 * @desc Delete webhook
 */
router.delete(
  '/:sessionId/webhooks/:webhookId',
  async (req: Request<WebhookParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.deleteWebhook(
        req.userId!,
        req.params.sessionId,
        req.params.webhookId
      );

      res.json({
        success: true,
        message: 'Webhook deleted',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/webhooks/:webhookId/test
 * @desc Test webhook
 */
router.post(
  '/:sessionId/webhooks/:webhookId/test',
  async (req: Request<WebhookParams>, res: Response, next: NextFunction) => {
    try {
      // Verify ownership
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await webhookService.testWebhook(req.params.webhookId);

      res.json({
        success: true,
        message: result.success ? 'Webhook test successful' : 'Webhook test failed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/webhooks/:webhookId/logs
 * @desc Get webhook logs
 */
router.get(
  '/:sessionId/webhooks/:webhookId/logs',
  async (req: Request<WebhookParams>, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await sessionService.getWebhookLogs(
        req.userId!,
        req.params.sessionId,
        req.params.webhookId,
        limit
      );

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
