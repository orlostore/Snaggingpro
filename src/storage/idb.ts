/**
 * IndexedDB connection — single shared database for SnaggingPro v2.
 *
 * Stores:
 * - photos:  key = photoId, value = { blob, kind, createdAt, jobRef }
 * - reports: key = id (= jobRef), value = full State
 * - summaries: key = id, value = ReportSummary (denormalised for library list)
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { State, ReportSummary } from '@/state/schema';

export interface PhotoRecord {
  id: string;
  blob: Blob;
  kind: 'cover' | 'overview' | 'snag' | 'annotated' | 'rectification';
  jobRef: string;
  createdAt: number;
}

interface SnaggingProDB extends DBSchema {
  photos: {
    key: string;
    value: PhotoRecord;
    indexes: { byJob: string };
  };
  reports: {
    key: string;
    value: State;
  };
  summaries: {
    key: string;
    value: ReportSummary;
    indexes: { byDate: number; byClient: string };
  };
}

const DB_NAME = 'snaggingpro';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SnaggingProDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SnaggingProDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SnaggingProDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('photos')) {
          const photos = db.createObjectStore('photos', { keyPath: 'id' });
          photos.createIndex('byJob', 'jobRef');
        }
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'job.ref' });
        }
        if (!db.objectStoreNames.contains('summaries')) {
          const summaries = db.createObjectStore('summaries', { keyPath: 'id' });
          summaries.createIndex('byDate', 'createdAt');
          summaries.createIndex('byClient', 'clientName');
        }
      },
    });
  }
  return dbPromise;
}
