import { statsForRoom } from './snags';
import type { State } from '@/state/schema';

export interface InspectionProgress {
  pct: number;
  roomsDone: number;
  roomsTotal: number;
  issues: number;
}

export function inspectionProgress(state: State): InspectionProgress {
  let items = 0;
  let inspected = 0;
  let roomsDone = 0;
  let roomsTotal = 0;
  let issues = 0;
  for (const id of state.roomOrder) {
    const room = state.rooms[id];
    if (!room || room.excluded) continue;
    const st = statsForRoom(room);
    roomsTotal++;
    items += st.total;
    inspected += st.inspected;
    issues += st.issue;
    if (st.total > 0 && st.pending === 0) roomsDone++;
  }
  return { pct: items ? Math.round((inspected / items) * 100) : 0, roomsDone, roomsTotal, issues };
}
