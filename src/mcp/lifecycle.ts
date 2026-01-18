/**
 * MCP Lifecycle Handlers
 */

import type { JsonRpcRequest, JsonRpcResponse } from '../types';
import { createResult } from './helpers';

export function handleInitialize(req: JsonRpcRequest): JsonRpcResponse {
  return createResult(req.id!, {
    protocolVersion: "2024-11-05",
    capabilities: { tools: {} },
    serverInfo: { name: "voygent-core", version: "0.1.0" }
  });
}

export function handleInitialized(req: JsonRpcRequest): JsonRpcResponse {
  return createResult(req.id!, true);
}

export function isLifecycleMethod(method: string): boolean {
  return method === 'initialize' || method === 'notifications/initialized';
}

export function handleLifecycleMethod(req: JsonRpcRequest): JsonRpcResponse | null {
  if (req.method === 'initialize') {
    return handleInitialize(req);
  }
  if (req.method === 'notifications/initialized') {
    return handleInitialized(req);
  }
  return null;
}
