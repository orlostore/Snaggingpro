/**
 * Quotations library — list of every quote issued on this device.
 *
 * Local-first; cloud sync to come in a follow-up. From each row the
 * inspector can:
 *   - View   → re-open the quotation overlay (PDF + WhatsApp share)
 *   - Start  → load the quote into Setup pre-filled and continue
 *              into the inspection flow
 *   - Delete → drop the local record
 */

import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { confirmDialog } from '@/components/Confirm';
import { toast } from '@/components/Toast';
import { quotesRepo } from '@/storage/quotes';
import { openQuoteOverlay } from '@/quote/overlay';
import { go } from '@/lib/router';
import { formatAED } from '@/lib/format';
import { ENV } from '@/lib/env';
import { loadAckIndex } from '@/lib/acknowledgements';
import type { QuoteRecord } from '@/quote/types';

export function Quotations(rootEl: HTMLElement): TemplateResult {
  const ctx: {
    items: QuoteRecord[];
    query: string;
    loading: boolean;
    acks: Map<string, number>;
  } = {
    items: [],
    query: '',
    loading: true,
    acks: new Map(),
  };

  function paint() {
    render(view(), rootEl);
  }

  async function load() {
    ctx.items = await quotesRepo.list();
    ctx.loading = false;
    paint();
    if (ENV.cloudEnabled) {
      ctx.acks = await loadAckIndex();
      paint();
    }
  }

  function filtered(): QuoteRecord[] {
    const q = ctx.query.trim().toLowerCase();
    if (!q) return ctx.items;
    return ctx.items.filter(
      (r) =>
        r.quoteRef.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.developer.toLowerCase().includes(q) ||
        r.community.toLowerCase().includes(q) ||
        r.unit.toLowerCase().includes(q),
    );
  }

  function viewQuote(q: QuoteRecord) {
    openQuoteOverlay({
      quoteRef: q.quoteRef,
      clientName: q.clientName,
      clientPhone: q.clientPhone,
      clientEmail: q.clientEmail,
      developer: q.developer,
      community: q.community,
      unit: q.unit,
      floor: q.floor,
      propType: q.propType,
      bedrooms: q.bedrooms,
      bua: q.bua,
      priceOverride: q.priceOverride,
      jobRef: q.jobRef,
    });
  }

  function startInspection(q: QuoteRecord) {
    go('setup', { fromQuote: q.quoteRef });
  }

  async function remove(q: QuoteRecord) {
    const ok = await confirmDialog({
      title: 'Delete this quotation?',
      message: `Quote ${q.quoteRef} for ${q.clientName || 'unnamed client'} will be removed from this device.`,
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    await quotesRepo.delete(q.quoteRef);
    toast('Quotation deleted');
    await load();
  }

  function formatDate(ms: number): string {
    return new Date(ms).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function view(): TemplateResult {
    const rows = filtered();
    return html`
      <section class="screen">
        ${Header({ title: 'Quotations', back: () => go('splash') })}
        <main class="container library">
          <input
            class="field__input"
            type="search"
            placeholder="Search by ref, client, developer, community, unit…"
            .value=${ctx.query}
            @input=${(e: Event) => {
              ctx.query = (e.target as HTMLInputElement).value;
              paint();
            }}
          />
          ${ctx.loading
            ? html`<div class="empty">Loading…</div>`
            : rows.length === 0
              ? html`<div class="empty">
                  No quotations yet. Use <strong>New Inspection</strong> on the splash, fill the
                  setup form, and tap <strong>Generate quotation</strong>.
                </div>`
              : html`
                  <ul class="library__list">
                    ${rows.map(
                      (q) => html`
                        <li class="library__row">
                          <button class="library__main" @click=${() => viewQuote(q)}>
                            <div class="library__title">
                              ${q.clientName || 'Unnamed client'}
                              ${q.status === 'converted'
                                ? html`<span class="ack-pill ack-pill--signed"
                                    >${Icon({ name: 'check', size: 12 })} Converted</span
                                  >`
                                : html`<span class="ack-pill ack-pill--pending">Issued</span>`}
                              ${ENV.cloudEnabled
                                ? ctx.acks.get(q.jobRef)
                                  ? html`<span class="ack-pill ack-pill--signed"
                                      >${Icon({ name: 'check', size: 12 })} T&amp;C signed</span
                                    >`
                                  : html`<span class="ack-pill ack-pill--pending"
                                      >T&amp;C pending</span
                                    >`
                                : null}
                            </div>
                            <div class="library__sub">
                              ${q.quoteRef} · ${formatDate(q.createdAt)} · ${formatAED(q.total)}
                            </div>
                            <div class="library__meta">
                              ${q.developer || q.community || q.unit
                                ? html`${q.developer}${q.developer && q.community ? ' · ' : ''}${q.community}${q.unit ? ` · Unit ${q.unit}` : ''}`
                                : html`<em>${q.bedrooms > 0 ? `${q.bedrooms} BR` : ''} ${q.propType}</em>`}
                            </div>
                          </button>
                          <div class="quotation-actions">
                            ${Button({
                              label: html`${Icon({ name: 'arrow-right', size: 16 })} Start`,
                              variant: 'secondary',
                              size: 'sm',
                              onClick: () => startInspection(q),
                            })}
                            ${Button({
                              label: 'Delete',
                              variant: 'ghost',
                              size: 'sm',
                              onClick: () => void remove(q),
                            })}
                          </div>
                        </li>
                      `,
                    )}
                  </ul>
                `}
        </main>
        ${Footer()}
      </section>
    `;
  }

  void load();
  return view();
}
