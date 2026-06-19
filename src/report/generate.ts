/**
 * Build the printable report HTML for a given State.
 * Every interpolation goes through escapeHtml(). No user input is ever
 * inserted raw.
 */

import { escapeHtml as h } from '@/lib/escape';
import { collectSnags, statsForRoom, SEVERITY_LABEL, type SnagRecord } from '@/domain/snags';
import { DISC_LABELS } from '@/domain/disciplines';
import { HANDOVER_SECTIONS, HANDOVER_FOOTNOTE } from '@/domain/handoverDocs';
import { PROP_LABEL } from '@/domain/pricing';
import { formatDateLong, formatAED } from '@/lib/format';
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
  .snag { border-left: 4px solid var(--brand); padding: 12px 16px; margin: 12px 0; background: #fafafa; page-break-inside: avoid; }
  .snag--critical { border-left-color: var(--critical); }
  .snag--major { border-left-color: var(--major); }
  .snag__head { display: flex; justify-content: space-between; font-size: 12px; color: var(--grey); }
  .snag__title { font-weight: 600; margin: 4px 0; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: white; background: var(--minor); }
  .pill--critical { background: var(--critical); }
  .pill--major { background: var(--major); }
  .room { margin: 24px 0; page-break-inside: avoid; }
  .room__title { display: flex; justify-content: space-between; align-items: baseline; }
  .handover { background: var(--light); border-radius: 8px; padding: 16px 20px; margin: 12px 0; }
  .handover h3 { color: var(--brand); border-bottom: 2px solid var(--brand); padding-bottom: 4px; }
  .footnote { font-style: italic; color: var(--grey); margin-top: 16px; }
  @media print { @page { size: A4; margin: 14mm; } .no-print { display: none; } }
`;

function kpis(state: State, snags: SnagRecord[]): string {
  const inspectedRooms = state.roomOrder
    .map((id) => state.rooms[id])
    .filter((r): r is NonNullable<typeof r> => !!r && !r.excluded).length;
  const critical = snags.filter((s) => s.severity === 'critical').length;
  return `
    <div class="kpis">
      <div class="kpi"><div class="kpi__n">${inspectedRooms}</div><div class="kpi__l">Rooms inspected</div></div>
      <div class="kpi"><div class="kpi__n">${snags.length}</div><div class="kpi__l">Total snags</div></div>
      <div class="kpi"><div class="kpi__n">${critical}</div><div class="kpi__l">Critical</div></div>
      <div class="kpi"><div class="kpi__n">${state.coverPhotoIds.filter(Boolean).length}</div><div class="kpi__l">Cover photos</div></div>
    </div>
  `;
}

function coverPage(state: State, snags: SnagRecord[]): string {
  const followUp = state.job.reportType === 'follow-up';
  return `
    <section class="page">
      <h1>${h(followUp ? 'Follow-Up Inspection — DLP Review' : 'Property Condition Report')}</h1>
      <p class="meta">${h(state.job.ref)} · ${h(formatDateLong(state.job.date))}</p>
      <h2>${h(PROP_LABEL[state.property.type])}</h2>
      <p>${h(state.property.developer)} · ${h(state.property.community)}${state.property.unit ? ` · Unit ${h(state.property.unit)}` : ''}</p>
      <p class="meta">Prepared for ${h(state.client.name || '—')} ${state.client.phone ? `· ${h(state.client.phone)}` : ''}</p>
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

function snagBlock(s: SnagRecord): string {
  return `
    <div class="snag snag--${s.severity}">
      <div class="snag__head">
        <span>${h(s.id)} · ${h(s.roomLabel)}${s.dbNum ? ` · DB ${s.dbNum}` : ''}</span>
        <span class="pill pill--${s.severity}">${h(SEVERITY_LABEL[s.severity])}</span>
      </div>
      <div class="snag__title">${h(s.itemLabel)}</div>
      <div>${h(s.text || '—')}</div>
    </div>
  `;
}

function roomSection(state: State, roomId: string, snags: SnagRecord[]): string {
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
      ${roomSnags.map(snagBlock).join('') || '<p class="meta">No issues recorded.</p>'}
    </section>
  `;
}

function disciplineSummary(snags: SnagRecord[]): string {
  const groups = new Map<string, SnagRecord[]>();
  for (const s of snags) {
    const key = (Object.keys(DISC_LABELS) as (keyof typeof DISC_LABELS)[]).find(
      (d) => s.itemLabel.toLowerCase().includes(d),
    );
    const k = key ?? 'other';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }
  return `
    <section class="page">
      <h1>Critical issues summary</h1>
      ${snags
        .filter((s) => s.severity === 'critical')
        .map(snagBlock)
        .join('') || '<p class="meta">No critical issues recorded.</p>'}
    </section>
  `;
}

export function generateReportHtml(state: State): string {
  const snags = collectSnags(state);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${h(state.job.ref)} — SnaggingPro Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>${BRAND_CSS}</style>
</head>
<body>
  ${coverPage(state, snags)}
  ${handoverPage()}
  ${disciplineSummary(snags)}
  <section class="page">
    <h1>Room-by-room findings</h1>
    ${state.roomOrder.map((id) => roomSection(state, id, snags)).join('')}
  </section>
  <p style="text-align:center;padding:20px;color:#999;font-size:12px">
    Generated by SnaggingPro · ${h(formatDateLong(state.job.date))} · ${snags.length} snags · ${formatAED(state.property.price)} fee
  </p>
</body>
</html>`;
}
