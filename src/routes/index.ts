/**
 * Route handlers barrel export
 */

import type { Env, RouteHandler } from '../types';
import { handleHealth } from './health';

export const publicRouteHandlers: RouteHandler[] = [
  handleHealth
];

export async function handlePublicRoutes(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  for (const handler of publicRouteHandlers) {
    const response = await handler(request, env, ctx, url, corsHeaders);
    if (response) return response;
  }
  return null;
}

export { handleHealth } from './health';
