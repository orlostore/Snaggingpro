import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { confirmDialog } from '@/components/Confirm';
import { loadDraft, saveDraft } from '@/state/persist';
import { statsForRoom } from '@/domain/snags';
import { go } from '@/lib/router';

export function Dashboard(rootEl: HTMLElement): TemplateResult {
  function paint() {
    render(view(), rootEl);
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

    const rooms = s.roomOrder.map((id) => s.rooms[id]!).filter(Boolean);
    const visible = rooms.filter((r) => !r.excluded);
    const hidden = rooms.filter((r) => r.excluded);
    const totalIssues = visible.reduce((n, r) => n + statsForRoom(r).issue, 0);
    const completed = visible.filter((r) => {
      const st = statsForRoom(r);
      return st.pending === 0 && st.total > 0;
    }).length;
    const pendingRooms = visible.length - completed;

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
            <div class="dash-meta__stats">
              <div>
                <strong>${completed}</strong> / ${visible.length} rooms done
              </div>
              ${pendingRooms > 0
                ? html`<div class="dash-meta__pending">${pendingRooms} pending</div>`
                : null}
              <div class="dash-meta__issues">${totalIssues} issues logged</div>
            </div>
          </div>

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
                  <div class="room-card__icon">${room.icon}</div>
                  <div class="room-card__label">${room.label}</div>
                  <div class="room-card__meta">
                    ${st.inspected}/${st.total} inspected
                  </div>
                  <div class="room-card__pills">
                    ${complete
                      ? html`<span class="pill pill--ok">✓ Complete</span>`
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
                          <span>${r.icon} ${r.label}</span>
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
              label: '📋 Generate Report',
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
