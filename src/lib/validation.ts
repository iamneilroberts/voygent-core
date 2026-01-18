/**
 * Security validation utilities for Voygent Core
 */

/**
 * Validate that an item ID is safe (no path traversal)
 * Only allows alphanumeric, underscore, hyphen, and period characters
 */
export function validateItemId(itemId: string): void {
  if (!itemId || typeof itemId !== 'string') {
    throw new Error('Item ID is required');
  }

  if (itemId.length > 128) {
    throw new Error('Invalid item ID: too long');
  }

  if (itemId.includes('..') || itemId.includes('/') || itemId.includes('\\')) {
    throw new Error('Invalid item ID: path traversal not allowed');
  }

  if (itemId.includes('\0')) {
    throw new Error('Invalid item ID: null bytes not allowed');
  }

  const safePattern = /^[a-zA-Z0-9][a-zA-Z0-9_\-\.]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
  if (!safePattern.test(itemId)) {
    throw new Error('Invalid item ID: must contain only alphanumeric characters, underscores, hyphens, and periods');
  }

  if (itemId.includes('..')) {
    throw new Error('Invalid item ID: consecutive periods not allowed');
  }
}
