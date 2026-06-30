/**
 * QuoteRecord — what gets persisted to IndexedDB.
 *
 * Superset of QuoteInput plus stamping (createdAt, total) and a
 * lifecycle field (status) so we can show "Issued" vs "Converted to
 * inspection" badges in the library.
 */

import type { PropType } from '@/domain/pricing';

export interface QuoteRecord {
  quoteRef: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  developer: string;
  community: string;
  unit: string;
  floor: string;
  propType: PropType;
  bedrooms: number;
  bua: number;
  /** When non-zero, overrides the calculated total. */
  priceOverride: number;
  /** Final total in AED — computed once at issue and stored for the list. */
  total: number;
  /** Job ref that this quote would become if the client books. */
  jobRef: string;
  createdAt: number;
  status: 'issued' | 'converted';
  /** If status is 'converted', the actual reportId the inspection lives under. */
  convertedReportId?: string;
}
