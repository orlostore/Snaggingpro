import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { PhotoAttach } from '@/components/PhotoAttach';
import { confirmDialog } from '@/components/Confirm';
import { promptDialog } from '@/components/Prompt';
import { CHECKLISTS } from '@/domain/checklists';
import { loadDraft, saveDraft } from '@/state/persist';
import { DISC_LABELS, DISC_ICONS, type Discipline } from '@/domain/disciplines';
import { Icon, type IconName } from '@/components/Icon';
import type { Item, RoomState } from '@/state/schema';
import { go } from '@/lib/router';
import { toast } from '@/components/Toast';
import { storePhoto, getPhotoUrl, deletePhoto } from '@/storage/photos';
import { reencodeToWebp } from '@/lib/imageEncode';
import { openAnnotator } from '@/components/PhotoAnnotate';
import { openSeverityPicker } from '@/components/SeverityPicker';
import { newId } from '@/lib/id';
import {
  issueMissingPhoto,
  issueMissingNote,
  issueIncomplete,
  discIncompleteIssues,
  roomIncompleteIssues,
  SEVERITY_LABEL,
  type Severity,
} from '@/domain/snags';

interface LocalView {
  activeDisc: Discipline | null;
  photoUrls: Map<string, string>;
}

const FIXED_PHRASES = ['Done', 'Completed', 'Replaced', 'Repaired', 'Partially done'];
const NEW_PHRASES = ['Damage observed', 'Not as per spec', 'Workmanship issue'];

export function Room(
  rootEl: HTMLElement,
  roomId: string,
  params: { focus?: string; disc?: Discipline; from?: 'report' | 'dashboard' } = {},
): TemplateResult {
  const view: LocalView = {
    activeDisc: params.disc ?? null,
    photoUrls: new Map(),
  };
  const focusKey = params.focus ?? null;
  const cameFromReport = params.from === 'report';
  const backRoute = cameFromReport ? 'report' : 'dashboard';
  let focusHandled = false;

  function paint() {
    render(render_(), rootEl);
  }

  function setStatus(itemKey: string, status: Item['status'], severity?: Severity) {
    const s = loadDraft();
    if (!s) return;
    const room = s.rooms[roomId];
    const item = room?.items[itemKey];
    if (!item || !room) return;

    const discBefore = item.disc;
    const pendingBefore = countPending(room, discBefore);
    const roomPendingBefore = countAllPending(room);

    item.status = status;
    if (status === 'issue') {
      if (severity) item.severity = severity;
      if (item.observations.length === 0) {
        item.observations.push({ id: newId(), text: item.note, photoIds: [] });
        item.note = '';
      }
    } else {
      delete (item as { severity?: Severity }).severity;
    }
    s.job.updatedAt = Date.now();
    saveDraft(s);

    const pendingAfter = countPending(room, discBefore);
    if (pendingBefore > 0 && pendingAfter === 0) {
      const next = nextDisc(room, discBefore);
      if (next) {
        view.activeDisc = next; // auto-advance — less tapping
        toast(`${DISC_LABELS[discBefore]} complete ✓ — now on ${DISC_LABELS[next]}`);
      } else {
        toast(`${DISC_LABELS[discBefore]} complete ✓`);
      }
    }
    const roomPendingAfter = countAllPending(room);
    if (roomPendingBefore > 0 && roomPendingAfter === 0) {
      toast('Room complete ✓');
    }

    paint();
  }

  function countPending(room: RoomState, disc: Discipline): number {
    return Object.values(room.items).filter((i) => i.disc === disc && i.status === 'pending')
      .length;
  }
  function countAllPending(room: RoomState): number {
    return Object.values(room.items).filter((i) => i.status === 'pending').length;
  }
  function nextDisc(room: RoomState, current: Discipline): Discipline | null {
    const idx = room.discs.indexOf(current);
    for (let i = idx + 1; i < room.discs.length; i++) {
      const d = room.discs[i]!;
      if (countPending(room, d) > 0) return d;
    }
    return null;
  }

  function updateObsText(itemKey: string, obsId: string, text: string) {
    const s = loadDraft();
    if (!s) return;
    const item = s.rooms[roomId]?.items[itemKey];
    if (!item) return;
    const obs = item.observations.find((o) => o.id === obsId);
    if (!obs) return;
    obs.text = text;
    s.job.updatedAt = Date.now();
    saveDraft(s);
  }

  function addObservation(itemKey: string) {
    const s = loadDraft();
    if (!s) return;
    const item = s.rooms[roomId]?.items[itemKey];
    if (!item) return;
    item.observations.push({ id: newId(), text: '', photoIds: [] });
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  async function removeObservation(itemKey: string, obsId: string) {
    const ok = await confirmDialog({
      title: 'Delete this observation?',
      message: 'The note and any photos attached to it will be removed.',
      destructive: true,
      confirmLabel: 'Delete observation',
    });
    if (!ok) return;
    const s = loadDraft();
    if (!s) return;
    const item = s.rooms[roomId]?.items[itemKey];
    if (!item) return;
    const obs = item.observations.find((o) => o.id === obsId);
    if (obs) {
      for (const pid of obs.photoIds) await deletePhoto(pid);
    }
    item.observations = item.observations.filter((o) => o.id !== obsId);
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  async function addPhotoToObs(itemKey: string, obsId: string, file: File) {
    const s = loadDraft();
    if (!s) return;
    const item = s.rooms[roomId]?.items[itemKey];
    const obs = item?.observations.find((o) => o.id === obsId);
    if (!obs) return;
    const webp = await reencodeToWebp(file);
    const id = await storePhoto(webp, 'snag', s.job.ref);
    obs.photoIds.push(id);
    s.job.updatedAt = Date.now();
    saveDraft(s);
    const url = await getPhotoUrl(id);
    if (url) view.photoUrls.set(id, url);
    paint();
  }

  function annotatePhoto(itemKey: string, obsId: string, photoId: string) {
    const s = loadDraft();
    if (!s) return;
    openAnnotator({
      photoId,
      jobRef: s.job.ref,
      onSave: async (newPhotoId) => {
        const s2 = loadDraft();
        if (!s2) return;
        const obs = s2.rooms[roomId]?.items[itemKey]?.observations.find((o) => o.id === obsId);
        if (!obs) return;
        obs.photoIds = obs.photoIds.map((p) => (p === photoId ? newPhotoId : p));
        s2.job.updatedAt = Date.now();
        saveDraft(s2);
        await deletePhoto(photoId);
        view.photoUrls.delete(photoId);
        const url = await getPhotoUrl(newPhotoId);
        if (url) view.photoUrls.set(newPhotoId, url);
        paint();
        toast('Annotation saved');
      },
      onCancel: () => {
        /* no-op */
      },
    });
  }

  async function removePhoto(itemKey: string, obsId: string, photoId: string) {
    const ok = await confirmDialog({
      title: 'Remove this photo?',
      message: 'The photo will be deleted from this observation.',
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    const s = loadDraft();
    if (!s) return;
    const obs = s.rooms[roomId]?.items[itemKey]?.observations.find((o) => o.id === obsId);
    if (!obs) return;
    obs.photoIds = obs.photoIds.filter((p) => p !== photoId);
    await deletePhoto(photoId);
    s.job.updatedAt = Date.now();
    saveDraft(s);
    view.photoUrls.delete(photoId);
    paint();
  }

  async function preloadPhotoUrls(room: RoomState) {
    const ids = new Set<string>();
    for (const it of Object.values(room.items)) {
      for (const obs of it.observations) {
        for (const pid of obs.photoIds) ids.add(pid);
        for (const pid of obs.rectification?.photoIds ?? []) ids.add(pid);
      }
    }
    for (const pid of ids) {
      if (view.photoUrls.has(pid)) continue;
      const url = await getPhotoUrl(pid);
      if (url) view.photoUrls.set(pid, url);
    }
    paint();
  }

  function render_(): TemplateResult {
    const s = loadDraft();
    if (!s) {
      queueMicrotask(() => go('splash'));
      return html``;
    }
    const room = s.rooms[roomId];
    if (!room) {
      queueMicrotask(() => go('dashboard'));
      return html``;
    }
    const discs = room.discs;
    if (!view.activeDisc) view.activeDisc = discs[0] ?? null;
    // First paint after a deep-link from Report: scroll the focused
    // item into view and flash it. Only runs once per mount.
    if (focusKey && !focusHandled) {
      focusHandled = true;
      requestAnimationFrame(() => {
        const el = rootEl.querySelector<HTMLElement>(`[data-item-key="${focusKey}"]`);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('item--focus-flash');
        setTimeout(() => el.classList.remove('item--focus-flash'), 1800);
      });
    }
    const active = view.activeDisc;
    if (!active) return html`<p class="empty">No disciplines for this room.</p>`;

    const items = Object.values(room.items).filter((i) => i.disc === active);
    const allPending = countAllPending(room);
    const allDone = room.discs.every((d) => countPending(room, d) === 0);
    const incomplete = roomIncompleteIssues(room).length;

    return html`
      <section class="screen">
        ${Header({ title: room.label, back: () => void tryLeave() })}
        <main class="container room">
          ${allDone && incomplete === 0
            ? html`<div class="room-banner room-banner--ok">
                ${Icon({ name: 'check', size: 18 })}
                <strong>Room complete</strong>
                <span class="room-banner__sub">every item inspected, every issue has a note and photo</span>
              </div>`
            : html`
                <div class="room-banner room-banner--warn">
                  ${Icon({ name: 'alert', size: 18 })}
                  <strong>${allPending} pending</strong>
                  ${incomplete > 0
                    ? html`<span class="room-banner__sub room-banner__crit">${incomplete} issue${incomplete === 1 ? '' : 's'} missing note or photo</span>`
                    : null}
                </div>
              `}
          <div class="disc-tabs">
            ${discs.map((d) => {
              const pending = countPending(room, d);
              const incompleteN = discIncompleteIssues(room, d);
              const ok = pending === 0 && incompleteN === 0;
              return html`
                <button
                  class="disc-tab ${d === active ? 'disc-tab--on' : ''} ${ok
                    ? 'disc-tab--done'
                    : 'disc-tab--pending'}"
                  @click=${() => {
                    view.activeDisc = d;
                    paint();
                  }}
                >
                  ${Icon({ name: DISC_ICONS[d] as IconName, size: 16 })}
                  <span>${DISC_LABELS[d]}</span>
                  ${ok
                    ? html`<span class="disc-tab__count disc-tab__count--done">${Icon({ name: 'check', size: 14 })}</span>`
                    : html`
                        ${pending > 0
                          ? html`<span class="disc-tab__count">${pending}</span>`
                          : null}
                        ${incompleteN > 0
                          ? html`<span class="disc-tab__count disc-tab__count--crit">${incompleteN}</span>`
                          : null}
                      `}
                </button>
              `;
            })}
          </div>
          ${room.dbInstances && room.dbInstances.length > 0
            ? dbPanelGroups(room, active)
            : html`<ul class="item-list">${items.map((it) => itemRow(room, it))}</ul>`}
          ${room.dbInstances ? dbAddRow() : null}
          <div class="room__actions">
            ${Button({
              label: cameFromReport ? 'Back to report' : 'Back to dashboard',
              full: true,
              variant: 'secondary',
              onClick: () => void tryLeave(),
            })}
          </div>
        </main>
        ${Footer()}
      </section>
    `;
  }

  async function tryLeave() {
    const s = loadDraft();
    const room = s?.rooms[roomId];
    if (!room) {
      go(backRoute);
      return;
    }
    const pending = countAllPending(room);
    const incompleteItems = roomIncompleteIssues(room);

    // Hard case: items marked Issue but missing note or photo.
    // You can't leave them in that state — either finish them or revert.
    if (incompleteItems.length > 0) {
      const revert = await confirmDialog({
        title: 'Finish your snags or revert them?',
        message: `${incompleteItems.length} item${incompleteItems.length === 1 ? ' is' : 's are'} marked as Issue but missing notes or photos. Add the details now, or remove the Issue mark so you can leave.`,
        confirmLabel: 'Revert and leave',
        cancelLabel: 'Stay and finish',
      });
      if (!revert) return;
      revertIncompleteIssues();
      go(backRoute);
      return;
    }

    // Soft case: untouched items only. Just confirm you mean to step away.
    if (pending > 0) {
      const ok = await confirmDialog({
        title: 'Leave this room?',
        message: `${room.label}: ${pending} item${pending === 1 ? '' : 's'} still untouched. You can come back any time.`,
        confirmLabel: 'Leave anyway',
        cancelLabel: 'Stay',
      });
      if (!ok) return;
    }
    go(backRoute);
  }

  function revertIncompleteIssues() {
    const s = loadDraft();
    if (!s) return;
    const room = s.rooms[roomId];
    if (!room) return;
    let count = 0;
    for (const item of Object.values(room.items)) {
      if (issueIncomplete(item)) {
        item.status = 'pending';
        item.observations = [];
        item.note = '';
        count++;
      }
    }
    if (count > 0) {
      s.job.updatedAt = Date.now();
      saveDraft(s);
      toast(`${count} item${count === 1 ? '' : 's'} reverted to pending`);
    }
  }

  function dbPanelGroups(room: RoomState, activeDisc: Discipline): TemplateResult {
    const instances = room.dbInstances ?? [];
    return html`
      <div class="db-groups">
        ${instances.map((inst) => {
          const instItems = Object.values(room.items).filter(
            (i) => i.dbNum === inst.num && i.disc === activeDisc,
          );
          const label = inst.location ? `DB ${inst.num} — ${inst.location}` : `DB ${inst.num}`;
          return html`
            <section class="db-group">
              <header class="db-group__head">
                <span class="db-group__label">${label}</span>
                <div class="db-group__actions">
                  <button
                    class="btn btn--ghost btn--sm"
                    title="Rename location"
                    @click=${() => void renameDbLocation(inst.num)}
                  >
                    ${Icon({ name: 'pencil', size: 14 })}
                  </button>
                </div>
              </header>
              <ul class="item-list">${instItems.map((it) => itemRow(room, it))}</ul>
            </section>
          `;
        })}
      </div>
    `;
  }

  function dbAddRow(): TemplateResult {
    return html`
      <div class="db-add">
        <button class="btn btn--secondary btn--sm" @click=${() => void addDbInstance()}>
          ${Icon({ name: 'plus', size: 14 })}<span>Add DB Panel</span>
        </button>
      </div>
    `;
  }

  async function addDbInstance() {
    const s = loadDraft();
    const room = s?.rooms[roomId];
    if (!s || !room || !room.dbInstances) return;
    const location = await promptDialog({
      title: 'Add DB Panel',
      message: 'Where is this DB panel located? (e.g. GF, FF, Garage). Leave blank to skip.',
      placeholder: 'Location',
    });
    if (location === null) return;
    const nextNum = Math.max(0, ...room.dbInstances.map((d) => d.num)) + 1;
    room.dbInstances.push({ num: nextNum, location: location.trim() });
    // Create items for every discipline this room covers
    for (const disc of room.discs) {
      const labels = CHECKLISTS[room.clKey as keyof typeof CHECKLISTS]?.[disc] ?? [];
      labels.forEach((label, idx) => {
        const key = `${disc}_${idx}_db${nextNum}`;
        room.items[key] = {
          key,
          label,
          disc,
          status: 'pending',
          note: '',
          observations: [],
          dbNum: nextNum,
        };
      });
    }
    s.job.updatedAt = Date.now();
    saveDraft(s);
    toast(`DB Panel ${nextNum} added`);
    paint();
  }

  async function renameDbLocation(num: number) {
    const s = loadDraft();
    const room = s?.rooms[roomId];
    const inst = room?.dbInstances?.find((d) => d.num === num);
    if (!s || !inst) return;
    const next = await promptDialog({
      title: `DB Panel ${num} location`,
      placeholder: 'GF / FF / Garage',
      initial: inst.location,
    });
    if (next === null) return;
    inst.location = next.trim();
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  function itemRow(_room: RoomState, item: Item): TemplateResult {
    const needsPhoto = issueMissingPhoto(item);
    const needsNote = issueMissingNote(item);
    const flagged = issueIncomplete(item);
    return html`
      <li
        data-item-key=${item.key}
        class="item ${item.status !== 'pending' ? `item--${item.status}` : ''} ${flagged
          ? 'item--needs-attention'
          : ''}"
      >
        <div class="item__label">
          ${item.dbNum ? html`<span class="item__db">DB ${item.dbNum}</span>` : null}
          ${item.label}
          ${needsNote
            ? html`<span class="item__needs item__needs--note">✎ note required</span>`
            : null}
          ${needsPhoto
            ? html`<span class="item__needs item__needs--photo">📷 photo required</span>`
            : null}
        </div>
        <div class="item__statuses">
          <button
            class="item__btn ${item.status === 'pass' ? 'item__btn--on' : ''}"
            @click=${() => setStatus(item.key, 'pass')}
          >
            ${Icon({ name: 'check', size: 16 })}
            <span>Pass</span>
          </button>
          <button
            class="item__btn ${item.status === 'issue'
              ? `item__btn--on item__btn--sev-${item.severity ?? 'minor'}`
              : ''}"
            @click=${() => {
              openSeverityPicker({
                itemLabel: item.label,
                initial: item.severity ?? null,
                onPick: (sev) => {
                  setStatus(item.key, 'issue', sev);
                  toast(`Marked ${SEVERITY_LABEL[sev]} — add note and photo`);
                },
                onCancel: () => { /* no change */ },
              });
            }}
          >
            ${Icon({ name: 'alert', size: 16 })}
            <span>${item.status === 'issue' && item.severity
              ? SEVERITY_LABEL[item.severity]
              : 'Issue'}</span>
          </button>
          <button
            class="item__btn ${item.status === 'na' ? 'item__btn--on' : ''}"
            @click=${() => setStatus(item.key, 'na')}
          >
            ${Icon({ name: 'minus', size: 16 })}
            <span>N/A</span>
          </button>
        </div>
        ${item.status === 'issue' ? observationsBlock(item) : null}
      </li>
    `;
  }

  function observationsBlock(item: Item): TemplateResult {
    const s = loadDraft();
    const isFollowUp = s?.job.reportType === 'follow-up';
    return html`
      <div class="obs-block">
        ${item.observations.map(
          (obs) => html`
            <div class="obs">
              <textarea
                class="item__note"
                placeholder="Describe the issue…"
                .value=${obs.text}
                @input=${(e: Event) =>
                  updateObsText(item.key, obs.id, (e.target as HTMLTextAreaElement).value)}
              ></textarea>

              ${obs.photoIds.length > 0
                ? html`
                    <div class="obs__photos">
                      ${obs.photoIds.map(
                        (pid) => html`
                          <div class="obs__photo">
                            ${view.photoUrls.get(pid)
                              ? html`<img
                                  src=${view.photoUrls.get(pid)!}
                                  alt="snag photo"
                                  @click=${() => annotatePhoto(item.key, obs.id, pid)}
                                />`
                              : html`<div class="obs__photo-loading">…</div>`}
                            <button
                              class="obs__photo-annotate"
                              aria-label="Annotate photo"
                              @click=${() => annotatePhoto(item.key, obs.id, pid)}
                            >
                              ${Icon({ name: 'pencil', size: 14 })}
                            </button>
                            <button
                              class="obs__photo-remove"
                              aria-label="Remove photo"
                              @click=${() => void removePhoto(item.key, obs.id, pid)}
                            >
                              ${Icon({ name: 'x', size: 14 })}
                            </button>
                          </div>
                        `,
                      )}
                    </div>
                  `
                : null}

              ${PhotoAttach({
                onPicked: (f) => void addPhotoToObs(item.key, obs.id, f),
                label: 'Add photo to this observation',
              })}

              ${isFollowUp ? rectificationPanel(item, obs) : null}

              <div class="obs__actions">
                <button
                  class="btn btn--ghost btn--sm"
                  @click=${() => void removeObservation(item.key, obs.id)}
                >
                  Delete observation
                </button>
              </div>
            </div>
          `,
        )}

        <button class="btn btn--secondary btn--sm" @click=${() => addObservation(item.key)}>
          + Add another observation
        </button>
      </div>
    `;
  }

  function rectificationPanel(
    item: Item,
    obs: Item['observations'][number],
  ): TemplateResult {
    const r = obs.rectification ?? { status: 'open', note: '', photoIds: [] };
    return html`
      <div class="rect">
        <div class="rect__head">
          ${Icon({ name: 'check', size: 14 })}
          <span>Rectification status</span>
        </div>
        <div class="rect__statuses">
          <button
            class="rect__btn ${r.status === 'open' ? 'rect__btn--open' : ''}"
            @click=${() => setRectification(item.key, obs.id, 'open')}
          >
            ${Icon({ name: 'alert', size: 14 })}<span>Still open</span>
          </button>
          <button
            class="rect__btn ${r.status === 'fixed' ? 'rect__btn--fixed' : ''}"
            @click=${() => setRectification(item.key, obs.id, 'fixed')}
          >
            ${Icon({ name: 'check', size: 14 })}<span>Fixed</span>
          </button>
          <button
            class="rect__btn ${r.status === 'new' ? 'rect__btn--new' : ''}"
            @click=${() => setRectification(item.key, obs.id, 'new')}
          >
            ${Icon({ name: 'plus', size: 14 })}<span>New issue</span>
          </button>
        </div>
        ${r.status === 'fixed' || r.status === 'new'
          ? html`
              <div class="rect__chips">
                ${(r.status === 'fixed' ? FIXED_PHRASES : NEW_PHRASES).map(
                  (phrase) => html`
                    <button
                      type="button"
                      class="rect__chip"
                      @click=${() => setRectificationNote(item.key, obs.id, phrase)}
                    >
                      ${phrase}
                    </button>
                  `,
                )}
              </div>
              <textarea
                class="item__note rect__note"
                placeholder=${r.status === 'fixed'
                  ? 'Closeout notes — what was done to fix this?'
                  : 'Describe the new issue…'}
                .value=${r.note}
                @input=${(e: Event) =>
                  setRectificationNote(item.key, obs.id, (e.target as HTMLTextAreaElement).value)}
              ></textarea>

              ${r.photoIds.length > 0
                ? html`
                    <div class="obs__photos rect__photos">
                      ${r.photoIds.map(
                        (pid) => html`
                          <div class="obs__photo">
                            ${view.photoUrls.get(pid)
                              ? html`<img src=${view.photoUrls.get(pid)!} alt="closeout photo" />`
                              : html`<div class="obs__photo-loading">…</div>`}
                            <button
                              class="obs__photo-remove"
                              aria-label="Remove closeout photo"
                              @click=${() => void removeRectificationPhoto(item.key, obs.id, pid)}
                            >
                              ${Icon({ name: 'x', size: 14 })}
                            </button>
                          </div>
                        `,
                      )}
                    </div>
                  `
                : null}

              ${PhotoAttach({
                onPicked: (f) => void addRectificationPhoto(item.key, obs.id, f),
                label: r.status === 'fixed' ? 'Add closeout photo' : 'Add photo of new issue',
              })}
            `
          : null}
      </div>
    `;
  }

  function setRectification(
    itemKey: string,
    obsId: string,
    status: 'fixed' | 'open' | 'new',
  ) {
    const s = loadDraft();
    if (!s) return;
    const obs = s.rooms[roomId]?.items[itemKey]?.observations.find((o) => o.id === obsId);
    if (!obs) return;
    obs.rectification = obs.rectification ?? { status: 'open', note: '', photoIds: [] };
    obs.rectification.status = status;
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  function setRectificationNote(itemKey: string, obsId: string, text: string) {
    const s = loadDraft();
    if (!s) return;
    const obs = s.rooms[roomId]?.items[itemKey]?.observations.find((o) => o.id === obsId);
    if (!obs) return;
    obs.rectification = obs.rectification ?? { status: 'open', note: '', photoIds: [] };
    obs.rectification.note = text;
    s.job.updatedAt = Date.now();
    saveDraft(s);
  }

  async function addRectificationPhoto(itemKey: string, obsId: string, file: File) {
    const s = loadDraft();
    if (!s) return;
    const obs = s.rooms[roomId]?.items[itemKey]?.observations.find((o) => o.id === obsId);
    if (!obs) return;
    obs.rectification = obs.rectification ?? { status: 'fixed', note: '', photoIds: [] };
    const webp = await reencodeToWebp(file);
    const id = await storePhoto(webp, 'rectification', s.job.ref);
    obs.rectification.photoIds.push(id);
    s.job.updatedAt = Date.now();
    saveDraft(s);
    const url = await getPhotoUrl(id);
    if (url) view.photoUrls.set(id, url);
    paint();
  }

  async function removeRectificationPhoto(itemKey: string, obsId: string, photoId: string) {
    const ok = await confirmDialog({
      title: 'Remove this closeout photo?',
      message: 'The photo will be removed from the rectification record.',
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    const s = loadDraft();
    if (!s) return;
    const obs = s.rooms[roomId]?.items[itemKey]?.observations.find((o) => o.id === obsId);
    if (!obs?.rectification) return;
    obs.rectification.photoIds = obs.rectification.photoIds.filter((p) => p !== photoId);
    await deletePhoto(photoId);
    s.job.updatedAt = Date.now();
    saveDraft(s);
    view.photoUrls.delete(photoId);
    paint();
  }

  // Kick off photo preload for this room
  const s0 = loadDraft();
  const room0 = s0?.rooms[roomId];
  if (room0) void preloadPhotoUrls(room0);

  return render_();
}
