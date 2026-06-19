/**
 * Promise-based confirm modal — replaces native confirm().
 * Used everywhere a destructive action needs explicit user OK.
 */

import { html, render } from 'lit-html';
import { Modal } from './Modal';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

let host: HTMLDivElement | null = null;

function ensureHost(): HTMLDivElement {
  if (!host) {
    host = document.createElement('div');
    host.className = 'confirm-host';
    document.body.appendChild(host);
  }
  return host;
}

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const close = (value: boolean) => {
      render(html``, ensureHost());
      resolve(value);
    };
    render(
      Modal({
        title: opts.title,
        body: html`<p>${opts.message}</p>`,
        primaryLabel: opts.confirmLabel ?? (opts.destructive ? 'Delete' : 'Confirm'),
        secondaryLabel: opts.cancelLabel ?? 'Cancel',
        onPrimary: () => close(true),
        onSecondary: () => close(false),
        onClose: () => close(false),
      }),
      ensureHost(),
    );
  });
}
