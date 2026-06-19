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
import { DISC_LABELS, DISCIPLINE_ORDER, type Discipline } from '@/domain/disciplines';
import { HANDOVER_SECTIONS, HANDOVER_FOOTNOTE } from '@/domain/handoverDocs';
import { PROP_LABEL } from '@/domain/pricing';
import { formatDateLong, formatAED } from '@/lib/format';
import { getPhoto } from '@/storage/photos';
import type { RoomState, State } from '@/state/schema';

const BRAND_CSS = `
  :root {
    --brand: #1e3a5f;
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
  .rect-block { margin-top: 10px; padding: 10px 12px; background: #f6f9fb; border-left: 3px solid #2f6dbb; border-radius: 6px; }
  .rect-block--fixed { border-left-color: #0f7a44; background: #f1faf4; }
  .rect-block--new { border-left-color: #b6221b; background: #fbf3f3; }
  .rect-block--open { border-left-color: #a16207; background: #fbf6ea; }
  .rect-block__head { display: flex; gap: 10px; align-items: center; font-size: 12px; }
  .rect-block__pill { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; letter-spacing: 1px; font-weight: 700; color: white; }
  .rect-block__pill--fixed { background: #0f7a44; }
  .rect-block__pill--new { background: #b6221b; }
  .rect-block__pill--open { background: #a16207; }
  .rect-block__title { color: var(--grey); }
  .rect-block__note { margin-top: 6px; }
  .checkpoints { background: var(--light); border-radius: 8px; padding: 14px 16px; margin: 12px 0 16px; }
  .checkpoints h3 { color: var(--dark); margin: 0; font-size: 14px; }
  .checkpoints .meta { font-size: 12px; margin-top: 2px; }
  .cp__group { margin-top: 12px; page-break-inside: avoid; }
  .cp__disc { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: var(--brand); border-bottom: 1px solid #d6d8db; padding-bottom: 4px; margin-bottom: 6px; }
  .cp__list { list-style: none; padding: 0; margin: 0; }
  .cp__item { display: flex; gap: 8px; padding: 3px 0; font-size: 12px; line-height: 1.45; align-items: baseline; }
  .cp__mark { display: inline-block; width: 16px; flex-shrink: 0; text-align: center; font-weight: 700; }
  .cp__mark--pass { color: #0f7a44; }
  .cp__mark--issue { color: #b6221b; }
  .cp__mark--na { color: var(--grey); }
  .cp__mark--pending { color: var(--grey); }
  .cp__label { flex: 1; }
  .cp__ref { color: var(--grey); }
  .cp__db { display: inline-block; background: rgba(47,109,170,0.10); color: #2f6dbb; padding: 0 6px; border-radius: 99px; font-size: 10px; font-weight: 600; margin-right: 4px; }
  .room__findings-title { font-size: 14px; color: var(--dark); margin: 18px 0 6px; border-top: 1px solid #e2e4e9; padding-top: 12px; }
  .ba { margin-top: 8px; }
  .ba__label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--grey); margin-bottom: 4px; }
  .ba--before .ba__label { color: #5a5d63; }
  .ba--after  .ba__label { color: #0f7a44; }
  .ba--new    .ba__label { color: #b6221b; }
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

  if (state.job.reportType === 'follow-up') {
    const fixed = snags.filter((s) => s.rectification === 'fixed').length;
    const open = snags.filter((s) => s.rectification === 'open' || !s.rectification).length;
    const newOnes = snags.filter((s) => s.rectification === 'new').length;
    return `
      <div class="kpis">
        <div class="kpi"><div class="kpi__n">${snags.length}</div><div class="kpi__l">Original snags</div></div>
        <div class="kpi"><div class="kpi__n">${fixed}</div><div class="kpi__l">Fixed</div></div>
        <div class="kpi"><div class="kpi__n">${open}</div><div class="kpi__l">Still open</div></div>
        <div class="kpi"><div class="kpi__n">${newOnes}</div><div class="kpi__l">New issues</div></div>
      </div>
    `;
  }

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

function photoGrid(ids: string[], photos: Map<string, string>, label: string): string {
  if (ids.length === 0) return '';
  const imgs = ids
    .map((pid) => {
      const url = photos.get(pid);
      return url ? `<img src="${url}" alt="${h(label)}" />` : '';
    })
    .join('');
  return `<div class="snag__photos">${imgs}</div>`;
}

function labelledPhotoGrid(
  ids: string[],
  photos: Map<string, string>,
  label: string,
  variant: 'before' | 'after' | 'new',
): string {
  if (ids.length === 0) return '';
  return `
    <div class="ba ba--${variant}">
      <div class="ba__label">${h(label)}</div>
      ${photoGrid(ids, photos, label)}
    </div>
  `;
}

const RECT_LABEL: Record<'fixed' | 'open' | 'new', string> = {
  fixed: 'FIXED',
  open: 'STILL OPEN',
  new: 'NEW ISSUE',
};

function rectificationBlock(s: SnagRecord, photos: Map<string, string>): string {
  if (!s.rectification) return '';
  const note = s.rectificationNote?.trim() || '';
  const photoIds = s.rectificationPhotoIds ?? [];
  const photoLabel =
    s.rectification === 'fixed' ? 'After — closeout photos' :
    s.rectification === 'new'   ? 'New finding — photos' :
    '';
  const sectionTitle =
    s.rectification === 'fixed' ? 'Closeout' :
    s.rectification === 'new'   ? 'New finding' :
    'Still pending rectification';
  return `
    <div class="rect-block rect-block--${s.rectification}">
      <div class="rect-block__head">
        <span class="rect-block__pill rect-block__pill--${s.rectification}">${RECT_LABEL[s.rectification]}</span>
        <span class="rect-block__title">${sectionTitle}</span>
      </div>
      ${note ? `<div class="rect-block__note">${h(note)}</div>` : ''}
      ${
        photoIds.length
          ? labelledPhotoGrid(
              photoIds,
              photos,
              photoLabel,
              s.rectification === 'fixed' ? 'after' : s.rectification === 'new' ? 'new' : 'before',
            )
          : ''
      }
    </div>
  `;
}

function snagBlock(s: SnagRecord, photos: Map<string, string>): string {
  // Show 'Before' label on the original photos only when this snag is part
  // of a follow-up (i.e. it carries a rectification block underneath).
  const photosHtml =
    s.rectification != null
      ? labelledPhotoGrid(s.photoIds, photos, 'Before — original snag', 'before')
      : photoGrid(s.photoIds, photos, 'Snag photo');
  return `
    <div class="snag snag--${s.severity}">
      <div class="snag__head">
        <span>${h(s.id)} · ${h(s.roomLabel)}${s.dbNum ? ` · DB ${s.dbNum}` : ''}</span>
        <span class="pill pill--${s.severity}">${h(SEVERITY_LABEL[s.severity])}</span>
      </div>
      <div class="snag__title">${h(s.itemLabel)}</div>
      <div>${h(s.text || '—')}</div>
      ${photosHtml}
      ${rectificationBlock(s, photos)}
    </div>
  `;
}

function statusIcon(status: 'pending' | 'pass' | 'issue' | 'na'): string {
  switch (status) {
    case 'pass':  return '<span class="cp__mark cp__mark--pass">✓</span>';
    case 'issue': return '<span class="cp__mark cp__mark--issue">⚠</span>';
    case 'na':    return '<span class="cp__mark cp__mark--na">—</span>';
    case 'pending': default:
                  return '<span class="cp__mark cp__mark--pending">·</span>';
  }
}

function checkpointsBlock(room: RoomState, snags: SnagRecord[]): string {
  const items = Object.values(room.items);
  if (items.length === 0) return '';

  // Group by discipline in the canonical order
  const grouped = new Map<Discipline, typeof items>();
  for (const it of items) {
    if (!grouped.has(it.disc)) grouped.set(it.disc, []);
    grouped.get(it.disc)!.push(it);
  }
  const orderedDiscs = DISCIPLINE_ORDER.filter((d) => grouped.has(d));

  const snagByItemKey = new Map<string, SnagRecord[]>();
  for (const s of snags) {
    if (!snagByItemKey.has(s.itemKey)) snagByItemKey.set(s.itemKey, []);
    snagByItemKey.get(s.itemKey)!.push(s);
  }

  return `
    <div class="checkpoints">
      <h3>Inspection checkpoints</h3>
      <p class="meta">Every item walked through during this inspection.</p>
      ${orderedDiscs
        .map((disc) => {
          const list = grouped.get(disc)!;
          return `
        <div class="cp__group">
          <h4 class="cp__disc">${h(DISC_LABELS[disc])} · ${list.length} item${list.length === 1 ? '' : 's'}</h4>
          <ul class="cp__list">
            ${list
              .map((it) => {
                const refs = snagByItemKey.get(it.key) ?? [];
                const refTxt = refs.length ? ` <span class="cp__ref">(see ${refs.map((r) => h(r.id)).join(', ')})</span>` : '';
                const sev = refs.length && refs[0]?.severity ? ` <span class="pill pill--${refs[0]!.severity}">${h(SEVERITY_LABEL[refs[0]!.severity])}</span>` : '';
                const db = it.dbNum ? ` <span class="cp__db">DB ${it.dbNum}</span>` : '';
                return `<li class="cp__item">${statusIcon(it.status)}<span class="cp__label">${h(it.label)}${db}${sev}${refTxt}</span></li>`;
              })
              .join('')}
          </ul>
        </div>
      `;
        })
        .join('')}
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
  const isFollowUp = state.job.reportType === 'follow-up';
  // Follow-up closing reports skip the full checkpoint list — Pass / N/A items
  // from the original inspection are noise here. The findings (each carrying
  // its rectification block) show everything the customer needs.
  return `
    <section class="room">
      <div class="room__title">
        <h2>${h(room.label)}</h2>
        <span class="meta">${
          isFollowUp
            ? `${roomSnags.length} original snag${roomSnags.length === 1 ? '' : 's'} carried over`
            : `${st.inspected}/${st.total} inspected · ${st.pass} pass · ${st.issue} issue · ${st.na} N/A`
        }</span>
      </div>
      ${isFollowUp ? '' : checkpointsBlock(room, roomSnags)}
      ${isFollowUp ? '' : '<h3 class="room__findings-title">Findings</h3>'}
      ${roomSnags.map((s) => snagBlock(s, photos)).join('') || `<p class="meta">${isFollowUp ? 'No original snags in this room.' : 'No issues recorded.'}</p>`}
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

function rectificationSummary(snags: SnagRecord[], photos: Map<string, string>): string {
  const fixed = snags.filter((s) => s.rectification === 'fixed');
  const open = snags.filter((s) => s.rectification === 'open' || !s.rectification);
  const newOnes = snags.filter((s) => s.rectification === 'new');

  const block = (title: string, list: SnagRecord[]): string => {
    if (list.length === 0) {
      return `<h2>${h(title)}</h2><p class="meta">None.</p>`;
    }
    return `<h2>${h(title)} · ${list.length}</h2>${list.map((s) => snagBlock(s, photos)).join('')}`;
  };

  return `
    <section class="page">
      <h1>Rectification summary</h1>
      <p class="meta">Status of every original snag at follow-up inspection.</p>
      ${block('Still open', open)}
      ${block('Fixed', fixed)}
      ${block('New issues', newOnes)}
    </section>
  `;
}

export async function generateReportHtml(state: State): Promise<string> {
  const snags = collectSnags(state);
  const photos = await loadPhotoMap(state);
  const isFollowUp = state.job.reportType === 'follow-up';
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
  ${isFollowUp ? rectificationSummary(snags, photos) : handoverPage()}
  ${isFollowUp ? '' : criticalSummary(snags, photos)}
  <section class="page">
    <h1>${isFollowUp ? 'Room-by-room rectification' : 'Room-by-room findings'}</h1>
    ${notApplicableBlock(state)}
    ${state.roomOrder.map((id) => roomSection(state, id, snags, photos)).join('')}
  </section>
  <p style="text-align:center;padding:20px;color:#999;font-size:12px">
    Generated by SnaggingPro · ${h(formatDateLong(state.job.date))} · ${snags.length} snags · ${formatAED(state.property.price)} fee
  </p>
</body>
</html>`;
}
