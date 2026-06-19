/**
 * Promise-based text prompt modal — replaces native window.prompt().
 * Used wherever a single short string is needed (DB Panel location, etc.).
 */

import { html, render } from 'lit-html';
import { Modal } from './Modal';

export interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

let host: HTMLDivElement | null = null;

function ensureHost(): HTMLDivElement {
  if (!host) {
    host = document.createElement('div');
    host.className = 'prompt-host';
    document.body.appendChild(host);
  }
  return host;
}

export function promptDialog(opts: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    let current = opts.initial ?? '';

    const close = (value: string | null) => {
      render(html``, ensureHost());
      resolve(value);
    };

    render(
      Modal({
        title: opts.title,
        body: html`
          ${opts.message ? html`<p>${opts.message}</p>` : null}
          <input
            class="field__input"
            style="width:100%;margin-top:8px"
            placeholder=${opts.placeholder ?? ''}
            .value=${current}
            @input=${(e: Event) => {
              current = (e.target as HTMLInputElement).value;
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter') close(current.trim());
            }}
          />
        `,
        primaryLabel: opts.confirmLabel ?? 'Save',
        secondaryLabel: opts.cancelLabel ?? 'Cancel',
        onPrimary: () => close(current.trim()),
        onSecondary: () => close(null),
        onClose: () => close(null),
      }),
      ensureHost(),
    );
  });
}
