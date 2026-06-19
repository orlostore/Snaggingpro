import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { loadDraft } from '@/state/persist';
import { generateReportHtml } from '@/report/generate';
import { reportsRepo } from '@/storage/reports';
import { TYPO_RULES, scanText, type TypoIssue } from '@/domain/typoRules';
import { collectSnags, reportIncompleteIssues } from '@/domain/snags';
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
    if (reportIncompleteIssues(s).length > 0) {
      toast('Add a note and photo to every issue before generating the report');
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
    if (reportIncompleteIssues(s).length > 0) {
      toast('Add a note and photo to every issue before saving');
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
    const incomplete = reportIncompleteIssues(s);
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

          ${incomplete.length > 0
            ? html`
                <div class="card report-screen__block">
                  <h2 class="section-title report-screen__block-title">
                    ${Icon({ name: 'alert', size: 18 })}
                    ${incomplete.length} issue${incomplete.length === 1 ? '' : 's'} need attention
                  </h2>
                  <p>
                    Every snag must have both a written description and at least one photo. Fix each item
                    below, then come back to generate the report.
                  </p>
                  <ul class="report-screen__missing">
                    ${incomplete.slice(0, 50).map(
                      (m) => html`
                        <li>
                          <button
                            class="report-screen__missing-row"
                            @click=${() =>
                              go('room', { id: m.roomId, focus: m.itemKey, disc: m.disc })}
                          >
                            <span class="report-screen__missing-text">
                              <strong>${m.roomLabel}</strong>
                              <span class="report-screen__missing-item">${m.itemLabel}</span>
                            </span>
                            <span class="report-screen__missing-tags">
                              ${m.missingNote
                                ? html`<span class="report-screen__tag">${Icon({ name: 'pencil', size: 12 })} note</span>`
                                : null}
                              ${m.missingPhoto
                                ? html`<span class="report-screen__tag">${Icon({ name: 'camera', size: 12 })} photo</span>`
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
              disabled: incomplete.length > 0,
              onClick: () => void open(),
            })}
            ${Button({
              label: html`${Icon({ name: 'save', size: 18 })} Save to library`,
              full: true,
              size: 'lg',
              variant: 'secondary',
              disabled: incomplete.length > 0,
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
