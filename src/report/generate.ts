/**
 * Build the printable report HTML for a given State.
 *
 * - Every interpolation goes through escapeHtml(). No user input is ever
 *   inserted raw.
 * - Photos are read from IndexedDB and embedded as base64 data URLs so the
 *   print window is fully self-contained (no broken images, no blob URL
 *   leaks once the window closes).
 *
 * Returns a Promise<string> — the caller awaits, then writes to the
 * print window.
 */

import { escapeHtml as h } from '@/lib/escape';
import { collectSnags, statsForRoom, SEVERITY_LABEL, type SnagRecord } from '@/domain/snags';
import { HANDOVER_SECTIONS, HANDOVER_FOOTNOTE } from '@/domain/handoverDocs';
import { PROP_LABEL } from '@/domain/pricing';
import { formatDateLong, formatAED } from '@/lib/format';
import { getPhoto } from '@/storage/photos';
import type { State } from '@/state/schema';

const BRAND_CSS = `
  :root {
    --brand: #d10165;
    --dark: #1a1b1b;
    --grey: #5a5d5d;
    --light: #f6f6f6;
    --critical: #c0392b;
    --major: #e67e22;
    --minor: #2c3e50;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; color: #111; line-height: 1.5; }
  .page { padding: 24mm 16mm; max-width: 210mm; margin: 0 auto; }
  h1, h2, h3 { font-family: 'Syne', sans-serif; color: var(--dark); margin-bottom: 8px; }
  h1 { font-size: 36px; }
  h2 { font-size: 22px; color: var(--brand); margin-top: 24px; }
  h3 { font-size: 16px; margin-top: 12px; }
  .meta { color: var(--grey); font-size: 13px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
  .kpi { background: var(--light); border-radius: 8px; padding: 12px; text-align: center; }
  .kpi__n { font-size: 24px; font-weight: 700; color: var(--brand); }
  .kpi__l { font-size: 11px; color: var(--grey); text-transform: uppercase; letter-spacing: 1px; }
  .cover-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0 24px; }
  .cover-photo { background: var(--light); aspect-ratio: 4/3; border-radius: 8px; overflow: hidden; }
  .cover-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .snag { border-left: 4px solid var(--brand); padding: 12px 16px; margin: 12px 0; background: #fafafa; page-break-inside: avoid; }
  .snag--critical { border-left-color: var(--critical); }
  .snag--major { border-left-color: var(--major); }
  .snag__head { display: flex; justify-content: space-between; font-size: 12px; color: var(--grey); }
  .snag__title { font-weight: 600; margin: 4px 0; }
  .snag__photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; margin-top: 10px; }
  .snag__photos img { width: 100%; height: 160px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: white; background: var(--minor); }
  .pill--critical { background: var(--critical); }
  .pill--major { background: var(--major); }
  .room { margin: 24px 0; page-break-inside: avoid; }
  .room__title { display: flex; justify-content: space-between; align-items: baseline; }
  .handover { background: var(--light); border-radius: 8px; padding: 16px 20px; margin: 12px 0; }
  .handover h3 { color: var(--brand); border-bottom: 2px solid var(--brand); padding-bottom: 4px; }
  .footnote { font-style: italic; color: var(--grey); margin-top: 16px; }
  .not-applicable { background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #6b5d00; }
  @media print { @page { size: A4; margin: 14mm; } .no-print { display: none; } }
`;

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function loadPhotoMap(state: State): Promise<Map<string, string>> {
  const ids = new Set<string>();
  for (const id of state.coverPhotoIds) {
    if (id) ids.add(id);
  }
  for (const room of Object.values(state.rooms)) {
    for (const item of Object.values(room.items)) {
      for (const obs of item.observations) {
        for (const pid of obs.photoIds) ids.add(pid);
      }
    }
  }
  const map = new Map<string, string>();
  await Promise.all(
    [...ids].map(async (id) => {
      const rec = await getPhoto(id);
      if (rec) {
        try {
          map.set(id, await blobToDataUrl(rec.blob));
        } catch {
          /* skip unreadable photo */
        }
      }
    }),
  );
  return map;
}

function kpis(state: State, snags: SnagRecord[]): string {
  const inspectedRooms = state.roomOrder
    .map((id) => state.rooms[id])
    .filter((r): r is NonNullable<typeof r> => !!r && !r.excluded).length;
  const critical = snags.filter((s) => s.severity === 'critical').length;
  const major = snags.filter((s) => s.severity === 'major').length;
  return `
    <div class="kpis">
      <div class="kpi"><div class="kpi__n">${inspectedRooms}</div><div class="kpi__l">Rooms inspected</div></div>
      <div class="kpi"><div class="kpi__n">${snags.length}</div><div class="kpi__l">Total snags</div></div>
      <div class="kpi"><div class="kpi__n">${critical}</div><div class="kpi__l">Critical</div></div>
      <div class="kpi"><div class="kpi__n">${major}</div><div class="kpi__l">Major</div></div>
    </div>
  `;
}

function coverPhotosHtml(state: State, photos: Map<string, string>): string {
  const slots = state.coverPhotoIds.filter((id): id is string => !!id && photos.has(id));
  if (slots.length === 0) return '';
  return `
    <div class="cover-photos">
      ${slots.map((id) => `<div class="cover-photo"><img src="${photos.get(id)!}" alt="Cover photo" /></div>`).join('')}
    </div>
  `;
}

function coverPage(state: State, snags: SnagRecord[], photos: Map<string, string>): string {
  const followUp = state.job.reportType === 'follow-up';
  return `
    <section class="page">
      <h1>${h(followUp ? 'Follow-Up Inspection — DLP Review' : 'Property Condition Report')}</h1>
      <p class="meta">${h(state.job.ref)} · ${h(formatDateLong(state.job.date))}</p>
      <h2>${h(PROP_LABEL[state.property.type])}</h2>
      <p>${h(state.property.developer)} · ${h(state.property.community)}${state.property.unit ? ` · Unit ${h(state.property.unit)}` : ''}</p>
      <p class="meta">Prepared for ${h(state.client.name || '—')} ${state.client.phone ? `· ${h(state.client.phone)}` : ''}</p>
      ${coverPhotosHtml(state, photos)}
      ${kpis(state, snags)}
    </section>
  `;
}

function handoverPage(): string {
  return `
    <section class="page">
      <h1>Handover Documents</h1>
      <p class="meta">Checklist of documents the developer should provide on handover.</p>
      ${HANDOVER_SECTIONS.map(
        (sec) => `
        <div class="handover">
          <h3>${h(sec.title)}</h3>
          <ul>
            ${sec.items.map((it) => `<li>☐ ${h(it)}</li>`).join('')}
          </ul>
        </div>
      `,
      ).join('')}
      <p class="footnote">${h(HANDOVER_FOOTNOTE)}</p>
    </section>
  `;
}

function snagBlock(s: SnagRecord, photos: Map<string, string>): string {
  const photoHtml = s.photoIds.length
    ? `<div class="snag__photos">${s.photoIds
        .map((pid) => {
          const url = photos.get(pid);
          return url ? `<img src="${url}" alt="Snag photo" />` : '';
        })
        .join('')}</div>`
    : '';
  return `
    <div class="snag snag--${s.severity}">
      <div class="snag__head">
        <span>${h(s.id)} · ${h(s.roomLabel)}${s.dbNum ? ` · DB ${s.dbNum}` : ''}</span>
        <span class="pill pill--${s.severity}">${h(SEVERITY_LABEL[s.severity])}</span>
      </div>
      <div class="snag__title">${h(s.itemLabel)}</div>
      <div>${h(s.text || '—')}</div>
      ${photoHtml}
    </div>
  `;
}

function roomSection(
  state: State,
  roomId: string,
  snags: SnagRecord[],
  photos: Map<string, string>,
): string {
  const room = state.rooms[roomId];
  if (!room || room.excluded) return '';
  const roomSnags = snags.filter((s) => s.roomId === roomId);
  const st = statsForRoom(room);
  return `
    <section class="room">
      <div class="room__title">
        <h2>${h(room.label)}</h2>
        <span class="meta">${st.inspected}/${st.total} inspected · ${st.issue} issues</span>
      </div>
      ${roomSnags.map((s) => snagBlock(s, photos)).join('') || '<p class="meta">No issues recorded.</p>'}
    </section>
  `;
}

function notApplicableBlock(state: State): string {
  const hidden = state.roomOrder
    .map((id) => state.rooms[id])
    .filter((r): r is NonNullable<typeof r> => !!r && r.excluded);
  if (hidden.length === 0) return '';
  return `
    <div class="not-applicable">
      <strong>Not applicable to this property:</strong>
      ${hidden.map((r) => h(r.label)).join(' · ')}
    </div>
  `;
}

function criticalSummary(snags: SnagRecord[], photos: Map<string, string>): string {
  return `
    <section class="page">
      <h1>Critical issues summary</h1>
      ${snags
        .filter((s) => s.severity === 'critical')
        .map((s) => snagBlock(s, photos))
        .join('') || '<p class="meta">No critical issues recorded.</p>'}
    </section>
  `;
}

export async function generateReportHtml(state: State): Promise<string> {
  const snags = collectSnags(state);
  const photos = await loadPhotoMap(state);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${h(state.job.ref)} — SnaggingPro Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>${BRAND_CSS}</style>
</head>
<body>
  ${coverPage(state, snags, photos)}
  ${handoverPage()}
  ${criticalSummary(snags, photos)}
  <section class="page">
    <h1>Room-by-room findings</h1>
    ${notApplicableBlock(state)}
    ${state.roomOrder.map((id) => roomSection(state, id, snags, photos)).join('')}
  </section>
  <p style="text-align:center;padding:20px;color:#999;font-size:12px">
    Generated by SnaggingPro · ${h(formatDateLong(state.job.date))} · ${snags.length} snags · ${formatAED(state.property.price)} fee
  </p>
</body>
</html>`;
}
