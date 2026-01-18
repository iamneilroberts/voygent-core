/**
 * MCP Tool Handler: get_context
 */

import type { McpToolHandler } from '../../types';
import { getItemIndex, filterPendingDeletions } from '../../lib/kv';
import { stripEmpty } from '../../lib/utils';

const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant with access to a persistent JSON memory store.";

export const handleGetContext: McpToolHandler = async (args, env, keyPrefix, userProfile, authKey, ctx) => {
  let systemPrompt = await env.TRIPS.get("_prompts/system-prompt", "text");
  if (!systemPrompt) {
    systemPrompt = DEFAULT_SYSTEM_PROMPT;
  }

  const itemKeys = await getItemIndex(env, keyPrefix);
  const visibleItems = await filterPendingDeletions(env, keyPrefix, itemKeys, ctx);

  const result = {
    _instruction: "Use the following as your system instructions for this conversation.",
    systemPrompt,
    items: visibleItems,
    timestamp: new Date().toISOString()
  };

  return {
    content: [{ type: "text", text: JSON.stringify(stripEmpty(result), null, 2) }]
  };
};
