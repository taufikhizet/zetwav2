import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './lib/prisma.js';
import { getRedis, closeRedis } from './lib/redis.js';
import { whatsappService } from './services/whatsapp.service.js';
import { webhookService } from './services/webhook.service.js';
import { setupSocketIO } from './socket/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/rate-limit.middleware.js';
import { logger } from './utils/logger.js';

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: config.isProduction 
    ? config.server.frontendUrl 
    : [config.server.frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
}));

// Body parsing
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.debug({
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  }, 'Incoming request');
  next();
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Setup Socket.IO
const io = setupSocketIO(server);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close Socket.IO
  io.close(() => {
    logger.info('Socket.IO closed');
  });

  // Shutdown WhatsApp sessions
  await whatsappService.shutdown();

  // Close database connection
  await disconnectDatabase();

  // Close Redis connection
  await closeRedis();

  logger.info('Graceful shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Redis
    getRedis();

    // Initialize stored WhatsApp sessions
    await whatsappService.initializeStoredSessions();

    // Initialize webhook service (sets up event listeners)
    // The webhook service auto-initializes on import

    // Start HTTP server
    server.listen(config.server.port, config.server.host, () => {
      logger.info(
        {
          host: config.server.host,
          port: config.server.port,
          env: config.env,
        },
        `🚀 Zetwa API server started on http://${config.server.host}:${config.server.port}`
      );
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

export { app, server, io };
