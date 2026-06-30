/**
 * Hash-based router. PWA-safe (no server config needed on Cloudflare Pages).
 * Routes are simple string patterns; params come through the second argument.
 */

export type RouteName =
  | 'splash'
  | 'pin'
  | 'setup'
  | 'cover'
  | 'room-setup'
  | 'dashboard'
  | 'room'
  | 'report'
  | 'library'
  | 'migrate'
  | 'quotations'
  | 'report-detail';

export interface Route {
  name: RouteName;
  params: Record<string, string>;
}

type Handler = (r: Route) => void;

const handlers = new Set<Handler>();

function parseHash(): Route {
  const raw = (location.hash || '#/splash').slice(1);
  const [path, query] = raw.split('?');
  const params: Record<string, string> = {};
  if (query) {
    for (const part of query.split('&')) {
      const [k, v] = part.split('=');
      if (k) params[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
    }
  }
  const segs = (path || '/').split('/').filter(Boolean);
  const head = segs[0] || 'splash';
  switch (head) {
    case 'pin':
      return { name: 'pin', params };
    case 'setup':
      return { name: 'setup', params };
    case 'cover':
      return { name: 'cover', params };
    case 'room-setup':
      return { name: 'room-setup', params };
    case 'dashboard':
      return { name: 'dashboard', params };
    case 'room':
      return { name: 'room', params: { ...params, id: segs[1] ?? '' } };
    case 'report':
      return { name: 'report', params };
    case 'library':
      return { name: 'library', params };
    case 'migrate':
      return { name: 'migrate', params };
    case 'quotations':
      return { name: 'quotations', params };
    case 'report-detail':
      return { name: 'report-detail', params: { ...params, id: segs[1] ?? '' } };
    default:
      return { name: 'splash', params };
  }
}

export function currentRoute(): Route {
  return parseHash();
}

export function go(name: RouteName, params: Record<string, string> = {}): void {
  let path = `/${name}`;
  if ((name === 'room' || name === 'report-detail') && params['id']) {
    path = `/${name}/${params['id']}`;
  }
  const qs = Object.entries(params)
    .filter(([k]) => k !== 'id')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  location.hash = qs ? `${path}?${qs}` : path;
}

export function subscribe(h: Handler): () => void {
  handlers.add(h);
  return () => handlers.delete(h);
}

export function startRouter(): void {
  window.addEventListener('hashchange', () => {
    const r = parseHash();
    for (const h of handlers) h(r);
  });
}
