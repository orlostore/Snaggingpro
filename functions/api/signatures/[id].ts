/**
 * /api/signatures/:id
 *   GET → PNG of the client's drawn signature for an acknowledgement.
 *   Authenticated (middleware).
 */

import { err, type Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = String(params.id);
  const obj = await env.PHOTOS.get(`signatures/${id}.png`);
  if (!obj) return err(404, 'Signature not found.');
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
};
