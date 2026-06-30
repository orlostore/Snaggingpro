/**
 * Quote reference number generator. Format: SP-QTN-YYMMDD-NNN.
 * NNN is a per-day sequence kept in localStorage.
 */

function pad(n: number, width: number): string {
  return n.toString().padStart(width, '0');
}

export function nextQuoteRef(d: Date = new Date()): string {
  const ymd = `${pad(d.getFullYear() % 100, 2)}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
  const key = `sp_qtn_seq_${ymd}`;
  let seq = 1;
  try {
    const prev = Number(localStorage.getItem(key) ?? '0');
    seq = Number.isFinite(prev) && prev > 0 ? prev + 1 : 1;
    localStorage.setItem(key, String(seq));
  } catch {
    seq = 1;
  }
  return `SP-QTN-${ymd}-${pad(seq, 3)}`;
}
