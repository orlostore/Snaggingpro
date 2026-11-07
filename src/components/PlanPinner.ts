/**
 * Full-screen floor plan viewer for placing one snag's pin.
 *
 * Other pinned snags are shown faded so the inspector can see what is
 * already marked. Tap the plan to place / move the current pin; zoom with
 * the − / + buttons and scroll around the plan with one finger.
 */

import { html, render, type TemplateResult } from 'lit-html';
import { getPhotoUrl } from '@/storage/photos';
import type { PlanPin } from '@/state/schema';
import { PIN_PATH } from '@/domain/planPin';
import { Icon } from './Icon';

export interface PlanMarker {
  n: number;
  pin: PlanPin;
}

export interface PlanPinnerOptions {
  planPhotoId: string;
  title: string;
  /** Number shown on the pin being placed (the snag's ordinal). */
  currentNumber: number;
  current: PlanPin | undefined;
  others: PlanMarker[];
  onSave: (pin: PlanPin | null) => void;
}

const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

let host: HTMLDivElement | null = null;

function ensureHost(): HTMLDivElement {
  if (!host) {
    host = document.createElement('div');
    host.className = 'plan-pinner-host';
    document.body.appendChild(host);
  }
  return host;
}

export async function openPlanPinner(opts: PlanPinnerOptions): Promise<void> {
  const url = await getPhotoUrl(opts.planPhotoId);
  let pin: PlanPin | undefined = opts.current;
  let zoomIdx = 0;

  function close() {
    if (url) URL.revokeObjectURL(url);
    render(html``, ensureHost());
    document.body.style.overflow = '';
  }

  function place(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    pin = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
    paint();
  }

  function zoom(delta: number) {
    zoomIdx = Math.min(ZOOM_STEPS.length - 1, Math.max(0, zoomIdx + delta));
    paint();
    if (pin) scrollToPin();
  }

  function scrollToPin() {
    requestAnimationFrame(() => {
      const marker = ensureHost().querySelector<HTMLElement>('.plan-pin--current');
      marker?.scrollIntoView({ block: 'center', inline: 'center' });
    });
  }

  function marker(m: PlanMarker, current: boolean): TemplateResult {
    return html`<span
      class="plan-pin ${current ? 'plan-pin--current' : 'plan-pin--other'}"
      style="left:${m.pin.x * 100}%;top:${m.pin.y * 100}%"
      ><svg viewBox="0 0 30 40" aria-hidden="true"><path d=${PIN_PATH} /></svg><b>${m.n}</b></span
    >`;
  }

  function view(): TemplateResult {
    const scale = ZOOM_STEPS[zoomIdx] ?? 1;
    return html`
      <div class="plan-pinner" role="dialog" aria-modal="true" aria-label="Mark on floor plan">
        <header class="plan-pinner__bar">
          <button class="plan-pinner__icon-btn" aria-label="Close" @click=${close}>
            ${Icon({ name: 'x', size: 20 })}
          </button>
          <div class="plan-pinner__title">
            <strong>${opts.title}</strong>
            <span>${pin ? `Pin ${opts.currentNumber} placed · tap to move` : 'Tap the plan where the snag is'}</span>
          </div>
          <div class="plan-pinner__zoom">
            <button
              class="plan-pinner__icon-btn"
              aria-label="Zoom out"
              ?disabled=${zoomIdx === 0}
              @click=${() => zoom(-1)}
            >
              ${Icon({ name: 'minus', size: 18 })}
            </button>
            <button
              class="plan-pinner__icon-btn"
              aria-label="Zoom in"
              ?disabled=${zoomIdx === ZOOM_STEPS.length - 1}
              @click=${() => zoom(1)}
            >
              ${Icon({ name: 'plus', size: 18 })}
            </button>
          </div>
        </header>
        <div class="plan-pinner__stage">
          ${url
            ? html`
                <div class="plan-pinner__paper" style="width:${scale * 100}%" @click=${place}>
                  <img class="plan-pinner__img" src=${url} alt="Floor plan" draggable="false" />
                  ${opts.others.map((m) => marker(m, false))}
                  ${pin ? marker({ n: opts.currentNumber, pin }, true) : null}
                </div>
              `
            : html`<p class="plan-pinner__missing">The floor plan could not be loaded on this device.</p>`}
        </div>
        <footer class="plan-pinner__actions">
          ${opts.current
            ? html`<button
                class="btn btn--ghost"
                @click=${() => {
                  close();
                  opts.onSave(null);
                }}
              >
                Remove pin
              </button>`
            : html`<button class="btn btn--secondary" @click=${close}>Cancel</button>`}
          <button
            class="btn btn--primary"
            ?disabled=${!pin}
            @click=${() => {
              close();
              if (pin) opts.onSave(pin);
            }}
          >
            Save pin
          </button>
        </footer>
      </div>
    `;
  }

  function paint() {
    render(view(), ensureHost());
  }

  document.body.style.overflow = 'hidden';
  paint();
  if (pin) scrollToPin();
}
