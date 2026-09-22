/**
 * Checklists for common / plant / system areas in a building inspection.
 *
 * Apartments do NOT come from here — they keep the existing multi-room
 * structure from `domain/rooms.ts`. Everything else in a building is a single
 * space, so each area kind maps to one room's worth of items.
 */

import type { AreaChecklist, AreaKind } from './types';

const C: Partial<Record<AreaKind, AreaChecklist>> = {
  corridor: {
    icon: 'living',
    discs: ['civil', 'electrical', 'hvac', 'fire'],
    items: {
      civil: [
        'Floor finish — level, joints, skirting',
        'Wall finish — paint, plaster, corners',
        'Ceiling — alignment, joints, access panels',
        'Doors, frames and ironmongery off the corridor',
        'Handrails and wall protection',
        'Unit number signage at each door',
      ],
      electrical: [
        'Lighting — operation, alignment, colour consistency',
        'Emergency lighting operation',
        'Switches, sockets and cover plates',
        'Ceiling access panel for the corridor FCU',
      ],
      hvac: [
        'Supply grilles — alignment, cleanliness, airflow',
        'Corridor FCU access panel provided and serviceable',
        'Thermostat operation',
      ],
      fire: ['Exit signage — visible and illuminated', 'Smoke detector fitted and clear'],
    },
  },
  lobby: {
    icon: 'living',
    discs: ['civil', 'electrical', 'fire'],
    items: {
      civil: [
        'Floor and wall finishes',
        'Ceiling and access panels',
        'Lift landing door architraves and reveals',
        'Skirting and junctions',
      ],
      electrical: ['Lighting operation', 'Emergency lighting', 'Lift call panel and indicator'],
      fire: ['Exit signage', 'Detector fitted'],
    },
  },
  entrance: {
    icon: 'facade',
    discs: ['civil', 'electrical', 'fire', 'automation'],
    items: {
      civil: [
        'Entrance doors — operation, alignment, seals',
        'Floor finish, matting and threshold',
        'Wall finish — paint, plaster, corners',
        'Ceiling — level, joints, paint, no cracks',
        'Glazing — condition, sealant, manifestation',
      ],
      electrical: ['Lighting', 'Emergency lighting', 'Door power supply and isolation'],
      fire: ['Exit signage', 'Break glass / call point'],
      automation: ['Access control and intercom operation', 'CCTV coverage at entrance'],
    },
  },
  arcade: {
    icon: 'facade',
    discs: ['civil', 'electrical'],
    items: {
      civil: ['Soffit and column finishes', 'Floor finish and falls', 'Expansion joints'],
      electrical: ['Lighting operation and weather rating'],
    },
  },
  stair: {
    icon: 'staircase',
    discs: ['civil', 'electrical', 'fire'],
    items: {
      civil: [
        'Treads and risers — dimensional consistency, no variation',
        'Nosings — fitted, contrasting, secure, no lifting',
        'Stair floor finish — level, secure, no loose tiles',
        'Landing floor finish and junctions',
        'Wall finish — paint, plaster, corners and beads',
        'Ceiling / soffit finish — including the underside of the flight above',
        'Skirting to stairs and landings',
        'Handrail — height, continuity, returns at ends',
        'Handrail fixings — secure, no movement',
        'Balustrade — gaps, infill, rigidity',
        'Headroom clear throughout',
        'Expansion or movement joints where present',
        'Waterproofing and falls at any external landing',
      ],
      electrical: ['Lighting operation', 'Emergency lighting on the flight and landing'],
      fire: [
        'Fire door — closer, latching, gaps, vision panel',
        'Fire door signage and intumescent seals',
        'Smoke vent or pressurisation grille',
        'Stair identification and floor level signage',
      ],
    },
  },
  lift_landing: {
    icon: 'db',
    discs: ['civil', 'electrical', 'mechanical', 'fire'],
    items: {
      civil: [
        'Landing door finish and alignment',
        'Architrave and reveal made good',
        'Sill — fixing, level, condition, no trip',
        'Landing ceiling and access panels',
        'Floor number marking, and tactile marking where required',
      ],
      electrical: [
        'Call panel and indicator operation',
        'Call button height (accessibility)',
        'Landing lighting',
      ],
      mechanical: [
        'Car levelling accuracy at this floor',
        'Door opening and closing timing',
        'Door reopening device',
        'DOOR INTERLOCK — landing door cannot be opened with no car present',
        'Gap between landing door and car sill',
        'Emergency unlocking (triangle key) accessible',
      ],
      fire: [
        'Landing door fire rating label present',
        'Frame fire stopped, no gaps at the reveal',
      ],
    },
  },
  lift_commissioning: {
    icon: 'db',
    discs: ['automation', 'electrical', 'mechanical'],
    items: {
      // Controller side — items 1 to 16 of the contractor's sheet
      automation: [
        '1. CAN BUS terminal resistor, CAR side — should be 120/180 ohms per site condition',
        '2. CAN BUS terminal resistor, SHAFT side — should be 120/180 ohms per site condition',
        '3. Total CAN BUS resistance — should be 60 ohms always',
        '9. Brake voltage at PCTF board — over-excitation voltage must be set',
        '10. Brake monitoring switches — should go ON/OFF with brake operation',
        '11. Load weighing status at controller — check DIP switch, calibrate if necessary',
        '12. Load weighing status at inverter — check with PC application',
        '13. Fault codes of the controller — record and send to the engineering team',
        '14. Present firmware of all CAN BUS boards — record',
        '15. CAN BUS status of all UCP+ boards',
        '16. Fault codes of the inverter — record and send to the engineering team',
      ],
      // Earthing and screening — items 4 to 8 and 17 to 23
      electrical: [
        '4. Earth cable connection in T/C at UBA2 board — mandatory',
        '5. Earth cable from main earth to UBA2 board — mandatory',
        '6. Motor cable shield grounding at the controller',
        '7. Incoming three-phase cable shield grounding',
        '8. CAN BUS cable controller-to-inverter separated from H/V cables',
        '17. Motor cable shield grounding at inverter side',
        '18. Motor cable shield grounding at motor side',
        '19. Incoming three-phase cable grounding at inverter side',
        '20. Motor cable shield grounding',
        '21. Encoder cable shield grounding at inverter side — proper clip used',
        '22. Encoder cable shield grounding at motor side — proper clip used',
        '23. Encoder cable separated from H/V cables',
        '24. Earth cable connection in T/C at UBC board — mandatory',
      ],
      // Car side and shaft — items 25 to 34
      mechanical: [
        '25. Gap, CMS sensor to magnets — should be 13-15 mm, vertical',
        '26. Gap, CMB sensor to magnets — should be 13-15 mm, vertical',
        '27. Gap, floor level sensor to magnets — should be 6-8 mm, vertical',
        '28. Car guide shoe play — maximum 3 mm',
        '29. Status of all safety line switches (car)',
        '30. Adjustment of car doors',
        '31. Weight added at car door beak',
        '32a. SHAFT — landing door contact safety switches',
        '32b. SHAFT — engagement of pick-up rollers with the car door CAM',
        '32c. SHAFT — gap between door panel and jamb',
        '32d. SHAFT — gap between door panel and door panel',
        '33. SHAFT — status of all safety line switches',
        '34. CWT run-by — measure with tape',
      ],
    },
  },
  lift_car: {
    icon: 'db',
    discs: ['civil', 'electrical', 'mechanical', 'fire'],
    items: {
      civil: [
        'Car interior finishes — panels, scratches, dents, alignment',
        'Ceiling and lighting diffuser',
        'Handrail — fitted, height, fixings secure',
        'Mirror — fitted, fixing, no damage',
        'Flooring — finish, level with sill, no trip',
        'Car door panels — finish, alignment, no rubbing',
      ],
      electrical: [
        'Car operating panel — all buttons work, illuminate, correct floors',
        'Button height and BRAILLE / tactile markings (accessibility)',
        'Floor indicator and arrival gong working',
        'Car lighting level',
        'EMERGENCY LIGHT — operates on power loss, holds for the rated duration',
        'Emergency two-way communication TESTED — reaches a manned point, 24/7',
      ],
      mechanical: [
        'Ride quality — noise, vibration, jerk on start and stop',
        'LEVELLING accuracy at each floor',
        'Door opening and closing timing',
        'Door reopening device / light curtain — tested by obstructing',
        'Overload detection — alarm and door hold',
        'Car ventilation fan operating',
        'Car top: inspection control, stop switch, guardrail and lighting',
        'Load plate displayed — capacity in kg AND persons',
        'Lift licence / inspection certificate displayed in the car',
        'Emergency instruction and no-smoking signage',
      ],
      fire: [
        'Fire recall — lift homes to the designated floor on alarm, TESTED',
        'Fireman\'s switch operation where fitted',
        'ARD / emergency rescue device — car reaches a landing and opens on power failure',
      ],
    },
  },
  lift_shaft: {
    icon: 'db',
    discs: ['civil', 'electrical', 'mechanical', 'fire'],
    items: {
      civil: [
        'Shaft walls, openings and builders work made good',
        'Cleanliness — no debris, no stored materials',
        'Top clearance / headroom refuge space',
        'Shaft ventilation or smoke vent at the top — fitted and clear',
      ],
      electrical: [
        'Shaft lighting throughout, switched from pit and machine room',
        'Final limit and terminal switches fitted',
        'Wiring and containment fixed, nothing loose in the shaft',
      ],
      mechanical: [
        'Guide rails, brackets and fixings — alignment and tightness',
        'Counterweight — guarding, guide shoes, clearance',
        'Travelling cable — condition, clearance, no chafing',
        'Ropes / belts — condition, tension, equal loading',
        'NO FOREIGN SERVICES in the shaft — water pipes, unrelated cable, drainage',
      ],
      fire: [
        'Shaft fire rating intact, no unsealed penetrations',
        'Landing door frames fire stopped at each floor',
      ],
    },
  },
  lift_pit: {
    icon: 'tank',
    discs: ['civil', 'electrical', 'mechanical', 'plumbing'],
    items: {
      civil: [
        'Pit floor condition and finish',
        'Pit depth / refuge space maintained',
        'Pit ladder — fitted, secure, reachable from the landing door',
        'Cleanliness — no debris, no stored items',
      ],
      electrical: [
        'Pit lighting operating, switch reachable on entry',
        'PIT STOP SWITCH — fitted, reachable before entering, tested',
      ],
      mechanical: [
        'Buffers fitted, correct type, secure',
        'Counterweight buffer and run-by clearance',
        'Pit prop / safety barrier where provided',
      ],
      plumbing: [
        'WATER INGRESS — any standing water, staining or tide marks',
        'Pit drainage or sump provision',
        'No water or drainage pipe routed through the pit',
      ],
    },
  },
  lift_machine: {
    icon: 'pump',
    discs: ['civil', 'electrical', 'hvac', 'mechanical', 'fire'],
    items: {
      civil: [
        'Access route, stair or ladder — safe and permanent',
        'Room door — opens outward, self-closing, lockable, signage fitted',
        'Guarding around the shaft opening',
        'Floor and wall condition',
        'Ceiling / soffit — no cracks, no leaks or staining',
        'Lifting beam or hoisting point with SWL marked',
      ],
      electrical: [
        'Controller panel — labelling, covers, IP rating, no exposed parts',
        'MAIN SWITCH — labelled, accessible, lockable',
        'Lighting and socket outlet',
        'Earthing and bonding',
        'Lift number and emergency contact displayed',
      ],
      hvac: [
        'Room cooling operating — unit R-5 (5.40 kW)',
        'Temperature held within the equipment range under load',
        'Ventilation opening or louvre clear',
      ],
      mechanical: [
        'Machine, brake and sheave condition',
        'Rope condition, tension and equal loading',
        'MANUAL BRAKE RELEASE — handle present, instructions displayed',
        'Rope marking showing car position for manual rescue',
        'Emergency evacuation procedure displayed',
      ],
      fire: [
        'Fire rating of the enclosure intact',
        'Penetrations fire stopped',
        'CO2 fire extinguisher present and in date',
      ],
    },
  },
  elec_room: {
    icon: 'db',
    discs: ['civil', 'electrical', 'fire'],
    items: {
      civil: ['Door, frame and lock', 'Floor and wall finish', 'Ventilation opening clear', 'Ceiling / soffit — no cracks, no leaks or staining'],
      electrical: [
        'Distribution board — fixing, covers, blanking plates',
        'Circuit schedule present, legible and correct',
        'Labelling of all outgoing ways',
        'Earthing and bonding visible and connected',
        'Cable entries sealed and glanded',
        'Clear working space in front of the board',
        'Lighting and socket in the room',
      ],
      fire: ['Fire stopping at all penetrations', 'Door fire rating — see query Q5'],
    },
  },
  telecom: {
    icon: 'automation',
    discs: ['civil', 'electrical'],
    items: {
      civil: ['Cupboard door, frame and lock', 'Cupboard soffit and top panel'],
      electrical: ['Containment and trunking fixed', 'Cables dressed and labelled', 'Blanking plates fitted', 'Earth bar present'],
    },
  },
  tv_room: {
    icon: 'automation',
    discs: ['civil', 'electrical', 'automation'],
    items: {
      civil: ['Door, frame and lock', 'Ceiling — level, paint, no cracks'],
      electrical: ['Power supply and socket', 'Cable management and labelling'],
      automation: ['MATV / satellite distribution equipment mounted and labelled', 'Amplifier and splitter condition'],
    },
  },
  water_meter: {
    icon: 'tank',
    discs: ['civil', 'plumbing'],
    items: {
      civil: ['Cupboard door, frame and lock', 'Cupboard soffit and top panel'],
      plumbing: [
        'Meters fitted, labelled per unit and readable',
        'Isolation valves operate',
        'Pipework supports and insulation',
        'No leaks at joints or unions',
        'Drainage / tundish at the cupboard',
      ],
    },
  },
  garbage_room: {
    icon: 'utility',
    discs: ['civil', 'electrical', 'hvac', 'plumbing', 'fire'],
    items: {
      civil: [
        'Door, frame, closer and lock',
        'Wall and floor finish — washable, coved',
        'Impact protection',
        'Ceiling — washable finish, no damp or staining',
      ],
      electrical: ['Lighting operation', 'Socket for cleaning equipment'],
      hvac: ['Extract ventilation operating', 'No odour carry-over into the corridor'],
      plumbing: ['Landlord CWS tap for washdown fitted', 'Floor drain / gully — trapped and clear'],
      fire: ['Fire stopping at chute penetration', 'Door fire rating — see query Q5'],
    },
  },
  chute_hopper: {
    icon: 'utility',
    discs: ['civil', 'fire'],
    items: {
      civil: [
        'Hopper door — SELF-CLOSING and latching',
        'Hopper door gasket and flap seal',
        'Hopper fixings to the shaft',
        'Surround made good, no gaps',
        'No damage or denting',
      ],
      fire: ['Hopper fire rating', 'Shaft penetration fire stopped at this floor'],
    },
  },
  chute_shaft: {
    icon: 'utility',
    discs: ['civil', 'hvac', 'fire'],
    items: {
      civil: ['Shaft lining — smooth, no snagging points', 'Joints sealed', 'Cleanliness'],
      hvac: ['Shaft ventilation and vent termination at roof'],
      fire: ['Fire rating of shaft', 'Discharge fire damper at ground'],
    },
  },
  fire_recess: {
    icon: 'facade',
    discs: ['civil', 'fire'],
    items: {
      civil: ['Recess finish and surround', 'Cabinet or door where fitted'],
      fire: [
        'Hose reel or landing valve fitted — confirm which (query Q3)',
        'Valve operates and is accessible',
        'Signage and identification',
        'Pressure gauge reading where fitted',
        'No obstruction in front of the recess',
      ],
    },
  },
  services_shaft: {
    icon: 'tank',
    discs: ['civil', 'fire'],
    items: {
      civil: ['Access panel provided (query Q4)', 'Shaft clean and free of debris'],
      fire: ['Fire stopping at each floor penetration'],
    },
  },
  pump_room: {
    icon: 'pump',
    discs: ['civil', 'electrical', 'mechanical', 'plumbing', 'fire'],
    items: {
      civil: ['Door, frame, lock and access', 'Floor finish and falls to drain', 'Plinths — level, no cracking', 'Ceiling / soffit — no cracks, no leaks or staining'],
      electrical: ['Control panel — labelling, covers, isolation', 'Lighting and socket', 'Earthing and bonding'],
      mechanical: [
        'Pump set mounted, aligned and labelled',
        'Duty / standby arrangement identified',
        'Vibration isolation — anti-vibration mounts and flexible connectors',
        'Guards fitted to rotating parts',
        'Noise level acceptable',
      ],
      plumbing: [
        'Valves — operate, labelled, correct position',
        'Pressure gauges fitted and readable',
        'Pipework supports, alignment and insulation',
        'No leaks at any joint',
        'Floor drain clear',
      ],
      fire: ['Fire stopping at penetrations', 'Extinguisher provided'],
    },
  },
  water_tank: {
    icon: 'tank',
    discs: ['civil', 'electrical', 'plumbing'],
    items: {
      civil: ['Tank access hatch — lockable, sealed, insect proof', 'Access ladder secure', 'Surrounding area clean and dry'],
      electrical: ['Level control and alarm wiring', 'Lighting at the tank'],
      plumbing: [
        'Tank internal condition and lining',
        'Inlet, outlet and washout connections',
        'Overflow and warning pipe — correctly terminated',
        'Level indicator readable',
        'Insulation where exposed',
        'No leaks or weeping at any connection',
      ],
    },
  },
  booster: {
    icon: 'pump',
    discs: ['electrical', 'mechanical', 'plumbing'],
    items: {
      electrical: ['Control panel and labelling', 'Isolation and earthing'],
      mechanical: ['Duty / standby changeover', 'Anti-vibration mounts and flexible connectors', 'Noise and vibration'],
      plumbing: ['Pressure vessel charge', 'Gauges and valves', 'Pipework supports', 'No leaks'],
    },
  },
  substation: {
    icon: 'db',
    discs: ['civil', 'electrical', 'hvac', 'fire'],
    items: {
      civil: ['Door, lock and restricted access signage', 'Floor, walls and ventilation openings', 'Ceiling / soffit — no cracks, no leaks or staining'],
      electrical: ['Panels — covers, labelling, warning signage', 'Earthing and bonding', 'Insulation mat where required'],
      hvac: ['Ventilation operating'],
      fire: ['Fire stopping', 'CO2 / appropriate extinguisher'],
    },
  },
  lv_room: {
    icon: 'db',
    discs: ['civil', 'electrical', 'hvac', 'fire'],
    items: {
      civil: ['Door, lock and signage', 'Floor and wall finish', 'Clear working space', 'Ceiling / soffit — no cracks, no leaks or staining'],
      electrical: [
        'LV panel — covers, blanking plates, labelling',
        'Single line diagram displayed',
        'Cable entries sealed and glanded',
        'Earthing and bonding',
        'Metering fitted and readable',
      ],
      hvac: ['Room cooling operating — unit G-3 (6.40 kW)'],
      fire: ['Fire stopping at penetrations', 'Extinguisher provided'],
    },
  },
  cctv: {
    icon: 'automation',
    discs: ['civil', 'electrical', 'automation'],
    items: {
      civil: ['Door, frame and lock', 'Ceiling — level, paint, no cracks'],
      electrical: ['Power supply, UPS where fitted', 'Cable management'],
      automation: ['Recorder and monitor operating', 'Camera coverage as designed', 'Time and date correct'],
    },
  },
  gas_room: {
    icon: 'utility',
    discs: ['civil', 'mechanical', 'fire'],
    items: {
      civil: ['Louvered door and ventilation openings clear', 'Floor and wall finish', 'Ceiling — level, paint, no cracks'],
      mechanical: ['Manifold, regulators and valves', 'Pipework supports and identification', 'Leak test record available'],
      fire: ['Gas detection where fitted', 'Warning signage', 'Extinguisher provided'],
    },
  },
  parking: {
    icon: 'garage',
    discs: ['civil', 'electrical', 'fire'],
    items: {
      civil: [
        'Floor finish and sealer',
        'Bay line marking — complete and correctly spaced',
        'Bay numbering matches the allocation',
        'Wheel stops / bumper stops fitted',
        'Column protection',
        'Falls to drainage — no ponding',
        'Soffit — no cracks, spalling or exposed rebar; no leaks or staining',
      ],
      electrical: ['Lighting levels and operation', 'Emergency lighting'],
      fire: ['Signage and escape route marking', 'Extinguishers in position'],
    },
  },
  driveway: {
    icon: 'garage',
    discs: ['civil', 'electrical', 'plumbing'],
    items: {
      civil: ['Ramp finish and anti-slip', 'Gradient and transitions', 'Kerbs and edge protection', 'Entry/exit signage and mirrors', 'Ramp soffit — no cracks, spalling or leaks'],
      electrical: ['Lighting', 'Barrier or shutter operation where fitted'],
      plumbing: ['Drainage channel at ramp foot — clear and draining'],
    },
  },
  store: {
    icon: 'utility',
    discs: ['civil', 'electrical'],
    items: { civil: ['Door, frame and lock', 'Floor and wall finish', 'Shelving where fitted', 'Ceiling — level, paint, no cracks'], electrical: ['Lighting', 'Socket'] },
  },
  bulk_waste: {
    icon: 'utility',
    discs: ['civil', 'electrical', 'hvac', 'plumbing'],
    items: {
      civil: ['Louvered door and frame', 'Washable wall and floor finish, coved', 'Container manoeuvring space', 'Ceiling — washable finish, no damp or staining'],
      electrical: ['Lighting'],
      hvac: ['Ventilation operating'],
      plumbing: ['Washdown tap', 'Floor gully trapped and draining'],
    },
  },
  pool: {
    icon: 'tank',
    discs: ['civil', 'electrical', 'plumbing', 'fire'],
    items: {
      civil: [
        'Tiling — level, joints, grout, no lippage',
        'Coping and edge detail',
        'Balustrade and barrier — height and gaps',
        'Anti-slip surround finish',
        'Depth markings and warning signage',
        'Steps, ladders and handrails',
      ],
      electrical: ['Underwater lighting and RCD protection', 'Bonding of metalwork', 'Deck lighting'],
      plumbing: ['Skimmers and inlets', 'Balance tank and overflow', 'Water clarity and level', 'No leaks at penetrations'],
      fire: ['Rescue equipment and signage'],
    },
  },
  pool_deck: {
    icon: 'terrace',
    discs: ['civil', 'electrical', 'plumbing'],
    items: {
      civil: ['Deck finish — anti-slip, level, joints', 'Falls away from the pool', 'Furniture fixings where applicable'],
      electrical: ['Deck lighting and weather rating'],
      plumbing: ['Deck drainage — channels clear and draining'],
    },
  },
  pool_plant: {
    icon: 'pump',
    discs: ['civil', 'electrical', 'mechanical', 'plumbing'],
    items: {
      civil: ['Door, access and ventilation', 'Floor falls to drain', 'Plinths', 'Ceiling / soffit — no cracks, no leaks or staining'],
      electrical: ['Control panel, labelling, isolation', 'Earthing and bonding', 'Lighting'],
      mechanical: ['Circulation pumps — mounting, alignment, noise', 'Filters — condition and backwash operation', 'Dosing equipment where fitted'],
      plumbing: ['Valves labelled and operating', 'Gauges readable', 'Pipework supports and identification', 'No leaks'],
    },
  },
  gym: {
    icon: 'living',
    discs: ['civil', 'electrical', 'hvac', 'fire'],
    items: {
      civil: [
        'Flooring — type, joints, fixing',
        'Mirrors — fixing, backing, edge protection',
        'Wall finish — paint, plaster, corners',
        'Ceiling — level, joints, paint, no cracks',
        'Equipment anchorage where fixed',
        'Glazing and manifestation',
      ],
      electrical: ['Lighting levels and operation', 'Sockets — position and RCD protection', 'Emergency lighting'],
      hvac: ['Cooling operating — unit R-1 (23.60 kW)', 'Supply and return grilles', 'Thermostat'],
      fire: ['Detector and sounder', 'Exit signage'],
    },
  },
  changing: {
    icon: 'bathroom',
    discs: ['civil', 'electrical', 'hvac', 'plumbing'],
    items: {
      civil: ['Tiling and grout', 'Benches, hooks and lockers', 'Door and privacy', 'Ceiling — paint, no damp, no cracks'],
      electrical: ['Lighting and IP rating', 'Socket positions relative to wet zones'],
      hvac: ['Extract ventilation operating'],
      plumbing: ['Floor drainage and falls', 'Sanitaryware and fittings'],
    },
  },
  wc: {
    icon: 'bathroom',
    discs: ['civil', 'electrical', 'hvac', 'plumbing'],
    items: {
      civil: ['Tiling, grout and silicone', 'Door, lock and indicator', 'Accessible provisions where applicable', 'Ceiling — paint, no damp, no cracks'],
      electrical: ['Lighting and IP rating', 'Hand dryer where fitted'],
      hvac: ['Extract operating — 15 L/s per WC'],
      plumbing: ['WC, basin and fittings', 'Traps and seals', 'Water pressure and temperature', 'Floor drain and falls', 'No leaks'],
    },
  },
  watchman: {
    icon: 'maid',
    discs: ['civil', 'electrical', 'hvac', 'plumbing'],
    items: {
      civil: ['Door, window and finishes', 'Kitchenette joinery', 'Ceiling — level, paint, no cracks'],
      electrical: ['Lighting and sockets', 'Data / intercom point'],
      hvac: ['Cooling operating — unit R-4 (1.30 kW)'],
      plumbing: ['Sink and WC', 'Water supply and drainage', 'No leaks'],
    },
  },
  pergola: {
    icon: 'terrace',
    discs: ['civil', 'electrical'],
    items: {
      civil: ['Frame alignment and fixings', 'Finish and corrosion protection', 'Drainage where integrated', 'Fixings into the slab made good'],
      electrical: ['Integrated lighting where fitted and weather rating'],
    },
  },
  roof_slab: {
    icon: 'terrace',
    discs: ['civil', 'electrical', 'hvac', 'plumbing'],
    items: {
      civil: [
        'Waterproofing membrane — laps, terminations, no blisters',
        'Screed and falls — no ponding',
        'Parapet, coping and upstands',
        'Access door and walkway protection',
        'Every plant plinth — level, no cracking',
      ],
      electrical: ['Lightning protection where fitted', 'External lighting and weather rating', 'Cable routing and support'],
      hvac: ['Condenser mounting, clearances and levels', 'Refrigerant pipe supports and insulation', 'Condensate routing'],
      plumbing: [
        'Roof drainage outlets — clear, grated, draining',
        'EVERY PENETRATION through the membrane sealed and flashed',
        'Vent terminations',
      ],
    },
  },
  facade: {
    icon: 'facade',
    discs: ['civil'],
    items: {
      civil: [
        'Stone cladding dark beige (1) — alignment, joints, fixing',
        'Texture paint white (2) — coverage, colour consistency',
        'Aluminium glazed windows (3) — alignment, seals, operation',
        'Aluminium louver doors (4)',
        'Aluminium handrail with glass (5) — fixing, gaps, glass condition',
        'Stone cladding grey (6)',
        'Grooves (7) — line, consistency',
        'Movement and expansion joints',
        'Sealant condition throughout',
        'Staining, efflorescence or damage',
      ],
    },
  },
  fire_systems: {
    icon: 'facade',
    discs: ['electrical', 'fire'],
    items: {
      electrical: ['Panel power supply and battery backup', 'Emergency lighting circuits'],
      fire: [
        'Fire alarm panel — operational, no faults displayed',
        'Detectors — coverage and fitted in every area',
        'Sounders audible throughout',
        'Break glass / call points at exits',
        'Emergency lighting throughout escape routes',
        'Exit signage — visible, illuminated, correct direction',
        'Extinguishers — type, position, service date',
        'Fire pump installation and pressure',
        'Civil Defence compliance documentation',
      ],
    },
  },
  cctv_system: {
    icon: 'utility',
    discs: ['electrical', 'automation'],
    items: {
      electrical: [
        'UPS / battery back-up present, powered, holding charge',
        'Power supply and isolation to the head end, labelled',
        'Cabling and containment — supported, dressed, not shared with power',
        'Earthing at the rack',
      ],
      automation: [
        'Cameras fitted and aligned — coverage matches the intended view',
        'Image quality by day, and by night on IR where fitted',
        'No obstruction to any camera — planting, signage, ductwork, glare',
        'Recorder operating, drives healthy, retention period set',
        'Connectivity — every camera online, no dropouts on the live view',
        'Time and date correct and consistent across cameras',
        'Monitor / viewing station working',
        'NOTE: technical inspection only — NOT checked against SiRA requirements',
      ],
    },
  },
  intercom: {
    icon: 'utility',
    discs: ['electrical', 'automation'],
    items: {
      electrical: ['Power supply and back-up', 'Cabling and containment where visible'],
      automation: [
        'Entrance panel — buttons, display, legibility, weather protection',
        'Call to each apartment handset answers',
        'Audio quality both ways',
        'Video image where fitted',
        'Door release operates from the handset',
        'Apartment handset — fixing, finish, damage',
      ],
    },
  },
  fahu: {
    icon: 'pump',
    discs: ['civil', 'electrical', 'hvac', 'mechanical', 'fire'],
    items: {
      civil: ['Plinth — level, no cracking', 'Access all round the unit'],
      electrical: [
        'Power supply, isolator and labelling',
        'Earthing',
        'Supply fan motor — 11.34 kW, connections and labelling',
        'Extract fan motor — 10.30 kW, connections and labelling',
        'MicroMax VFD wheel speed controller — fitted and powered',
        'UV lamp fixtures — fitted downstream of the cooling coil, powered, lamps present',
      ],
      hvac: [
        'SAND TRAP fitted and clean — critical in this climate',
        'Fresh air louvre (FAL) and exhaust air louvre (EAL) clear',
        'PRE-FILTERS — fitted, clean, correct size, seated in frame',
        'BAG FILTERS — fitted, clean, correct size, no bypass around the frame',
        'Filter access doors open and close, gauges/manometers fitted',
        'Supply fan — condition, impeller, belt/drive, guard',
        'Extract fan — condition, impeller, belt/drive, guard',
        'SORPTION (enthalpy) heat recovery wheel — rotates freely, belt intact, seals set',
        'SENSIBLE heat recovery wheel — rotates freely, belt intact, seals set',
        'Wheel purge sector set, no cross-contamination gap',
        'Cooling coil — fins, cleanliness, no damage',
        'Dampers — fresh air, extract, bypass: free movement, no binding',
        'Damper ACTUATORS — fitted, wired, stroke full open to full closed',
        'Ductwork connections and insulation',
        'Airflow at terminals',
      ],
      mechanical: ['Casing weatherproofing and panel fixings', 'Vibration isolation', 'Drain trap fitted and primed', 'Noise level'],
      fire: [
        'Fire dampers (FD) on the FAHU connections — fitted and accessible',
        'Motorised smoke & fire dampers (MSFD) — fitted, accessible, labelled',
        'Fire damper access panels provided',
      ],
    },
  },
  exhaust_fan: {
    icon: 'pump',
    discs: ['electrical', 'hvac', 'fire'],
    items: {
      electrical: ['Power supply, isolator and labelling'],
      hvac: ['Fan operation and direction', 'Riser ductwork supports and sealing', 'Extract rates at branches — 15 L/s per WC', 'Vibration isolation'],
      fire: ['MSFD and FD fire dampers — fitted, accessible, labelled', 'Damper access panels provided'],
    },
  },
  condenser_bank: {
    icon: 'pump',
    discs: ['civil', 'electrical', 'hvac'],
    items: {
      civil: ['Plinths — level, no cracking, correct height', 'Access route and clearance between rows'],
      electrical: ['Isolators fitted and labelled per unit', 'Cable routing, support and UV protection', 'Earthing'],
      hvac: [
        'Units level and secure on mounts',
        'Anti-vibration mounts fitted',
        'Clearance to walls and adjacent units per manufacturer',
        'Refrigerant pipe supports and insulation — UV protected',
        'Condensate routing away from the membrane',
        'UNIT-TO-APARTMENT identification — record which unit serves which flat (query Q6)',
      ],
    },
  },
  drainage: {
    icon: 'tank',
    discs: ['civil', 'plumbing'],
    items: {
      civil: ['Manholes and inspection chambers — covers, frames, levels'],
      plumbing: [
        'Soil and waste stacks — supports, joints, no leaks',
        'Vent terminations at roof',
        'Access / rodding eyes provided and reachable',
        'Gullies and floor drains — trapped and clear',
        'Flow test at accessible points',
      ],
    },
  },
  water_risers: {
    icon: 'tank',
    discs: ['plumbing', 'fire'],
    items: {
      plumbing: [
        'Riser pipework — supports, alignment, insulation',
        'Valves labelled and operable at each floor',
        'Identification and flow direction marking',
        'No leaks at joints or unions',
        'Landlord CWS branches to garbage rooms and gym',
      ],
      fire: ['Fire stopping at every floor penetration'],
    },
  },
};

const FALLBACK: AreaChecklist = {
  icon: 'utility',
  discs: ['civil', 'electrical'],
  items: {
    civil: ['Door, frame and ironmongery', 'Floor finish', 'Wall finish', 'Ceiling finish'],
    electrical: ['Lighting operation', 'Switches, sockets and cover plates'],
  },
};

export function checklistFor(kind: AreaKind): AreaChecklist {
  return C[kind] ?? FALLBACK;
}
