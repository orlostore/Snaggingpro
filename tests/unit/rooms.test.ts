import { describe, it, expect } from 'vitest';
import { buildRooms } from '@/domain/rooms';

describe('buildRooms', () => {
  it('villa 3BR includes booster pump and water tanks', () => {
    const rooms = buildRooms({ propType: 'villa', bedrooms: 3 });
    const ids = rooms.map((r) => r.id);
    expect(ids).toContain('booster_pump_room');
    expect(ids).toContain('water_tank_ground');
    expect(ids).toContain('water_tank_roof');
    expect(ids).toContain('solar_water_heater');
    expect(ids).toContain('guest_washroom');
  });

  it('1BR apartment excludes villa-only rooms', () => {
    const rooms = buildRooms({ propType: 'apartment', bedrooms: 1 });
    const ids = rooms.map((r) => r.id);
    expect(ids).not.toContain('booster_pump_room');
    expect(ids).not.toContain('garage');
  });

  it('3BR apartment gets guest washroom', () => {
    const rooms = buildRooms({ propType: 'apartment', bedrooms: 3 });
    expect(rooms.map((r) => r.id)).toContain('guest_washroom');
  });

  it('studio gets no living room but does get studio_space', () => {
    const rooms = buildRooms({ propType: 'apartment', bedrooms: 0 });
    const ids = rooms.map((r) => r.id);
    expect(ids).toContain('studio_space');
    expect(ids).not.toContain('living');
  });
});
