/**
 * Voygent Core - MCP Server (JSON-RPC 2.0 via SSE)
 */

import type { Env, UserProfile, JsonRpcRequest, JsonRpcResponse } from './types';
import { getKeyPrefix } from './lib/kv';
import { getValidAuthKeys } from './lib/auth';
import { handlePublicRoutes } from './routes';
import { TOOL_DEFINITIONS, handleLifecycleMethod, createResult, toolHandlers } from './mcp';

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const publicResponse = await handlePublicRoutes(request, env, ctx, url, corsHeaders);
    if (publicResponse) return publicResponse;

    const requestKey = url.searchParams.get("key");
    if (!requestKey) {
      return new Response("Unauthorized - key required", { status: 401 });
    }

    const validKeys = await getValidAuthKeys(env);
    let keyPrefix = '';
    let userProfile: UserProfile | null = null;

    if (validKeys.includes(requestKey)) {
      keyPrefix = getKeyPrefix(requestKey);
    } else {
      return new Response("Unauthorized - invalid key", { status: 401 });
    }

    if (request.method === "GET") {
      return new Response("MCP Server Ready (SSE endpoint)", {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }
      });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json() as JsonRpcRequest;
        const response = await handleMcpRequest(body, env, keyPrefix, userProfile, requestKey, ctx);
        return new Response(JSON.stringify(response), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (_) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error" },
          id: null
        }), { status: 400 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }
};

async function handleMcpRequest(
  req: JsonRpcRequest,
  env: Env,
  keyPrefix: string,
  userProfile: UserProfile | null,
  authKey: string,
  ctx?: ExecutionContext
): Promise<JsonRpcResponse> {
  const lifecycleResponse = handleLifecycleMethod(req);
  if (lifecycleResponse) return lifecycleResponse;

  if (req.method === "tools/list") {
    return createResult(req.id!, { tools: TOOL_DEFINITIONS });
  }

  if (req.method === "tools/call") {
    const { name, arguments: args } = req.params;
    const handler = toolHandlers[name];
    if (handler) {
      try {
        const result = await handler(args || {}, env, keyPrefix, userProfile, authKey, ctx);
        return {
          jsonrpc: "2.0",
          id: req.id!,
          result: {
            content: result.content,
            isError: false
          }
        };
      } catch (err: any) {
        return {
          jsonrpc: "2.0",
          id: req.id!,
          result: {
            content: [{ type: "text", text: `Error: ${err.message}` }],
            isError: true
          }
        };
      }
    }

    return {
      jsonrpc: "2.0",
      id: req.id!,
      result: {
        content: [{ type: "text", text: `Error: Unknown tool: ${name}` }],
        isError: true
      }
    };
  }

  return {
    jsonrpc: "2.0",
    error: { code: -32601, message: "Method not found" },
    id: req.id!
  };
}
