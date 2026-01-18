/**
 * Auth key utilities for Voygent Core
 */

import type { Env } from '../../types';

/**
 * Get valid auth keys (check KV first, then fall back to env var)
 */
export async function getValidAuthKeys(env: Env): Promise<string[]> {
  const kvKeys = await env.TRIPS.get("_config/auth-keys", "json") as string[] | null;
  if (kvKeys && kvKeys.length > 0) {
    return kvKeys;
  }
  return env.AUTH_KEYS ? env.AUTH_KEYS.split(',').map(k => k.trim()) : [];
}
