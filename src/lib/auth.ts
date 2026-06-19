/**
 * Authentication interface — swappable.
 *
 * Today: PinAuthenticator. PIN comes from VITE_APP_PIN (Cloudflare Pages env var)
 * with a dev fallback. Compared with crypto.subtle constant-time-ish equality to
 * avoid timing leaks (matters less for a PIN, still good practice).
 *
 * Phase 2: swap to an EmailMagicLinkAuthenticator against a Cloudflare Worker.
 * No call sites change because they only ever depend on this interface.
 */

import { ENV } from './env';

export interface Authenticator {
  isUnlocked(): boolean;
  unlock(secret: string): Promise<boolean>;
  lock(): void;
}

const SESSION_KEY = 'sp_unlocked';

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.byteLength !== bb.byteLength) {
    // still hash both sides to keep timing similar
    await crypto.subtle.digest('SHA-256', ab);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

class PinAuthenticator implements Authenticator {
  isUnlocked(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  async unlock(secret: string): Promise<boolean> {
    const ok = await timingSafeEqual(secret, ENV.pin);
    if (ok) sessionStorage.setItem(SESSION_KEY, '1');
    return ok;
  }

  lock(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export const auth: Authenticator = new PinAuthenticator();
