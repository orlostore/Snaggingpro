/**
 * Room inspection checklists.
 * Per-room type, per-discipline list of items the inspector walks through.
 * Source of truth — UI and report both read from here.
 */

import type { Discipline } from './disciplines';

export type ChecklistKey =
  | 'kitchen'
  | 'living'
  | 'bedroom'
  | 'bathroom'
  | 'balcony'
  | 'db'
  | 'homeAutomation'
  | 'externalFacade'
  | 'garage'
  | 'landscaping'
  | 'staircase'
  | 'maidRoom'
  | 'roofTerrace'
  | 'utilityRoom'
  | 'boosterPumpRoom'
  | 'waterTankGround'
  | 'waterTankRoof'
  | 'solarWaterHeater';

export type Checklist = Partial<Record<Discipline, readonly string[]>>;

export const CHECKLISTS: Record<ChecklistKey, Checklist> = {
  kitchen: {
    civil: [
      'Walls — cracks, paint, finish',
      'Ceiling — cracks, paint, level',
      'Floor coverings — tiles level, no lippage, no hollow',
      'Counter tops — no cracks, chips, stains',
      'Cabinets — aligned, hinges, soft-close',
      'Doors — alignment, smooth operation',
      'Door ironmongery and keys — handles, locks, closers',
      'Windows — alignment, sealing, locks operational',
      'Fly screens — present, intact',
      'Laundry area — finished, if applicable',
      'Floor slopes and water test — fall to drain',
      'Skirting boards — fixed and sealed',
      'Grout and tile joints — uniform, no cracks',
    ],
    electrical: [
      'Light fittings — operational and secure',
      'Light switches — functional',
      'Other switches — functional',
      'Power points / sockets — tested, polarity correct',
      'Kitchen hood — operational',
      'Extract fan — airflow adequate',
      'Water heater switch — functional',
      'Built-in appliances — operational if provided',
    ],
    hvac: [
      'AC vents / grilles — condition and secure',
      'Extract vents / grilles — operational and clean',
      'AC cooling performance — adequate',
      'Thermostat — responsive and accurate',
      'AC unit — no visible damage',
      'AC grill temperature differential — adequate',
      'Condensate drain line — connected, no blockage',
      'No unusual noise or vibration from AC',
    ],
    plumbing: [
      'Washing machine drain — present and clear',
      'Dishwasher drain — present and clear',
      'Floor drains and covers — present and clear',
      'Water taps — hot and cold operational',
      'Sink — sealed, no cracks, secure',
      'Sink drain — free-flowing',
      'Under-sink pipework — no leaks at joints',
      'Hot and cold water correctly connected',
      'Water pressure — adequate',
    ],
  },

  living: {
    civil: [
      'Walls — cracks, paint, finish',
      'Ceiling — cracks, paint, level',
      'Floor coverings — tiles level, no lippage',
      'Doors — alignment, smooth operation',
      'Door ironmongery and keys',
      'Windows — alignment, sealing, locks',
      'Fly screens — present, intact',
      'Skirting boards — fixed and sealed',
      'Paint finish — uniform, no patches',
    ],
    electrical: [
      'Light fittings — operational and secure',
      'Light switches — functional',
      'Power points / sockets — tested, polarity correct',
      'TV and data points — present and functional',
      'Intercom / video doorbell — operational',
    ],
    hvac: [
      'AC vents / grilles — condition and secure',
      'AC cooling performance — adequate',
      'Thermostat — responsive',
      'AC unit — no visible damage',
      'AC vent temperature — adequate',
      'Condensate drain line — connected, no blockage',
      'No unusual noise or vibration',
    ],
  },

  bedroom: {
    civil: [
      'Walls — cracks, paint, finish',
      'Ceiling — cracks, paint, level',
      'Floor coverings — level, no damage',
      'Wardrobes / built-in storage — aligned, hinges',
      'Doors — alignment, smooth operation',
      'Door ironmongery and keys — handles, locks',
      'Windows — alignment, sealing, locks',
      'Fly screens — present, intact',
      'Skirting boards — fixed and sealed',
      'Paint finish — uniform, no patches',
    ],
    electrical: [
      'Light fittings — operational and secure',
      'Light switches — functional',
      'Power points / sockets — tested, polarity correct',
      'TV and data points — present and functional',
      'Intercom — if applicable',
    ],
    hvac: [
      'AC vents / grilles — condition and secure',
      'AC cooling performance — adequate',
      'Thermostat — responsive',
      'AC unit — no visible damage',
      'AC vent temperature — adequate',
      'Condensate drain line — connected, no blockage',
      'No unusual noise or vibration',
    ],
  },

  bathroom: {
    civil: [
      'Walls — tiles aligned, grout uniform, no cracks',
      'Ceiling — paint, no damp, no cracks',
      'Floor coverings — tiles level, no lippage, no hollow',
      'Counter top — no cracks, chips, stains',
      'Vanity cabinet — aligned, hinges functional',
      'Mirror — secure, no cracks',
      'Bath tub — no cracks, chips, sealed (if any)',
      'Shower tray — no cracks, slopes to drain (if any)',
      'Wash basin — secure, sealed, no cracks',
      'WC / toilet — secure, no cracks',
      'Doors — alignment, smooth operation',
      'Door ironmongery and keys',
      'Windows — alignment, sealing (if any)',
      'Floor slopes and water test — drains correctly',
      'Tile alignment and grout — uniform, no missing',
      'Silicone sealing — complete and neat',
      'Shower glass / screen — stable, sealed, no chips',
    ],
    electrical: [
      'Light fittings — operational and secure',
      'Light switches — functional',
      'Water heater switch — functional',
      'Power points / sockets — appropriate type',
      'Extract fan — operational, adequate airflow',
      'Water heater — operational, no leaks',
    ],
    hvac: [
      'Extract vents / grilles — clean and operational',
      'AC — operational (if any)',
      'Thermostat — functional (if any)',
    ],
    plumbing: [
      'Tray / tub drain — clear and free-flowing',
      'Wash basin drain — clear and free-flowing',
      'Floor drains and covers — present and clear',
      'Water taps — hot and cold operational',
      'Toilet flushing — full and half flush working',
      'Bidet / shut-off valve — operational',
      'Hot and cold water correctly connected',
      'No leaks at fittings or joints',
      'Shower mixer — operational, temperature control',
      'Water pressure — adequate',
      'Overhead and hand shower — operational (if any)',
    ],
  },

  balcony: {
    civil: [
      'Walls / parapet — cracks, paint, finish',
      'Ceiling / soffit — paint, no damp',
      'Floor coverings — tiles level, no lippage',
      'Parapet / balustrade — secure, correct height',
      'Glazing — sealed and operational (if any)',
      'Doors — alignment, sealing, locks',
      'Door ironmongery and keys',
      'Floor slopes toward drain',
      'Railing — secure, no movement',
    ],
    electrical: [
      'Light fittings — operational (if any)',
      'Light switches — functional (if any)',
    ],
    hvac: ['AC condensing unit — condition (if any)', 'Extract / vents — if any'],
    plumbing: [
      'Drain slopes adequate — no ponding',
      'Floor drains and covers — present and clear',
      'No water ingress to interior',
    ],
  },

  db: {
    electrical: [
      'DB enclosure — no damage, cover secure, no corrosion',
      'All MCBs labeled clearly and correctly',
      'RCD / ELCB — present and trip-tested',
      'No double-tapping (two wires on one MCB)',
      'All spare slots covered — no open knockouts',
      'Main isolator — operational',
      'No signs of overheating, burn marks or scorching',
      'Earth bonding — present and secure',
      'SLD (Single Line Diagram) present in DB door pocket',
      'No exposed live conductors',
      'Phase identification labeling correct',
      'All metal conduits and trunking effectively earthed',
    ],
  },

  homeAutomation: {
    automation: [
      'Smart panel / controller — operational',
      'App pairing and connectivity — functional',
      'Lighting scenes — working',
      'Motorized blinds / curtains — operational (if any)',
      'Smart thermostat — responsive (if any)',
      'Video doorbell / intercom via app — functional',
      'Smart locks — functional (if any)',
      'Motion sensors — active (if any)',
      'Built-in speaker / audio — operational (if any)',
      'Network / WiFi access points — installed and live',
    ],
  },

  externalFacade: {
    civil: [
      'External wall cladding / paint — no cracks, uniform finish',
      'Facade tiles / panels — no hollow, no cracks',
      'Window and door frames external — sealed, no gaps',
      'Entrance gate / boundary wall — condition and operation',
      'Driveway and paved paths — level, no cracks',
      'External steps / ramp — safe, level, handrail secure',
    ],
  },

  garage: {
    civil: [
      'Floor condition — no cracks, level',
      'Walls and ceiling — no cracks, paint',
      'Roller door / gate mechanism — smooth operation',
      'Door safety reverse function — operational',
    ],
    electrical: [
      'Light fittings — operational',
      'Power points / sockets — tested',
      'EV charging point — operational (if any)',
    ],
    plumbing: ['Floor drain — present and clear', 'Floor slope toward drain'],
  },

  landscaping: {
    civil: [
      'Lawn / turf — healthy, level, no bare patches',
      'Planted beds and shrubs — condition, establishment',
      'Boundary walls and fencing — secure and complete',
      'Paving and pathway — level, no cracks or loose units',
      'External steps — level, secure, nosing intact',
    ],
    electrical: [
      'Pathway lighting — operational',
      'Garden uplights — operational',
      'Irrigation controller / timer — programmed and operational',
    ],
    plumbing: [
      'Irrigation drip lines — intact, no blockages',
      'Sprinkler heads — operational, correctly aimed',
      'Outdoor taps — operational',
      'Pool condition — tiles, coping, no cracks (if any)',
      'Pool pump and filtration — operational (if any)',
      'Pool skimmer and water level — correct (if any)',
    ],
  },

  staircase: {
    civil: [
      'Handrail — secure, continuous, correct height',
      'Floor coverings on stairs — secure, no loose tiles',
      'Landing floor coverings — level and secure',
      'Balustrade — secure, no movement',
      'Riser and tread condition — no cracks, uniform height',
      'Staircase lighting — operational',
    ],
  },

  maidRoom: {
    civil: [
      'Walls — cracks, paint, finish',
      'Ceiling — level, paint, no cracks',
      'Floor coverings — level, intact',
      'Door — alignment, ironmongery',
    ],
    electrical: ['Light fittings — operational', 'Power points — tested'],
    hvac: ['AC vent / grille — condition', 'AC cooling — adequate'],
    plumbing: [
      'WC / toilet — flushing, secure',
      'Wash basin — sealed, drain clear',
      'Shower — operational (if any)',
      'Floor drain — present and clear',
    ],
  },

  roofTerrace: {
    civil: [
      'Floor coverings — level, slopes to drain',
      'Parapet / balustrade — secure, height compliant',
      'Waterproofing — visible condition, no blistering',
      'Walls — paint, no cracks',
      'Access hatch / door — operational and sealed',
    ],
    electrical: ['Light fittings — operational (if any)', 'Power points — tested (if any)'],
    plumbing: ['Roof drain — present, clear, free-flowing', 'No water ponding evidence'],
  },

  utilityRoom: {
    civil: ['Walls and ceiling — paint, no cracks', 'Floor — level, drain present'],
    electrical: ['Light fittings — operational', 'Power points — tested'],
    plumbing: [
      'Washing machine connections — present',
      'Floor drain — clear',
      'Water taps — operational',
    ],
  },

  boosterPumpRoom: {
    civil: [
      'Walls — paint, no cracks, no damp',
      'Ceiling — no cracks, no leaks',
      'Floor — level, drain present, no damp',
      'Pump foundation / plinth — secure, level, no cracks',
      'Access door — operational, sealed',
      'Ventilation opening — present and clear',
    ],
    mechanical: [
      'Booster pump 1 — operates, no abnormal noise while running',
      'Booster pump 2 — operates, no abnormal noise while running',
      'Pressure vessel — condition, no corrosion, no leaks',
      'Pressure gauge — present, reading within normal range',
      'Pipework — joints sealed, no leaks, supports secure',
      'Isolation valves — present and operational',
      'Non-return valves — present',
      'Pipe insulation / lagging — intact (if applicable)',
    ],
    electrical: [
      'Control panel — labelling clear, breakers operational',
      'Indicator lights — functional, no fault alarms',
      'Wiring — neat, properly terminated, no exposed conductors',
      'Earth bonding — present and secure',
      'Emergency stop button — present and accessible',
    ],
  },

  waterTankGround: {
    civil: [
      'Tank body — condition, no cracks, no leaks',
      'Access cover / manhole — secure, sealed, lockable',
      'Overflow pipe — present, terminates safely',
      'Vent pipe — present, fitted with screen',
      'Internal cleanliness — clean (if accessible)',
      'Surrounding area — clean, no contamination risk',
    ],
    mechanical: [
      'Float / level indicator — operational',
      'Inlet valve — operational, no leaks',
      'Outlet valve — operational, no leaks',
      'Tank capacity — matches design (if known)',
    ],
    plumbing: [
      'TDS reading at outlet — within acceptable range',
      'Water clarity — clear, no discoloration',
      'No odour — water smells neutral',
    ],
  },

  waterTankRoof: {
    civil: [
      'Tank body — condition, no cracks, no leaks, no UV damage',
      'Tank insulation / jacket — intact, UV-protective',
      'Support frame / plinth — secure, level, no corrosion',
      'Access cover / manhole — secure, sealed',
      'Overflow pipe — present, terminates safely',
      'Vent pipe — present, fitted with screen',
      'Internal cleanliness — clean (if accessible)',
    ],
    mechanical: [
      'Float / level indicator — operational',
      'Inlet valve — operational, no leaks',
      'Outlet valve — operational, no leaks',
    ],
    plumbing: [
      'TDS reading at outlet — within acceptable range',
      'Water clarity — clear, no discoloration',
      'No odour — water smells neutral',
    ],
  },

  solarWaterHeater: {
    civil: [
      'Collector panel — physical condition, no cracks, no shading obstruction',
      'Panel mounting — secure, no movement',
      'Hot water cylinder / tank — condition, no leaks',
      'Tank insulation — intact, undamaged',
    ],
    mechanical: [
      'Pipework — insulated, no leaks at connections',
      'Tempering / mixing valve — present and functional',
      'Pressure / temperature relief valve — present, unobstructed',
      'Isolation valves — present and operational',
      'Backup electric element — operational (if fitted)',
      'Thermostat — responsive, correct setting',
    ],
    electrical: [
      'Power supply to electric backup — connected and functional (if fitted)',
      'Indicator lights / controller — operational',
    ],
    plumbing: [
      'Hot water delivery test — adequate temperature at nearest tap',
      'No leaks at any joint or connection',
    ],
  },
};

/** Fire Alarm preset — flat list, used when creating a custom Fire room. */
export const FIRE_PRESET: readonly string[] = [
  'Smoke detectors — installed, secure, not painted over',
  'Heat detectors — installed where required (kitchen, plant rooms)',
  'Manual call points (MCPs) — accessible, not obstructed',
  'Sounders / bells — audible in the area',
  'Fire alarm panel — powered, no faults shown',
  'Detector coverage — adequate, no gaps',
  'Interface with other systems (AC shutdown, lift homing) — present',
  'Sprinkler heads — installed, unobstructed, not painted',
  'Fire extinguishers — present, charged, within service date',
  'Hose reels / landing valves — accessible, operational',
  'Emergency lighting — operational, covers escape routes',
  'Exit signs — illuminated, correct direction',
  'Fire exit doors — open freely, not locked or blocked',
  'Escape routes — clear and unobstructed',
];
