/**
 * MCP Response Helpers
 */

import type { JsonRpcResponse } from '../types';

export function createToolResult(
  id: number | string,
  content: string | object
): JsonRpcResponse {
  const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  return {
    jsonrpc: "2.0",
    id,
    result: {
      content: [{ type: "text", text: textContent }]
    }
  };
}

export function createToolError(
  id: number | string,
  message: string
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result: {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true
    }
  };
}

export function createRpcError(
  id: number | string | null,
  code: number,
  message: string
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message }
  };
}

export function createResult(
  id: number | string,
  result: any
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result
  };
}
