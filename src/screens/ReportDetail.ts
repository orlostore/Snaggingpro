import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { confirmDialog } from '@/components/Confirm';
import { toast } from '@/components/Toast';
import { reportsRepo } from '@/storage/reports';
import { saveDraft } from '@/state/persist';
import { cloneAsFollowUp } from '@/state/init';
import { nextJobSeq } from '@/state/jobRef';
import { generateReportHtml } from '@/report/generate';
import { collectSnags } from '@/domain/snags';
import { go } from '@/lib/router';
import { formatDateLong } from '@/lib/format';
import { Icon } from '@/components/Icon';
import type { State } from '@/state/schema';

export function ReportDetail(rootEl: HTMLElement, id: string): TemplateResult {
  let report: State | null = null;

  function paint() {
    render(view(), rootEl);
  }

  async function load() {
    report = (await reportsRepo.getReport(id)) ?? null;
    paint();
  }

  async function openPrint() {
    if (!report) return;
    const w = window.open('', '_blank');
    if (!w) {
      toast('Popup blocked');
      return;
    }
    toast('Preparing report…');
    const html = await generateReportHtml(report);
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  async function editReport() {
    if (!report) return;
    const ok = await confirmDialog({
      title: 'Edit this report?',
      message:
        'The report will be loaded back into the inspection editor. Saving will overwrite the stored copy.',
      confirmLabel: 'Edit',
    });
    if (!ok) return;
    saveDraft(report);
    go('dashboard');
  }

  async function startFollowUp() {
    if (!report) return;
    const ok = await confirmDialog({
      title: 'Start a follow-up inspection?',
      message:
        'A new inspection is created with all current snags. Mark each as Fixed, Still Open, or New.',
      confirmLabel: 'Start follow-up',
    });
    if (!ok) return;
    const now = new Date();
    const seq = await nextJobSeq(now);
    const next = cloneAsFollowUp(report, now, seq);
    saveDraft(next);
    toast('Follow-up draft created');
    go('dashboard');
  }

  function view(): TemplateResult {
    if (!report) {
      return html`<section class="screen"><div class="empty">Loading…</div></section>`;
    }
    const snags = collectSnags(report);
    return html`
      <section class="screen">
        ${Header({ title: report.job.ref, back: () => go('library') })}
        <main class="container">
          <div class="card">
            <h2 class="section-title">${report.client.name || 'Unnamed client'}</h2>
            <p class="meta">${formatDateLong(report.job.date)} · ${report.job.reportType}</p>
            <p class="meta">
              ${report.property.developer}${report.property.developer && report.property.community
                ? ' · '
                : ''}${report.property.community}
              ${report.property.unit ? html` · Unit ${report.property.unit}` : null}
            </p>
            <p>Snags: <strong>${snags.length}</strong> · Critical:
              <strong>${snags.filter((s) => s.severity === 'critical').length}</strong>
            </p>
          </div>

          <div class="report-detail__actions">
            ${Button({
              label: html`${Icon({ name: 'print', size: 18 })} Print / PDF`,
              full: true,
              size: 'lg',
              onClick: () => void openPrint(),
            })}
            ${Button({
              label: html`${Icon({ name: 'pencil', size: 18 })} Edit this report`,
              full: true,
              variant: 'secondary',
              onClick: () => void editReport(),
            })}
            ${Button({
              label: html`${Icon({ name: 'undo', size: 18 })} Start follow-up inspection`,
              full: true,
              variant: 'secondary',
              onClick: () => void startFollowUp(),
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
