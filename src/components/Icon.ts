/**
 * SVG icon registry — single source of truth for all symbols in the app.
 * Stroke-based, 24×24 viewBox, currentColor — picks up text colour.
 *
 * Usage:
 *   ${Icon({ name: 'kitchen', size: 20 })}
 *   ${Icon({ name: 'check', size: 16, class: 'pill__icon' })}
 *
 * Adding an icon: drop a new entry into PATHS and add it to IconName.
 */

import { html, svg, type TemplateResult } from 'lit-html';

export type IconName =
  // property types
  | 'apartment' | 'villa'
  // rooms
  | 'kitchen' | 'living' | 'bedroom' | 'bathroom' | 'balcony' | 'db'
  | 'automation' | 'facade' | 'garage' | 'landscape' | 'staircase'
  | 'maid' | 'utility' | 'terrace' | 'pump' | 'tank' | 'tank-roof'
  | 'solar' | 'fire-room' | 'tag'
  // disciplines
  | 'civil' | 'electrical' | 'hvac' | 'plumbing' | 'mechanical' | 'fire'
  // status / actions
  | 'check' | 'x' | 'alert' | 'minus' | 'plus' | 'pencil' | 'trash'
  | 'arrow-left' | 'arrow-right' | 'chevron-down' | 'chevron-right'
  | 'camera' | 'gallery' | 'image'
  | 'circle' | 'square' | 'undo'
  | 'print' | 'library' | 'save' | 'send'
  | 'search' | 'home' | 'eye';

const P = (d: string): TemplateResult => svg`<path d=${d}/>`;
const P2 = (d1: string, d2: string): TemplateResult =>
  svg`<path d=${d1}/><path d=${d2}/>`;

const ICONS: Record<IconName, TemplateResult> = {
  // ───── property types ─────
  apartment: P('M4 21V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v16M4 21h16M9 21v-4h6v4M8 8h2M8 12h2M14 8h2M14 12h2'),
  villa: P('M3 11l9-7 9 7M5 9.5V21h14V9.5M10 21v-7h4v7'),

  // ───── rooms ─────
  kitchen: svg`<rect x="4" y="3" width="16" height="8" rx="2"/><path d="M8 7h.01M16 7h.01"/><path d="M6 11v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/><path d="M9 14h6"/>`,
  living: P('M3 11v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M3 17h18M6 19v2M18 19v2'),
  bedroom: P('M3 19v-3a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v3M3 19h18M7 12V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4M3 19v2M21 19v2'),
  bathroom: svg`<path d="M3 14h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3z"/><path d="M6 14V6a3 3 0 0 1 6 0"/><path d="M9 7h3"/><path d="M7 21l-1 2M17 21l1 2"/>`,
  balcony: P('M3 14h18M4 14V8m4 6V8m4 6V8m4 6V8m4 6V8M2 8h20M2 8l2-4h16l2 4M5 14v6h14v-6'),
  db: P('M4 4h16v16H4zM8 8h8v3H8zM8 13h8v3H8z'),
  automation: P('M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM12 11a2 2 0 0 1 2 2v2a2 2 0 0 1-4 0v-2a2 2 0 0 1 2-2zM6 16h.01M18 16h.01'),
  facade: P('M3 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M12 21V9a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v12M3 21h18M6 8h2M6 12h2M6 16h2M15 12h2M15 16h2'),
  garage: P('M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM6 21V11M18 21V11M6 14h12M6 17h12'),
  landscape: P('M12 22V12M12 12c0-4 3-7 7-7-1 4-3 7-7 7M12 12c0-4-3-7-7-7 1 4 3 7 7 7M5 22h14'),
  staircase: P('M3 21h4v-4h4v-4h4v-4h4V5h-4v4h-4v4H7v4H3z'),
  maid: P('M3 19v-3a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v3M3 19h18M8 13v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'),
  utility: P('M14 6l-3 3 6 6 3-3a3 3 0 0 0-2-5 3 3 0 0 0-4-1zM10 10l-7 7v4h4l7-7'),
  terrace: svg`<circle cx="12" cy="8" r="3"/><path d="M12 3v1M12 12v1M5 8h1M18 8h1M7 4l.7.7M16.3 4l-.7.7M3 21h18M3 17h18"/>`,
  pump: svg`<circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2"/>`,
  tank: svg`<path d="M4 8h16v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M4 8l1-4h14l1 4"/><path d="M8 14c1.5-1 2.5 1 4 0s2.5 1 4 0"/>`,
  'tank-roof': svg`<path d="M3 21l9-12 9 12"/><path d="M5 21V11h14v10"/><path d="M8 16c1.5-1 2.5 1 4 0s2.5 1 4 0"/>`,
  solar: svg`<circle cx="17" cy="7" r="3"/><path d="M17 2v1M17 11v1M12 7h1M21 7h1M14 4l.7.7M19.3 4l-.7.7M14 10l.7-.7M19.3 10l-.7-.7"/><path d="M3 21h12l-2-9H5z"/>`,
  'fire-room': P('M12 3c-1 4-5 5-5 10a5 5 0 0 0 10 0c0-2-1-3-2-4 0 2-1 3-2 3 0-3-1-6-1-9zM4 21h16'),
  tag: P('M21 12l-9 9-9-9 9-9 9 9zM7 7h.01'),

  // ───── disciplines ─────
  civil: P('M3 8h18M3 12h18M3 16h18M5 4v16M9 4v16M13 4v16M17 4v16M21 4v16'),
  electrical: P('M13 3L4 14h7l-1 7 9-11h-7z'),
  hvac: P('M12 3v18M3 12h18M5 5l14 14M5 19L19 5M12 7l-2-2M12 7l2-2M12 17l-2 2M12 17l2 2M7 12l-2 2M7 12l-2-2M17 12l2-2M17 12l2 2'),
  plumbing: P('M12 3c-3 5-5 8-5 11a5 5 0 0 0 10 0c0-3-2-6-5-11z'),
  mechanical: svg`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>`,
  fire: P('M12 3c-1 4-5 5-5 10a5 5 0 0 0 10 0c0-2-1-3-2-4 0 2-1 3-2 3 0-3-1-6-1-9z'),

  // ───── status / actions ─────
  check: P('M5 13l4 4L19 7'),
  x: P('M6 6l12 12M18 6L6 18'),
  alert: P('M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'),
  minus: P('M5 12h14'),
  plus: P('M12 5v14M5 12h14'),
  pencil: P('M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z'),
  trash: P('M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'),
  'arrow-left': P('M19 12H5M12 19l-7-7 7-7'),
  'arrow-right': P('M5 12h14M12 5l7 7-7 7'),
  'chevron-down': P('M6 9l6 6 6-6'),
  'chevron-right': P('M9 18l6-6-6-6'),
  camera: svg`<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`,
  gallery: svg`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`,
  image: svg`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`,
  circle: svg`<circle cx="12" cy="12" r="9"/>`,
  square: svg`<rect x="3" y="3" width="18" height="18" rx="1"/>`,
  undo: P('M3 7v6h6M3 13a9 9 0 1 0 3-7'),
  print: P('M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z'),
  library: P('M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5H6.5'),
  save: P('M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8'),
  send: P('M22 2L11 13M22 2l-7 20-4-9-9-4z'),
  search: P2('M21 21l-5-5', 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z'),
  home: P('M3 12l9-9 9 9M5 10v10h14V10'),
  eye: svg`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`,
};

export interface IconProps {
  name: IconName;
  size?: number;
  class?: string;
  stroke?: number;
}

export function isIconName(value: string): value is IconName {
  return value in ICONS;
}

/**
 * Render an icon by name, or fall back to a default if the value is a
 * legacy emoji left over in saved state from earlier versions.
 */
export function IconOrFallback(
  value: string,
  fallback: IconName,
  size = 20,
): TemplateResult {
  return Icon({ name: isIconName(value) ? value : fallback, size });
}

export function Icon({ name, size = 20, class: cls, stroke = 1.6 }: IconProps): TemplateResult {
  return html`<svg
    width=${size}
    height=${size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width=${stroke}
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${cls ?? ''}
    aria-hidden="true"
  >
    ${ICONS[name]}
  </svg>`;
}
