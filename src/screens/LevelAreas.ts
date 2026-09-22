import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import { confirmDialog } from '@/components/Confirm';
import { go } from '@/lib/router';
import { loadDraft } from '@/state/persist';
import { CRYSTAL_FOUR } from '@/building/registry';
import { areaStatuses, isRemote, openArea, planUrl, type AreaStatus } from '@/building/store';
import { onRemoteChange, pullRemoteQuietly } from '@/sync/remote';
import { GROUP_LABELS, type AreaDef, type AreaGroup, type LevelDef } from '@/building/types';

const GROUP_ORDER: AreaGroup[] = ['apartment', 'circulation', 'plant', 'amenity', 'waste', 'parking', 'system'];

export function LevelAreas(rootEl: HTMLElement, levelId: string): TemplateResult {
  const b = CRYSTAL_FOUR;
  const level: LevelDef | undefined = b.levels.find((l) => l.id === levelId);
  const ctx: { statuses: Map<string, AreaStatus>; planOpen: boolean } = {
    statuses: new Map(),
    planOpen: false,
  };

  function paint() {
    render(view(), rootEl);
  }

  async function load() {
    const draft = loadDraft();
    ctx.statuses = await areaStatuses(b, draft?.job.ref ?? null);
    paint();
  }

  // Other tablets are working the same building — refresh what they have done.
  const stopWatching = onRemoteChange(() => void load());
  window.addEventListener('beforeunload', stopWatching, { once: true });

  async function open(area: AreaDef) {
    if (!level) return;
    const st = ctx.statuses.get(area.ref) ?? 'not-started';
    if (isRemote(st)) {
      const ok = await confirmDialog({
        title: `${area.ref} is on another tablet`,
        message:
          st === 'remote-done'
            ? `Another device has already completed ${area.ref}. Opening it here starts a fresh inspection on this tablet, and whichever device syncs last is the copy that is kept. Open it anyway?`
            : `Another device is part way through ${area.ref}. Opening it here starts a fresh inspection on this tablet, and whichever device syncs last is the copy that is kept. Open it anyway?`,
        confirmLabel: 'Open anyway',
        destructive: true,
      });
      if (!ok) return;
    }
    await openArea(b, level, area);
    toast(`Opened ${area.ref}`);
    go('dashboard');
  }

  function grouped(l: LevelDef): [AreaGroup, AreaDef[]][] {
    const map = new Map<AreaGroup, AreaDef[]>();
    for (const a of l.areas) {
      const list = map.get(a.group) ?? [];
      list.push(a);
      map.set(a.group, list);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g) ?? []]);
  }

  function statusChip(st: AreaStatus): TemplateResult {
    if (st === 'done') return html`<span class="area__st is-done">Complete</span>`;
    if (st === 'draft') return html`<span class="area__st is-draft">In progress</span>`;
    if (st === 'remote-done')
      return html`<span class="area__st is-remote">Complete · another tablet</span>`;
    if (st === 'remote-draft')
      return html`<span class="area__st is-remote">In progress · another tablet</span>`;
    return html`<span class="area__st">Not started</span>`;
  }

  function view(): TemplateResult {
    if (!level) {
      return html`
        <section class="screen">
          ${Header({ back: () => go('building'), title: 'Level' })}
          <div class="container"><p>That level is not in the register.</p></div>
          ${Footer()}
        </section>
      `;
    }
    const l = level;
    return html`
      <section class="screen">
        ${Header({ back: () => go('building'), title: l.id })}
        <div class="container lvl">
          <div class="lvl__title">
            <h1>${l.label}</h1>
            ${l.dwg ? html`<p class="lvl__dwg">${l.dwg}</p>` : null}
          </div>

          ${l.plan
            ? html`
                <figure class="lvl__plan">
                  <button
                    class="lvl__plan-btn"
                    @click=${() => {
                      ctx.planOpen = !ctx.planOpen;
                      paint();
                    }}
                    aria-expanded=${ctx.planOpen ? 'true' : 'false'}
                  >
                    <img
                      src=${planUrl(l.plan)}
                      alt="Colour-coded area plan for ${l.label}"
                      class=${ctx.planOpen ? 'is-open' : ''}
                      loading="lazy"
                    />
                    <span class="lvl__plan-hint">
                      ${Icon({ name: ctx.planOpen ? 'minus' : 'plus', size: 16 })}
                      ${ctx.planOpen ? 'Tap to shrink' : 'Tap to enlarge'}
                    </span>
                  </button>
                  ${l.planNote ? html`<figcaption>${l.planNote}</figcaption>` : null}
                </figure>
              `
            : l.planNote
              ? html`<p class="lvl__nonote">${l.planNote}</p>`
              : null}

          ${grouped(l).map(
            ([group, areas]) => html`
              <h2 class="lvl__group">${GROUP_LABELS[group]} <span>${areas.length}</span></h2>
              <ul class="lvl__areas">
                ${areas.map((area) => {
                  const st = ctx.statuses.get(area.ref) ?? 'not-started';
                  return html`
                    <li>
                      <button class="area area--${group} is-${st}" @click=${() => void open(area)}>
                        <span class="area__ref">${area.ref}</span>
                        <span class="area__body">
                          <span class="area__label">${area.label}</span>
                          ${area.note ? html`<span class="area__note">${area.note}</span>` : null}
                          ${area.dwg ? html`<span class="area__dwg">${area.dwg}</span>` : null}
                        </span>
                        ${statusChip(st)}
                      </button>
                    </li>
                  `;
                })}
              </ul>
            `,
          )}
        </div>
        ${Footer()}
      </section>
    `;
  }

  pullRemoteQuietly();
  void load();
  return view();
}
