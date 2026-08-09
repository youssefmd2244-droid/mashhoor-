import { getSetting, setSetting } from './store';

// A generic key→imageUrl override store for every image/icon on the site
// that isn't already covered by its own dedicated field (the logo lives in
// siteIdentity, payment-method icons live in payments.ts, etc). This is what
// powers Settings → الصور والأيقونات: a list of named "slots" the admin can
// upload into, PLUS the ability to add brand-new custom slots (e.g. a new
// decorative icon somewhere) and delete ones they no longer need — mirrors
// the siteTexts.ts pattern used for copy.
export interface SiteAssetSlot {
  key: string;
  labelAr: string;
  custom?: boolean; // true for admin-added slots (can be deleted); curated slots can only be reset
}

const ASSETS_KEY = 'settings.siteAssets'; // Record<key, dataUrlOrUrl>
const CUSTOM_SLOTS_KEY = 'settings.siteAssetCustomSlots'; // SiteAssetSlot[]

// The curated list of editable image/icon slots this project ships with.
// Empty by default — falls back to whatever the section already renders —
// until the admin uploads something here.
export const CURATED_ASSET_SLOTS: SiteAssetSlot[] = [
  { key: 'hero.background', labelAr: 'خلفية القسم الرئيسي (Hero)' },
  { key: 'hero.decorIcon', labelAr: 'أيقونة زخرفية جانب العنوان الرئيسي' },
  { key: 'app.storeBadgeIcon', labelAr: 'أيقونة قسم تحميل التطبيق' },
  { key: 'favicon', labelAr: 'أيقونة التبويب (Favicon)' },
  { key: 'signature.photo', labelAr: 'قسم "هويتنا العربية" — الصورة الرئيسية' },
  { key: 'app.recipePhoto', labelAr: 'قسم التطبيق — صورة الوصفة داخل شاشة الموبايل' },
];

export async function getAllSiteAssets(): Promise<Record<string, string>> {
  return getSetting<Record<string, string>>(ASSETS_KEY, {});
}

export async function setSiteAsset(key: string, url: string): Promise<void> {
  const all = await getAllSiteAssets();
  await setSetting(ASSETS_KEY, { ...all, [key]: url });
}

export async function resetSiteAsset(key: string): Promise<void> {
  const all = await getAllSiteAssets();
  delete all[key];
  await setSetting(ASSETS_KEY, all);
}

// Used by components at render time.
export async function getSiteAsset(key: string, fallbackUrl = ''): Promise<string> {
  const all = await getAllSiteAssets();
  return all[key] || fallbackUrl;
}

export async function getCustomAssetSlots(): Promise<SiteAssetSlot[]> {
  return getSetting<SiteAssetSlot[]>(CUSTOM_SLOTS_KEY, []);
}

export async function addCustomAssetSlot(labelAr: string): Promise<SiteAssetSlot> {
  const slots = await getCustomAssetSlots();
  const slot: SiteAssetSlot = { key: `custom.${crypto.randomUUID()}`, labelAr, custom: true };
  await setSetting(CUSTOM_SLOTS_KEY, [...slots, slot]);
  return slot;
}

export async function removeCustomAssetSlot(key: string): Promise<void> {
  const slots = await getCustomAssetSlots();
  await setSetting(CUSTOM_SLOTS_KEY, slots.filter((s) => s.key !== key));
  await resetSiteAsset(key);
}

export async function getAllAssetSlots(): Promise<SiteAssetSlot[]> {
  const custom = await getCustomAssetSlots();
  return [...CURATED_ASSET_SLOTS, ...custom];
}
