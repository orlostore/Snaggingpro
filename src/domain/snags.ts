/**
 * Snag identity and severity rules.
 */

import type { Item, RoomState, State } from '@/state/schema';

export const SEVERITIES = ['critical', 'major', 'minor'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'CRITICAL',
  major: 'MAJOR',
  minor: 'MINOR',
};

export const SEVERITY_DESCRIPTION: Record<Severity, string> = {
  critical: 'Safety risk, system non-functional, integrity compromised. Must be rectified before handover acceptance.',
  major: 'Significant defect affecting function, appearance, or longevity. Should be rectified during DLP.',
  minor: 'Cosmetic or workmanship issue. Recommended for rectification during DLP.',
};

export function jobRefFromDate(date: Date, seq: number): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seqStr = String(seq).padStart(3, '0');
  return `SP-${yy}${mm}${dd}-${seqStr}`;
}

export function snagId(jobRef: string, ordinal: number): string {
  return `${jobRef}-${String(ordinal).padStart(3, '0')}`;
}

/**
 * Walk all rooms and return flat list of snags in document order.
 * A snag = one observation on an item with status 'issue', OR an item with status 'issue' and no observations.
 */
export interface SnagRecord {
  id: string;
  ordinal: number;
  roomId: string;
  roomLabel: string;
  itemKey: string;
  itemLabel: string;
  dbNum: number | undefined;
  severity: Severity;
  text: string;
  photoIds: string[];
  observationId: string | null;
}

export function collectSnags(state: State): SnagRecord[] {
  const out: SnagRecord[] = [];
  let ord = 0;
  for (const roomId of state.roomOrder) {
    const room = state.rooms[roomId];
    if (!room || room.excluded) continue;
    for (const [itemKey, item] of Object.entries(room.items)) {
      if (item.status !== 'issue') continue;
      if (item.observations.length === 0) {
        ord++;
        out.push({
          id: snagId(state.job.ref, ord),
          ordinal: ord,
          roomId,
          roomLabel: room.label,
          itemKey,
          itemLabel: item.label,
          dbNum: item.dbNum,
          severity: item.severity ?? 'minor',
          text: item.note,
          photoIds: [],
          observationId: null,
        });
        continue;
      }
      for (const obs of item.observations) {
        ord++;
        out.push({
          id: snagId(state.job.ref, ord),
          ordinal: ord,
          roomId,
          roomLabel: room.label,
          itemKey,
          itemLabel: item.label,
          dbNum: item.dbNum,
          severity: obs.severity ?? item.severity ?? 'minor',
          text: obs.text,
          photoIds: obs.photoIds,
          observationId: obs.id,
        });
      }
    }
  }
  return out;
}

export interface RoomStats {
  total: number;
  inspected: number;
  pass: number;
  issue: number;
  na: number;
  pending: number;
}

export function statsForRoom(room: RoomState): RoomStats {
  const items = Object.values(room.items);
  const stats: RoomStats = { total: items.length, inspected: 0, pass: 0, issue: 0, na: 0, pending: 0 };
  for (const it of items) {
    if (it.status === 'pass') {
      stats.pass++;
      stats.inspected++;
    } else if (it.status === 'issue') {
      stats.issue++;
      stats.inspected++;
    } else if (it.status === 'na') {
      stats.na++;
      stats.inspected++;
    } else {
      stats.pending++;
    }
  }
  return stats;
}

export function isItemTouched(item: Item): boolean {
  return item.status !== 'pending';
}
