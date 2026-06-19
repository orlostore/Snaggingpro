/**
 * Three-button bottom sheet for picking snag severity.
 * Opened when the inspector taps ⚠ Issue on an item.
 */

import { html, render, type TemplateResult } from 'lit-html';
import { SEVERITY_LABEL, SEVERITY_DESCRIPTION, type Severity } from '@/domain/snags';

export interface SeverityPickerOptions {
  itemLabel: string;
  initial?: Severity | null;
  onPick: (severity: Severity) => void;
  onCancel: () => void;
}

let host: HTMLDivElement | null = null;

function ensureHost(): HTMLDivElement {
  if (!host) {
    host = document.createElement('div');
    host.className = 'severity-host';
    document.body.appendChild(host);
  }
  return host;
}

export function openSeverityPicker(opts: SeverityPickerOptions): void {
  function close() {
    render(html``, ensureHost());
  }

  function pick(sev: Severity) {
    close();
    opts.onPick(sev);
  }

  function cancel() {
    close();
    opts.onCancel();
  }

  function row(sev: Severity, hint: string): TemplateResult {
    return html`
      <button class="sev-row sev-row--${sev}" @click=${() => pick(sev)}>
        <div class="sev-row__head">
          <span class="sev-row__pill">${SEVERITY_LABEL[sev]}</span>
          <span class="sev-row__hint">${hint}</span>
        </div>
        <div class="sev-row__body">${SEVERITY_DESCRIPTION[sev]}</div>
      </button>
    `;
  }

  render(
    html`
      <div class="modal-backdrop" @click=${cancel}></div>
      <div class="sev-sheet" role="dialog" aria-modal="true" aria-label="Pick severity">
        <header class="sev-sheet__head">
          <h2 class="sev-sheet__title">How severe is this snag?</h2>
          <p class="sev-sheet__sub">${opts.itemLabel}</p>
        </header>
        <div class="sev-sheet__rows">
          ${row('critical', 'safety / system failure')}
          ${row('major', 'significant defect')}
          ${row('minor', 'cosmetic / workmanship')}
        </div>
        <button class="sev-sheet__cancel" @click=${cancel}>Cancel</button>
      </div>
    `,
    ensureHost(),
  );
}
