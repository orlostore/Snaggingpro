/**
 * Cloud migration screen.
 *
 * Lists every report saved in local IndexedDB with a per-row tick box.
 * The inspector chooses which ones to upload to the Cloudflare backend.
 * Uploading enqueues:
 *   - one saveReport op per selected report (server upserts)
 *   - one uploadPhoto op per photo the report references (server upserts)
 *
 * The actual transfer happens through the existing sync engine, so the
 * inspector can leave the screen and the queue drains in the background
 * with the standard footer status pill.
 */

import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import { reportsRepo } from '@/storage/reports';
import { getDB } from '@/storage/idb';
import { enqueue } from '@/sync/outbox';
import { wake } from '@/sync/syncEngine';
import { photoIdsInState } from '@/state/photoIds';
import { ENV } from '@/lib/env';
import { go } from '@/lib/router';
import { formatDateLong } from '@/lib/format';
import type { ReportSummary, State } from '@/state/schema';
import type { PhotoRecord } from '@/storage/idb';

interface RowState {
  summary: ReportSummary;
  photoCount: number;
  syncedPhotos: number;
  selected: boolean;
}

export function Migrate(rootEl: HTMLElement): TemplateResult {
  const ctx: { rows: RowState[]; loading: boolean; uploading: boolean } = {
    rows: [],
    loading: true,
    uploading: false,
  };

  function paint() {
    render(view(), rootEl);
  }

  async function load() {
    const summaries = await reportsRepo.listSummaries();
    const db = await getDB();
    const allPhotos = await db.getAll('photos');
    const byJob = new Map<string, PhotoRecord[]>();
    for (const p of allPhotos) {
      const arr = byJob.get(p.jobRef) ?? [];
      arr.push(p);
      byJob.set(p.jobRef, arr);
    }
    ctx.rows = summaries.map((s) => {
      const photos = byJob.get(s.jobRef) ?? [];
      return {
        summary: s,
        photoCount: photos.length,
        syncedPhotos: photos.filter((p) => p.syncedAt && p.syncedAt > 0).length,
        selected: false,
      };
    });
    ctx.loading = false;
    paint();
  }

  function toggle(jobRef: string) {
    const row = ctx.rows.find((r) => r.summary.jobRef === jobRef);
    if (row) {
      row.selected = !row.selected;
      paint();
    }
  }

  function toggleAll() {
    const everySelected = ctx.rows.every((r) => r.selected);
    for (const r of ctx.rows) r.selected = !everySelected;
    paint();
  }

  async function uploadSelected() {
    const picked = ctx.rows.filter((r) => r.selected);
    if (picked.length === 0) {
      toast('Pick at least one report');
      return;
    }
    ctx.uploading = true;
    paint();

    const db = await getDB();
    let reports = 0;
    let photos = 0;
    for (const row of picked) {
      const state = (await db.get('reports', row.summary.jobRef)) as State | undefined;
      if (!state) continue;
      await enqueue({ type: 'saveReport', reportId: state.job.ref });
      reports++;
      for (const pid of photoIdsInState(state)) {
        const rec = (await db.get('photos', pid)) as PhotoRecord | undefined;
        if (!rec) continue;
        await enqueue({ type: 'uploadPhoto', photoId: pid, jobRef: rec.jobRef, kind: rec.kind });
        photos++;
      }
    }
    wake();
    toast(`Queued ${reports} report${reports === 1 ? '' : 's'} + ${photos} photo${photos === 1 ? '' : 's'}`);
    ctx.uploading = false;
    await load();
  }

  function view(): TemplateResult {
    const total = ctx.rows.length;
    const picked = ctx.rows.filter((r) => r.selected).length;
    return html`
      <section class="screen">
        ${Header({ title: 'Migrate to cloud', back: () => go('library') })}
        <main class="container migrate">
          ${ENV.cloudEnabled
            ? html`<p class="migrate__intro">
                Pick which local reports to upload. Photos are uploaded with them — large jobs may take a
                while. You can leave this screen; the sync pill in the footer tracks progress.
              </p>`
            : html`<div class="migrate__warn">
                Cloud sync is not configured on this device. Set <code>VITE_APP_API_SECRET</code> on
                Cloudflare Pages and redeploy first.
              </div>`}

          ${ctx.loading
            ? html`<p class="empty">Loading…</p>`
            : total === 0
              ? html`<p class="empty">No local reports to migrate.</p>`
              : html`
                  <div class="migrate__toolbar">
                    <button class="btn btn--ghost btn--sm" @click=${toggleAll}>
                      ${picked === total ? 'Clear all' : 'Select all'}
                    </button>
                    <span class="migrate__count">${picked}/${total} selected</span>
                  </div>
                  <ul class="migrate__list">
                    ${ctx.rows.map(
                      (r) => html`
                        <li class="migrate__row">
                          <label class="migrate__check">
                            <input
                              type="checkbox"
                              .checked=${r.selected}
                              @change=${() => toggle(r.summary.jobRef)}
                            />
                          </label>
                          <button
                            class="migrate__main"
                            @click=${() => toggle(r.summary.jobRef)}
                          >
                            <div class="migrate__title">${r.summary.clientName || 'Unnamed client'}</div>
                            <div class="migrate__sub">
                              ${r.summary.jobRef} · ${formatDateLong(r.summary.date)}
                              ${r.summary.reportType === 'follow-up' ? html` · <em>follow-up</em>` : null}
                            </div>
                            <div class="migrate__meta">
                              ${r.summary.totalSnags} snags · ${r.summary.criticalSnags} critical ·
                              ${r.photoCount} photo${r.photoCount === 1 ? '' : 's'}
                              ${r.syncedPhotos === r.photoCount && r.photoCount > 0
                                ? html` · <span class="migrate__synced">all synced</span>`
                                : null}
                            </div>
                          </button>
                        </li>
                      `,
                    )}
                  </ul>

                  <div class="migrate__actions">
                    ${Button({
                      label: html`${Icon({ name: 'send', size: 18 })} Upload selected`,
                      full: true,
                      size: 'lg',
                      disabled: !ENV.cloudEnabled || ctx.uploading || picked === 0,
                      onClick: () => void uploadSelected(),
                    })}
                  </div>
                `}
        </main>
        ${Footer()}
      </section>
    `;
  }

  void load();
  return view();
}
