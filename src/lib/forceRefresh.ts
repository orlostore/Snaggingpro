/**
 * Force the PWA to drop every cached service worker and asset, then reload.
 * Used when an inspector is stuck on a stale bundle — tapping the build
 * version in the footer triggers this.
 *
 * Implementation note: `location.reload()` alone leaves the browser's HTTP
 * cache untouched, so a stale `index.html` (which references the previous
 * hashed JS bundles) can still come back from cache. Navigating to a
 * cache-busted URL forces a network round-trip and breaks that loop.
 */

export async function forceRefresh(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in self) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } finally {
    // Cache-busted navigation so the browser's HTTP cache can't replay an
    // older index.html. Hash is dropped — we always land on the splash.
    location.replace(`${location.origin}/?_cb=${Date.now()}`);
  }
}
