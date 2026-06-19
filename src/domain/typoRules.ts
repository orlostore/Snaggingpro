/**
 * Pre-PDF spellcheck rules.
 * Each rule = regex + replacement + human label shown in the spellcheck modal.
 * Add new rules here as new typos surface in real reports.
 */

export interface TypoRule {
  pattern: RegExp;
  replace: string | ((match: string) => string);
  label: string;
}

export const TYPO_RULES: TypoRule[] = [
  { pattern: /\bcosting\b/gi, replace: (m) => (m[0] === 'C' ? 'Coating' : 'coating'), label: '"costing" → "coating"' },
  { pattern: /\bfuntional\b/gi, replace: (m) => (m[0] === 'F' ? 'Functional' : 'functional'), label: '"funtional" → "functional"' },
  { pattern: /\bupstad\b/gi, replace: (m) => (m[0] === 'U' ? 'Upstand' : 'upstand'), label: '"upstad" → "upstand"' },
  { pattern: /\bironmongert\b/gi, replace: (m) => (m[0] === 'I' ? 'Ironmongery' : 'ironmongery'), label: '"ironmongert" → "ironmongery"' },
  { pattern: /(^|[.!?]\s+)Nit\b/g, replace: '$1Not', label: '"Nit" → "Not" (sentence start)' },
  { pattern: /\bis fix\b/gi, replace: 'is fixed', label: '"is fix" → "is fixed"' },
  { pattern: /\bare fix\b/gi, replace: 'are fixed', label: '"are fix" → "are fixed"' },
  {
    pattern: /\blose (tile|tiles|skirting|fixture|fitting|wire|connection|screw|cable)\b/gi,
    replace: (m) => m.replace(/\blose\b/i, 'loose'),
    label: '"lose" → "loose" (when describing something not secure)',
  },
  { pattern: /\bteh\b/gi, replace: 'the', label: '"teh" → "the"' },
  { pattern: /\brecieve\b/gi, replace: 'receive', label: '"recieve" → "receive"' },
  { pattern: /\bseperat/gi, replace: 'separat', label: '"seperat..." → "separat..."' },
  { pattern: /\boccured\b/gi, replace: 'occurred', label: '"occured" → "occurred"' },
  { pattern: /\baligment\b/gi, replace: 'alignment', label: '"aligment" → "alignment"' },
  { pattern: /\s{2,}/g, replace: ' ', label: 'Multiple spaces → single space' },
  { pattern: /\.\.+/g, replace: '.', label: 'Multiple periods → single period' },
  { pattern: /\sand\.\s/gi, replace: ' and ', label: '"and." → "and " (stray period)' },
  { pattern: /\sbut\.\s/gi, replace: ' but ', label: '"but." → "but " (stray period)' },
];

export interface TypoIssue {
  roomId: string;
  itemKey: string;
  observationId: string | null;
  ruleIndex: number;
  ruleLabel: string;
  originalText: string;
  suggestedText: string;
  start: number;
  end: number;
}

function applyReplace(text: string, rule: TypoRule): string {
  if (typeof rule.replace === 'string') {
    return text.replace(rule.pattern, rule.replace);
  }
  return text.replace(rule.pattern, (match) => (rule.replace as (m: string) => string)(match));
}

/**
 * Scan one text blob against every rule, returning all matches.
 * Used in tests and by the spellcheck screen.
 */
export function scanText(text: string): { ruleIndex: number; ruleLabel: string; suggested: string }[] {
  if (!text.trim()) return [];
  const issues: { ruleIndex: number; ruleLabel: string; suggested: string }[] = [];
  TYPO_RULES.forEach((rule, ruleIndex) => {
    const probe = new RegExp(rule.pattern.source, rule.pattern.flags);
    if (probe.test(text)) {
      issues.push({
        ruleIndex,
        ruleLabel: rule.label,
        suggested: applyReplace(text, rule),
      });
    }
  });
  return issues;
}
