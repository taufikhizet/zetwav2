/**
 * Session QR Code Operations
 * Handles QR code generation and retrieval
 * 
 * Best Practices (based on WAHA, wwebjs-api, open-wa, Baileys):
 * 
 * 1. QR endpoint should be SIMPLE - return QR if ready, status if not
 * 2. Use WebSocket/Webhook for realtime QR updates (primary method)
 * 3. REST API is fallback/polling mechanism
 * 4. Separate restart from QR retrieval (different concerns)
 * 5. Short timeout for "wait" operations to prevent HTTP timeout
 */

import { whatsappService } from '../../whatsapp/index.js';
import { BadRequestError } from '../../../utils/errors.js';
import { logger } from '../../../utils/logger.js';
import { getById } from './read.js';
import { FAILED_STATUSES } from '../constants.js';
import { convertQRToImage } from '../../../utils/qrcode.js';

// ============================================
// Constants
// ============================================

/** Status yang memerlukan restart untuk mendapatkan QR baru */
const NEEDS_RESTART_STATUSES = ['FAILED', 'DISCONNECTED', 'LOGGED_OUT'];

/** Status yang menunjukkan sedang dalam proses (bisa wait) */
const IN_PROGRESS_STATUSES = ['INITIALIZING', 'STARTING'];

/** Status yang menunjukkan auth sedang berlangsung (QR sudah di-scan) */
const AUTH_IN_PROGRESS_STATUSES = ['AUTHENTICATING', 'AUTHENTICATED'];

/** 
 * Default timeout untuk "wait" operations (5 detik)
 * Lebih pendek dari WAHA (10s) untuk safety margin browser timeout
 */
const DEFAULT_WAIT_TIMEOUT = 5000;

/** Interval polling saat waiting (500ms - sama seperti WAHA) */
const POLL_INTERVAL = 500;

/**
 * Wait for QR code to be available with timeout
 */
// ============================================
// Helper Functions  
// ============================================

/**
 * Wait for session to reach a specific status (inspired by WAHA's waitUntilStatus)
 * 
 * @param sessionId - Session ID
 * @param expectedStatuses - Array of statuses to wait for
 * @param timeoutMs - Max wait time (default 5s)
 * @returns Current status if reached, null if timeout
 */
async function waitForStatus(
  sessionId: string,
  expectedStatuses: string[],
  timeoutMs: number = DEFAULT_WAIT_TIMEOUT
): Promise<string | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const status = whatsappService.getStatus(sessionId);
    if (status && expectedStatuses.includes(status)) {
      return status;
    }
    
    // Early exit if session failed
    if (status && (FAILED_STATUSES.includes(status) || NEEDS_RESTART_STATUSES.includes(status))) {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
  
  return null;
}

/**
 * Wait for QR code to be available (with smart early exit)
 * 
 * Early exit conditions:
 * - QR available → return QR
 * - CONNECTED → return null (no QR needed)
 * - AUTHENTICATING → return null (QR already scanned)
 * - FAILED → return null (session failed)
 * 
 * @param sessionId - Session ID
 * @param timeoutMs - Max wait time (default 5s)
 */
async function waitForQRCode(
  sessionId: string, 
  timeoutMs: number = DEFAULT_WAIT_TIMEOUT
): Promise<string | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    // Check for QR first
    const qrCode = whatsappService.getQRCode(sessionId);
    if (qrCode) {
      logger.debug({ sessionId, elapsed: Date.now() - startTime }, 'QR code available');
      return qrCode;
    }
    
    // Check status for early exit conditions
    const status = whatsappService.getStatus(sessionId);
    
    // Already connected - no need for QR
    if (status === 'CONNECTED') {
      logger.debug({ sessionId }, 'Session connected, no QR needed');
      return null;
    }
    
    // Auth in progress - QR already scanned
    if (AUTH_IN_PROGRESS_STATUSES.includes(status || '')) {
      logger.debug({ sessionId, status }, 'Auth in progress, no QR needed');
      return null;
    }
    
    // Session failed
    if (FAILED_STATUSES.includes(status || '') || NEEDS_RESTART_STATUSES.includes(status || '')) {
      logger.debug({ sessionId, status }, 'Session failed');
      return null;
    }
    
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
  
  logger.debug({ sessionId, timeoutMs }, 'Timeout waiting for QR');
  return null;
}

/**
 * Get QR code for session (returns as base64 image)
 */
export async function getQRCode(userId: string, sessionId: string) {
  const session = await getById(userId, sessionId);

  const qrCode = whatsappService.getQRCode(sessionId);
  const liveStatus = whatsappService.getStatus(sessionId);
  const currentStatus = liveStatus || session.status;

  if (currentStatus === 'FAILED') {
    return {
      status: 'FAILED',
      qrCode: null,
      message: 'Session expired. QR code was not scanned in time. Please restart the session to get a new QR code.',
      canRetry: true,
      action: 'restart', // Tells API users what to do
      endpoint: `/sessions/${sessionId}/restart`,
    };
  }

  if (currentStatus === 'LOGGED_OUT') {
    return {
      status: 'LOGGED_OUT',
      qrCode: null,
      message: 'Session has been logged out. Please restart to reconnect.',
      canRetry: true,
      action: 'restart',
      endpoint: `/sessions/${sessionId}/restart`,
    };
  }

  if (currentStatus === 'DISCONNECTED') {
    return {
      status: 'DISCONNECTED',
      qrCode: null,
      message: 'Session disconnected. Please restart the session.',
      canRetry: true,
      action: 'restart',
      endpoint: `/sessions/${sessionId}/restart`,
    };
  }

  if (!qrCode) {
    const status = whatsappService.getStatus(sessionId);

    if (status === 'CONNECTED') {
      throw new BadRequestError('Session is already connected');
    }

    return {
      status: status || session.status,
      qrCode: null,
      message: 'QR code not available. Session may be initializing.',
    };
  }

  // Convert raw QR string to base64 image
  const qrImage = await convertQRToImage(qrCode);

  return {
    status: 'QR_READY',
    qrCode: qrImage,
  };
}

/**
 * Get QR code with format option (image or raw)
 */
export async function getQRCodeWithFormat(
  userId: string, 
  sessionId: string, 
  format: 'image' | 'raw' = 'image'
) {
  const session = await getById(userId, sessionId);
  const qrCode = whatsappService.getQRCode(sessionId);
  const liveStatus = whatsappService.getStatus(sessionId);
  const currentStatus = liveStatus || session.status;

  if (currentStatus === 'FAILED') {
    return {
      status: 'FAILED',
      value: null,
      message: 'Session expired. QR code was not scanned in time. Please restart the session to get a new QR code.',
      canRetry: true,
      action: 'restart',
      endpoint: `/sessions/${sessionId}/restart`,
    };
  }

  if (currentStatus === 'LOGGED_OUT') {
    return {
      status: 'LOGGED_OUT',
      value: null,
      message: 'Session has been logged out. Please restart to reconnect.',
      canRetry: true,
      action: 'restart',
      endpoint: `/sessions/${sessionId}/restart`,
    };
  }

  if (currentStatus === 'DISCONNECTED') {
    return {
      status: 'DISCONNECTED',
      value: null,
      message: 'Session disconnected. Please restart the session.',
      canRetry: true,
      action: 'restart',
      endpoint: `/sessions/${sessionId}/restart`,
    };
  }

  if (currentStatus === 'CONNECTED') {
    return {
      status: 'WORKING',
      value: null,
      message: 'Session is already connected.',
      canRetry: false,
      action: null,
    };
  }

  if (!qrCode) {
    return {
      status: currentStatus,
      value: null,
      message: 'QR code not available. Session may be initializing.',
    };
  }

  // Return raw QR string or as base64 data URL based on format
  if (format === 'raw') {
    return {
      status: 'SCAN_QR_CODE',
      value: qrCode,
    };
  }

  // For image format, convert raw QR to base64 image
  // whatsapp-web.js sends raw string, not base64 image
  const value = await convertQRToImage(qrCode);

  return {
    status: 'SCAN_QR_CODE',
    value,
  };
}

/**
 * Options for smart QR code retrieval
 */
export interface SmartQROptions {
  /** Output format: 'image' (base64 data URL) or 'raw' (QR string) */
  format?: 'image' | 'raw';
  
  /** 
   * Wait briefly for QR if session is initializing (max 5 seconds)
   * This is a SHORT wait to give session time to initialize, NOT for long polling.
   * 
   * Best Practice: Use WebSocket/Webhook for realtime QR updates.
   * This wait is only for convenience in simple integrations.
   */
  wait?: boolean;
  
  /** 
   * Max timeout in ms for waiting (default: 5000, max: 10000)
   * Intentionally capped low to prevent HTTP timeouts.
   */
  timeout?: number;
}

/** Maximum allowed timeout to prevent HTTP connection issues */
const MAX_TIMEOUT = 10000;

/**
 * Smart QR Code retrieval - SIMPLIFIED following industry best practices
 * 
 * Inspired by:
 * - WAHA: Simple endpoint, return QR or error, use `waitUntilStatus` for brief wait
 * - wwebjs-api: Separate endpoints for QR, no auto-restart
 * - open-wa: Event-driven QR with API fallback
 * 
 * KEY DESIGN DECISIONS:
 * 
 * 1. NO AUTO-RESTART - Restart adalah operasi destructive, harus explicit dari user
 *    Gunakan POST /sessions/:id/restart untuk restart
 * 
 * 2. SHORT WAIT ONLY - Max 5-10 detik untuk beri waktu session initialize
 *    Untuk long polling, gunakan WebSocket atau poll manual dari client
 * 
 * 3. CONSISTENT RESPONSE - Selalu return format yang sama
 * 
 * 4. CLEAR STATUS - Status di response menunjukkan apa yang harus dilakukan
 * 
 * @param userId - User ID for authorization
 * @param sessionId - Session ID to get QR for
 * @param options - QR options
 * @returns QR code or status information
 * 
 * @example
 * // Basic - get current QR state
 * GET /sessions/:id/auth/qr
 * 
 * @example
 * // With brief wait (max 5s) for session to initialize
 * GET /sessions/:id/auth/qr?wait=true
 * 
 * @example
 * // Raw QR string for custom rendering
 * GET /sessions/:id/auth/qr?format=raw
 */
export async function getQRCodeSmart(
  userId: string,
  sessionId: string,
  options: SmartQROptions = {}
) {
  const {
    format = 'image',
    wait = false,
    timeout = DEFAULT_WAIT_TIMEOUT,
  } = options;

  // Cap timeout to prevent HTTP issues
  const safeTimeout = Math.min(timeout, MAX_TIMEOUT);

  // Verify session belongs to user
  const session = await getById(userId, sessionId);
  
  // Get current live status
  let liveStatus = whatsappService.getStatus(sessionId);
  let currentStatus = liveStatus || session.status;

  logger.debug({ sessionId, currentStatus, options }, 'QR request');

  // ============================================
  // CASE 1: Already Connected - No QR needed
  // ============================================
  if (currentStatus === 'CONNECTED') {
    return {
      success: true,
      status: 'WORKING',
      qr: null,
      message: 'Session is already connected.',
    };
  }

  // ============================================
  // CASE 2: Authenticating - QR already scanned
  // ============================================
  if (AUTH_IN_PROGRESS_STATUSES.includes(currentStatus)) {
    return {
      success: true,
      status: 'AUTHENTICATING',
      qr: null,
      message: 'QR code was scanned. Waiting for authentication to complete.',
    };
  }

  // ============================================
  // CASE 3: Needs Restart - Return clear instruction
  // ============================================
  if (NEEDS_RESTART_STATUSES.includes(currentStatus)) {
    return {
      success: false,
      status: currentStatus,
      qr: null,
      message: `Session is ${currentStatus.toLowerCase()}. Please restart the session.`,
      action: 'restart',
      endpoint: `POST /sessions/${sessionId}/restart`,
    };
  }

  // ============================================
  // CASE 4: Check for existing QR
  // ============================================
  let qrCode: string | null | undefined = whatsappService.getQRCode(sessionId);

  // ============================================
  // CASE 5: Initializing - optionally wait briefly
  // ============================================
  if (!qrCode && IN_PROGRESS_STATUSES.includes(currentStatus)) {
    if (wait) {
      // Brief wait for session to initialize
      logger.debug({ sessionId, safeTimeout }, 'Waiting briefly for QR...');
      qrCode = await waitForQRCode(sessionId, safeTimeout);
      
      // Refresh status after waiting
      liveStatus = whatsappService.getStatus(sessionId);
      currentStatus = liveStatus || session.status;
      
      // Check if status changed during wait
      if (currentStatus === 'CONNECTED') {
        return {
          success: true,
          status: 'WORKING',
          qr: null,
          message: 'Session connected during initialization.',
        };
      }
      
      if (AUTH_IN_PROGRESS_STATUSES.includes(currentStatus)) {
        return {
          success: true,
          status: 'AUTHENTICATING',
          qr: null,
          message: 'Authentication in progress.',
        };
      }
      
      if (NEEDS_RESTART_STATUSES.includes(currentStatus) || FAILED_STATUSES.includes(currentStatus)) {
        return {
          success: false,
          status: currentStatus,
          qr: null,
          message: 'Session failed. Please restart.',
          action: 'restart',
          endpoint: `POST /sessions/${sessionId}/restart`,
        };
      }
    }
    
    // Still initializing, no QR yet
    if (!qrCode) {
      return {
        success: true,
        status: currentStatus,
        qr: null,
        message: 'Session is initializing. QR code will be available shortly.',
        hint: 'Use wait=true parameter or poll this endpoint, or subscribe to WebSocket for realtime updates.',
      };
    }
  }

  // ============================================
  // CASE 6: QR Available - Return it
  // ============================================
  if (qrCode) {
    const qrValue = format === 'raw' ? qrCode : await convertQRToImage(qrCode);
    
    return {
      success: true,
      status: 'SCAN_QR_CODE',
      qr: qrValue,
      format: format,
      message: 'Scan this QR code with WhatsApp on your phone.',
      hint: 'QR code refreshes every ~20 seconds. Subscribe to WebSocket for realtime updates.',
    };
  }

  // ============================================
  // CASE 7: No QR available
  // ============================================
  return {
    success: false,
    status: currentStatus || 'UNKNOWN',
    qr: null,
    message: 'QR code not available.',
    hint: 'Session may still be initializing. Try again or use wait=true parameter.',
  };
}
