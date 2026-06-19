/**
 * Minimal observable store.
 * - getState() returns the current immutable snapshot
 * - update(fn) applies a draft update and notifies subscribers
 * - subscribe(fn) returns an unsubscribe
 */

import type { State } from './schema';

type Listener = (s: State) => void;

export class Store {
  private state: State;
  private listeners = new Set<Listener>();

  constructor(initial: State) {
    this.state = initial;
  }

  getState(): State {
    return this.state;
  }

  setState(next: State): void {
    this.state = next;
    this.emit();
  }

  update(producer: (draft: State) => State | void): void {
    const draft = structuredClone(this.state);
    const next = producer(draft);
    this.state = next ?? draft;
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.state);
  }
}
