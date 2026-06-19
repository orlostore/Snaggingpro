/**
 * Full-screen photo annotator.
 * Tap on the photo to drop a red circle marking the defect.
 * Saving bakes the circles into a new image (stored as kind:'annotated')
 * and returns its photoId. Caller swaps the photoId in their observation
 * and deletes the original.
 */

import { html, render, type TemplateResult } from 'lit-html';
import { storePhoto, getPhoto } from '@/storage/photos';

export interface AnnotateOptions {
  photoId: string;
  jobRef: string;
  onSave: (newPhotoId: string) => void;
  onCancel: () => void;
}

interface Mark {
  x: number;
  y: number;
}

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
  let img: HTMLImageElement | null = null;
  let imgUrl: string | null = null;

  function close() {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    render(html``, ensureHost());
  }

  function repaint() {
    render(view(), ensureHost());
    requestAnimationFrame(drawCanvas);
  }

  function addMarkFromEvent(e: PointerEvent) {
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    marks.push({ x, y });
    drawCanvas();
  }

  function undo() {
    marks.pop();
    drawCanvas();
  }

  function clearAll() {
    marks.length = 0;
    drawCanvas();
  }

  function drawCanvas() {
    if (!host) return;
    const canvas = host.querySelector<HTMLCanvasElement>('.annotate__canvas');
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const radius = Math.max(canvas.width, canvas.height) * 0.035;
    ctx.strokeStyle = '#ff2a55';
    ctx.lineWidth = Math.max(4, canvas.width * 0.008);
    for (const m of marks) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, radius, 0, Math.PI * 2);
      ctx.stroke();
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
          <span class="annotate__hint">Tap the photo to mark the defect</span>
          <span></span>
        </header>
        <div class="annotate__stage">
          <canvas
            class="annotate__canvas"
            width="1080"
            height="1080"
            @pointerdown=${addMarkFromEvent}
          ></canvas>
        </div>
        <footer class="annotate__actions">
          <button class="btn btn--secondary" @click=${undo} ?disabled=${marks.length === 0}>
            ↶ Undo
          </button>
          <button class="btn btn--ghost" @click=${clearAll} ?disabled=${marks.length === 0}>
            Clear
          </button>
          <button class="btn btn--primary" @click=${() => void save()}>
            Save annotated photo
          </button>
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
