/** Typed access to import.meta.env. Cloudflare Pages env vars are exposed at build time as VITE_*. */

declare const __BUILD_TIME__: string;

export const ENV = {
  pin: import.meta.env.VITE_APP_PIN ?? '1576',
  appName: 'SnaggingPro',
  buildVersion:
    import.meta.env.VITE_BUILD_VERSION ??
    (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev'),
  /** Shared secret sent in X-SP-Secret on every API call. Empty = no cloud. */
  apiSecret: (import.meta.env.VITE_APP_API_SECRET as string | undefined) ?? '',
  get cloudEnabled(): boolean {
    return !!this.apiSecret;
  },
} as const;
