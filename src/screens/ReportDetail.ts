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
import { ENV } from '@/lib/env';
import { listAcknowledgements, getSignatureUrl, type AcknowledgementDto } from '@/lib/acknowledgements';
import type { State } from '@/state/schema';

export function ReportDetail(rootEl: HTMLElement, id: string): TemplateResult {
  let report: State | null = null;
  const acks: { items: AcknowledgementDto[]; loading: boolean; sigUrls: Map<string, string> } = {
    items: [],
    loading: false,
    sigUrls: new Map(),
  };

  function paint() {
    render(view(), rootEl);
  }

  async function load() {
    report = (await reportsRepo.getReport(id)) ?? null;
    paint();
    if (report && ENV.cloudEnabled) void loadAcks(report.job.ref);
  }

  async function loadAcks(jobRef: string) {
    acks.loading = true;
    paint();
    try {
      acks.items = await listAcknowledgements(jobRef);
      for (const a of acks.items) {
        if (a.signatureKey && !acks.sigUrls.has(a.id)) {
          getSignatureUrl(a.id)
            .then((url) => {
              acks.sigUrls.set(a.id, url);
              paint();
            })
            .catch(() => {
              /* missing signature — receipt still shows */
            });
        }
      }
    } catch {
      acks.items = [];
    } finally {
      acks.loading = false;
      paint();
    }
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

  function acknowledgementsBlock(): TemplateResult {
    return html`
      <section class="ack-block">
        <div class="ack-block__head">
          ${Icon({ name: 'check', size: 16 })}
          <span>Client agreement record</span>
        </div>
        ${acks.loading
          ? html`<p class="meta">Loading…</p>`
          : acks.items.length === 0
            ? html`<p class="meta">
                No agreement recorded for this job yet. When the client opens the T&amp;C link
                and taps "I Agree", the signed record will appear here.
              </p>`
            : html`
                <ul class="ack-list">
                  ${acks.items.map(
                    (a) => html`
                      <li class="ack-row">
                        <div class="ack-row__head">
                          <strong>${a.typedName}</strong>
                          <span class="meta">${new Date(a.acknowledgedAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</span>
                        </div>
                        ${acks.sigUrls.get(a.id)
                          ? html`<img class="ack-sig" src=${acks.sigUrls.get(a.id)!} alt="Client signature" />`
                          : a.signatureKey
                            ? html`<div class="ack-sig ack-sig--loading">Loading signature…</div>`
                            : null}
                        <dl class="ack-meta">
                          ${a.country || a.city
                            ? html`<div><dt>Location</dt><dd>${[a.city, a.country].filter(Boolean).join(', ')}</dd></div>`
                            : null}
                          ${a.ipAddress
                            ? html`<div><dt>IP address</dt><dd>${a.ipAddress}</dd></div>`
                            : null}
                          ${a.userAgent
                            ? html`<div><dt>Device</dt><dd>${a.userAgent}</dd></div>`
                            : null}
                          <div><dt>Record ID</dt><dd><code>${a.id}</code></dd></div>
                        </dl>
                      </li>
                    `,
                  )}
                </ul>
              `}
      </section>
    `;
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

          ${ENV.cloudEnabled ? acknowledgementsBlock() : null}
        </main>
        ${Footer()}
      </section>
    `;
  }

  void load();
  return view();
}
