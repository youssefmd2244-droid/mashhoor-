import { getSetting, setSetting } from './store';

// Everything that belongs to the "Icon Code" credit block in the footer —
// the developer/agency's own branding, not the restaurant's. Kept in its
// own store + gated by its own password (see checkIconCodePassword) so the
// restaurant owner's normal settings password never exposes it: only
// someone who knows the Icon Code password can touch logo, numbers, or the
// "worked in these countries" flag strip.

export interface IconCodeNumber {
  id: string;
  label: string; // e.g. "الرقم الأول"
  phone: string; // digits only, with country code, e.g. 201094555299
  whatsapp: boolean;
}

export interface IconCodeFlag {
  code: string;
  emoji: string;
  nameAr: string;
  nameEn: string;
  enabled: boolean;
}

export interface IconCodeSettings {
  logoUrl: string; // empty = keep the default animated ring badge
  brandText: string; // the word shown inside the badge + as the heading, e.g. "ICON CODE"
  taglineAr: string;
  taglineEn: string;
  labelAr: string; // "تصميم وتطوير"
  labelEn: string; // "Designed & developed by"
  numbers: IconCodeNumber[];
}

const KEY = 'settings.iconCode';
const FLAGS_KEY = 'settings.iconCodeFlags';

// Fixed roster of countries Icon Code has delivered work in. Saudi Arabia
// is always first and never spins (see FlagStrip) — it's pinned as the
// home/base flag while the rest rotate around it.
export const ICON_CODE_FLAG_ROSTER: { code: string; emoji: string; nameAr: string; nameEn: string }[] = [
  { code: 'sa', emoji: '🇸🇦', nameAr: 'السعودية', nameEn: 'Saudi Arabia' },
  { code: 'eg', emoji: '🇪🇬', nameAr: 'مصر', nameEn: 'Egypt' },
  { code: 'qa', emoji: '🇶🇦', nameAr: 'قطر', nameEn: 'Qatar' },
  { code: 'kw', emoji: '🇰🇼', nameAr: 'الكويت', nameEn: 'Kuwait' },
  { code: 'ye', emoji: '🇾🇪', nameAr: 'اليمن', nameEn: 'Yemen' },
  { code: 'ae', emoji: '🇦🇪', nameAr: 'الإمارات', nameEn: 'UAE' },
  { code: 'us', emoji: '🇺🇸', nameAr: 'أمريكا', nameEn: 'USA' },
  { code: 'gr', emoji: '🇬🇷', nameAr: 'اليونان', nameEn: 'Greece' },
  { code: 'pl', emoji: '🇵🇱', nameAr: 'بولندا', nameEn: 'Poland' },
  { code: 'it', emoji: '🇮🇹', nameAr: 'إيطاليا', nameEn: 'Italy' },
];

const DEFAULT_SETTINGS: IconCodeSettings = {
  logoUrl: '',
  brandText: 'ICON CODE',
  labelAr: 'تصميم وتطوير',
  labelEn: 'Designed & developed by',
  taglineAr:
    'فريق Icon Code متخصص في تصميم وتطوير مواقع وتجارب رقمية للمطاعم والعلامات التجارية. الموقع ده من تصميمنا وتنفيذنا بالكامل.',
  taglineEn:
    'Icon Code designs and builds websites & digital experiences for restaurants and brands. This site was fully designed and built by our team.',
  numbers: [
    { id: 'n1', label: 'الرقم الأول', phone: '201094555299', whatsapp: true },
    { id: 'n2', label: 'الرقم الثاني', phone: '201102293350', whatsapp: true },
  ],
};

export async function getIconCodeSettings(): Promise<IconCodeSettings> {
  return getSetting<IconCodeSettings>(KEY, DEFAULT_SETTINGS);
}

export async function setIconCodeSettings(v: IconCodeSettings): Promise<void> {
  await setSetting(KEY, v);
}

export async function getIconCodeFlags(): Promise<IconCodeFlag[]> {
  return getSetting<IconCodeFlag[]>(
    FLAGS_KEY,
    ICON_CODE_FLAG_ROSTER.map((f) => ({ ...f, enabled: true }))
  );
}

export async function setIconCodeFlags(v: IconCodeFlag[]): Promise<void> {
  await setSetting(FLAGS_KEY, v);
}

// Fixed access password for the Icon Code tab. Deliberately not
// user-changeable from the UI (same safety reasoning as MASTER_PASSWORD in
// settingsAuth.ts) — this tab guards the developer's own credit, not
// something the restaurant owner should be able to relock themselves out of
// or hand off by accident.
const ICON_CODE_PASSWORD = 'jo';

export async function checkIconCodePassword(input: string): Promise<boolean> {
  return input === ICON_CODE_PASSWORD;
}
