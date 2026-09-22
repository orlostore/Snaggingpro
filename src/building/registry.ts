/**
 * Building registers.
 *
 * Each register is the agreed list of inspectable areas for one building,
 * taken off the drawings. Refs here MUST match the refs bubbled onto the
 * colour-coded markup sheets in /plans — that correspondence is the whole
 * point: what the supervisor reads on paper is what he opens in the app.
 */

import type { AreaDef, BuildingDef, LevelDef } from './types';

const APT_POSITIONS = [
  'North-West',
  'North-East',
  'East-Upper',
  'East-Lower',
  'South-East',
  'South-West',
  'West-Lower',
  'West-Upper',
];

/** FCU tag prefix per floor, from the AC-16 load schedule. */
const FCU_PREFIX: Record<number, string> = { 1: 'F', 2: 'T', 3: 'T', 4: '4F' };

function apartments(n: number): AreaDef[] {
  const p = FCU_PREFIX[n] ?? 'T';
  const dwg = n === 1 ? 'A-103' : 'A-104';
  return APT_POSITIONS.map((pos, i) => {
    const k = i + 1;
    return {
      ref: `${n}0${k}`,
      label: `Apartment ${n}0${k}`,
      kind: 'apartment' as const,
      group: 'apartment' as const,
      bedrooms: 2,
      note: `${pos} · FCUs ${p}-${2 * k - 1} (LIV/KIT) + ${p}-${2 * k} (BR1+2)`,
      dwg,
    };
  });
}

function residentialCore(n: number): AreaDef[] {
  const dwg = n === 1 ? 'A-103' : 'A-104';
  const up = n === 4 ? 'R' : String(n + 1);
  const upLabel = n === 4 ? 'Roof' : `L${n + 1}`;
  return [
    { ref: `${n}-COR`, label: 'Corridor', kind: 'corridor', group: 'circulation', dwg, note: 'Three service doors open off it. Corridor FCU in the ceiling void' },
    { ref: `${n}-ELEC`, label: 'Electrical room', kind: 'elec_room', group: 'plant', dwg, note: '260 × 150 · floor DB and panels are snagged here' },
    { ref: `${n}-WM`, label: 'Water meter riser', kind: 'water_meter', group: 'plant', dwg, note: 'D07 cupboard' },
    { ref: `${n}-TEL`, label: 'Telecom riser', kind: 'telecom', group: 'plant', dwg, note: 'D07 cupboard' },
    { ref: `${n}-TV`, label: 'TV / satellite room', kind: 'tv_room', group: 'plant', dwg, note: '110 × 150 · MATV distribution' },
    { ref: `${n}-GARB`, label: 'Garbage room', kind: 'garbage_room', group: 'waste', dwg, note: '150 × 200 · landlord CWS washdown tap' },
    { ref: `${n}-CH`, label: 'Chute hopper', kind: 'chute_hopper', group: 'waste', dwg, note: 'Ø1.0 m chute' },
    { ref: `${n}-FF`, label: 'Fire fighting recess', kind: 'fire_recess', group: 'plant', dwg, note: 'Open recess — hose reel or landing valve (Q3)' },
    { ref: `${n}-SHAFT`, label: 'Services shaft', kind: 'services_shaft', group: 'plant', dwg, note: '210 × 90 void' },
    { ref: `STR1 ${n}→${up}`, label: `Stair 1 — L${n} to ${upLabel}`, kind: 'stair', group: 'circulation', dwg, note: `Flights, mid-landing, and the landing + fire door at L${n}` },
    { ref: `STR2 ${n}→${up}`, label: `Stair 2 — L${n} to ${upLabel}`, kind: 'stair', group: 'circulation', dwg },
    { ref: `LIFT1@${n}`, label: `Lift 1 landing — L${n}`, kind: 'lift_landing', group: 'circulation', dwg },
    { ref: `LIFT2@${n}`, label: `Lift 2 landing — L${n}`, kind: 'lift_landing', group: 'circulation', dwg },
    { ref: `FCU-COR@${n}`, label: 'Corridor FCU', kind: 'exhaust_fan', group: 'plant', dwg: 'AC-04', note: '7.30 kW ducted FCU serving COR + ELEC + TEL + TV' },
  ];
}

function residentialLevel(n: number): LevelDef {
  return {
    id: `L${n}`,
    label: `Level ${n}`,
    dwg: n === 1 ? 'A-103' : 'A-104',
    plan: n === 1 ? 'plans/L1.webp' : 'plans/TYP.webp',
    planNote:
      n === 1
        ? 'First floor plan A-103 — note the inaccessible roof on the east side'
        : `Typical floor plan A-104 — refs shown as 2xx, read as ${n}xx on this level`,
    areas: [...apartments(n), ...residentialCore(n)],
  };
}

export const CRYSTAL_FOUR: BuildingDef = {
  code: 'CF',
  name: 'Crystal Four',
  plot: '6453226',
  location: 'Wadi Al Safa 3, Dubai',
  developer: 'Crystal Four — FZ',
  consultant: 'Emirates Engineer',
  contractor: 'A.M.A.',
  levels: [
    {
      id: 'UG',
      label: 'Underground — −1.30',
      dwg: 'A-101 · WS-01',
      plan: 'plans/UG.webp',
      planNote: 'Underground floor plan A-101. Architectural gives −1.30; WS-01 says −1.50 (query Q2)',
      areas: [
        { ref: 'UG-TANK', label: 'U/G water tank', kind: 'water_tank', group: 'plant', dwg: 'A-101', note: '89 m³ · 47,800 imp gal — 10,300 domestic + 37,500 fire · two access manholes' },
        { ref: 'UG-ACDT', label: 'AC drain tank', kind: 'water_tank', group: 'plant', dwg: 'A-101', note: '4 m³ · own manhole · collects condensate from the whole building' },
        { ref: 'UG-PUMP', label: 'Pump room', kind: 'pump_room', group: 'plant', dwg: 'A-101', note: '645 × 400 · transfer pump set duty + standby · door ST1' },
        { ref: 'UG-SUMP', label: 'Sand trap & sump pit', kind: 'pump_room', group: 'plant', dwg: 'A-101', note: 'Two adjacent chambers at the stair end of the pump room' },
        { ref: 'UG-STR1', label: 'Stair 1 — access to underground', kind: 'stair', group: 'circulation', dwg: 'A-101', note: 'Stair-1 comes down into the pump room. Stair-2 does NOT reach this level' },
      ],
    },
    {
      id: 'G',
      label: 'Ground',
      dwg: 'A-102',
      plan: 'plans/G.webp',
      planNote: 'Ground floor plan A-102',
      areas: [
        { ref: 'G-ENT', label: 'Entrance', kind: 'entrance', group: 'circulation', dwg: 'A-102', note: 'AC unit G-1, 10.59 kW (shared with CCTV)' },
        { ref: 'G-ARC', label: 'Arcade', kind: 'arcade', group: 'circulation', dwg: 'A-102', note: '4 m arcade to road frontage' },
        { ref: 'G-COR', label: 'Corridor', kind: 'corridor', group: 'circulation', dwg: 'A-102' },
        { ref: 'G-LOB', label: 'Lift lobby', kind: 'lobby', group: 'circulation', dwg: 'A-102' },
        { ref: 'STR1 G→1', label: 'Stair 1 — G to L1', kind: 'stair', group: 'circulation', dwg: 'A-102' },
        { ref: 'STR2 G→1', label: 'Stair 2 — G to L1', kind: 'stair', group: 'circulation', dwg: 'A-102' },
        { ref: 'LIFT1@G', label: 'Lift 1 landing — ground', kind: 'lift_landing', group: 'circulation', dwg: 'A-102' },
        { ref: 'LIFT2@G', label: 'Lift 2 landing — ground', kind: 'lift_landing', group: 'circulation', dwg: 'A-102' },
        { ref: 'G-PARK-A', label: 'Parking — bays 14–22', kind: 'parking', group: 'parking', dwg: 'A-102', note: '9 bays' },
        { ref: 'G-PARK-B', label: 'Parking — bays 1–13', kind: 'parking', group: 'parking', dwg: 'A-102', note: '13 bays' },
        { ref: 'G-PARK-C', label: 'Parking — bays 23–30', kind: 'parking', group: 'parking', dwg: 'A-102', note: '8 bays' },
        { ref: 'G-PARK-D', label: 'Parking — bays 31–32', kind: 'parking', group: 'parking', dwg: 'A-102', note: '2 bays · 32 total, one per apartment' },
        { ref: 'G-DRIVE', label: 'Driveway & ramp', kind: 'driveway', group: 'parking', dwg: 'A-102', note: '3% slope, car entry/exit, bib taps' },
        { ref: 'G-SUB', label: 'Sub-station', kind: 'substation', group: 'plant', dwg: 'A-102' },
        { ref: 'G-LV', label: 'LV room', kind: 'lv_room', group: 'plant', dwg: 'A-102', note: 'AC unit G-3, 6.40 kW' },
        { ref: 'G-TEL', label: 'Telecom room', kind: 'telecom', group: 'plant', dwg: 'A-102', note: 'AC unit G-2, 4.70 kW' },
        { ref: 'G-CCTV', label: 'CCTV room', kind: 'cctv', group: 'plant', dwg: 'A-102', note: 'Shares AC unit G-1 with the entrance' },
        { ref: 'G-GAS', label: 'Gas room', kind: 'gas_room', group: 'plant', dwg: 'A-102', note: 'Single-shutter louvered door' },
        { ref: 'G-GARB', label: 'Garbage room', kind: 'garbage_room', group: 'waste', dwg: 'A-102', note: 'Chute discharges over two containers · AC unit G-4 · AL2 louvered door' },
        { ref: 'G-CH', label: 'Chute discharge', kind: 'chute_shaft', group: 'waste', dwg: 'A-102', note: 'Bottom discharge, fire damper, washdown' },
        { ref: 'G-BIN', label: 'Containers area', kind: 'bulk_waste', group: 'waste', dwg: 'A-102', note: '5.2 m²' },
        { ref: 'G-WASTE', label: 'Bulk waste room', kind: 'bulk_waste', group: 'waste', dwg: 'A-102', note: 'AL8 louvered door' },
        { ref: 'G-YARD', label: 'Store yard', kind: 'store', group: 'waste', dwg: 'A-102', note: 'Open to sky. Landscaping and irrigation are OUT of scope' },
      ],
    },
    residentialLevel(1),
    residentialLevel(2),
    residentialLevel(3),
    residentialLevel(4),
    {
      id: 'R',
      label: 'Roof — amenity deck',
      dwg: 'A-105 · AC-05 · AC-11',
      plan: 'plans/R.webp',
      planNote: 'Roof plan A-105 — the condenser farm and FAHU-1 sit on this slab',
      areas: [
        { ref: 'R-POOL', label: 'Swimming pool', kind: 'pool', group: 'amenity', dwg: 'A-105' },
        { ref: 'R-KPOOL', label: 'Kids pool', kind: 'pool', group: 'amenity', dwg: 'A-105', note: 'FFL +20.25' },
        { ref: 'R-DECK', label: 'Pool deck', kind: 'pool_deck', group: 'amenity', dwg: 'A-105' },
        { ref: 'R-WC1', label: 'Toilet 1 (accessible)', kind: 'wc', group: 'amenity', dwg: 'A-105' },
        { ref: 'R-WC2', label: 'Toilet 2', kind: 'wc', group: 'amenity', dwg: 'A-105' },
        { ref: 'R-WC3', label: 'Toilet 3', kind: 'wc', group: 'amenity', dwg: 'A-105' },
        { ref: 'R-WC4', label: 'Toilet 4 (accessible)', kind: 'wc', group: 'amenity', dwg: 'A-105' },
        { ref: 'R-COR', label: 'Amenity corridor', kind: 'corridor', group: 'circulation', dwg: 'A-105', note: 'Strip west of the toilet block — the accessible WC, second WC and changing room open onto it' },
        { ref: 'R-CHG', label: 'Changing room', kind: 'changing', group: 'amenity', dwg: 'A-105' },
        { ref: 'R-SHWR', label: 'Shower', kind: 'changing', group: 'amenity', dwg: 'A-105' },
        { ref: 'R-PPLANT', label: 'Pool pump room', kind: 'pool_plant', group: 'plant', dwg: 'A-105', note: 'AC unit R-3, 3.40 kW' },
        { ref: 'R-GYM', label: 'Gym', kind: 'gym', group: 'amenity', dwg: 'A-105', note: 'AC unit R-1, 23.60 kW (with store)' },
        { ref: 'R-FLIFT', label: 'Future lift shaft', kind: 'lift_shaft', group: 'circulation', dwg: 'A-105', note: 'Provision only — check sealed, guarded and drained' },
        { ref: 'STR1@R', label: 'Stair 1 head', kind: 'stair', group: 'circulation', dwg: 'A-105', note: 'Continues up to the lift machine level' },
        { ref: 'STR2@R', label: 'Stair 2 head', kind: 'stair', group: 'circulation', dwg: 'A-105', note: 'Terminates at roof' },
        { ref: 'R-ELEC', label: 'Electrical room', kind: 'elec_room', group: 'plant', dwg: 'A-105', note: 'AC unit R-2, 4.10 kW (with lift lobby)' },
        { ref: 'R-STORE', label: 'Store', kind: 'store', group: 'waste', dwg: 'A-105' },
        { ref: 'R-WATCH', label: 'Watchman room', kind: 'watchman', group: 'amenity', dwg: 'A-105', note: 'AC unit R-4, 1.30 kW · kitchenette + WC' },
        { ref: 'R-PERG', label: 'Aluminium pergola', kind: 'pergola', group: 'amenity', dwg: 'A-105', note: 'Design by specialist' },
        { ref: 'LIFT1@R', label: 'Lift 1 landing — roof', kind: 'lift_landing', group: 'circulation', dwg: 'A-105' },
        { ref: 'LIFT2@R', label: 'Lift 2 landing — roof', kind: 'lift_landing', group: 'circulation', dwg: 'A-105' },
        { ref: 'R-WP', label: 'Roof slab', kind: 'roof_slab', group: 'plant', dwg: 'A-105 · AC-05', note: 'Largest single inspection — waterproofing PLUS every condenser plinth, FAHU base and membrane penetration' },
      ],
    },
    {
      id: 'LM',
      label: 'Lift machine level — +22.90',
      dwg: 'A-106 · WS-08',
      areas: [
        { ref: 'LM-LMR', label: 'Lift machine room', kind: 'lift_machine', group: 'plant', dwg: 'A-106', note: 'Shared by both lifts · AC unit R-5, 5.40 kW — test it' },
        { ref: 'LM-STR1', label: 'Stair 1 head', kind: 'stair', group: 'circulation', dwg: 'A-106', note: 'Only Stair-1 reaches this level' },
        { ref: 'LM-TANK', label: 'GRP overhead water tanks', kind: 'water_tank', group: 'plant', dwg: 'WS-08', note: '2 × 3,000 imp gal, each 4.0 × 3.0 × 1.5 m' },
        { ref: 'LM-BOOST', label: 'Booster pump set', kind: 'booster', group: 'plant', dwg: 'WS-08', note: 'Duty + standby' },
      ],
    },
    {
      id: 'LIFTS',
      label: 'Lifts',
      dwg: 'A-106 · Lift specialist',
      planNote: 'Both lifts in one place — pick a lift, then the part of it you are standing at. Landing doors are snagged per floor with that floor, as LIFT1@2, LIFT2@2 and so on. The machine room is shared by both lifts and is snagged once, on the lift machine level, as LM-LMR.',
      areas: [
        { ref: 'LIFT1-CAR', label: 'Car', kind: 'lift_car', group: 'circulation', sub: 'Lift 1',
          note: 'Interior, ceiling, lighting, handrail, mirror, flooring, COP, emergency comms, alarm, ventilation, ride quality, door timing' },
        { ref: 'LIFT1-SHAFT', label: 'Shaft', kind: 'lift_shaft', group: 'circulation', sub: 'Lift 1',
          note: 'Guide rails, counterweight, travelling cable, buffers, limit switches, shaft lighting' },
        { ref: 'LIFT1-PIT', label: 'Pit', kind: 'lift_pit', group: 'circulation', sub: 'Lift 1',
          note: 'Below the ground slab — water ingress is the classic defect. Buffer, ladder, stop switch, lighting' },
        { ref: 'LIFT1-COMM', label: 'Commissioning checks', kind: 'lift_commissioning', group: 'circulation', sub: 'Lift 1',
          dwg: 'Contractor checklist', note: 'Contractor commissioning sheet — controller, motor/inverter, car and shaft. Needs the lift engineer with a multimeter and the PC tool' },
        { ref: 'LIFT2-CAR', label: 'Car', kind: 'lift_car', group: 'circulation', sub: 'Lift 2', note: 'As Lift 1' },
        { ref: 'LIFT2-SHAFT', label: 'Shaft', kind: 'lift_shaft', group: 'circulation', sub: 'Lift 2', note: 'As Lift 1' },
        { ref: 'LIFT2-PIT', label: 'Pit', kind: 'lift_pit', group: 'circulation', sub: 'Lift 2', note: 'As Lift 1' },
        { ref: 'LIFT2-COMM', label: 'Commissioning checks', kind: 'lift_commissioning', group: 'circulation', sub: 'Lift 2',
          dwg: 'Contractor checklist', note: 'As Lift 1' },
      ],
    },
    {
      id: 'SYS',
      label: 'Building systems',
      dwg: 'Multiple',
      planNote: 'Not level-bound — these are inspected once for the whole building',
      areas: [
        { ref: 'CHUTE-SHAFT', label: 'Garbage chute shaft', kind: 'chute_shaft', group: 'system', note: 'Ø1.0 m, full height L1 to ground' },
        { ref: 'FAHU-1', label: 'Fresh air handling unit', kind: 'fahu', group: 'system', dwg: 'AC-11 · AC-16', note: 'Roof, in the open. 140 kW, 4,180 L/s, 380/3/50' },
        { ref: 'EF-1', label: 'Exhaust fan & riser', kind: 'exhaust_fan', group: 'system', dwg: 'AC-15', note: '15 L/s per WC branch · includes MSFD and FD fire dampers' },
        { ref: 'R-COND-A', label: 'Condenser bank A', kind: 'condenser_bank', group: 'system', dwg: 'AC-05' },
        { ref: 'R-COND-B', label: 'Condenser bank B', kind: 'condenser_bank', group: 'system', dwg: 'AC-05' },
        { ref: 'R-COND-C', label: 'Condenser bank C', kind: 'condenser_bank', group: 'system', dwg: 'AC-05' },
        { ref: 'R-COND-D', label: 'Condenser bank D', kind: 'condenser_bank', group: 'system', dwg: 'AC-05', note: '~65–70 units across the four banks, untagged on the drawings (Q6)' },
        { ref: 'BLD-FAC', label: 'Facade', kind: 'facade', group: 'system', dwg: 'Elevations', note: 'Finish reference 1–7, all SRI ≥ 29' },
        { ref: 'BLD-FIRE', label: 'Fire alarm & fire fighting', kind: 'fire_systems', group: 'system', note: 'Specialist FA/FF engineer — 1 week. Technical inspection only — final approval rests with Dubai Civil Defence' },
        { ref: 'BLD-CCTV', label: 'CCTV system', kind: 'cctv_system', group: 'system', note: 'Head end in G-CCTV. Technical inspection only — NOT checked against SiRA requirements' },
        { ref: 'BLD-INT', label: 'Intercom system', kind: 'intercom', group: 'system', note: 'Entrance panel, apartment handsets, door release' },
        { ref: 'BLD-DRAIN', label: 'Drainage stacks & vents', kind: 'drainage', group: 'system', dwg: 'Drainage riser' },
        { ref: 'BLD-WS', label: 'Water supply risers', kind: 'water_risers', group: 'system', dwg: 'WS-08', note: 'No calorifier — hot water is by EWH in each apartment' },
      ],
    },
  ],
};

export const BUILDINGS: BuildingDef[] = [CRYSTAL_FOUR];

export function buildingByCode(code: string): BuildingDef | undefined {
  return BUILDINGS.find((b) => b.code === code);
}
