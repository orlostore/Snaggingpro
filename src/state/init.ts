/**
 * Build an initial draft State for a new inspection.
 */

import { STATE_VERSION, type State } from './schema';
import { buildRooms } from '@/domain/rooms';
import { CHECKLISTS } from '@/domain/checklists';
import { isVillaLike, type PropType } from '@/domain/pricing';
import { jobRefFromDate } from '@/domain/snags';
import { todayIsoDate } from '@/lib/format';
import { newId } from '@/lib/id';

export interface NewInspectionInput {
  propType: PropType;
  bedrooms: number;
  jobSeq: number;
  now?: Date;
}

export function emptyState(input: NewInspectionInput): State {
  const now = input.now ?? new Date();
  const ref = jobRefFromDate(now, input.jobSeq);
  const rooms = buildRooms({ propType: input.propType, bedrooms: input.bedrooms });

  const state: State = {
    version: STATE_VERSION,
    job: {
      ref,
      date: todayIsoDate(now),
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
      reportType: 'original',
      parentReportId: null,
      status: 'draft',
    },
    client: { name: '', phone: '', email: '' },
    property: {
      type: input.propType,
      developer: '',
      community: '',
      unit: '',
      floor: '',
      bua: 0,
      bedrooms: input.bedrooms,
      price: 0,
    },
    coverPhotoIds: [null, null, null],
    rooms: {},
    roomOrder: [],
    discLabels: {},
  };

  for (const tpl of rooms) {
    const room = {
      id: tpl.id,
      label: tpl.label,
      icon: tpl.icon,
      clKey: tpl.clKey,
      discs: tpl.discs,
      custom: false,
      excluded: false,
      overviewPhotoId: null,
      items: {} as Record<string, State['rooms'][string]['items'][string]>,
    } as State['rooms'][string];

    if (tpl.id === 'db_panel') {
      const villa = isVillaLike(input.propType);
      const instances = villa
        ? [
            { num: 1, location: 'GF' },
            { num: 2, location: 'FF' },
          ]
        : [{ num: 1, location: '' }];
      room.dbInstances = instances;
      for (const inst of instances) {
        for (const disc of tpl.discs) {
          const items = CHECKLISTS[tpl.clKey][disc] ?? [];
          items.forEach((label, idx) => {
            const key = `${disc}_${idx}_db${inst.num}`;
            room.items[key] = {
              key,
              label,
              disc,
              status: 'pending',
              note: '',
              observations: [],
              dbNum: inst.num,
            };
          });
        }
      }
    } else {
      for (const disc of tpl.discs) {
        const items = CHECKLISTS[tpl.clKey][disc] ?? [];
        items.forEach((label, idx) => {
          const key = `${disc}_${idx}`;
          room.items[key] = {
            key,
            label,
            disc,
            status: 'pending',
            note: '',
            observations: [],
          };
        });
      }
    }

    state.rooms[tpl.id] = room;
    state.roomOrder.push(tpl.id);
  }

  return state;
}

/** Clone an existing state as the basis for a follow-up inspection. */
export function cloneAsFollowUp(source: State, now: Date, jobSeq: number): State {
  const ref = jobRefFromDate(now, jobSeq);
  const next = structuredClone(source);
  next.job = {
    ...next.job,
    ref,
    date: todayIsoDate(now),
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
    reportType: 'follow-up',
    parentReportId: source.job.ref,
    status: 'draft',
  };
  // Mark every existing snag as "open" for rectification check
  for (const room of Object.values(next.rooms)) {
    for (const item of Object.values(room.items)) {
      for (const obs of item.observations) {
        obs.id = obs.id || newId();
        obs.rectification = obs.rectification ?? { status: 'open', note: '', photoIds: [] };
      }
    }
  }
  return next;
}
