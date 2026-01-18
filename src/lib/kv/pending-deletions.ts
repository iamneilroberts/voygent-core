/**
 * Pending deletion guard to handle KV eventual consistency
 */

import type { Env } from '../../types';

const PENDING_DELETE_TTL_SECONDS = 600;

export async function getPendingDeletions(env: Env, keyPrefix: string): Promise<string[]> {
  const key = `${keyPrefix}_pending-deletes`;
  return await env.TRIPS.get(key, "json") as string[] || [];
}

export async function setPendingDeletions(
  env: Env,
  keyPrefix: string,
  pending: string[],
  ctx?: ExecutionContext
): Promise<void> {
  const key = `${keyPrefix}_pending-deletes`;
  if (pending.length === 0) {
    const del = env.TRIPS.delete(key);
    if (ctx) {
      ctx.waitUntil(del);
    } else {
      await del;
    }
    return;
  }

  const write = env.TRIPS.put(key, JSON.stringify(pending), {
    expirationTtl: PENDING_DELETE_TTL_SECONDS
  });
  if (ctx) {
    ctx.waitUntil(write);
  } else {
    await write;
  }
}

export async function addPendingDeletion(
  env: Env,
  keyPrefix: string,
  itemId: string,
  ctx?: ExecutionContext
): Promise<void> {
  if (itemId.startsWith("_") || itemId.includes("/_")) return;
  const pending = await getPendingDeletions(env, keyPrefix);
  if (pending.includes(itemId)) return;
  pending.push(itemId);
  await setPendingDeletions(env, keyPrefix, pending, ctx);
}

export async function removePendingDeletion(
  env: Env,
  keyPrefix: string,
  itemId: string,
  ctx?: ExecutionContext
): Promise<void> {
  const pending = await getPendingDeletions(env, keyPrefix);
  if (!pending.includes(itemId)) return;
  await setPendingDeletions(env, keyPrefix, pending.filter(id => id !== itemId), ctx);
}

export async function filterPendingDeletions(
  env: Env,
  keyPrefix: string,
  itemIds: string[],
  ctx?: ExecutionContext
): Promise<string[]> {
  const pending = await getPendingDeletions(env, keyPrefix);
  if (pending.length === 0) return itemIds;

  const pendingSet = new Set(pending);
  const visibleItems = itemIds.filter(id => !pendingSet.has(id));
  const confirmedDeleted: string[] = [];

  for (const itemId of pending) {
    const exists = await env.TRIPS.get(`${keyPrefix}${itemId}`, "text");
    if (!exists) {
      confirmedDeleted.push(itemId);
    }
  }

  if (confirmedDeleted.length > 0) {
    const nextPending = pending.filter(id => !confirmedDeleted.includes(id));
    await setPendingDeletions(env, keyPrefix, nextPending, ctx);
  }

  return visibleItems;
}
