import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from './logger.js';

const logger = createLogger('cleanup');

/**
 * Clean up old .wwebjs_cache files, keeping only the latest version
 * This can save significant disk space as each cache file is ~50-100KB
 */
export async function cleanupWwebjsCache(cacheDir: string = '.wwebjs_cache'): Promise<{ deleted: number; kept: string | null }> {
  const result = { deleted: 0, kept: null as string | null };
  
  try {
    if (!fs.existsSync(cacheDir)) {
      return result;
    }

    const files = fs.readdirSync(cacheDir)
      .filter(f => f.endsWith('.html'))
      .map(f => ({
        name: f,
        path: path.join(cacheDir, f),
        // Extract version from filename like "2.3000.1031858503.html"
        version: parseInt(f.split('.')[2] || '0', 10),
        mtime: fs.statSync(path.join(cacheDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.version - a.version); // Sort by version descending

    if (files.length <= 1) {
      result.kept = files[0]?.name || null;
      return result;
    }

    // Keep the latest version, delete older ones
    const [latest, ...older] = files;
    
    // TypeScript guard - should never happen due to length check above
    if (!latest) {
      return result;
    }
    
    result.kept = latest.name;

    for (const file of older) {
      try {
        fs.unlinkSync(file.path);
        result.deleted++;
        logger.debug({ file: file.name }, 'Deleted old wwebjs cache file');
      } catch (err) {
        logger.warn({ file: file.name, error: err }, 'Failed to delete old cache file');
      }
    }

    if (result.deleted > 0) {
      logger.info({ deleted: result.deleted, kept: result.kept }, 'Cleaned up wwebjs cache');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup wwebjs cache');
  }

  return result;
}

/**
 * Clean up orphaned session folders that are not in the database
 */
export async function cleanupOrphanedSessions(
  sessionPath: string,
  activeSessionIds: string[]
): Promise<{ deleted: number }> {
  const result = { deleted: 0 };

  try {
    if (!fs.existsSync(sessionPath)) {
      return result;
    }

    const sessionDirs = fs.readdirSync(sessionPath)
      .filter(f => f.startsWith('session-'))
      .map(f => f.replace('session-', ''));

    const activeSet = new Set(activeSessionIds);

    for (const sessionId of sessionDirs) {
      if (!activeSet.has(sessionId)) {
        const dirPath = path.join(sessionPath, `session-${sessionId}`);
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
          result.deleted++;
          logger.info({ sessionId }, 'Deleted orphaned session folder');
        } catch (err) {
          logger.warn({ sessionId, error: err }, 'Failed to delete orphaned session');
        }
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup orphaned sessions');
  }

  return result;
}

/**
 * Get disk usage of session folders
 */
export function getSessionDiskUsage(sessionPath: string): { totalBytes: number; sessions: Record<string, number> } {
  const result = { totalBytes: 0, sessions: {} as Record<string, number> };

  try {
    if (!fs.existsSync(sessionPath)) {
      return result;
    }

    const sessionDirs = fs.readdirSync(sessionPath)
      .filter(f => f.startsWith('session-'));

    for (const dir of sessionDirs) {
      const dirPath = path.join(sessionPath, dir);
      const size = getDirSize(dirPath);
      const sessionId = dir.replace('session-', '');
      result.sessions[sessionId] = size;
      result.totalBytes += size;
    }
  } catch (error) {
    logger.error({ error }, 'Failed to calculate session disk usage');
  }

  return result;
}

function getDirSize(dirPath: string): number {
  let size = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stat.size;
      }
    }
  } catch {
    // Ignore errors
  }

  return size;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
