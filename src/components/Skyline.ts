/**
 * Fine line-art city skyline drawn in currentColor. Purely decorative.
 */

import { svg, type TemplateResult } from 'lit-html';

function windows(x: number, y: number, cols: number, rows: number, w: number, h: number): TemplateResult[] {
  const out: TemplateResult[] = [];
  for (let r = 0; r < rows; r++) {
    out.push(svg`<line x1=${x} y1=${y + r * h} x2=${x + cols * w} y2=${y + r * h} />`);
  }
  for (let c = 1; c < cols; c++) {
    out.push(svg`<line x1=${x + c * w} y1=${y} x2=${x + c * w} y2=${y + (rows - 1) * h} />`);
  }
  return out;
}

export function Skyline(): TemplateResult {
  return svg`
    <svg class="skyline" viewBox="0 0 360 150" fill="none" stroke="currentColor"
      stroke-width="0.8" stroke-linecap="round" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <line x1="0" y1="149" x2="360" y2="149" stroke-width="1" />
      <path d="M14 149V96h30v53" />
      <g opacity="0.55">${windows(18, 104, 3, 6, 7.3, 7)}</g>
      <path d="M52 149V70l14-10 14 10v79" />
      <g opacity="0.55">${windows(57, 78, 3, 9, 6.3, 7.5)}</g>
      <path d="M90 149V84h26v65" />
      <path d="M124 149V52h22v97" />
      <g opacity="0.55">${windows(128, 60, 2, 11, 7, 8)}</g>
      <path d="M160 149V40q0-6 6-10l8-6 8 6q6 4 6 10v109" />
      <path d="M174 24V6" />
      <g opacity="0.55">${windows(165, 48, 3, 12, 6.6, 8)}</g>
      <path d="M198 149V62h20v87" />
      <path d="M226 149V30l10-14 10 14v119" />
      <path d="M236 16V2" />
      <g opacity="0.55">${windows(230, 40, 2, 13, 6, 8)}</g>
      <path d="M256 149V78c10-8 22-8 32 0v71" />
      <g opacity="0.55">${windows(262, 88, 3, 7, 6.7, 8)}</g>
      <path d="M298 149V58h24v91" />
      <g opacity="0.55">${windows(302, 66, 2, 10, 8, 8)}</g>
      <path d="M330 149V100h20v49" />
    </svg>
  `;
}
