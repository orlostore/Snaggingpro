import { describe, it, expect } from 'vitest';
import { scanText } from '@/domain/typoRules';

describe('scanText', () => {
  it('catches "costing → coating"', () => {
    const out = scanText('the costing is peeling');
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]?.ruleLabel).toContain('coating');
  });

  it('catches "lose tile → loose tile"', () => {
    const out = scanText('there is a lose tile');
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]?.suggested).toContain('loose');
  });

  it('returns empty for clean text', () => {
    expect(scanText('The coating is loose')).toEqual([]);
  });
});
