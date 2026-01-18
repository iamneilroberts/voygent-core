/**
 * Auth key index operations for O(1) lookups
 */

import type { Env } from '../../types';

export async function setAuthKeyIndex(env: Env, authKey: string, userId: string): Promise<void> {
  await env.TRIPS.put(`_auth-index/${authKey}`, userId);
}

export async function getAuthKeyIndex(env: Env, authKey: string): Promise<string | null> {
  return await env.TRIPS.get(`_auth-index/${authKey}`, "text");
}
