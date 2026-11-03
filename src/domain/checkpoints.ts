import { CHECKLISTS } from './checklists';
import { DISCIPLINE_ORDER, DISC_LABELS, type Discipline } from './disciplines';
import { buildRooms, type BuildRoomsInput } from './rooms';
import { isVillaLike } from './pricing';

export interface CheckpointEstimate {
  points: number;
  areas: number;
  systems: string[];
}

export function estimateCheckpoints(input: BuildRoomsInput): CheckpointEstimate {
  const rooms = buildRooms(input);
  const used = new Set<Discipline>();
  let points = 0;
  for (const room of rooms) {
    const cl = CHECKLISTS[room.clKey];
    for (const disc of room.discs) {
      const items = cl[disc]?.length ?? 0;
      if (items > 0) used.add(disc);
      points += items;
    }
  }
  return {
    points,
    areas: rooms.length,
    systems: DISCIPLINE_ORDER.filter((d) => used.has(d)).map((d) => DISC_LABELS[d]),
  };
}

/** Rounded down so the quote reads "300+" rather than "343". */
export function roundCheckpoints(points: number): number {
  const step = points >= 200 ? 50 : 10;
  return Math.floor(points / step) * step;
}

export function checkpointsSentence(input: BuildRoomsInput): string {
  const villa = isVillaLike(input.propType);
  const maid = villa || (input.bedrooms > 0 && input.maidRoom === true);
  const { points, areas } = estimateCheckpoints(input);
  const property =
    input.bedrooms === 0
      ? 'a studio apartment'
      : `a ${input.bedrooms}-bedroom ${villa ? 'villa / townhouse' : 'apartment'}`;
  return (
    `On average, ${property}${maid ? " plus maid's room" : ''} has ` +
    `${roundCheckpoints(points)}+ checking points, depending on the systems available` +
    `${maid ? " and the availability of a maid's room" : ''}. ` +
    `All checks are segmented into ${areas} sections. ` +
    `The sections and systems are subject to availability in the ${villa ? 'property' : 'apartment'}.`
  );
}
