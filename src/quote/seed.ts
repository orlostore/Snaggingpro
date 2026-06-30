/**
 * One-shot seed of quotations that were issued BEFORE the Quotations
 * library save logic was deployed. Runs once per device (gated by a
 * localStorage flag) so re-loads don't keep re-inserting.
 */

import { quotesRepo } from '@/storage/quotes';
import type { QuoteRecord } from './types';

const SEED_FLAG = 'sp_seed_qtn_v4';

const BACKFILL: QuoteRecord[] = [
  {
    quoteRef: 'SP-QTN-260630-027',
    clientName: 'Pawan Kumar',
    clientPhone: '+971521231847',
    clientEmail: 'anthony.zhotso27@gmail.com',
    developer: '',
    community: '',
    unit: 'Private',
    floor: '',
    propType: 'apartment',
    bedrooms: 2,
    bua: 1142,
    priceOverride: 1650,
    total: 1650,
    jobRef: 'SP-260630-001',
    createdAt: new Date('2026-06-30T10:00:00Z').getTime(),
    status: 'issued',
  },
];

export async function seedMissingQuotes(): Promise<void> {
  try {
    if (localStorage.getItem(SEED_FLAG)) return;
  } catch {
    return;
  }
  for (const q of BACKFILL) {
    try {
      const existing = await quotesRepo.get(q.quoteRef);
      if (!existing) {
        await quotesRepo.save(q);
      } else if (existing.total !== q.total || existing.bua !== q.bua) {
        // Update the financial details but preserve any conversion state.
        await quotesRepo.save({
          ...q,
          status: existing.status,
          ...(existing.convertedReportId !== undefined
            ? { convertedReportId: existing.convertedReportId }
            : {}),
        });
      }
    } catch {
      /* best effort — failure here shouldn't block app startup */
    }
  }
  try {
    localStorage.setItem(SEED_FLAG, '1');
  } catch {
    /* ignore */
  }
}
