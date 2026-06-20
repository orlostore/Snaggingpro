/**
 * Tiny status pill rendered into the footer.
 * Shows a coloured dot + label reflecting the current sync state.
 */

import { html, render, type TemplateResult } from 'lit-html';
import { onStatus, type SyncStatus } from '@/sync/syncEngine';
import { count } from '@/sync/outbox';
import { subscribe } from '@/sync/outbox';

const LABEL: Record<SyncStatus, string> = {
  idle: 'Synced',
  syncing: 'Syncing…',
  offline: 'Offline',
  error: 'Sync error',
  disabled: 'Local only',
};

const state = { status: 'disabled' as SyncStatus, pending: 0 };
let host: HTMLSpanElement | null = null;

async function refreshPending() {
  state.pending = await count();
  paint();
}

function paint() {
  if (!host) return;
  render(view(), host);
}

function view(): TemplateResult {
  const { status, pending } = state;
  const klass = `sync-dot sync-dot--${status}`;
  const label = pending > 0 && status !== 'disabled' ? `${LABEL[status]} · ${pending}` : LABEL[status];
  return html`<span class="sync-status" title=${label}>
    <span class=${klass}></span>
    <span class="sync-status__label">${label}</span>
  </span>`;
}

export function SyncStatusBadge(): TemplateResult {
  // Mount once: the very first call creates a host span; subsequent calls
  // reuse it so render() can be triggered from outside the lit-html tree.
  if (!host) {
    host = document.createElement('span');
    onStatus((s) => {
      state.status = s;
      paint();
    });
    subscribe(() => void refreshPending());
    void refreshPending();
  }
  paint();
  return html`${host}`;
}
