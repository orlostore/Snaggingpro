/**
 * Property types and inspection pricing — modelled on the v0 fee schedule.
 *
 * Equation:
 *   fee = base + max(0, BUA - baseArea) * OVERAGE_RATE
 *
 * `base` is the headline price; `baseArea` is the included BUA threshold;
 * every square foot above the threshold adds AED 1 to the fee.
 *
 * Villa and Townhouse share one category (same prep, same MEP rooms, same fee).
 */

export type PropType = 'apartment' | 'villa';

/** AED per square foot above each option's baseArea. */
export const OVERAGE_RATE = 1;

export interface PropOption {
  id: PropType;
  bedrooms: number;
  label: string;
  icon: string;
  base: number;
  baseArea: number;
}

export const PROP_OPTIONS: readonly PropOption[] = [
  { id: 'apartment', bedrooms: 0, label: 'Studio Apt', icon: '🏢', base: 1000, baseArea: 1000 },
  { id: 'apartment', bedrooms: 1, label: '1 BR Apartment', icon: '🏢', base: 1000, baseArea: 1000 },
  { id: 'apartment', bedrooms: 2, label: '2 BR Apartment', icon: '🏢', base: 1500, baseArea: 1500 },
  { id: 'apartment', bedrooms: 3, label: '3 BR Apartment', icon: '🏢', base: 1700, baseArea: 1700 },
  { id: 'apartment', bedrooms: 4, label: '4 BR Apartment', icon: '🏢', base: 1900, baseArea: 1900 },
  { id: 'villa', bedrooms: 3, label: 'Villa / TH 3BR', icon: '🏡', base: 2500, baseArea: 2200 },
  { id: 'villa', bedrooms: 4, label: 'Villa / TH 4BR', icon: '🏡', base: 2800, baseArea: 2400 },
  { id: 'villa', bedrooms: 5, label: 'Villa / TH 5BR', icon: '🏡', base: 3400, baseArea: 3000 },
  { id: 'villa', bedrooms: 6, label: 'Villa / TH 6BR', icon: '🏡', base: 3625, baseArea: 3250 },
];

export const PROP_LABEL: Record<PropType, string> = {
  apartment: 'Apartment',
  villa: 'Villa / Townhouse',
};

export function isVillaLike(t: PropType): boolean {
  return t === 'villa';
}

export function optionFor(type: PropType, bedrooms: number): PropOption | undefined {
  return PROP_OPTIONS.find((o) => o.id === type && o.bedrooms === bedrooms);
}

/** v0 equation: base + max(0, bua - baseArea) * OVERAGE_RATE. */
export function calcFee(type: PropType, bedrooms: number, bua: number): number {
  const opt = optionFor(type, bedrooms);
  if (!opt) return 0;
  const overage = Math.max(0, bua - opt.baseArea) * OVERAGE_RATE;
  return opt.base + overage;
}

export interface FeeBreakdown {
  base: number;
  overage: number;
  total: number;
  baseArea: number;
  overageSqft: number;
}

export function feeBreakdown(type: PropType, bedrooms: number, bua: number): FeeBreakdown | null {
  const opt = optionFor(type, bedrooms);
  if (!opt) return null;
  const overageSqft = Math.max(0, bua - opt.baseArea);
  const overage = overageSqft * OVERAGE_RATE;
  return {
    base: opt.base,
    overage,
    total: opt.base + overage,
    baseArea: opt.baseArea,
    overageSqft,
  };
}

export const FOLLOWUP_FEE = 2000;
