/**
 * Debug Utility Module
 * Provides conditional logging that can be stripped in production builds
 * 
 * Usage:
 * - debug.log() for general info
 * - debug.warn() for warnings
 * - debug.error() for errors
 * 
 * In production builds, these calls should be removed via build step
 */

const DEBUG = process.env.NODE_ENV !== 'production';
const PREFIX = 'FeedbackFlow:';

export const debug = {
  log(...args: unknown[]): void {
    if (DEBUG) {
      console.log(PREFIX, ...args);
    }
  },

  warn(...args: unknown[]): void {
    if (DEBUG) {
      console.warn(PREFIX, ...args);
    }
  },

  error(...args: unknown[]): void {
    if (DEBUG) {
      console.error(PREFIX, ...args);
    }
  },
};
