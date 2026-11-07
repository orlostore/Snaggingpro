import { describe, expect, it, vi } from 'vitest';
import { emptyState } from '@/state/init';
import { migrate } from '@/state/migrations';
import { StateZ, type State } from '@/state/schema';
import { loadDraft } from '@/state/persist';
import { collectSnags } from '@/domain/snags';
import { photoIdsInState } from '@/state/photoIds';
import { generateReportHtml } from '@/report/generate';

vi.mock('@/storage/photos', () => ({
  getPhoto: async (id: string) =>
    id === 'plan-1'
      ? { id, blob: new Blob(['png'], { type: 'image/png' }), kind: 'plan', jobRef: '', createdAt: 0, syncedAt: null }
      : undefined,
}));

function stateWithIssue(): State {
  const s = emptyState({ propType: 'apartment', bedrooms: 1, jobSeq: 1, now: new Date('2026-11-07') });
  const kitchen = s.rooms['kitchen']!;
  const item = Object.values(kitchen.items)[0]!;
  item.status = 'issue';
  item.severity = 'major';
  item.observations.push({ id: 'obs-1', text: 'Crack beside window', photoIds: [], pin: { x: 0.25, y: 0.5 } });
  return s;
}

describe('floor plan state', () => {
  it('upgrades a v1 state to v2 with no plan', () => {
    const v2 = emptyState({ propType: 'villa', bedrooms: 3, jobSeq: 1 });
    const v1: Record<string, unknown> = { ...v2, version: 1 };
    delete v1['planPhotoId'];
    const out = migrate(v1);
    expect(out?.version).toBe(2);
    expect(out?.planPhotoId).toBeNull();
    expect(Object.keys(out?.rooms ?? {}).length).toBe(Object.keys(v2.rooms).length);
  });

  it('loads a saved v1 draft by migrating it', () => {
    const v2 = emptyState({ propType: 'apartment', bedrooms: 2, jobSeq: 4 });
    const v1: Record<string, unknown> = { ...v2, version: 1 };
    delete v1['planPhotoId'];
    localStorage.setItem('snaggingpro_draft_v1', JSON.stringify(v1));
    const loaded = loadDraft();
    expect(loaded?.job.ref).toBe(v2.job.ref);
    expect(loaded?.version).toBe(2);
    localStorage.clear();
  });

  it('rejects pins outside the plan', () => {
    const s = stateWithIssue();
    s.rooms['kitchen']!.items[Object.keys(s.rooms['kitchen']!.items)[0]!]!.observations[0]!.pin = { x: 1.4, y: 0.2 };
    expect(StateZ.safeParse(s).success).toBe(false);
  });

  it('carries pins onto snags and counts the plan as a referenced photo', () => {
    const s = stateWithIssue();
    s.planPhotoId = 'plan-1';
    const snags = collectSnags(s);
    expect(snags[0]?.pin).toEqual({ x: 0.25, y: 0.5 });
    expect(photoIdsInState(s)).toContain('plan-1');
  });
});

describe('report floor plan page', () => {
  it('shows the plan with numbered pins when snags are pinned', async () => {
    const s = stateWithIssue();
    s.planPhotoId = 'plan-1';
    const out = await generateReportHtml(s);
    expect(out).toContain('<h1>Floor plan</h1>');
    expect(out).toContain('left:25.00%;top:50.00%"><svg');
    expect(out).toContain('Plan pin 1');
  });

  it('leaves the plan page out when nothing is pinned', async () => {
    const s = stateWithIssue();
    s.planPhotoId = 'plan-1';
    delete s.rooms['kitchen']!.items[Object.keys(s.rooms['kitchen']!.items)[0]!]!.observations[0]!.pin;
    const out = await generateReportHtml(s);
    expect(out).not.toContain('<h1>Floor plan</h1>');
  });
});
