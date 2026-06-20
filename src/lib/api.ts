/**
 * Thin fetch wrapper for SnaggingPro's Cloudflare Pages Functions backend.
 *
 * - Adds the X-SP-Secret header on every call.
 * - Treats non-2xx as ApiError so callers can branch on status.
 * - Same-origin only (the API lives on the Pages domain), so no CORS
 *   plumbing is needed.
 */

import { ENV } from './env';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function headers(extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  if (ENV.apiSecret) h.set('X-SP-Secret', ENV.apiSecret);
  return h;
}

async function parse(res: Response): Promise<unknown> {
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return await res.text();
}

async function throwIfBad(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await parse(res);
  const message =
    body && typeof body === 'object' && 'error' in body
      ? String((body as { error: unknown }).error)
      : `HTTP ${res.status}`;
  throw new ApiError(res.status, message, body);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: headers() });
  await throwIfBad(res);
  return (await parse(res)) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  await throwIfBad(res);
  return (await parse(res)) as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'DELETE',
    headers: headers(),
  });
  await throwIfBad(res);
  return (await parse(res)) as T;
}

export async function apiPutBlob<T>(
  path: string,
  blob: Blob,
  meta: Record<string, string>,
): Promise<T> {
  const h = headers({ 'Content-Type': blob.type || 'application/octet-stream' });
  for (const [k, v] of Object.entries(meta)) h.set(k, v);
  const res = await fetch(`/api${path}`, { method: 'PUT', headers: h, body: blob });
  await throwIfBad(res);
  return (await parse(res)) as T;
}

export async function apiGetBlob(path: string): Promise<Blob> {
  const res = await fetch(`/api${path}`, { headers: headers() });
  await throwIfBad(res);
  return await res.blob();
}

/** Network-availability probe — does NOT prove auth, just connectivity. */
export async function pingApi(): Promise<boolean> {
  try {
    const res = await fetch('/api/reports', { method: 'GET', headers: headers() });
    return res.status !== 0;
  } catch {
    return false;
  }
}
