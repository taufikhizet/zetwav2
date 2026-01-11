import { Router } from 'express';
import authRoutes from './auth.routes.js';
import sessionRoutes from './session.routes.js';
import messageRoutes from './message.routes.js';
import apiKeyRoutes from './api-key.routes.js';

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

export default router;
