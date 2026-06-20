/**
 * Photo storage — blobs in IndexedDB, addressed by photoId.
 * App state holds only IDs; the actual bytes never live in localStorage.
 */

import { getDB, type PhotoRecord } from './idb';
import { newId } from '@/lib/id';
import { ENV } from '@/lib/env';
import { enqueue } from '@/sync/outbox';
import { apiGetBlob, ApiError } from '@/lib/api';

export async function storePhoto(
  blob: Blob,
  kind: PhotoRecord['kind'],
  jobRef: string,
): Promise<string> {
  const id = newId();
  const db = await getDB();
  await db.put('photos', { id, blob, kind, jobRef, createdAt: Date.now(), syncedAt: null });
  if (ENV.cloudEnabled) {
    await enqueue({ type: 'uploadPhoto', photoId: id, jobRef, kind });
  }
  return id;
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  const db = await getDB();
  const local = await db.get('photos', id);
  if (local) return local;
  // Not in cache — try to lazy-fetch from cloud if enabled. The blob is
  // then cached locally so subsequent reads stay fast and work offline.
  if (!ENV.cloudEnabled) return undefined;
  try {
    const blob = await apiGetBlob(`/photos/${encodeURIComponent(id)}`);
    const rec: PhotoRecord = {
      id,
      blob,
      kind: 'snag',
      jobRef: '',
      createdAt: Date.now(),
      syncedAt: Date.now(),
    };
    await db.put('photos', rec);
    return rec;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return undefined;
    return undefined;
  }
}

export async function getPhotoUrl(id: string): Promise<string | null> {
  const rec = await getPhoto(id);
  if (!rec) return null;
  return URL.createObjectURL(rec.blob);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', id);
  if (ENV.cloudEnabled) {
    await enqueue({ type: 'deletePhoto', photoId: id });
  }
}

export async function deletePhotosForJob(jobRef: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('photos', 'readwrite');
  const index = tx.store.index('byJob');
  const ids: string[] = [];
  let cursor = await index.openCursor(jobRef);
  while (cursor) {
    ids.push(cursor.value.id);
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
  if (ENV.cloudEnabled) {
    for (const id of ids) await enqueue({ type: 'deletePhoto', photoId: id });
  }
}

/** Rough estimate of storage used. Returns null if API unavailable. */
export async function estimateQuota(): Promise<{ used: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  return { used: est.usage ?? 0, quota: est.quota ?? 0 };
}
