/**
 * Full-screen photo annotator.
 *
 * Drag on the photo to draw a shape (circle or rectangle), sized to your drag.
 * Tap without dragging drops a default-sized circle (back-compat tap-to-mark).
 * Add as many shapes as you like; Undo removes the most recent, Clear wipes all.
 * Save bakes the shapes into a fresh JPEG and returns its photoId.
 */

import { html, render, type TemplateResult } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';
import { storePhoto, getPhoto } from '@/storage/photos';

export interface AnnotateOptions {
  photoId: string;
  jobRef: string;
  onSave: (newPhotoId: string) => void;
  onCancel: () => void;
}

type Shape = 'circle' | 'rect';

interface Mark {
  shape: Shape;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const STROKE = '#ff2a55';
const TAP_THRESHOLD_PX = 6; // a "tap" if total drag is below this in screen px

let host: HTMLDivElement | null = null;

function ensureHost(): HTMLDivElement {
  if (!host) {
    host = document.createElement('div');
    host.className = 'annotate-host';
    document.body.appendChild(host);
  }
  return host;
}

export function openAnnotator(opts: AnnotateOptions): void {
  const marks: Mark[] = [];
  let drafting: Mark | null = null;
  let activeShape: Shape = 'circle';
  let img: HTMLImageElement | null = null;
  let imgUrl: string | null = null;
  let pointerStart: { sx: number; sy: number } | null = null;

  function close() {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    render(html``, ensureHost());
  }

  function repaint() {
    render(view(), ensureHost());
    requestAnimationFrame(drawCanvas);
  }

  function toImageCoords(e: PointerEvent) {
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function onPointerDown(e: PointerEvent) {
    const { x, y } = toImageCoords(e);
    pointerStart = { sx: e.clientX, sy: e.clientY };
    drafting = { shape: activeShape, x1: x, y1: y, x2: x, y2: y };
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawCanvas();
  }

  function onPointerMove(e: PointerEvent) {
    if (!drafting) return;
    const { x, y } = toImageCoords(e);
    drafting.x2 = x;
    drafting.y2 = y;
    drawCanvas();
  }

  function onPointerUp(e: PointerEvent) {
    if (!drafting || !pointerStart) {
      drafting = null;
      pointerStart = null;
      return;
    }
    const screenDx = Math.abs(e.clientX - pointerStart.sx);
    const screenDy = Math.abs(e.clientY - pointerStart.sy);
    const isTap = screenDx < TAP_THRESHOLD_PX && screenDy < TAP_THRESHOLD_PX;

    if (isTap && img) {
      // Drop a default-sized circle centred on the tap point.
      const r = Math.max(img.naturalWidth, img.naturalHeight) * 0.04;
      marks.push({
        shape: 'circle',
        x1: drafting.x1 - r,
        y1: drafting.y1 - r,
        x2: drafting.x1 + r,
        y2: drafting.y1 + r,
      });
    } else {
      marks.push({ ...drafting });
    }
    drafting = null;
    pointerStart = null;
    drawCanvas();
    repaint();
  }

  function undo() {
    marks.pop();
    repaint();
  }

  function clearAll() {
    marks.length = 0;
    repaint();
  }

  function setShape(s: Shape) {
    activeShape = s;
    repaint();
  }

  function drawShape(ctx: CanvasRenderingContext2D, m: Mark, lineWidth: number) {
    const x = Math.min(m.x1, m.x2);
    const y = Math.min(m.y1, m.y2);
    const w = Math.abs(m.x2 - m.x1);
    const h = Math.abs(m.y2 - m.y1);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = STROKE;
    if (m.shape === 'rect') {
      ctx.strokeRect(x, y, w, h);
    } else {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawCanvas() {
    if (!host) return;
    const canvas = host.querySelector<HTMLCanvasElement>('.annotate__canvas');
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const lineWidth = Math.max(4, canvas.width * 0.008);
    for (const m of marks) drawShape(ctx, m, lineWidth);
    if (drafting) {
      ctx.setLineDash([lineWidth * 2, lineWidth]);
      drawShape(ctx, drafting, lineWidth);
      ctx.setLineDash([]);
    }
  }

  async function save() {
    if (!host || !img) return;
    const canvas = host.querySelector<HTMLCanvasElement>('.annotate__canvas');
    if (!canvas) return;
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), 'image/jpeg', 0.92),
    );
    if (!blob) return;
    const newId = await storePhoto(blob, 'annotated', opts.jobRef);
    close();
    opts.onSave(newId);
  }

  function cancel() {
    close();
    opts.onCancel();
  }

  function view(): TemplateResult {
    return html`
      <div class="annotate">
        <header class="annotate__bar">
          <button class="btn btn--ghost btn--sm" @click=${cancel}>Cancel</button>
          <div class="annotate__tools" role="group" aria-label="Shape">
            <button
              class=${classMap({
                'annotate__tool': true,
                'annotate__tool--on': activeShape === 'circle',
              })}
              @click=${() => setShape('circle')}
              aria-pressed=${activeShape === 'circle'}
            >
              ○ Circle
            </button>
            <button
              class=${classMap({
                'annotate__tool': true,
                'annotate__tool--on': activeShape === 'rect',
              })}
              @click=${() => setShape('rect')}
              aria-pressed=${activeShape === 'rect'}
            >
              □ Rect
            </button>
          </div>
        </header>
        <div class="annotate__hint">
          ${activeShape === 'circle' ? 'Drag to draw a circle, or tap to place a default one' : 'Drag to draw a rectangle'}
          · ${marks.length} mark${marks.length === 1 ? '' : 's'}
        </div>
        <div class="annotate__stage">
          <canvas
            class="annotate__canvas"
            width="1080"
            height="1080"
            @pointerdown=${onPointerDown}
            @pointermove=${onPointerMove}
            @pointerup=${onPointerUp}
            @pointercancel=${onPointerUp}
          ></canvas>
        </div>
        <footer class="annotate__actions">
          <button class="btn btn--secondary" @click=${undo} ?disabled=${marks.length === 0}>
            ↶ Undo
          </button>
          <button class="btn btn--ghost" @click=${clearAll} ?disabled=${marks.length === 0}>
            Clear
          </button>
          <button class="btn btn--primary" @click=${() => void save()}>Save</button>
        </footer>
      </div>
    `;
  }

  async function init() {
    const rec = await getPhoto(opts.photoId);
    if (!rec) {
      cancel();
      return;
    }
    imgUrl = URL.createObjectURL(rec.blob);
    img = new Image();
    img.onload = () => {
      const canvas = host?.querySelector<HTMLCanvasElement>('.annotate__canvas');
      if (canvas && img) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        drawCanvas();
      }
    };
    img.src = imgUrl;
    repaint();
  }

  void init();
}
