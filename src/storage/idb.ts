/**
 * IndexedDB connection — single shared database for SnaggingPro v2.
 *
 * Stores:
 * - photos:    key = photoId, value = { blob, kind, createdAt, jobRef, syncedAt? }
 * - reports:   key = id (= jobRef), value = full State
 * - summaries: key = id, value = ReportSummary (denormalised for library list)
 * - outbox:    key = opId, value = pending cloud-sync operation
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { State, ReportSummary } from '@/state/schema';
import type { QuoteRecord } from '@/quote/types';

export interface PhotoRecord {
  id: string;
  blob: Blob;
  kind: 'cover' | 'overview' | 'snag' | 'annotated' | 'rectification';
  jobRef: string;
  createdAt: number;
  /** Ms-epoch when this photo was last successfully PUT to the cloud, or null. */
  syncedAt?: number | null;
}

export type OutboxOp =
  | { type: 'saveReport'; reportId: string }
  | { type: 'deleteReport'; reportId: string }
  | { type: 'uploadPhoto'; photoId: string; jobRef: string; kind: PhotoRecord['kind'] }
  | { type: 'deletePhoto'; photoId: string };

export interface OutboxEntry {
  id: string;
  op: OutboxOp;
  attempts: number;
  lastError?: string;
  createdAt: number;
  nextAttemptAt: number;
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
  outbox: {
    key: string;
    value: OutboxEntry;
    indexes: { byNextAttempt: number };
  };
  quotes: {
    key: string;
    value: QuoteRecord;
    indexes: { byDate: number; byClient: string };
  };
}

const DB_NAME = 'snaggingpro';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<SnaggingProDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SnaggingProDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SnaggingProDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
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
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('outbox')) {
            const outbox = db.createObjectStore('outbox', { keyPath: 'id' });
            outbox.createIndex('byNextAttempt', 'nextAttemptAt');
          }
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('quotes')) {
            const quotes = db.createObjectStore('quotes', { keyPath: 'quoteRef' });
            quotes.createIndex('byDate', 'createdAt');
            quotes.createIndex('byClient', 'clientName');
          }
        }
      },
    });
  }
  return dbPromise;
}
