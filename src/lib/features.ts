import { getSetting, setSetting } from './store';

// Central on/off switches for the newer ordering features. Everything here
// defaults to OFF (except the confirmation screen) so existing sites keep
// behaving exactly as before until the admin turns something on from
// Settings → المميزات.
export interface FeatureSettings {
  tableNumberEnabled: boolean; // ask for a table/room number at checkout
  tableNumberRequired: boolean; // block checkout without it, when enabled
  tableNumberLabelAr: string; // e.g. "رقم الترابيزة" for a restaurant, "رقم الأوضة" for a hotel
  tableNumberLabelEn: string;
  dineInEnabled: boolean; // adds "تناول في المكان" as a third option next to delivery/pickup
  orderConfirmationEnabled: boolean; // show an on-site "order received" screen after sending
}

const KEY = 'settings.features';

const DEFAULTS: FeatureSettings = {
  tableNumberEnabled: false,
  tableNumberRequired: false,
  tableNumberLabelAr: 'رقم الترابيزة / الأوضة',
  tableNumberLabelEn: 'Table / Room number',
  dineInEnabled: false,
  orderConfirmationEnabled: true,
};

export async function getFeatureSettings(): Promise<FeatureSettings> {
  const v = await getSetting<Partial<FeatureSettings>>(KEY, DEFAULTS);
  return { ...DEFAULTS, ...v };
}

export async function setFeatureSettings(v: FeatureSettings): Promise<void> {
  await setSetting(KEY, v);
}

// Reads the table/room number from the URL the QR code opened
// (?table=12 or ?room=204), so a customer scanning a per-table QR never has
// to type it manually — it's just pre-filled and can still be edited.
export function tableNumberFromUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('table') || params.get('room') || '';
  } catch {
    return '';
  }
}
