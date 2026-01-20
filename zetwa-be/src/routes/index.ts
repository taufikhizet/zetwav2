import { Router } from 'express';
import authRoutes from './auth.routes.js';
import sessionRoutes from './session.routes.js';
import messageRoutes from './message.routes.js';
import apiKeyRoutes from './api-key.routes.js';

// New modular routes
import groupRoutes from './groups/index.js';
import presenceRoutes from './presence/index.js';
import labelsRoutes from './labels/index.js';
import statusRoutes from './status/index.js';
import profileRoutes from './profile/index.js';
import chatsRoutes from './chats/index.js';
import contactsRoutes from './contacts/index.js';
import lidsRoutes from './lids/index.js';
import messagesExtendedRoutes from './messages/extended.routes.js';
import channelsRoutes from './channels/index.js';
import eventsRoutes from './events/index.js';
import callsRoutes from './calls/index.js';
import screenshotRoutes from './screenshot/index.js';
import mediaRoutes from './media/index.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Zetwa API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/sessions', messageRoutes); // Message routes are nested under sessions
router.use('/api-keys', apiKeyRoutes);

// New WAHA-like routes (nested under sessions/:sessionId)
router.use('/sessions/:sessionId/groups', groupRoutes);
router.use('/sessions/:sessionId/presence', presenceRoutes);
router.use('/sessions/:sessionId/labels', labelsRoutes);
router.use('/sessions/:sessionId/status', statusRoutes);
router.use('/sessions/:sessionId/profile', profileRoutes);
router.use('/sessions/:sessionId/chats', chatsRoutes);
router.use('/sessions/:sessionId/contacts', contactsRoutes);
router.use('/sessions/:sessionId/lids', lidsRoutes);
router.use('/sessions/:sessionId/channels', channelsRoutes);
router.use('/sessions/:sessionId/events', eventsRoutes);
router.use('/sessions/:sessionId/calls', callsRoutes);
router.use('/sessions/:sessionId/screenshot', screenshotRoutes);
router.use('/sessions/:sessionId/media', mediaRoutes);

// Extended messages routes (reactions, polls, locations, etc.)
router.use('/sessions/:sessionId/messages', messagesExtendedRoutes);

export default router;
