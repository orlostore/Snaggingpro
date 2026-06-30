/**
 * Generate a standalone, printable HTML quotation.
 *
 * Opens in a new window — the inspector can print to PDF and share via
 * WhatsApp. Mirrors the report PDF aesthetic so the brand stays
 * consistent across all client-facing documents.
 */

import { feeBreakdown, PROP_LABEL, type PropType } from '@/domain/pricing';
import { BUSINESS } from '@/lib/business';
import { formatAED, formatDateLong, todayIsoDate } from '@/lib/format';
import { termsUrl } from '@/lib/share';

export interface QuoteInput {
  quoteRef: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  developer: string;
  community: string;
  unit: string;
  floor: string;
  propType: PropType;
  bedrooms: number;
  bua: number;
  /** Override price (when the inspector typed a custom one). 0 = use breakdown. */
  priceOverride: number;
  /** Job ref the quote will turn into when the client books — used in the T&C link. */
  jobRef: string;
  /** Validity (days from today). */
  validDays?: number;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

export function generateQuotationHtml(q: QuoteInput): string {
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + (q.validDays ?? 14));

  const breakdown = feeBreakdown(q.propType, q.bedrooms, q.bua);
  const baseAmount = breakdown?.base ?? 0;
  const overageAmount = breakdown?.overage ?? 0;
  const overageSqft = breakdown?.overageSqft ?? 0;
  const baseArea = breakdown?.baseArea ?? 0;
  const computed = baseAmount + overageAmount;
  const total = q.priceOverride > 0 ? q.priceOverride : computed;
  const isOverride = q.priceOverride > 0 && q.priceOverride !== computed;

  const tcLink = termsUrl({ client: q.clientName, job: q.jobRef, unit: q.unit });

  const h = escapeHtml;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Quotation ${h(q.quoteRef)} — SnaggingPro</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --brand: #1e3a5f;
      --brand-soft: rgba(30, 58, 95, 0.08);
      --accent: #b8923a;
      --bg: #f7f7f8;
      --card: #ffffff;
      --sunken: #ecedf0;
      --text: #1a1b1e;
      --muted: #4f535b;
      --dim: #6b6f76;
      --border: #e2e4e9;
      --pass: #0f7a44;
    }
    html, body { background: #f7f7f8; color: var(--text); font-family: 'DM Sans', system-ui, sans-serif; font-size: 13px; line-height: 1.5; }
    .page { width: 210mm; min-height: 297mm; padding: 14mm; margin: 0 auto; background: #fff; display: flex; flex-direction: column; gap: 6mm; }

    .topbar { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 6mm; padding-bottom: 5mm; border-bottom: 2px solid var(--brand); }
    .wordmark { font-family: 'DM Sans', system-ui, sans-serif; font-weight: 700; font-size: 28pt; letter-spacing: -0.04em; line-height: 1.15; padding-bottom: 1mm; white-space: nowrap; }
    .wordmark em { color: var(--brand); font-style: normal; }
    .wordmark-sub { font-size: 8pt; letter-spacing: 0.12em; color: var(--muted); text-transform: uppercase; font-weight: 600; margin-top: 3mm; }
    .doc-meta { text-align: right; }
    .doc-pill { display: inline-block; background: var(--brand); color: white; font-weight: 700; padding: 1.5mm 3.5mm; border-radius: 99px; font-size: 8pt; letter-spacing: 0.06em; }
    .doc-ref { font-family: 'DM Sans', system-ui, sans-serif; font-weight: 700; font-size: 13pt; color: var(--brand); margin-top: 2mm; letter-spacing: -0.01em; }
    .doc-date { color: var(--muted); font-size: 9pt; margin-top: 0.5mm; }
    .doc-contact { color: var(--brand); font-weight: 700; font-size: 10pt; margin-top: 2mm; letter-spacing: 0.01em; }

    .section-head { font-family: 'DM Sans', system-ui, sans-serif; font-size: 10pt; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--brand); margin-bottom: 2mm; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 3mm; padding: 4mm 5mm; }
    .kv { display: grid; grid-template-columns: max-content 1fr; gap: 1.5mm 4mm; font-size: 10pt; }
    .kv dt { color: var(--dim); font-weight: 500; }
    .kv dd { color: var(--text); font-weight: 600; word-break: break-word; }

    .price-table { width: 100%; border-collapse: collapse; font-size: 11pt; }
    .price-table th { text-align: left; color: var(--dim); font-weight: 600; font-size: 9pt; letter-spacing: 0.04em; text-transform: uppercase; padding: 2mm 0 3mm; border-bottom: 1.5px solid var(--brand); }
    .price-table th.right { text-align: right; }
    .price-table td { padding: 3mm 0; border-bottom: 1px dashed var(--border); }
    .price-table td.right { text-align: right; font-variant-numeric: tabular-nums; }
    .price-table tr.total-row td { border-bottom: none; padding-top: 5mm; font-family: 'DM Sans', system-ui, sans-serif; font-weight: 700; font-size: 14pt; color: var(--brand); }
    .price-table tr.total-row td.right { font-size: 16pt; }
    .price-note { font-size: 9pt; color: var(--muted); margin-top: 2mm; padding: 2.5mm 3mm; background: rgba(184, 146, 58, 0.08); border-left: 2px solid var(--accent); border-radius: 2mm; }
    .price-note strong { color: var(--text); }

    .bank-table { width: 100%; font-size: 10.5pt; }
    .bank-table td { padding: 2mm 0; border-bottom: 1px dashed var(--border); }
    .bank-table td:first-child { color: var(--dim); font-weight: 500; width: 38mm; }
    .bank-table td:last-child { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-weight: 600; }
    .bank-table tr:last-child td { border-bottom: none; }

    .terms-block { background: var(--brand); color: white; border-radius: 3mm; padding: 5mm; display: grid; grid-template-columns: 1fr auto; gap: 4mm; align-items: center; }
    .terms-block h3 { font-family: 'DM Sans', system-ui, sans-serif; font-size: 12pt; font-weight: 700; }
    .terms-block p { font-size: 10pt; opacity: 0.9; margin-top: 1mm; line-height: 1.45; }
    .terms-link { background: white; color: var(--brand); padding: 3mm 5mm; border-radius: 99px; font-weight: 700; text-decoration: none; font-size: 10pt; white-space: nowrap; }

    .terms-summary { font-size: 9pt; color: var(--muted); line-height: 1.6; columns: 2; column-gap: 6mm; }
    .terms-summary p { break-inside: avoid; margin-bottom: 1.5mm; }
    .terms-summary strong { color: var(--text); }

    .footer { margin-top: auto; padding-top: 3mm; border-top: 1px solid var(--border); font-size: 9pt; color: var(--dim); display: grid; grid-template-columns: 1fr auto; gap: 4mm; }
    .footer-cta a { color: var(--brand); font-weight: 700; text-decoration: none; }

    .actions { background: var(--bg); padding: 4mm; text-align: center; print-color-adjust: exact; }
    .actions button { background: var(--brand); color: white; border: none; padding: 3mm 6mm; border-radius: 99px; font-weight: 700; font-size: 12pt; font-family: inherit; cursor: pointer; margin: 0 2mm; }
    .actions button:hover { background: #15294a; }
    .actions button.wa { background: #25d366; }
    .actions button.wa:hover { background: #1ea952; }
    @media print { .actions { display: none; } body { background: white; } .page { box-shadow: none; } }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  <div class="actions">
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
    ${q.clientPhone
      ? `<button type="button" class="wa" id="wa-share">Send via WhatsApp</button>`
      : ''}
  </div>

  <main class="page">

    <header class="topbar">
      <div>
        <div class="wordmark">Snagging<em>Pro</em></div>
        <div class="wordmark-sub">Property condition assessment · UAE</div>
      </div>
      <div class="doc-meta">
        <div class="doc-pill">QUOTATION</div>
        <div class="doc-ref">${h(q.quoteRef)}</div>
        <div class="doc-date">Issued ${formatDateLong(todayIsoDate(today))}<br/>Valid until ${formatDateLong(todayIsoDate(validUntil))}</div>
        <div class="doc-contact">${h(BUSINESS.phone)}</div>
      </div>
    </header>

    <section class="${q.developer || q.community || q.unit || q.bua > 0 ? 'grid-2' : ''}">
      <div class="card">
        <div class="section-head">Prepared for</div>
        <dl class="kv">
          <dt>Name</dt><dd>${h(q.clientName || '—')}</dd>
          ${q.clientPhone ? `<dt>Phone</dt><dd>${h(q.clientPhone)}</dd>` : ''}
          ${q.clientEmail ? `<dt>Email</dt><dd>${h(q.clientEmail)}</dd>` : ''}
          <dt>Property</dt><dd>${h(PROP_LABEL[q.propType])}${q.bedrooms > 0 ? ` · ${q.bedrooms} BR` : ''}</dd>
        </dl>
      </div>
      ${q.developer || q.community || q.unit || q.bua > 0
        ? `<div class="card">
            <div class="section-head">Property</div>
            <dl class="kv">
              ${q.developer ? `<dt>Developer</dt><dd>${h(q.developer)}</dd>` : ''}
              ${q.community ? `<dt>Community</dt><dd>${h(q.community)}</dd>` : ''}
              ${q.unit ? `<dt>Unit</dt><dd>${h(q.unit)}${q.floor ? ` · Floor ${h(q.floor)}` : ''}</dd>` : ''}
              ${q.bua > 0 ? `<dt>Built-up area</dt><dd>${q.bua.toLocaleString('en-US')} sqft</dd>` : ''}
            </dl>
          </div>`
        : ''}
    </section>

    <section class="card">
      <div class="section-head">Pricing</div>
      <table class="price-table">
        <thead>
          <tr><th>Description</th><th class="right">Amount</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Inspection — ${h(PROP_LABEL[q.propType])}${q.bedrooms > 0 ? ` ${q.bedrooms} BR` : ''}
              ${baseArea > 0 ? `<br/><span style="color:var(--dim);font-size:9pt">Base up to ${baseArea.toLocaleString('en-US')} sqft</span>` : ''}
            </td>
            <td class="right">${formatAED(baseAmount)}</td>
          </tr>
          ${overageSqft > 0
            ? `<tr>
                 <td>Additional area<br/><span style="color:var(--dim);font-size:9pt">${overageSqft.toLocaleString('en-US')} sqft × AED 1 / sqft</span></td>
                 <td class="right">${formatAED(overageAmount)}</td>
               </tr>`
            : ''}
          ${isOverride
            ? `<tr>
                 <td>Adjustment / agreed price</td>
                 <td class="right">${formatAED(total - computed)}</td>
               </tr>`
            : ''}
          <tr class="total-row">
            <td>Total payable</td>
            <td class="right">${formatAED(total)}</td>
          </tr>
        </tbody>
      </table>
      <div class="price-note">
        <strong>All-inclusive · no hidden fees.</strong> Quote is firm subject to the BUA above. Final fee is confirmed on the actual measured area before the inspection.
      </div>
    </section>

    <section class="terms-block">
      <div>
        <h3>Terms of Engagement</h3>
        <p>Payment confirms acceptance of these terms. Please review and sign before the inspection date.</p>
      </div>
      <a class="terms-link" href="${h(tcLink)}">Open T&amp;C →</a>
    </section>

    <section class="card">
      <div class="section-head">Key terms (summary)</div>
      <div class="terms-summary">
        <p><strong>Site readiness.</strong> Water and electricity must be operational on inspection day. If unavailable, the inspection proceeds on accessible items only — no deduction.</p>
        <p><strong>Payment.</strong> Full fee due in advance. No inspection without confirmed payment.</p>
        <p><strong>Access.</strong> Hirer provides full unobstructed access. Delays or denied access — no refund; re-inspection at full fee.</p>
        <p><strong>Scope.</strong> Visible and accessible areas only. Concealed works excluded.</p>
        <p><strong>Cancellation.</strong> 24 hours' notice required. Less than 24h = 50% fee. Same-day = non-refundable.</p>
        <p><strong>Re-inspection.</strong> Separate service at an agreed fee, billed after developer rectification.</p>
        <p><strong>Liability.</strong> Best-effort basis. Not a structural survey.</p>
        <p><strong>Governing law.</strong> Laws of the UAE · Dubai Courts jurisdiction.</p>
      </div>
    </section>

    <footer class="footer">
      <div>
        Quote ID <code>${h(q.quoteRef)}</code> · Issued ${formatDateLong(todayIsoDate(today))}<br/>
        Valid until ${formatDateLong(todayIsoDate(validUntil))}
      </div>
      <div class="footer-cta">
        Questions? <a href="tel:${h(BUSINESS.phone.replace(/\s+/g, ''))}">${h(BUSINESS.phone)}</a><br/>
        ${h(BUSINESS.name)} · UAE
      </div>
    </footer>

  </main>

  <script>
    (function () {
      var waBtn = document.getElementById('wa-share');
      if (!waBtn) return;
      waBtn.addEventListener('click', function () {
        var phone = ${JSON.stringify(q.clientPhone.replace(/[^\d]/g, ''))};
        var message =
          'Dear ${(q.clientName || 'Sir/Madam').replace(/'/g, "\\'")}, \\n\\n' +
          'Please find your SnaggingPro inspection quotation:\\n\\n' +
          'Reference: ${q.quoteRef}\\n' +
          'Total: ${formatAED(total)}\\n' +
          'Property: ${PROP_LABEL[q.propType]}${q.bedrooms > 0 ? ` ${q.bedrooms}BR` : ''}${q.unit ? ` · Unit ${q.unit.replace(/'/g, "\\'")}` : ''}\\n\\n' +
          'Terms of Engagement (please review & sign): ${tcLink}\\n\\n' +
          'Bank details for advance payment are on the attached PDF. Please use the reference number above on the transfer.\\n\\n' +
          'Thank you.';
        var url = phone
          ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message)
          : 'https://wa.me/?text=' + encodeURIComponent(message);
        window.open(url, '_blank');
      });
    })();
  </script>
</body>
</html>`;
}
