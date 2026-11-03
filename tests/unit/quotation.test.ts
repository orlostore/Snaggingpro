import { describe, expect, it } from 'vitest';
import { generateQuotationHtml, type QuoteInput } from '@/quote/generate';
import { displayQuoteRef } from '@/quote/quoteRef';
import { checkpointsSentence } from '@/domain/checkpoints';

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

describe('checkpointsSentence', () => {
  it('describes a 3 BR apartment without maid room', () => {
    expect(checkpointsSentence({ propType: 'apartment', bedrooms: 3 })).toBe(
      'On average, a 3-bedroom apartment has 300+ checking points, depending on the systems available. ' +
        'All checks are segmented into 14 sections. ' +
        'The sections and systems are subject to availability in the apartment.',
    );
  });

  it('adds the maid room when present', () => {
    const s = checkpointsSentence({ propType: 'apartment', bedrooms: 3, maidRoom: true });
    expect(s).toContain("3-bedroom apartment plus maid's room has 350+ checking points");
    expect(s).toContain('15 sections');
  });

  it('appears on the quotation with Lump sum on override', () => {
    const out = generateQuotationHtml({ ...base, priceOverride: 2500 });
    expect(out).toContain('Lump sum');
    expect(out).toContain('checking points');
  });
});
