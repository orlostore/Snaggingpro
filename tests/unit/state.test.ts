import { describe, it, expect } from 'vitest';
import { StateZ } from '@/state/schema';
import { emptyState, cloneAsFollowUp } from '@/state/init';
import { migrate } from '@/state/migrations';

describe('state', () => {
  it('emptyState produces a schema-valid State', () => {
    const s = emptyState({ propType: 'villa', bedrooms: 3, jobSeq: 1, now: new Date('2026-06-19') });
    expect(StateZ.safeParse(s).success).toBe(true);
    expect(s.job.reportType).toBe('original');
    expect(s.roomOrder.length).toBeGreaterThan(0);
  });

  it('cloneAsFollowUp links back to parent and stays valid', () => {
    const base = emptyState({ propType: 'villa', bedrooms: 3, jobSeq: 1 });
    const fu = cloneAsFollowUp(base, new Date(), 2);
    expect(fu.job.reportType).toBe('follow-up');
    expect(fu.job.parentReportId).toBe(base.job.ref);
    expect(StateZ.safeParse(fu).success).toBe(true);
  });

  it('migrate from a v0-shape blob succeeds', () => {
    const legacy = {
      version: 0,
      jobRef: 'SP-LEGACY-001',
      clientName: 'Test Client',
      phone: '+971000',
      propType: 'villa3',
      developer: 'Emaar',
      community: 'Arabian Ranches',
      unit: 'V-1',
    };
    const migrated = migrate(legacy);
    expect(migrated).not.toBeNull();
    expect(migrated?.client.name).toBe('Test Client');
    expect(migrated?.property.type).toBe('villa');
    expect(migrated?.property.bedrooms).toBe(3);
  });
});
