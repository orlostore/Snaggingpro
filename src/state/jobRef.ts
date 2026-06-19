/**
 * Per-day auto-incrementing job reference.
 *
 * Walks the reports library to find the highest sequence number issued for
 * the given calendar date and returns the next one. Falls back to 1 if no
 * library entries exist (or if storage is unavailable).
 */

import { reportsRepo } from '@/storage/reports';
import { jobRefFromDate } from '@/domain/snags';
import { todayIsoDate } from '@/lib/format';

function parseSeq(ref: string, dateKey: string): number | null {
  // SP-YYMMDD-NNN — only count those whose date matches.
  const m = /^SP-(\d{6})-(\d{3})$/.exec(ref);
  if (!m) return null;
  if (m[1] !== dateKey) return null;
  return Number(m[2]);
}

function dateKey(date: Date): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export async function nextJobSeq(now: Date = new Date()): Promise<number> {
  const key = dateKey(now);
  try {
    const summaries = await reportsRepo.listSummaries();
    let max = 0;
    for (const s of summaries) {
      const seq = parseSeq(s.jobRef, key);
      if (seq !== null && seq > max) max = seq;
    }
    return max + 1;
  } catch {
    return 1;
  }
}

export async function nextJobRef(now: Date = new Date()): Promise<string> {
  const seq = await nextJobSeq(now);
  return jobRefFromDate(now, seq);
}

export function todayIsoForJob(): string {
  return todayIsoDate();
}
