import { html, render, type TemplateResult } from 'lit-html';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { toast } from '@/components/Toast';
import { loadDraft, saveDraft } from '@/state/persist';
import { CHECKLISTS, FIRE_PRESET, type ChecklistKey } from '@/domain/checklists';
import { DISCIPLINES, DISC_LABELS, type Discipline } from '@/domain/disciplines';
import { go } from '@/lib/router';
import { newId } from '@/lib/id';

interface AddRoomDraft {
  name: string;
  template: ChecklistKey | 'fire' | 'blank';
  discs: Set<Discipline>;
}

export function RoomSetup(rootEl: HTMLElement): TemplateResult {
  let addingRoom = false;
  const addDraft: AddRoomDraft = { name: '', template: 'blank', discs: new Set<Discipline>() };

  function paint() {
    render(view(), rootEl);
  }

  function toggleExcluded(roomId: string) {
    const s = loadDraft();
    if (!s) return;
    const r = s.rooms[roomId];
    if (!r) return;
    r.excluded = !r.excluded;
    s.job.updatedAt = Date.now();
    saveDraft(s);
    paint();
  }

  function openAddRoom() {
    addingRoom = true;
    addDraft.name = '';
    addDraft.template = 'blank';
    addDraft.discs.clear();
    paint();
  }

  function closeAddRoom() {
    addingRoom = false;
    paint();
  }

  function toggleDisc(d: Discipline) {
    if (addDraft.discs.has(d)) addDraft.discs.delete(d);
    else addDraft.discs.add(d);
    paint();
  }

  function commitAddRoom() {
    const name = addDraft.name.trim();
    if (!name) {
      toast('Give the room a name first');
      return;
    }
    const s = loadDraft();
    if (!s) return;
    const id = `custom_${newId()}`;
    const template = addDraft.template;
    let discs: Discipline[];
    let items: Record<string, ReturnType<typeof itemFromLabel>>;

    if (template === 'blank') {
      discs = Array.from(addDraft.discs);
      if (discs.length === 0) discs = ['civil'];
      items = {};
    } else if (template === 'fire') {
      discs = ['fire'];
      items = Object.fromEntries(
        FIRE_PRESET.map((label, idx) => [`fire_${idx}`, itemFromLabel('fire', label, idx)]),
      );
    } else {
      const cl = CHECKLISTS[template];
      discs = Array.from(addDraft.discs);
      if (discs.length === 0) discs = Object.keys(cl) as Discipline[];
      items = {};
      for (const disc of discs) {
        const labels = cl[disc] ?? [];
        labels.forEach((label, idx) => {
          const key = `${disc}_${idx}`;
          items[key] = itemFromLabel(disc, label, idx);
        });
      }
    }

    s.rooms[id] = {
      id,
      label: name,
      icon: '✎',
      clKey: template === 'blank' || template === 'fire' ? 'kitchen' : template,
      discs,
      custom: true,
      excluded: false,
      overviewPhotoId: null,
      items,
    };
    s.roomOrder.push(id);
    s.job.updatedAt = Date.now();
    saveDraft(s);
    addingRoom = false;
    toast(`Added: ${name}`);
    paint();
  }

  function itemFromLabel(disc: Discipline, label: string, idx: number) {
    return {
      key: `${disc}_${idx}`,
      label,
      disc,
      status: 'pending' as const,
      note: '',
      observations: [],
    };
  }

  function confirm() {
    const s = loadDraft();
    if (!s) return;
    const visible = s.roomOrder.map((id) => s.rooms[id]).filter((r) => r && !r.excluded).length;
    if (visible === 0) {
      toast('Pick at least one room before continuing');
      return;
    }
    toast('Room list confirmed');
    go('dashboard');
  }

  function view(): TemplateResult {
    const s = loadDraft();
    if (!s) {
      queueMicrotask(() => go('splash'));
      return html``;
    }
    const rooms = s.roomOrder.map((id) => s.rooms[id]!).filter(Boolean);
    const available = rooms.filter((r) => !r.excluded);
    const unavailable = rooms.filter((r) => r.excluded);

    return html`
      <section class="screen">
        ${Header({ title: 'Confirm rooms', back: () => go('cover') })}
        <main class="container room-setup">
          <p class="hint">
            Tick which rooms exist in this property. Not Available rooms are hidden from the inspection
            dashboard but still listed on the report under "Not applicable".
          </p>

          <h2 class="section-title">Available · ${available.length}</h2>
          <ul class="room-setup__list">
            ${available.map((r) => row(r, true))}
          </ul>

          ${unavailable.length > 0
            ? html`
                <h2 class="section-title">Not available · ${unavailable.length}</h2>
                <ul class="room-setup__list">
                  ${unavailable.map((r) => row(r, false))}
                </ul>
              `
            : null}

          <div class="room-setup__add">
            ${Button({
              label: '+ Add custom room',
              variant: 'secondary',
              full: true,
              onClick: openAddRoom,
            })}
          </div>

          <div class="room-setup__actions">
            ${Button({
              label: 'Start inspection →',
              size: 'lg',
              full: true,
              onClick: confirm,
            })}
          </div>
        </main>
        ${Footer()}
        ${addingRoom ? addRoomModal() : null}
      </section>
    `;
  }

  function row(r: NonNullable<ReturnType<typeof loadDraft>>['rooms'][string], avail: boolean): TemplateResult {
    return html`
      <li class="room-setup__row">
        <span class="room-setup__icon">${r.icon}</span>
        <span class="room-setup__label">${r.label}</span>
        <button
          class="btn btn--sm ${avail ? 'btn--secondary' : 'btn--ghost'}"
          @click=${() => toggleExcluded(r.id)}
        >
          ${avail ? '✗ Not available' : '✓ Restore'}
        </button>
      </li>
    `;
  }

  function addRoomModal(): TemplateResult {
    return Modal({
      title: 'Add custom room',
      body: html`
        <label class="field">
          <span class="field__label">Room name</span>
          <input
            class="field__input"
            placeholder="e.g. Driver's Room"
            .value=${addDraft.name}
            @input=${(e: Event) => {
              addDraft.name = (e.target as HTMLInputElement).value;
            }}
          />
        </label>

        <label class="field">
          <span class="field__label">Start from template</span>
          <select
            class="field__select"
            .value=${addDraft.template}
            @change=${(e: Event) => {
              addDraft.template = (e.target as HTMLSelectElement).value as AddRoomDraft['template'];
              paint();
            }}
          >
            <option value="blank">Blank (you pick disciplines)</option>
            <option value="bathroom">Bathroom checklist</option>
            <option value="bedroom">Bedroom checklist</option>
            <option value="kitchen">Kitchen checklist</option>
            <option value="fire">Fire alarm & fire fighting preset</option>
          </select>
        </label>

        ${addDraft.template === 'blank' || addDraft.template !== 'fire'
          ? html`
              <div class="field">
                <span class="field__label">Disciplines</span>
                <div class="disc-grid">
                  ${DISCIPLINES.filter((d) => d !== 'fire').map(
                    (d) => html`
                      <label class="disc-chip ${addDraft.discs.has(d) ? 'disc-chip--on' : ''}">
                        <input
                          type="checkbox"
                          ?checked=${addDraft.discs.has(d)}
                          @change=${() => toggleDisc(d)}
                        />
                        ${DISC_LABELS[d]}
                      </label>
                    `,
                  )}
                </div>
              </div>
            `
          : null}
      `,
      primaryLabel: 'Add room',
      secondaryLabel: 'Cancel',
      onPrimary: commitAddRoom,
      onSecondary: closeAddRoom,
      onClose: closeAddRoom,
    });
  }

  return view();
}
