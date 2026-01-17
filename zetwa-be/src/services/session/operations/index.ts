/**
 * Session Operations - Barrel Export
 * Re-exports all session CRUD operations
 */

// Create operations
export { create, createWebhooksFromConfig } from './create.js';

// Read operations  
export { list, getById, getStatus, getMeInfo, getScreenshot } from './read.js';

// Update operations
export { update } from './update.js';

// Delete operations
export { remove, logout } from './delete.js';

// QR and pairing operations
export { getQRCode, getQRCodeWithFormat, requestPairingCode, restart, getQRCodeSmart } from './qr.js';
export type { SmartQROptions } from './qr.js';
