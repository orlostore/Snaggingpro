import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { loadDraft } from '@/state/persist';
import { generateReportHtml } from '@/report/generate';
import { reportsRepo } from '@/storage/reports';
import { TYPO_RULES, scanText, type TypoIssue } from '@/domain/typoRules';
import { collectSnags } from '@/domain/snags';
import { toast } from '@/components/Toast';
import { go } from '@/lib/router';

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

  function open() {
    const s = loadDraft();
    if (!s) return;
    const win = window.open('', '_blank');
    if (!win) {
      toast('Popup blocked — allow popups to print');
      return;
    }
    win.document.open();
    win.document.write(generateReportHtml(s));
    win.document.close();
  }

  async function saveToLibrary() {
    const s = loadDraft();
    if (!s) return;
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
              label: '🖨 Open print view',
              full: true,
              size: 'lg',
              onClick: open,
            })}
            ${Button({
              label: 'Save to library',
              full: true,
              size: 'lg',
              variant: 'secondary',
              onClick: () => void saveToLibrary().then(paint),
            })}
            ${Button({
              label: 'Reports library →',
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
