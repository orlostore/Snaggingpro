import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { loadDraft, saveDraft } from '@/state/persist';
import { statsForRoom } from '@/domain/snags';
import { go } from '@/lib/router';

export function Dashboard(rootEl: HTMLElement): TemplateResult {
  function paint() {
    render(view(), rootEl);
  }

  function toggleExcluded(roomId: string) {
    const s = loadDraft();
    if (!s) return;
    const room = s.rooms[roomId];
    if (!room) return;
    const hasData = Object.values(room.items).some((i) => i.status !== 'pending');
    if (!room.excluded && hasData && !confirm('This room has data. Mark as Not Applicable?'))
      return;
    room.excluded = !room.excluded;
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
    const totalIssues = rooms
      .filter((r) => !r.excluded)
      .reduce((n, r) => n + statsForRoom(r).issue, 0);
    const completed = rooms.filter((r) => {
      if (r.excluded) return false;
      const st = statsForRoom(r);
      return st.pending === 0 && st.total > 0;
    }).length;

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
              <div><strong>${completed}</strong>/${rooms.filter((r) => !r.excluded).length} rooms</div>
              <div class="dash-meta__issues">${totalIssues} issues</div>
            </div>
          </div>

          <div class="room-grid">
            ${rooms.map((room) => {
              const st = statsForRoom(room);
              const complete = !room.excluded && st.total > 0 && st.pending === 0;
              return html`
                <div
                  class="room-card ${room.excluded ? 'room-card--excluded' : ''} ${complete
                    ? 'room-card--complete'
                    : ''} ${st.issue > 0 ? 'room-card--issues' : ''}"
                  @click=${() => (room.excluded ? toggleExcluded(room.id) : go('room', { id: room.id }))}
                >
                  <div class="room-card__icon">${room.icon}</div>
                  <div class="room-card__label">${room.label}</div>
                  <div class="room-card__meta">
                    ${room.excluded
                      ? 'Not applicable'
                      : `${st.inspected}/${st.total} inspected · ${st.issue} issues`}
                  </div>
                  ${!room.excluded
                    ? html`
                        <button
                          class="btn btn--ghost btn--sm"
                          @click=${(e: Event) => {
                            e.stopPropagation();
                            toggleExcluded(room.id);
                          }}
                        >
                          N/A
                        </button>
                      `
                    : html`
                        <button
                          class="btn btn--ghost btn--sm"
                          @click=${(e: Event) => {
                            e.stopPropagation();
                            toggleExcluded(room.id);
                          }}
                        >
                          Restore
                        </button>
                      `}
                </div>
              `;
            })}
          </div>

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
