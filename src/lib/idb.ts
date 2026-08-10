// Minimal IndexedDB wrapper — no external dependency.
// This is the "local-first" storage engine: everything the admin does is saved
// here immediately (works with zero internet), and can later be mirrored to a
// cloud provider (Supabase / Firebase / GitHub) via src/lib/storageAdapters.ts

const DB_NAME = 'restaurant_site_db';
// Bumped 3 → 4 to add 'pollOptions', 'fastFoodProducts' and
// 'signatureFeatures' — the last hardcoded content blocks (قسم التصويت،
// كروت الفاست فود، مميزات "هويتنا العربية") moved into Settings so they're
// fully Add/Edit/Delete/Replace from the admin panel instead of living in
// the component source. Same additive upgrade path as before — nothing
// already saved gets touched.
const DB_VERSION = 4;

export const STORES = [
  'menuItems',
  'categories',
  'extras',
  'featuredOffers',
  'pollOptions',
  'fastFoodProducts',
  'signatureFeatures',
  'orders',
  'customers',
  'media',
  'settings',
  'trash',
] as const;

export type StoreName = (typeof STORES)[number];

// ---------------------------------------------------------------------------
// Tiny in-memory event bus. Every successful write (put/delete/clear) fires a
// 'change' event naming which store changed. This is what lets UI components
// refresh themselves automatically the instant data changes — whether the
// change came from this same tab (admin editing) or was just merged in from
// a realtime cloud subscription (see realtimeSync.ts) — with NO page reload.
//
// notifyChange is coalesced per store (short debounce below), NOT fired
// synchronously on every single write. Reason: a remote realtime update
// pulls and re-merges the ENTIRE snapshot (every menu item, category,
// extra... — see store.ts → mergeSnapshot), which can mean 50-200+
// individual idbPut calls in a row for one small remote edit. Since ~24
// components across the site listen for these events and each one reloads
// + re-renders on every single event, firing one raw event per row was
// flooding the main thread with a burst of redundant reloads — which is
// exactly what made the site feel like it "freezes" (stops responding to
// taps for a moment) right after any change synced in from another device.
// Collapsing that burst into one event per store fixes it at the source
// instead of touching all 24 listeners individually.
// ---------------------------------------------------------------------------
export const dataBus = new EventTarget();

const pendingStores = new Set<StoreName>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const COALESCE_MS = 80; // imperceptible delay, but collapses same-tick write bursts

function notifyChange(store: StoreName) {
  pendingStores.add(store);
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const stores = Array.from(pendingStores);
    pendingStores.clear();
    for (const s of stores) {
      dataBus.dispatchEvent(new CustomEvent('change', { detail: { store: s } }));
    }
  }, COALESCE_MS);
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db: IDBDatabase, store: StoreName, mode: IDBTransactionMode) {
  return db.transaction(store, mode).objectStore(store);
}

export async function idbGetAll<T = any>(store: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, store, 'readonly').getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet<T = any>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, store, 'readonly').get(id);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut<T extends { id: string }>(store: StoreName, value: T): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, store, 'readwrite').put(value);
    req.onsuccess = () => {
      notifyChange(store);
      resolve(value);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function idbDelete(store: StoreName, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, store, 'readwrite').delete(id);
    req.onsuccess = () => {
      notifyChange(store);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function idbClear(store: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, store, 'readwrite').clear();
    req.onsuccess = () => {
      notifyChange(store);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}
