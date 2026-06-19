/**
 * Handover Documents page — R9.
 * Three sections of checkboxes shown on a dedicated PDF page after Scope & Disclaimer.
 */

export interface HandoverSection {
  id: string;
  title: string;
  items: string[];
}

export const HANDOVER_SECTIONS: HandoverSection[] = [
  {
    id: 'warranties',
    title: 'Warranties & Guarantees',
    items: [
      'DLP (Defects Liability Period) certificate',
      'Waterproofing warranty — 10 years',
      'Structural warranty — 10 years',
      'MEP installation warranties',
      'Manufacturer warranties — appliances and fixtures',
      'Solar water heater warranty',
      'Booster pump warranty',
      'Smart home / home automation warranty',
    ],
  },
  {
    id: 'manuals',
    title: 'Operation & Maintenance Manuals',
    items: [
      'HVAC system O&M manual',
      'Booster pump O&M manual',
      'Water heater O&M manual',
      'Solar water heater O&M manual',
      'Built-in kitchen appliances O&M manuals',
      'Smart home / automation O&M manual',
      'Pool and landscape equipment O&M manuals',
    ],
  },
  {
    id: 'documents',
    title: 'Other Important Documents',
    items: [
      'As-built drawings (architectural and MEP)',
      'Civil Defence completion certificate',
      'Building / project completion certificate',
      'DEWA / SEWA / FEWA connection certificates',
      'Title deed / Oqood',
    ],
  },
];

export const HANDOVER_FOOTNOTE =
  'SnaggingPro recommends retaining copies of all the above documents for the life of the property. Lost warranties cannot be re-issued.';
