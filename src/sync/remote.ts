/**
 * Remote report index — what the OTHER tablets have done.
 *
 * With three tablets on one building, each device only knows its own work.
 * This pulls the server's report list (GET /reports, delta by ?since=) and
 * caches it so the level screens can show true building-wide progress and
 * warn before someone opens an area another tablet already holds.
 *
 * Deliberately summaries only — we never pull a remote report's full state
 * into the local store. Doing that would let this device save over another
 * tablet's work on its next autosave.
 */

import { ENV } from '@/lib/env';
import { apiGet } from '@/lib/api';

const CACHE_KEY = 'snaggingpro_remote_index_v1';

export interface RemoteEntry {
  jobRef: string;
  status: 'draft' | 'completed';
  totalSnags: number;
  updatedAt: number;
}

interface RemoteCache {
  since: number;
  entries: Record<string, RemoteEntry>;
}

interface SummaryDto {
  jobRef: string;
  status: 'draft' | 'completed';
  totalSnags: number;
  updatedAt: number;
}

function read(): RemoteCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RemoteCache;
      if (parsed && typeof parsed.since === 'number' && parsed.entries) return parsed;
    }
  } catch {
    /* fall through to an empty index */
  }
  return { since: 0, entries: {} };
}

function write(cache: RemoteCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('remote index write failed', err);
  }
}

/** Everything the server has told us about, keyed by jobRef. */
export function remoteIndex(): Map<string, RemoteEntry> {
  return new Map(Object.entries(read().entries));
}

const listeners = new Set<() => void>();
export function onRemoteChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let inFlight: Promise<void> | null = null;

/**
 * Fetch anything changed since the last pull and fold it into the cache.
 * Safe to call often — concurrent calls share one request, and a failure
 * leaves the existing cache untouched.
 */
export async function pullRemote(): Promise<void> {
  if (!ENV.cloudEnabled) return;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const cache = read();
    const path = cache.since > 0 ? `/reports?since=${cache.since}` : '/reports';
    const res = await apiGet<{ summaries: SummaryDto[] }>(path);
    let newest = cache.since;
    let changed = false;
    for (const s of res.summaries ?? []) {
      if (!s.jobRef) continue;
      const prev = cache.entries[s.jobRef];
      if (!prev || prev.updatedAt !== s.updatedAt || prev.status !== s.status) changed = true;
      cache.entries[s.jobRef] = {
        jobRef: s.jobRef,
        status: s.status,
        totalSnags: s.totalSnags ?? 0,
        updatedAt: s.updatedAt ?? 0,
      };
      if ((s.updatedAt ?? 0) > newest) newest = s.updatedAt ?? 0;
    }
    cache.since = newest;
    write(cache);
    if (changed) for (const fn of listeners) fn();
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Best-effort pull — never throws, so callers can fire and forget. */
export function pullRemoteQuietly(): void {
  void pullRemote().catch((err) => console.warn('remote pull failed', err));
}

/** Drop the cache — used when switching buildings or signing out. */
export function clearRemoteIndex(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* nothing to clear */
  }
}
