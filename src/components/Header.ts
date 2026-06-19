import { html, type TemplateResult } from 'lit-html';

export interface HeaderProps {
  back?: () => void;
  title?: string;
}

export function Header({ back, title }: HeaderProps = {}): TemplateResult {
  return html`
    <header class="app-header">
      <div class="app-header__inner container">
        ${back
          ? html`<button class="app-header__back" aria-label="Back" @click=${back}>←</button>`
          : html`<span class="app-header__spacer"></span>`}
        <div class="app-header__brand" aria-hidden=${title ? 'true' : 'false'}>
          <span class="app-header__logo">Snagging<span>Pro</span></span>
          ${title ? html`<span class="app-header__title">${title}</span>` : null}
        </div>
        <span class="app-header__spacer"></span>
      </div>
    </header>
  `;
}
