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
export type Rectification = 'fixed' | 'open' | 'new';

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
  /** Rectification status carried through from a follow-up inspection. */
  rectification?: Rectification;
  rectificationNote?: string;
  rectificationPhotoIds?: string[];
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
        const rec: SnagRecord = {
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
        };
        if (obs.rectification) {
          rec.rectification = obs.rectification.status;
          rec.rectificationNote = obs.rectification.note;
          rec.rectificationPhotoIds = obs.rectification.photoIds;
        }
        out.push(rec);
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

/**
 * Each Issue item must have at least one observation that carries BOTH a
 * note describing the snag AND at least one photo. Without either, the snag
 * isn't actionable for the developer who has to rectify it.
 *
 * These predicates power both the soft visual cues during inspection
 * (badges, banners, tab pills) and the hard gates at report-generation
 * time (Generate Report / Save to Library disabled until clean).
 */
export function issueMissingPhoto(item: Item): boolean {
  if (item.status !== 'issue') return false;
  if (item.observations.length === 0) return true;
  return !item.observations.some((o) => o.photoIds.length > 0);
}

export function issueMissingNote(item: Item): boolean {
  if (item.status !== 'issue') return false;
  if (item.observations.length === 0) return true;
  return !item.observations.some((o) => o.text.trim().length > 0);
}

export function issueIncomplete(item: Item): boolean {
  return issueMissingPhoto(item) || issueMissingNote(item);
}

export function roomIncompleteIssues(room: RoomState): Item[] {
  return Object.values(room.items).filter(issueIncomplete);
}

export function discIncompleteIssues(room: RoomState, disc: Item['disc']): number {
  return Object.values(room.items).filter((i) => i.disc === disc && issueIncomplete(i)).length;
}

export interface AttentionDetail {
  roomId: string;
  roomLabel: string;
  itemKey: string;
  itemLabel: string;
  disc: Item['disc'];
  /** Item has never been marked Pass/Issue/N/A. */
  needsInspect: boolean;
  /** Item is Issue but has no observation text. */
  missingNote: boolean;
  /** Item is Issue but has no observation photo. */
  missingPhoto: boolean;
  /** Follow-up: this Issue observation has no rectification decision yet. */
  needsReview?: boolean;
  /** Follow-up: rectification is Fixed/New but no closeout note. */
  missingCloseoutNote?: boolean;
  /** Follow-up: rectification is Fixed/New but no closeout photo. */
  missingCloseoutPhoto?: boolean;
}

/**
 * Every item that's blocking the report:
 *   - untouched pending items (need a Pass / Issue / N/A decision)
 *   - issues with no note or no photo (need details)
 *
 * Used by the Report screen to disable Open-Print / Save until clean
 * and to render a single tap-to-jump punch list.
 */
export function reportNeedsAttention(state: State): AttentionDetail[] {
  const out: AttentionDetail[] = [];
  const isFollowUp = state.job.reportType === 'follow-up';

  for (const roomId of state.roomOrder) {
    const room = state.rooms[roomId];
    if (!room || room.excluded) continue;

    for (const item of Object.values(room.items)) {
      const needsInspect = item.status === 'pending';
      const missingNote = issueMissingNote(item);
      const missingPhoto = issueMissingPhoto(item);

      // Follow-up: every Issue observation must have a rectification
      // decision; Fixed / New must carry closeout note + photo.
      let needsReview = false;
      let missingCloseoutNote = false;
      let missingCloseoutPhoto = false;
      if (isFollowUp && item.status === 'issue') {
        for (const obs of item.observations) {
          const r = obs.rectification;
          if (!r) {
            needsReview = true;
          } else if (r.status === 'fixed' || r.status === 'new') {
            if (!r.note.trim()) missingCloseoutNote = true;
            if (r.photoIds.length === 0) missingCloseoutPhoto = true;
          }
        }
      }

      if (
        needsInspect ||
        missingNote ||
        missingPhoto ||
        needsReview ||
        missingCloseoutNote ||
        missingCloseoutPhoto
      ) {
        const detail: AttentionDetail = {
          roomId,
          roomLabel: room.label,
          itemKey: item.key,
          itemLabel: item.label,
          disc: item.disc,
          needsInspect,
          missingNote,
          missingPhoto,
        };
        if (needsReview) detail.needsReview = true;
        if (missingCloseoutNote) detail.missingCloseoutNote = true;
        if (missingCloseoutPhoto) detail.missingCloseoutPhoto = true;
        out.push(detail);
      }
    }
  }
  return out;
}
