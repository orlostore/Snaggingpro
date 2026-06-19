/**
 * Photo attach control — two paths:
 *   1. Take photo (camera)  → input[capture="environment"]
 *   2. Choose from gallery  → input[no capture] (also covers files the client sent)
 *
 * Hands the chosen file to onPicked(). Caller decides how to store it
 * (storePhoto + write the resulting id into State).
 */

import { html, type TemplateResult } from 'lit-html';

export interface PhotoAttachProps {
  onPicked: (file: File) => void;
  label?: string;
}

export function PhotoAttach({ onPicked, label = 'Add photo' }: PhotoAttachProps): TemplateResult {
  function pick(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) onPicked(f);
    (e.target as HTMLInputElement).value = '';
  }

  return html`
    <div class="photo-attach" role="group" aria-label=${label}>
      <label class="photo-attach__btn">
        <span>📷 Take photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          class="sr-only"
          @change=${pick}
        />
      </label>
      <label class="photo-attach__btn photo-attach__btn--alt">
        <span>🖼 Attach from gallery</span>
        <input type="file" accept="image/*" class="sr-only" @change=${pick} />
      </label>
    </div>
  `;
}
