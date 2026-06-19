/**
 * Photo storage — blobs in IndexedDB, addressed by photoId.
 * App state holds only IDs; the actual bytes never live in localStorage.
 */

import { getDB, type PhotoRecord } from './idb';
import { newId } from '@/lib/id';

export async function storePhoto(
  blob: Blob,
  kind: PhotoRecord['kind'],
  jobRef: string,
): Promise<string> {
  const id = newId();
  const db = await getDB();
  await db.put('photos', { id, blob, kind, jobRef, createdAt: Date.now() });
  return id;
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  const db = await getDB();
  return db.get('photos', id);
}

export async function getPhotoUrl(id: string): Promise<string | null> {
  const rec = await getPhoto(id);
  if (!rec) return null;
  return URL.createObjectURL(rec.blob);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', id);
}

export async function deletePhotosForJob(jobRef: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('photos', 'readwrite');
  const index = tx.store.index('byJob');
  let cursor = await index.openCursor(jobRef);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

/** Rough estimate of storage used. Returns null if API unavailable. */
export async function estimateQuota(): Promise<{ used: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  return { used: est.usage ?? 0, quota: est.quota ?? 0 };
}
