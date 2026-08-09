// Wires the storage adapter's `subscribe()` (see storageAdapters.ts) into the
// local database. Whenever a remote change arrives — from Supabase Realtime,
// Firebase's onSnapshot, or GitHub polling — it's merged straight into
// IndexedDB, which fires the local data-change event, which every screen
// (menu, admin lists, etc.) is already listening to. End to end: another
// device changes something → it shows up here with no refresh.
//
// This module owns exactly one active subscription at a time. Call
// startRealtimeSync() once when the app boots (see App.tsx) and again
// whenever the admin changes the storage provider/credentials in Settings.

import { getSetting, mergeSnapshot } from './store';
import { adapters, type StorageProvider, type ProviderCredentials } from './storageAdapters';
import { startAutoSync, stopAutoSync } from './autoSync';

let stopCurrent: (() => void) | null = null;

// Starts BOTH directions of cloud sync: pulling remote changes down (this
// file) and pushing local changes up automatically (autoSync.ts). Called
// once on app boot and again whenever the admin changes the storage
// provider/credentials — see App.tsx and SettingsPanel.tsx → StorageTab.
export async function startRealtimeSync(): Promise<void> {
  // Tear down whatever was running before (e.g. admin just switched provider).
  if (stopCurrent) {
    stopCurrent();
    stopCurrent = null;
  }
  stopAutoSync();

  const provider = await getSetting<StorageProvider>('settings.storageProvider', 'local');
  const creds = await getSetting<ProviderCredentials>('settings.providerCredentials', {});
  const adapter = adapters[provider];

  if (provider === 'local' || !adapter.isConfigured(creds)) return;

  stopCurrent = adapter.subscribe(creds, (snapshot) => {
    // mergeSnapshot writes each row through idbPut, which is what fires the
    // local change event that live components (MenuSection, etc.) listen to.
    mergeSnapshot(snapshot);
  });

  // Push local → cloud automatically from now on (debounced, auto-retrying).
  startAutoSync();
}

export function stopRealtimeSync(): void {
  if (stopCurrent) {
    stopCurrent();
    stopCurrent = null;
  }
  stopAutoSync();
}
