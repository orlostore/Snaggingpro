import { html, render, type TemplateResult } from 'lit-html';
import { Icon, type IconName } from '@/components/Icon';
import { Footer } from '@/components/Footer';
import { go } from '@/lib/router';
import { ENV } from '@/lib/env';
import { loadDraft } from '@/state/persist';
import { inspectionProgress } from '@/domain/progress';
import { reportsRepo } from '@/storage/reports';
import { quotesRepo } from '@/storage/quotes';
import { loadAckIndex } from '@/lib/acknowledgements';
import type { State } from '@/state/schema';

interface HomeFigures {
  thisMonth: number;
  quotesOpen: number;
  third: { value: number; label: string };
}

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

async function loadFigures(): Promise<HomeFigures> {
  const [summaries, quotes] = await Promise.all([reportsRepo.listSummaries(), quotesRepo.list()]);
  const now = new Date();
  const thisMonth = summaries.filter((s) => {
    const d = new Date(s.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const quotesOpen = quotes.filter((q) => q.status === 'issued').length;
  if (!ENV.cloudEnabled) return { thisMonth, quotesOpen, third: { value: summaries.length, label: 'Reports' } };
  const acks = await loadAckIndex();
  const signed = quotes.filter((q) => acks.has(q.jobRef)).length;
  return { thisMonth, quotesOpen, third: { value: signed, label: 'T&C signed' } };
}

export function Splash(rootEl: HTMLElement): TemplateResult {
  const draft = loadDraft();
  let figures: HomeFigures | null = null;

  function paint() {
    render(view(), rootEl);
  }

  function resumeCard(d: State): TemplateResult {
    const p = inspectionProgress(d);
    const where = [d.property.community, d.property.unit && `Unit ${d.property.unit}`]
      .filter(Boolean)
      .join(' · ');
    return html`
      <section class="home-card">
        <span class="home-card__eyebrow">Continue · ${d.job.ref}</span>
        <h2 class="home-card__client">${d.client.name || 'Unnamed client'}</h2>
        ${where ? html`<p class="home-card__where">${where}</p>` : null}
        <div class="home-card__bar"><span style="width:${p.pct}%"></span></div>
        <div class="home-card__meta">
          <span><strong>${p.pct}%</strong> inspected</span>
          <span>${p.roomsDone} / ${p.roomsTotal} rooms</span>
        </div>
        <button class="btn btn--primary btn--full home-card__resume" @click=${() => go('pin', { to: 'dashboard' })}>
          Resume inspection ${Icon({ name: 'arrow-right', size: 18 })}
        </button>
      </section>
    `;
  }

  function welcomeCard(): TemplateResult {
    return html`
      <section class="home-card">
        <span class="home-card__eyebrow">Ready when you are</span>
        <h2 class="home-card__client">No inspection open</h2>
        <p class="home-card__where">Start a new inspection or open a quotation to begin.</p>
      </section>
    `;
  }

  function figure(value: number | undefined, label: string): TemplateResult {
    return html`
      <div class="home-figure">
        <strong>${value ?? '–'}</strong>
        <span>${label}</span>
      </div>
    `;
  }

  function navItem(icon: IconName, label: string, onClick: () => void, on = false): TemplateResult {
    return html`
      <button class="home-nav__item ${on ? 'home-nav__item--on' : ''}" @click=${onClick}>
        ${Icon({ name: icon, size: 20 })}
        <span>${label}</span>
      </button>
    `;
  }

  function view(): TemplateResult {
    return html`
      <section class="screen home">
        <header class="home-band">
          <div class="home-band__top">
            <div class="home-band__logo">Snagging<em>Pro</em></div>
          </div>
          <p class="home-band__eyebrow">${greeting(new Date())}</p>
          <h1 class="home-band__headline">Every detail,<br /><em>inspected.</em></h1>
        </header>

        <main class="container home__body">
          ${draft ? resumeCard(draft) : welcomeCard()}

          <div class="home-figures">
            ${figure(figures?.thisMonth, 'This month')}
            ${figure(figures?.quotesOpen, 'Quotes open')}
            ${figure(figures?.third.value, figures?.third.label ?? (ENV.cloudEnabled ? 'T&C signed' : 'Reports'))}
          </div>

          <button class="btn btn--lg btn--full home__new" @click=${() => go('pin', { to: 'setup' })}>
            ${Icon({ name: 'plus', size: 18 })} New inspection
          </button>
        </main>

        <nav class="home-nav" aria-label="Main">
          ${navItem('home', 'Home', () => undefined, true)}
          ${navItem('check', 'Inspect', () => go('pin', { to: draft ? 'dashboard' : 'setup' }))}
          ${navItem('quote', 'Quotes', () => go('pin', { to: 'quotations' }))}
          ${navItem('library', 'Reports', () => go('pin', { to: 'library' }))}
        </nav>
        ${Footer()}
      </section>
    `;
  }

  void loadFigures()
    .then((f) => {
      figures = f;
      paint();
    })
    .catch(() => undefined);
  return view();
}
