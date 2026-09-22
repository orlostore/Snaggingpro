import { describe, expect, it } from 'vitest';
import { CRYSTAL_FOUR } from '@/building/registry';
import { areaJobRef, newAreaState } from '@/building/store';
import { areaCount, findArea } from '@/building/types';
import { checklistFor } from '@/building/areaChecklists';

describe('building register', () => {
  it('has a unique ref for every area', () => {
    const refs = CRYSTAL_FOUR.levels.flatMap((l) => l.areas.map((a) => a.ref));
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('carries 32 apartments across four residential levels', () => {
    const apts = CRYSTAL_FOUR.levels.flatMap((l) => l.areas.filter((a) => a.kind === 'apartment'));
    expect(apts).toHaveLength(32);
    for (const a of apts) expect(a.bedrooms).toBe(2);
  });

  it('covers every level from underground to building systems', () => {
    expect(CRYSTAL_FOUR.levels.map((l) => l.id)).toEqual(['UG', 'G', 'L1', 'L2', 'L3', 'L4', 'R', 'LM', 'SYS']);
    expect(areaCount(CRYSTAL_FOUR)).toBeGreaterThan(140);
  });

  it('attaches a marked-up plan to the levels that have one drawn', () => {
    const withPlan = CRYSTAL_FOUR.levels.filter((l) => l.plan);
    expect(withPlan.map((l) => l.id)).toEqual(['G', 'L1', 'L2', 'L3', 'L4', 'R']);
    for (const l of withPlan) expect(l.plan).toMatch(/^\/plans\/.+\.webp$/);
  });
});

describe('areaJobRef', () => {
  it('slugs refs that contain spaces and arrows', () => {
    expect(areaJobRef('CF', '201')).toBe('CF-201');
    expect(areaJobRef('CF', '2-GARB')).toBe('CF-2-GARB');
    expect(areaJobRef('CF', 'STR1 2→3')).toBe('CF-STR1-2-3');
    expect(areaJobRef('CF', 'LIFT1@G')).toBe('CF-LIFT1-G');
  });

  it('keeps every area ref in the register distinct once slugged', () => {
    const ids = CRYSTAL_FOUR.levels.flatMap((l) => l.areas.map((a) => areaJobRef('CF', a.ref)));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('newAreaState', () => {
  it('builds an apartment with its full room set', () => {
    const found = findArea(CRYSTAL_FOUR, '201');
    expect(found).not.toBeNull();
    const state = newAreaState(CRYSTAL_FOUR, found!.level, found!.area);
    expect(state.job.ref).toBe('CF-201');
    expect(state.property.unit).toBe('201');
    expect(state.roomOrder.length).toBeGreaterThan(5);
    expect(state.roomOrder).toContain('kitchen');
    expect(state.rooms['kitchen']?.items).not.toEqual({});
  });

  it('builds a common area as one room carrying its own checklist', () => {
    const found = findArea(CRYSTAL_FOUR, '2-GARB');
    expect(found).not.toBeNull();
    const state = newAreaState(CRYSTAL_FOUR, found!.level, found!.area);
    expect(state.roomOrder).toEqual(['area']);
    const room = state.rooms['area'];
    expect(room?.label).toBe('Garbage room');
    expect(Object.keys(room?.items ?? {}).length).toBeGreaterThan(5);
  });

  it('gives every area kind in the register a usable checklist', () => {
    for (const level of CRYSTAL_FOUR.levels) {
      for (const area of level.areas) {
        if (area.kind === 'apartment') continue;
        const cl = checklistFor(area.kind);
        expect(cl.discs.length).toBeGreaterThan(0);
        const total = cl.discs.reduce((n, d) => n + (cl.items[d]?.length ?? 0), 0);
        expect(total, `${area.ref} (${area.kind}) has no checklist items`).toBeGreaterThan(0);
      }
    }
  });
});
