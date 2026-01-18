/**
 * Shared TypeScript types for Voygent Core
 */

export interface Env {
  TRIPS: KVNamespace;
  AUTH_KEYS: string;
}

export interface UserProfile {
  userId: string;
  authKey: string;
  name?: string;
  email?: string;
  created?: string;
  lastActive?: string;
}

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id?: number | string;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: { code: number; message: string; data?: any };
  id: number | string | null;
}

/**
 * Route handler signature for HTTP endpoints
 */
export type RouteHandler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
  corsHeaders: Record<string, string>
) => Promise<Response | null>;

/**
 * MCP tool handler signature
 */
export type McpToolHandler = (
  args: Record<string, any>,
  env: Env,
  keyPrefix: string,
  userProfile: UserProfile | null,
  authKey: string,
  ctx?: ExecutionContext
) => Promise<{ content: Array<{ type: string; text: string }> }>;
