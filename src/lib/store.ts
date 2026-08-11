import { idbGetAll, idbGet, idbPut, idbDelete, idbClear, dataBus, STORES, type StoreName } from './idb';
import type { StorageProvider, ProviderCredentials } from './storageAdapters';
import {
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_FIREBASE_API_KEY,
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_FIREBASE_APP_ID,
  DEFAULT_GITHUB_OWNER,
  DEFAULT_GITHUB_REPO,
  DEFAULT_GITHUB_BRANCH,
  ACTIVE_DEFAULT_PROVIDER,
} from './defaultCloudConfig';

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

// Resolves which cloud provider + credentials this device should actually
// sync with. `null` fallbacks below (instead of e.g. 'local'/{}) let us tell
// "this browser never touched Settings → Storage" apart from "the admin
// explicitly chose محلي فقط (local only)" — only the latter should really
// mean no cloud sync.
//
// Without this, only the ONE browser where an admin manually pasted the
// Supabase URL/key ever knew to sync — every other visitor (every customer,
// on every other device) silently ran in local-only mode forever and never
// saw anything added/edited, since provider credentials are deliberately
// device-local settings, never broadcast to other browsers (see
// SYNCED_SETTINGS_KEYS below). Falling back to the restaurant's own
// Supabase project — safe to bake in, since Supabase's anon/publishable key
// is meant to be public — means every visitor's browser syncs automatically
// with zero setup, while an admin's deliberate choice (a different
// provider, or explicitly "local only") still always wins.
export async function getEffectiveStorageConfig(): Promise<{
  provider: StorageProvider;
  creds: ProviderCredentials;
}> {
  const storedProvider = await getSetting<StorageProvider | null>('settings.storageProvider', null as any);
  const storedCreds = await getSetting<ProviderCredentials | null>('settings.providerCredentials', null as any);
  if (storedProvider !== null) {
    return { provider: storedProvider, creds: storedCreds ?? {} };
  }
  // Never configured on this device — fall back to whichever provider is
  // currently baked in as the site-wide default (see defaultCloudConfig.ts).
  if (ACTIVE_DEFAULT_PROVIDER === 'firebase' && DEFAULT_FIREBASE_PROJECT_ID && DEFAULT_FIREBASE_API_KEY) {
    return {
      provider: 'firebase',
      creds: {
        firebase: {
          apiKey: DEFAULT_FIREBASE_API_KEY,
          projectId: DEFAULT_FIREBASE_PROJECT_ID,
          appId: DEFAULT_FIREBASE_APP_ID,
        },
      },
    };
  }
  if (ACTIVE_DEFAULT_PROVIDER === 'github' && DEFAULT_GITHUB_OWNER && DEFAULT_GITHUB_REPO) {
    return {
      provider: 'github',
      creds: {
        github: {
          owner: DEFAULT_GITHUB_OWNER,
          repo: DEFAULT_GITHUB_REPO,
          branch: DEFAULT_GITHUB_BRANCH,
        },
      },
    };
  }
  return {
    provider: 'supabase',
    creds: { supabase: { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY } },
  };
}

// Every provider that's fully set up (baked-in defaults with real values —
// see defaultCloudConfig.ts — filled in as each one gets configured), not
// just whichever ONE is currently ACTIVE_DEFAULT_PROVIDER for reads.
//
// Why this exists: "switching" which provider is active only changes which
// one new visitors PULL live updates from — it says nothing about whether
// the other two keep receiving PUSHES. Without this, the two inactive
// providers would freeze at whatever data they last had the moment they
// stopped being active, so switching back to one later would show stale/old
// content instead of everything that happened while it was inactive.
// autoSync.ts calls this to push every local change to ALL of these in
// parallel, so all three stay fully caught up all the time — switching
// ACTIVE_DEFAULT_PROVIDER later (a code change + redeploy) then just means
// "start reading live updates from this one instead", with its data
// already current, not "start from scratch".
//
// An explicit device-level override (Settings → Storage on THIS browser)
// still always wins and is used as the single target instead — that's a
// deliberate admin choice for that one device, not something to silently
// broaden back out to all three.
export async function getAllSyncTargets(): Promise<Array<{ provider: StorageProvider; creds: ProviderCredentials }>> {
  const storedProvider = await getSetting<StorageProvider | null>('settings.storageProvider', null as any);
  if (storedProvider !== null) {
    if (storedProvider === 'local') return [];
    const storedCreds = await getSetting<ProviderCredentials | null>('settings.providerCredentials', null as any);
    return [{ provider: storedProvider, creds: storedCreds ?? {} }];
  }
  const targets: Array<{ provider: StorageProvider; creds: ProviderCredentials }> = [
    { provider: 'supabase', creds: { supabase: { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY } } },
  ];
  if (DEFAULT_GITHUB_OWNER && DEFAULT_GITHUB_REPO) {
    targets.push({
      provider: 'github',
      creds: { github: { owner: DEFAULT_GITHUB_OWNER, repo: DEFAULT_GITHUB_REPO, branch: DEFAULT_GITHUB_BRANCH } },
    });
  }
  if (DEFAULT_FIREBASE_PROJECT_ID && DEFAULT_FIREBASE_API_KEY) {
    targets.push({
      provider: 'firebase',
      creds: {
        firebase: { apiKey: DEFAULT_FIREBASE_API_KEY, projectId: DEFAULT_FIREBASE_PROJECT_ID, appId: DEFAULT_FIREBASE_APP_ID },
      },
    });
  }
  return targets;
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
        // Skip the write entirely when the row is byte-for-byte identical to
        // what's already stored locally. A remote pull re-sends the WHOLE
        // table on every change anywhere in it, so most rows in most pulls
        // are unchanged — writing (and notifying listeners about) all of
        // them anyway was pure wasted work on every single sync.
        const existing = await idbGet(store as TrashableStore, row.id);
        if (existing !== undefined && JSON.stringify(existing) === JSON.stringify(row)) continue;
        await idbPut(store as TrashableStore, row);
      }
    }
  } finally {
    applyingRemoteDepth--;
  }
}
