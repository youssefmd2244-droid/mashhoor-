import { getSetting, setSetting } from './store';

export interface CurrencySettings {
  code: string; // e.g. "EGP"
  symbolAr: string; // e.g. "ج.م"
  symbolEn: string; // e.g. "EGP"
}

// Common presets for the markets ICON Code builds for (Egypt, Saudi, UAE,
// Gulf, Greece/EU). The admin can also type a fully custom symbol.
export const CURRENCY_PRESETS: CurrencySettings[] = [
  { code: 'EGP', symbolAr: 'ج.م', symbolEn: 'EGP' },
  { code: 'SAR', symbolAr: 'ر.س', symbolEn: 'SAR' },
  { code: 'AED', symbolAr: 'د.إ', symbolEn: 'AED' },
  { code: 'KWD', symbolAr: 'د.ك', symbolEn: 'KWD' },
  { code: 'QAR', symbolAr: 'ر.ق', symbolEn: 'QAR' },
  { code: 'OMR', symbolAr: 'ر.ع', symbolEn: 'OMR' },
  { code: 'BHD', symbolAr: 'د.ب', symbolEn: 'BHD' },
  { code: 'JOD', symbolAr: 'د.أ', symbolEn: 'JOD' },
  { code: 'EUR', symbolAr: '€', symbolEn: 'EUR' },
  { code: 'USD', symbolAr: '$', symbolEn: 'USD' },
];

const KEY = 'settings.currency';
const DEFAULT: CurrencySettings = CURRENCY_PRESETS[0];

export async function getCurrency(): Promise<CurrencySettings> {
  return getSetting<CurrencySettings>(KEY, DEFAULT);
}

export async function setCurrency(v: CurrencySettings): Promise<void> {
  await setSetting(KEY, v);
}

export function formatCurrency(amount: number, currency: CurrencySettings, isRTL: boolean): string {
  const symbol = isRTL ? currency.symbolAr : currency.symbolEn;
  return `${amount} ${symbol}`;
}
