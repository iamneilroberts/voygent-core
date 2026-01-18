/**
 * Utility functions for data processing
 */

/**
 * Recursively remove null, undefined, and empty arrays from an object.
 */
export function stripEmpty(obj: any): any {
  if (obj === null || obj === undefined) return undefined;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return undefined;
    const filtered = obj.map(stripEmpty).filter(v => v !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const stripped = stripEmpty(value);
      if (stripped !== undefined) {
        result[key] = stripped;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  return obj;
}
