import { getSetting, setSetting } from './store';

export type DisplayMode = 'day' | 'eyeComfort' | 'dark' | 'bw';

const KEY = 'settings.displayMode';

export async function getDisplayMode(): Promise<DisplayMode> {
  return getSetting<DisplayMode>(KEY, 'day');
}

export async function setDisplayMode(mode: DisplayMode): Promise<void> {
  await setSetting(KEY, mode);
  applyDisplayMode(mode);
}

// 'day' (the site's normal designed look) has no filter — the other three
// are applied via a CSS filter on <html data-mode="..."> (see index.css).
export function applyDisplayMode(mode: DisplayMode): void {
  if (mode === 'day') {
    delete document.documentElement.dataset.mode;
  } else {
    document.documentElement.dataset.mode = mode;
  }
}
