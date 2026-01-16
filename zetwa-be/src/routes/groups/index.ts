import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  createGroupSchema,
  updateGroupSchema,
  updateGroupSettingsSchema,
  manageParticipantsSchema,
} from '../../schemas/groups.schema.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface GroupParams extends SessionParams {
  groupId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route POST /api/sessions/:sessionId/groups
 * @desc Create a new WhatsApp group
 * @scope groups:write
 */
router.post(
  '/',
  requireScope('groups:write'),
  validateBody(createGroupSchema),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const { name, participants } = req.body;
      const result = await whatsappService.createGroup(
        req.params.sessionId,
        name,
        participants
      );

      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/groups
 * @desc Get all groups for session
 * @scope groups:read
 */
router.get('/', requireScope('groups:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const groups = await whatsappService.getGroups(req.params.sessionId);

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/groups/:groupId
 * @desc Get group info by ID
 * @scope groups:read
 */
router.get('/:groupId', requireScope('groups:read'), async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const group = await whatsappService.getGroupInfo(
      req.params.sessionId,
      req.params.groupId
    );

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/sessions/:sessionId/groups/:groupId
 * @desc Update group info (name, description)
 * @scope groups:write
 */
router.patch(
  '/:groupId',
  requireScope('groups:write'),
  validateBody(updateGroupSchema),
  async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.updateGroup(
        req.params.sessionId,
        req.params.groupId,
        req.body
      );

      res.json({
        success: true,
        message: 'Group updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PATCH /api/sessions/:sessionId/groups/:groupId/settings
 * @desc Update group settings (announce, restrict)
 * @scope groups:write
 */
router.patch(
  '/:groupId/settings',
  requireScope('groups:write'),
  validateBody(updateGroupSettingsSchema),
  async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      await whatsappService.updateGroupSettings(
        req.params.sessionId,
        req.params.groupId,
        req.body
      );

      res.json({
        success: true,
        message: 'Group settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/groups/:groupId/participants
 * @desc Get group participants
 * @scope groups:read
 */
router.get('/:groupId/participants', requireScope('groups:read'), async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const participants = await whatsappService.getGroupParticipants(
      req.params.sessionId,
      req.params.groupId
    );

    res.json({
      success: true,
      data: participants,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/groups/:groupId/participants/add
 * @desc Add participants to group
 * @scope groups:write
 */
router.post(
  '/:groupId/participants/add',
  requireScope('groups:write'),
  validateBody(manageParticipantsSchema),
  async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.addGroupParticipants(
        req.params.sessionId,
        req.params.groupId,
        req.body.participants
      );

      res.json({
        success: true,
        message: 'Participants added successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/groups/:groupId/participants/remove
 * @desc Remove participants from group
 * @scope groups:write
 */
router.post(
  '/:groupId/participants/remove',
  requireScope('groups:write'),
  validateBody(manageParticipantsSchema),
  async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.removeGroupParticipants(
        req.params.sessionId,
        req.params.groupId,
        req.body.participants
      );

      res.json({
        success: true,
        message: 'Participants removed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/groups/:groupId/participants/promote
 * @desc Promote participants to admin
 * @scope groups:write
 */
router.post(
  '/:groupId/participants/promote',
  requireScope('groups:write'),
  validateBody(manageParticipantsSchema),
  async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.promoteParticipants(
        req.params.sessionId,
        req.params.groupId,
        req.body.participants
      );

      res.json({
        success: true,
        message: 'Participants promoted to admin',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/groups/:groupId/participants/demote
 * @desc Demote participants from admin
 * @scope groups:write
 */
router.post(
  '/:groupId/participants/demote',
  requireScope('groups:write'),
  validateBody(manageParticipantsSchema),
  async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);

      const result = await whatsappService.demoteParticipants(
        req.params.sessionId,
        req.params.groupId,
        req.body.participants
      );

      res.json({
        success: true,
        message: 'Participants demoted from admin',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/groups/:groupId/leave
 * @desc Leave a group
 * @scope groups:write
 */
router.post('/:groupId/leave', requireScope('groups:write'), async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    await whatsappService.leaveGroup(
      req.params.sessionId,
      req.params.groupId
    );

    res.json({
      success: true,
      message: 'Left group successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/sessions/:sessionId/groups/:groupId/invite-code
 * @desc Get group invite link
 * @scope groups:read
 */
router.get('/:groupId/invite-code', requireScope('groups:read'), async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const inviteCode = await whatsappService.getGroupInviteCode(
      req.params.sessionId,
      req.params.groupId
    );

    res.json({
      success: true,
      data: {
        inviteCode,
        inviteLink: `https://chat.whatsapp.com/${inviteCode}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/groups/:groupId/revoke-invite
 * @desc Revoke and regenerate group invite link
 * @scope groups:write
 */
router.post('/:groupId/revoke-invite', requireScope('groups:write'), async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const newInviteCode = await whatsappService.revokeGroupInvite(
      req.params.sessionId,
      req.params.groupId
    );

    res.json({
      success: true,
      message: 'Invite link revoked successfully',
      data: {
        inviteCode: newInviteCode,
        inviteLink: `https://chat.whatsapp.com/${newInviteCode}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/sessions/:sessionId/groups/join
 * @desc Join a group via invite code
 * @scope groups:write
 */
router.post('/join/:inviteCode', requireScope('groups:write'), async (req: Request<SessionParams & { inviteCode: string }>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const groupId = await whatsappService.joinGroup(
      req.params.sessionId,
      req.params.inviteCode
    );

    res.json({
      success: true,
      message: 'Joined group successfully',
      data: { groupId },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/sessions/:sessionId/groups/:groupId/picture
 * @desc Update group profile picture
 * @scope groups:write
 */
router.patch('/:groupId/picture', requireScope('groups:write'), async (req: Request<GroupParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);

    const { imageUrl, imageBase64 } = req.body;

    await whatsappService.setGroupPicture(
      req.params.sessionId,
      req.params.groupId,
      imageUrl,
      imageBase64
    );

    res.json({
      success: true,
      message: 'Group picture updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
