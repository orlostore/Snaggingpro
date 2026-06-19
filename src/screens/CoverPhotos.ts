import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { PhotoAttach } from '@/components/PhotoAttach';
import { confirmDialog } from '@/components/Confirm';
import { loadDraft, saveDraft } from '@/state/persist';
import { storePhoto, getPhotoUrl, deletePhoto } from '@/storage/photos';
import { go } from '@/lib/router';

const SLOTS = [
  { label: 'Building front', sub: 'External shot' },
  { label: 'Door / entry', sub: 'Unit door' },
  { label: 'Cover photo', sub: 'Main interior shot' },
] as const;

export function CoverPhotos(rootEl: HTMLElement): TemplateResult {
  const state = loadDraft();
  if (!state) {
    go('splash');
    return html``;
  }
  const urls: (string | null)[] = [null, null, null];

  function paint() {
    render(view(), rootEl);
  }

  async function load() {
    for (let i = 0; i < 3; i++) {
      const id = state?.coverPhotoIds[i] ?? null;
      urls[i] = id ? await getPhotoUrl(id) : null;
    }
    paint();
  }

  async function pickPhoto(idx: number, file: File) {
    if (!state) return;
    const id = await storePhoto(file, 'cover', state.job.ref);
    state.coverPhotoIds[idx] = id;
    state.job.updatedAt = Date.now();
    saveDraft(state);
    urls[idx] = await getPhotoUrl(id);
    paint();
  }

  async function removePhoto(idx: number) {
    if (!state) return;
    const id = state.coverPhotoIds[idx];
    if (id) await deletePhoto(id);
    state.coverPhotoIds[idx] = null;
    state.job.updatedAt = Date.now();
    saveDraft(state);
    urls[idx] = null;
    paint();
  }

  function view(): TemplateResult {
    return html`
      <section class="screen">
        ${Header({ title: 'Cover photos', back: () => go('setup') })}
        <main class="container cover">
          <p class="hint">Three photos appear on the report cover.</p>
          <div class="cover__grid">
            ${SLOTS.map(
              (s, i) => html`
                <div class="cover__slot">
                  ${urls[i]
                    ? html`
                        <img src=${urls[i]!} alt="${s.label}" />
                        <button
                          class="cover__remove"
                          aria-label="Remove photo"
                          @click=${async () => {
                            const ok = await confirmDialog({
                              title: 'Remove photo?',
                              message: 'This cover photo will be removed from the report.',
                              destructive: true,
                              confirmLabel: 'Remove',
                            });
                            if (ok) void removePhoto(i);
                          }}
                        >
                          ×
                        </button>
                      `
                    : html`
                        <div class="cover__placeholder">
                          <span class="cover__placeholder-label">${s.label}</span>
                          <span class="cover__placeholder-sub">${s.sub}</span>
                        </div>
                        ${PhotoAttach({ onPicked: (f) => void pickPhoto(i, f), label: s.label })}
                      `}
                </div>
              `,
            )}
          </div>

          <div class="cover__actions">
            ${Button({
              label: 'Continue → confirm rooms',
              full: true,
              size: 'lg',
              onClick: () => go('room-setup'),
            })}
            ${Button({
              label: 'Skip cover photos for now',
              full: true,
              variant: 'ghost',
              onClick: () => go('room-setup'),
            })}
          </div>
        </main>
        ${Footer()}
      </section>
    `;
  }

  void load();
  return view();
}
