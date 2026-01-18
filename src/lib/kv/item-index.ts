/**
 * Item index helpers for O(1) item list lookups per user
 */

import type { Env } from '../../types';
import { listAllKeys } from './keys';

export async function rebuildItemIndex(env: Env, keyPrefix: string): Promise<string[]> {
  const keys = await listAllKeys(env, { prefix: keyPrefix });
  const items = keys
    .map(k => k.name.replace(keyPrefix, ''))
    .filter(k => !k.startsWith("_") && !k.includes("/_"));

  await env.TRIPS.put(`${keyPrefix}_item-index`, JSON.stringify(items));
  return items;
}

export async function getItemIndex(env: Env, keyPrefix: string): Promise<string[]> {
  const indexKey = `${keyPrefix}_item-index`;
  const existing = await env.TRIPS.get(indexKey, "json") as string[] | null;
  if (existing) return existing;
  return rebuildItemIndex(env, keyPrefix);
}

export async function addToItemIndex(env: Env, keyPrefix: string, itemId: string): Promise<void> {
  if (itemId.startsWith("_") || itemId.includes("/_")) return;
  const indexKey = `${keyPrefix}_item-index`;
  const existing = await env.TRIPS.get(indexKey, "json") as string[] | null;
  const baseline = existing || await rebuildItemIndex(env, keyPrefix);
  if (baseline.includes(itemId)) return;
  await env.TRIPS.put(indexKey, JSON.stringify([...baseline, itemId]));
}

export async function removeFromItemIndex(env: Env, keyPrefix: string, itemId: string): Promise<void> {
  const indexKey = `${keyPrefix}_item-index`;
  const existing = await env.TRIPS.get(indexKey, "json") as string[] | null;
  if (!existing) return;
  await env.TRIPS.put(indexKey, JSON.stringify(existing.filter(id => id !== itemId)));
}
