/**
 * Auto-save of the Setup screen form fields.
 *
 * The inspection State is only persisted once the user taps "Continue" on
 * Setup (it needs a job ref allocated). Before that, the Setup form values
 * live only in a closure on the screen — close the tab and the form is
 * gone. This module saves the intermediate values to localStorage on every
 * keystroke so a refresh / app close doesn't wipe a half-filled form.
 *
 * Cleared automatically when the Setup hands off to the inspection flow.
 */

const KEY = 'sp_setup_draft_v1';

export interface SetupDraftPersisted {
  optionKey: string | null;
  type: 'apartment' | 'villa' | null;
  bedrooms: number;
  clientName: string;
  phone: string;
  email: string;
  developer: string;
  community: string;
  unit: string;
  floor: string;
  bua: number;
  price: number;
  priceManuallyEdited: boolean;
}

export function saveSetupDraft(draft: SetupDraftPersisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* quota / unavailable — best effort */
  }
}

export function loadSetupDraft(): SetupDraftPersisted | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SetupDraftPersisted;
  } catch {
    return null;
  }
}

export function clearSetupDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
