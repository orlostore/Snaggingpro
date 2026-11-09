/**
 * Guards the approved palette: every text / background pairing the app
 * uses must meet WCAG AA. If you add a pairing in CSS, add it here too.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../../src/styles/tokens.css'), 'utf8');

function token(name: string): string {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\b`).exec(css);
  if (!m) throw new Error(`--${name} must be a solid #rrggbb colour in tokens.css`);
  return m[1]!;
}

function luminance(hex: string): number {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const NORMAL = 4.5;
const LARGE = 3;

const LIGHT_SURFACES = ['color-bg', 'color-bg-elevated', 'color-bg-sunken'];
const TEAL_SURFACES = ['color-brand', 'color-brand-light', 'color-brand-deep'];

const PAIRS: Array<[fg: string, bgs: string[], min: number]> = [
  ['color-text', LIGHT_SURFACES, NORMAL],
  ['color-text-muted', LIGHT_SURFACES, NORMAL],
  ['color-text-dim', LIGHT_SURFACES, NORMAL],
  ['color-brand', LIGHT_SURFACES, NORMAL],
  ['color-accent-strong', LIGHT_SURFACES, NORMAL],
  ['color-pass', LIGHT_SURFACES, NORMAL],
  ['color-issue', LIGHT_SURFACES, NORMAL],
  ['color-critical', LIGHT_SURFACES, NORMAL],
  ['color-warning', LIGHT_SURFACES, NORMAL],
  ['color-na', LIGHT_SURFACES, NORMAL],
  ['color-on-brand', TEAL_SURFACES, NORMAL],
  ['color-on-brand-muted', TEAL_SURFACES, NORMAL],
  ['color-issue-on-brand', TEAL_SURFACES, NORMAL],
  ['color-text-inverse', TEAL_SURFACES, NORMAL],
  ['color-accent-light', TEAL_SURFACES, LARGE],
  ['color-on-accent', ['color-accent'], NORMAL],
  ['color-critical', ['color-critical-soft'], NORMAL],
  ['color-border-strong', ['color-bg-elevated'], LARGE],
];

describe('approved palette contrast (WCAG AA)', () => {
  for (const [fg, bgs, min] of PAIRS) {
    for (const bg of bgs) {
      it(`--${fg} on --${bg} ≥ ${min}:1`, () => {
        expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
      });
    }
  }

  it('sand button gradient keeps its text readable at both ends', () => {
    const stops = /--gradient-accent:[^;]*/.exec(css)![0].match(/#[0-9a-fA-F]{6}/g)!;
    for (const stop of stops) expect(ratio(token('color-on-accent'), stop)).toBeGreaterThanOrEqual(NORMAL);
  });
});
