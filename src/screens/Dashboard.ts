import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { confirmDialog } from '@/components/Confirm';
import { loadDraft, saveDraft } from '@/state/persist';
import { statsForRoom } from '@/domain/snags';
import { go } from '@/lib/router';
import { Icon, IconOrFallback } from '@/components/Icon';
import { toast } from '@/components/Toast';
import { collectSnags } from '@/domain/snags';
import { storePhoto, getPhotoUrl, deletePhoto } from '@/storage/photos';
import { reencodeToWebp } from '@/lib/imageEncode';
import type { State } from '@/state/schema';
import { inspectionProgress } from '@/domain/progress';

const PLAN_MAX_DIMENSION = 2400;

export function Dashboard(rootEl: HTMLElement): TemplateResult {
  const plan: { photoId: string | null; url: string | null } = { photoId: null, url: null };

  function paint() {
    render(view(), rootEl);
  }

  async function loadPlanThumb(photoId: string | null) {
    if (plan.photoId === photoId) return;
    if (plan.url) URL.revokeObjectURL(plan.url);
    plan.photoId = photoId;
    plan.url = photoId ? await getPhotoUrl(photoId) : null;
    paint();
  }

  function progressRing(pct: number): TemplateResult {
    const r = 30;
    const c = 2 * Math.PI * r;
    return html`
      <div
        class="ring"
        role="progressbar"
        aria-label="Inspection progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${pct}
      >
        <svg viewBox="0 0 72 72" aria-hidden="true">
          <circle class="ring__track" cx="36" cy="36" r=${r} />
          <circle
            class="ring__fill"
            cx="36"
            cy="36"
            r=${r}
            stroke-dasharray=${c}
            stroke-dashoffset=${c * (1 - pct / 100)}
          />
        </svg>
        <span class="ring__label">${pct}<small>%</small></span>
      </div>
    `;
  }

  function pinCount(s: State): number {
    return collectSnags(s).filter((sn) => sn.pin).length;
  }

  function clearPins(s: State) {
    for (const room of Object.values(s.rooms)) {
      for (const item of Object.values(room.items)) {
        for (const obs of item.observations) delete obs.pin;
      }
    }
  }

  async function setPlan(file: File) {
    const s = loadDraft();
    if (!s) return;
    const pins = pinCount(s);
    if (s.planPhotoId && pins > 0) {
      const ok = await confirmDialog({
        title: 'Replace the floor plan?',
        message: `${pins} pin${pins === 1 ? '' : 's'} on the current plan will be cleared, because their positions won't match a different drawing.`,
        confirmLabel: 'Replace',
        destructive: true,
      });
      if (!ok) return;
    }
    const blob = await reencodeToWebp(file, { maxDimension: PLAN_MAX_DIMENSION, quality: 0.88 });
    const id = await storePhoto(blob, 'plan', s.job.ref);
    const fresh = loadDraft();
    if (!fresh) return;
    const old = fresh.planPhotoId;
    if (old) clearPins(fresh);
    fresh.planPhotoId = id;
    fresh.job.updatedAt = Date.now();
    saveDraft(fresh);
    if (old) await deletePhoto(old);
    toast('Floor plan added');
    await loadPlanThumb(id);
  }

  async function removePlan() {
    const s = loadDraft();
    if (!s?.planPhotoId) return;
    const pins = pinCount(s);
    const ok = await confirmDialog({
      title: 'Remove the floor plan?',
      message:
        pins > 0
          ? `The plan and its ${pins} pin${pins === 1 ? '' : 's'} will be removed. Snags, notes and photos stay.`
          : 'Snags, notes and photos stay.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    const old = s.planPhotoId;
    clearPins(s);
    s.planPhotoId = null;
    s.job.updatedAt = Date.now();
    saveDraft(s);
    await deletePhoto(old);
    toast('Floor plan removed');
    await loadPlanThumb(null);
  }

  function planPicker(label: string): TemplateResult {
    return html`
      <label class="btn btn--secondary btn--sm plan-card__pick">
        ${Icon({ name: 'gallery', size: 16 })} ${label}
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          @change=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            const f = input.files?.[0];
            input.value = '';
            if (f) void setPlan(f);
          }}
        />
      </label>
    `;
  }

  function planCard(s: State): TemplateResult {
    if (!s.planPhotoId) {
      return html`
        <div class="plan-card card">
          <div class="plan-card__icon">${Icon({ name: 'pin', size: 22 })}</div>
          <div class="plan-card__body">
            <strong>Floor plan</strong>
            <span>Optional. Add the unit's plan to mark where each snag is.</span>
          </div>
          ${planPicker('Add plan')}
        </div>
      `;
    }
    const pins = pinCount(s);
    return html`
      <div class="plan-card card">
        ${plan.url
          ? html`<img class="plan-card__thumb" src=${plan.url} alt="Floor plan" />`
          : html`<div class="plan-card__icon">${Icon({ name: 'pin', size: 22 })}</div>`}
        <div class="plan-card__body">
          <strong>Floor plan</strong>
          <span>${pins} snag${pins === 1 ? '' : 's'} pinned · use “Mark on plan” on any issue</span>
        </div>
        <div class="plan-card__actions">
          ${planPicker('Replace')}
          <button class="btn btn--ghost btn--sm" @click=${() => void removePlan()}>Remove</button>
        </div>
      </div>
    `;
  }

  async function hideRoom(roomId: string) {
    const s = loadDraft();
    if (!s) return;
    const room = s.rooms[roomId];
    if (!room) return;
    const hasData = Object.values(room.items).some((i) => i.status !== 'pending');
    if (hasData) {
      const ok = await confirmDialog({
        title: 'Mark this room as Not Applicable?',
        message: 'This room has inspection data. It will be hidden from the dashboard but appear in the report under "Not applicable".',
        confirmLabel: 'Mark N/A',
      });
      if (!ok) return;
    }
    room.excluded = true;
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  function restoreRoom(roomId: string) {
    const s = loadDraft();
    if (!s) return;
    const room = s.rooms[roomId];
    if (!room) return;
    room.excluded = false;
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  function view(): TemplateResult {
    const s = loadDraft();
    if (!s) {
      queueMicrotask(() => go('splash'));
      return html``;
    }

    if (plan.photoId !== s.planPhotoId) void loadPlanThumb(s.planPhotoId);
    const rooms = s.roomOrder.map((id) => s.rooms[id]!).filter(Boolean);
    const visible = rooms.filter((r) => !r.excluded);
    const hidden = rooms.filter((r) => r.excluded);
    const totalIssues = visible.reduce((n, r) => n + statsForRoom(r).issue, 0);
    const completed = visible.filter((r) => {
      const st = statsForRoom(r);
      return st.pending === 0 && st.total > 0;
    }).length;
    const pendingRooms = visible.length - completed;
    const progress = inspectionProgress(s);

    return html`
      <section class="screen">
        ${Header({ title: 'Dashboard', back: () => go('splash') })}
        <main class="container">
          <div class="dash-meta card">
            <div>
              <div class="dash-meta__ref">${s.job.ref}</div>
              <div class="dash-meta__client">${s.client.name || 'Unnamed client'}</div>
              <div class="dash-meta__sub">
                ${s.property.developer}${s.property.developer && s.property.community ? ' · ' : ''}${s.property.community}
                ${s.property.unit ? html` · Unit ${s.property.unit}` : null}
              </div>
            </div>
            ${progressRing(progress.pct)}
            <div class="dash-meta__figures">
              <div><strong>${completed}/${visible.length}</strong><span>Rooms</span></div>
              <div><strong>${pendingRooms}</strong><span>Pending</span></div>
              <div class="dash-meta__issues"><strong>${totalIssues}</strong><span>Issues</span></div>
            </div>
          </div>

          ${planCard(s)}

          <div class="room-grid">
            ${visible.map((room) => {
              const st = statsForRoom(room);
              const complete = st.total > 0 && st.pending === 0;
              const hasIssues = st.issue > 0;
              return html`
                <div
                  class="room-card ${complete ? 'room-card--complete' : ''} ${hasIssues
                    ? 'room-card--issues'
                    : ''} ${st.pending > 0 && st.pending < st.total ? 'room-card--partial' : ''}"
                  @click=${() => go('room', { id: room.id })}
                >
                  <div class="room-card__icon">${IconOrFallback(room.icon, 'tag', 26)}</div>
                  <div class="room-card__label">${room.label}</div>
                  <div class="room-card__meta">
                    ${st.inspected}/${st.total} inspected
                  </div>
                  <div class="room-card__bar ${complete ? 'room-card__bar--done' : ''}">
                    <span style="width:${st.total ? Math.round((st.inspected / st.total) * 100) : 0}%"></span>
                  </div>
                  <div class="room-card__pills">
                      ${complete
                      ? html`<span class="pill pill--ok">${Icon({ name: 'check', size: 14 })} Complete</span>`
                      : st.pending > 0
                        ? html`<span class="pill pill--pending">${st.pending} pending</span>`
                        : null}
                    ${st.issue > 0
                      ? html`<span class="pill pill--issue">${st.issue} issue${st.issue > 1 ? 's' : ''}</span>`
                      : null}
                  </div>
                  <button
                    class="btn btn--ghost btn--sm room-card__na"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      void hideRoom(room.id);
                    }}
                  >
                    N/A
                  </button>
                </div>
              `;
            })}
          </div>

          ${hidden.length > 0
            ? html`
                <details class="hidden-rooms">
                  <summary>Not applicable · ${hidden.length} hidden</summary>
                  <ul class="hidden-rooms__list">
                    ${hidden.map(
                      (r) => html`
                        <li class="hidden-rooms__chip">
                          <span class="hidden-rooms__icon">${IconOrFallback(r.icon, 'tag', 18)}</span>
                          <span>${r.label}</span>
                          <button class="btn btn--ghost btn--sm" @click=${() => restoreRoom(r.id)}>
                            Restore
                          </button>
                        </li>
                      `,
                    )}
                  </ul>
                </details>
              `
            : null}

          <div class="dash-actions">
            ${Button({
              label: html`${Icon({ name: 'send', size: 18 })} Generate Report`,
              full: true,
              size: 'lg',
              onClick: () => go('report'),
            })}
          </div>
        </main>
        ${Footer()}
      </section>
    `;
  }

  return view();
}
