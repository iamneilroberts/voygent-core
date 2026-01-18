/**
 * KV key utilities for Voygent Core
 */

import type { Env } from '../../types';

export type KvListOptions = { prefix?: string; cursor?: string; limit?: number };
export type KvListKey = { name: string };

export async function listAllKeys(env: Env, options: KvListOptions = {}): Promise<KvListKey[]> {
  const keys: KvListKey[] = [];
  const { cursor: initialCursor, ...rest } = options;
  let cursor: string | undefined = initialCursor;

  while (true) {
    const result = await env.TRIPS.list({ ...rest, cursor });
    keys.push(...result.keys);
    if (result.list_complete || !result.cursor) break;
    cursor = result.cursor;
  }

  return keys;
}

/**
 * Collision-resistant key prefix for auth keys
 */
export function getKeyPrefix(authKey: string): string {
  const result: string[] = [];
  const lower = authKey.toLowerCase();

  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
      result.push(char);
    } else {
      const code = char.charCodeAt(0).toString(16).padStart(2, '0');
      result.push(`_${code}_`);
    }
  }

  return result.join('') + '/';
}

/**
 * Legacy prefix for migration
 */
export function getLegacyKeyPrefix(authKey: string): string {
  return authKey.toLowerCase().replace(/[^a-z0-9]/g, '_') + '/';
}
