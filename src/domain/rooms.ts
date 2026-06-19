/**
 * Room library — which rooms appear for which property type, with which disciplines.
 * Pure function — no DOM, no state mutation. Easy to test.
 */

import type { Discipline } from './disciplines';
import type { ChecklistKey } from './checklists';
import type { PropType } from './pricing';
import { isVillaLike } from './pricing';

export interface RoomTemplate {
  id: string;
  label: string;
  icon: string;
  clKey: ChecklistKey;
  discs: Discipline[];
  custom?: boolean;
}

export interface BuildRoomsInput {
  propType: PropType;
  bedrooms: number;
}

export function buildRooms({ propType, bedrooms }: BuildRoomsInput): RoomTemplate[] {
  const villa = isVillaLike(propType);
  const rooms: RoomTemplate[] = [];

  rooms.push({ id: 'kitchen', label: 'Kitchen', icon: 'kitchen', clKey: 'kitchen',
    discs: ['civil', 'electrical', 'hvac', 'plumbing'] });

  if (bedrooms === 0) {
    rooms.push({ id: 'studio_space', label: 'Studio Space', icon: 'bedroom', clKey: 'bedroom',
      discs: ['civil', 'electrical', 'hvac'] });
  } else {
    rooms.push({ id: 'living', label: 'Living / Dining', icon: 'living', clKey: 'living',
      discs: ['civil', 'electrical', 'hvac'] });
    for (let i = 1; i <= bedrooms; i++) {
      rooms.push({ id: `bedroom_${i}`, label: `Bedroom ${i}${i === 1 ? ' (Master)' : ''}`,
        icon: 'bedroom', clKey: 'bedroom', discs: ['civil', 'electrical', 'hvac'] });
    }
  }

  const bathroomCount = bedrooms === 0 ? 1 : villa ? bedrooms : bedrooms <= 2 ? 2 : bedrooms;
  for (let i = 1; i <= bathroomCount; i++) {
    rooms.push({ id: `bathroom_${i}`, label: `Bathroom ${i}${i === 1 ? ' (Master)' : ''}`,
      icon: 'bathroom', clKey: 'bathroom', discs: ['civil', 'electrical', 'hvac', 'plumbing'] });
  }

  if (villa || bedrooms >= 2) {
    rooms.push({ id: 'guest_washroom', label: "Guest's Washroom", icon: 'bathroom',
      clKey: 'bathroom', discs: ['civil', 'electrical', 'hvac', 'plumbing'] });
  }

  const balconyCount = bedrooms === 0 ? 1 : bedrooms <= 2 ? 2 : Math.min(bedrooms, 3);
  for (let i = 1; i <= balconyCount; i++) {
    rooms.push({ id: `balcony_${i}`, label: `Balcony ${i}`, icon: 'balcony', clKey: 'balcony',
      discs: ['civil', 'electrical', 'hvac', 'plumbing'] });
  }

  rooms.push({ id: 'db_panel', label: 'DB Panel(s)', icon: 'db', clKey: 'db', discs: ['electrical'] });
  rooms.push({ id: 'home_automation', label: 'Home Automation', icon: 'automation',
    clKey: 'homeAutomation', discs: ['automation'] });

  if (villa) {
    rooms.push({ id: 'external_facade', label: 'External Facade', icon: 'facade',
      clKey: 'externalFacade', discs: ['civil'] });
    rooms.push({ id: 'garage', label: 'Garage', icon: 'garage', clKey: 'garage',
      discs: ['civil', 'electrical', 'plumbing'] });
    rooms.push({ id: 'landscaping', label: 'Landscaping', icon: 'landscape', clKey: 'landscaping',
      discs: ['civil', 'electrical', 'plumbing'] });
    rooms.push({ id: 'staircase', label: 'Staircase', icon: 'staircase', clKey: 'staircase',
      discs: ['civil'] });
    rooms.push({ id: 'maid_room', label: "Maid's Room", icon: 'maid', clKey: 'maidRoom',
      discs: ['civil', 'electrical', 'hvac', 'plumbing'] });
    rooms.push({ id: 'utility_room', label: 'Utility Room', icon: 'utility', clKey: 'utilityRoom',
      discs: ['civil', 'electrical', 'plumbing'] });
    rooms.push({ id: 'roof_terrace', label: 'Roof Terrace', icon: 'terrace', clKey: 'roofTerrace',
      discs: ['civil', 'electrical', 'plumbing'] });
    rooms.push({ id: 'booster_pump_room', label: 'Booster Pump Room', icon: 'pump',
      clKey: 'boosterPumpRoom', discs: ['civil', 'mechanical', 'electrical'] });
    rooms.push({ id: 'water_tank_ground', label: 'Water Tank (Ground/Underground)', icon: 'tank',
      clKey: 'waterTankGround', discs: ['civil', 'mechanical', 'plumbing'] });
    rooms.push({ id: 'water_tank_roof', label: 'Water Tank (Roof)', icon: 'tank-roof',
      clKey: 'waterTankRoof', discs: ['civil', 'mechanical', 'plumbing'] });
    rooms.push({ id: 'solar_water_heater', label: 'Solar Water Heater', icon: 'solar',
      clKey: 'solarWaterHeater', discs: ['civil', 'mechanical', 'electrical', 'plumbing'] });
  }

  return rooms;
}
