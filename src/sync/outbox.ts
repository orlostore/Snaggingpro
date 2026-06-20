/**
 * Outbox — durable queue of pending cloud-sync operations.
 *
 * Persisted in IndexedDB so writes survive reload and offline use. Each
 * entry tracks its own attempts + next-retry timestamp so the sync engine
 * can back off failing ops without blocking healthy ones.
 *
 * Dedup: only one entry per (op type, target id). Re-enqueueing the same
 * op resets its nextAttemptAt and clears the lastError. This collapses
 * rapid edits (every keystroke causes a saveReport enqueue) into a single
 * eventual upload of the latest state.
 */

import { getDB } from '@/storage/idb';
import type { OutboxEntry, OutboxOp } from '@/storage/idb';

function opKey(op: OutboxOp): string {
  switch (op.type) {
    case 'saveReport':
    case 'deleteReport':
      return `${op.type}:${op.reportId}`;
    case 'uploadPhoto':
    case 'deletePhoto':
      return `${op.type}:${op.photoId}`;
  }
}

export async function enqueue(op: OutboxOp): Promise<void> {
  const db = await getDB();
  const id = opKey(op);
  const now = Date.now();
  const existing = await db.get('outbox', id);
  const entry: OutboxEntry = existing
    ? { ...existing, op, nextAttemptAt: now, lastError: undefined }
    : { id, op, attempts: 0, createdAt: now, nextAttemptAt: now };
  await db.put('outbox', entry);
  notifySubscribers();
}

export async function nextDue(now: number = Date.now()): Promise<OutboxEntry | null> {
  const db = await getDB();
  const idx = db.transaction('outbox').store.index('byNextAttempt');
  for await (const cursor of idx.iterate(IDBKeyRange.upperBound(now))) {
    return cursor.value;
  }
  return null;
}

export async function complete(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('outbox', id);
  notifySubscribers();
}

export async function recordFailure(id: string, error: unknown): Promise<void> {
  const db = await getDB();
  const entry = await db.get('outbox', id);
  if (!entry) return;
  const attempts = entry.attempts + 1;
  const message = error instanceof Error ? error.message : String(error);
  // Exponential backoff capped at 60s.
  const delay = Math.min(60_000, 2 ** Math.min(attempts, 6) * 500);
  await db.put('outbox', {
    ...entry,
    attempts,
    lastError: message,
    nextAttemptAt: Date.now() + delay,
  });
  notifySubscribers();
}

export async function listAll(): Promise<OutboxEntry[]> {
  const db = await getDB();
  return db.getAll('outbox');
}

export async function count(): Promise<number> {
  const db = await getDB();
  return db.count('outbox');
}

// ───── Subscribers (drive the footer status dot) ─────

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifySubscribers(): void {
  for (const fn of listeners) fn();
}
