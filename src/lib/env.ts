/** Typed access to import.meta.env. Cloudflare Pages env vars are exposed at build time as VITE_*. */

/** Updated at every build by Vite's define. Lets the inspector verify in
 *  the footer that a fresh bundle actually loaded after a deploy. */
declare const __BUILD_TIME__: string;

export const ENV = {
  pin: import.meta.env.VITE_APP_PIN ?? '1576',
  appName: 'SnaggingPro',
  buildVersion:
    import.meta.env.VITE_BUILD_VERSION ??
    (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev'),
} as const;
