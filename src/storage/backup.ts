/**
 * Local backup / restore of the reports library.
 *
 * Exports every saved report (full State) + every photo blob (encoded as
 * base64) into a single .snaggingpro.json file the inspector can save to
 * cloud drive, SD card, or email.
 *
 * Restore is additive: it merges into the existing library without
 * touching reports that are not in the backup. Conflict policy: backup
 * wins (assumes the file is the authoritative copy).
 *
 * The bundle format is versioned so we can evolve it without breaking
 * older files.
 */

import { getDB } from './idb';
import { reportsRepo } from './reports';
import type { State } from '@/state/schema';

const BUNDLE_VERSION = 1;

interface PhotoBundle {
  id: string;
  jobRef: string;
  kind: 'cover' | 'overview' | 'snag' | 'annotated' | 'rectification';
  createdAt: number;
  /** MIME type recovered from the original blob. */
  type: string;
  /** Base64-encoded blob bytes (no data: prefix). */
  data: string;
}

export interface BackupBundle {
  bundleVersion: number;
  exportedAt: number;
  appName: 'SnaggingPro';
  reports: State[];
  photos: PhotoBundle[];
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export async function exportBackup(): Promise<BackupBundle> {
  const db = await getDB();
  const reports = await db.getAll('reports');
  const allPhotos = await db.getAll('photos');

  // Only include photos referenced by at least one saved report — keeps
  // orphans out and the file smaller.
  const referenced = new Set<string>();
  for (const r of reports) {
    for (const id of r.coverPhotoIds) if (id) referenced.add(id);
    for (const room of Object.values(r.rooms)) {
      for (const item of Object.values(room.items)) {
        for (const obs of item.observations) {
          for (const pid of obs.photoIds) referenced.add(pid);
          for (const pid of obs.rectification?.photoIds ?? []) referenced.add(pid);
        }
      }
    }
  }

  const photos: PhotoBundle[] = [];
  for (const p of allPhotos) {
    if (!referenced.has(p.id)) continue;
    photos.push({
      id: p.id,
      jobRef: p.jobRef,
      kind: p.kind,
      createdAt: p.createdAt,
      type: p.blob.type || 'image/webp',
      data: await blobToBase64(p.blob),
    });
  }

  return {
    bundleVersion: BUNDLE_VERSION,
    exportedAt: Date.now(),
    appName: 'SnaggingPro',
    reports,
    photos,
  };
}

export function triggerDownload(bundle: BackupBundle): void {
  const json = JSON.stringify(bundle);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date(bundle.exportedAt).toISOString().slice(0, 16).replace(/[:T]/g, '');
  a.href = url;
  a.download = `snaggingpro-backup-${stamp}.snaggingpro.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export interface RestoreSummary {
  reportsImported: number;
  photosImported: number;
}

export async function importBackup(bundle: unknown): Promise<RestoreSummary> {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('Backup file is not valid JSON.');
  }
  const b = bundle as BackupBundle;
  if (b.appName !== 'SnaggingPro' || typeof b.bundleVersion !== 'number') {
    throw new Error('Not a SnaggingPro backup file.');
  }
  if (b.bundleVersion > BUNDLE_VERSION) {
    throw new Error(
      `Backup was exported by a newer version (${b.bundleVersion}). Update the app and try again.`,
    );
  }

  const db = await getDB();

  // Photos first so reports never reference a missing blob.
  let photosImported = 0;
  if (Array.isArray(b.photos)) {
    const tx = db.transaction('photos', 'readwrite');
    for (const p of b.photos) {
      tx.store.put({
        id: p.id,
        jobRef: p.jobRef,
        kind: p.kind,
        createdAt: p.createdAt,
        blob: base64ToBlob(p.data, p.type),
      });
      photosImported++;
    }
    await tx.done;
  }

  // Reports + summaries (saveReport writes both).
  let reportsImported = 0;
  if (Array.isArray(b.reports)) {
    for (const r of b.reports) {
      await reportsRepo.saveReport(r);
      reportsImported++;
    }
  }

  return { reportsImported, photosImported };
}
