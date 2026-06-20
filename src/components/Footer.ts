import { html, type TemplateResult } from 'lit-html';
import { ENV } from '@/lib/env';
import { confirmDialog } from './Confirm';
import { forceRefresh } from '@/lib/forceRefresh';
import { SyncStatusBadge } from './SyncStatus';

async function onTapVersion() {
  const ok = await confirmDialog({
    title: 'Force refresh?',
    message:
      'Drop every cached service worker + asset and re-download the latest from snaggingpro.pages.dev. Your reports and photos are kept (they live in IndexedDB, untouched).',
    confirmLabel: 'Force refresh',
  });
  if (ok) await forceRefresh();
}

export function Footer(): TemplateResult {
  const year = new Date().getFullYear();
  return html`
    <footer class="app-footer">
      <div class="app-footer__inner container">
        <span class="app-footer__brand">${ENV.appName}</span>
        <span class="app-footer__sep">·</span>
        <span class="app-footer__copy">© ${year}</span>
        <span class="app-footer__sep">·</span>
        <button
          class="app-footer__ver"
          title="Force refresh (drops cached service worker + assets)"
          @click=${() => void onTapVersion()}
        >
          v${ENV.buildVersion}
        </button>
        <span class="app-footer__sep">·</span>
        ${SyncStatusBadge()}
      </div>
    </footer>
  `;
}
