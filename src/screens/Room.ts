import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { PhotoAttach } from '@/components/PhotoAttach';
import { confirmDialog } from '@/components/Confirm';
import { loadDraft, saveDraft } from '@/state/persist';
import { DISC_LABELS, DISC_ICONS, type Discipline } from '@/domain/disciplines';
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

export function Room(rootEl: HTMLElement, roomId: string): TemplateResult {
  const view: LocalView = { activeDisc: null, photoUrls: new Map() };

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
      toast(
        next
          ? `${DISC_LABELS[discBefore]} complete ✓ — switch to ${DISC_LABELS[next]}`
          : `${DISC_LABELS[discBefore]} complete ✓`,
      );
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
    for (const it of Object.values(room.items)) {
      for (const obs of it.observations) {
        for (const pid of obs.photoIds) {
          if (!view.photoUrls.has(pid)) {
            const url = await getPhotoUrl(pid);
            if (url) view.photoUrls.set(pid, url);
          }
        }
      }
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
                <strong>✓ Room complete</strong> — every item inspected, every issue has a note and photo
              </div>`
            : html`
                <div class="room-banner room-banner--warn">
                  <strong>${allPending} pending</strong>
                  ${incomplete > 0
                    ? html` · <strong class="room-banner__crit">⚠ ${incomplete} issue${incomplete === 1 ? '' : 's'} missing note or photo</strong>`
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
                  ${DISC_ICONS[d]} ${DISC_LABELS[d]}
                  ${ok
                    ? html`<span class="disc-tab__pill disc-tab__pill--done">✓</span>`
                    : html`
                        ${pending > 0
                          ? html`<span class="disc-tab__pill">${pending}</span>`
                          : null}
                        ${incompleteN > 0
                          ? html`<span class="disc-tab__pill disc-tab__pill--crit">⚠ ${incompleteN}</span>`
                          : null}
                      `}
                </button>
              `;
            })}
          </div>
          <ul class="item-list">
            ${items.map((it) => itemRow(room, it))}
          </ul>
          <div class="room__actions">
            ${Button({
              label: 'Back to dashboard',
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
      go('dashboard');
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
      go('dashboard');
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
    go('dashboard');
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

  function itemRow(_room: RoomState, item: Item): TemplateResult {
    const needsPhoto = issueMissingPhoto(item);
    const needsNote = issueMissingNote(item);
    const flagged = issueIncomplete(item);
    return html`
      <li
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
            ✓ Pass
          </button>
          <button
            class="item__btn ${item.status === 'issue' ? 'item__btn--on item__btn--issue' : ''}"
            @click=${() => {
              openSeverityPicker({
                itemLabel: item.label,
                initial: item.severity ?? null,
                onPick: (sev) => {
                  setStatus(item.key, 'issue', sev);
                  toast(`Marked ${SEVERITY_LABEL[sev]} — add note and photo`);
                },
                onCancel: () => {
                  /* no change */
                },
              });
            }}
          >
            ⚠ Issue${item.status === 'issue' && item.severity
              ? html`<span class="item__sev item__sev--${item.severity}"
                  >${SEVERITY_LABEL[item.severity]}</span
                >`
              : null}
          </button>
          <button
            class="item__btn ${item.status === 'na' ? 'item__btn--on' : ''}"
            @click=${() => setStatus(item.key, 'na')}
          >
            — N/A
          </button>
        </div>
        ${item.status === 'issue' ? observationsBlock(item) : null}
      </li>
    `;
  }

  function observationsBlock(item: Item): TemplateResult {
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
                              ✎
                            </button>
                            <button
                              class="obs__photo-remove"
                              aria-label="Remove photo"
                              @click=${() => void removePhoto(item.key, obs.id, pid)}
                            >
                              ×
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

  // Kick off photo preload for this room
  const s0 = loadDraft();
  const room0 = s0?.rooms[roomId];
  if (room0) void preloadPhotoUrls(room0);

  return render_();
}
