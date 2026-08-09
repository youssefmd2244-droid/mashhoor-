import { getSetting, setSetting } from './store';
import type { PaymentMethod } from './types';

export interface PaymentMethodConfig {
  id: PaymentMethod;
  labelAr: string;
  labelEn: string;
  requiresNumber: boolean; // true for wallet-based methods that need a configured receiving number
  enabled: boolean;
  builtin: boolean; // was one of the 4 starter methods — still fully editable/removable, this just marks its origin
  icon?: string; // emoji shown next to the method everywhere it's listed
}

// The 4 starter methods. They're pre-created so a fresh install already has
// sensible options, but — per your request — nothing here is locked: they
// can be renamed, given a different icon, or deleted from Settings → طرق
// الدفع like any custom method. "استرجاع الطرق الافتراضية" brings them back
// if you ever want a clean slate again.
const STARTER_METHODS: PaymentMethodConfig[] = [
  { id: 'cash', labelAr: 'كاش عند الاستلام', labelEn: 'Cash', requiresNumber: false, enabled: true, builtin: true, icon: '💵' },
  { id: 'instapay', labelAr: 'إنستاباي', labelEn: 'InstaPay', requiresNumber: true, enabled: true, builtin: true, icon: '🏦' },
  { id: 'vodafone_cash', labelAr: 'فودافون كاش', labelEn: 'Vodafone Cash', requiresNumber: true, enabled: true, builtin: true, icon: '📱' },
  { id: 'etisalat_cash', labelAr: 'اتصالات كاش', labelEn: 'Etisalat Cash', requiresNumber: true, enabled: true, builtin: true, icon: '📲' },
];

interface PaymentMethodsSettings {
  methods: PaymentMethodConfig[];
}

const DEFAULT_SETTINGS: PaymentMethodsSettings = { methods: STARTER_METHODS };
const METHODS_KEY = 'settings.paymentMethodsConfig.v2';

async function getMethodsSettings(): Promise<PaymentMethodsSettings> {
  const v = await getSetting<Partial<PaymentMethodsSettings>>(METHODS_KEY, DEFAULT_SETTINGS);
  return { methods: v.methods ?? STARTER_METHODS };
}

async function setMethodsSettings(v: PaymentMethodsSettings): Promise<void> {
  await setSetting(METHODS_KEY, v);
}

// Full list for the admin screen.
export async function getAllPaymentMethods(): Promise<PaymentMethodConfig[]> {
  return (await getMethodsSettings()).methods;
}

// Enabled-only list — what the customer actually sees at checkout.
export async function getEnabledPaymentMethods(): Promise<PaymentMethodConfig[]> {
  const all = await getAllPaymentMethods();
  const enabled = all.filter((m) => m.enabled);
  // Never show zero payment options — fall back to cash if the admin
  // disabled/deleted everything.
  return enabled.length ? enabled : [{ ...STARTER_METHODS[0], enabled: true }];
}

export async function togglePaymentMethod(id: string, enabled: boolean): Promise<void> {
  const s = await getMethodsSettings();
  await setMethodsSettings({ methods: s.methods.map((m) => (m.id === id ? { ...m, enabled } : m)) });
}

export async function updatePaymentMethod(id: string, patch: Partial<PaymentMethodConfig>): Promise<void> {
  const s = await getMethodsSettings();
  await setMethodsSettings({ methods: s.methods.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
}

export async function addCustomPaymentMethod(input: {
  labelAr: string;
  labelEn: string;
  requiresNumber: boolean;
  icon?: string;
}): Promise<void> {
  const s = await getMethodsSettings();
  const id = `custom_${crypto.randomUUID().slice(0, 8)}`;
  const methods: PaymentMethodConfig[] = [
    ...s.methods,
    {
      id,
      labelAr: input.labelAr,
      labelEn: input.labelEn || input.labelAr,
      requiresNumber: input.requiresNumber,
      enabled: true,
      builtin: false,
      icon: input.icon || '💳',
    },
  ];
  await setMethodsSettings({ methods });
}

// Any method can now be removed — built-in or custom. Nothing in this list
// is permanently locked.
export async function removePaymentMethod(id: string): Promise<void> {
  const s = await getMethodsSettings();
  await setMethodsSettings({ methods: s.methods.filter((m) => m.id !== id) });
}

// Safety net for the "remove everything by mistake" case — brings back the
// original 4 starter methods without touching custom ones you've added.
export async function restoreDefaultPaymentMethods(): Promise<void> {
  const s = await getMethodsSettings();
  const customOnly = s.methods.filter((m) => !STARTER_METHODS.some((b) => b.id === m.id));
  await setMethodsSettings({ methods: [...STARTER_METHODS, ...customOnly] });
}

// Wallet-based methods keyed by method id (built-in or custom) → the
// receiving number/IBAN/etc the admin configured for it, plus the name
// registered on that number (so the customer can confirm they're sending to
// the right person before transferring).
export type PaymentNumbers = Record<string, string>;
export type PaymentAccountNames = Record<string, string>;

const PAYMENT_NUMBERS_KEY = 'settings.paymentNumbers';
const PAYMENT_NAMES_KEY = 'settings.paymentAccountNames';
const POST_PAYMENT_MESSAGE_KEY = 'settings.postPaymentMessage';

export async function getPaymentNumbers(): Promise<PaymentNumbers> {
  return getSetting<PaymentNumbers>(PAYMENT_NUMBERS_KEY, {});
}
export async function setPaymentNumbers(numbers: PaymentNumbers): Promise<void> {
  await setSetting(PAYMENT_NUMBERS_KEY, numbers);
}

export async function getPaymentAccountNames(): Promise<PaymentAccountNames> {
  return getSetting<PaymentAccountNames>(PAYMENT_NAMES_KEY, {});
}
export async function setPaymentAccountNames(names: PaymentAccountNames): Promise<void> {
  await setSetting(PAYMENT_NAMES_KEY, names);
}

export interface PostPaymentMessage {
  ar: string;
  en: string;
}
const DEFAULT_POST_PAYMENT_MESSAGE: PostPaymentMessage = {
  ar: 'من فضلك ابعت اسكرين شوت التحويل في نفس محادثة الواتساب بعد إرسال الطلب 📸',
  en: 'Please send a screenshot of the transfer in the same WhatsApp chat after sending your order 📸',
};
export async function getPostPaymentMessage(): Promise<PostPaymentMessage> {
  return getSetting<PostPaymentMessage>(POST_PAYMENT_MESSAGE_KEY, DEFAULT_POST_PAYMENT_MESSAGE);
}
export async function setPostPaymentMessage(msg: PostPaymentMessage): Promise<void> {
  await setSetting(POST_PAYMENT_MESSAGE_KEY, msg);
}

export async function paymentMethodConfig(id: PaymentMethod): Promise<PaymentMethodConfig> {
  const all = await getAllPaymentMethods();
  return all.find((m) => m.id === id) ?? all[0];
}
