import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { whatsappService } from '../../services/whatsapp.service.js';
import { sessionService } from '../../services/session.service.js';
import * as messagingService from '../../services/whatsapp/messaging/index.js';
import { authenticateAny, requireScope } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  archiveChatSchema,
  pinChatSchema,
  muteChatSchema,
  markChatReadSchema,
} from '../../schemas/chats.schema.js';

interface SessionParams extends ParamsDictionary {
  sessionId: string;
}

interface ChatParams extends SessionParams {
  chatId: string;
}

interface MessageParams extends ChatParams {
  messageId: string;
}

const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(authenticateAny);

// --- Overview & List ---

/**
 * @route GET /api/sessions/:sessionId/chats
 * @desc Get chats for session
 * @scope messages:read
 */
router.get('/', requireScope('messages:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const chats = await whatsappService.history.getChats(req.params.sessionId);
    res.json({ success: true, data: chats });
  } catch (error) { next(error); }
});

/**
 * @route GET /api/sessions/:sessionId/chats/overview
 * @desc Get chats overview
 * @scope messages:read
 */
router.get('/overview', requireScope('messages:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.getSession(req.params.sessionId);
    if (!session) throw new Error('Session not found');

    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    
    const chats = await whatsappService.chats.getChatsOverview(session, limit, offset);
    res.json({ success: true, data: chats });
  } catch (error) { next(error); }
});

/**
 * @route POST /api/sessions/:sessionId/chats/overview
 * @desc Get chats overview (POST version)
 * @scope messages:read
 */
router.post('/overview', requireScope('messages:read'), async (req: Request<SessionParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.getSession(req.params.sessionId);
    if (!session) throw new Error('Session not found');

    const limit = Number(req.body.limit) || 20;
    const offset = Number(req.body.offset) || 0;
    
    const chats = await whatsappService.chats.getChatsOverview(session, limit, offset);
    res.json({ success: true, data: chats });
  } catch (error) { next(error); }
});

// --- Chat Operations ---

/**
 * @route GET /api/sessions/:sessionId/chats/:chatId/picture
 * @desc Get chat picture
 * @scope messages:read
 */
router.get('/:chatId/picture', requireScope('messages:read'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.getSession(req.params.sessionId);
    if (!session) throw new Error('Session not found');
    
    const url = await whatsappService.contacts.getProfilePicture(session, req.params.chatId);
    res.json({ success: true, data: { url } });
  } catch (error) { next(error); }
});

/**
 * @route DELETE /api/sessions/:sessionId/chats/:chatId
 * @desc Delete a chat
 * @scope messages:write
 */
router.delete('/:chatId', requireScope('messages:write'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    await whatsappService.deleteChat(req.params.sessionId, req.params.chatId);
    res.json({ success: true, message: 'Chat deleted' });
  } catch (error) { next(error); }
});

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/archive
 * @desc Archive chat
 * @scope messages:write
 */
router.post('/:chatId/archive', requireScope('messages:write'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    await whatsappService.archiveChat(req.params.sessionId, req.params.chatId);
    res.json({ success: true, message: 'Chat archived' });
  } catch (error) { next(error); }
});

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/unarchive
 * @desc Unarchive chat
 * @scope messages:write
 */
router.post('/:chatId/unarchive', requireScope('messages:write'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    await whatsappService.unarchiveChat(req.params.sessionId, req.params.chatId);
    res.json({ success: true, message: 'Chat unarchived' });
  } catch (error) { next(error); }
});

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/unread
 * @desc Mark chat unread
 * @scope messages:write
 */
router.post('/:chatId/unread', requireScope('messages:write'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    await whatsappService.markChatUnread(req.params.sessionId, req.params.chatId);
    res.json({ success: true, message: 'Chat marked as unread' });
  } catch (error) { next(error); }
});

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/pin
 * @desc Pin chat
 * @scope messages:write
 */
router.post('/:chatId/pin', requireScope('messages:write'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    await whatsappService.pinChat(req.params.sessionId, req.params.chatId);
    res.json({ success: true, message: 'Chat pinned' });
  } catch (error) { next(error); }
});

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/unpin
 * @desc Unpin chat (Custom endpoint, or handle in pin?)
 * User requested explicit endpoints.
 * @scope messages:write
 */
router.post('/:chatId/unpin', requireScope('messages:write'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    await whatsappService.unpinChat(req.params.sessionId, req.params.chatId);
    res.json({ success: true, message: 'Chat unpinned' });
  } catch (error) { next(error); }
});

// --- Messages ---

/**
 * @route GET /api/sessions/:sessionId/chats/:chatId/messages
 * @desc Get messages in chat
 * @scope messages:read
 */
router.get('/:chatId/messages', requireScope('messages:read'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    // Use history service to get messages
    const messages = await whatsappService.history.getMessages(req.params.sessionId, {
        chatId: req.params.chatId,
        limit: Number(req.query.limit) || 20,
        page: Number(req.query.page) || 1,
    });
    res.json({ success: true, data: messages.messages });
  } catch (error) { next(error); }
});

/**
 * @route DELETE /api/sessions/:sessionId/chats/:chatId/messages
 * @desc Clear messages
 * @scope messages:write
 */
router.delete('/:chatId/messages', requireScope('messages:write'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    await whatsappService.clearChat(req.params.sessionId, req.params.chatId);
    res.json({ success: true, message: 'Messages cleared' });
  } catch (error) { next(error); }
});

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/messages/read
 * @desc Mark messages as read
 * @scope messages:write
 */
router.post('/:chatId/messages/read', requireScope('messages:write'), async (req: Request<ChatParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    await whatsappService.markChatRead(req.params.sessionId, req.params.chatId);
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) { next(error); }
});

// --- Single Message ---

/**
 * @route GET /api/sessions/:sessionId/chats/:chatId/messages/:messageId
 * @desc Get message by ID
 * @scope messages:read
 */
router.get('/:chatId/messages/:messageId', requireScope('messages:read'), async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.getSession(req.params.sessionId);
    if (!session) throw new Error('Session not found');
    
    const message = await whatsappService.chats.getChatMessage(session, req.params.chatId, req.params.messageId);
    if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
    }
    
    res.json({ success: true, data: message });
  } catch (error) { next(error); }
});

/**
 * @route DELETE /api/sessions/:sessionId/chats/:chatId/messages/:messageId
 * @desc Delete message
 * @scope messages:write
 */
router.delete('/:chatId/messages/:messageId', requireScope('messages:write'), async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.getSession(req.params.sessionId);
    if (!session) throw new Error('Session not found');
    
    await messagingService.deleteMessage(session, req.params.messageId, true);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) { next(error); }
});

/**
 * @route PUT /api/sessions/:sessionId/chats/:chatId/messages/:messageId
 * @desc Edit message
 * @scope messages:write
 */
router.put('/:chatId/messages/:messageId', requireScope('messages:write'), async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.getSession(req.params.sessionId);
    if (!session) throw new Error('Session not found');
    
    if (!req.body.text) {
        res.status(400).json({ success: false, message: 'text is required' });
        return;
    }
    
    await messagingService.editMessage(session, req.params.messageId, req.body.text);
    res.json({ success: true, message: 'Message edited' });
  } catch (error) { next(error); }
});

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/messages/:messageId/pin
 * @desc Pin message
 * @scope messages:write
 */
router.post('/:chatId/messages/:messageId/pin', requireScope('messages:write'), async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.getSession(req.params.sessionId);
    if (!session) throw new Error('Session not found');
    
    const duration = Number(req.body.duration) || 0;
    await messagingService.pinMessage(session, req.params.messageId, duration);
    res.json({ success: true, message: 'Message pinned' });
  } catch (error) { next(error); }
});

/**
 * @route POST /api/sessions/:sessionId/chats/:chatId/messages/:messageId/unpin
 * @desc Unpin message
 * @scope messages:write
 */
router.post('/:chatId/messages/:messageId/unpin', requireScope('messages:write'), async (req: Request<MessageParams>, res: Response, next: NextFunction) => {
  try {
    await sessionService.getById(req.userId!, req.params.sessionId);
    const session = whatsappService.getSession(req.params.sessionId);
    if (!session) throw new Error('Session not found');
    
    await messagingService.unpinMessage(session, req.params.messageId);
    res.json({ success: true, message: 'Message unpinned' });
  } catch (error) { next(error); }
});

export default router;
