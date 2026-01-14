/**
 * QR Code Utilities
 * Converts raw QR strings to scannable images
 * 
 * IMPORTANT: whatsapp-web.js sends QR as raw string (not base64 image)
 * Format: ref,staticKeyB64,identityKeyB64,advSecretKey,platform
 * We use 'qrcode' library to convert this to a scannable QR image
 */

import QRCode from 'qrcode';

/**
 * Cache for converted QR images to avoid re-generating same QR
 * Key: raw QR string, Value: base64 data URL
 */
const qrImageCache = new Map<string, string>();

/**
 * Per-session QR cache to clear when session restarts
 * Key: sessionId, Value: Set of raw QR strings cached for that session
 */
const sessionQRCache = new Map<string, Set<string>>();

/**
 * Convert raw QR string to base64 data URL image
 * 
 * @param rawQR - Raw QR string from whatsapp-web.js
 * @param sessionId - Optional session ID for cache tracking
 * @returns Base64 data URL of the QR image
 */
export async function convertQRToImage(rawQR: string, sessionId?: string): Promise<string> {
  // If already a data URL, return as-is
  if (rawQR.startsWith('data:')) {
    return rawQR;
  }

  // Check cache first
  if (qrImageCache.has(rawQR)) {
    return qrImageCache.get(rawQR)!;
  }

  // Generate QR code image as data URL
  const dataUrl = await QRCode.toDataURL(rawQR, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });

  // Cache it (limit cache size to prevent memory bloat)
  if (qrImageCache.size > 10) {
    const firstKey = qrImageCache.keys().next().value;
    if (firstKey) {
      qrImageCache.delete(firstKey);
      // Also clean session tracking
      for (const [, sessionQRs] of sessionQRCache) {
        sessionQRs.delete(firstKey);
      }
    }
  }
  qrImageCache.set(rawQR, dataUrl);

  // Track which QRs belong to which session
  if (sessionId) {
    if (!sessionQRCache.has(sessionId)) {
      sessionQRCache.set(sessionId, new Set());
    }
    sessionQRCache.get(sessionId)!.add(rawQR);
  }

  return dataUrl;
}

/**
 * Clear all QR image cache
 */
export function clearQRCache(): void {
  qrImageCache.clear();
  sessionQRCache.clear();
}

/**
 * Clear QR cache for specific session (called on session restart/destroy)
 * This prevents stale QR images from being served
 * 
 * @param sessionId - Session ID to clear cache for
 */
export function clearSessionQRCache(sessionId: string): void {
  const sessionQRs = sessionQRCache.get(sessionId);
  if (sessionQRs) {
    for (const rawQR of sessionQRs) {
      qrImageCache.delete(rawQR);
    }
    sessionQRCache.delete(sessionId);
  }
}
