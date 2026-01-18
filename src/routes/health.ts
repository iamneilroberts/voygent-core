/**
 * Health check route
 */

import type { RouteHandler } from '../types';

export const handleHealth: RouteHandler = async (request, env, ctx, url, corsHeaders) => {
  if (url.pathname !== "/health" || request.method !== "GET") return null;

  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
};
