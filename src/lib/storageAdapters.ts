// Storage provider abstraction.
//
// IMPORTANT DESIGN DECISION: the local IndexedDB (see idb.ts / store.ts) is
// ALWAYS the source of truth and is never cleared when you switch providers.
// Choosing Supabase / Firebase / GitHub here only turns on a background sync
// that mirrors your local data up to that provider (and pulls remote changes
// down). If you switch back to "Local only" or between providers, nothing on
// this device is deleted — only the sync target changes.
//
// To activate a provider you must supply credentials in Settings → Storage.
// Until credentials are supplied, the adapter simply no-ops and the site
// keeps working 100% offline from local storage.

export type StorageProvider = 'local' | 'supabase' | 'firebase' | 'github';

export interface ProviderCredentials {
  supabase?: { url: string; anonKey: string };
  firebase?: { apiKey: string; projectId: string; appId: string; storageBucket?: string };
  github?: { owner: string; repo: string; branch: string; token: string };
}

export interface SyncAdapter {
  isConfigured(creds: ProviderCredentials): boolean;
  // Push a full snapshot of local data to the remote provider.
  push(snapshot: Record<string, any[]>, creds: ProviderCredentials): Promise<void>;
  // Pull remote data down (merged into local by the caller, never overwriting
  // local-only unsynced changes).
  pull(creds: ProviderCredentials): Promise<Record<string, any[]> | null>;
  // Start listening for changes made elsewhere (another device/admin) and
  // call onRemoteSnapshot with a fresh pull as soon as they happen, so the
  // caller can merge them locally with NO page reload. Returns a function
  // that stops listening. Supabase/Firebase do this with a real push
  // connection (near-instant). GitHub has no such mechanism at all — the
  // best it can do is poll periodically (see githubAdapter below), which is
  // NOT instant, just "checks every few seconds".
  subscribe(creds: ProviderCredentials, onRemoteSnapshot: (snapshot: Record<string, any[]>) => void): () => void;
}

const TABLES = ['menuItems', 'categories', 'extras', 'orders', 'customers', 'media', 'settings'] as const;

// Postgres folds unquoted identifiers to lowercase, so a table created via
// plain SQL as "menuItems" actually ends up named "menuitems" in the
// database. PostgREST is case-sensitive about the path segment it receives,
// so requesting /rest/v1/menuItems 404s even though the table exists. This
// maps our local (camelCase) table/collection names to the exact name to use
// when talking to Supabase's REST API, without touching the local IndexedDB
// naming used everywhere else in the app.
const SUPABASE_TABLE_OVERRIDES: Partial<Record<(typeof TABLES)[number], string>> = {
  menuItems: 'menuitems',
};
function toSupabaseTable(name: string): string {
  return SUPABASE_TABLE_OVERRIDES[name as (typeof TABLES)[number]] ?? name;
}

// A push/pull that just hangs (bad wifi, a dead endpoint) is worse than one
// that fails fast — a hung request never lets the caller know something's
// wrong and never triggers a retry. Every network call in this file goes
// through this helper so a stuck request always resolves (as a timeout
// error) within 20s instead of freezing the sync indicator forever.
async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 20_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error(`انتهت مهلة الاتصال (${Math.round(timeoutMs / 1000)} ث) — تأكد من الإنترنت`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const localAdapter: SyncAdapter = {
  isConfigured: () => true,
  async push() {
    /* local provider = no remote push, data already lives in IndexedDB */
  },
  async pull() {
    return null;
  },
  subscribe() {
    return () => {};
  },
};

const supabaseAdapter: SyncAdapter = {
  isConfigured: (c) => !!c.supabase?.url && !!c.supabase?.anonKey,
  async push(snapshot, creds) {
    const { url, anonKey } = creds.supabase!;
    for (const [table, rows] of Object.entries(snapshot)) {
      if (!rows.length) continue;
      // Every cloud table has the same generic shape — id (text) + data
      // (jsonb) — so a full local record (however deeply nested — sizes,
      // gallery, order lines, etc.) is stored as-is inside `data` instead of
      // needing one Postgres column per field.
      const payload = rows.map((row: any) => ({
        id: String(row.id),
        data: row,
        updated_at: new Date().toISOString(),
      }));
      const res = await fetchWithTimeout(`${url}/rest/v1/${toSupabaseTable(table)}`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });
      // A failed request here (bad key, missing table, RLS blocking the
      // write, etc.) must NOT be treated as a successful sync — silently
      // swallowing this used to make the "sync now" button say ✅ even when
      // nothing actually reached Supabase.
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`فشل الحفظ على Supabase (${table}): ${res.status} ${detail}`.slice(0, 300));
      }
    }
  },
  async pull(creds) {
    const { url, anonKey } = creds.supabase!;
    const result: Record<string, any[]> = {};
    for (const table of TABLES) {
      const res = await fetchWithTimeout(`${url}/rest/v1/${toSupabaseTable(table)}?select=id,data`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      if (res.ok) {
        const rows: Array<{ id: string; data: any }> = await res.json();
        // Unwrap: the caller only ever wants the original local records back,
        // not the id/data/updated_at wrapper used on the Supabase side.
        result[table] = rows.map((r) => r.data);
      }
    }
    return result;
  },
  // Real push-based realtime over WebSocket (Supabase Realtime / Postgres
  // Changes) — updates land in every open browser within a fraction of a
  // second of the change happening, no polling and no refresh needed.
  subscribe(creds, onRemoteSnapshot) {
    let cancelled = false;
    let unsubscribeFns: Array<() => void> = [];
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      // Debounce: a single admin save can touch a row + related rows in
      // quick succession, so we wait a beat and pull once instead of once
      // per event.
      debounceTimer = setTimeout(async () => {
        const snapshot = await supabaseAdapter.pull(creds);
        if (snapshot && !cancelled) onRemoteSnapshot(snapshot);
      }, 400);
    };

    (async () => {
      const { url, anonKey } = creds.supabase!;
      const { createClient } = await import('@supabase/supabase-js');
      if (cancelled) return;
      const client = createClient(url, anonKey);
      const channel = client.channel('site-data-realtime');
      for (const table of TABLES) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table: toSupabaseTable(table) }, scheduleRefresh);
      }
      channel.subscribe();
      unsubscribeFns.push(() => {
        client.removeChannel(channel);
      });
    })();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribeFns.forEach((fn) => fn());
    };
  },
};

const firebaseAdapter: SyncAdapter = {
  isConfigured: (c) => !!c.firebase?.projectId && !!c.firebase?.apiKey,
  async push(snapshot, creds) {
    const { projectId, apiKey } = creds.firebase!;
    for (const [collection, rows] of Object.entries(snapshot)) {
      for (const row of rows) {
        const res = await fetchWithTimeout(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${row.id}?key=${apiKey}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: toFirestoreFields(row) }),
          }
        );
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(`فشل الحفظ على Firebase (${collection}/${row.id}): ${res.status} ${detail}`.slice(0, 300));
        }
      }
    }
  },
  async pull(creds) {
    const { projectId, apiKey } = creds.firebase!;
    const result: Record<string, any[]> = {};
    for (const collection of TABLES) {
      const rows: any[] = [];
      let pageToken: string | undefined;
      try {
        do {
          const params = new URLSearchParams({ key: apiKey, pageSize: '300' });
          if (pageToken) params.set('pageToken', pageToken);
          const res = await fetchWithTimeout(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?${params.toString()}`
          );
          if (!res.ok) break;
          const json = await res.json();
          for (const doc of json.documents ?? []) {
            const id = doc.name?.split('/').pop();
            if (!id) continue;
            rows.push({ id, ...fromFirestoreFields(doc.fields ?? {}) });
          }
          pageToken = json.nextPageToken;
        } while (pageToken);
      } catch {
        // Network hiccup on this collection — keep whatever we already
        // gathered for it and move on to the next one instead of failing
        // the whole pull.
      }
      result[collection] = rows;
    }
    return result;
  },
  // Real push-based realtime via Firestore's onSnapshot listeners — same
  // near-instant, no-refresh behavior as the Supabase adapter above.
  subscribe(creds, onRemoteSnapshot) {
    let cancelled = false;
    let unsubscribeFns: Array<() => void> = [];
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const snapshot = await firebaseAdapter.pull(creds);
        if (snapshot && !cancelled) onRemoteSnapshot(snapshot);
      }, 400);
    };

    (async () => {
      const { apiKey, projectId, appId } = creds.firebase!;
      const { initializeApp } = await import('firebase/app');
      const { getFirestore, collection, onSnapshot } = await import('firebase/firestore');
      if (cancelled) return;
      const app = initializeApp({ apiKey, projectId, appId });
      const db = getFirestore(app);
      for (const table of TABLES) {
        const unsub = onSnapshot(collection(db, table), scheduleRefresh, () => {
          /* listener error (e.g. offline) — ignore, next reconnect resumes it */
        });
        unsubscribeFns.push(unsub);
      }
    })();

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribeFns.forEach((fn) => fn());
    };
  },
};

const githubAdapter: SyncAdapter = {
  isConfigured: (c) => !!c.github?.owner && !!c.github?.repo && !!c.github?.token,
  async push(snapshot, creds) {
    const { owner, repo, branch, token } = creds.github!;
    const path = 'data/site-data.json';
    const api = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    let sha: string | undefined;
    const existing = await fetchWithTimeout(`${api}?ref=${branch}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (existing.ok) sha = (await existing.json()).sha;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(snapshot, null, 2))));
    // Retry once on a 409 (sha conflict — another push landed between our
    // GET above and this PUT, e.g. two admins/devices saving seconds apart)
    // by re-fetching the latest sha and trying again, instead of just
    // failing the whole sync over a race that resolves itself a moment later.
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetchWithTimeout(api, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `chore: sync site data ${new Date().toISOString()}`,
          content,
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
      if (res.ok) return;
      if (res.status === 409 && attempt === 0) {
        const retry = await fetchWithTimeout(`${api}?ref=${branch}`, { headers: { Authorization: `Bearer ${token}` } });
        if (retry.ok) sha = (await retry.json()).sha;
        continue;
      }
      const detail = await res.text().catch(() => '');
      throw new Error(`فشل الحفظ على GitHub: ${res.status} ${detail}`.slice(0, 300));
    }
  },
  async pull(creds) {
    const { owner, repo, branch, token } = creds.github!;
    const path = 'data/site-data.json';
    const res = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const decoded = decodeURIComponent(escape(atob(json.content)));
    return JSON.parse(decoded);
  },
  // GitHub has NO realtime/push mechanism for a static repo file — this is
  // the honest limitation mentioned in Settings → Storage. The closest we
  // can get is polling: check every ~10s whether the file's ETag changed,
  // and only pull+refresh when it actually did. Conditional requests that
  // come back "304 Not Modified" don't count against GitHub's API rate
  // limit, so this is safe to leave running, but it is genuinely NOT
  // instant — expect a few seconds of delay, not "the same second".
  subscribe(creds, onRemoteSnapshot) {
    const { owner, repo, branch, token } = creds.github!;
    const path = 'data/site-data.json';
    const api = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    let etag: string | null = null;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetchWithTimeout(
          api,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(etag ? { 'If-None-Match': etag } : {}),
            },
          },
          8_000
        );
        if (res.status === 304) return; // nothing changed since last check
        if (!res.ok) return;
        etag = res.headers.get('etag');
        const json = await res.json();
        const decoded = decodeURIComponent(escape(atob(json.content)));
        if (!cancelled) onRemoteSnapshot(JSON.parse(decoded));
      } catch {
        // offline / rate-limited this round — try again next tick
      }
    }

    poll();
    const interval = setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  },
};

// Recursively converts a plain JS value into a Firestore REST API "Value"
// object. The old version only handled flat number/boolean/string fields —
// fine for simple menu-item rows, but our synced settings rows carry
// nested objects (e.g. settings.siteTexts is a map of many {ar, en,
// color} objects) and arrays (extras lists, etc). Without real
// mapValue/arrayValue support those would silently collapse into the
// literal string "[object Object]" once round-tripped through Firebase.
function toFirestoreValue(v: any): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'number') return { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === 'object') return { mapValue: { fields: toFirestoreFields(v) } };
  return { stringValue: String(v) };
}

function toFirestoreFields(row: Record<string, any>) {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

// Reverse of toFirestoreValue/toFirestoreFields — turns a Firestore REST
// document's `fields` object back into a plain JS value/object with the
// original types, including nested maps and arrays.
function fromFirestoreValue(v: any): any {
  if (v == null) return null;
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('integerValue' in v) return Number(v.integerValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('stringValue' in v) return v.stringValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fromFirestoreValue);
  if ('mapValue' in v) return fromFirestoreFields(v.mapValue.fields ?? {});
  return v.stringValue ?? null;
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields ?? {})) {
    out[k] = fromFirestoreValue(v);
  }
  return out;
}

export const adapters: Record<StorageProvider, SyncAdapter> = {
  local: localAdapter,
  supabase: supabaseAdapter,
  firebase: firebaseAdapter,
  github: githubAdapter,
};
