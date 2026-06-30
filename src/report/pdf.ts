/**
 * Client-side PDF report builder — jsPDF native draw, one page at a
 * time. Photos are converted from WebP blobs to JPEG via canvas (only
 * one image in memory at a time so even big reports don't blow up
 * mobile devices).
 *
 * NOT a 1:1 replica of the HTML report — this is a compact, print-
 * ready PDF mirror of the same content. The HTML report (used by
 * window.print on desktop) stays available for high-fidelity layouts.
 */

import { jsPDF } from 'jspdf';
import { collectSnags, type SnagRecord, type Severity } from '@/domain/snags';
import { PROP_LABEL } from '@/domain/pricing';
import { formatDateLong } from '@/lib/format';
import { getPhoto } from '@/storage/photos';
import { HANDOVER_SECTIONS } from '@/domain/handoverDocs';
import type { State } from '@/state/schema';

const BRAND = '#1e3a5f';
const DIM = '#6b6f76';
const MUTED = '#4f535b';
const CRITICAL = '#b6221b';
const MAJOR = '#c2410c';
const PASS = '#0f7a44';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

const SEV_COLOR: Record<Severity, string> = {
  critical: CRITICAL,
  major: MAJOR,
  minor: DIM,
};

const SEV_LABEL: Record<Severity, string> = {
  critical: 'CRITICAL',
  major: 'MAJOR',
  minor: 'MINOR',
};

interface Cursor {
  y: number;
  page: number;
}

function newPage(pdf: jsPDF, cursor: Cursor): void {
  pdf.addPage();
  cursor.page++;
  cursor.y = MARGIN;
}

function ensureSpace(pdf: jsPDF, cursor: Cursor, needed: number): void {
  if (cursor.y + needed > PAGE_H - MARGIN - 8) newPage(pdf, cursor);
}

function setColor(pdf: jsPDF, hex: string): void {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  pdf.setTextColor(r, g, b);
}

function setFillColor(pdf: jsPDF, hex: string): void {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  pdf.setFillColor(r, g, b);
}

function drawSectionTitle(pdf: jsPDF, cursor: Cursor, title: string): void {
  ensureSpace(pdf, cursor, 14);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  setColor(pdf, '#1a1b1e');
  pdf.text(title, MARGIN, cursor.y);
  cursor.y += 6;
  setFillColor(pdf, BRAND);
  pdf.rect(MARGIN, cursor.y, 30, 0.8, 'F');
  cursor.y += 6;
}

function drawBodyText(pdf: jsPDF, cursor: Cursor, text: string, size = 10): void {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(size);
  setColor(pdf, MUTED);
  const lines = pdf.splitTextToSize(text, CONTENT_W);
  for (const line of lines) {
    ensureSpace(pdf, cursor, size * 0.4);
    pdf.text(line, MARGIN, cursor.y);
    cursor.y += size * 0.42;
  }
  cursor.y += 2;
}

function drawFooter(pdf: jsPDF, jobRef: string): void {
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, DIM);
    pdf.text(`SnaggingPro · ${jobRef}`, MARGIN, PAGE_H - 6);
    pdf.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
  }
}

function drawCover(pdf: jsPDF, cursor: Cursor, state: State, snags: SnagRecord[]): void {
  // Wordmark
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  setColor(pdf, '#1a1b1e');
  pdf.text('SnaggingPro', MARGIN, cursor.y + 8);
  setColor(pdf, BRAND);
  cursor.y += 12;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setColor(pdf, DIM);
  pdf.text('PROPERTY CONDITION ASSESSMENT · UAE', MARGIN, cursor.y);
  cursor.y += 6;

  setFillColor(pdf, BRAND);
  pdf.rect(MARGIN, cursor.y, CONTENT_W, 0.6, 'F');
  cursor.y += 10;

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  setColor(pdf, '#1a1b1e');
  const titleText = state.job.reportType === 'follow-up'
    ? 'Follow-Up Inspection — DLP Review'
    : 'Property Condition Report';
  pdf.text(titleText, MARGIN, cursor.y);
  cursor.y += 8;

  // Meta line
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  setColor(pdf, DIM);
  pdf.text(`${state.job.ref} · ${formatDateLong(state.job.date)}`, MARGIN, cursor.y);
  cursor.y += 10;

  // Property block
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  setColor(pdf, BRAND);
  pdf.text(PROP_LABEL[state.property.type], MARGIN, cursor.y);
  cursor.y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  setColor(pdf, MUTED);
  const propLine = [
    state.property.developer,
    state.property.community,
    state.property.unit ? `Unit ${state.property.unit}` : '',
    state.property.bedrooms > 0 ? `${state.property.bedrooms} BR` : '',
  ].filter(Boolean).join(' · ');
  if (propLine) {
    pdf.text(propLine, MARGIN, cursor.y);
    cursor.y += 6;
  }

  // Client
  const clientLine = [state.client.name, state.client.phone].filter(Boolean).join(' · ');
  if (clientLine) {
    setColor(pdf, DIM);
    pdf.text(`Prepared for ${clientLine}`, MARGIN, cursor.y);
    cursor.y += 8;
  } else {
    cursor.y += 2;
  }

  // KPIs
  const critical = snags.filter((s) => s.severity === 'critical').length;
  const major = snags.filter((s) => s.severity === 'major').length;
  const minor = snags.filter((s) => s.severity === 'minor').length;
  const rooms = Object.values(state.rooms).filter((r) => !r.excluded).length;

  cursor.y += 4;
  drawKpiRow(pdf, cursor, [
    { label: 'ROOMS', value: String(rooms) },
    { label: 'TOTAL SNAGS', value: String(snags.length) },
    { label: 'CRITICAL', value: String(critical), color: CRITICAL },
    { label: 'MAJOR', value: String(major), color: MAJOR },
    { label: 'MINOR', value: String(minor) },
  ]);
}

function drawKpiRow(
  pdf: jsPDF,
  cursor: Cursor,
  kpis: Array<{ label: string; value: string; color?: string }>,
): void {
  const gap = 3;
  const cellW = (CONTENT_W - gap * (kpis.length - 1)) / kpis.length;
  const cellH = 22;
  ensureSpace(pdf, cursor, cellH + 4);
  setFillColor(pdf, '#ecedf0');
  for (let i = 0; i < kpis.length; i++) {
    const x = MARGIN + i * (cellW + gap);
    pdf.roundedRect(x, cursor.y, cellW, cellH, 2, 2, 'F');
    const kpi = kpis[i];
    if (!kpi) continue;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    setColor(pdf, kpi.color ?? BRAND);
    pdf.text(kpi.value, x + cellW / 2, cursor.y + 11, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    setColor(pdf, DIM);
    pdf.text(kpi.label, x + cellW / 2, cursor.y + 17, { align: 'center' });
  }
  cursor.y += cellH + 4;
}

async function blobToJpegDataUrl(blob: Blob, maxWidth = 800): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const ratio = bitmap.height / bitmap.width;
    const w = Math.min(maxWidth, bitmap.width);
    const h = Math.round(w * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}

async function drawSnag(
  pdf: jsPDF,
  cursor: Cursor,
  snag: SnagRecord,
): Promise<void> {
  // Estimate space needed (header + text + optional photo row).
  const photoCount = Math.min(snag.photoIds.length, 3);
  const photoH = photoCount > 0 ? 38 : 0;
  ensureSpace(pdf, cursor, 18 + photoH + 4);

  // Severity pill
  const pillW = 18;
  const pillH = 5;
  setFillColor(pdf, SEV_COLOR[snag.severity]);
  pdf.roundedRect(MARGIN, cursor.y - 4, pillW, pillH, 1, 1, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  setColor(pdf, '#ffffff');
  pdf.text(SEV_LABEL[snag.severity], MARGIN + pillW / 2, cursor.y - 0.5, { align: 'center' });

  // Snag title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setColor(pdf, '#1a1b1e');
  const title = `#${snag.ordinal} · ${snag.itemLabel}`;
  pdf.text(title, MARGIN + pillW + 3, cursor.y);
  cursor.y += 5;

  // Snag body text
  if (snag.text) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setColor(pdf, MUTED);
    const lines = pdf.splitTextToSize(snag.text, CONTENT_W);
    for (const line of lines) {
      ensureSpace(pdf, cursor, 4);
      pdf.text(line, MARGIN, cursor.y);
      cursor.y += 3.8;
    }
  }

  // Rectification status (follow-up)
  if (snag.rectification) {
    const rectColor =
      snag.rectification === 'fixed' ? PASS :
      snag.rectification === 'new' ? CRITICAL : MAJOR;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    setColor(pdf, rectColor);
    pdf.text(`Rectification: ${snag.rectification.toUpperCase()}`, MARGIN, cursor.y);
    cursor.y += 4;
    if (snag.rectificationNote) {
      pdf.setFont('helvetica', 'normal');
      setColor(pdf, MUTED);
      const lines = pdf.splitTextToSize(snag.rectificationNote, CONTENT_W);
      for (const line of lines) {
        ensureSpace(pdf, cursor, 4);
        pdf.text(line, MARGIN, cursor.y);
        cursor.y += 3.6;
      }
    }
  }

  // Photos: up to 3 thumbnails per snag
  if (photoCount > 0) {
    ensureSpace(pdf, cursor, photoH);
    const gap = 3;
    const cellW = (CONTENT_W - gap * (photoCount - 1)) / photoCount;
    const cellH = 35;
    for (let i = 0; i < photoCount; i++) {
      const photoId = snag.photoIds[i];
      if (!photoId) continue;
      const x = MARGIN + i * (cellW + gap);
      // Placeholder box first
      setFillColor(pdf, '#ecedf0');
      pdf.roundedRect(x, cursor.y, cellW, cellH, 1.5, 1.5, 'F');
      try {
        const rec = await getPhoto(photoId);
        if (rec) {
          const dataUrl = await blobToJpegDataUrl(rec.blob, 700);
          if (dataUrl) {
            // Center the image inside the cell, preserve aspect.
            pdf.addImage(dataUrl, 'JPEG', x, cursor.y, cellW, cellH, undefined, 'FAST');
          }
        }
      } catch {
        /* skip missing photos */
      }
    }
    cursor.y += cellH + 2;
  }
  cursor.y += 4;
}

export async function buildReportPdf(state: State): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const cursor: Cursor = { y: MARGIN, page: 1 };
  const snags = collectSnags(state);

  // Page 1: Cover
  drawCover(pdf, cursor, state, snags);

  // Severity definitions
  newPage(pdf, cursor);
  drawSectionTitle(pdf, cursor, 'Severity definitions');
  drawBodyText(
    pdf,
    cursor,
    'CRITICAL — Safety risk, system non-functional, water or structural integrity compromised, fire or electrical hazard. Must be rectified before handover acceptance.',
  );
  drawBodyText(
    pdf,
    cursor,
    'MAJOR — Significant defect affecting function, appearance, or longevity. Should be rectified during the Defects Liability Period (DLP).',
  );
  drawBodyText(
    pdf,
    cursor,
    'MINOR — Cosmetic or workmanship issue. Recommended for rectification during DLP.',
  );

  // DLP guidance
  cursor.y += 4;
  drawSectionTitle(pdf, cursor, 'Defects Liability Period');
  drawBodyText(
    pdf,
    cursor,
    'The Defects Liability Period is the period after handover during which the developer is contractually obliged to rectify defects in the property at no cost to the owner. In the UAE the standard DLP is 12 months from handover, though some projects extend longer for structural and waterproofing items.',
  );

  // Snags grouped by room
  if (snags.length > 0) {
    newPage(pdf, cursor);
    drawSectionTitle(pdf, cursor, 'Snags');
    let lastRoom = '';
    for (const snag of snags) {
      if (snag.roomLabel !== lastRoom) {
        ensureSpace(pdf, cursor, 12);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        setColor(pdf, BRAND);
        pdf.text(snag.roomLabel, MARGIN, cursor.y);
        cursor.y += 6;
        lastRoom = snag.roomLabel;
      }
      await drawSnag(pdf, cursor, snag);
    }
  }

  // Handover docs
  newPage(pdf, cursor);
  drawSectionTitle(pdf, cursor, 'Handover documents');
  drawBodyText(
    pdf,
    cursor,
    'Checklist of documents the developer should provide on handover.',
  );
  for (const group of HANDOVER_SECTIONS) {
    cursor.y += 3;
    ensureSpace(pdf, cursor, 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    setColor(pdf, '#1a1b1e');
    pdf.text(group.title, MARGIN, cursor.y);
    cursor.y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setColor(pdf, MUTED);
    for (const item of group.items) {
      ensureSpace(pdf, cursor, 4);
      pdf.text(`☐  ${item}`, MARGIN, cursor.y);
      cursor.y += 4;
    }
  }

  drawFooter(pdf, state.job.ref);
  return pdf.output('blob');
}
