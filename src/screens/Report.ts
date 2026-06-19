import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { loadDraft } from '@/state/persist';
import { generateReportHtml } from '@/report/generate';
import { reportsRepo } from '@/storage/reports';
import { TYPO_RULES, scanText, type TypoIssue } from '@/domain/typoRules';
import { collectSnags, reportNeedsAttention } from '@/domain/snags';
import { toast } from '@/components/Toast';
import { go } from '@/lib/router';
import { Icon } from '@/components/Icon';

export function Report(rootEl: HTMLElement): TemplateResult {
  const issues: TypoIssue[] = [];

  function scan(): TypoIssue[] {
    const s = loadDraft();
    if (!s) return [];
    const out: TypoIssue[] = [];
    for (const roomId of s.roomOrder) {
      const room = s.rooms[roomId];
      if (!room || room.excluded) continue;
      for (const item of Object.values(room.items)) {
        const targets = [
          ...(item.note ? [{ text: item.note, obsId: null as string | null }] : []),
          ...item.observations.map((o) => ({ text: o.text, obsId: o.id })),
        ];
        for (const t of targets) {
          for (const issue of scanText(t.text)) {
            const rule = TYPO_RULES[issue.ruleIndex];
            if (!rule) continue;
            out.push({
              roomId,
              itemKey: item.key,
              observationId: t.obsId,
              ruleIndex: issue.ruleIndex,
              ruleLabel: issue.ruleLabel,
              originalText: t.text,
              suggestedText: issue.suggested,
              start: 0,
              end: t.text.length,
            });
          }
        }
      }
    }
    return out;
  }

  async function open() {
    const s = loadDraft();
    if (!s) return;
    if (reportNeedsAttention(s).length > 0) {
      toast('Finish every item before generating the report');
      return;
    }
    const win = window.open('', '_blank');
    if (!win) {
      toast('Popup blocked — allow popups to print');
      return;
    }
    toast('Preparing report…');
    const html = await generateReportHtml(s);
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  async function saveToLibrary() {
    const s = loadDraft();
    if (!s) return;
    if (reportNeedsAttention(s).length > 0) {
      toast('Finish every item before saving');
      return;
    }
    s.job.status = 'completed';
    await reportsRepo.saveReport(s);
    toast('Saved to library');
  }

  function paint() {
    render(view(), rootEl);
  }

  function view(): TemplateResult {
    const s = loadDraft();
    if (!s) {
      queueMicrotask(() => go('splash'));
      return html``;
    }
    const snags = collectSnags(s);
    const isFollowUp = s.job.reportType === 'follow-up';
    const attention = reportNeedsAttention(s);
    const pendingCount = attention.filter((a) => a.needsInspect).length;
    const reviewCount = attention.filter((a) => a.needsReview).length;
    const closeoutGap = attention.filter(
      (a) => a.missingCloseoutNote || a.missingCloseoutPhoto,
    ).length;
    const issueGapCount = attention.filter(
      (a) => (a.missingNote || a.missingPhoto) && !a.needsInspect,
    ).length;
    const found = issues.length ? issues : scan();
    issues.splice(0, issues.length, ...found);

    return html`
      <section class="screen">
        ${Header({ title: 'Report', back: () => go('dashboard') })}
        <main class="container report-screen">
          <div class="card">
            <h2 class="section-title">Summary</h2>
            <p>Total snags: <strong>${snags.length}</strong></p>
            <p>Critical: <strong>${snags.filter((s) => s.severity === 'critical').length}</strong></p>
          </div>

          ${attention.length > 0
            ? html`
                <div class="card report-screen__block">
                  <h2 class="section-title report-screen__block-title">
                    ${Icon({ name: 'alert', size: 18 })}
                    ${attention.length} item${attention.length === 1 ? '' : 's'} need attention
                  </h2>
                  <p>
                    ${pendingCount > 0
                      ? html`<strong>${pendingCount}</strong> still untouched (mark Pass / Issue / N/A).<br />`
                      : null}
                    ${issueGapCount > 0
                      ? html`<strong>${issueGapCount}</strong> issue${issueGapCount === 1 ? '' : 's'} missing a note or photo.<br />`
                      : null}
                    ${isFollowUp && reviewCount > 0
                      ? html`<strong>${reviewCount}</strong> snag${reviewCount === 1 ? '' : 's'} not yet reviewed (Still open / Fixed / New).<br />`
                      : null}
                    ${isFollowUp && closeoutGap > 0
                      ? html`<strong>${closeoutGap}</strong> Fixed/New entr${closeoutGap === 1 ? 'y is' : 'ies are'} missing a closeout note or photo.`
                      : null}
                  </p>
                  <ul class="report-screen__missing">
                    ${attention.slice(0, 50).map(
                      (m) => html`
                        <li>
                          <button
                            class="report-screen__missing-row"
                            @click=${() =>
                              go('room', {
                                id: m.roomId,
                                focus: m.itemKey,
                                disc: m.disc,
                                from: 'report',
                              })}
                          >
                            <span class="report-screen__missing-text">
                              <strong>${m.roomLabel}</strong>
                              <span class="report-screen__missing-item">${m.itemLabel}</span>
                            </span>
                            <span class="report-screen__missing-tags">
                              ${m.needsInspect
                                ? html`<span class="report-screen__tag">${Icon({ name: 'eye', size: 12 })} inspect</span>`
                                : null}
                              ${m.missingNote
                                ? html`<span class="report-screen__tag">${Icon({ name: 'pencil', size: 12 })} note</span>`
                                : null}
                              ${m.missingPhoto
                                ? html`<span class="report-screen__tag">${Icon({ name: 'camera', size: 12 })} photo</span>`
                                : null}
                              ${m.needsReview
                                ? html`<span class="report-screen__tag">${Icon({ name: 'eye', size: 12 })} review</span>`
                                : null}
                              ${m.missingCloseoutNote
                                ? html`<span class="report-screen__tag">${Icon({ name: 'pencil', size: 12 })} closeout note</span>`
                                : null}
                              ${m.missingCloseoutPhoto
                                ? html`<span class="report-screen__tag">${Icon({ name: 'camera', size: 12 })} closeout photo</span>`
                                : null}
                              ${Icon({ name: 'chevron-right', size: 16 })}
                            </span>
                          </button>
                        </li>
                      `,
                    )}
                  </ul>
                </div>
              `
            : null}

          ${found.length
            ? html`
                <div class="card spellcheck">
                  <h2 class="section-title">Possible typos (${found.length})</h2>
                  <ul>
                    ${found
                      .slice(0, 20)
                      .map(
                        (i) => html`
                          <li class="spellcheck__row">
                            <div class="spellcheck__rule">${i.ruleLabel}</div>
                            <div class="spellcheck__before">${i.originalText}</div>
                            <div class="spellcheck__after">${i.suggestedText}</div>
                          </li>
                        `,
                      )}
                  </ul>
                  <p class="hint">Review and edit on the room screens, then re-open this page.</p>
                </div>
              `
            : null}

          <div class="report-screen__actions">
            ${Button({
              label: html`${Icon({ name: 'print', size: 18 })} Open print view`,
              full: true,
              size: 'lg',
              disabled: attention.length > 0,
              onClick: () => void open(),
            })}
            ${Button({
              label: html`${Icon({ name: 'save', size: 18 })} Save to library`,
              full: true,
              size: 'lg',
              variant: 'secondary',
              disabled: attention.length > 0,
              onClick: () => void saveToLibrary().then(paint),
            })}
            ${Button({
              label: html`${Icon({ name: 'library', size: 18 })} Reports library`,
              full: true,
              variant: 'ghost',
              onClick: () => go('library'),
            })}
          </div>
        </main>
        ${Footer()}
      </section>
    `;
  }

  return view();
}
