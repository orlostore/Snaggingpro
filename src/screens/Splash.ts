import { html, type TemplateResult } from 'lit-html';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { Footer } from '@/components/Footer';
import { go } from '@/lib/router';
import { loadDraft } from '@/state/persist';
import { inspectionProgress } from '@/domain/progress';
import type { State } from '@/state/schema';

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function resumeCard(draft: State): TemplateResult {
  const p = inspectionProgress(draft);
  const where = [draft.property.community, draft.property.unit && `Unit ${draft.property.unit}`]
    .filter(Boolean)
    .join(' · ');
  return html`
    <button class="resume" @click=${() => go('pin', { to: 'dashboard' })}>
      <span class="resume__eyebrow">Continue inspection · ${draft.job.ref}</span>
      <span class="resume__client">${draft.client.name || 'Unnamed client'}</span>
      ${where ? html`<span class="resume__where">${where}</span>` : null}
      <span class="resume__bar"><span style="width:${p.pct}%"></span></span>
      <span class="resume__meta">
        <span>${p.pct}% inspected · ${p.roomsDone}/${p.roomsTotal} rooms</span>
        ${Icon({ name: 'arrow-right', size: 18 })}
      </span>
    </button>
  `;
}

function linkRow(icon: IconName, label: string, to: string): TemplateResult {
  return html`
    <button class="splash__link" @click=${() => go('pin', { to })}>
      <span class="splash__link-icon">${Icon({ name: icon, size: 18 })}</span>
      <span>${label}</span>
      ${Icon({ name: 'chevron-right', size: 18 })}
    </button>
  `;
}

export function Splash(): TemplateResult {
  const draft = loadDraft();
  return html`
    <section class="screen splash">
      <div class="container splash__inner">
        <header class="splash__brand">
          <div class="splash__logo"><span>Snagging</span><em>Pro</em></div>
          <div class="splash__rule" aria-hidden="true"></div>
        </header>

        <div class="splash__hero">
          <p class="splash__eyebrow">${greeting(new Date())}</p>
          <h1 class="splash__headline">Every detail,<br /><em>inspected.</em></h1>
          <p class="splash__tagline">Independent property inspections · UAE</p>
        </div>

        <div class="splash__actions">
          ${draft ? resumeCard(draft) : null}
          ${Button({
            label: html`${Icon({ name: 'plus', size: 18 })} New inspection`,
            full: true,
            size: 'lg',
            onClick: () => go('pin', { to: 'setup' }),
          })}
          <nav class="splash__links" aria-label="Library">
            ${linkRow('library', 'Reports library', 'library')}
            ${linkRow('quote', 'Quotations', 'quotations')}
          </nav>
        </div>
      </div>
      ${Footer()}
    </section>
  `;
}
