import type { FakeScenario, FakeStore } from './scenario';
import { createFakeStore } from './scenario';
import mixed from './scenarios/mixed.json';

// Kept on globalThis, not in a module variable: Next can bundle route handlers and
// pages separately, and each bundle would otherwise get its own copy of "YouTube".
const KEY = Symbol.for('tlc.fakeYouTube.store');
type Holder = { [KEY]?: FakeStore };

/** The shared fake store, seeded from the default scenario on first use. */
export function getFakeStore(): FakeStore {
  const holder = globalThis as Holder;
  holder[KEY] ??= createFakeStore(mixed as FakeScenario, new Date());
  return holder[KEY];
}

/** Replaces the shared store with a fresh copy of a scenario (the default one if omitted). */
export function resetFakeStore(scenario: FakeScenario = mixed as FakeScenario, now: Date = new Date()): void {
  (globalThis as Holder)[KEY] = createFakeStore(scenario, now);
}
