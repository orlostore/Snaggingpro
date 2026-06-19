import { html, render, type TemplateResult } from 'lit-html';

let host: HTMLDivElement | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function ensureHost(): HTMLDivElement {
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  return host;
}

function renderToast(content: TemplateResult | null): void {
  render(content ?? html``, ensureHost());
}

export function toast(message: string, ms = 2500): void {
  if (timer) clearTimeout(timer);
  renderToast(html`<div class="toast" role="status">${message}</div>`);
  timer = setTimeout(() => renderToast(null), ms);
}
