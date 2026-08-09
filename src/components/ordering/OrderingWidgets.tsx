import { useEffect, useState } from 'react';
import { useCart } from '../../lib/CartContext';
import { useLanguage } from '../../lib/LanguageContext';
import { getMyProfile, saveMyProfile } from '../../lib/customer';
import { sendOrderToWhatsApp, type CheckoutChoice } from '../../lib/whatsapp';
import {
  getEnabledPaymentMethods,
  getPaymentNumbers,
  getPaymentAccountNames,
  getPostPaymentMessage,
  type PaymentMethodConfig,
  type PaymentNumbers,
  type PaymentAccountNames,
  type PostPaymentMessage,
} from '../../lib/payments';
import { getOrderRules, computeDeliveryFee, type OrderRulesSettings } from '../../lib/ops';
import { getFeatureSettings, tableNumberFromUrl, type FeatureSettings } from '../../lib/features';
import { getCurrency, type CurrencySettings, CURRENCY_PRESETS } from '../../lib/currency';
import { listItems, onDataChange } from '../../lib/store';
import { getSiteText, type TextOverride } from '../../lib/siteTexts';
import type { MenuItem, PaymentMethod, DeliveryMethod, Customer, OrderRecord, MenuItemSize, Extra } from '../../lib/types';

// ---------------- Shared editable text for the whole ordering flow ----------------
// Every label/placeholder/button in the checkout gate, cart drawer and order
// confirmation screen is editable from Settings → كل نصوص الموقع (keys under
// order.*) instead of being fixed in this file. Falls back to the original
// wording until the admin overrides it — same pattern as the rest of the site.
const ORDER_TEXT_DEFAULTS = {
  receivedTitle: { ar: 'تم استلام طلبك!', en: 'Your order was received!' },
  total: { ar: 'الإجمالي', en: 'Total' },
  gotIt: { ar: 'تمام', en: 'Got it' },
  missingWithAddress: { ar: 'من فضلك اكتب الاسم ورقم الموبايل والعنوان', en: 'Please enter your name, phone and address' },
  missingNoAddress: { ar: 'من فضلك اكتب الاسم ورقم الموبايل', en: 'Please enter your name and phone' },
  deliveryOption: { ar: 'توصيل', en: 'Delivery' },
  pickupOption: { ar: 'استلام من الفرع', en: 'Pickup' },
  dineInOption: { ar: 'تناول في المكان', en: 'Dine-in' },
  completeOrderTitle: { ar: 'إتمام الطلب', en: 'Complete your order' },
  namePlaceholder: { ar: 'الاسم', en: 'Name' },
  phonePlaceholder: { ar: 'رقم الموبايل', en: 'Phone number' },
  deliveryMethodLabel: { ar: 'طريقة الاستلام', en: 'How will you get your order?' },
  addressPlaceholder: { ar: 'العنوان', en: 'Address' },
  optionalLabel: { ar: 'اختياري', en: 'optional' },
  paymentMethodLabel: { ar: 'طريقة الدفع', en: 'Payment method' },
  sendToNumber: { ar: 'حوّل قيمة الطلب على رقم', en: 'Send the order total to' },
  noPaymentNumberWarning: {
    ar: 'رقم الدفع لسه متضافش من الإعدادات — اختر كاش أو كلم الإدارة',
    en: 'Payment number not set up yet in Settings — choose cash or contact the restaurant',
  },
  extrasLabel: { ar: 'إضافات (اختياري)', en: 'Extras (optional)' },
  sendWhatsapp: { ar: 'إرسال الطلب على واتساب', en: 'Send order via WhatsApp' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  hotTag: { ar: 'سخن', en: 'Hot' },
  coldTag: { ar: 'بارد', en: 'Cold' },
  orderNowButton: { ar: 'اطلب الآن', en: 'Order Now' },
  addToGroupOrder: { ar: 'أضف للطلب الجماعي', en: 'Add to group order' },
  tapToReview: { ar: 'اضغط للمراجعة والإرسال', en: 'Tap to review & send' },
  groupOrderTitle: { ar: 'طلبك الجماعي', en: 'Your group order' },
  emptyCart: { ar: 'السلة فاضية', en: 'Your cart is empty' },
  removeButton: { ar: 'حذف', en: 'Remove' },
  imageLinksNote: {
    ar: 'روابط صور الأصناف اللي ليها رابط عام هتتبعت مع رسالة الطلب على واتساب.',
    en: 'Public image links for items that have one will be sent along with the WhatsApp order message.',
  },
  orderNotePlaceholder: { ar: 'ملاحظة عامة على الطلب كله', en: 'General note for the whole order' },
  sendOrderButton: { ar: 'إرسال الطلب', en: 'Send order' },
} as const;

type OrderTextKey = keyof typeof ORDER_TEXT_DEFAULTS;
type OrderTexts = Record<OrderTextKey, TextOverride>;

function defaultOrderTexts(): OrderTexts {
  return { ...ORDER_TEXT_DEFAULTS } as OrderTexts;
}

function useOrderTexts(): OrderTexts {
  const [texts, setTexts] = useState<OrderTexts>(defaultOrderTexts);
  useEffect(() => {
    function load() {
      const keys = Object.keys(ORDER_TEXT_DEFAULTS) as OrderTextKey[];
      Promise.all(
        keys.map((key) => {
          const fallback = ORDER_TEXT_DEFAULTS[key];
          return getSiteText(`order.${key}`, fallback.ar, fallback.en).then((v) => [key, v] as const);
        })
      ).then((entries) => setTexts(Object.fromEntries(entries) as OrderTexts));
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings') load();
    });
  }, []);
  return texts;
}

// ---------------- Customer registration + checkout gate ----------------
// Shown before every order: name/phone/address are pre-filled from the
// visitor's saved profile (so repeat customers barely have to type), but
// payment method, delivery/pickup and table number are asked every single
// time since those can change order to order.

export interface CheckoutResult {
  customer: Customer;
  checkout: CheckoutChoice;
}

let pendingResolve: ((v: CheckoutResult | null) => void) | null = null;
let openGateSetter: ((v: boolean) => void) | null = null;

function requestCheckout(): Promise<CheckoutResult | null> {
  return new Promise((resolve) => {
    pendingResolve = resolve;
    openGateSetter?.(true);
  });
}

export async function ensureCheckoutDetails(): Promise<CheckoutResult | null> {
  return requestCheckout();
}

// ---------------- Order confirmation screen (shown after sending) ----------------

let confirmSetter: ((order: OrderRecord | null) => void) | null = null;

function showOrderConfirmation(order: OrderRecord) {
  confirmSetter?.(order);
}

export function OrderConfirmationModal() {
  const { t, dir } = useLanguage();
  const ot = useOrderTexts();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [currency, setCurrencyState] = useState<CurrencySettings>(CURRENCY_PRESETS[0]);

  useEffect(() => {
    confirmSetter = setOrder;
    return () => {
      confirmSetter = null;
    };
  }, []);

  useEffect(() => {
    if (order) getCurrency().then(setCurrencyState);
  }, [order]);

  if (!order) return null;
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="fixed inset-0 z-[210] bg-black/80 flex items-center justify-center p-4" dir={dir}>
      <div className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-6 space-y-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center text-3xl">
          ✅
        </div>
        <h3 className="text-lg font-semibold">{t(ot.receivedTitle.ar, ot.receivedTitle.en)}</h3>
        <p className="text-white/60 text-sm">
          {t(
            `رقم طلبك ${shortId} — هنتواصل معاك على واتساب دلوقتي، تابع المحادثة اللي فتحت.`,
            `Order #${shortId} — we'll follow up on WhatsApp, keep an eye on the chat that just opened.`
          )}
        </p>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-start space-y-1">
          {order.lines.map((l) => (
            <div key={l.itemId} className="flex justify-between text-white/70">
              <span>{t(l.nameAr, l.nameEn)} × {l.qty}</span>
              <span>{l.price * l.qty} {t(currency.symbolAr, currency.symbolEn)}</span>
            </div>
          ))}
          {order.extras?.map((ex) => (
            <div key={ex.id} className="flex justify-between text-white/70">
              <span>+ {t(ex.nameAr, ex.nameEn)}</span>
              <span>{ex.price} {t(currency.symbolAr, currency.symbolEn)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-2 border-t border-white/10 mt-2">
            <span>{t(ot.total.ar, ot.total.en)}</span>
            <span>{order.total} {t(currency.symbolAr, currency.symbolEn)}</span>
          </div>
        </div>
        <button
          onClick={() => setOrder(null)}
          className="w-full bg-white text-black rounded-lg py-2 font-medium"
        >
          {t(ot.gotIt.ar, ot.gotIt.en)}
        </button>
      </div>
    </div>
  );
}

export function CustomerGateModal() {
  const { t, dir } = useLanguage();
  const ot = useOrderTexts();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumbers>({});
  const [accountNames, setAccountNames] = useState<PaymentAccountNames>({});
  const [postMsg, setPostMsg] = useState<PostPaymentMessage | null>(null);
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [features, setFeatures] = useState<FeatureSettings | null>(null);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [currency, setCurrencyState] = useState<CurrencySettings>(CURRENCY_PRESETS[0]);
  const [err, setErr] = useState('');

  useEffect(() => {
    openGateSetter = setOpen;
    return () => {
      openGateSetter = null;
    };
  }, []);

  // Every time the modal opens: pre-fill from the saved profile (if any),
  // load the admin's currently configured wallet numbers/payment methods and
  // feature toggles, so everything shown is always up to date.
  useEffect(() => {
    if (!open) return;
    (async () => {
      const [existing, numbers, accNames, msg, enabledMethods, featureSettings, extraList, currencySettings] = await Promise.all([
        getMyProfile(),
        getPaymentNumbers(),
        getPaymentAccountNames(),
        getPostPaymentMessage(),
        getEnabledPaymentMethods(),
        getFeatureSettings(),
        listItems<Extra>('extras'),
        getCurrency(),
      ]);
      if (existing) {
        setName(existing.name);
        setPhone(existing.phone);
        setAddress(existing.address);
      }
      setPaymentNumbers(numbers);
      setAccountNames(accNames);
      setPostMsg(msg);
      setMethods(enabledMethods);
      if (enabledMethods.length && !enabledMethods.some((m) => m.id === paymentMethod)) {
        setPaymentMethod(enabledMethods[0].id);
      }
      setFeatures(featureSettings);
      setExtras(extraList);
      setSelectedExtraIds([]);
      setCurrencyState(currencySettings);
      if (featureSettings.tableNumberEnabled && !tableNumber) {
        const fromUrl = tableNumberFromUrl();
        if (fromUrl) setTableNumber(fromUrl);
      }
      if (!featureSettings.dineInEnabled && deliveryMethod === 'dine_in') {
        setDeliveryMethod('delivery');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedMethod = methods.find((m) => m.id === paymentMethod) ?? methods[0];
  const walletNumber = selectedMethod?.requiresNumber ? paymentNumbers[paymentMethod] : undefined;

  function toggleExtra(id: string) {
    setSelectedExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  const selectedExtras = extras.filter((ex) => selectedExtraIds.includes(ex.id));

  async function submit() {
    const needsAddress = deliveryMethod === 'delivery';
    const needsTable = !!features?.tableNumberEnabled && !!features.tableNumberRequired;
    if (!name.trim() || !phone.trim() || (needsAddress && !address.trim()) || (needsTable && !tableNumber.trim())) {
      setErr(
        needsTable
          ? t(
              `من فضلك اكتب الاسم ورقم الموبايل${needsAddress ? ' والعنوان' : ''} و${features?.tableNumberLabelAr}`,
              `Please enter your name, phone${needsAddress ? ', address' : ''} and ${features?.tableNumberLabelEn}`
            )
          : needsAddress
            ? t(ot.missingWithAddress.ar, ot.missingWithAddress.en)
            : t(ot.missingNoAddress.ar, ot.missingNoAddress.en)
      );
      return;
    }
    const customer = await saveMyProfile({
      name: name.trim(),
      phone: phone.trim(),
      address: needsAddress ? address.trim() : '',
    });
    const customerWithTable: Customer = features?.tableNumberEnabled
      ? { ...customer, tableNumber: tableNumber.trim() || undefined }
      : customer;
    setOpen(false);
    setErr('');
    pendingResolve?.({
      customer: customerWithTable,
      checkout: {
        paymentMethod,
        deliveryMethod,
        tableNumber: features?.tableNumberEnabled ? tableNumber.trim() || undefined : undefined,
        extras: selectedExtras.length
          ? selectedExtras.map((ex) => ({ id: ex.id, nameAr: ex.nameAr, nameEn: ex.nameEn, price: ex.price }))
          : undefined,
      },
    });
    pendingResolve = null;
  }

  function cancel() {
    setOpen(false);
    setErr('');
    pendingResolve?.(null);
    pendingResolve = null;
  }

  if (!open) return null;

  const deliveryOptions: [DeliveryMethod, string][] = [
    ['delivery', t(ot.deliveryOption.ar, ot.deliveryOption.en)],
    ['pickup', t(ot.pickupOption.ar, ot.pickupOption.en)],
  ];
  if (features?.dineInEnabled) {
    deliveryOptions.push(['dine_in', t(ot.dineInOption.ar, ot.dineInOption.en)]);
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 overflow-y-auto" dir={dir} style={{ perspective: '1200px' }}>
      <div
        className="bg-neutral-900 text-white w-full max-w-sm rounded-2xl p-6 space-y-4 my-8 shadow-2xl gate-pop-in"
      >
        <h3 className="text-lg font-semibold">
          {t(ot.completeOrderTitle.ar, ot.completeOrderTitle.en)}
        </h3>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(ot.namePlaceholder.ar, ot.namePlaceholder.en)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-white/50"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t(ot.phonePlaceholder.ar, ot.phonePlaceholder.en)}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-white/50"
        />

        {/* Delivery vs pickup vs dine-in */}
        <div>
          <p className="text-xs text-white/50 mb-2">{t(ot.deliveryMethodLabel.ar, ot.deliveryMethodLabel.en)}</p>
          <div className={`grid gap-2 ${deliveryOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {deliveryOptions.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDeliveryMethod(id)}
                className={`tilt-card rounded-lg py-2 text-sm border transition-colors flex items-center justify-center gap-1.5 ${
                  deliveryMethod === id
                    ? 'bg-white text-black border-white font-medium'
                    : 'border-white/20 text-white/70 hover:bg-white/5'
                }`}
              >
                {id === 'delivery' && <span className="delivery-emoji" aria-hidden>🛵</span>}
                {label}
              </button>
            ))}
          </div>
        </div>

        {deliveryMethod === 'delivery' && (
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t(ot.addressPlaceholder.ar, ot.addressPlaceholder.en)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-white/50"
          />
        )}

        {/* Table / room number — only shown when enabled from Settings → المميزات */}
        {features?.tableNumberEnabled && (
          <input
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder={t(features.tableNumberLabelAr, features.tableNumberLabelEn) + (features.tableNumberRequired ? '' : ` (${t(ot.optionalLabel.ar, ot.optionalLabel.en)})`)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-white/50"
          />
        )}

        {/* Payment method */}
        <div>
          <p className="text-xs text-white/50 mb-2">{t(ot.paymentMethodLabel.ar, ot.paymentMethodLabel.en)}</p>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`tilt-card rounded-lg py-2 text-sm border transition-colors flex items-center justify-center gap-1.5 ${
                  paymentMethod === m.id
                    ? 'bg-white text-black border-white font-medium'
                    : 'border-white/20 text-white/70 hover:bg-white/5'
                }`}
              >
                {m.icon && <span aria-hidden>{m.icon}</span>}
                {t(m.labelAr, m.labelEn)}
              </button>
            ))}
          </div>
        </div>

        {selectedMethod?.requiresNumber && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm space-y-1.5">
            {walletNumber ? (
              <>
                <p>
                  {t(ot.sendToNumber.ar, ot.sendToNumber.en)}{' '}
                  <span className="font-mono font-semibold select-all">{walletNumber}</span>
                  {accountNames[paymentMethod] && (
                    <span className="text-white/50"> ({accountNames[paymentMethod]})</span>
                  )}
                </p>
                <p className="text-[#EEC31C] text-xs">
                  {postMsg ? t(postMsg.ar, postMsg.en) : ''}
                </p>
              </>
            ) : (
              <p className="text-red-400 text-xs">
                {t(
                  ot.noPaymentNumberWarning.ar,
                  ot.noPaymentNumberWarning.en
                )}
              </p>
            )}
          </div>
        )}

        {err && <p className="text-red-400 text-xs">{err}</p>}

        {/* الإضافات — يقدر يختار أكتر من واحدة، مُدارة من Settings → الإضافات */}
        {extras.length > 0 && (
          <div>
            <p className="text-xs text-white/50 mb-2">{t(ot.extrasLabel.ar, ot.extrasLabel.en)}</p>
            <div className="flex flex-wrap gap-2">
              {extras.map((ex) => {
                const active = selectedExtraIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleExtra(ex.id)}
                    className={`flex items-center gap-2 rounded-full py-1.5 ps-1.5 pe-3 text-xs border transition-colors ${
                      active
                        ? 'bg-white text-black border-white font-medium'
                        : 'border-white/20 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    {ex.image ? (
                      <img src={ex.image} className="w-6 h-6 rounded-full object-cover" alt="" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">＋</span>
                    )}
                    <span>{t(ex.nameAr, ex.nameEn)}</span>
                    <span className="opacity-70">
                      {ex.price} {t(currency.symbolAr, currency.symbolEn)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={submit} className="flex-1 bg-white text-black rounded-lg py-2 font-medium">
            {t(ot.sendWhatsapp.ar, ot.sendWhatsapp.en)}
          </button>
          <button onClick={cancel} className="px-4 text-white/50 text-sm">
            {t(ot.cancel.ar, ot.cancel.en)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Quick order button (single item card) ----------------

export function QuickOrderButton({ item }: { item: MenuItem }) {
  const { t } = useLanguage();
  const ot = useOrderTexts();
  const { addItem, setGroupMode, setCartOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [sending, setSending] = useState(false);
  const [currency, setCurrencyState] = useState<CurrencySettings>(CURRENCY_PRESETS[0]);
  const hasSizes = !!item.sizesEnabled && !!item.sizes?.length;
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | undefined>(hasSizes ? item.sizes![0] : undefined);
  const effectivePrice = hasSizes && selectedSize ? selectedSize.price : item.price;

  useEffect(() => {
    getCurrency().then(setCurrencyState);
  }, [item.image]);

  async function orderNow() {
    setSending(true);
    const result = await ensureCheckoutDetails();
    if (!result) {
      setSending(false);
      return;
    }
    const subtotal = effectivePrice * qty;
    const rules = await getOrderRules();
    const isDelivery = result.checkout.deliveryMethod === 'delivery';
    if (isDelivery && rules.minOrderEnabled && subtotal < rules.minOrderAmount) {
      setSending(false);
      alert(
        `الحد الأدنى لطلبات التوصيل ${rules.minOrderAmount} ${currency.symbolAr} — طلبك الحالي ${subtotal} ${currency.symbolAr}. ضيف أصناف أكتر أو اختار "استلام من الفرع".`
      );
      return;
    }
    const fee = computeDeliveryFee(rules, subtotal, isDelivery);
    const sizeSuffix = hasSizes && selectedSize ? ` (${selectedSize.label})` : '';
    const order = await sendOrderToWhatsApp(
      [
        {
          itemId: item.id,
          nameAr: item.nameAr + sizeSuffix,
          nameEn: item.nameEn + (hasSizes && selectedSize ? ` (${selectedSize.labelEn || selectedSize.label})` : ''),
          price: effectivePrice,
          qty,
          sizeId: selectedSize?.id,
          sizeLabel: selectedSize?.label,
        },
      ],
      result.customer,
      result.checkout,
      undefined,
      item.image,
      undefined,
      fee
    );
    setSending(false);
    const features = await getFeatureSettings();
    if (features.orderConfirmationEnabled) showOrderConfirmation(order);
  }

  function addToGroupOrder() {
    addItem(item, qty, undefined, hasSizes ? selectedSize : undefined);
    setGroupMode(true);
    setCartOpen(true);
  }

  return (
    <div className="flex flex-col gap-2">
      {item.temperature && (
        <span
          className={`w-fit text-[10px] px-2 py-0.5 rounded-full font-medium ${
            item.temperature === 'hot' ? 'bg-red-500/20 text-red-300' : 'bg-sky-500/20 text-sky-300'
          }`}
        >
          {item.temperature === 'hot' ? t(ot.hotTag.ar, ot.hotTag.en) : t(ot.coldTag.ar, ot.coldTag.en)}
        </span>
      )}

      {hasSizes && (
        <div className="flex flex-wrap gap-1.5">
          {item.sizes!.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSize(s)}
              className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                selectedSize?.id === s.id
                  ? 'bg-white text-black border-white font-medium'
                  : 'border-white/25 text-white/70 hover:bg-white/10'
              }`}
            >
              {t(s.label, s.labelEn || s.label)} · {s.price} {t(currency.symbolAr, currency.symbolEn)}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
          aria-label="minus"
        >
          −
        </button>
        <span className="w-6 text-center">{qty}</span>
        <button
          onClick={() => setQty((q) => q + 1)}
          className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
          aria-label="plus"
        >
          +
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={orderNow}
          disabled={sending}
         
          className="flex-1 bg-white text-black text-sm font-medium rounded-full py-2 disabled:opacity-50"
        >
          {t(ot.orderNowButton.ar, ot.orderNowButton.en)}
        </button>
        <button
          onClick={addToGroupOrder}
         
          className="px-3 rounded-full border border-white/30 text-sm hover:bg-white/10"
          title={t(ot.addToGroupOrder.ar, ot.addToGroupOrder.en)}
        >
          {t('+ طلب جماعي', '+ Group')}
        </button>
      </div>
    </div>
  );
}

// ---------------- Floating group-order bar + drawer ----------------

export function GroupOrderBar() {
  const { t } = useLanguage();
  const ot = useOrderTexts();
  const { count, total, setCartOpen } = useCart();
  const [rules, setRules] = useState<OrderRulesSettings | null>(null);
  const [currency, setCurrencyState] = useState<CurrencySettings>(CURRENCY_PRESETS[0]);

  useEffect(() => {
    if (count > 0) {
      getOrderRules().then(setRules);
      getCurrency().then(setCurrencyState);
    }
  }, [count]);

  if (count === 0) return null;

  const shortBy = rules?.minOrderEnabled ? Math.max(0, rules.minOrderAmount - total) : 0;
  const progress = rules?.minOrderEnabled
    ? Math.min(100, Math.round((total / Math.max(1, rules.minOrderAmount)) * 100))
    : 100;

  return (
    <button
      onClick={() => setCartOpen(true)}
      className="fixed bottom-4 right-4 z-50 bg-[--c-maroon] text-white rounded-2xl shadow-xl overflow-hidden
                 min-w-[190px] text-start"
      style={{ background: 'var(--c-maroon)' }}
    >
      {rules?.minOrderEnabled && shortBy > 0 && (
        <div className="h-1 bg-white/20 w-full">
          <div className="h-full bg-[#EEC31C] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 font-medium text-sm">
          <span>🛒 {count}</span>
          <span className="opacity-70">·</span>
          <span>{total} {t(currency.symbolAr, currency.symbolEn)}</span>
        </div>
        {rules?.minOrderEnabled && shortBy > 0 ? (
          <p className="text-[10px] opacity-80 mt-0.5">
            {t(`ضيف ${shortBy} ${currency.symbolAr} للحد الأدنى للتوصيل`, `Add ${shortBy} ${currency.symbolEn} for delivery minimum`)}
          </p>
        ) : (
          <p className="text-[10px] opacity-80 mt-0.5">{t(ot.tapToReview.ar, ot.tapToReview.en)}</p>
        )}
      </div>
    </button>
  );
}

export function CartDrawer() {
  const { t, dir } = useLanguage();
  const ot = useOrderTexts();
  const { lines, total, cartOpen, setCartOpen, incrementLine, decrementLine, removeLine, clear } = useCart();
  const [generalNote, setGeneralNote] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [rules, setRules] = useState<OrderRulesSettings | null>(null);
  const [currency, setCurrencyState] = useState<CurrencySettings>(CURRENCY_PRESETS[0]);

  useEffect(() => {
    if (cartOpen) {
      getOrderRules().then(setRules);
      getCurrency().then(setCurrencyState);
    }
  }, [cartOpen]);

  if (!cartOpen) return null;

  const shortBy = rules?.minOrderEnabled ? Math.max(0, rules.minOrderAmount - total) : 0;

  async function send() {
    if (!lines.length) return;
    setErr('');
    setSending(true);
    const result = await ensureCheckoutDetails();
    if (!result) {
      setSending(false);
      return;
    }
    const currentRules = rules ?? (await getOrderRules());
    const isDelivery = result.checkout.deliveryMethod === 'delivery';
    if (isDelivery && currentRules.minOrderEnabled && total < currentRules.minOrderAmount) {
      setSending(false);
      setErr(
        t(
          `الحد الأدنى لطلبات التوصيل ${currentRules.minOrderAmount} ${currency.symbolAr} — طلبك الحالي ${total} ${currency.symbolAr}. ضيف أصناف أكتر أو اختار الاستلام من الفرع.`,
          `Minimum delivery order is ${currentRules.minOrderAmount} ${currency.symbolEn} — your order is ${total} ${currency.symbolEn}. Add more items or choose pickup.`
        )
      );
      return;
    }
    const fee = computeDeliveryFee(currentRules, total, isDelivery);
    const order = await sendOrderToWhatsApp(lines, result.customer, result.checkout, generalNote, undefined, undefined, fee);
    setSending(false);
    clear();
    setCartOpen(false);
    setGeneralNote('');
    const features = await getFeatureSettings();
    if (features.orderConfirmationEnabled) showOrderConfirmation(order);
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 flex items-end md:items-center justify-center" dir={dir}>
      <div className="bg-neutral-900 text-white w-full max-w-md md:rounded-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t(ot.groupOrderTitle.ar, ot.groupOrderTitle.en)}</h3>
          <button onClick={() => setCartOpen(false)} className="text-white/50 text-xl leading-none">
            ×
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="text-white/40 text-sm">{t(ot.emptyCart.ar, ot.emptyCart.en)}</p>
        ) : (
          <div className="space-y-3">
            {lines.map((l) => (
              <div key={l.lineKey ?? l.itemId} className="flex items-center gap-3 border-b border-white/10 pb-3">
                {l.image && <img src={l.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {t(l.nameAr, l.nameEn)}
                    {l.sizeLabel && <span className="text-white/40 text-xs"> ({l.sizeLabel})</span>}
                  </p>
                  <p className="text-white/40 text-xs">{l.price} × {l.qty}</p>
                </div>
                <button onClick={() => decrementLine(l.lineKey ?? l.itemId)} className="w-6 h-6 rounded-full border border-white/30 text-xs">−</button>
                <span className="w-5 text-center text-sm">{l.qty}</span>
                <button onClick={() => incrementLine(l.lineKey ?? l.itemId)} className="w-6 h-6 rounded-full border border-white/30 text-xs">+</button>
                <button onClick={() => removeLine(l.lineKey ?? l.itemId)} className="text-red-400 text-xs">{t(ot.removeButton.ar, ot.removeButton.en)}</button>
              </div>
            ))}

            <p className="text-white/30 text-[11px]">
              {t(
                ot.imageLinksNote.ar,
                ot.imageLinksNote.en
              )}
            </p>

            <input
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder={t(ot.orderNotePlaceholder.ar, ot.orderNotePlaceholder.en)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none"
            />

            {rules?.minOrderEnabled && shortBy > 0 && (
              <p className="text-[#EEC31C] text-xs">
                {t(
                  `ضيف ${shortBy} ${currency.symbolAr} كمان عشان توصل للحد الأدنى للتوصيل (${rules.minOrderAmount} ${currency.symbolAr})`,
                  `Add ${shortBy} ${currency.symbolEn} more to reach the delivery minimum (${rules.minOrderAmount} ${currency.symbolEn})`
                )}
              </p>
            )}
            {rules?.deliveryFeeEnabled && (
              <p className="text-white/40 text-xs">
                {t(
                  `+ رسوم توصيل ${rules.deliveryFeeAmount} ${currency.symbolAr} لطلبات التوصيل${rules.freeDeliveryThreshold ? ` (مجانًا فوق ${rules.freeDeliveryThreshold} ${currency.symbolAr})` : ''} — الاستلام من الفرع بدون رسوم`,
                  `+ ${rules.deliveryFeeAmount} ${currency.symbolEn} delivery fee${rules.freeDeliveryThreshold ? ` (free above ${rules.freeDeliveryThreshold} ${currency.symbolEn})` : ''} — pickup has no fee`
                )}
              </p>
            )}
            {err && <p className="text-red-400 text-xs">{err}</p>}

            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold">{t(ot.total.ar, ot.total.en)}: {total} {t(currency.symbolAr, currency.symbolEn)}</span>
              <button
                onClick={send}
                disabled={sending}
               
                className="bg-white text-black font-medium rounded-full px-6 py-2 text-sm disabled:opacity-50"
              >
                {t(ot.sendOrderButton.ar, ot.sendOrderButton.en)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
