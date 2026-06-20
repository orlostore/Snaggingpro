/**
 * Walk a State and return every photoId it references (cover, snag,
 * annotated, and follow-up rectification photos).
 */

import type { State } from './schema';

export function photoIdsInState(state: State): string[] {
  const out = new Set<string>();
  for (const id of state.coverPhotoIds) {
    if (id) out.add(id);
  }
  for (const room of Object.values(state.rooms)) {
    for (const item of Object.values(room.items)) {
      for (const obs of item.observations) {
        for (const pid of obs.photoIds) out.add(pid);
        for (const pid of obs.rectification?.photoIds ?? []) out.add(pid);
      }
    }
  }
  return [...out];
}
