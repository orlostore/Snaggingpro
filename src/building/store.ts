/**
 * Turns a register area into an ordinary inspection.
 *
 * An area IS a report. Opening area 201 loads (or creates) a draft State whose
 * job.ref is "CF-201", then hands control to the existing dashboard/room
 * screens. Nothing downstream needs to know it came from a building.
 */

import { STATE_VERSION, type State } from '@/state/schema';
import { buildRooms } from '@/domain/rooms';
import { CHECKLISTS } from '@/domain/checklists';
import { todayIsoDate } from '@/lib/format';
import { saveDraft } from '@/state/persist';
import { reportsRepo } from '@/storage/reports';
import { checklistFor } from './areaChecklists';
import type { AreaDef, BuildingDef, LevelDef } from './types';

const ACTIVE_KEY = 'snaggingpro_building_active';

export type AreaStatus = 'not-started' | 'draft' | 'done';

/** Safe, stable id for an area's report. "STR1 2→3" becomes "CF-STR1-2-3". */
export function areaJobRef(buildingCode: string, areaRef: string): string {
  const slug = areaRef
    .replace(/→/g, '-')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${buildingCode}-${slug}`;
}

export function getActiveBuilding(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveBuilding(code: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, code);
  } catch {
    /* storage unavailable — the register still works, it just won't be remembered */
  }
}

type EmptyItems = State['rooms'][string]['items'];

/** One room's worth of items for a common area, from its kind's checklist. */
function commonAreaRooms(area: AreaDef): State['rooms'] {
  const cl = checklistFor(area.kind);
  const items: EmptyItems = {};
  for (const disc of cl.discs) {
    const labels = cl.items[disc] ?? [];
    labels.forEach((label, idx) => {
      const key = `${disc}_${idx}`;
      items[key] = { key, label, disc, status: 'pending', note: '', observations: [] };
    });
  }
  return {
    area: {
      id: 'area',
      label: area.label,
      icon: cl.icon,
      clKey: 'kitchen', // unused for common areas; kept to satisfy the schema
      discs: cl.discs,
      custom: false,
      excluded: false,
      overviewPhotoId: null,
      items,
    },
  };
}

/** Apartment rooms, from the existing room library. */
function apartmentRooms(bedrooms: number): { rooms: State['rooms']; order: string[] } {
  const rooms: State['rooms'] = {};
  const order: string[] = [];
  for (const tpl of buildRooms({ propType: 'apartment', bedrooms })) {
    const items: EmptyItems = {};
    if (tpl.id === 'db_panel') {
      for (const disc of tpl.discs) {
        (CHECKLISTS[tpl.clKey][disc] ?? []).forEach((label, idx) => {
          const key = `${disc}_${idx}_db1`;
          items[key] = { key, label, disc, status: 'pending', note: '', observations: [], dbNum: 1 };
        });
      }
    } else {
      for (const disc of tpl.discs) {
        (CHECKLISTS[tpl.clKey][disc] ?? []).forEach((label, idx) => {
          const key = `${disc}_${idx}`;
          items[key] = { key, label, disc, status: 'pending', note: '', observations: [] };
        });
      }
    }
    rooms[tpl.id] = {
      id: tpl.id,
      label: tpl.label,
      icon: tpl.icon,
      clKey: tpl.clKey,
      discs: tpl.discs,
      custom: false,
      excluded: false,
      overviewPhotoId: null,
      items,
      ...(tpl.id === 'db_panel' ? { dbInstances: [{ num: 1, location: '' }] } : {}),
    };
    order.push(tpl.id);
  }
  return { rooms, order };
}

/** Build a fresh draft State for one area of a building. */
export function newAreaState(b: BuildingDef, level: LevelDef, area: AreaDef, now = new Date()): State {
  const ref = areaJobRef(b.code, area.ref);
  const isApt = area.kind === 'apartment';
  const { rooms, order } = isApt
    ? apartmentRooms(area.bedrooms ?? 2)
    : { rooms: commonAreaRooms(area), order: ['area'] };

  return {
    version: STATE_VERSION,
    job: {
      ref,
      date: todayIsoDate(now),
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
      reportType: 'original',
      parentReportId: null,
      status: 'draft',
      sourceQuoteRef: null,
    },
    client: { name: b.developer ?? '', phone: '', email: '' },
    property: {
      type: 'apartment',
      developer: b.developer ?? '',
      community: b.location ?? '',
      // The area ref and level are what identify this report inside a building.
      unit: area.ref,
      floor: level.label,
      bua: 0,
      bedrooms: isApt ? (area.bedrooms ?? 2) : 0,
      price: 0,
    },
    coverPhotoIds: [null, null, null],
    rooms,
    roomOrder: order,
    discLabels: {},
  };
}

/**
 * Open an area: resume its saved report if one exists, otherwise start fresh.
 * Either way the draft is left ready for the dashboard.
 */
export async function openArea(b: BuildingDef, level: LevelDef, area: AreaDef): Promise<void> {
  const ref = areaJobRef(b.code, area.ref);
  const existing = await reportsRepo.getReport(ref);
  saveDraft(existing ?? newAreaState(b, level, area));
  setActiveBuilding(b.code);
}

/** Status of every area in the building, keyed by area ref. */
export async function areaStatuses(b: BuildingDef, draftRef: string | null): Promise<Map<string, AreaStatus>> {
  const out = new Map<string, AreaStatus>();
  let summaries: Awaited<ReturnType<typeof reportsRepo.listSummaries>> = [];
  try {
    summaries = await reportsRepo.listSummaries();
  } catch {
    summaries = [];
  }
  const byRef = new Map(summaries.map((s) => [s.jobRef, s]));
  for (const level of b.levels) {
    for (const area of level.areas) {
      const ref = areaJobRef(b.code, area.ref);
      const found = byRef.get(ref);
      if (found) out.set(area.ref, found.status === 'completed' ? 'done' : 'draft');
      else if (draftRef === ref) out.set(area.ref, 'draft');
      else out.set(area.ref, 'not-started');
    }
  }
  return out;
}

export interface LevelProgress {
  done: number;
  draft: number;
  total: number;
}

export function progressForLevel(level: LevelDef, statuses: Map<string, AreaStatus>): LevelProgress {
  let done = 0;
  let draft = 0;
  for (const area of level.areas) {
    const st = statuses.get(area.ref);
    if (st === 'done') done++;
    else if (st === 'draft') draft++;
  }
  return { done, draft, total: level.areas.length };
}
