import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createLabelSchema, updateLabelSchema, assignLabelSchema } from '../../schemas/labels.schema.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface LabelParams extends SessionParams {
  labelId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route GET /api/sessions/:sessionId/labels
 * @desc Get all labels (WhatsApp Business only)
 * @scope labels:read
 */
router.get('/', requireScope('labels:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const labels = await whatsappService.getLabels(req.params.sessionId);

    res.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/labels
 * @desc Create a new label (WhatsApp Business only)
 * @scope labels:write
 */
router.post(
  '/',
  requireScope('labels:write'),
  validateBody(createLabelSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const label = await whatsappService.createLabel(
        req.params.sessionId,
        req.body.name,
        req.body.color
      );

      res.status(201).json({
        success: true,
        message: 'Label created successfully',
        data: label,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/labels/:labelId
 * @desc Get label by ID
 * @scope labels:read
 */
router.get('/:labelId', requireScope('labels:read'), async (req: Request<LabelParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const label = await whatsappService.getLabelById(
      req.params.sessionId,
      req.params.labelId
    );

    res.json({
      success: true,
      data: label,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/sessions/:sessionId/labels/:labelId
 * @desc Update a label
 * @scope labels:write
 */
router.patch(
  '/:labelId',
  requireScope('labels:write'),
  validateBody(updateLabelSchema),
  async (req: Request<LabelParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const label = await whatsappService.updateLabel(
        req.params.sessionId,
        req.params.labelId,
        req.body
      );

      res.json({
        success: true,
        message: 'Label updated successfully',
        data: label,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/sessions/:sessionId/labels/:labelId
 * @desc Delete a label
 * @scope labels:write
 */
router.delete('/:labelId', requireScope('labels:write'), async (req: Request<LabelParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.deleteLabel(
      req.params.sessionId,
      req.params.labelId
    );

    res.json({
      success: true,
      message: 'Label deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/labels/:labelId/chats
 * @desc Get all chats with a specific label
 * @scope labels:read
 */
router.get('/:labelId/chats', requireScope('labels:read'), async (req: Request<LabelParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const chats = await whatsappService.getChatsByLabel(
      req.params.sessionId,
      req.params.labelId
    );

    res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/labels/assign
 * @desc Assign a label to a chat
 * @scope labels:write
 */
router.post(
  '/assign',
  requireScope('labels:write'),
  validateBody(assignLabelSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.assignLabelToChat(
        req.params.sessionId,
        req.body.labelId,
        req.body.chatId
      );

      res.json({
        success: true,
        message: 'Label assigned to chat successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/labels/unassign
 * @desc Remove a label from a chat
 * @scope labels:write
 */
router.post(
  '/unassign',
  requireScope('labels:write'),
  validateBody(assignLabelSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.unassignLabelFromChat(
        req.params.sessionId,
        req.body.labelId,
        req.body.chatId
      );

      res.json({
        success: true,
        message: 'Label removed from chat successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
