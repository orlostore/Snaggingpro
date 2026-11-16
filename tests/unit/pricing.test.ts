import { describe, it, expect } from 'vitest';
import { calcFee, feeBreakdown, PROP_OPTIONS } from '@/domain/pricing';

describe('pricing equation: fee = base + max(0, BUA - baseArea)', () => {
  it('returns base when BUA is at or under threshold', () => {
    expect(calcFee('apartment', 0, 800)).toBe(1200); // studio threshold 1000
    expect(calcFee('apartment', 3, 1700)).toBe(2100); // 3BR threshold 1700
    expect(calcFee('villa', 4, 2400)).toBe(3400); // villa 4BR threshold 2400
  });

  it('adds AED 1 per sqft over the baseArea threshold', () => {
    // 2BR apt, baseArea 1500. BUA 1800 → 1800 + 300 = 2100
    expect(calcFee('apartment', 2, 1800)).toBe(2100);
    // Villa 5BR, baseArea 3000. BUA 3500 → 4100 + 500 = 4600
    expect(calcFee('villa', 5, 3500)).toBe(4600);
    // Villa 6BR, baseArea 3250. BUA 4500 → 4400 + 1250 = 5650
    expect(calcFee('villa', 6, 4500)).toBe(5650);
  });

  it('matches the published base fees at zero BUA', () => {
    expect(calcFee('apartment', 0, 0)).toBe(1200);
    expect(calcFee('apartment', 1, 0)).toBe(1200);
    expect(calcFee('apartment', 2, 0)).toBe(1800);
    expect(calcFee('apartment', 3, 0)).toBe(2100);
    expect(calcFee('apartment', 4, 0)).toBe(2300);
    expect(calcFee('villa', 3, 0)).toBe(3000);
    expect(calcFee('villa', 4, 0)).toBe(3400);
    expect(calcFee('villa', 5, 0)).toBe(4100);
    expect(calcFee('villa', 6, 0)).toBe(4400);
  });

  it('returns 0 for combinations not in the table', () => {
    expect(calcFee('apartment', 5, 1000)).toBe(0);
    expect(calcFee('villa', 2, 1000)).toBe(0);
  });

  it('feeBreakdown reports overage details', () => {
    const b = feeBreakdown('villa', 5, 3500);
    expect(b).not.toBeNull();
    expect(b!.base).toBe(4100);
    expect(b!.overage).toBe(500);
    expect(b!.total).toBe(4600);
    expect(b!.overageSqft).toBe(500);
    expect(b!.baseArea).toBe(3000);
  });

  it('PROP_OPTIONS has exactly 9 entries', () => {
    expect(PROP_OPTIONS.length).toBe(9);
  });
});
