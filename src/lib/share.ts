/**
 * WhatsApp deep-link helpers.
 *
 * wa.me accepts an international phone number with no leading + and no
 * spaces / hyphens. Passing the message via `text=` opens the chat with
 * the message pre-filled, ready for the inspector to tap send.
 */

export function normalisePhone(input: string): string {
  return input.replace(/[^\d]/g, '');
}

export function whatsAppUrl(phone: string, message: string): string {
  const digits = normalisePhone(phone);
  const text = encodeURIComponent(message);
  return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function termsUrl(opts: {
  client?: string;
  job?: string;
  unit?: string;
  origin?: string;
}): string {
  const origin = opts.origin ?? location.origin;
  const params = new URLSearchParams();
  if (opts.client) params.set('client', opts.client);
  if (opts.job) params.set('job', opts.job);
  if (opts.unit) params.set('unit', opts.unit);
  const qs = params.toString();
  return qs ? `${origin}/terms/?${qs}` : `${origin}/terms/`;
}

export function sendTermsViaWhatsApp(opts: {
  clientName: string;
  clientPhone: string;
  jobRef: string;
  unit?: string;
}): void {
  const link = termsUrl({ client: opts.clientName, job: opts.jobRef, unit: opts.unit });
  const greeting = opts.clientName ? `Dear ${opts.clientName},` : 'Hello,';
  const message =
    `${greeting}\n\n` +
    `Please review and acknowledge the Terms of Engagement before your SnaggingPro inspection:\n\n` +
    `${link}\n\n` +
    (opts.jobRef ? `Reference: ${opts.jobRef}\n\n` : '') +
    `Thank you.`;
  window.open(whatsAppUrl(opts.clientPhone, message), '_blank');
}
