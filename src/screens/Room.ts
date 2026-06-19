import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { PhotoAttach } from '@/components/PhotoAttach';
import { confirmDialog } from '@/components/Confirm';
import { loadDraft, saveDraft } from '@/state/persist';
import { DISC_LABELS, DISC_ICONS, type Discipline } from '@/domain/disciplines';
import type { Item, RoomState } from '@/state/schema';
import { go } from '@/lib/router';
import { toast } from '@/components/Toast';
import { storePhoto, getPhotoUrl, deletePhoto } from '@/storage/photos';
import { newId } from '@/lib/id';

interface LocalView {
  activeDisc: Discipline | null;
  photoUrls: Map<string, string>;
}

export function Room(rootEl: HTMLElement, roomId: string): TemplateResult {
  const view: LocalView = { activeDisc: null, photoUrls: new Map() };

  function paint() {
    render(render_(), rootEl);
  }

  function setStatus(itemKey: string, status: Item['status']) {
    const s = loadDraft();
    if (!s) return;
    const room = s.rooms[roomId];
    const item = room?.items[itemKey];
    if (!item) return;
    item.status = status;
    if (status === 'issue' && item.observations.length === 0) {
      item.observations.push({ id: newId(), text: item.note, photoIds: [] });
      item.note = '';
    }
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  function updateObsText(itemKey: string, obsId: string, text: string) {
    const s = loadDraft();
    if (!s) return;
    const item = s.rooms[roomId]?.items[itemKey];
    if (!item) return;
    const obs = item.observations.find((o) => o.id === obsId);
    if (!obs) return;
    obs.text = text;
    s.job.updatedAt = Date.now();
    saveDraft(s);
  }

  function addObservation(itemKey: string) {
    const s = loadDraft();
    if (!s) return;
    const item = s.rooms[roomId]?.items[itemKey];
    if (!item) return;
    item.observations.push({ id: newId(), text: '', photoIds: [] });
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  async function removeObservation(itemKey: string, obsId: string) {
    const ok = await confirmDialog({
      title: 'Delete this observation?',
      message: 'The note and any photos attached to it will be removed.',
      destructive: true,
      confirmLabel: 'Delete observation',
    });
    if (!ok) return;
    const s = loadDraft();
    if (!s) return;
    const item = s.rooms[roomId]?.items[itemKey];
    if (!item) return;
    const obs = item.observations.find((o) => o.id === obsId);
    if (obs) {
      for (const pid of obs.photoIds) await deletePhoto(pid);
    }
    item.observations = item.observations.filter((o) => o.id !== obsId);
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  async function addPhotoToObs(itemKey: string, obsId: string, file: File) {
    const s = loadDraft();
    if (!s) return;
    const item = s.rooms[roomId]?.items[itemKey];
    const obs = item?.observations.find((o) => o.id === obsId);
    if (!obs) return;
    const id = await storePhoto(file, 'snag', s.job.ref);
    obs.photoIds.push(id);
    s.job.updatedAt = Date.now();
    saveDraft(s);
    const url = await getPhotoUrl(id);
    if (url) view.photoUrls.set(id, url);
    paint();
  }

  async function removePhoto(itemKey: string, obsId: string, photoId: string) {
    const ok = await confirmDialog({
      title: 'Remove this photo?',
      message: 'The photo will be deleted from this observation.',
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    const s = loadDraft();
    if (!s) return;
    const obs = s.rooms[roomId]?.items[itemKey]?.observations.find((o) => o.id === obsId);
    if (!obs) return;
    obs.photoIds = obs.photoIds.filter((p) => p !== photoId);
    await deletePhoto(photoId);
    s.job.updatedAt = Date.now();
    saveDraft(s);
    view.photoUrls.delete(photoId);
    paint();
  }

  async function preloadPhotoUrls(room: RoomState) {
    for (const it of Object.values(room.items)) {
      for (const obs of it.observations) {
        for (const pid of obs.photoIds) {
          if (!view.photoUrls.has(pid)) {
            const url = await getPhotoUrl(pid);
            if (url) view.photoUrls.set(pid, url);
          }
        }
      }
    }
    paint();
  }

  function render_(): TemplateResult {
    const s = loadDraft();
    if (!s) {
      queueMicrotask(() => go('splash'));
      return html``;
    }
    const room = s.rooms[roomId];
    if (!room) {
      queueMicrotask(() => go('dashboard'));
      return html``;
    }
    const discs = room.discs;
    if (!view.activeDisc) view.activeDisc = discs[0] ?? null;
    const active = view.activeDisc;
    if (!active) return html`<p class="empty">No disciplines for this room.</p>`;

    const items = Object.values(room.items).filter((i) => i.disc === active);

    return html`
      <section class="screen">
        ${Header({ title: room.label, back: () => go('dashboard') })}
        <main class="container room">
          <div class="disc-tabs">
            ${discs.map(
              (d) => html`
                <button
                  class="disc-tab ${d === active ? 'disc-tab--on' : ''}"
                  @click=${() => {
                    view.activeDisc = d;
                    paint();
                  }}
                >
                  ${DISC_ICONS[d]} ${DISC_LABELS[d]}
                </button>
              `,
            )}
          </div>
          <ul class="item-list">
            ${items.map((it) => itemRow(room, it))}
          </ul>
          <div class="room__actions">
            ${Button({
              label: 'Back to dashboard',
              full: true,
              variant: 'secondary',
              onClick: () => go('dashboard'),
            })}
          </div>
        </main>
        ${Footer()}
      </section>
    `;
  }

  function itemRow(_room: RoomState, item: Item): TemplateResult {
    return html`
      <li class="item ${item.status !== 'pending' ? `item--${item.status}` : ''}">
        <div class="item__label">
          ${item.dbNum ? html`<span class="item__db">DB ${item.dbNum}</span>` : null}
          ${item.label}
        </div>
        <div class="item__statuses">
          <button
            class="item__btn ${item.status === 'pass' ? 'item__btn--on' : ''}"
            @click=${() => setStatus(item.key, 'pass')}
          >
            ✓ Pass
          </button>
          <button
            class="item__btn ${item.status === 'issue' ? 'item__btn--on item__btn--issue' : ''}"
            @click=${() => {
              setStatus(item.key, 'issue');
              toast('Marked as issue — add a note and photos');
            }}
          >
            ⚠ Issue
          </button>
          <button
            class="item__btn ${item.status === 'na' ? 'item__btn--on' : ''}"
            @click=${() => setStatus(item.key, 'na')}
          >
            — N/A
          </button>
        </div>
        ${item.status === 'issue' ? observationsBlock(item) : null}
      </li>
    `;
  }

  function observationsBlock(item: Item): TemplateResult {
    return html`
      <div class="obs-block">
        ${item.observations.map(
          (obs) => html`
            <div class="obs">
              <textarea
                class="item__note"
                placeholder="Describe the issue…"
                .value=${obs.text}
                @input=${(e: Event) =>
                  updateObsText(item.key, obs.id, (e.target as HTMLTextAreaElement).value)}
              ></textarea>

              ${obs.photoIds.length > 0
                ? html`
                    <div class="obs__photos">
                      ${obs.photoIds.map(
                        (pid) => html`
                          <div class="obs__photo">
                            ${view.photoUrls.get(pid)
                              ? html`<img src=${view.photoUrls.get(pid)!} alt="snag photo" />`
                              : html`<div class="obs__photo-loading">…</div>`}
                            <button
                              class="obs__photo-remove"
                              aria-label="Remove photo"
                              @click=${() => void removePhoto(item.key, obs.id, pid)}
                            >
                              ×
                            </button>
                          </div>
                        `,
                      )}
                    </div>
                  `
                : null}

              ${PhotoAttach({
                onPicked: (f) => void addPhotoToObs(item.key, obs.id, f),
                label: 'Add photo to this observation',
              })}

              <div class="obs__actions">
                <button
                  class="btn btn--ghost btn--sm"
                  @click=${() => void removeObservation(item.key, obs.id)}
                >
                  Delete observation
                </button>
              </div>
            </div>
          `,
        )}

        <button class="btn btn--secondary btn--sm" @click=${() => addObservation(item.key)}>
          + Add another observation
        </button>
      </div>
    `;
  }

  // Kick off photo preload for this room
  const s0 = loadDraft();
  const room0 = s0?.rooms[roomId];
  if (room0) void preloadPhotoUrls(room0);

  return render_();
}
