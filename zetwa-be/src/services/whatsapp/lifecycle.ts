import { Client, LocalAuth } from 'whatsapp-web.js';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/index.js';
import { SessionNotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { clearSessionQRCache } from '../../utils/qrcode.js';
import { setupEventHandlers } from './event-handlers.js';
import type { SessionConfig, ClientConfig } from '../../types/session-config.js';
import type { SessionStatus, TypedEventEmitter } from './types.js';
import type { SessionStore, ExtendedWASession } from './store.js';

export class SessionLifecycle {
  constructor(
    private store: SessionStore,
    private events: TypedEventEmitter
  ) {}

  /**
   * Initialize stored sessions on startup
   */
  async initializeStoredSessions(): Promise<void> {
    try {
      const storedSessions = await prisma.waSession.findMany({
        where: {
          isActive: true, // Only initialize active sessions
          status: {
            in: ['CONNECTED', 'AUTHENTICATING', 'QR_READY'],
          },
        },
      });

      logger.info({ count: storedSessions.length }, 'Found stored sessions to initialize');

      for (const session of storedSessions) {
        try {
          await this.createSession(session.id, session.userId);
        } catch (error) {
          logger.error({ sessionId: session.id, error }, 'Failed to initialize stored session');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to initialize stored sessions');
    }
  }

  /**
   * Update session status in memory and emit event
   */
  private updateSessionStatus(sessionId: string, status: SessionStatus): void {
    this.events.emit('state_change', { sessionId, state: status });
  }

  /**
   * Build puppeteer arguments based on session config
   */
  private getPuppeteerArgs(sessionConfig?: SessionConfig): string[] {
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--disable-features=TranslateUI',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--autoplay-policy=user-gesture-required',
    ];

    // Add proxy args if configured AND proxy server is provided
    if (sessionConfig?.proxy?.server && sessionConfig.proxy.server.trim()) {
      const proxyServer = sessionConfig.proxy.server.trim();
      logger.info({ proxyServer }, 'Using proxy for session');
      baseArgs.push(`--proxy-server=${proxyServer}`);
    }

    return baseArgs;
  }

  /**
   * Get browser identification from client config
   */
  private getClientInfo(clientConfig?: ClientConfig): { webVersion?: string; webVersionCache?: any } {
    // whatsapp-web.js uses different browser identification
    // This is a simplified version - can be extended based on needs
    return {};
  }

  /**
   * Create a new WhatsApp session with optional config
   * Thread-safe with lock to prevent duplicate creation
   */
  async createSession(
    sessionId: string, 
    userId: string, 
    sessionConfig?: SessionConfig
  ): Promise<ExtendedWASession> {
    // Return existing session immediately
    if (this.store.has(sessionId)) {
      return this.store.get(sessionId)!;
    }
    
    // Check if session creation is already in progress
    if (this.store.sessionCreationLocks.has(sessionId)) {
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (this.store.has(sessionId)) {
        return this.store.get(sessionId)!;
      }
      throw new Error('Session creation already in progress');
    }
    
    // Acquire lock
    this.store.sessionCreationLocks.add(sessionId);

    try {
      // Double-check after acquiring lock
      if (this.store.has(sessionId)) {
        return this.store.get(sessionId)!;
      }
      
      logger.info({ sessionId, hasConfig: !!sessionConfig, hasProxy: !!sessionConfig?.proxy?.server }, 'Creating WhatsApp session');

      // Build client options
      const puppeteerArgs = this.getPuppeteerArgs(sessionConfig);
      const clientInfo = this.getClientInfo(sessionConfig?.client);

      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: sessionId,
          dataPath: config.whatsapp.sessionPath,
        }),
        puppeteer: {
          headless: true,
          args: puppeteerArgs,
          timeout: 60000, // 60 second timeout for puppeteer operations
        },
        qrMaxRetries: 5,
        ...clientInfo,
      });

      const session: ExtendedWASession = {
        sessionId,
        userId,
        client,
        status: 'INITIALIZING',
        config: sessionConfig,
      };

      this.store.set(sessionId, session);

      // Setup event handlers
      setupEventHandlers(
        client,
        sessionId,
        this.store.rawMap,
        this.events,
        this.updateSessionStatus.bind(this)
      );

      // Initialize client with better error handling
      try {
        await client.initialize();
      } catch (error: any) {
        logger.error({ sessionId, error: error?.message || error }, 'Failed to initialize client');
        this.store.delete(sessionId);
        
        // Provide more helpful error messages
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('ERR_CONNECTION_RESET') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error(
            'Failed to connect to WhatsApp Web. This could be due to: ' +
            '(1) Network connectivity issues, ' +
            '(2) WhatsApp Web is temporarily unavailable, ' +
            '(3) Invalid proxy configuration, or ' +
            '(4) Firewall blocking the connection. ' +
            'Please check your network and try again.'
          );
        }
        if (errorMessage.includes('ERR_PROXY')) {
          throw new Error(
            'Proxy connection failed. Please verify your proxy server address and credentials are correct.'
          );
        }
        if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          throw new Error(
            'Connection timed out while connecting to WhatsApp Web. Please check your internet connection and try again.'
          );
        }
        
        throw error;
      }

      return session;
    } finally {
      // Release lock
      this.store.sessionCreationLocks.delete(sessionId);
    }
  }

  async destroySession(sessionId: string, shouldLogout: boolean = false): Promise<void> {
    const existingSession = this.store.get(sessionId);
    if (existingSession) {
      try {
        if (shouldLogout) {
          logger.info({ sessionId }, 'Initiating WhatsApp logout...');
          try {
            if (existingSession.client.pupPage && !existingSession.client.pupPage.isClosed()) {
              await existingSession.client.logout();
              // Wait for the logout to propagate and browser to close
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              logger.warn({ sessionId }, 'Puppeteer page is closed or missing, skipping logout');
            }
          } catch (err) {
            logger.warn({ sessionId, error: err instanceof Error ? err.message : err }, 'Logout failed');
          }
        }
        await existingSession.client.destroy();
      } catch (error) {
        logger.warn({ sessionId, error }, 'Error destroying session client');
      }
      this.store.delete(sessionId);
    }

    // Clean up session data directory
    try {
      const sessionDir = path.join(config.whatsapp.sessionPath, `session-${sessionId}`);
      if (fs.existsSync(sessionDir)) {
        // Wait a bit to ensure file locks are released
        await new Promise(resolve => setTimeout(resolve, 100));
        fs.rmSync(sessionDir, { recursive: true, force: true });
        logger.info({ sessionId, sessionDir }, 'Cleaned up session data directory');
      }
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to clean up session data directory');
    }

    try {
      await prisma.waSession.update({
        where: { id: sessionId },
        data: {
          status: 'LOGGED_OUT',
          disconnectedAt: new Date(),
          phoneNumber: null,
          pushName: null,
          profilePicUrl: null,
          qrCode: null,
          lastQrAt: null,
          connectedAt: null,
        },
      });
    } catch (error) {
      // Ignore update error if record missing
    }

    logger.info({ sessionId }, 'Session destroyed');
  }

  async restartSession(sessionId: string): Promise<void> {
    const dbSession = await prisma.waSession.findUnique({
      where: { id: sessionId },
    });

    if (!dbSession) {
      throw new SessionNotFoundError(sessionId);
    }

    // Clear QR cache for this session
    clearSessionQRCache(sessionId);

    const existingSession = this.store.get(sessionId);
    if (existingSession) {
      try {
        await existingSession.client.destroy();
      } catch {
        // Ignore errors
      }
      this.store.delete(sessionId);
    }

    // Force clean up session data directory
    try {
      const sessionDir = path.join(config.whatsapp.sessionPath, `session-${sessionId}`);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        logger.info({ sessionId, sessionDir }, 'Cleaned up session data directory');
      }
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to clean up session data directory');
    }

    await prisma.waSession.update({
      where: { id: sessionId },
      data: {
        status: 'INITIALIZING',
        phoneNumber: null,
        pushName: null,
        profilePicUrl: null,
        connectedAt: null,
        qrCode: null,
        lastQrAt: null,
      },
    });

    await this.createSession(sessionId, dbSession.userId);

    logger.info({ sessionId }, 'Session restarted');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down WhatsApp service...');

    const sessionCount = this.store.size;
    if (sessionCount === 0) {
      logger.info('No active sessions to close');
      return;
    }

    logger.info({ sessionCount }, 'Closing active sessions...');

    const promises = Array.from(this.store.entries()).map(async ([sessionId, session]) => {
      try {
        const destroyPromise = session.client.destroy();
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Session destroy timeout')), 5000)
        );

        await Promise.race([destroyPromise, timeoutPromise]);
        logger.debug({ sessionId }, 'Session closed');
      } catch (error) {
        logger.warn({ sessionId, error: error instanceof Error ? error.message : error }, 'Error closing session (will be force-closed)');
      }
    });

    await Promise.allSettled(promises);
    this.store.clear();

    logger.info('WhatsApp service shutdown complete');
  }
}
