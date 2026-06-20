/**
 * Global middleware for /api/*.
 *
 * - Verifies X-SP-Secret against env.API_SECRET. Returns 401 if missing
 *   or wrong (constant-time compare via crypto.subtle).
 * - Catches uncaught errors and returns JSON instead of HTML.
 *
 * Designed so a real authenticator can drop in later: when JWT / session
 * cookies arrive, this is the only place that needs to change to pull a
 * userId out and attach it to context.data for downstream handlers.
 */

import { err } from './types';
import type { Env } from './types';

const enc = new TextEncoder();

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.byteLength !== bb.byteLength) {
    // still hash both to make response time roughly constant
    await crypto.subtle.digest('SHA-256', ab);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return next();

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': new URL(request.url).origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-SP-Secret',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (!env.API_SECRET) {
    return err(500, 'API_SECRET not configured on the server.');
  }
  const provided = request.headers.get('X-SP-Secret') ?? '';
  const ok = await timingSafeEqual(provided, env.API_SECRET);
  if (!ok) return err(401, 'Unauthorized.');

  try {
    return await next();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error.';
    return err(500, message);
  }
};
