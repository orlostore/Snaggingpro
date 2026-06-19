import { describe, it, expect } from 'vitest';
import { feeFor, PROP_OPTIONS } from '@/domain/pricing';

describe('pricing', () => {
  it('matches v0 fee schedule', () => {
    expect(feeFor('apartment', 0)).toBe(1000);
    expect(feeFor('apartment', 1)).toBe(1000);
    expect(feeFor('apartment', 2)).toBe(1500);
    expect(feeFor('apartment', 3)).toBe(1700);
    expect(feeFor('apartment', 4)).toBe(1900);
    expect(feeFor('villa', 3)).toBe(2500);
    expect(feeFor('villa', 4)).toBe(2800);
    expect(feeFor('villa', 5)).toBe(3400);
    expect(feeFor('villa', 6)).toBe(3625);
  });

  it('returns 0 for combinations not in the table', () => {
    expect(feeFor('apartment', 5)).toBe(0);
    expect(feeFor('villa', 2)).toBe(0);
  });

  it('PROP_OPTIONS has exactly 9 entries', () => {
    expect(PROP_OPTIONS.length).toBe(9);
  });
});
