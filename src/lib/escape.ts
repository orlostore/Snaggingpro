/**
 * HTML-escape a string for safe interpolation into report templates.
 * Only used by report/ generators that build raw HTML strings for the print window.
 * Everywhere else, use lit-html which auto-escapes by default.
 */
const MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: string | null | undefined): string {
  if (input == null) return '';
  return String(input).replace(/[&<>"']/g, (ch) => MAP[ch] ?? ch);
}
