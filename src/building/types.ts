/**
 * Building-wide inspection model.
 *
 * A building job is not one giant report. It is a register of AREAS, each of
 * which is snagged as an ordinary report and saved to the library under its
 * own ref. This module only describes the register; the inspection itself
 * still runs through the existing state/room/report code.
 */

import type { Discipline } from '@/domain/disciplines';

/** What kind of space an area is — drives which checklist it gets. */
export type AreaKind =
  | 'apartment'
  | 'corridor'
  | 'lobby'
  | 'entrance'
  | 'arcade'
  | 'stair'
  | 'lift_landing'
  | 'lift_car'
  | 'lift_shaft'
  | 'lift_pit'
  | 'lift_machine'
  | 'elec_room'
  | 'telecom'
  | 'tv_room'
  | 'water_meter'
  | 'garbage_room'
  | 'chute_hopper'
  | 'chute_shaft'
  | 'fire_recess'
  | 'services_shaft'
  | 'pump_room'
  | 'water_tank'
  | 'booster'
  | 'substation'
  | 'lv_room'
  | 'cctv'
  | 'cctv_system'
  | 'intercom'
  | 'gas_room'
  | 'parking'
  | 'driveway'
  | 'store'
  | 'bulk_waste'
  | 'pool'
  | 'pool_deck'
  | 'pool_plant'
  | 'gym'
  | 'changing'
  | 'wc'
  | 'watchman'
  | 'pergola'
  | 'roof_slab'
  | 'facade'
  | 'fire_systems'
  | 'fahu'
  | 'exhaust_fan'
  | 'condenser_bank'
  | 'drainage'
  | 'water_risers';

/** Broad grouping — matches the colours on the marked-up plan sheets. */
export type AreaGroup = 'apartment' | 'circulation' | 'plant' | 'amenity' | 'waste' | 'parking' | 'system';

export interface AreaDef {
  /** The ref written on the drawing, e.g. "201" or "2-GARB". */
  ref: string;
  label: string;
  kind: AreaKind;
  group: AreaGroup;
  /** Bedrooms — apartments only. */
  bedrooms?: number;
  /** Free note shown under the area in the list. */
  note?: string;
  /** Source drawing, shown so the supervisor can cross-check on paper. */
  dwg?: string;
}

export interface LevelDef {
  /** Short code used in refs and routes, e.g. "L2". */
  id: string;
  label: string;
  /** Sheet(s) this level is drawn on. */
  dwg?: string;
  /** Colour-coded markup sheet for this level, served from /plans. */
  plan?: string;
  /** Caption under the plan. */
  planNote?: string;
  areas: AreaDef[];
}

export interface BuildingDef {
  /** Short code that ties every area report together, e.g. "CF". */
  code: string;
  name: string;
  plot?: string;
  location?: string;
  developer?: string;
  consultant?: string;
  contractor?: string;
  levels: LevelDef[];
}

export interface AreaChecklist {
  /** Which disciplines apply, in tab order. */
  discs: Discipline[];
  /** Items per discipline. */
  items: Partial<Record<Discipline, string[]>>;
  /** Icon name from the existing Icon component. */
  icon: string;
}

export const GROUP_LABELS: Record<AreaGroup, string> = {
  apartment: 'Apartment',
  circulation: 'Circulation',
  plant: 'Plant & services',
  amenity: 'Amenity',
  waste: 'Waste',
  parking: 'Parking',
  system: 'Building system',
};

/** Total inspectable areas in a building definition. */
export function areaCount(b: BuildingDef): number {
  return b.levels.reduce((n, l) => n + l.areas.length, 0);
}

/** Find an area anywhere in the building by its ref. */
export function findArea(b: BuildingDef, ref: string): { level: LevelDef; area: AreaDef } | null {
  for (const level of b.levels) {
    for (const area of level.areas) {
      if (area.ref === ref) return { level, area };
    }
  }
  return null;
}
