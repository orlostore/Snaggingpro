/**
 * Render the quotation as a full-screen overlay inside the app (NOT a
 * popup window — popups + window.print() are unreliable on mobile Chrome
 * and break entirely on Mi Browser / Xiaomi system print).
 *
 * The overlay provides three actions:
 *   - Download as PDF (html2canvas + jsPDF, dynamic imports)
 *   - Share via WhatsApp (templated wa.me link with the T&C URL)
 *   - Close
 *
 * The same HTML the popup used to render is re-used so the visual output
 * is identical to the printable A4 page.
 */

import { html, render } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { generateQuotationHtml, type QuoteInput } from './generate';
import { formatAED } from '@/lib/format';
import { feeBreakdown, PROP_LABEL } from '@/domain/pricing';
import { termsUrl, whatsAppUrl } from '@/lib/share';
import { go } from '@/lib/router';
import { ENV } from '@/lib/env';
import { listAcknowledgements } from '@/lib/acknowledgements';

let overlayEl: HTMLDivElement | null = null;

function strip(fullHtml: string): { page: string; styles: string } {
  const pageMatch = /<main class="page">([\s\S]*?)<\/main>/.exec(fullHtml);
  const page = pageMatch ? pageMatch[1]! : '';
  const styleMatches = fullHtml.match(/<style>[\s\S]*?<\/style>/g) ?? [];
  return { page, styles: styleMatches.join('\n') };
}

export function closeQuoteOverlay(): void {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
    document.body.style.overflow = '';
  }
}

const OVERLAY_CHROME_CSS = `
.quote-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(20, 20, 30, 0.65);
  display: flex; flex-direction: column;
  animation: quote-fade-in 0.15s ease;
}
@keyframes quote-fade-in { from { opacity: 0; } to { opacity: 1; } }
.quote-overlay__bar {
  flex-shrink: 0;
  background: #1e3a5f; color: white;
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.quote-overlay__close {
  background: rgba(255,255,255,0.12); color: white;
  border: none; padding: 8px; border-radius: 99px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.quote-overlay__close:hover { background: rgba(255,255,255,0.22); }
.quote-overlay__title {
  flex: 1; font-weight: 600; font-size: 14px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.quote-overlay__pill {
  font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
  padding: 3px 9px; border-radius: 99px;
  display: inline-flex; align-items: center;
}
.quote-overlay__pill--ok { background: rgba(255,255,255,0.92); color: #0f7a44; }
.quote-overlay__pill--pending { background: rgba(255,255,255,0.18); color: #ffffff; }
.quote-overlay__actions { display: flex; gap: 8px; }
.quote-overlay__btn {
  background: white; color: #1e3a5f;
  border: none; padding: 8px 14px; border-radius: 99px;
  display: inline-flex; align-items: center; gap: 6px;
  font-weight: 600; font-size: 13px; font-family: inherit;
  cursor: pointer;
}
.quote-overlay__btn--wa { background: #25d366; color: white; }
.quote-overlay__btn--wa:hover { background: #1ea952; }
.quote-overlay__btn--start { background: #b8923a; color: white; }
.quote-overlay__btn--start:hover { background: #9a7a30; }
.quote-overlay__btn--pdf:hover { background: #f1f1f2; }
.quote-overlay__btn:disabled { opacity: 0.55; cursor: wait; }
.quote-overlay__scroll {
  flex: 1; overflow: auto; padding: 16px;
  display: flex; justify-content: center;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y pinch-zoom;
}
.quote-overlay__paper {
  background: white;
  width: 210mm;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  border-radius: 4px;
}
.quote-overlay__paper .page {
  padding: 14mm;
  display: flex; flex-direction: column; gap: 6mm;
  background: white;
}
@media (max-width: 900px) {
  .quote-overlay__scroll {
    justify-content: flex-start;
    padding: 8px;
  }
  .quote-overlay__bar { padding: 8px 10px; gap: 8px; }
  .quote-overlay__btn { padding: 7px 11px; font-size: 12px; }
  .quote-overlay__title { font-size: 12px; }
}
`;

export function openQuoteOverlay(input: QuoteInput): void {
  closeQuoteOverlay();

  const { page, styles } = strip(generateQuotationHtml(input));

  overlayEl = document.createElement('div');
  overlayEl.className = 'quote-overlay';
  document.body.appendChild(overlayEl);
  document.body.style.overflow = 'hidden';

  const pdfState: { generating: boolean } = { generating: false };
  const ackState: { loaded: boolean; signedAt: number | null } = {
    loaded: !ENV.cloudEnabled,
    signedAt: null,
  };

  async function loadAckStatus() {
    if (!ENV.cloudEnabled) return;
    try {
      const acks = await listAcknowledgements(input.jobRef);
      if (acks.length > 0 && acks[0]) {
        ackState.signedAt = acks[0].acknowledgedAt;
      }
    } catch {
      /* offline or unauth — leave unsigned */
    }
    ackState.loaded = true;
    paint();
  }
  void loadAckStatus();

  const onShareWhatsApp = () => {
    const breakdown = feeBreakdown(input.propType, input.bedrooms, input.bua);
    const total =
      input.priceOverride > 0
        ? input.priceOverride
        : (breakdown?.base ?? 0) + (breakdown?.overage ?? 0);
    const tcLink = termsUrl({ client: input.clientName, job: input.jobRef, unit: input.unit });
    const greeting = input.clientName ? `Dear ${input.clientName},` : 'Hello,';
    const message =
      `${greeting}\n\n` +
      `Please find your SnaggingPro inspection quotation:\n\n` +
      `Reference: ${input.quoteRef}\n` +
      `Total: ${formatAED(total)}\n` +
      `Property: ${PROP_LABEL[input.propType]}` +
      (input.bedrooms > 0 ? ` ${input.bedrooms}BR` : '') +
      (input.unit ? ` · Unit ${input.unit}` : '') +
      `\n\n` +
      `Terms of Engagement (please review & sign):\n${tcLink}\n\n` +
      `Thank you.`;
    window.open(whatsAppUrl(input.clientPhone, message), '_blank');
  };

  const onDownloadPdf = async () => {
    const paper = overlayEl?.querySelector('.quote-overlay__paper') as HTMLElement | null;
    if (!paper) return;
    pdfState.generating = true;
    paint();
    try {
      const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const JsPDF = jsPdfModule.jsPDF;
      // Clone the paper into an off-screen container forced to A4 width
      // so html2canvas captures the printable layout, not the phone-
      // wrapped layout. Without this, mobile screens capture at ~360px
      // wide and the content stretches tall, spilling onto extra pages.
      const A4_PX = 794; // 210mm at 96dpi
      const stage = document.createElement('div');
      stage.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: 0',
        'width: ' + A4_PX + 'px',
        'background: #ffffff',
        'pointer-events: none',
        'opacity: 0',
        'z-index: -1',
      ].join(';');
      const clone = paper.cloneNode(true) as HTMLElement;
      clone.style.cssText = 'width: ' + A4_PX + 'px; max-width: none; box-shadow: none; border-radius: 0;';
      stage.appendChild(clone);
      document.body.appendChild(stage);

      // Wait for web fonts so html2canvas captures the right glyphs.
      // Without this, Syne/DM Sans aren't loaded inside the cloned context
      // and the fallback renders with broken letter-spacing.
      try {
        await (document as Document & { fonts?: { ready: Promise<void> } }).fonts?.ready;
      } catch {
        /* not all browsers expose document.fonts */
      }

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: A4_PX,
        });
      } finally {
        stage.remove();
      }

      const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      // Always render to a single page. If the content is naturally taller
      // than A4, scale it down proportionally and center horizontally.
      let imgW = pageW;
      let imgH = pageW * ratio;
      if (imgH > pageH) {
        imgH = pageH;
        imgW = pageH / ratio;
      }
      const x = (pageW - imgW) / 2;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', x, 0, imgW, imgH);
      pdf.save(`${input.quoteRef}.pdf`);
    } catch (e) {
      console.error('PDF generation failed', e);
      alert(
        'Could not generate PDF on this device. Try a desktop browser, or use the WhatsApp button.',
      );
    } finally {
      pdfState.generating = false;
      paint();
    }
  };

  function paint() {
    if (!overlayEl) return;
    render(
      html`
        <style>
          ${unsafeHTML(OVERLAY_CHROME_CSS)}
        </style>
        ${unsafeHTML(styles)}
        <div class="quote-overlay__bar">
          <button
            type="button"
            class="quote-overlay__close"
            aria-label="Close"
            @click=${closeQuoteOverlay}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 6l12 12M18 6L6 18"></path>
            </svg>
          </button>
          <div class="quote-overlay__title">
            Quotation · ${input.quoteRef}
            ${ENV.cloudEnabled && ackState.loaded
              ? ackState.signedAt
                ? html`<span class="quote-overlay__pill quote-overlay__pill--ok"
                    >✓ T&amp;C signed</span
                  >`
                : html`<span class="quote-overlay__pill quote-overlay__pill--pending"
                    >T&amp;C pending</span
                  >`
              : null}
          </div>
          <div class="quote-overlay__actions">
            <button
              type="button"
              class="quote-overlay__btn quote-overlay__btn--start"
              @click=${() => {
                closeQuoteOverlay();
                go('setup', { fromQuote: input.quoteRef });
              }}
              title="Start inspection from this quote"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
              Start
            </button>
            <button
              type="button"
              class="quote-overlay__btn quote-overlay__btn--wa"
              @click=${onShareWhatsApp}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm5.5 14.3c-.2.6-1.2 1.1-1.6 1.2-.5.1-1 .1-3-.5-2.6-.8-4.3-3.6-4.4-3.7-.1-.2-1-1.4-1-2.6 0-1.3.7-1.9 1-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.8 1.9c.1.1.1.3 0 .5l-.3.3-.3.4c-.1.1-.2.3 0 .5.1.2.6 1 1.3 1.6.9.8 1.7 1.1 1.9 1.2.2.1.4.1.5-.1l.6-.8c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.1.1.7-.1 1.3z"></path>
              </svg>
              WhatsApp
            </button>
            <button
              type="button"
              class="quote-overlay__btn quote-overlay__btn--pdf"
              ?disabled=${pdfState.generating}
              @click=${() => void onDownloadPdf()}
            >
              ${pdfState.generating
                ? html`Generating…`
                : html`<svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <path d="M7 10l5 5 5-5"></path>
                      <path d="M12 15V3"></path>
                    </svg>
                    Download PDF`}
            </button>
          </div>
        </div>
        <div class="quote-overlay__scroll">
          <div class="quote-overlay__paper">
            <main class="page">${unsafeHTML(page)}</main>
          </div>
        </div>
      `,
      overlayEl,
    );
  }

  paint();
}
