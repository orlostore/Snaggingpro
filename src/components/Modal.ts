import { html, type TemplateResult } from 'lit-html';

export interface ModalProps {
  title: string;
  body: TemplateResult | string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
}

export function Modal({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}: ModalProps): TemplateResult {
  return html`
    <div class="modal-backdrop" role="presentation" @click=${onClose}></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal__header">
        <h2 id="modal-title" class="modal__title">${title}</h2>
        ${onClose
          ? html`<button class="modal__close" aria-label="Close" @click=${onClose}>×</button>`
          : null}
      </header>
      <div class="modal__body">${body}</div>
      ${primaryLabel || secondaryLabel
        ? html`
            <footer class="modal__footer">
              ${secondaryLabel
                ? html`<button class="btn btn--secondary" @click=${onSecondary}>${secondaryLabel}</button>`
                : null}
              ${primaryLabel
                ? html`<button class="btn btn--primary" @click=${onPrimary}>${primaryLabel}</button>`
                : null}
            </footer>
          `
        : null}
    </div>
  `;
}
