import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { loadDraft, saveDraft } from '@/state/persist';
import { DISC_LABELS, DISC_ICONS, type Discipline } from '@/domain/disciplines';
import type { Item, RoomState } from '@/state/schema';
import { go } from '@/lib/router';
import { toast } from '@/components/Toast';

interface LocalView {
  activeDisc: Discipline | null;
}

export function Room(rootEl: HTMLElement, roomId: string): TemplateResult {
  const view: LocalView = { activeDisc: null };

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
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  function setNote(itemKey: string, text: string) {
    const s = loadDraft();
    if (!s) return;
    const item = s.rooms[roomId]?.items[itemKey];
    if (!item) return;
    item.note = text;
    s.job.updatedAt = Date.now();
    saveDraft(s);
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
              toast('Marked as issue — add a note');
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
        ${item.status === 'issue'
          ? html`
              <textarea
                class="item__note"
                placeholder="Describe the issue…"
                .value=${item.note}
                @input=${(e: Event) => setNote(item.key, (e.target as HTMLTextAreaElement).value)}
              ></textarea>
            `
          : null}
      </li>
    `;
  }

  return render_();
}
