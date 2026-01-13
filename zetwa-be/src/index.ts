import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './lib/prisma.js';
import { getRedis, closeRedis, isRedisAvailable } from './lib/redis.js';
import { whatsappService } from './services/whatsapp.service.js';
import { webhookService } from './services/webhook.service.js';
import { setupSocketIO } from './socket/index.js';
import { cleanupWwebjsCache, getSessionDiskUsage, formatBytes } from './utils/cleanup.js';
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

// Track if shutdown is in progress to prevent multiple calls
let isShuttingDown = false;

// Graceful shutdown with timeout and error handling
const gracefulShutdown = async (signal: string) => {
  // Prevent multiple shutdown calls
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, please wait...');
    return;
  }
  
  isShuttingDown = true;
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Set a timeout to force exit if shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 15 seconds, forcing exit...');
    process.exit(1);
  }, 15000);

  try {
    // Close HTTP server (stop accepting new connections)
    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) {
          logger.warn({ error: err.message }, 'Error closing HTTP server');
        } else {
          logger.info('HTTP server closed');
        }
        resolve();
      });
    });

    // Close Socket.IO
    await new Promise<void>((resolve) => {
      io.close((err) => {
        if (err) {
          logger.warn({ error: err }, 'Error closing Socket.IO');
        } else {
          logger.info('Socket.IO closed');
        }
        resolve();
      });
    });

    // Shutdown WhatsApp sessions with timeout
    try {
      const shutdownPromise = whatsappService.shutdown();
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('WhatsApp shutdown timeout')), 10000)
      );
      await Promise.race([shutdownPromise, timeoutPromise]);
    } catch (error) {
      logger.warn({ error }, 'WhatsApp shutdown incomplete');
    }

    // Close database connection
    try {
      await disconnectDatabase();
    } catch (error) {
      logger.warn({ error }, 'Error closing database connection');
    }

    // Close Redis connection
    try {
      await closeRedis();
    } catch (error) {
      logger.warn({ error }, 'Error closing Redis connection');
    }

    clearTimeout(forceExitTimeout);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimeout);
    logger.error({ error }, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle Windows-specific close event
if (process.platform === 'win32') {
  // Handle Ctrl+C on Windows
  process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  // Don't exit immediately on uncaught exception during shutdown
  if (!isShuttingDown) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
  // Don't crash on unhandled rejection, just log it
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Redis (optional - app works without it)
    getRedis();
    
    // Give Redis a moment to connect, then log status
    setTimeout(() => {
      if (isRedisAvailable()) {
        logger.info('✅ Redis cache enabled');
      } else {
        logger.info('ℹ️ Running without Redis cache (optional)');
      }
    }, 2000);

    // Cleanup old wwebjs cache files to save disk space
    const cacheCleanup = await cleanupWwebjsCache('.wwebjs_cache');
    if (cacheCleanup.deleted > 0) {
      logger.info({ deleted: cacheCleanup.deleted }, '🧹 Cleaned up old WhatsApp Web cache files');
    }

    // Log session disk usage for monitoring
    const diskUsage = getSessionDiskUsage(config.whatsapp.sessionPath);
    if (diskUsage.totalBytes > 0) {
      logger.info({ 
        totalSize: formatBytes(diskUsage.totalBytes),
        sessionCount: Object.keys(diskUsage.sessions).length 
      }, '📊 Session storage usage');
    }

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
