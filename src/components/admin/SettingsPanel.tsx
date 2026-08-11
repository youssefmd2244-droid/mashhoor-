import { useEffect, useMemo, useRef, useState } from 'react';
import {
  listTrash,
  restoreMany,
  permanentlyDeleteMany,
  wipeAllData,
  getSetting,
  setSetting,
  getFullSnapshot,
  mergeSnapshot,
  listItems,
  softDeleteItem,
  type TrashEntry,
} from '../../lib/store';
import { checkLoginPassword, changeLoginPassword } from '../../lib/settingsAuth';
import { adapters, type StorageProvider, type ProviderCredentials } from '../../lib/storageAdapters';
import { startRealtimeSync } from '../../lib/realtimeSync';
import { onSyncStatusChange, type SyncStatus } from '../../lib/autoSync';
import { onOpenSettingsPanel } from '../../lib/uiEvents';
import { COLOR_VARS, getColorOverrides, setColorOverride, resetColorOverride, resetAllColors } from '../../lib/colors';
import { getDisplayMode, setDisplayMode, type DisplayMode } from '../../lib/displayMode';
import {
  getAllSiteTexts,
  setSiteText,
  resetSiteText,
  getSiteFont,
  setSiteFont,
  EDITABLE_TEXT_SLOTS,
  getCustomTextSlots,
  addCustomTextSlot,
  removeCustomTextSlot,
  type TextOverride,
  type SiteFont,
  type CustomTextSlot,
} from '../../lib/siteTexts';
import {
  getAllSiteAssets,
  setSiteAsset,
  resetSiteAsset,
  getAllAssetSlots,
  addCustomAssetSlot,
  removeCustomAssetSlot,
  type SiteAssetSlot,
} from '../../lib/siteAssets';
import { getWhatsAppNumbers, getCustomLinks, type WhatsAppTarget, type CustomLink } from '../../lib/whatsapp';
import {
  getAllPaymentMethods,
  getPaymentNumbers,
  setPaymentNumbers,
  getPaymentAccountNames,
  setPaymentAccountNames,
  getPostPaymentMessage,
  setPostPaymentMessage,
  togglePaymentMethod,
  updatePaymentMethod,
  addCustomPaymentMethod,
  removePaymentMethod,
  restoreDefaultPaymentMethods,
  type PaymentMethodConfig,
  type PaymentNumbers,
  type PaymentAccountNames,
  type PostPaymentMessage,
} from '../../lib/payments';
import type { PaymentMethod, OrderRecord } from '../../lib/types';
import {
  getOperatingHours,
  setOperatingHours,
  getOrderRules,
  setOrderRules,
  WEEKDAY_LABELS,
  type OperatingHoursSettings,
  type OrderRulesSettings,
} from '../../lib/ops';
import { getFeatureSettings, setFeatureSettings, type FeatureSettings } from '../../lib/features';
import { getComplaintNumbers, setComplaintNumbers, type ComplaintNumber } from '../../lib/complaints';
import { getSocialLinks, setSocialLinks, type SocialLink, type SocialPlatform } from '../../lib/socialLinks';
import SocialIcon from '../SocialIcon';
import { getCurrency, setCurrency, CURRENCY_PRESETS, type CurrencySettings } from '../../lib/currency';
import ContentTab from './ContentTab';
import QRTab from './QRTab';
import ExtrasTab from './ExtrasTab';
import FeaturedOffersTab from './FeaturedOffersTab';
import ExtraSectionsTab from './ExtraSectionsTab';
import MediaUploadField from './MediaUploadField';
import {
  getIconCodeSettings,
  setIconCodeSettings,
  getIconCodeFlags,
  setIconCodeFlags,
  checkIconCodePassword,
  ICON_CODE_FLAG_ROSTER,
  type IconCodeSettings,
  type IconCodeNumber,
  type IconCodeFlag,
} from '../../lib/iconCode';

type Tab =
  | 'general'
  | 'content'
  | 'colors'
  | 'display'
  | 'texts'
  | 'alltexts'
  | 'media'
  | 'trash'
  | 'storage'
  | 'links'
  | 'social'
  | 'payments'
  | 'operations'
  | 'features'
  | 'complaints'
  | 'orders'
  | 'extras'
  | 'offers'
  | 'extrasections'
  | 'qr'
  | 'iconcode'
  | 'password';

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  // Opened from the gear icon in the top nav bar (see Navigation.tsx) via a
  // small shared event, instead of a separately-floating button that used
  // to visually collide with the language pill in the corner.
  useEffect(() => onOpenSettingsPanel(() => setOpen(true)), []);

  // Global "Y" shortcut: pressing Y opens settings too.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
      if (typing) return;
      if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setAuthed(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Closing the panel (X button or Escape) always locks it again, so
  // reopening it — even in the same browser session — asks for the
  // password from scratch instead of silently staying logged in.
  function closeSettings() {
    setOpen(false);
    setAuthed(false);
    setPwInput('');
    setPwError('');
  }

  async function handleLogin() {
    const ok = await checkLoginPassword(pwInput);
    if (ok) {
      setAuthed(true);
      setPwError('');
      setPwInput('');
    } else {
      setPwError('باسورد غلط');
    }
  }

  return (
    <>
      {!open ? null : (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-neutral-900 text-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold">إعدادات الموقع</h2>
              <button onClick={closeSettings} className="text-white/60 hover:text-white text-xl leading-none">
                ×
              </button>
            </div>

            {!authed ? (
              <div className="p-8 flex flex-col items-center gap-4">
                <p className="text-white/70 text-sm">ادخل باسورد الإعدادات</p>
                <input
                  type="password"
                  value={pwInput}
                  onChange={(e) => setPwInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoFocus
                  className="w-56 text-center bg-white/10 border border-white/20 rounded-lg px-4 py-2 outline-none focus:border-white/50"
                />
                {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
                <button
                  onClick={handleLogin}
                  className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/90"
                >
                  دخول
                </button>
              </div>
            ) : (
              <AuthedSettings />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AuthedSettings() {
  const [tab, setTab] = useState<Tab>('general');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'عام' },
    { id: 'content', label: 'المحتوى' },
    { id: 'colors', label: 'الألوان' },
    { id: 'display', label: 'العرض' },
    { id: 'alltexts', label: 'كل نصوص الموقع' },
    { id: 'texts', label: 'الخط' },
    { id: 'media', label: 'الصور والأيقونات' },
    { id: 'links', label: 'روابط الطلب' },
    { id: 'social', label: 'السوشيال والموقع' },
    { id: 'payments', label: 'طرق الدفع' },
    { id: 'operations', label: 'مواعيد وتوصيل' },
    { id: 'features', label: 'المميزات' },
    { id: 'extras', label: 'الإضافات' },
    { id: 'offers', label: 'العروض المميزة' },
    { id: 'extrasections', label: 'أقسام إضافية (تصويت/فاست فود/الهوية)' },
    { id: 'complaints', label: 'الشكاوي' },
    { id: 'orders', label: 'الطلبات' },
    { id: 'storage', label: 'التخزين' },
    { id: 'qr', label: 'الباركود' },
    { id: 'trash', label: 'سلة المهملات' },
    { id: 'password', label: 'تغيير الباسورد' },
    { id: 'iconcode', label: 'Icon Code 🔒' },
  ];
  return (
    <div className="flex flex-col md:flex-row">
      <nav className="md:w-48 border-b md:border-b-0 md:border-l border-white/10 flex md:flex-col overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm text-right whitespace-nowrap ${
              tab === t.id ? 'bg-white/10 font-medium' : 'text-white/60 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 p-5 max-h-[70vh] overflow-y-auto">
        {tab === 'general' && <GeneralTab />}
        {tab === 'content' && <ContentTab />}
        {tab === 'colors' && <ColorsTab />}
        {tab === 'display' && <DisplayModeTab />}
        {tab === 'alltexts' && <AllTextsTab />}
        {tab === 'texts' && <FontTab />}
        {tab === 'media' && <SiteMediaTab />}
        {tab === 'links' && <LinksTab />}
        {tab === 'social' && <SocialTab />}
        {tab === 'payments' && <PaymentsTab />}
        {tab === 'operations' && <OperationsTab />}
        {tab === 'features' && <FeaturesTab />}
        {tab === 'extras' && <ExtrasTab />}
        {tab === 'offers' && <FeaturedOffersTab />}
        {tab === 'extrasections' && <ExtraSectionsTab />}
        {tab === 'complaints' && <ComplaintsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'trash' && <TrashTab />}
        {tab === 'storage' && <StorageTab />}
        {tab === 'qr' && <QRTab />}
        {tab === 'password' && <PasswordTab />}
        {tab === 'iconcode' && <IconCodeTab />}
      </div>
    </div>
  );
}

function GeneralTab() {
  const [wiping, setWiping] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wipePw, setWipePw] = useState('');
  const [wipeErr, setWipeErr] = useState('');

  async function handleWipe() {
    if (wipePw !== 'y') {
      setWipeErr('باسورد المسح غلط');
      return;
    }
    setWiping(true);
    await wipeAllData(false); // trash is preserved — items go to trash, can be restored
    setWiping(false);
    setConfirmWipe(false);
    setWipePw('');
    setWipeErr('');
    alert('اتمسحت كل بيانات الموقع (لسه ممكن تسترجعها لو موجودة في سلة المهملات)');
  }

  return (
    <div className="space-y-6 text-sm">
      <p className="text-white/60">
        من هنا هتقدر تتحكم في إعدادات الموقع العامة. لتعديل الأصناف والأقسام والصور روح تبويب "المحتوى"، وللألوان روح تبويب "الألوان".
      </p>
      <CurrencyPicker />
      <div className="border border-red-500/30 rounded-xl p-4 space-y-3">
        <p className="text-red-400 font-medium">منطقة الخطر</p>
        {!confirmWipe ? (
          <button
            onClick={() => setConfirmWipe(true)}
            className="bg-red-600/20 text-red-300 border border-red-500/40 px-4 py-2 rounded-lg text-sm hover:bg-red-600/30"
          >
            مسح جميع بيانات الموقع
          </button>
        ) : (
          <div className="space-y-2">
            <span className="text-white/70 block">متأكد؟ البيانات هتتشال لسلة المهملات وتقدر ترجعها. اكتب باسورد المسح للتأكيد:</span>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={wipePw}
                onChange={(e) => { setWipePw(e.target.value); setWipeErr(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleWipe()}
                placeholder="باسورد المسح"
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none w-32"
              />
              <button
                onClick={handleWipe}
                disabled={wiping}
                className="bg-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-500 disabled:opacity-50"
              >
                {wiping ? 'جاري المسح...' : 'تأكيد المسح'}
              </button>
              <button onClick={() => { setConfirmWipe(false); setWipePw(''); setWipeErr(''); }} className="text-white/50 text-sm underline">
                إلغاء
              </button>
            </div>
            {wipeErr && <p className="text-red-400 text-xs">{wipeErr}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function CurrencyPicker() {
  const [currency, setCurrencyState] = useState<CurrencySettings | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCurrency().then((c) => {
      setCurrencyState(c);
      setCustomMode(!CURRENCY_PRESETS.some((p) => p.code === c.code));
    });
  }, []);

  async function save(v: CurrencySettings) {
    setCurrencyState(v);
    await setCurrency(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  if (!currency) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div>
        <h4 className="font-medium">العملة</h4>
        <p className="text-white/40 text-xs mt-1">
          العملة اللي هتظهر جنب كل سعر في الموقع وفي رسالة الطلب على واتساب — مفيدة لو بتشتغل مع فروع في السعودية
          أو الإمارات أو أي بلد تاني.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {CURRENCY_PRESETS.map((p) => (
          <button
            key={p.code}
            onClick={() => {
              setCustomMode(false);
              save(p);
            }}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              !customMode && currency.code === p.code
                ? 'bg-white text-black border-white font-medium'
                : 'border-white/20 text-white/60 hover:bg-white/5'
            }`}
          >
            {p.symbolAr} · {p.code}
          </button>
        ))}
        <button
          onClick={() => setCustomMode(true)}
          className={`px-3 py-1.5 rounded-full text-xs border ${
            customMode ? 'bg-white text-black border-white font-medium' : 'border-white/20 text-white/60 hover:bg-white/5'
          }`}
        >
          مخصصة
        </button>
      </div>
      {customMode && (
        <div className="grid grid-cols-3 gap-2 pt-2">
          <input
            value={currency.code}
            onChange={(e) => setCurrencyState({ ...currency, code: e.target.value })}
            onBlur={() => save(currency)}
            placeholder="الكود، مثال: SAR"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
          />
          <input
            value={currency.symbolAr}
            onChange={(e) => setCurrencyState({ ...currency, symbolAr: e.target.value })}
            onBlur={() => save(currency)}
            placeholder="الرمز بالعربي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
          />
          <input
            value={currency.symbolEn}
            onChange={(e) => setCurrencyState({ ...currency, symbolEn: e.target.value })}
            onBlur={() => save(currency)}
            placeholder="Symbol in English"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
          />
        </div>
      )}
      {saved && <span className="text-emerald-400 text-xs block">✓ اتحفظ</span>}
    </div>
  );
}

function TrashTab() {
  const [items, setItems] = useState<TrashEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setItems(await listTrash());
    setSelected(new Set());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const allSelected = useMemo(() => items.length > 0 && selected.size === items.length, [items, selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  }

  async function restoreSelected() {
    await restoreMany([...selected]);
    refresh();
  }

  async function deleteSelected() {
    await permanentlyDeleteMany([...selected]);
    refresh();
  }

  async function restoreAll() {
    await restoreMany(items.map((i) => i.id));
    refresh();
  }

  async function deleteAll() {
    await permanentlyDeleteMany(items.map((i) => i.id));
    refresh();
  }

  if (loading) return <p className="text-white/50 text-sm">جاري التحميل...</p>;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={toggleAll} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
          {allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
        </button>
        <button
          onClick={restoreSelected}
          disabled={!selected.size}
          className="px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 disabled:opacity-40"
        >
          استرجاع المحدد
        </button>
        <button
          onClick={deleteSelected}
          disabled={!selected.size}
          className="px-3 py-1.5 rounded-lg bg-red-600/30 text-red-300 hover:bg-red-600/50 disabled:opacity-40"
        >
          مسح المحدد نهائيًا
        </button>
        <span className="mx-2 text-white/20">|</span>
        <button
          onClick={restoreAll}
          disabled={!items.length}
          className="px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600/30 disabled:opacity-40"
        >
          استرجاع الكل
        </button>
        <button
          onClick={deleteAll}
          disabled={!items.length}
          className="px-3 py-1.5 rounded-lg bg-red-600/10 text-red-300 hover:bg-red-600/30 disabled:opacity-40"
        >
          مسح الكل نهائيًا
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-white/40">سلة المهملات فاضية.</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
              <div className="flex-1">
                <p className="font-medium">{item.data?.name || item.originalId}</p>
                <p className="text-white/40 text-xs">
                  من: {item.sourceStore} — اتمسح: {new Date(item.deletedAt).toLocaleString('ar-EG')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DisplayModeTab() {
  const [mode, setModeState] = useState<DisplayMode>('day');

  useEffect(() => {
    getDisplayMode().then(setModeState);
  }, []);

  async function choose(m: DisplayMode) {
    setModeState(m);
    await setDisplayMode(m);
  }

  const options: { id: DisplayMode; label: string; desc: string; icon: string }[] = [
    { id: 'day', label: 'نهاري (الوضع الافتراضي)', desc: 'شكل الموقع زي ما هو مصمم بالظبط.', icon: '☀️' },
    { id: 'eyeComfort', label: 'راحة العين', desc: 'ألوان أدفى وأقل إجهاد للعين في الاستخدام الطويل.', icon: '🌙' },
    { id: 'dark', label: 'دارك', desc: 'تعتيم إضافي وتباين أعلى.', icon: '🌑' },
    { id: 'bw', label: 'أبيض وأسود', desc: 'الموقع كله بالتدرج الرمادي.', icon: '⚫' },
  ];

  return (
    <div className="space-y-3 text-sm">
      <p className="text-white/40 text-xs mb-2">
        اختار وضع العرض للموقع كله. التغيير بيتطبق فورًا وبيتحفظ لكل الزوار.
      </p>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => choose(o.id)}
          className={`tilt-card w-full text-start flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
            mode === o.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <span className="text-2xl">{o.icon}</span>
          <span>
            <span className="block font-medium">{o.label}</span>
            <span className={`block text-xs ${mode === o.id ? 'text-black/60' : 'text-white/40'}`}>{o.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function FontTab() {
  const [font, setFontState] = useState<SiteFont>('default');

  useEffect(() => {
    getSiteFont().then(setFontState);
  }, []);

  async function chooseFont(f: SiteFont) {
    setFontState(f);
    await setSiteFont(f);
  }

  const fontOptions: { id: SiteFont; label: string }[] = [
    { id: 'default', label: 'الخط الأصلي للموقع' },
    { id: 'system', label: 'خط النظام (أسرع تحميل)' },
    { id: 'serif', label: 'سيريف كلاسيك' },
    { id: 'roundedSans', label: 'مدور وودود' },
  ];

  return (
    <div className="space-y-6 text-sm">
      <div>
        <h4 className="font-medium mb-2">الخط المستخدم في الموقع</h4>
        <div className="grid grid-cols-2 gap-2">
          {fontOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => chooseFont(f.id)}
              className={`rounded-lg py-2 text-xs border ${
                font === f.id ? 'bg-white text-black border-white font-medium' : 'border-white/20 text-white/70 hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// A single place that gathers EVERY editable text on the site — every
// curated slot (hero, story, signature, fastfood, pasta, poster, flyer,
// poll, app, footer, menu...) plus any custom slot the admin has added —
// so nothing needs to be hunted down tab by tab. Delete a letter, swap a
// word, rewrite the whole line, or clear the box to fall back to the
// original design copy.
function AllTextsTab() {
  const [texts, setTexts] = useState<Record<string, TextOverride>>({});
  const [drafts, setDrafts] = useState<Record<string, TextOverride>>({});
  const [saved, setSaved] = useState(false);
  const [customSlots, setCustomSlots] = useState<CustomTextSlot[]>([]);
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [search, setSearch] = useState('');

  async function reload() {
    const [t, cs] = await Promise.all([getAllSiteTexts(), getCustomTextSlots()]);
    setTexts(t);
    setDrafts(t);
    setCustomSlots(cs);
  }
  useEffect(() => {
    reload();
  }, []);

  const allSlots = [...EDITABLE_TEXT_SLOTS, ...customSlots.map((c) => ({ key: c.key, labelAr: c.labelAr, fallback: { ar: '', en: '' } }))];
  const visibleSlots = search.trim()
    ? allSlots.filter((s) => {
        const q = search.trim().toLowerCase();
        return (
          s.labelAr.toLowerCase().includes(q) ||
          s.fallback.ar.toLowerCase().includes(q) ||
          s.fallback.en.toLowerCase().includes(q) ||
          (drafts[s.key]?.ar ?? '').toLowerCase().includes(q) ||
          (drafts[s.key]?.en ?? '').toLowerCase().includes(q)
        );
      })
    : allSlots;

  async function saveAll() {
    await Promise.all(allSlots.map((slot) => {
      const d = drafts[slot.key];
      const isEmpty = !d || (!d.ar.trim() && !d.en.trim() && !d.color);
      return isEmpty ? resetSiteText(slot.key) : setSiteText(slot.key, d);
    }));
    setTexts(drafts);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function addSlot() {
    if (!newSlotLabel.trim()) return;
    await addCustomTextSlot(newSlotLabel.trim());
    setNewSlotLabel('');
    reload();
  }

  async function removeSlot(key: string) {
    await removeCustomTextSlot(key);
    reload();
  }

  return (
    <div className="space-y-6 text-sm">
      <div>
        <h4 className="font-medium mb-1">كل نصوص الموقع في مكان واحد</h4>
        <p className="text-white/40 text-xs mb-4">
          تحت كل خانة هتلاقي النص الموجود دلوقتي فعليًا على الموقع (باللونين). اكتب في الخانة اللي تحته عشان
          تستبدله بنص جديد، أو سيبها فاضية عشان يفضل النص زي ما هو. تحت خانة الكتابة فيه دائرة لون — دوس عليها
          واختار أي لون تحبه لنفس النص ده تحديدًا. أي تعديل هنا بيظهر في الموقع مباشرة بعد الحفظ.
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="دوّر على نص معين..."
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs mb-4"
        />
        <div className="space-y-4">
          {visibleSlots.map((slot) => {
            const isCustom = customSlots.some((c) => c.key === slot.key);
            return (
              <div key={slot.key} className="space-y-1.5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-white/70 text-xs">{slot.labelAr}</p>
                  {isCustom && (
                    <button onClick={() => removeSlot(slot.key)} className="text-red-400 text-[11px]">
                      حذف الخانة دي
                    </button>
                  )}
                </div>
                {(slot.fallback.ar || slot.fallback.en) && (
                  <p className="text-white/35 text-[11px] leading-relaxed">
                    النص الموجود دلوقتي في الموقع:{' '}
                    <span className="text-white/60">
                      {slot.fallback.ar}
                      {slot.fallback.en ? ` / ${slot.fallback.en}` : ''}
                    </span>
                  </p>
                )}
                <input
                  value={drafts[slot.key]?.ar ?? ''}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [slot.key]: { ar: e.target.value, en: d[slot.key]?.en ?? '', color: d[slot.key]?.color },
                    }))
                  }
                  placeholder={slot.fallback.ar ? `اكتب هنا عشان تستبدل: ${slot.fallback.ar}` : 'نص بالعربي (اختياري)'}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
                />
                <input
                  value={drafts[slot.key]?.en ?? ''}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [slot.key]: { ar: d[slot.key]?.ar ?? '', en: e.target.value, color: d[slot.key]?.color },
                    }))
                  }
                  placeholder="Text in English (optional)"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
                />
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-white/50 text-[11px] flex items-center gap-1.5">
                    لون الخط:
                    <input
                      type="color"
                      value={drafts[slot.key]?.color || '#ffffff'}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [slot.key]: { ar: d[slot.key]?.ar ?? '', en: d[slot.key]?.en ?? '', color: e.target.value },
                        }))
                      }
                      className="w-4 h-4 rounded-sm border border-white/20 bg-transparent cursor-pointer p-0 shrink-0"
                    />
                  </label>
                  {drafts[slot.key]?.color && (
                    <button
                      onClick={() =>
                        setDrafts((d) => ({
                          ...d,
                          [slot.key]: { ar: d[slot.key]?.ar ?? '', en: d[slot.key]?.en ?? '', color: undefined },
                        }))
                      }
                      className="text-white/40 text-[11px] underline"
                    >
                      رجّع اللون الأصلي
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {visibleSlots.length === 0 && <p className="text-white/40 text-xs">مفيش نصوص متطابقة مع البحث.</p>}
        </div>

        <div className="border-t border-white/10 mt-4 pt-4 flex flex-wrap gap-2">
          <input
            value={newSlotLabel}
            onChange={(e) => setNewSlotLabel(e.target.value)}
            placeholder="اسم خانة نص جديدة (مثال: عنوان قسم الآراء)"
            className="flex-1 min-w-[180px] bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
          />
          <button onClick={addSlot} className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-xs">
            + إضافة خانة نص
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={saveAll} className="bg-white text-black px-5 py-2 rounded-lg font-medium">
          حفظ
        </button>
        {saved && <span className="text-emerald-400 text-xs">✓ اتحفظ</span>}
      </div>
    </div>
  );
}

function SiteMediaTab() {
  const [slots, setSlots] = useState<SiteAssetSlot[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [newLabel, setNewLabel] = useState('');
  const [saved, setSaved] = useState(false);

  async function reload() {
    const [s, v] = await Promise.all([getAllAssetSlots(), getAllSiteAssets()]);
    setSlots(s);
    setValues(v);
  }
  useEffect(() => {
    reload();
  }, []);

  async function updateSlot(key: string, url: string) {
    setValues((v) => ({ ...v, [key]: url }));
    if (url) await setSiteAsset(key, url);
    else await resetSiteAsset(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  async function addSlot() {
    if (!newLabel.trim()) return;
    await addCustomAssetSlot(newLabel.trim());
    setNewLabel('');
    reload();
  }

  async function removeSlot(key: string) {
    await removeCustomAssetSlot(key);
    reload();
  }

  return (
    <div className="space-y-5 text-sm">
      <p className="text-white/40 text-xs">
        هنا تقدر تتحكم في أي صورة أو أيقونة في الموقع — ترفع بدل الافتراضي، تعدلها في أي وقت، أو تضيف خانة صورة/أيقونة
        جديدة وتمسحها لما تحب. سيب الخانة فاضية عشان ترجع الصورة الأصلية.
      </p>
      <div className="space-y-5">
        {slots.map((slot) => (
          <div key={slot.key} className="border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-white/70 text-xs">{slot.labelAr}</p>
              {slot.custom && (
                <button onClick={() => removeSlot(slot.key)} className="text-red-400 text-[11px]">
                  حذف الخانة دي
                </button>
              )}
            </div>
            <MediaUploadField
              value={values[slot.key] || ''}
              onChange={(v) => updateSlot(slot.key, v)}
              previewClassName="w-16 h-16 rounded-lg object-cover"
            />
          </div>
        ))}
        {slots.length === 0 && <p className="text-white/40 text-xs">لسه مفيش خانات صور مضافة.</p>}
      </div>

      <div className="border-t border-white/10 pt-4 flex flex-wrap gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="اسم خانة صورة/أيقونة جديدة"
          className="flex-1 min-w-[180px] bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
        />
        <button onClick={addSlot} className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-xs">
          + إضافة خانة صورة
        </button>
      </div>
      {saved && <span className="text-emerald-400 text-xs">✓ اتحفظ</span>}
    </div>
  );
}

function ColorsTab() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    getColorOverrides().then(setOverrides);
  }, []);

  async function change(key: string, value: string) {
    setOverrides((p) => ({ ...p, [key]: value }));
    await setColorOverride(key, value);
  }

  async function reset(key: string) {
    setOverrides((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
    await resetColorOverride(key);
  }

  async function resetAll() {
    setOverrides({});
    await resetAllColors();
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <p className="text-white/60">أي لون تغيّره هنا بيتطبق على الموقع فورًا وبيتحفظ.</p>
        <button onClick={resetAll} className="text-xs text-white/50 underline">استرجاع كل الألوان الأصلية</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {COLOR_VARS.map((c) => {
          const val = overrides[c.key] ?? c.default;
          return (
            <div key={c.key} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
              <input
                type="color"
                value={val}
                onChange={(e) => change(c.key, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate">{c.label}</p>
                {overrides[c.key] && (
                  <button onClick={() => reset(c.key)} className="text-[10px] text-white/40 underline">
                    استرجاع
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LinksTab() {
  const [numbers, setNumbers] = useState<WhatsAppTarget[]>([]);
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  async function refresh() {
    setNumbers(await getWhatsAppNumbers());
    setLinks(await getCustomLinks());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function saveNumbers(list: WhatsAppTarget[]) {
    await setSetting('settings.whatsappNumbers', list);
    setNumbers(list);
  }
  async function saveLinks(list: CustomLink[]) {
    await setSetting('settings.customLinks', list);
    setLinks(list);
  }

  function addNumber() {
    if (!newLabel.trim() || !newPhone.trim()) return;
    saveNumbers([...numbers, { id: crypto.randomUUID(), label: newLabel.trim(), phone: newPhone.trim() }]);
    setNewLabel('');
    setNewPhone('');
  }
  function removeNumber(id: string) {
    saveNumbers(numbers.filter((n) => n.id !== id));
  }
  function addLink() {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    saveLinks([...links, { id: crypto.randomUUID(), label: linkLabel.trim(), url: linkUrl.trim() }]);
    setLinkLabel('');
    setLinkUrl('');
  }
  function removeLink(id: string) {
    saveLinks(links.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-8 text-sm">
      <div>
        <h4 className="font-medium mb-2">أرقام واتساب لاستقبال الطلبات</h4>
        <p className="text-white/40 text-xs mb-3">أول رقم في القائمة هو اللي بيوصله الطلب افتراضيًا.</p>
        <ul className="space-y-2 mb-3">
          {numbers.map((n) => (
            <li key={n.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <span>{n.label} — {n.phone}</span>
              <button onClick={() => removeNumber(n.id)} className="text-red-400 text-xs">حذف</button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="اسم (مثلاً: الفرع الرئيسي)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none flex-1 min-w-[140px]" />
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="رقم مع كود الدولة، مثال: 201094555299"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none flex-1 min-w-[180px]" />
          <button onClick={addNumber} className="bg-white text-black px-4 py-2 rounded-lg font-medium">إضافة</button>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">روابط طلب من منصات تانية (غير واتساب)</h4>
        <p className="text-white/40 text-xs mb-3">مثلاً رابط تليجرام أو ماسنجر أو أي نموذج طلب خاص بيك.</p>
        <ul className="space-y-2 mb-3">
          {links.map((l) => (
            <li key={l.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <span className="truncate">{l.label} — {l.url}</span>
              <button onClick={() => removeLink(l.id)} className="text-red-400 text-xs shrink-0">حذف</button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="اسم المنصة"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none flex-1 min-w-[140px]" />
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="الرابط"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none flex-1 min-w-[180px]" />
          <button onClick={addLink} className="bg-white text-black px-4 py-2 rounded-lg font-medium">إضافة</button>
        </div>
      </div>
    </div>
  );
}

const PLATFORM_LABELS: { id: SocialPlatform; label: string; placeholder: string }[] = [
  { id: 'facebook', label: 'فيسبوك', placeholder: 'https://facebook.com/yourpage' },
  { id: 'instagram', label: 'انستقرام', placeholder: 'https://instagram.com/yourpage' },
  { id: 'tiktok', label: 'تيك توك', placeholder: 'https://tiktok.com/@yourpage' },
  { id: 'x', label: 'إكس (تويتر)', placeholder: 'https://x.com/yourpage' },
  { id: 'location', label: 'الموقع على الخريطة', placeholder: 'رابط Google Maps لمكانك' },
  { id: 'custom', label: 'رابط تاني (مخصص)', placeholder: 'https://...' },
];

function SocialTab() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('custom');
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  async function refresh() {
    setLinks(await getSocialLinks());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save(next: SocialLink[]) {
    await setSocialLinks(next);
    setLinks(next);
  }

  function updateLink(id: string, patch: Partial<SocialLink>) {
    save(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLink(id: string) {
    save(links.filter((l) => l.id !== id));
  }

  function addLink() {
    if (!newUrl.trim()) return;
    const preset = PLATFORM_LABELS.find((p) => p.id === newPlatform);
    save([
      ...links,
      {
        id: crypto.randomUUID(),
        platform: newPlatform,
        label: newLabel.trim() || preset?.label || 'رابط',
        url: newUrl.trim(),
        enabled: true,
      },
    ]);
    setNewLabel('');
    setNewUrl('');
  }

  return (
    <div className="space-y-6 text-sm">
      <p className="text-white/50 text-xs leading-relaxed">
        الروابط دي بتظهر في الفوتر (أسفل الموقع) كأيقونات — فيسبوك، انستقرام، تيك توك، إكس، وموقعك على الخريطة. تقدر
        تغيّر أي رابط، تعطّله من غير ما تمسحه (يختفي من الموقع مؤقتًا)، تمسحه نهائيًا، أو تضيف أكتر من رابط لنفس
        المنصة (مثلاً صفحتين فيسبوك) أو منصة تانية غير الأربعة دول.
      </p>

      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.id} className="bg-white/5 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <SocialIcon platform={l.platform} />
              </span>
              <input
                value={l.label}
                onChange={(e) => updateLink(l.id, { label: e.target.value })}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 outline-none text-xs min-w-[100px]"
              />
              <button
                onClick={() => updateLink(l.id, { enabled: !l.enabled })}
                className={`px-3 py-1.5 rounded-full text-[11px] shrink-0 border ${
                  l.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-white/40 border-white/15'
                }`}
                title={l.enabled ? 'ظاهر في الموقع — اضغط للإخفاء' : 'مخفي — اضغط للإظهار'}
              >
                {l.enabled ? 'ظاهر' : 'مخفي'}
              </button>
              <button onClick={() => removeLink(l.id)} className="text-red-400 text-xs shrink-0">
                حذف
              </button>
            </div>
            <input
              value={l.url}
              onChange={(e) => updateLink(l.id, { url: e.target.value })}
              placeholder={PLATFORM_LABELS.find((p) => p.id === l.platform)?.placeholder}
              dir="ltr"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 outline-none text-xs"
            />
          </li>
        ))}
      </ul>

      <div className="border-t border-white/10 pt-4 space-y-2">
        <h4 className="font-medium">إضافة رابط جديد</h4>
        <div className="flex flex-wrap gap-2">
          <select
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
          >
            {PLATFORM_LABELS.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#111]">
                {p.label}
              </option>
            ))}
          </select>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="اسم يظهر للزوار (اختياري)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none flex-1 min-w-[140px] text-xs"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="الرابط الكامل"
            dir="ltr"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none flex-1 min-w-[180px] text-xs"
          />
          <button onClick={addLink} className="bg-white text-black px-4 py-2 rounded-lg font-medium text-xs">
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentsTab() {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [numbers, setNumbers] = useState<PaymentNumbers>({});
  const [names, setNames] = useState<PaymentAccountNames>({});
  const [draftNumbers, setDraftNumbers] = useState<PaymentNumbers>({});
  const [draftNames, setDraftNames] = useState<PaymentAccountNames>({});
  const [postMsg, setPostMsg] = useState<PostPaymentMessage>({ ar: '', en: '' });
  const [saved, setSaved] = useState(false);
  const [newLabelAr, setNewLabelAr] = useState('');
  const [newLabelEn, setNewLabelEn] = useState('');
  const [newIcon, setNewIcon] = useState('💳');
  const [newRequiresNumber, setNewRequiresNumber] = useState(true);

  async function reload() {
    const [m, n, a, p] = await Promise.all([
      getAllPaymentMethods(),
      getPaymentNumbers(),
      getPaymentAccountNames(),
      getPostPaymentMessage(),
    ]);
    setMethods(m);
    setNumbers(n);
    setDraftNumbers(n);
    setNames(a);
    setDraftNames(a);
    setPostMsg(p);
  }

  useEffect(() => {
    reload();
  }, []);

  const walletMethods = methods.filter((m) => m.requiresNumber);

  async function save() {
    await Promise.all([
      setPaymentNumbers(draftNumbers),
      setPaymentAccountNames(draftNames),
      setPostPaymentMessage(postMsg),
    ]);
    setNumbers(draftNumbers);
    setNames(draftNames);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function toggle(id: string, enabled: boolean) {
    await togglePaymentMethod(id, enabled);
    reload();
  }

  async function changeIcon(id: string, icon: string) {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, icon } : m))); // instant feedback
    await updatePaymentMethod(id, { icon });
  }

  async function renameMethod(id: string, patch: { labelAr?: string; labelEn?: string }) {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    await updatePaymentMethod(id, patch);
  }

  async function addMethod() {
    if (!newLabelAr.trim()) return;
    await addCustomPaymentMethod({
      labelAr: newLabelAr.trim(),
      labelEn: newLabelEn.trim() || newLabelAr.trim(),
      requiresNumber: newRequiresNumber,
      icon: newIcon || '💳',
    });
    setNewLabelAr('');
    setNewLabelEn('');
    setNewIcon('💳');
    setNewRequiresNumber(true);
    reload();
  }

  // Nothing is locked anymore — built-in or custom, any method can be
  // removed. "استرجاع الطرق الافتراضية" below is the safety net.
  async function removeMethod(id: string) {
    if (!confirm('تحذف طريقة الدفع دي؟')) return;
    await removePaymentMethod(id);
    reload();
  }

  async function restoreDefaults() {
    if (!confirm('ترجع الطرق الأساسية التانية (كاش/إنستاباي/فودافون كاش/اتصالات كاش) من غير ما تمسح أي طريقة مخصصة ضفتها؟')) return;
    await restoreDefaultPaymentMethods();
    reload();
  }

  return (
    <div className="space-y-6 text-sm">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium">طرق الدفع المتاحة للعميل</h4>
          <button onClick={restoreDefaults} className="text-[11px] text-white/50 underline shrink-0">
            استرجاع الطرق الافتراضية
          </button>
        </div>
        <p className="text-white/40 text-xs mb-4">
          فعّل أو ألغِ أو عدّل أو احذف أي طريقة دفع من هنا — مفيش حاجة متقفلة، حتى الأربعة الأساسيين. غيّر
          الأيقونة أو الاسم زي ما يريحك، وتقدر تضيف طريقة دفع مخصصة (زي تحويل بنكي أو أي حاجة تانية).
        </p>
        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <input
                value={m.icon ?? ''}
                onChange={(e) => changeIcon(m.id, e.target.value)}
                className="w-9 h-9 text-center bg-white/10 border border-white/20 rounded-lg outline-none text-base shrink-0"
                maxLength={8}
                aria-label="أيقونة"
              />
              <input
                value={m.labelAr}
                onChange={(e) => renameMethod(m.id, { labelAr: e.target.value })}
                className="flex-1 min-w-[110px] bg-transparent border-b border-white/10 focus:border-white/40 outline-none text-white/80 px-1"
              />
              <input
                value={m.labelEn}
                onChange={(e) => renameMethod(m.id, { labelEn: e.target.value })}
                className="flex-1 min-w-[110px] bg-transparent border-b border-white/10 focus:border-white/40 outline-none text-white/40 text-xs px-1"
              />
              <div className="flex items-center gap-2 ms-auto">
                <button
                  onClick={() => toggle(m.id, !m.enabled)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    m.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'
                  }`}
                >
                  {m.enabled ? 'مفعّلة' : 'متوقفة'}
                </button>
                <button onClick={() => removeMethod(m.id)} className="text-red-400 text-xs">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="font-medium mb-2">إضافة طريقة دفع جديدة</h4>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 mb-2">
          <input
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="🏷️"
            maxLength={8}
            className="w-12 text-center bg-white/10 border border-white/20 rounded-lg px-2 py-2 outline-none"
          />
          <input
            value={newLabelAr}
            onChange={(e) => setNewLabelAr(e.target.value)}
            placeholder="الاسم بالعربي، مثال: تحويل بنكي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            value={newLabelEn}
            onChange={(e) => setNewLabelEn(e.target.value)}
            placeholder="Name in English"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-white/60 text-xs mb-3">
          <input type="checkbox" checked={newRequiresNumber} onChange={(e) => setNewRequiresNumber(e.target.checked)} />
          محتاجة رقم/حساب يتحوّل عليه (زي المحافظ الإلكترونية)
        </label>
        <button onClick={addMethod} className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-xs">
          + إضافة
        </button>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="font-medium mb-1">أرقام وأسماء المحافظ لاستقبال الدفع</h4>
        <p className="text-white/40 text-xs mb-4">
          الرقم واسم صاحب الحساب اللي هيظهروا للعميل لما يختار يدفع بأي من طرق التحويل دي، وهيتطلب منه بعدها يبعت
          اسكرين شوت الدفع حسب الرسالة اللي تحطها تحت. "كاش" ما بيحتاجش رقم — بيتحصّل عند التسليم.
        </p>
        <div className="space-y-3">
          {walletMethods.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <label className="w-28 shrink-0 text-white/70 text-xs">{m.icon} {m.labelAr}</label>
              <input
                value={draftNumbers[m.id] ?? ''}
                onChange={(e) => setDraftNumbers((d) => ({ ...d, [m.id]: e.target.value }))}
                placeholder="الرقم، مثال: 01094555299"
                dir="ltr"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none font-mono text-xs"
              />
              <input
                value={draftNames[m.id] ?? ''}
                onChange={(e) => setDraftNames((d) => ({ ...d, [m.id]: e.target.value }))}
                placeholder="الاسم المسجل على الرقم"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="font-medium mb-1">رسالة "ابعت اسكرين الدفع"</h4>
        <p className="text-white/40 text-xs mb-3">
          الرسالة اللي بتظهر للعميل بعد ما يختار طريقة دفع محتاجة تحويل، بتفكّره يبعت اسكرين شوت.
        </p>
        <textarea
          value={postMsg.ar}
          onChange={(e) => setPostMsg((p) => ({ ...p, ar: e.target.value }))}
          rows={2}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs mb-2"
          placeholder="بالعربي"
        />
        <textarea
          value={postMsg.en}
          onChange={(e) => setPostMsg((p) => ({ ...p, en: e.target.value }))}
          rows={2}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
          placeholder="In English"
        />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="bg-white text-black px-5 py-2 rounded-lg font-medium">
          حفظ كل حاجة فوق
        </button>
        {saved && <span className="text-emerald-400 text-xs">✓ اتحفظ</span>}
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="font-medium mb-2">معاينة — اللي هيظهر للعميل</h4>
        <div className="space-y-2">
          {walletMethods.map((m) => {
            const num = numbers[m.id];
            return (
              <div key={m.id} className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs">
                <span className="text-white/60">{m.icon} {m.labelAr}: </span>
                {num ? (
                  <span className="font-mono">{num}{names[m.id] ? ` — ${names[m.id]}` : ''}</span>
                ) : (
                  <span className="text-red-400">لسه متضافش رقم</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FeaturesTab() {
  const [features, setFeatures] = useState<FeatureSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getFeatureSettings().then(setFeatures);
  }, []);

  async function save(next: FeatureSettings) {
    setFeatures(next);
    await setFeatureSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  if (!features) return null;

  return (
    <div className="space-y-6 text-sm">
      <p className="text-white/40 text-xs">
        فعّل أو ألغِ أي ميزة من هنا وقت ما تحب. أي حاجة متقفلة هنا مالهاش أي تأثير على الموقع.
      </p>

      {/* Table / room number */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">رقم الترابيزة / الأوضة</h4>
            <p className="text-white/40 text-xs mt-1">
              يظهر حقل في شاشة إتمام الطلب يقول الطلب جاي من ترابيزة/أوضة رقم كام. مهم جدًا لو حاطط باركود على
              الترابيزات أو بتشتغل مع فنادق.
            </p>
          </div>
          <button
            onClick={() => save({ ...features, tableNumberEnabled: !features.tableNumberEnabled })}
            className={`px-4 py-1.5 rounded-full text-xs font-medium shrink-0 ${
              features.tableNumberEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'
            }`}
          >
            {features.tableNumberEnabled ? 'مفعّلة' : 'متوقفة'}
          </button>
        </div>
        {features.tableNumberEnabled && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={features.tableNumberLabelAr}
                onChange={(e) => setFeatures({ ...features, tableNumberLabelAr: e.target.value })}
                onBlur={() => save(features)}
                placeholder="اسم الحقل بالعربي"
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
              />
              <input
                value={features.tableNumberLabelEn}
                onChange={(e) => setFeatures({ ...features, tableNumberLabelEn: e.target.value })}
                onBlur={() => save(features)}
                placeholder="Field name in English"
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-white/60 text-xs">
              <input
                type="checkbox"
                checked={features.tableNumberRequired}
                onChange={(e) => save({ ...features, tableNumberRequired: e.target.checked })}
              />
              إجباري — العميل مايقدرش يبعت الطلب من غيره
            </label>
            <p className="text-white/30 text-[11px]">
              نصيحة: من تبويب "الباركود" تقدر تولّد باركود لكل ترابيزة برقمها تلقائي، فيبقى مفتاح الحقل ده يتملى
              لوحده لما العميل يمسح الباركود.
            </p>
          </div>
        )}
      </div>

      {/* Dine-in */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h4 className="font-medium">تناول في المكان (Dine-in)</h4>
          <p className="text-white/40 text-xs mt-1">
            يضيف "تناول في المكان" كخيار تالت جنب التوصيل والاستلام، مفيد لو العميل قاعد في المطعم أو الفندق.
          </p>
        </div>
        <button
          onClick={() => save({ ...features, dineInEnabled: !features.dineInEnabled })}
          className={`px-4 py-1.5 rounded-full text-xs font-medium shrink-0 ${
            features.dineInEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'
          }`}
        >
          {features.dineInEnabled ? 'مفعّلة' : 'متوقفة'}
        </button>
      </div>

      {/* Order confirmation screen */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h4 className="font-medium">شاشة تأكيد الطلب</h4>
          <p className="text-white/40 text-xs mt-1">
            بعد ما العميل يبعت الطلب على واتساب، يظهر له على الموقع نفسه "تم استلام طلبك" مع رقم الطلب وملخصه.
          </p>
        </div>
        <button
          onClick={() => save({ ...features, orderConfirmationEnabled: !features.orderConfirmationEnabled })}
          className={`px-4 py-1.5 rounded-full text-xs font-medium shrink-0 ${
            features.orderConfirmationEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'
          }`}
        >
          {features.orderConfirmationEnabled ? 'مفعّلة' : 'متوقفة'}
        </button>
      </div>

      {saved && <span className="text-emerald-400 text-xs block">✓ اتحفظ</span>}

      <div className="border-t border-white/10 pt-4">
        <h4 className="font-medium mb-2 text-white/70">قريبًا (المرحلة الجاية)</h4>
        <ul className="text-white/40 text-xs space-y-1.5 list-disc ps-4">
          <li>خيارات للصنف (سمول/ميديم/لارج، إضافات بسعر إضافي)</li>
          <li>وسم حساسية/نظام غذائي على كل صنف (نباتي، حار، خالي جلوتين)</li>
          <li>سجل طلبات سابقة للعميل لإعادة الطلب بضغطة واحدة</li>
          <li>تنبيه لحظي على جهاز تاني عند وصول أوردر جديد (يحتاج تفعيل تخزين سحابي)</li>
          <li>ورقة مطبخ (Kitchen ticket) — تصميم طباعة مبسط منفصل عن رسالة الواتساب</li>
        </ul>
      </div>
    </div>
  );
}

function ComplaintsTab() {
  const [numbers, setNumbers] = useState<ComplaintNumber[]>([]);
  const [labelAr, setLabelAr] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(true);

  async function reload() {
    setNumbers(await getComplaintNumbers());
  }

  useEffect(() => {
    reload();
  }, []);

  async function add() {
    if (!labelAr.trim() || !phone.trim()) return;
    const next: ComplaintNumber[] = [
      ...numbers,
      { id: crypto.randomUUID(), labelAr: labelAr.trim(), labelEn: labelEn.trim() || labelAr.trim(), phone: phone.trim(), whatsapp },
    ];
    await setComplaintNumbers(next);
    setNumbers(next);
    setLabelAr('');
    setLabelEn('');
    setPhone('');
    setWhatsapp(true);
  }

  async function remove(id: string) {
    const next = numbers.filter((n) => n.id !== id);
    await setComplaintNumbers(next);
    setNumbers(next);
  }

  return (
    <div className="space-y-6 text-sm">
      <div>
        <h4 className="font-medium mb-1">أرقام الشكاوي وخدمة العملاء</h4>
        <p className="text-white/40 text-xs mb-4">
          الأرقام دي هتظهر في آخر الموقع (الفوتر) عشان العميل يقدر يكلم خدمة العملاء أو يشتكي، منفصلة تمامًا عن
          رقم استقبال الطلبات على واتساب.
        </p>
        <div className="space-y-2">
          {numbers.map((n) => (
            <div key={n.id} className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <div>
                <span className="text-white/80">{n.labelAr}</span>
                <span className="text-white/40 text-xs font-mono ms-2" dir="ltr">{n.phone}</span>
                {n.whatsapp && <span className="ms-2 text-[10px] text-emerald-400">+ واتساب</span>}
              </div>
              <button onClick={() => remove(n.id)} className="text-red-400 text-xs">حذف</button>
            </div>
          ))}
          {numbers.length === 0 && <p className="text-white/30 text-xs">لسه مفيش أرقام شكاوي مضافة</p>}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-2">
        <h4 className="font-medium mb-2">إضافة رقم جديد</h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={labelAr}
            onChange={(e) => setLabelAr(e.target.value)}
            placeholder="مثال: خط الشكاوي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            placeholder="Label in English"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
        </div>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم الموبايل، مثال: 201094555299"
          dir="ltr"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none font-mono"
        />
        <label className="flex items-center gap-2 text-white/60 text-xs">
          <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} />
          إظهار زر واتساب جنب زر الاتصال
        </label>
        <button onClick={add} className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-xs">
          + إضافة
        </button>
      </div>
    </div>
  );
}

function OperationsTab() {
  const [hours, setHours] = useState<OperatingHoursSettings | null>(null);
  const [rules, setRules] = useState<OrderRulesSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newClosed, setNewClosed] = useState(true);
  const [newOpen, setNewOpen] = useState('12:00');
  const [newClose, setNewClose] = useState('00:00');
  const [currency, setCurrencyState] = useState<CurrencySettings>(CURRENCY_PRESETS[0]);

  useEffect(() => {
    (async () => {
      setHours(await getOperatingHours());
      setRules(await getOrderRules());
      setCurrencyState(await getCurrency());
    })();
  }, []);

  function updateDay(day: number, patch: Partial<OperatingHoursSettings['days'][number]>) {
    setHours((h) => (h ? { ...h, days: h.days.map((d) => (d.day === day ? { ...d, ...patch } : d)) } : h));
  }

  function applyToAllDays(day: number) {
    setHours((h) => {
      if (!h) return h;
      const source = h.days.find((d) => d.day === day)!;
      return {
        ...h,
        days: h.days.map((d) => ({ ...d, closed: source.closed, openTime: source.openTime, closeTime: source.closeTime })),
      };
    });
  }

  function addDateOverride() {
    if (!newDate || !hours) return;
    const entry = {
      date: newDate,
      label: newLabel.trim() || undefined,
      closed: newClosed,
      openTime: newClosed ? undefined : newOpen,
      closeTime: newClosed ? undefined : newClose,
    };
    setHours({
      ...hours,
      dateOverrides: [...(hours.dateOverrides ?? []).filter((o) => o.date !== newDate), entry].sort((a, b) =>
        a.date < b.date ? -1 : 1
      ),
    });
    setNewDate('');
    setNewLabel('');
  }

  function removeDateOverride(date: string) {
    setHours((h) => (h ? { ...h, dateOverrides: (h.dateOverrides ?? []).filter((o) => o.date !== date) } : h));
  }

  async function save() {
    if (hours) await setOperatingHours(hours);
    if (rules) await setOrderRules(rules);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!hours || !rules) return <p className="text-white/40 text-sm">جارٍ التحميل...</p>;

  return (
    <div className="space-y-8 text-sm">
      {/* Operating hours */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium">مواعيد العمل — مفتوح / مقفول</h4>
          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={hours.enabled}
              onChange={(e) => setHours({ ...hours, enabled: e.target.checked })}
            />
            تفعيل المواعيد
          </label>
        </div>
        <p className="text-white/40 text-xs mb-4">
          الخاصية دي متعطّلة افتراضيًا — العميل هيشوف الموقع عادي بدون أي تغيير طالما مفعّلهاش. لو فعّلتها، هتظهر
          شارة "مفتوح الآن / مقفول دلوقتي" تلقائيًا حسب الساعة الحالية، وترجع تلقائي زي ما كانت لو رجعت تعطّلها.
        </p>

        {hours.enabled && (
          <div className="space-y-2">
            {hours.days.map((d) => (
              <div key={d.day} className="flex flex-wrap items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2.5">
                <span className="w-20 shrink-0 text-white/70">{WEEKDAY_LABELS[d.day].ar}</span>
                <label className="flex items-center gap-1.5 text-xs text-white/50">
                  <input type="checkbox" checked={d.closed} onChange={(e) => updateDay(d.day, { closed: e.target.checked })} />
                  مقفول طول اليوم
                </label>
                {!d.closed && (
                  <>
                    <input
                      type="time"
                      value={d.openTime}
                      onChange={(e) => updateDay(d.day, { openTime: e.target.value })}
                      className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 outline-none text-xs"
                    />
                    <span className="text-white/30 text-xs">حتى</span>
                    <input
                      type="time"
                      value={d.closeTime}
                      onChange={(e) => updateDay(d.day, { closeTime: e.target.value })}
                      className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 outline-none text-xs"
                    />
                  </>
                )}
                <button
                  onClick={() => applyToAllDays(d.day)}
                  className="text-[11px] text-white/40 underline ms-auto"
                  title="طبّق نفس المواعيد على كل الأيام"
                >
                  طبّق على الكل
                </button>
              </div>
            ))}

            {/* Holidays / one-off closing dates — always override the weekly schedule above */}
            <div className="pt-4 mt-2 border-t border-white/10">
              <h5 className="text-white/70 font-medium mb-1">إجازات ومواعيد خاصة</h5>
              <p className="text-white/40 text-xs mb-3">
                تاريخ معين هيكون مقفول كله (زي عيد أو مناسبة) أو بمواعيد مختلفة عن المعتاد — بيلغي مواعيد اليوم
                العادية تلقائيًا في التاريخ ده بس، وبعدها يرجع الموقع لمواعيده المعتادة.
              </p>

              {(hours.dateOverrides ?? []).length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {(hours.dateOverrides ?? []).map((o) => (
                    <div key={o.date} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs">
                      <span className="font-mono text-white/70">{o.date}</span>
                      {o.label && <span className="text-white/50">— {o.label}</span>}
                      <span className={o.closed ? 'text-red-400' : 'text-emerald-400'}>
                        {o.closed ? 'مقفول' : `${o.openTime} - ${o.closeTime}`}
                      </span>
                      <button onClick={() => removeDateOverride(o.date)} className="text-red-400 ms-auto">
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs" />
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="اسم المناسبة (اختياري)"
                  className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs flex-1 min-w-[120px]" />
                <label className="flex items-center gap-1.5 text-xs text-white/50">
                  <input type="checkbox" checked={newClosed} onChange={(e) => setNewClosed(e.target.checked)} />
                  مقفول كامل
                </label>
                {!newClosed && (
                  <>
                    <input type="time" value={newOpen} onChange={(e) => setNewOpen(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs" />
                    <span className="text-white/30 text-xs">حتى</span>
                    <input type="time" value={newClose} onChange={(e) => setNewClose(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs" />
                  </>
                )}
                <button onClick={addDateOverride} className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-medium">
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Minimum order + delivery fee */}
      <div className="border-t border-white/10 pt-6">
        <h4 className="font-medium mb-1">الحد الأدنى للطلب ورسوم التوصيل</h4>
        <p className="text-white/40 text-xs mb-4">
          الاتنين متعطّلين افتراضيًا — أي طلب عادي (توصيل أو استلام) هيتبعت زي ما هو من غير أي رسوم أو حد أدنى
          لحد ما تفعّلهم إنت بنفسك من هنا. الحد الأدنى بيتطبّق على طلبات التوصيل بس (الاستلام من الفرع مستثنى).
          رسوم التوصيل بتتضاف مرة واحدة
          على الطلب وتظهر للعميل قبل الإرسال، وتقدر تحدد حد إعفاء منها لو الطلب كبير.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 w-56 shrink-0">
              <input
                type="checkbox"
                checked={rules.minOrderEnabled}
                onChange={(e) => setRules({ ...rules, minOrderEnabled: e.target.checked })}
              />
              حد أدنى للطلب (توصيل فقط)
            </label>
            <input
              type="number"
              min={0}
              disabled={!rules.minOrderEnabled}
              value={rules.minOrderAmount}
              onChange={(e) => setRules({ ...rules, minOrderAmount: Number(e.target.value) })}
              className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none disabled:opacity-40"
            />
            <span className="text-white/40 text-xs">{currency.symbolAr}</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 w-56 shrink-0">
              <input
                type="checkbox"
                checked={rules.deliveryFeeEnabled}
                onChange={(e) => setRules({ ...rules, deliveryFeeEnabled: e.target.checked })}
              />
              رسوم توصيل ثابتة
            </label>
            <input
              type="number"
              min={0}
              disabled={!rules.deliveryFeeEnabled}
              value={rules.deliveryFeeAmount}
              onChange={(e) => setRules({ ...rules, deliveryFeeAmount: Number(e.target.value) })}
              className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none disabled:opacity-40"
            />
            <span className="text-white/40 text-xs">{currency.symbolAr}</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 w-56 shrink-0 text-white/70">توصيل مجاني فوق</label>
            <input
              type="number"
              min={0}
              disabled={!rules.deliveryFeeEnabled}
              value={rules.freeDeliveryThreshold ?? ''}
              placeholder="اختياري"
              onChange={(e) =>
                setRules({ ...rules, freeDeliveryThreshold: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none disabled:opacity-40"
            />
            <span className="text-white/40 text-xs">{currency.symbolAr}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="bg-white text-black px-5 py-2 rounded-lg font-medium">
          حفظ مواعيد العمل والتوصيل
        </button>
        {saved && <span className="text-emerald-400 text-xs">✓ اتحفظ</span>}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [filter, setFilter] = useState<'all' | PaymentMethod>('all');
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [currency, setCurrencyState] = useState<CurrencySettings>(CURRENCY_PRESETS[0]);

  async function refresh() {
    const all = await listItems<OrderRecord>('orders');
    // Newest first.
    setOrders(all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }
  useEffect(() => {
    refresh();
    getAllPaymentMethods().then(setMethods);
    getCurrency().then(setCurrencyState);
  }, []);

  function deliveryLabel(d?: string) {
    if (d === 'pickup') return 'استلام من الفرع';
    if (d === 'dine_in') return 'تناول في المكان';
    return 'توصيل';
  }

  async function removeOrder(id: string) {
    await softDeleteItem('orders', id); // goes to trash, recoverable
    refresh();
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.paymentMethod === filter);
  const todayKey = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === todayKey);
  const todayTotal = todayOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="font-medium">سجل الطلبات ({orders.length})</h4>
          <p className="text-white/40 text-xs mt-0.5">
            النهاردة: {todayOrders.length} طلب — إجمالي {todayTotal} {currency.symbolAr}
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | PaymentMethod)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs outline-none"
        >
          <option value="all">كل طرق الدفع</option>
          {methods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.labelAr}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-white/40">لسه مفيش طلبات{filter !== 'all' ? ' بالفلتر ده' : ''}.</p>
      ) : (
        <ul className="space-y-2 max-h-[65vh] overflow-y-auto">
          {filtered.map((o) => {
            const method = methods.find((m) => m.id === o.paymentMethod);
            return (
              <li key={o.id} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{o.customer.name} — {o.customer.phone}</span>
                  <span className="text-white/40 text-[11px] shrink-0">
                    {new Date(o.createdAt).toLocaleString('ar-EG')}
                  </span>
                </div>
                {o.customer.address && <p className="text-white/50 text-xs">📍 {o.customer.address}</p>}

                <ul className="text-xs text-white/70 space-y-0.5">
                  {o.lines.map((l) => (
                    <li key={l.itemId}>
                      • {l.nameAr} × {l.qty} — {l.price * l.qty} {currency.symbolAr}
                      {l.notes && <span className="text-white/40"> ({l.notes})</span>}
                    </li>
                  ))}
                </ul>
                {o.generalNote && <p className="text-white/50 text-xs">ملاحظة: {o.generalNote}</p>}
                {(o.customer as any).tableNumber && (
                  <p className="text-white/50 text-xs">🔢 رقم الترابيزة/الأوضة: {(o.customer as any).tableNumber}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {method && (
                      <span className="bg-white/10 px-2 py-0.5 rounded-full text-[11px]">{method.labelAr}</span>
                    )}
                    {o.paymentNumberUsed && (
                      <span className="bg-white/10 px-2 py-0.5 rounded-full text-[11px] font-mono">
                        {o.paymentNumberUsed}
                      </span>
                    )}
                    {o.deliveryMethod && (
                      <span className="bg-white/10 px-2 py-0.5 rounded-full text-[11px]">
                        {deliveryLabel(o.deliveryMethod)}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">{o.total} {currency.symbolAr}</span>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => removeOrder(o.id)} className="text-red-400 text-xs">
                    حذف (لسلة المهملات)
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StorageTab() {
  const [provider, setProvider] = useState<StorageProvider>('local');
  const [creds, setCreds] = useState<ProviderCredentials>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [liveStatus, setLiveStatus] = useState<SyncStatus>({ state: 'idle' });

  useEffect(() => {
    getSetting<StorageProvider>('settings.storageProvider', 'local').then(setProvider);
    getSetting<ProviderCredentials>('settings.providerCredentials', {}).then(setCreds);
    return onSyncStatusChange(setLiveStatus);
  }, []);

  async function selectProvider(p: StorageProvider) {
    setProvider(p);
    await setSetting('settings.storageProvider', p);
    // Local data is never touched by switching — only where it syncs to.
    startRealtimeSync();
  }

  const credsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  async function saveCreds(next: ProviderCredentials) {
    setCreds(next);
    await setSetting('settings.providerCredentials', next);
    // Debounced: this fires on every keystroke while typing a URL/key, and
    // we don't want to open/close a realtime connection on every character.
    if (credsSaveTimer.current) clearTimeout(credsSaveTimer.current);
    credsSaveTimer.current = setTimeout(() => startRealtimeSync(), 800);
  }

  async function syncNow() {
    setBusy(true);
    setStatus('');
    try {
      const adapter = adapters[provider];
      if (!adapter.isConfigured(creds)) {
        setStatus('لازم تدخل بيانات الاتصال الأول');
      } else {
        const snapshot = await getFullSnapshot();
        await adapter.push(snapshot, creds);
        const pulled = await adapter.pull(creds);
        if (pulled) await mergeSnapshot(pulled);
        setStatus('اتزامن بنجاح ✅ — البيانات المحلية اتحفظت زي ما هي برضو');
      }
    } catch (e: any) {
      // Show the real error (e.g. "GitHub write failed: 401 Bad credentials")
      // instead of a generic message — this is what tells you WHAT is
      // actually wrong (bad token, wrong repo name, network, etc.) instead
      // of just that something is.
      setStatus(`❌ ${e?.message || 'حصل خطأ أثناء المزامنة'}`);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5 text-sm">
      <p className="text-white/50 text-xs">
        البيانات دايمًا محفوظة على الجهاز أول حاجة (يعني الموقع بيشتغل حتى من غير نت). اختيار مكان التخزين هنا
        بيشغّل مزامنة اختيارية فوق كده — ومفيش حاجة بتتمسح لما تغيّر أو تنقل بين الخيارات.
      </p>

      {provider !== 'local' && (
        <p className="text-[11px] leading-relaxed rounded-lg border border-white/10 px-3 py-2 text-white/60">
          {provider === 'github'
            ? '⏱️ جيت هاب مفيهوش تنبيه فوري (مستودع ملفات مش قاعدة بيانات حية) — الموقع بيتفحص كل ١٠ ثواني تقريبًا، فالتغيير هيظهر بعد شوية ثواني، مش في نفس اللحظة.'
            : '⚡ متصل لحظيًا — أي تعديل (إضافة/حذف/تغيير) هيظهر عند كل الزوار فورًا من غير ما حد يعمل ريفريش.'}
        </p>
      )}

      {provider !== 'local' && adapters[provider].isConfigured(creds) && (
        <div
          className={`text-xs rounded-lg px-3 py-2 border ${
            liveStatus.state === 'error'
              ? 'border-red-500/30 text-red-300'
              : liveStatus.state === 'syncing'
                ? 'border-white/20 text-white/70'
                : 'border-emerald-500/30 text-emerald-300'
          }`}
        >
          {liveStatus.state === 'syncing' && '⏳ جاري حفظ آخر تعديل تلقائيًا...'}
          {liveStatus.state === 'ok' &&
            `✅ آخر حفظ تلقائي ناجح${liveStatus.lastSyncedAt ? ` — ${new Date(liveStatus.lastSyncedAt).toLocaleString('ar-EG')}` : ''}`}
          {liveStatus.state === 'error' && `⚠️ ${liveStatus.message}`}
          {liveStatus.state === 'idle' && 'المزامنة التلقائية شغالة — أي تعديل هيتزامن لوحده'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(['local', 'supabase', 'firebase', 'github'] as StorageProvider[]).map((p) => (
          <button
            key={p}
            onClick={() => selectProvider(p)}
            className={`px-3 py-2 rounded-lg border text-xs ${
              provider === p ? 'bg-white text-black border-white' : 'border-white/20 text-white/70 hover:bg-white/10'
            }`}
          >
            {p === 'local' ? 'محلي فقط (بدون سحابة)' : p}
          </button>
        ))}
      </div>

      {provider === 'supabase' && (
        <div className="space-y-2">
          <input placeholder="Supabase Project URL" value={creds.supabase?.url ?? ''}
            onChange={(e) => saveCreds({ ...creds, supabase: { url: e.target.value, anonKey: creds.supabase?.anonKey ?? '' } })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
          <input placeholder="Anon Key" value={creds.supabase?.anonKey ?? ''}
            onChange={(e) => saveCreds({ ...creds, supabase: { url: creds.supabase?.url ?? '', anonKey: e.target.value } })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
        </div>
      )}

      {provider === 'firebase' && (
        <div className="space-y-2">
          <input placeholder="API Key" value={creds.firebase?.apiKey ?? ''}
            onChange={(e) => saveCreds({ ...creds, firebase: { ...creds.firebase, apiKey: e.target.value, projectId: creds.firebase?.projectId ?? '', appId: creds.firebase?.appId ?? '' } })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
          <input placeholder="Project ID" value={creds.firebase?.projectId ?? ''}
            onChange={(e) => saveCreds({ ...creds, firebase: { ...creds.firebase, projectId: e.target.value, apiKey: creds.firebase?.apiKey ?? '', appId: creds.firebase?.appId ?? '' } })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
          <input placeholder="App ID" value={creds.firebase?.appId ?? ''}
            onChange={(e) => saveCreds({ ...creds, firebase: { ...creds.firebase, appId: e.target.value, apiKey: creds.firebase?.apiKey ?? '', projectId: creds.firebase?.projectId ?? '' } })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
        </div>
      )}

      {provider === 'github' && (
        <div className="space-y-2">
          <p className="text-xs text-white/60">
            التوكن بقى مُخزّن على السيرفر بس (Vercel → Environment Variables →
            GITHUB_TOKEN)، مش هنا — عشان محدش من الزوار يقدر يوصله. محتاج بس
            اسم صاحب المستودع والمستودع تحت.
          </p>
          <input placeholder="Owner (username/org)" value={creds.github?.owner ?? ''}
            onChange={(e) => saveCreds({ ...creds, github: { ...creds.github, owner: e.target.value, repo: creds.github?.repo ?? '', branch: creds.github?.branch ?? 'main' } })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
          <input placeholder="Repo name" value={creds.github?.repo ?? ''}
            onChange={(e) => saveCreds({ ...creds, github: { ...creds.github, repo: e.target.value, owner: creds.github?.owner ?? '', branch: creds.github?.branch ?? 'main' } })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
          <input placeholder="Branch (main)" value={creds.github?.branch ?? 'main'}
            onChange={(e) => saveCreds({ ...creds, github: { ...creds.github, branch: e.target.value, owner: creds.github?.owner ?? '', repo: creds.github?.repo ?? '' } })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
        </div>
      )}

      {provider !== 'local' && (
        <button onClick={syncNow} disabled={busy} className="bg-white text-black px-4 py-2 rounded-lg font-medium disabled:opacity-50">
          {busy ? 'جاري المزامنة...' : 'مزامنة الآن'}
        </button>
      )}
      {status && <p className="text-white/70 text-xs">{status}</p>}
    </div>
  );
}

function PasswordTab() {
  const [master, setMaster] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');

  async function handleChange() {
    const ok = await changeLoginPassword(master, newPw);
    setMsg(ok ? 'اتغير الباسورد بنجاح ✅' : 'الباسورد الرئيسي غلط أو الباسورد الجديد قصير');
    if (ok) {
      setMaster('');
      setNewPw('');
    }
  }

  return (
    <div className="space-y-3 text-sm max-w-xs">
      <label className="block text-white/60">الباسورد الرئيسي (للتأكيد)</label>
      <input
        type="password"
        value={master}
        onChange={(e) => setMaster(e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-white/50"
      />
      <label className="block text-white/60">الباسورد الجديد</label>
      <input
        type="password"
        value={newPw}
        onChange={(e) => setNewPw(e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-white/50"
      />
      <button onClick={handleChange} className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-white/90">
        حفظ
      </button>
      {msg && <p className="text-white/70">{msg}</p>}
    </div>
  );
}

// Password-gated (own password, "jo" — see checkIconCodePassword) tab for
// the developer's own credit block: logo, brand text, contact numbers, and
// the "worked in these countries" flag strip. Locks again every time the
// tab is left, same pattern as the outer settings panel itself.
function IconCodeTab() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  async function handleLogin() {
    const ok = await checkIconCodePassword(pwInput);
    if (ok) {
      setAuthed(true);
      setPwError('');
      setPwInput('');
    } else {
      setPwError('باسورد غلط');
    }
  }

  if (!authed) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <p className="text-white/70 text-sm">القسم ده خاص بفريق Icon Code — ادخل الباسورد الخاص بيه</p>
        <input
          type="password"
          value={pwInput}
          onChange={(e) => setPwInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          autoFocus
          className="w-56 text-center bg-white/10 border border-white/20 rounded-lg px-4 py-2 outline-none focus:border-white/50"
        />
        {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
        <button onClick={handleLogin} className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/90">
          دخول
        </button>
      </div>
    );
  }

  return <IconCodeEditor />;
}

function IconCodeEditor() {
  const [settings, setSettings] = useState<IconCodeSettings | null>(null);
  const [flags, setFlags] = useState<IconCodeFlag[]>([]);
  const [saved, setSaved] = useState(false);

  async function reload() {
    const [s, f] = await Promise.all([getIconCodeSettings(), getIconCodeFlags()]);
    setSettings(s);
    setFlags(f);
  }
  useEffect(() => {
    reload();
  }, []);

  async function save(next: IconCodeSettings) {
    setSettings(next);
    await setIconCodeSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  async function saveFlags(next: IconCodeFlag[]) {
    setFlags(next);
    await setIconCodeFlags(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function updateNumber(id: string, patch: Partial<IconCodeNumber>) {
    if (!settings) return;
    save({ ...settings, numbers: settings.numbers.map((n) => (n.id === id ? { ...n, ...patch } : n)) });
  }

  function addNumber() {
    if (!settings) return;
    const n: IconCodeNumber = { id: crypto.randomUUID(), label: 'رقم جديد', phone: '', whatsapp: true };
    save({ ...settings, numbers: [...settings.numbers, n] });
  }

  function removeNumber(id: string) {
    if (!settings) return;
    save({ ...settings, numbers: settings.numbers.filter((n) => n.id !== id) });
  }

  function toggleFlag(code: string) {
    saveFlags(flags.map((f) => (f.code === code ? { ...f, enabled: !f.enabled } : f)));
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 text-sm">
      <p className="text-white/40 text-xs">
        كل حاجة هنا خاصة بشعار وأرقام وعلامات فريق Icon Code — مش بيانات المطعم. أي تغيير بيظهر في شريط "تصميم
        وتطوير" في آخر الموقع.
      </p>

      <div className="border border-white/10 rounded-xl p-4 space-y-3">
        <h4 className="font-medium">الشعار</h4>
        <MediaUploadField
          value={settings.logoUrl}
          onChange={(v) => save({ ...settings, logoUrl: v })}
          previewClassName="w-16 h-16 rounded-full object-cover"
          hint="ارفع لوجو من جهازك أو الصق رابط. سيب الخانة فاضية عشان يرجع الشكل الافتراضي (الدائرة الذهبية المتحركة)."
        />
      </div>

      <div className="border border-white/10 rounded-xl p-4 space-y-3">
        <h4 className="font-medium">النصوص</h4>
        <div className="space-y-1.5">
          <label className="block text-white/60 text-xs">اسم الفريق (يظهر جوه الشعار وكعنوان)</label>
          <input
            value={settings.brandText}
            onChange={(e) => save({ ...settings, brandText: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-white/60 text-xs">التسمية بالعربي (مثال: تصميم وتطوير)</label>
            <input
              value={settings.labelAr}
              onChange={(e) => save({ ...settings, labelAr: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-white/60 text-xs">Label in English</label>
            <input
              value={settings.labelEn}
              onChange={(e) => save({ ...settings, labelEn: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-white/60 text-xs">الجملة التعريفية بالعربي</label>
          <textarea
            value={settings.taglineAr}
            onChange={(e) => save({ ...settings, taglineAr: e.target.value })}
            rows={2}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-white/60 text-xs">Tagline in English</label>
          <textarea
            value={settings.taglineEn}
            onChange={(e) => save({ ...settings, taglineEn: e.target.value })}
            rows={2}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
          />
        </div>
      </div>

      <div className="border border-white/10 rounded-xl p-4 space-y-3">
        <h4 className="font-medium">الأرقام والواتساب</h4>
        <div className="space-y-3">
          {settings.numbers.map((n) => (
            <div key={n.id} className="flex flex-wrap items-center gap-2 bg-white/5 rounded-lg p-2">
              <input
                value={n.label}
                onChange={(e) => updateNumber(n.id, { label: e.target.value })}
                placeholder="اسم الرقم"
                className="w-28 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs"
              />
              <input
                value={n.phone}
                onChange={(e) => updateNumber(n.id, { phone: e.target.value.replace(/[^\d]/g, '') })}
                placeholder="الرقم بالكود الدولي، مثال: 201094555299"
                dir="ltr"
                className="flex-1 min-w-[160px] bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs"
              />
              <label className="flex items-center gap-1.5 text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={n.whatsapp}
                  onChange={(e) => updateNumber(n.id, { whatsapp: e.target.checked })}
                />
                واتساب
              </label>
              <button onClick={() => removeNumber(n.id)} className="text-red-400 text-[11px]">
                حذف
              </button>
            </div>
          ))}
        </div>
        <button onClick={addNumber} className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-xs">
          + إضافة رقم
        </button>
      </div>

      <div className="border border-white/10 rounded-xl p-4 space-y-3">
        <h4 className="font-medium">الدول اللي سبق واشتغلنا فيها</h4>
        <p className="text-white/40 text-xs">
          علم السعودية ثابت مش بيلف، وباقي الأعلام المفعّلة بتلف بشكل مستمر. اضغط على أي علم عشان تفعّله أو توقفه.
        </p>
        <div className="flex flex-wrap gap-2">
          {ICON_CODE_FLAG_ROSTER.map((f) => {
            const state = flags.find((x) => x.code === f.code);
            const enabled = state?.enabled ?? true;
            return (
              <button
                key={f.code}
                onClick={() => toggleFlag(f.code)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
                  enabled ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-white/30 line-through'
                }`}
              >
                <span className="text-base">{f.emoji}</span>
                {f.nameAr}
                {f.code === 'sa' && <span className="text-[10px] text-[#EEC31C]">ثابت</span>}
              </button>
            );
          })}
        </div>
      </div>

      {saved && <span className="text-emerald-400 text-xs">✓ اتحفظ</span>}
    </div>
  );
}
