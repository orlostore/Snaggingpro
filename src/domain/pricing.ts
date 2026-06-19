/**
 * Property types and inspection pricing — modelled on the v0 fee schedule.
 *
 * Villa and Townhouse share one category (same prep, same MEP rooms, same fee).
 * Apartment fee scales by bedrooms; Villa/TH fee scales by bedrooms too.
 * The Setup screen auto-fills the fee from this table when both prop type and
 * bedrooms are selected, but the field stays editable for one-off overrides.
 */

export type PropType = 'apartment' | 'villa';

export interface PropOption {
  id: PropType;
  bedrooms: number;
  label: string;
  icon: string;
  fee: number;
}

/** The 9 buttons shown on the Setup screen — one per (type, bedrooms) combo. */
export const PROP_OPTIONS: readonly PropOption[] = [
  { id: 'apartment', bedrooms: 0, label: 'Studio Apt', icon: '🏢', fee: 1000 },
  { id: 'apartment', bedrooms: 1, label: '1 BR Apartment', icon: '🏢', fee: 1000 },
  { id: 'apartment', bedrooms: 2, label: '2 BR Apartment', icon: '🏢', fee: 1500 },
  { id: 'apartment', bedrooms: 3, label: '3 BR Apartment', icon: '🏢', fee: 1700 },
  { id: 'apartment', bedrooms: 4, label: '4 BR Apartment', icon: '🏢', fee: 1900 },
  { id: 'villa', bedrooms: 3, label: 'Villa / TH 3BR', icon: '🏡', fee: 2500 },
  { id: 'villa', bedrooms: 4, label: 'Villa / TH 4BR', icon: '🏡', fee: 2800 },
  { id: 'villa', bedrooms: 5, label: 'Villa / TH 5BR', icon: '🏡', fee: 3400 },
  { id: 'villa', bedrooms: 6, label: 'Villa / TH 6BR', icon: '🏡', fee: 3625 },
];

/** Label per type for the report cover and dashboard meta. */
export const PROP_LABEL: Record<PropType, string> = {
  apartment: 'Apartment',
  villa: 'Villa / Townhouse',
};

export function isVillaLike(t: PropType): boolean {
  return t === 'villa';
}

/** Look up the fee for a (type, bedrooms) combo. Returns 0 if not in the table. */
export function feeFor(type: PropType, bedrooms: number): number {
  return PROP_OPTIONS.find((o) => o.id === type && o.bedrooms === bedrooms)?.fee ?? 0;
}

export const FOLLOWUP_FEE = 2000;
