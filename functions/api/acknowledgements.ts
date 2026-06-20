/**
 * /api/acknowledgements
 *   POST → public. Client submits typed name + signature PNG (base64).
 *          Server stamps timestamp, IP, country/city (from cf-* headers),
 *          and user-agent. Signature stored in PHOTOS bucket under
 *          signatures/<id>.png.
 *   GET  → authenticated. ?jobRef=<ref> returns rows for one job;
 *          ?id=<id> returns one row.
 */

import { json, err, rowToAck, type AcknowledgementRow, type Env } from '../types';

interface PostBody {
  jobRef?: string;
  clientName?: string;
  unit?: string;
  typedName?: string;
  signaturePngBase64?: string;
}

function newId(): string {
  return crypto.randomUUID();
}

function decodeBase64Png(dataUrl: string): Uint8Array | null {
  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl.trim());
  if (!m) return null;
  try {
    const bin = atob(m[1]!);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: PostBody;
  try {
    body = await request.json<PostBody>();
  } catch {
    return err(400, 'Body must be JSON.');
  }
  const jobRef = (body.jobRef ?? '').trim();
  const typedName = (body.typedName ?? '').trim();
  const clientName = (body.clientName ?? '').trim();
  const unit = (body.unit ?? '').trim();
  if (!jobRef) return err(400, 'jobRef required.');
  if (typedName.length < 2) return err(400, 'typedName required.');

  const id = newId();
  const now = Date.now();

  let signatureKey: string | null = null;
  if (body.signaturePngBase64) {
    const bytes = decodeBase64Png(body.signaturePngBase64);
    if (!bytes) return err(400, 'signaturePngBase64 must be a data:image/png;base64 URL.');
    if (bytes.byteLength > 512 * 1024) return err(400, 'Signature exceeds 512KB.');
    // R2 binding may not be configured yet — record the ack anyway so the
    // signing event is still captured. The signature image is then missing
    // from the audit trail until the binding is added.
    if (env.PHOTOS) {
      try {
        signatureKey = `signatures/${id}.png`;
        await env.PHOTOS.put(signatureKey, bytes, {
          httpMetadata: { contentType: 'image/png' },
        });
      } catch {
        signatureKey = null;
      }
    }
  }

  const cf = (request as unknown as { cf?: { country?: string; city?: string } }).cf ?? {};
  const ip = request.headers.get('CF-Connecting-IP') ?? null;
  const ua = request.headers.get('User-Agent') ?? null;
  const country = cf.country ?? null;
  const city = cf.city ?? null;

  await env.DB.prepare(
    `INSERT INTO acknowledgements (
       id, job_ref, client_name, unit, typed_name, signature_key,
       eid_front_key, eid_back_key, ip_address, user_agent,
       country, city, acknowledged_at
     ) VALUES (?1,?2,?3,?4,?5,?6,NULL,NULL,?7,?8,?9,?10,?11)`,
  )
    .bind(id, jobRef, clientName, unit, typedName, signatureKey, ip, ua, country, city, now)
    .run();

  return json({ id, acknowledgedAt: now });
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const jobRef = url.searchParams.get('jobRef');
  const id = url.searchParams.get('id');

  // No filter → return every ack (most-recent first, capped). Used by the
  // Library to decorate rows with a "Signed" badge without one query per row.
  if (!jobRef && !id) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM acknowledgements ORDER BY acknowledged_at DESC LIMIT 1000',
    ).all<AcknowledgementRow>();
    return json({ acknowledgements: results.map(rowToAck) });
  }

  const stmt = id
    ? env.DB.prepare('SELECT * FROM acknowledgements WHERE id = ?1').bind(id)
    : env.DB.prepare(
        'SELECT * FROM acknowledgements WHERE job_ref = ?1 ORDER BY acknowledged_at DESC',
      ).bind(jobRef!);
  const { results } = await stmt.all<AcknowledgementRow>();
  return json({ acknowledgements: results.map(rowToAck) });
};
