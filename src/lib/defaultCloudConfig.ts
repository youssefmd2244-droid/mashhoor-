// The restaurant's cloud sync target, baked into the site itself.
//
// Why this exists: storage settings (which provider, URL, key) used to live
// ONLY in each browser's local IndexedDB (see store.ts → SYNCED_SETTINGS_KEYS
// comment — provider credentials are deliberately device-local, not synced,
// since some providers like GitHub carry a write token that must never be
// broadcast to every visitor).
//
// Supabase is different: the "anon" / "publishable" key is *meant* to be
// public — it's the same key every client-side app ships in its JS bundle,
// safety comes from Row Level Security policies on the database, not from
// hiding the key. So it's safe (and necessary) to bake it in here as the
// fallback every visitor's browser uses automatically, instead of requiring
// each customer to somehow "configure" storage themselves — which was the
// bug: only the admin's own browser (where these were typed into Settings)
// ever knew to talk to Supabase; every other visitor silently ran in
// local-only mode and never saw admin-added content.
//
// This is only ever used as a FALLBACK default. If Settings → Storage has
// an explicit provider/credentials saved locally (e.g. the admin switches
// to Firebase/GitHub, or points at a different Supabase project), that
// explicit choice always wins — see getEffectiveStorageConfig() in store.ts.
export const DEFAULT_SUPABASE_URL = 'https://bvgwdyuzyrrqpzpnhrxy.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Ga8zUAHWEnXTuQwXB3b6Qg_H5kJlCTc';
