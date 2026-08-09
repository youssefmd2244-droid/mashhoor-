import { getSetting, setSetting } from './store';

// Every color used across the site is defined once as a CSS custom property
// in :root (src/index.css). This list mirrors that, so Settings → Colors can
// edit any of them live, with no code changes needed.
export const COLOR_VARS: { key: string; label: string; default: string }[] = [
  { key: '--c-maroon', label: 'عنابي أساسي', default: '#A90009' },
  { key: '--c-maroon-deep', label: 'عنابي غامق', default: '#750001' },
  { key: '--c-gold', label: 'ذهبي', default: '#EEC31C' },
  { key: '--c-red', label: 'أحمر', default: '#C11E10' },
  { key: '--c-red-deep', label: 'أحمر غامق', default: '#AC0B06' },
  { key: '--c-cream', label: 'كريمي', default: '#EDD8BA' },
  { key: '--c-charcoal', label: 'فحمي أساسي', default: '#1C1F21' },
  { key: '--c-charcoal-2', label: 'فحمي 2', default: '#202325' },
  { key: '--c-charcoal-3', label: 'فحمي 3', default: '#403933' },
  { key: '--c-sand', label: 'رملي', default: '#B9B097' },
  { key: '--c-olive', label: 'زيتي', default: '#31492D' },
  { key: '--c-olive-2', label: 'زيتي 2', default: '#34492E' },
  { key: '--c-sage', label: 'أخضر مريمية', default: '#687457' },
  { key: '--c-tomato', label: 'طماطمي', default: '#B3172D' },
  { key: '--c-salmon', label: 'سالمون', default: '#CB977F' },
  { key: '--c-mustard', label: 'خردلي', default: '#F2BF05' },
  { key: '--c-brick', label: 'طوبي', default: '#9B3734' },
  { key: '--c-olive-acc', label: 'زيتي مميز', default: '#869B11' },
  { key: '--c-white-cream', label: 'أبيض كريمي', default: '#E8E8E9' },
  { key: '--c-white-pure', label: 'أبيض نقي', default: '#FFFEFF' },
  { key: '--c-gold-brown', label: 'ذهبي بني', default: '#A37C4A' },
  { key: '--c-grey-1', label: 'رمادي 1', default: '#60564C' },
  { key: '--c-grey-2', label: 'رمادي 2', default: '#C5C6C7' },
  { key: '--c-grey-3', label: 'رمادي 3', default: '#D1D2D2' },
  { key: '--c-mauve', label: 'موڤ', default: '#D7B3B2' },
  { key: '--c-mauve-2', label: 'موڤ 2', default: '#D3B9B8' },
  { key: '--c-near-white', label: 'شبه أبيض', default: '#F3F3F2' },
  { key: '--c-mauve-deep', label: 'موڤ غامق', default: '#866A68' },
  { key: '--c-kraft', label: 'كرافت', default: '#F5E9DD' },
  { key: '--c-kraft-2', label: 'كرافت 2', default: '#F7EDE3' },
  { key: '--c-brown-deep', label: 'بني غامق', default: '#2A1C1A' },
  { key: '--c-brown-mid', label: 'بني وسط', default: '#846950' },
];

const OVERRIDES_KEY = 'settings.colorOverrides';

export async function getColorOverrides(): Promise<Record<string, string>> {
  return getSetting<Record<string, string>>(OVERRIDES_KEY, {});
}

export async function setColorOverride(key: string, value: string) {
  const current = await getColorOverrides();
  const next = { ...current, [key]: value };
  await setSetting(OVERRIDES_KEY, next);
  applyColorOverrides(next);
}

export async function resetColorOverride(key: string) {
  const current = await getColorOverrides();
  delete current[key];
  await setSetting(OVERRIDES_KEY, current);
  document.documentElement.style.removeProperty(key);
}

export async function resetAllColors() {
  await setSetting(OVERRIDES_KEY, {});
  for (const v of COLOR_VARS) document.documentElement.style.removeProperty(v.key);
}

export function applyColorOverrides(overrides: Record<string, string>) {
  for (const [key, value] of Object.entries(overrides)) {
    document.documentElement.style.setProperty(key, value);
  }
}
