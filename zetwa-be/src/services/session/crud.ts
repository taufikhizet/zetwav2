/**
 * Session CRUD - Backward Compatibility Export
 * Re-exports all operations for existing code that imports from crud.js
 */

export {
  create,
  createWebhooksFromConfig,
  list,
  getById,
  getStatus,
  getMeInfo,
  update,
  remove,
  logout,
  getQRCode,
  getQRCodeWithFormat,
  requestPairingCode,
  restart,
} from './operations/index.js';
