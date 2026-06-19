/** Typed access to import.meta.env. Cloudflare Pages env vars are exposed at build time as VITE_*. */

export const ENV = {
  pin: import.meta.env.VITE_APP_PIN ?? '1576',
  appName: 'SnaggingPro',
  buildVersion: import.meta.env.VITE_BUILD_VERSION ?? 'dev',
} as const;
