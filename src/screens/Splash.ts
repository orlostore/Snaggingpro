import { html, type TemplateResult } from 'lit-html';
import { Button } from '@/components/Button';
import { go } from '@/lib/router';
import { loadDraft } from '@/state/persist';

export function Splash(): TemplateResult {
  const draft = loadDraft();
  return html`
    <section class="screen splash">
      <div class="container splash__inner">
        <div class="splash__logo">
          <span>Snagging</span><em>Pro</em>
        </div>
        <p class="splash__tagline">Professional property inspections, UAE.</p>
        <div class="splash__actions">
          ${Button({ label: '+ New Inspection', full: true, size: 'lg', onClick: () => go('pin', { to: 'setup' }) })}
          ${draft
            ? Button({
                label: 'Resume Last Session',
                full: true,
                size: 'lg',
                variant: 'secondary',
                onClick: () => go('pin', { to: 'dashboard' }),
              })
            : null}
          ${Button({
            label: 'Reports Library',
            full: true,
            size: 'lg',
            variant: 'ghost',
            onClick: () => go('pin', { to: 'library' }),
          })}
        </div>
      </div>
    </section>
  `;
}
