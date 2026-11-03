import { describe, expect, it } from 'vitest';
import { generateQuotationHtml, type QuoteInput } from '@/quote/generate';
import { displayQuoteRef } from '@/quote/quoteRef';

const base: QuoteInput = {
  quoteRef: 'SP-QTN-261102-001',
  clientName: 'Mr. Sohan',
  clientPhone: '+971555012043',
  clientEmail: '',
  developer: '',
  community: 'JVC',
  unit: 'TBC',
  floor: 'TBC',
  propType: 'apartment',
  bedrooms: 3,
  bua: 1769,
  priceOverride: 0,
  jobRef: 'SP-261102-001',
};

describe('generateQuotationHtml', () => {
  it('shows the fee breakdown when the price is calculated', () => {
    const out = generateQuotationHtml(base);
    expect(out).toContain('Additional area');
    expect(out).toContain('Base up to');
  });

  it('hides the breakdown when the price is overridden', () => {
    const out = generateQuotationHtml({ ...base, priceOverride: 2000 });
    expect(out).not.toContain('Additional area');
    expect(out).not.toContain('Base up to');
    expect(out).not.toContain('Adjustment');
    expect(out).toContain('AED 2,000');
  });

  it('stamps the revision on the reference', () => {
    const out = generateQuotationHtml({ ...base, revision: 2 });
    expect(out).toContain('SP-QTN-261102-001-R2');
    expect(out).toContain('Revision 2');
  });
});

describe('displayQuoteRef', () => {
  it('leaves the original issue unsuffixed', () => {
    expect(displayQuoteRef('SP-QTN-261102-001', 0)).toBe('SP-QTN-261102-001');
    expect(displayQuoteRef('SP-QTN-261102-001', undefined)).toBe('SP-QTN-261102-001');
  });
});
