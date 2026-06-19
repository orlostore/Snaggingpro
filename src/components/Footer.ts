import { html, type TemplateResult } from 'lit-html';
import { ENV } from '@/lib/env';

export function Footer(): TemplateResult {
  const year = new Date().getFullYear();
  return html`
    <footer class="app-footer">
      <div class="app-footer__inner container">
        <span class="app-footer__brand">${ENV.appName}</span>
        <span class="app-footer__sep">·</span>
        <span class="app-footer__copy">© ${year}</span>
        <span class="app-footer__sep">·</span>
        <span class="app-footer__ver">v${ENV.buildVersion}</span>
      </div>
    </footer>
  `;
}
