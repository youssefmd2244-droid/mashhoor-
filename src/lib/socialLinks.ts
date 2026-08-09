import { getSetting, setSetting } from './store';

// Recognized platforms get a matching icon in the UI (see socialIcons in
// Footer.tsx / SettingsPanel.tsx). 'custom' is for anything else (Telegram,
// Snapchat, a personal website, etc.) and just shows a generic link icon.
export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'x' | 'location' | 'custom';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string; // shown as the button/link title, fully editable
  url: string;
  enabled: boolean; // toggle to hide without deleting
}

const KEY = 'settings.socialLinks';

// Ship with the requested platforms pre-listed (so the admin only has to
// paste a URL and flip it on) but disabled and empty until a real link is
// entered — nothing shows up on the live site until the admin fills it in.
const DEFAULT_LINKS: SocialLink[] = [
  { id: 'facebook', platform: 'facebook', label: 'فيسبوك', url: '', enabled: false },
  { id: 'instagram', platform: 'instagram', label: 'انستقرام', url: '', enabled: false },
  { id: 'tiktok', platform: 'tiktok', label: 'تيك توك', url: '', enabled: false },
  { id: 'x', platform: 'x', label: 'إكس (تويتر)', url: '', enabled: false },
  { id: 'location', platform: 'location', label: 'موقعنا على الخريطة', url: '', enabled: false },
];

export async function getSocialLinks(): Promise<SocialLink[]> {
  const v = await getSetting<SocialLink[]>(KEY, DEFAULT_LINKS);
  return Array.isArray(v) ? v : DEFAULT_LINKS;
}

export async function setSocialLinks(v: SocialLink[]): Promise<void> {
  await setSetting(KEY, v);
}

// Only links that are turned on AND actually have a URL should ever render
// on the public site — this is the single shared filter both Footer.tsx and
// any other place that shows these links should use, so the rule can't
// drift between call sites.
export function visibleSocialLinks(links: SocialLink[]): SocialLink[] {
  return links.filter((l) => l.enabled && l.url.trim().length > 0);
}
