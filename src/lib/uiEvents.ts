// A couple of the site's pieces (top nav, settings modal, menu search) live
// in separate components that don't share a parent worth wiring props
// through. Instead of lifting state up into App.tsx, they talk through two
// tiny named browser events — simplest thing that works, no new provider.

const OPEN_SETTINGS_EVENT = 'ui:open-settings';
const FOCUS_MENU_SEARCH_EVENT = 'ui:focus-menu-search';

export function openSettingsPanel(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
export function onOpenSettingsPanel(cb: () => void): () => void {
  window.addEventListener(OPEN_SETTINGS_EVENT, cb);
  return () => window.removeEventListener(OPEN_SETTINGS_EVENT, cb);
}

export function focusMenuSearch(): void {
  window.dispatchEvent(new Event(FOCUS_MENU_SEARCH_EVENT));
}
export function onFocusMenuSearch(cb: () => void): () => void {
  window.addEventListener(FOCUS_MENU_SEARCH_EVENT, cb);
  return () => window.removeEventListener(FOCUS_MENU_SEARCH_EVENT, cb);
}
