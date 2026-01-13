import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { postTextStatusSchema, postMediaStatusSchema, deleteStatusSchema } from '../../schemas/status.schema.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface StatusParams extends SessionParams {
  statusId: string;
}

interface ContactParams extends SessionParams {
  contactId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route GET /api/sessions/:sessionId/status
 * @desc Get my status updates
 */
router.get('/', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const statuses = await whatsappService.getMyStatuses(req.params.sessionId);

    res.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/status/contacts
 * @desc Get status updates from contacts
 */
router.get('/contacts', async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const statuses = await whatsappService.getContactStatuses(req.params.sessionId);

    res.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/status/contact/:contactId
 * @desc Get status updates from a specific contact
 */
router.get('/contact/:contactId', async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const statuses = await whatsappService.getContactStatus(
      req.params.sessionId,
      req.params.contactId
    );

    res.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/status/text
 * @desc Post a text status update
 */
router.post(
  '/text',
  validateBody(postTextStatusSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.postTextStatus(
        req.params.sessionId,
        req.body.text,
        req.body.backgroundColor,
        req.body.font
      );

      res.status(201).json({
        success: true,
        message: 'Status posted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/status/media
 * @desc Post a media status update (image/video)
 */
router.post(
  '/media',
  validateBody(postMediaStatusSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.postMediaStatus(
        req.params.sessionId,
        req.body.mediaUrl,
        req.body.mediaBase64,
        req.body.mimetype,
        req.body.caption
      );

      res.status(201).json({
        success: true,
        message: 'Media status posted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/sessions/:sessionId/status/:statusId
 * @desc Delete a status update
 */
router.delete('/:statusId', async (req: Request<StatusParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.deleteStatus(
      req.params.sessionId,
      req.params.statusId
    );

    res.json({
      success: true,
      message: 'Status deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/status/:statusId/seen
 * @desc Mark a status as seen
 */
router.post('/:statusId/seen', async (req: Request<StatusParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.markStatusSeen(
      req.params.sessionId,
      req.params.statusId
    );

    res.json({
      success: true,
      message: 'Status marked as seen',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
