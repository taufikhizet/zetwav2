import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../../middleware/validate.middleware.js';
import { 
  createChannelSchema, 
  listChannelsQuerySchema,
  previewChannelMessagesSchema,
  channelSearchByViewSchema,
  channelSearchByTextSchema
} from '../../schemas/index.js';

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

// 1. GET /api/{session}/channels (List)
router.get(
  '/',
  requireScope('channels:read'),
  validateQuery(listChannelsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      const channels = await whatsappService.listChannels(req.params.sessionId as string);
      res.json({ success: true, data: channels });
    } catch (error) { next(error); }
  }
);

// 2. POST /api/{session}/channels (Create)
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
        name, description, picture
      );
      res.json({ success: true, message: 'Channel created', data: channel });
    } catch (error) { next(error); }
  }
);

// 10. POST /api/{session}/channels/search/by-view
router.post(
  '/search/by-view',
  requireScope('channels:read'),
  validateBody(channelSearchByViewSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      const { view, countries, categories, limit, startCursor } = req.body;
      const result = await whatsappService.searchChannelsByView(
        req.params.sessionId as string,
        view, countries, categories, limit, startCursor
      );
      res.json(result);
    } catch (error) { next(error); }
  }
);

// 11. POST /api/{session}/channels/search/by-text
router.post(
  '/search/by-text',
  requireScope('channels:read'),
  validateBody(channelSearchByTextSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      const { text, categories, limit, startCursor } = req.body;
      const result = await whatsappService.searchChannelsByText(
        req.params.sessionId as string,
        text, categories, limit, startCursor
      );
      res.json(result);
    } catch (error) { next(error); }
  }
);

// 12. GET /api/{session}/channels/search/views
router.get(
  '/search/views',
  requireScope('channels:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
       await sessionService.getById(req.userId!, req.params.sessionId as string);
       const views = whatsappService.getChannelSearchViews();
       res.json(views);
    } catch (error) { next(error); }
  }
);

// 13. GET /api/{session}/channels/search/countries
router.get(
  '/search/countries',
  requireScope('channels:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
       await sessionService.getById(req.userId!, req.params.sessionId as string);
       const countries = whatsappService.getChannelSearchCountries();
       res.json(countries);
    } catch (error) { next(error); }
  }
);

// 14. GET /api/{session}/channels/search/categories
router.get(
  '/search/categories',
  requireScope('channels:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
       await sessionService.getById(req.userId!, req.params.sessionId as string);
       const categories = whatsappService.getChannelSearchCategories();
       res.json(categories);
    } catch (error) { next(error); }
  }
);


// 3. DELETE /api/{session}/channels/{id}
router.delete(
  '/:id',
  requireScope('channels:write'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      await whatsappService.deleteChannel(req.params.sessionId as string, req.params.id as string);
      res.json({ success: true, message: 'Channel deleted' });
    } catch (error) { next(error); }
  }
);

// 4. GET /api/{session}/channels/{id}
router.get(
  '/:id',
  requireScope('channels:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      const channel = await whatsappService.getChannel(req.params.sessionId as string, req.params.id as string);
      res.json({ success: true, data: channel });
    } catch (error) { next(error); }
  }
);

// 5. GET /api/{session}/channels/{id}/messages/preview
router.get(
  '/:id/messages/preview',
  requireScope('channels:read'),
  validateQuery(previewChannelMessagesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const messages = await whatsappService.getChannelMessagesPreview(
        req.params.sessionId as string, 
        req.params.id as string,
        limit
      );
      res.json(messages);
    } catch (error) { next(error); }
  }
);

// 6. POST /api/{session}/channels/{id}/follow
router.post(
  '/:id/follow',
  requireScope('channels:write'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      await whatsappService.followChannel(req.params.sessionId as string, req.params.id as string);
      res.json({ success: true, message: 'Channel followed' });
    } catch (error) { next(error); }
  }
);

// 7. POST /api/{session}/channels/{id}/unfollow
router.post(
  '/:id/unfollow',
  requireScope('channels:write'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      await whatsappService.unfollowChannel(req.params.sessionId as string, req.params.id as string);
      res.json({ success: true, message: 'Channel unfollowed' });
    } catch (error) { next(error); }
  }
);

// 8. POST /api/{session}/channels/{id}/mute
router.post(
  '/:id/mute',
  requireScope('channels:write'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      await whatsappService.muteChannel(req.params.sessionId as string, req.params.id as string);
      res.json({ success: true, message: 'Channel muted' });
    } catch (error) { next(error); }
  }
);

// 9. POST /api/{session}/channels/{id}/unmute
router.post(
  '/:id/unmute',
  requireScope('channels:write'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionService.getById(req.userId!, req.params.sessionId as string);
      await whatsappService.unmuteChannel(req.params.sessionId as string, req.params.id as string);
      res.json({ success: true, message: 'Channel unmuted' });
    } catch (error) { next(error); }
  }
);

export default router;
