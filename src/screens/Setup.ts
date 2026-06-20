import { html, render, type TemplateResult } from 'lit-html';
import { PROP_OPTIONS, calcFee, feeBreakdown, type PropType } from '@/domain/pricing';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { emptyState } from '@/state/init';
import { nextJobSeq } from '@/state/jobRef';
import { sendTermsViaWhatsApp } from '@/lib/share';
import { jobRefFromDate } from '@/domain/snags';
import { saveDraft } from '@/state/persist';
import { go } from '@/lib/router';

interface SetupDraft {
  optionKey: string | null;
  type: PropType | null;
  bedrooms: number;
  clientName: string;
  phone: string;
  email: string;
  developer: string;
  community: string;
  unit: string;
  floor: string;
  bua: number;
  price: number;
  priceManuallyEdited: boolean;
}

function optionKey(type: PropType, bedrooms: number): string {
  return `${type}_${bedrooms}`;
}

export function Setup(rootEl: HTMLElement): TemplateResult {
  const draft: SetupDraft = {
    optionKey: null,
    type: null,
    bedrooms: 0,
    clientName: '',
    phone: '',
    email: '',
    developer: '',
    community: '',
    unit: '',
    floor: '',
    bua: 0,
    price: 0,
    priceManuallyEdited: false,
  };

  function paint() {
    render(view(), rootEl);
  }

  function selectOption(type: PropType, bedrooms: number) {
    draft.optionKey = optionKey(type, bedrooms);
    draft.type = type;
    draft.bedrooms = bedrooms;
    if (!draft.priceManuallyEdited) {
      draft.price = calcFee(type, bedrooms, draft.bua);
    }
    paint();
  }

  function setBua(value: number) {
    draft.bua = value;
    if (!draft.priceManuallyEdited && draft.type) {
      draft.price = calcFee(draft.type, draft.bedrooms, value);
    }
    paint();
  }

  function input<K extends keyof SetupDraft>(field: K, value: SetupDraft[K]) {
    draft[field] = value;
  }

  async function next() {
    if (!draft.type) return;
    const jobSeq = await nextJobSeq();
    const state = emptyState({ propType: draft.type, bedrooms: draft.bedrooms, jobSeq });
    state.client.name = draft.clientName;
    state.client.phone = draft.phone;
    state.client.email = draft.email;
    state.property.developer = draft.developer;
    state.property.community = draft.community;
    state.property.unit = draft.unit;
    state.property.floor = draft.floor;
    state.property.bua = draft.bua;
    state.property.price = draft.price;
    saveDraft(state);
    go('cover');
  }

  function feeBreakdownLine(): TemplateResult | null {
    if (!draft.type || draft.priceManuallyEdited) return null;
    const b = feeBreakdown(draft.type, draft.bedrooms, draft.bua);
    if (!b) return null;
    if (b.overage > 0) {
      return html`
        <p class="field__breakdown">
          Base AED ${b.base.toLocaleString()} + AED ${b.overage.toLocaleString()} overage
          (${b.overageSqft.toLocaleString()} sqft above ${b.baseArea.toLocaleString()})
        </p>
      `;
    }
    return html`
      <p class="field__breakdown">
        Base AED ${b.base.toLocaleString()} · BUA within included ${b.baseArea.toLocaleString()} sqft
      </p>
    `;
  }

  function view(): TemplateResult {
    return html`
      <section class="screen">
        ${Header({ title: 'New Inspection', back: () => go('splash') })}
        <main class="container setup">
          <h2 class="section-title">Property type & bedrooms</h2>
          <div class="prop-grid">
            ${PROP_OPTIONS.map(
              (p) => html`
                <button
                  class="prop-card ${draft.optionKey === optionKey(p.id, p.bedrooms)
                    ? 'prop-card--on'
                    : ''}"
                  @click=${() => selectOption(p.id, p.bedrooms)}
                >
                  <span class="prop-card__icon">${Icon({ name: p.icon as IconName, size: 28 })}</span>
                  <span class="prop-card__label">${p.label}</span>
                  <span class="prop-card__price">from AED ${p.base.toLocaleString()}</span>
                </button>
              `,
            )}
          </div>

          <h2 class="section-title">Client</h2>
          <div class="card">
            <label class="field">
              <span class="field__label">Full name</span>
              <input
                class="field__input"
                .value=${draft.clientName}
                @input=${(e: Event) =>
                  input('clientName', (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="field">
              <span class="field__label">Phone</span>
              <input
                class="field__input"
                inputmode="tel"
                .value=${draft.phone}
                @input=${(e: Event) => input('phone', (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="field">
              <span class="field__label">Email</span>
              <input
                class="field__input"
                inputmode="email"
                .value=${draft.email}
                @input=${(e: Event) => input('email', (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <h2 class="section-title">Property</h2>
          <div class="card">
            <label class="field">
              <span class="field__label">Developer</span>
              <input
                class="field__input"
                .value=${draft.developer}
                @input=${(e: Event) => input('developer', (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="field">
              <span class="field__label">Community / project</span>
              <input
                class="field__input"
                .value=${draft.community}
                @input=${(e: Event) => input('community', (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="field">
              <span class="field__label">Unit / villa number</span>
              <input
                class="field__input"
                .value=${draft.unit}
                @input=${(e: Event) => input('unit', (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="field">
              <span class="field__label">Floor (if applicable)</span>
              <input
                class="field__input"
                .value=${draft.floor}
                @input=${(e: Event) => input('floor', (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="field">
              <span class="field__label">BUA (sq ft)</span>
              <input
                class="field__input"
                inputmode="numeric"
                .value=${String(draft.bua || '')}
                @input=${(e: Event) =>
                  setBua(Number((e.target as HTMLInputElement).value) || 0)}
              />
            </label>
            <label class="field">
              <span class="field__label">
                Inspection fee (AED) ${draft.optionKey && !draft.priceManuallyEdited
                  ? html`<em class="field__hint">auto-calculated</em>`
                  : draft.priceManuallyEdited
                    ? html`<em class="field__hint field__hint--manual">manual override</em>`
                    : null}
              </span>
              <input
                class="field__input"
                inputmode="numeric"
                .value=${String(draft.price || '')}
                @input=${(e: Event) => {
                  draft.priceManuallyEdited = true;
                  input('price', Number((e.target as HTMLInputElement).value) || 0);
                }}
              />
              ${feeBreakdownLine()}
            </label>
          </div>

          <div class="setup__actions">
            ${Button({
              label: html`${Icon({ name: 'send', size: 18 })} Send T&C to client via WhatsApp`,
              full: true,
              variant: 'secondary',
              disabled: !draft.clientName.trim() || !draft.phone.trim(),
              onClick: () =>
                sendTermsViaWhatsApp({
                  clientName: draft.clientName.trim(),
                  clientPhone: draft.phone.trim(),
                  jobRef: jobRefFromDate(new Date(), 1),
                  unit: draft.unit.trim() || undefined,
                }),
            })}
            ${Button({
              label: 'Continue →',
              full: true,
              size: 'lg',
              disabled: !draft.type,
              onClick: () => void next(),
            })}
          </div>
        </main>
        ${Footer()}
      </section>
    `;
  }

  return view();
}
