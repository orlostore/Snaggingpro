/**
 * Discipline definitions.
 * Order matters — it's the order tabs appear in a room and sections appear in the report.
 */

export const DISCIPLINES = [
  'civil',
  'electrical',
  'hvac',
  'plumbing',
  'mechanical',
  'automation',
  'landscaping',
  'fire',
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

export const DISC_LABELS: Record<Discipline, string> = {
  civil: 'Civil',
  electrical: 'Electrical',
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  mechanical: 'Mechanical',
  automation: 'Home Automation',
  landscaping: 'Landscaping',
  fire: 'Fire Alarm & Fire Fighting',
};

export const DISC_ICONS: Record<Discipline, string> = {
  civil: 'civil',
  electrical: 'electrical',
  hvac: 'hvac',
  plumbing: 'plumbing',
  mechanical: 'mechanical',
  automation: 'automation',
  landscaping: 'landscape',
  fire: 'fire',
};

/** Canonical visit order — guided flow uses this. */
export const DISCIPLINE_ORDER: Discipline[] = [
  'civil',
  'electrical',
  'hvac',
  'plumbing',
  'mechanical',
  'fire',
  'automation',
  'landscaping',
];

export function discLabel(d: Discipline, customLabels: Partial<Record<string, string>> = {}): string {
  return customLabels[d] ?? DISC_LABELS[d] ?? d;
}
