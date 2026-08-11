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

// Firebase's Web API Key/Project ID/App ID are exactly the same kind of
// "public identifier, not a secret" as the Supabase values above — see
// FIREBASE-SETUP-AR.md and the security note at the top of firestore.rules.
// Once a real Firebase project exists (console.firebase.google.com → follow
// FIREBASE-SETUP-AR.md), fill these 3 in — that's the only change needed
// before ACTIVE_DEFAULT_PROVIDER below can be set to 'firebase'.
export const DEFAULT_FIREBASE_API_KEY = '';
export const DEFAULT_FIREBASE_PROJECT_ID = '';
export const DEFAULT_FIREBASE_APP_ID = '';

// GitHub owner/repo/branch are NOT secrets (the actual write credential —
// GITHUB_TOKEN — lives server-side only, see api/github-sync.ts), so it's
// safe to bake these in too, same reasoning as the Supabase/Firebase values
// above. Every visitor's browser can know "where" to sync without ever
// knowing "how" (the token).
export const DEFAULT_GITHUB_OWNER = 'youssefmd2244-droid';
export const DEFAULT_GITHUB_REPO = 'mashhoor-';
export const DEFAULT_GITHUB_BRANCH = 'main';

// Which baked-in default a brand-new visitor (one who has never touched
// Settings → Storage) connects to automatically. Only ONE of these is ever
// "the" default at a time — see the long explanation in store.ts →
// getEffectiveStorageConfig for why this can't be "all three live at once"
// for a fresh visitor, and what switching this actually does/doesn't do:
//   - It's a code change + redeploy, not a runtime toggle — every visitor
//     picks up the new default only after the next deploy finishes.
//   - It does NOT migrate existing data between providers. Supabase,
//     Firebase and GitHub each keep their own separate copy of whatever
//     was written to them while they were active — switching back later
//     picks up exactly where that provider's own data was left off, not
//     where a *different* provider ended up.
//   - GitHub specifically also has no realtime push (~10s polling), unlike
//     Supabase/Firebase's instant subscriptions — expect a short delay for
//     updates to reach other devices while GitHub is the active default.
export const ACTIVE_DEFAULT_PROVIDER: 'supabase' | 'firebase' | 'github' = 'supabase';
