/**
 * State persistence.
 * Writes the current draft state to localStorage (small footprint — photos are
 * blobs in IndexedDB). Debounced so rapid edits don't thrash the disk.
 */

import { StateZ, type State } from './schema';
import { migrate } from './migrations';
import { debounce } from '@/lib/debounce';

const DRAFT_KEY = 'snaggingpro_draft_v1';
const LEGACY_KEY = 'snaggingpro_session';
const LEGACY_BACKUP_KEY = 'snaggingpro_v0_backup';

export function saveDraft(state: State): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('saveDraft failed', err);
  }
}

export const saveDraftDebounced = debounce(saveDraft, 250);

export function loadDraft(): State | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = StateZ.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = migrate(JSON.parse(legacy));
      if (migrated) {
        localStorage.setItem(LEGACY_BACKUP_KEY, legacy);
        localStorage.removeItem(LEGACY_KEY);
        saveDraft(migrated);
        return migrated;
      }
    }
  } catch (err) {
    console.warn('loadDraft failed', err);
  }
  return null;
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.warn('clearDraft failed', err);
  }
}
