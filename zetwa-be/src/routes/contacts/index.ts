
import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { blockContactSchema } from '../../schemas/contacts.schema.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface ContactParams extends SessionParams {
  contactId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

/**
 * @route GET /api/sessions/:sessionId/contacts/all
 * @desc Get all contacts
 * @scope contacts:read
 */
router.get(
  '/all',
  requireScope('contacts:read'),
  async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      const contacts = await whatsappService.contacts.getContacts(session);
      res.json({
        success: true,
        data: contacts,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/contacts/check-exists
 * @desc Check if phone number exists
 * @scope contacts:read
 */
router.get(
  '/check-exists',
  requireScope('contacts:read'),
  async (req: Request<SessionParams, any, any, { number: string }>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      const number = req.query.number;
      if (!number) {
        throw new Error('Number is required');
      }
      const result = await whatsappService.contacts.checkNumberStatus(session, number);
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
 * @route GET /api/sessions/:sessionId/contacts
 * @desc Get contact basic info (for specific contact via query or list)
 * @scope contacts:read
 */
router.get(
  '/',
  requireScope('contacts:read'),
  async (req: Request<SessionParams, any, any, { contactId?: string }>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      
      if (req.query.contactId) {
         const contact = await whatsappService.contacts.getContact(session, req.query.contactId);
         res.json({
            success: true,
            data: contact
         });
      } else {
         // Default to all if no ID? Or just empty? WAHA docs say "Get contact basic info". 
         // Usually implies a list or a specific one. For compatibility, let's map to getAll if no ID, 
         // or handle specific logic. WAHA separates /all and / (basic info).
         // Let's assume list for now.
         const contacts = await whatsappService.contacts.getContacts(session);
         res.json({
            success: true,
            data: contacts,
         });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/contacts/:contactId/block
 * @desc Block/Unblock a contact
 * @scope contacts:write
 */
router.post(
  '/:contactId/block',
  requireScope('contacts:write'),
  validateBody(blockContactSchema),
  async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);

      if (req.body.block) {
        await whatsappService.contacts.blockContact(session, req.params.contactId);
      } else {
        await whatsappService.contacts.unblockContact(session, req.params.contactId);
      }

      res.json({
        success: true,
        message: req.body.block ? 'Contact blocked' : 'Contact unblocked',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/contacts/block
 * @desc Block contact (Generic endpoint)
 * @scope contacts:write
 */
router.post(
  '/block',
  requireScope('contacts:write'),
  async (req: Request<SessionParams, any, { contactId: string }>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      await whatsappService.contacts.blockContact(session, req.body.contactId);
      res.json({ success: true, message: 'Contact blocked' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sessions/:sessionId/contacts/unblock
 * @desc Unblock contact (Generic endpoint)
 * @scope contacts:write
 */
router.post(
  '/unblock',
  requireScope('contacts:write'),
  async (req: Request<SessionParams, any, { contactId: string }>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      await whatsappService.contacts.unblockContact(session, req.body.contactId);
      res.json({ success: true, message: 'Contact unblocked' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/contacts/:contactId/about
 * @desc Get contact about info
 * @scope contacts:read
 */
router.get(
  '/:contactId/about',
  requireScope('contacts:read'),
  async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);

      const about = await whatsappService.contacts.getContactAbout(
        session,
        req.params.contactId
      );

      res.json({
        success: true,
        data: { about },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/contacts/about
 * @desc Get contact about info (Query param)
 * @scope contacts:read
 */
router.get(
  '/about',
  requireScope('contacts:read'),
  async (req: Request<SessionParams, any, any, { contactId: string }>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      const about = await whatsappService.contacts.getContactAbout(
        session,
        req.query.contactId
      );
      res.json({ success: true, data: { about } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/contacts/:contactId/profile-picture
 * @desc Get contact profile picture
 * @scope contacts:read
 */
router.get(
  '/:contactId/profile-picture',
  requireScope('contacts:read'),
  async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);

      const profilePicUrl = await whatsappService.contacts.getProfilePicture(
        session,
        req.params.contactId
      );

      res.json({
        success: true,
        data: { profilePicUrl },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sessions/:sessionId/contacts/profile-picture
 * @desc Get contact profile picture (Query param)
 * @scope contacts:read
 */
router.get(
  '/profile-picture',
  requireScope('contacts:read'),
  async (req: Request<SessionParams, any, any, { contactId: string }>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      const profilePicUrl = await whatsappService.contacts.getProfilePicture(
        session,
        req.query.contactId
      );
      res.json({ success: true, data: { profilePicUrl } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/sessions/:sessionId/contacts/:contactId
 * @desc Create or update contact
 * @scope contacts:write
 */
router.put(
  '/:contactId',
  requireScope('contacts:write'),
  async (req: Request<ContactParams>, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId);
      const session = whatsappService.store.getSafe(req.params.sessionId);
      // In WWebJS, we generally just check if it exists or trigger a sync/get
      // effectively "updating" our knowledge of it.
      // There isn't a "create contact" method that pushes to phone address book easily.
      // We will just return the contact info to confirm existence/sync.
      const contact = await whatsappService.contacts.getContact(session, req.params.contactId);
      res.json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
