import { Client } from 'whatsapp-web.js';
import type { WASession } from './types.js';
import type { SessionConfig } from '../../types/session-config.js';
import { SessionNotFoundError, SessionNotConnectedError } from '../../utils/errors.js';

/**
 * Extended session with config
 */
export interface ExtendedWASession extends WASession {
  config?: SessionConfig;
  presenceStore?: Map<string, any>;
}

/**
 * Session Store
 * Manages in-memory WhatsApp sessions
 */
export class SessionStore {
  private sessions: Map<string, ExtendedWASession> = new Map();
  /** Lock to prevent race conditions during session creation */
  public readonly sessionCreationLocks: Set<string> = new Set();

  /**
   * Get session by ID
   */
  get(sessionId: string): ExtendedWASession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session safely (throws if not found)
   */
  getSafe(sessionId: string): ExtendedWASession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  /**
   * Set session
   */
  set(sessionId: string, session: ExtendedWASession): void {
    this.sessions.set(sessionId, session);
  }

  /**
   * Delete session
   */
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Check if session exists
   */
  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get all sessions
   */
  getAll(): ExtendedWASession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): ExtendedWASession[] {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
  }

  /**
   * Get WhatsApp client by session ID
   */
  getClient(sessionId: string): Client {
    return this.getSafe(sessionId).client;
  }

  /**
   * Check if session is connected
   */
  isConnected(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.status === 'CONNECTED';
  }

  /**
   * Get map size
   */
  get size(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * Get entries iterator
   */
  entries(): IterableIterator<[string, ExtendedWASession]> {
    return this.sessions.entries();
  }

  /**
   * Get raw map (use with caution)
   */
  get rawMap(): Map<string, ExtendedWASession> {
    return this.sessions;
  }
}
