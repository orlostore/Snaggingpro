import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Icon } from '@/components/Icon';
import { go } from '@/lib/router';
import { loadDraft } from '@/state/persist';
import { CRYSTAL_FOUR } from '@/building/registry';
import { areaStatuses, progressForLevel, type AreaStatus } from '@/building/store';
import { areaCount } from '@/building/types';
import { onRemoteChange, pullRemoteQuietly } from '@/sync/remote';

export function Building(rootEl: HTMLElement): TemplateResult {
  const b = CRYSTAL_FOUR;
  const ctx: { statuses: Map<string, AreaStatus> } = { statuses: new Map() };

  function paint() {
    render(view(), rootEl);
  }

  async function load() {
    const draft = loadDraft();
    ctx.statuses = await areaStatuses(b, draft?.job.ref ?? null);
    paint();
  }

  // Progress here counts every tablet's work, not just this one's.
  const stopWatching = onRemoteChange(() => void load());
  window.addEventListener('beforeunload', stopWatching, { once: true });

  function totals() {
    let done = 0;
    let draft = 0;
    for (const st of ctx.statuses.values()) {
      if (st === 'done') done++;
      else if (st === 'draft') draft++;
    }
    return { done, draft, total: areaCount(b) };
  }

  function view(): TemplateResult {
    const t = totals();
    const pct = t.total ? Math.round((t.done / t.total) * 100) : 0;
    return html`
      <section class="screen">
        ${Header({ back: () => go('splash'), title: 'Building' })}
        <div class="container bld">
          <div class="bld__title">
            <h1>${b.name}</h1>
            <p class="bld__meta">
              ${b.location} · Plot ${b.plot}<br />
              ${b.consultant} · ${b.contractor}
            </p>
          </div>

          <div class="bld__progress">
            <div class="bld__bar"><span style="width:${pct}%"></span></div>
            <p class="bld__counts">
              <strong>${t.done}</strong> of ${t.total} areas complete${t.draft
                ? html` · <em>${t.draft} in progress</em>`
                : null}
            </p>
          </div>

          <ul class="bld__levels">
            ${b.levels.map((level) => {
              const p = progressForLevel(level, ctx.statuses);
              const full = p.done === p.total;
              return html`
                <li>
                  <button
                    class="bld__level ${full ? 'is-done' : ''}"
                    @click=${() => go('level', { id: level.id })}
                  >
                    <span class="bld__level-id">${level.id}</span>
                    <span class="bld__level-body">
                      <span class="bld__level-label">${level.label}</span>
                      <span class="bld__level-sub">
                        ${p.done}/${p.total} areas${p.draft ? ` · ${p.draft} in progress` : ''}
                        ${level.dwg ? html` · <span class="bld__dwg">${level.dwg}</span>` : null}
                      </span>
                    </span>
                    ${full
                      ? html`<span class="bld__tick">${Icon({ name: 'check', size: 18 })}</span>`
                      : html`<span class="bld__chev">${Icon({ name: 'arrow-right', size: 18 })}</span>`}
                  </button>
                </li>
              `;
            })}
          </ul>
        </div>
        ${Footer()}
      </section>
    `;
  }

  pullRemoteQuietly();
  void load();
  return view();
}
