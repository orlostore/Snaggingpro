import { html, type TemplateResult } from 'lit-html';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Footer } from '@/components/Footer';
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
          ${Button({
            label: html`${Icon({ name: 'plus', size: 18 })} New Inspection`,
            full: true,
            size: 'lg',
            onClick: () => go('pin', { to: 'setup' }),
          })}
          ${draft
            ? Button({
                label: html`${Icon({ name: 'undo', size: 18 })} Resume Last Session`,
                full: true,
                size: 'lg',
                variant: 'secondary',
                onClick: () => go('pin', { to: 'dashboard' }),
              })
            : null}
          ${Button({
            label: html`${Icon({ name: 'library', size: 18 })} Reports Library`,
            full: true,
            size: 'lg',
            variant: 'ghost',
            onClick: () => go('pin', { to: 'library' }),
          })}
        </div>
      </div>
      ${Footer()}
    </section>
  `;
}
