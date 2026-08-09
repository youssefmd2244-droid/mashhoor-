import { getSetting, setSetting } from './store';

// ---------------- Operating hours ----------------
// One entry per weekday (0 = Sunday ... 6 = Saturday), matching Date#getDay().
// `closed: true` means the place doesn't open at all that day.
// Times are "HH:mm" 24h local time. `closeTime` can be earlier than
// `openTime` to represent an overnight window (e.g. open 17:00, close 02:00).
export interface DayHours {
  day: number; // 0-6
  closed: boolean;
  openTime: string; // "HH:mm"
  closeTime: string; // "HH:mm"
}

// One-off date overrides — holidays / special occasions that don't follow the
// normal weekly pattern (e.g. "Eid: closed" or "Dec 31: open till 03:00").
// A date override always wins over the weekly schedule for that day.
export interface DateOverride {
  date: string; // "YYYY-MM-DD", local
  label?: string; // e.g. "عيد الفطر"
  closed: boolean;
  openTime?: string; // ignored if closed
  closeTime?: string;
}

export interface OperatingHoursSettings {
  enabled: boolean; // if false, the place is treated as always open (legacy behavior)
  days: DayHours[];
  dateOverrides?: DateOverride[];
}

const HOURS_KEY = 'settings.operatingHours';

const DEFAULT_HOURS: OperatingHoursSettings = {
  enabled: false,
  days: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    closed: false,
    openTime: '12:00',
    closeTime: '00:00',
  })),
  dateOverrides: [],
};

export async function getOperatingHours(): Promise<OperatingHoursSettings> {
  const v = await getSetting<OperatingHoursSettings>(HOURS_KEY, DEFAULT_HOURS);
  // Guard against partially-shaped legacy data
  if (!v.days || v.days.length !== 7) return DEFAULT_HOURS;
  if (!v.dateOverrides) v.dateOverrides = [];
  return v;
}

export async function setOperatingHours(v: OperatingHoursSettings): Promise<void> {
  await setSetting(HOURS_KEY, v);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

export interface OpenStatus {
  isOpen: boolean;
  enabled: boolean;
  today?: DayHours;
  // Human-friendly "next change" info, e.g. closes at 00:00 / opens tomorrow at 12:00
  changeLabel?: { ar: string; en: string };
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeOpenStatus(hours: OperatingHoursSettings, now: Date = new Date()): OpenStatus {
  if (!hours.enabled) return { isOpen: true, enabled: false };

  const todayKey = dateKey(now);
  const override = (hours.dateOverrides ?? []).find((o) => o.date === todayKey);

  const day = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = hours.days.find((d) => d.day === day)!;
  const yesterday = hours.days.find((d) => d.day === (day + 6) % 7)!;

  // A holiday/special-date override always wins over the normal weekly hours.
  if (override) {
    if (override.closed) {
      return {
        isOpen: false,
        enabled: true,
        today,
        changeLabel: {
          ar: override.label ? `مقفول — ${override.label}` : 'مقفول (إجازة)',
          en: override.label ? `Closed — ${override.label}` : 'Closed (holiday)',
        },
      };
    }
    const openMin = toMinutes(override.openTime || '00:00');
    const closeMin = toMinutes(override.closeTime || '23:59');
    const withinOverride = closeMin <= openMin ? nowMin >= openMin || nowMin < closeMin : nowMin >= openMin && nowMin < closeMin;
    if (withinOverride) {
      return {
        isOpen: true,
        enabled: true,
        today,
        changeLabel: { ar: `هيتقفل الساعة ${override.closeTime}`, en: `Closes at ${override.closeTime}` },
      };
    }
    return {
      isOpen: false,
      enabled: true,
      today,
      changeLabel: { ar: `هيفتح الساعة ${override.openTime}`, en: `Opens at ${override.openTime}` },
    };
  }

  const isOvernight = (d: DayHours) => toMinutes(d.closeTime) <= toMinutes(d.openTime);

  // Case 1: still inside yesterday's overnight window (e.g. opened 17:00
  // yesterday, closes 02:00 today, and it's currently 01:00 today).
  if (!yesterday.closed && isOvernight(yesterday) && nowMin < toMinutes(yesterday.closeTime)) {
    return {
      isOpen: true,
      enabled: true,
      today,
      changeLabel: {
        ar: `هيتقفل الساعة ${yesterday.closeTime}`,
        en: `Closes at ${yesterday.closeTime}`,
      },
    };
  }

  if (today.closed) {
    return {
      isOpen: false,
      enabled: true,
      today,
      changeLabel: { ar: 'مقفول النهاردة', en: 'Closed today' },
    };
  }

  const openMin = toMinutes(today.openTime);
  const closeMin = toMinutes(today.closeTime);
  const withinToday = isOvernight(today)
    ? nowMin >= openMin || nowMin < closeMin
    : nowMin >= openMin && nowMin < closeMin;

  if (withinToday) {
    return {
      isOpen: true,
      enabled: true,
      today,
      changeLabel: { ar: `هيتقفل الساعة ${today.closeTime}`, en: `Closes at ${today.closeTime}` },
    };
  }

  return {
    isOpen: false,
    enabled: true,
    today,
    changeLabel: { ar: `هيفتح الساعة ${today.openTime}`, en: `Opens at ${today.openTime}` },
  };
}

// ---------------- Minimum order + delivery fee ----------------

export interface OrderRulesSettings {
  minOrderEnabled: boolean;
  minOrderAmount: number; // EGP, applies to delivery orders only (pickup is exempt)
  deliveryFeeEnabled: boolean;
  deliveryFeeAmount: number; // EGP, added once per order for delivery only
  freeDeliveryThreshold?: number; // optional: waive fee above this subtotal
}

const ORDER_RULES_KEY = 'settings.orderRules';

const DEFAULT_ORDER_RULES: OrderRulesSettings = {
  minOrderEnabled: false,
  minOrderAmount: 0,
  deliveryFeeEnabled: false,
  deliveryFeeAmount: 0,
  freeDeliveryThreshold: undefined,
};

export async function getOrderRules(): Promise<OrderRulesSettings> {
  return getSetting<OrderRulesSettings>(ORDER_RULES_KEY, DEFAULT_ORDER_RULES);
}

export async function setOrderRules(v: OrderRulesSettings): Promise<void> {
  await setSetting(ORDER_RULES_KEY, v);
}

export function computeDeliveryFee(rules: OrderRulesSettings, subtotal: number, isDelivery: boolean): number {
  if (!isDelivery || !rules.deliveryFeeEnabled) return 0;
  if (rules.freeDeliveryThreshold && subtotal >= rules.freeDeliveryThreshold) return 0;
  return rules.deliveryFeeAmount || 0;
}

export const WEEKDAY_LABELS: { ar: string; en: string }[] = [
  { ar: 'الأحد', en: 'Sunday' },
  { ar: 'الإثنين', en: 'Monday' },
  { ar: 'الثلاثاء', en: 'Tuesday' },
  { ar: 'الأربعاء', en: 'Wednesday' },
  { ar: 'الخميس', en: 'Thursday' },
  { ar: 'الجمعة', en: 'Friday' },
  { ar: 'السبت', en: 'Saturday' },
];
