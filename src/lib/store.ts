import { idbGetAll, idbGet, idbPut, idbDelete, idbClear, dataBus, STORES, type StoreName } from './idb';

export type TrashableStore = Exclude<StoreName, 'settings' | 'trash'>;

// Subscribe to ANY local data change (own edits or a merge from a realtime
// cloud sync). Returns an unsubscribe function. Components use this to
// refresh themselves live, with no page reload — see MenuSection.tsx for an
// example.
export function onDataChange(cb: (store: StoreName) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail.store);
  dataBus.addEventListener('change', handler);
  return () => dataBus.removeEventListener('change', handler);
}

export interface TrashEntry {
  id: string; // trash entry id (same as original item id, prefixed by source store)
  sourceStore: TrashableStore;
  originalId: string;
  data: any;
  deletedAt: string; // ISO date
}

// ---------- generic CRUD (used by menu items, categories, orders, customers, media) ----------

export async function listItems<T = any>(store: TrashableStore): Promise<T[]> {
  return idbGetAll<T>(store);
}

export async function getItem<T = any>(store: TrashableStore, id: string): Promise<T | undefined> {
  return idbGet<T>(store, id);
}

export async function saveItem<T extends { id: string }>(store: TrashableStore, item: T): Promise<T> {
  return idbPut(store, item);
}

// Soft delete: item moves to the trash store, NOT permanently removed until
// the user explicitly empties the trash. Nothing is ever silently lost.
export async function softDeleteItem(store: TrashableStore, id: string): Promise<void> {
  const item = await idbGet(store, id);
  if (!item) return;
  const trashId = `${store}:${id}`;
  await idbPut('trash', {
    id: trashId,
    sourceStore: store,
    originalId: id,
    data: item,
    deletedAt: new Date().toISOString(),
  } satisfies TrashEntry);
  await idbDelete(store, id);
}

export async function listTrash(): Promise<TrashEntry[]> {
  const all = await idbGetAll<TrashEntry>('trash');
  return all.sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));
}

export async function restoreTrashEntry(trashId: string): Promise<void> {
  const entry = await idbGet<TrashEntry>('trash', trashId);
  if (!entry) return;
  await idbPut(entry.sourceStore, entry.data);
  await idbDelete('trash', trashId);
}

export async function restoreMany(trashIds: string[]): Promise<void> {
  for (const id of trashIds) await restoreTrashEntry(id);
}

export async function permanentlyDeleteTrashEntry(trashId: string): Promise<void> {
  await idbDelete('trash', trashId);
}

export async function permanentlyDeleteMany(trashIds: string[]): Promise<void> {
  for (const id of trashIds) await permanentlyDeleteTrashEntry(id);
}

export async function emptyTrash(): Promise<void> {
  await idbClear('trash');
}

// Wipe ALL site data (menu, categories, orders, customers, media) — requires
// explicit confirmation from the caller (the settings UI asks twice).
// Trash itself is untouched by default so a wipe can still be undone via trash,
// unless includeTrash is passed.
export async function wipeAllData(includeTrash = false): Promise<void> {
  const toWipe: StoreName[] = STORES.filter(
    (s) => s !== 'settings' && (includeTrash || s !== 'trash')
  ) as StoreName[];
  for (const store of toWipe) {
    await idbClear(store);
  }
}

// ---------- settings (key/value, always in the 'settings' store) ----------

export async function getSetting<T = any>(key: string, fallback: T): Promise<T> {
  const row = await idbGet<{ id: string; value: T }>('settings', key);
  return row ? row.value : fallback;
}

export async function setSetting<T = any>(key: string, value: T): Promise<void> {
  await idbPut('settings', { id: key, value });
}

// Settings keys that are safe AND useful to sync as shared "site content"
// across every device/browser (site texts, colors, fonts, payment config,
// hours, etc.). Deliberately an allowlist, not "sync everything in
// settings", because that store also holds things that must stay local
// only:
//   - settings.storageProvider / settings.providerCredentials — contain
//     secrets (e.g. a GitHub personal access token with repo write access).
//     Broadcasting these to every visitor's browser would leak them.
//   - settings.loginPassword — the admin password; no reason for it to sit
//     in every anonymous visitor's local storage.
//   - settings.languageMode / customer.myProfile — per-visitor preferences
//     / personal data (their own name+phone), never shared data.
export const SYNCED_SETTINGS_KEYS = [
  'settings.siteTexts',
  'settings.siteFont',
  'settings.siteTextCustomSlots',
  'settings.siteAssets',
  'settings.siteAssetCustomSlots',
  'settings.colorOverrides',
  'settings.iconCodeFlags',
  'settings.operatingHours',
  'settings.orderRules',
  'settings.paymentMethodsConfig.v2',
  'settings.paymentNumbers',
  'settings.paymentAccountNames',
  'settings.postPaymentMessage',
  'settings.whatsappNumbers',
  'settings.customLinks',
  'settings.qrUrl',
  'settings.qrTableCount',
  'settings.qrTablePrefix',
] as const;

// ---------- full snapshot (used by cloud sync adapters) ----------

export async function getFullSnapshot(): Promise<Record<string, any[]>> {
  const snapshot: Record<string, any[]> = {};
  const tables: TrashableStore[] = ['menuItems', 'categories', 'extras', 'orders', 'customers', 'media'];
  for (const t of tables) snapshot[t] = await idbGetAll(t);

  // Site content settings ride along in a 'settings' pseudo-table (same
  // {id, value} row shape idb already uses), so an edit anywhere in
  // Settings — texts, colors, fonts, hours, payment config — reaches every
  // other device/visitor the same way menu changes do.
  const settingsRows: { id: string; value: any }[] = [];
  for (const key of SYNCED_SETTINGS_KEYS) {
    const row = await idbGet<{ id: string; value: any }>('settings', key);
    if (row !== undefined) settingsRows.push(row);
  }
  snapshot.settings = settingsRows;
  return snapshot;
}

// Set while a snapshot pulled FROM the cloud is being written into local
// IndexedDB. autoSync.ts checks this before reacting to a 'change' event so
// remote → local merges don't immediately get pushed right back up (which
// would still be harmless/idempotent, but is pointless network traffic and
// would make the "syncing…" indicator flicker constantly on an active site).
let applyingRemoteDepth = 0;
export function isApplyingRemote(): boolean {
  return applyingRemoteDepth > 0;
}

export async function mergeSnapshot(snapshot: Record<string, any[]>): Promise<void> {
  applyingRemoteDepth++;
  try {
    for (const [store, rows] of Object.entries(snapshot)) {
      for (const row of rows) {
        if (!row || !row.id) continue;
        // Extra safety net: even if a remote snapshot somehow contains a
        // 'settings' row outside our sync allowlist (an old/hand-edited
        // GitHub JSON file, a future bug elsewhere), never let it
        // overwrite this device's own secrets/local-only settings
        // (provider credentials, admin password, per-visitor profile...).
        if (store === 'settings' && !(SYNCED_SETTINGS_KEYS as readonly string[]).includes(row.id)) continue;
        await idbPut(store as TrashableStore, row);
      }
    }
  } finally {
    applyingRemoteDepth--;
  }
}
