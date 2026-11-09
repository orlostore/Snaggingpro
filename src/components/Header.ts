import { html, type TemplateResult } from 'lit-html';
import { Icon } from './Icon';

export interface HeaderProps {
  back?: () => void;
  title?: string;
}

export function Header({ back, title }: HeaderProps = {}): TemplateResult {
  return html`
    <header class="app-header" role="banner">
      <div class="app-header__inner container">
        ${back
          ? html`<button class="app-header__back" aria-label="Back" @click=${back}>
              ${Icon({ name: 'arrow-left', size: 22 })}
            </button>`
          : html`<span class="app-header__spacer"></span>`}
        <div class="app-header__brand">
          ${title
            ? html`<h1 class="app-header__title">${title}</h1>`
            : html`<span class="app-header__logo">Snagging<span>Pro</span></span>`}
        </div>
        <span class="app-header__spacer"></span>
      </div>
    </header>
  `;
}
