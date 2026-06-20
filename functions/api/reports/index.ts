/**
 * /api/reports
 *   GET  → list summaries (newest first), optional ?since=<ts> for delta sync
 *   POST → upsert a report. Body: full State JSON.
 *           Server derives summary columns from the state.
 */

import { json, err, rowToSummary, type Env, type ReportRow } from '../../types';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const since = Number(url.searchParams.get('since') ?? '0');
  const stmt = since > 0
    ? env.DB.prepare(
        'SELECT * FROM reports WHERE updated_at > ?1 ORDER BY updated_at DESC',
      ).bind(since)
    : env.DB.prepare('SELECT * FROM reports ORDER BY updated_at DESC');
  const { results } = await stmt.all<ReportRow>();
  return json({ summaries: results.map(rowToSummary) });
};

interface StateLike {
  job: {
    ref: string;
    date: string;
    createdAt: number;
    updatedAt: number;
    reportType: 'original' | 'follow-up';
    parentReportId: string | null;
    status: 'draft' | 'completed';
  };
  client: { name: string };
  property: {
    type: string;
    developer: string;
    community: string;
    unit: string;
  };
  roomOrder: string[];
  rooms: Record<string, {
    excluded: boolean;
    items: Record<string, {
      status: 'pending' | 'pass' | 'issue' | 'na';
      severity?: 'critical' | 'major' | 'minor';
      observations: { severity?: 'critical' | 'major' | 'minor' }[];
    }>;
  }>;
}

function summarise(state: StateLike): { total: number; critical: number } {
  let total = 0;
  let critical = 0;
  for (const roomId of state.roomOrder) {
    const room = state.rooms[roomId];
    if (!room || room.excluded) continue;
    for (const item of Object.values(room.items)) {
      if (item.status !== 'issue') continue;
      if (item.observations.length === 0) {
        total++;
        if ((item.severity ?? 'minor') === 'critical') critical++;
        continue;
      }
      for (const obs of item.observations) {
        total++;
        if ((obs.severity ?? item.severity ?? 'minor') === 'critical') critical++;
      }
    }
  }
  return { total, critical };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let state: StateLike;
  try {
    state = await request.json<StateLike>();
  } catch {
    return err(400, 'Body must be JSON-encoded State.');
  }
  if (!state?.job?.ref) return err(400, 'state.job.ref missing.');

  const { total, critical } = summarise(state);
  const id = state.job.ref;
  const now = Date.now();
  const updatedAt = state.job.updatedAt > 0 ? state.job.updatedAt : now;

  await env.DB.prepare(
    `INSERT INTO reports (
       id, job_ref, report_type, parent_report_id, client_name, developer,
       community, unit, property_type, date, created_at, updated_at,
       total_snags, critical_snags, status, state_json
     ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16)
     ON CONFLICT(id) DO UPDATE SET
       report_type = excluded.report_type,
       parent_report_id = excluded.parent_report_id,
       client_name = excluded.client_name,
       developer = excluded.developer,
       community = excluded.community,
       unit = excluded.unit,
       property_type = excluded.property_type,
       date = excluded.date,
       updated_at = excluded.updated_at,
       total_snags = excluded.total_snags,
       critical_snags = excluded.critical_snags,
       status = excluded.status,
       state_json = excluded.state_json`,
  )
    .bind(
      id,
      state.job.ref,
      state.job.reportType,
      state.job.parentReportId,
      state.client.name ?? '',
      state.property.developer ?? '',
      state.property.community ?? '',
      state.property.unit ?? '',
      state.property.type,
      state.job.date,
      state.job.createdAt > 0 ? state.job.createdAt : now,
      updatedAt,
      total,
      critical,
      state.job.status ?? 'draft',
      JSON.stringify(state),
    )
    .run();

  return json({ id, updatedAt });
};
