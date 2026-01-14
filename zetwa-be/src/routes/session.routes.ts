import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { sessionService } from '../services/session.service.js';
import { webhookService } from '../services/webhook.service.js';
import { authenticateAny } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import {
  createSessionSchema,
  updateSessionSchema,
  createWebhookSchema,
  updateWebhookSchema,
  qrCodeQuerySchema,
  requestCodeSchema,
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
 * @desc Get QR code for session (supports format query: image or raw)
 */
router.get('/:sessionId/qr', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as 'image' | 'raw') || 'image';
    const result = await sessionService.getQRCodeWithFormat(req.userId!, req.params.sessionId, format);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/auth/qr
 * @desc Get QR code for session authentication
 * 
 * This is the RECOMMENDED endpoint for getting QR codes.
 * Design follows industry best practices from WAHA, wwebjs-api, and open-wa.
 * 
 * Query Parameters:
 * - format: 'image' (default) or 'raw' - Output format for QR code
 * - wait: 'true' to briefly wait (max 5s) if session is initializing
 * - timeout: number (ms) - Wait timeout (default: 5000, max: 10000)
 * 
 * Response Status:
 * - WORKING: Session already connected (no QR needed)
 * - AUTHENTICATING: QR scanned, waiting for auth
 * - SCAN_QR_CODE: QR available for scanning
 * - INITIALIZING/STARTING: Session starting up
 * - FAILED/DISCONNECTED/LOGGED_OUT: Needs restart (use POST /restart)
 * 
 * Best Practices:
 * - Use WebSocket for realtime QR updates (primary method)
 * - Use this endpoint for polling fallback or simple integrations
 * - For restart, explicitly call POST /sessions/:id/restart
 * 
 * @example
 * // Basic - get current QR state
 * GET /sessions/:id/auth/qr
 * 
 * @example
 * // With brief wait for session to initialize
 * GET /sessions/:id/auth/qr?wait=true
 * 
 * @example
 * // Raw QR for custom rendering
 * GET /sessions/:id/auth/qr?format=raw
 */
router.get('/:sessionId/auth/qr', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as 'image' | 'raw') || 'image';
    const wait = req.query.wait === 'true';
    const timeout = req.query.timeout ? parseInt(req.query.timeout as string, 10) : undefined;
    
    const result = await sessionService.getQRCodeSmart(
      req.userId!, 
      req.params.sessionId, 
      { format, wait, timeout }
    );

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/auth/request-code
 * @desc Request pairing code for phone number authentication (alternative to QR)
 */
router.post(
  '/:sessionId/auth/request-code',
  validateBody(requestCodeSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      const { phoneNumber, method } = req.body;
      const result = await sessionService.requestPairingCode(
        req.userId!, 
        req.params.sessionId, 
        phoneNumber, 
        method
      );

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
 * @route GET /api/sessions/:sessionId/me
 * @desc Get authenticated user information
 */
router.get('/:sessionId/me', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    const meInfo = await sessionService.getMeInfo(req.userId!, req.params.sessionId);

    res.json({
      success: true,
      data: meInfo,
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
