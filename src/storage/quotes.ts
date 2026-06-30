/**
 * Quotation persistence — local IndexedDB.
 *
 * Cloud sync via the outbox will come in a follow-up PR; for now the
 * quotes library is local-only per device. Inspector typically issues
 * + reopens on the same device so this covers the common case.
 */

import { getDB } from './idb';
import type { QuoteRecord } from '@/quote/types';

export const quotesRepo = {
  async save(record: QuoteRecord): Promise<void> {
    const db = await getDB();
    await db.put('quotes', record);
  },

  async get(quoteRef: string): Promise<QuoteRecord | undefined> {
    const db = await getDB();
    return db.get('quotes', quoteRef);
  },

  async list(): Promise<QuoteRecord[]> {
    const db = await getDB();
    const all = await db.getAll('quotes');
    return all.sort((a, b) => b.createdAt - a.createdAt);
  },

  async delete(quoteRef: string): Promise<void> {
    const db = await getDB();
    await db.delete('quotes', quoteRef);
  },

  async markConverted(quoteRef: string, reportId: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get('quotes', quoteRef);
    if (!existing) return;
    existing.status = 'converted';
    existing.convertedReportId = reportId;
    await db.put('quotes', existing);
  },
};
