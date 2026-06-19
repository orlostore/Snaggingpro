/**
 * Property types and inspection pricing.
 * Single source of truth — UI reads from here, report reads from here.
 */

export const PROP_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: '🏢', basePrice: 2500 },
  { id: 'townhouse', label: 'Townhouse', icon: '🏘', basePrice: 3000 },
  { id: 'villa', label: 'Villa', icon: '🏡', basePrice: 3355 },
  { id: 'penthouse', label: 'Penthouse', icon: '🏙', basePrice: 3500 },
] as const;

export type PropType = (typeof PROP_TYPES)[number]['id'];

export const PROP_LABEL: Record<PropType, string> = PROP_TYPES.reduce(
  (acc, p) => ({ ...acc, [p.id]: p.label }),
  {} as Record<PropType, string>,
);

/** Property classes that get villa-only rooms (booster pump, water tanks, solar). */
export const VILLA_LIKE: PropType[] = ['villa', 'townhouse'];

export function isVillaLike(t: PropType): boolean {
  return VILLA_LIKE.includes(t);
}

export const FOLLOWUP_FEE = 2000;
