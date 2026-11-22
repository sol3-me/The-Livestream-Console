import type { FakeStore } from './scenario';
import { createFakeStore } from './scenario';

export function getFakeStore(): FakeStore {
  return createFakeStore({ streamKeys: [], broadcasts: [], playlists: [] }, new Date());
}

export function resetFakeStore(): void {}
