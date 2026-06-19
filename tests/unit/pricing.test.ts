import { describe, it, expect } from 'vitest';
import { calcFee, feeBreakdown, PROP_OPTIONS } from '@/domain/pricing';

describe('pricing equation: fee = base + max(0, BUA - baseArea)', () => {
  it('returns base when BUA is at or under threshold', () => {
    expect(calcFee('apartment', 0, 800)).toBe(1000); // studio threshold 1000
    expect(calcFee('apartment', 3, 1700)).toBe(1700); // 3BR threshold 1700
    expect(calcFee('villa', 4, 2400)).toBe(2800); // villa 4BR threshold 2400
  });

  it('adds AED 1 per sqft over the baseArea threshold', () => {
    // 2BR apt, baseArea 1500. BUA 1800 → 1500 + 300 = 1800
    expect(calcFee('apartment', 2, 1800)).toBe(1800);
    // Villa 5BR, baseArea 3000. BUA 3500 → 3400 + 500 = 3900
    expect(calcFee('villa', 5, 3500)).toBe(3900);
    // Villa 6BR, baseArea 3250. BUA 4500 → 3625 + 1250 = 4875
    expect(calcFee('villa', 6, 4500)).toBe(4875);
  });

  it('matches v0 base fees at zero BUA', () => {
    expect(calcFee('apartment', 0, 0)).toBe(1000);
    expect(calcFee('apartment', 1, 0)).toBe(1000);
    expect(calcFee('apartment', 2, 0)).toBe(1500);
    expect(calcFee('apartment', 3, 0)).toBe(1700);
    expect(calcFee('apartment', 4, 0)).toBe(1900);
    expect(calcFee('villa', 3, 0)).toBe(2500);
    expect(calcFee('villa', 4, 0)).toBe(2800);
    expect(calcFee('villa', 5, 0)).toBe(3400);
    expect(calcFee('villa', 6, 0)).toBe(3625);
  });

  it('returns 0 for combinations not in the table', () => {
    expect(calcFee('apartment', 5, 1000)).toBe(0);
    expect(calcFee('villa', 2, 1000)).toBe(0);
  });

  it('feeBreakdown reports overage details', () => {
    const b = feeBreakdown('villa', 5, 3500);
    expect(b).not.toBeNull();
    expect(b!.base).toBe(3400);
    expect(b!.overage).toBe(500);
    expect(b!.total).toBe(3900);
    expect(b!.overageSqft).toBe(500);
    expect(b!.baseArea).toBe(3000);
  });

  it('PROP_OPTIONS has exactly 9 entries', () => {
    expect(PROP_OPTIONS.length).toBe(9);
  });
});
