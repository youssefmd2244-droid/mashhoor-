// Automatic background sync: pushes local changes up to whichever cloud
// provider is configured (Supabase / Firebase / GitHub) WITHOUT the admin
// having to remember to press "مزامنة الآن" every time. This is what makes
// storage feel "دايمًا شغال" (always working) instead of "works only if you
// remember to click sync".
//
// Design:
//  - Every local write (see idb.ts → dataBus) schedules a debounced push.
//  - Writes that came FROM a remote pull/subscribe are ignored (see
//    store.ts → isApplyingRemote) so we don't immediately push the same
//    data straight back up.
//  - A failed push retries automatically with exponential backoff (up to 5
//    tries), and also retries the moment the browser regains connectivity —
//    so a spotty connection recovers on its own instead of silently going
//    stale.
//  - Nothing here ever touches or clears local data — a push failure just
//    means the cloud copy is temporarily behind; the local copy (source of
//    truth) is untouched and the site keeps working normally offline.

import { onDataChange, getFullSnapshot, getSetting, setSetting, isApplyingRemote, getAllSyncTargets } from './store';
import { adapters, type StorageProvider } from './storageAdapters';

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'ok' | 'error';
  message?: string;
  lastSyncedAt?: string;
}

let currentStatus: SyncStatus = { state: 'idle' };
const listeners = new Set<(s: SyncStatus) => void>();

function setStatus(patch: Partial<SyncStatus>) {
  currentStatus = { ...currentStatus, ...patch };
  listeners.forEach((l) => l(currentStatus));
}

export function onSyncStatusChange(cb: (s: SyncStatus) => void): () => void {
  listeners.add(cb);
  cb(currentStatus);
  return () => listeners.delete(cb);
}

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

let unsubscribeDataChange: (() => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;
let pushAgainAfter = false;
let onlineHandlerAttached = false;

const PROVIDER_LABEL: Record<StorageProvider, string> = {
  local: 'محلي',
  supabase: 'Supabase',
  firebase: 'Firebase',
  github: 'GitHub',
};

// Pushes to EVERY fully-configured provider in parallel (see store.ts →
// getAllSyncTargets), not just whichever one is "active" for reads — so all
// of them stay caught up all the time, and switching which one is active
// later never means the others start from stale/old data. Re-pushing to a
// target that already has the latest data (e.g. because only one of three
// targets failed last round) is a harmless no-op — every adapter's push()
// is an upsert — so simply retrying the whole batch on any failure is safe
// and much simpler than tracking per-provider retry state.
async function pushNow(attempt = 1): Promise<void> {
  const targets = await getAllSyncTargets();
  const configured = targets.filter((t) => adapters[t.provider].isConfigured(t.creds));
  if (configured.length === 0) {
    setStatus({ state: 'idle', message: undefined });
    return;
  }

  if (pushing) {
    // A change landed while a push was already in flight — don't run two
    // pushes at once, just remember to run one more right after this one.
    pushAgainAfter = true;
    return;
  }

  pushing = true;
  setStatus({ state: 'syncing', message: undefined });
  try {
    const snapshot = await getFullSnapshot();
    const results = await Promise.allSettled(configured.map((t) => adapters[t.provider].push(snapshot, t.creds)));
    const failed = configured.filter((_, i) => results[i].status === 'rejected');

    if (failed.length === 0) {
      const ts = new Date().toISOString();
      await setSetting('settings.lastSyncedAt', ts);
      setStatus({ state: 'ok', lastSyncedAt: ts, message: undefined });
      return;
    }

    // At least one target is behind. If SOME succeeded, the data is safely
    // stored in at least one place already — say so plainly instead of
    // showing a scary "failed" state — while still retrying for the rest.
    const names = failed.map((f) => PROVIDER_LABEL[f.provider]).join('، ');
    const partialOk = failed.length < configured.length;
    const nextAttempt = attempt + 1;
    if (nextAttempt <= 5) {
      const delaySec = Math.min(30, 2 ** attempt);
      setStatus({
        state: partialOk ? 'ok' : 'error',
        ...(partialOk ? { lastSyncedAt: new Date().toISOString() } : {}),
        message: `${partialOk ? 'اتحفظ' : 'فشلت المزامنة'} — لسه مستنيين: ${names}. هتتم إعادة المحاولة خلال ${delaySec} ث`,
      });
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => pushNow(nextAttempt), delaySec * 1000);
    } else {
      setStatus({
        state: partialOk ? 'ok' : 'error',
        ...(partialOk ? { lastSyncedAt: new Date().toISOString() } : {}),
        message: `فشلت المزامنة مع: ${names} بعد عدة محاولات. البيانات محفوظة بأمان على الجهاز وهتتزامن تلقائيًا أول ما ترجع.`,
      });
    }
  } catch (e: any) {
    // getFullSnapshot() itself threw (shouldn't normally happen — local
    // read, not network) — treat like a full failure of this round.
    const nextAttempt = attempt + 1;
    if (nextAttempt <= 5) {
      const delaySec = Math.min(30, 2 ** attempt);
      setStatus({
        state: 'error',
        message: `${e?.message || 'فشلت المزامنة'} — هتتم إعادة المحاولة تلقائيًا خلال ${delaySec} ث`,
      });
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => pushNow(nextAttempt), delaySec * 1000);
    } else {
      setStatus({
        state: 'error',
        message: 'فشلت المزامنة بعد عدة محاولات. البيانات محفوظة بأمان على الجهاز وهتتزامن تلقائيًا أول ما الاتصال يرجع.',
      });
    }
  } finally {
    pushing = false;
    if (pushAgainAfter) {
      pushAgainAfter = false;
      schedulePush();
    }
  }
}

function schedulePush() {
  if (debounceTimer) clearTimeout(debounceTimer);
  // Debounced: several admin edits in a row (e.g. re-ordering 6 menu items)
  // collapse into a single push instead of one per row.
  debounceTimer = setTimeout(() => pushNow(1), 1500);
}

export function startAutoSync(): void {
  stopAutoSync();
  unsubscribeDataChange = onDataChange((store) => {
    if (isApplyingRemote()) return; // this change came FROM the cloud, don't bounce it back up
    if (store === 'trash') return; // local housekeeping only, never synced
    schedulePush();
  });
  if (!onlineHandlerAttached && typeof window !== 'undefined') {
    onlineHandlerAttached = true;
    window.addEventListener('online', () => schedulePush());
  }
  // Also push once on start, so switching provider or restarting the app
  // with unsynced local changes doesn't wait for the next edit.
  schedulePush();
}

export function stopAutoSync(): void {
  if (unsubscribeDataChange) {
    unsubscribeDataChange();
    unsubscribeDataChange = null;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  if (retryTimer) clearTimeout(retryTimer);
}
