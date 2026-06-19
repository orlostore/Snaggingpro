import { html, render, type TemplateResult } from 'lit-html';
import { auth } from '@/lib/auth';
import { go, type RouteName } from '@/lib/router';

interface PinState {
  entry: string;
  error: string;
}

export function PinGate(rootEl: HTMLElement, next: RouteName = 'splash'): TemplateResult {
  const state: PinState = { entry: '', error: '' };

  function paint() {
    render(view(), rootEl);
  }

  function press(d: string) {
    if (state.entry.length >= 4) return;
    state.entry += d;
    state.error = '';
    if (state.entry.length === 4) void check();
    else paint();
  }

  function back() {
    state.entry = state.entry.slice(0, -1);
    paint();
  }

  async function check() {
    const ok = await auth.unlock(state.entry);
    if (ok) {
      go(next);
    } else {
      state.error = 'Incorrect PIN — try again';
      state.entry = '';
      paint();
    }
  }

  function view(): TemplateResult {
    return html`
      <section class="screen pin-screen">
        <div class="container pin-screen__inner">
          <h1 class="pin-screen__title">Enter PIN</h1>
          <div class="pin__dots">
            ${[0, 1, 2, 3].map(
              (i) =>
                html`<span class="pin__dot ${i < state.entry.length ? 'pin__dot--on' : ''}"></span>`,
            )}
          </div>
          ${state.error
            ? html`<p class="pin-screen__error" role="alert">${state.error}</p>`
            : null}
          <div class="pin">
            ${['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(
              (d) => html`<button class="pin__key" @click=${() => press(d)}>${d}</button>`,
            )}
            <span></span>
            <button class="pin__key" @click=${() => press('0')}>0</button>
            <button class="pin__key" @click=${back} aria-label="Delete">⌫</button>
          </div>
        </div>
      </section>
    `;
  }

  return view();
}
