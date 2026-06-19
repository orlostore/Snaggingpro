import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { confirmDialog } from '@/components/Confirm';
import { toast } from '@/components/Toast';
import { reportsRepo } from '@/storage/reports';
import { deletePhotosForJob } from '@/storage/photos';
import { go } from '@/lib/router';
import { formatDateLong } from '@/lib/format';
import type { ReportSummary } from '@/state/schema';

export function Library(rootEl: HTMLElement): TemplateResult {
  const ctx: { summaries: ReportSummary[]; query: string } = { summaries: [], query: '' };

  function paint() {
    render(view(), rootEl);
  }

  async function load() {
    ctx.summaries = await reportsRepo.listSummaries();
    paint();
  }

  async function remove(id: string) {
    const ok = await confirmDialog({
      title: 'Delete report?',
      message: 'This permanently deletes the report and its photos. This cannot be undone.',
      destructive: true,
      confirmLabel: 'Delete report',
    });
    if (!ok) return;
    await reportsRepo.deleteReport(id);
    await deletePhotosForJob(id);
    toast('Report deleted');
    await load();
  }

  function filtered(): ReportSummary[] {
    if (!ctx.query.trim()) return ctx.summaries;
    const q = ctx.query.toLowerCase();
    return ctx.summaries.filter(
      (s) =>
        s.clientName.toLowerCase().includes(q) ||
        s.community.toLowerCase().includes(q) ||
        s.unit.toLowerCase().includes(q) ||
        s.jobRef.toLowerCase().includes(q),
    );
  }

  function view(): TemplateResult {
    const rows = filtered();
    return html`
      <section class="screen">
        ${Header({ title: 'Reports library', back: () => go('splash') })}
        <main class="container library">
          <input
            class="field__input"
            type="search"
            placeholder="Search by client, project, unit, ref…"
            .value=${ctx.query}
            @input=${(e: Event) => {
              ctx.query = (e.target as HTMLInputElement).value;
              paint();
            }}
          />
          ${rows.length === 0
            ? html`<div class="empty">No reports saved yet.</div>`
            : html`
                <ul class="library__list">
                  ${rows.map(
                    (s) => html`
                      <li class="library__row">
                        <button
                          class="library__main"
                          @click=${() => go('report-detail', { id: s.id })}
                        >
                          <div class="library__title">${s.clientName || 'Unnamed client'}</div>
                          <div class="library__sub">
                            ${s.jobRef} · ${formatDateLong(s.date)}
                            ${s.reportType === 'follow-up' ? html` · <em>follow-up</em>` : null}
                          </div>
                          <div class="library__meta">
                            ${s.community}${s.unit ? ` · Unit ${s.unit}` : ''} · ${s.totalSnags}
                            snags · ${s.criticalSnags} critical
                          </div>
                        </button>
                        ${Button({
                          label: 'Delete',
                          variant: 'ghost',
                          size: 'sm',
                          onClick: () => void remove(s.id),
                        })}
                      </li>
                    `,
                  )}
                </ul>
              `}
        </main>
        ${Footer()}
      </section>
    `;
  }

  void load();
  return view();
}
