/**
 * /api/photos/:id
 *   GET    → R2 stream of the photo blob
 *   PUT    → upload; body is the raw blob, headers carry job_ref + kind
 *   DELETE → R2 + D1 row
 *
 * Required headers on PUT:
 *   X-Job-Ref:  the jobRef the photo belongs to
 *   X-Kind:     one of cover|overview|snag|annotated|rectification
 *   Content-Type: e.g. image/webp
 */

import { err, json, type Env } from '../../types';

const KINDS = new Set(['cover', 'overview', 'snag', 'annotated', 'rectification']);

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = String(params.id);
  const obj = await env.PHOTOS.get(id);
  if (!obj) return err(404, 'Photo not found.');
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
};

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = String(params.id);
  const jobRef = request.headers.get('X-Job-Ref');
  const kind = request.headers.get('X-Kind') ?? '';
  const contentType = request.headers.get('Content-Type') ?? 'image/webp';
  if (!jobRef) return err(400, 'X-Job-Ref header required.');
  if (!KINDS.has(kind)) return err(400, 'X-Kind header must be one of: ' + [...KINDS].join(', '));
  if (!request.body) return err(400, 'Body must be the photo bytes.');

  // We need the full body in memory so we can write D1 + R2 atomically-ish.
  const buf = await request.arrayBuffer();
  if (buf.byteLength === 0) return err(400, 'Empty body.');

  await env.PHOTOS.put(id, buf, { httpMetadata: { contentType } });
  await env.DB.prepare(
    `INSERT INTO photos (id, job_ref, kind, content_type, size, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT(id) DO UPDATE SET
       job_ref = excluded.job_ref,
       kind = excluded.kind,
       content_type = excluded.content_type,
       size = excluded.size`,
  )
    .bind(id, jobRef, kind, contentType, buf.byteLength, Date.now())
    .run();

  return json({ id, size: buf.byteLength });
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const id = String(params.id);
  await env.PHOTOS.delete(id);
  await env.DB.prepare('DELETE FROM photos WHERE id = ?1').bind(id).run();
  return json({ deleted: id });
};
