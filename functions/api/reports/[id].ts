/**
 * /api/reports/:id
 *   GET    → full State JSON
 *   DELETE → drop report + its photos (D1 row + R2 objects)
 *
 * PUT is intentionally not exposed — clients use POST /api/reports for
 * upserts so the server is the source of truth for summary derivation.
 */

import { json, err, type Env, type ReportRow } from '../../types';

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = String(params.id);
  const row = await env.DB.prepare('SELECT state_json FROM reports WHERE id = ?1')
    .bind(id)
    .first<Pick<ReportRow, 'state_json'>>();
  if (!row) return err(404, 'Report not found.');
  try {
    return json(JSON.parse(row.state_json));
  } catch {
    return err(500, 'Stored state is corrupt.');
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const id = String(params.id);
  // Photos: walk the index and delete each R2 object, then the rows.
  const { results } = await env.DB.prepare('SELECT id FROM photos WHERE job_ref = ?1')
    .bind(id)
    .all<{ id: string }>();
  await Promise.all(results.map((r) => env.PHOTOS.delete(r.id)));
  await env.DB.batch([
    env.DB.prepare('DELETE FROM photos WHERE job_ref = ?1').bind(id),
    env.DB.prepare('DELETE FROM reports WHERE id = ?1').bind(id),
  ]);
  return json({ deleted: id });
};
