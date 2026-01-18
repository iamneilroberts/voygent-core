/**
 * MCP Tool Handlers: Item CRUD
 */

import type { McpToolHandler } from '../../types';
import {
  getItemIndex,
  addToItemIndex,
  removeFromItemIndex,
  addPendingDeletion,
  removePendingDeletion,
  filterPendingDeletions
} from '../../lib/kv';
import { stripEmpty } from '../../lib/utils';
import { validateItemId } from '../../lib/validation';

export const handleListItems: McpToolHandler = async (args, env, keyPrefix, userProfile, authKey, ctx) => {
  const items = await getItemIndex(env, keyPrefix);
  const visibleItems = await filterPendingDeletions(env, keyPrefix, items, ctx);
  return {
    content: [{ type: "text", text: JSON.stringify(stripEmpty(visibleItems), null, 2) }]
  };
};

export const handleReadItem: McpToolHandler = async (args, env, keyPrefix) => {
  const itemId = args.key;
  const idToValidate = itemId.startsWith("_") ? itemId.substring(1) : itemId;
  if (idToValidate) validateItemId(idToValidate);

  const fullKey = keyPrefix + itemId;
  const data = await env.TRIPS.get(fullKey, "json");
  if (!data) throw new Error(`Item '${itemId}' not found.`);

  return {
    content: [{ type: "text", text: JSON.stringify(stripEmpty(data), null, 2) }]
  };
};

export const handleSaveItem: McpToolHandler = async (args, env, keyPrefix, userProfile, authKey, ctx) => {
  validateItemId(args.key);

  const fullKey = keyPrefix + args.key;
  await env.TRIPS.put(fullKey, JSON.stringify(args.data));
  await addToItemIndex(env, keyPrefix, args.key);
  await removePendingDeletion(env, keyPrefix, args.key, ctx);

  return { content: [{ type: "text", text: `Saved ${args.key}` }] };
};

export const handlePatchItem: McpToolHandler = async (args, env, keyPrefix, userProfile, authKey, ctx) => {
  validateItemId(args.key);

  const fullKey = keyPrefix + args.key;
  const existingData = await env.TRIPS.get(fullKey, "json") as any;
  if (!existingData) throw new Error(`Item '${args.key}' not found.`);

  const updates = args.updates as Record<string, any>;
  for (const [path, value] of Object.entries(updates)) {
    const parts = path.split('.');
    let current = existingData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }

  await env.TRIPS.put(fullKey, JSON.stringify(existingData));
  await addToItemIndex(env, keyPrefix, args.key);

  return { content: [{ type: "text", text: `Patched ${args.key}` }] };
};

export const handleDeleteItem: McpToolHandler = async (args, env, keyPrefix, userProfile, authKey, ctx) => {
  validateItemId(args.key);

  const fullKey = keyPrefix + args.key;
  await env.TRIPS.delete(fullKey);
  await removeFromItemIndex(env, keyPrefix, args.key);
  await addPendingDeletion(env, keyPrefix, args.key, ctx);

  return { content: [{ type: "text", text: `Deleted ${args.key}` }] };
};
