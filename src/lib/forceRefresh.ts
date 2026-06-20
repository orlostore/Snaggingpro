/**
 * Force the PWA to drop every cached service worker and asset, then reload.
 * Used when an inspector is stuck on a stale bundle — tapping the build
 * version in the footer triggers this.
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
    // Always reload, even if the cleanup throws — the page-level reload
    // still gives Workbox a chance to refetch from origin.
    location.reload();
  }
}
