/**
 * Sync engine — drains the outbox to the Cloudflare backend.
 *
 * - Runs only when cloudEnabled (VITE_APP_API_SECRET is set).
 * - On boot: starts a loop that pulls due ops one at a time and executes
 *   them.
 * - On 'online' / 'visibilitychange' / outbox enqueue: wakes the loop.
 * - Each op is idempotent on the server side (upserts / 404-tolerant
 *   deletes), so retries are safe.
 */

import { ENV } from '@/lib/env';
import { apiPost, apiDelete, apiPutBlob, ApiError } from '@/lib/api';
import { complete, nextDue, recordFailure, subscribe as subscribeOutbox } from './outbox';
import { getDB } from '@/storage/idb';
import type { OutboxOp, PhotoRecord } from '@/storage/idb';
import type { State } from '@/state/schema';

let started = false;
let wakeFn: (() => void) | null = null;

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'disabled';

const statusListeners = new Set<(s: SyncStatus) => void>();
let currentStatus: SyncStatus = 'disabled';
function setStatus(s: SyncStatus) {
  if (s === currentStatus) return;
  currentStatus = s;
  for (const fn of statusListeners) fn(s);
}
export function getStatus(): SyncStatus {
  return currentStatus;
}
export function onStatus(fn: (s: SyncStatus) => void): () => void {
  statusListeners.add(fn);
  fn(currentStatus);
  return () => statusListeners.delete(fn);
}

/** External nudge — e.g. when the user enqueues an op. */
export function wake(): void {
  if (wakeFn) wakeFn();
}

async function executeOp(op: OutboxOp): Promise<void> {
  switch (op.type) {
    case 'saveReport': {
      const db = await getDB();
      const state = (await db.get('reports', op.reportId)) as State | undefined;
      if (!state) {
        // The report no longer exists locally; nothing to upload.
        return;
      }
      await apiPost(`/reports`, state);
      return;
    }
    case 'deleteReport': {
      try {
        await apiDelete(`/reports/${encodeURIComponent(op.reportId)}`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return;
        throw e;
      }
      return;
    }
    case 'uploadPhoto': {
      const db = await getDB();
      const rec = (await db.get('photos', op.photoId)) as PhotoRecord | undefined;
      if (!rec) return;
      await apiPutBlob(`/photos/${encodeURIComponent(op.photoId)}`, rec.blob, {
        'X-Job-Ref': op.jobRef,
        'X-Kind': op.kind,
      });
      // Mark as synced locally so future delta sync knows it's clean.
      await db.put('photos', { ...rec, syncedAt: Date.now() });
      return;
    }
    case 'deletePhoto': {
      try {
        await apiDelete(`/photos/${encodeURIComponent(op.photoId)}`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return;
        throw e;
      }
      return;
    }
  }
}

async function loop(): Promise<void> {
  while (started) {
    if (!navigator.onLine) {
      setStatus('offline');
      await waitForWake(30_000);
      continue;
    }

    const entry = await nextDue();
    if (!entry) {
      setStatus('idle');
      await waitForWake(30_000);
      continue;
    }

    setStatus('syncing');
    try {
      await executeOp(entry.op);
      await complete(entry.id);
    } catch (err) {
      await recordFailure(entry.id, err);
      if (err instanceof ApiError && err.status === 401) {
        setStatus('error'); // bad secret — manual intervention needed
        await waitForWake(60_000);
      } else {
        setStatus('error');
        await waitForWake(1_000);
      }
    }
  }
}

function waitForWake(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      wakeFn = null;
      resolve();
    };
    wakeFn = finish;
    setTimeout(finish, timeoutMs);
  });
}

export function startSyncEngine(): void {
  if (started || !ENV.cloudEnabled) {
    setStatus(ENV.cloudEnabled ? currentStatus : 'disabled');
    return;
  }
  started = true;
  setStatus('idle');

  window.addEventListener('online', () => wake());
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') wake();
  });
  subscribeOutbox(() => wake());

  void loop();
}
