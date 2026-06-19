/**
 * Forward migrations between STATE versions.
 * v0 = the legacy single-file shape (untyped).
 * v1 = current canonical shape (see schema.ts).
 *
 * Each migration is total: input the previous version, output the next.
 * Failing to migrate is fatal — the user will see a "couldn't restore" prompt.
 */

import { STATE_VERSION, StateZ, type State } from './schema';

type AnyState = { version?: number } & Record<string, unknown>;

function migrateV0ToV1(legacy: AnyState): unknown {
  // Best-effort port of the v0 STATE shape used by legacy/index.html.
  // We don't try to recover photo dataURLs — they will be lost.
  const propTypeRaw = (legacy['propType'] as string) || 'villa3';
  const propType = propTypeRaw.startsWith('villa')
    ? 'villa'
    : propTypeRaw === 'studio'
      ? 'apartment'
      : 'apartment';
  const bedrooms = propTypeRaw === 'studio'
    ? 0
    : propTypeRaw.startsWith('villa')
      ? parseInt(propTypeRaw.replace('villa', ''), 10) || 3
      : parseInt(propTypeRaw, 10) || 1;

  return {
    version: 1,
    job: {
      ref: legacy['jobRef'] || 'SP-LEGACY-000',
      date: legacy['date'] || new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reportType: 'original',
      parentReportId: null,
      status: 'draft',
    },
    client: {
      name: legacy['clientName'] || '',
      phone: legacy['phone'] || '',
      email: '',
    },
    property: {
      type: propType,
      developer: legacy['developer'] || '',
      community: legacy['community'] || '',
      unit: legacy['unit'] || '',
      floor: legacy['floor'] || '',
      bua: Number(legacy['bua']) || 0,
      bedrooms,
      price: Number(legacy['price']) || 0,
    },
    coverPhotoIds: [null, null, null],
    rooms: {},
    roomOrder: [],
    discLabels: legacy['discLabels'] || {},
  };
}

const MIGRATIONS: Record<number, (input: AnyState) => unknown> = {
  0: migrateV0ToV1,
};

export function migrate(input: unknown): State | null {
  let current = input as AnyState;
  let version = (current.version as number) ?? 0;
  while (version < STATE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return null;
    current = step(current) as AnyState;
    version = (current.version as number) ?? version + 1;
  }
  const parsed = StateZ.safeParse(current);
  return parsed.success ? parsed.data : null;
}
