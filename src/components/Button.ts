import { html, type TemplateResult } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string | TemplateResult;
  onClick?: (e: Event) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}

export function Button({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  type = 'button',
  ariaLabel,
}: ButtonProps): TemplateResult {
  const cls = classMap({
    btn: true,
    [`btn--${variant}`]: true,
    [`btn--${size}`]: true,
    'btn--full': full,
  });
  return html`
    <button
      class=${cls}
      type=${type}
      ?disabled=${disabled}
      aria-label=${ariaLabel ?? ''}
      @click=${onClick}
    >
      ${label}
    </button>
  `;
}
