import { getSetting, saveItem } from './store';
import type { CartLine, Customer, OrderRecord, OrderExtra, PaymentMethod, DeliveryMethod } from './types';
import { paymentMethodConfig, getPaymentNumbers, getPaymentAccountNames, getPostPaymentMessage } from './payments';
import { getCurrency, type CurrencySettings } from './currency';

export interface WhatsAppTarget {
  id: string;
  label: string;
  phone: string; // digits only, with country code, e.g. 201094555299
}

export interface CustomLink {
  id: string;
  label: string;
  url: string; // e.g. a Telegram / Messenger / custom order-form link
}

const WA_NUMBERS_KEY = 'settings.whatsappNumbers';
const CUSTOM_LINKS_KEY = 'settings.customLinks';

export async function getWhatsAppNumbers(): Promise<WhatsAppTarget[]> {
  return getSetting<WhatsAppTarget[]>(WA_NUMBERS_KEY, [
    { id: 'default', label: 'الأساسي', phone: '201094555299' },
  ]);
}

export async function getCustomLinks(): Promise<CustomLink[]> {
  return getSetting<CustomLink[]>(CUSTOM_LINKS_KEY, []);
}

export interface CheckoutChoice {
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  tableNumber?: string; // table/room number, only when the feature is enabled
  extras?: OrderExtra[]; // add-ons picked from Settings → الإضافات during checkout
}

function deliveryMethodLabel(method: DeliveryMethod): string {
  if (method === 'delivery') return 'توصيل';
  if (method === 'dine_in') return 'تناول في المكان';
  return 'استلام من الفرع (بدون توصيل)';
}

function buildMessage(
  lines: CartLine[],
  customer: Customer,
  checkout: CheckoutChoice,
  method: { labelAr: string; requiresNumber: boolean },
  paymentNumber: string | undefined,
  accountName: string | undefined,
  postPaymentMsgAr: string,
  currency: CurrencySettings,
  generalNote?: string,
  deliveryFee?: number
) {
  const itemsText = lines
    .map((l) => {
      let row = `• ${l.nameAr} / ${l.nameEn} × ${l.qty} — ${l.price * l.qty} ${currency.symbolAr}`;
      if (l.notes) row += `\n  ملاحظة: ${l.notes}`;
      return row;
    })
    .join('\n');

  // Every line that has a real PUBLIC image link (not a locally-uploaded
  // data: URL — those can't be shared as a link, see the note below) gets
  // listed here so a group order still shows every dish's photo link, not
  // just one. WhatsApp will typically only auto-unfurl the first link into a
  // visual preview card, but every link is still tappable individually.
  const imageLines = lines
    .filter((l) => isPublicImageUrl(l.image))
    .map((l) => `• ${l.nameAr}: ${l.image}`);
  const imagesBlock = imageLines.length ? `صور الأصناف:\n${imageLines.join('\n')}` : '';

  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const fee = deliveryFee ?? 0;
  const extras = checkout.extras ?? [];
  const extrasTotal = extras.reduce((s, ex) => s + ex.price, 0);
  const extrasText = extras.length
    ? `الإضافات:\n${extras.map((ex) => `• ${ex.nameAr} / ${ex.nameEn} — ${ex.price} ${currency.symbolAr}`).join('\n')}`
    : '';
  const total = subtotal + fee + extrasTotal;

  const paymentBlock = [
    `طريقة الدفع: ${method.labelAr}`,
    method.requiresNumber && paymentNumber
      ? `حوّل على رقم: ${paymentNumber}${accountName ? ` (${accountName})` : ''}`
      : '',
    method.requiresNumber ? postPaymentMsgAr : '',
  ]
    .filter(Boolean)
    .join('\n');

  const deliveryLine = `طريقة الاستلام: ${deliveryMethodLabel(checkout.deliveryMethod)}`;
  const tableLine = checkout.tableNumber ? `رقم الترابيزة/الأوضة: ${checkout.tableNumber}` : '';

  return [
    'طلب جديد من الموقع 🧾',
    '',
    itemsText,
    '',
    extrasText,
    `الإجمالي الفرعي: ${subtotal} ${currency.symbolAr}`,
    fee > 0 ? `رسوم التوصيل: ${fee} ${currency.symbolAr}` : '',
    extrasTotal > 0 ? `إجمالي الإضافات: ${extrasTotal} ${currency.symbolAr}` : '',
    `الإجمالي الكلي: ${total} ${currency.symbolAr}`,
    generalNote ? `ملاحظة عامة: ${generalNote}` : '',
    imagesBlock,
    '',
    deliveryLine,
    tableLine,
    paymentBlock,
    '',
    '— بيانات العميل —',
    `الاسم: ${customer.name}`,
    `الموبايل: ${customer.phone}`,
    customer.address ? `العنوان: ${customer.address}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// NOTE (platform limitation, not something code can work around): WhatsApp's
// "click to chat" links (wa.me) only support pre-filled TEXT, not an actual
// attached image. So the dish photo can't be auto-attached to the outgoing
// message — we include the dish photo LINK in the text instead, and WhatsApp
// auto-unfurls it into a preview card inside the chat as long as it's a real
// public http(s) URL. It only works if the item's image is hosted publicly
// (e.g. the admin pasted a link from imgbb.com / postimages.org / Cloudinary
// in the "رابط صورة" field in لوحة التحكم). If the item image is a locally
// uploaded photo (stored as a data: URL, only inside this browser), it is
// NOT a public link and can't unfurl — isPublicImageUrl() below filters that
// case out automatically so we never send a broken/huge data: URL in the
// message. Same limitation applies to the payment screenshot: WhatsApp links
// can't force-attach a file either, which is why the message asks the
// customer to attach it themselves once the WhatsApp chat opens.
function isPublicImageUrl(url?: string): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

// CREATIVE FIX for the "no real image in WhatsApp" limitation: wa.me links
// can only unfurl a PUBLIC link (see note above) — they can never force an
// actual file attachment. But the device's native Share Sheet CAN attach a
// real file, because it hands the file straight to the WhatsApp app instead
// of going through a text link at all. The trade-off is the customer has to
// pick who to send it to themselves (the share sheet can't pre-select "the
// restaurant's chat" the way a wa.me link can) — so this is offered as an
// extra "attach the real photo" option alongside the normal one-tap order
// button, not a replacement for it. Works on most phones; on desktop
// browsers (no share-sheet support) the button simply doesn't render.
export async function canShareImageDirectly(): Promise<boolean> {
  return typeof navigator !== 'undefined' && !!(navigator as any).share && !!(navigator as any).canShare;
}

export async function shareOrderImageDirectly(imageUrl: string, caption: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const ext = (blob.type.split('/')[1] || 'jpg').split('+')[0];
    const file = new File([blob], `dish.${ext}`, { type: blob.type || 'image/jpeg' });
    if (!(navigator as any).canShare?.({ files: [file] })) return false;
    await (navigator as any).share({ files: [file], text: caption });
    return true;
  } catch {
    return false; // user cancelled, or the browser refused — caller falls back silently
  }
}

export async function sendOrderToWhatsApp(
  lines: CartLine[],
  customer: Customer,
  checkout: CheckoutChoice,
  generalNote?: string,
  imageUrl?: string,
  targetId?: string,
  deliveryFee?: number
): Promise<OrderRecord> {
  const numbers = await getWhatsAppNumbers();
  const target = numbers.find((n) => n.id === targetId) ?? numbers[0];
  if (!target) throw new Error('لا يوجد رقم واتساب مضاف في الإعدادات');

  const [paymentNumbers, accountNames, postPaymentMsg, method, currency] = await Promise.all([
    getPaymentNumbers(),
    getPaymentAccountNames(),
    getPostPaymentMessage(),
    paymentMethodConfig(checkout.paymentMethod),
    getCurrency(),
  ]);
  const paymentNumber = method.requiresNumber ? paymentNumbers[checkout.paymentMethod] : undefined;
  const accountName = method.requiresNumber ? accountNames[checkout.paymentMethod] : undefined;

  // Merge the standalone imageUrl param (used by the single-item "اطلب الآن"
  // button) into the lines themselves so buildMessage only needs one source
  // of truth for "which items have a photo link to include".
  const linesWithImage =
    isPublicImageUrl(imageUrl) && lines[0] && !lines[0].image
      ? [{ ...lines[0], image: imageUrl }, ...lines.slice(1)]
      : lines;

  const text = buildMessage(
    linesWithImage,
    customer,
    checkout,
    method,
    paymentNumber,
    accountName,
    postPaymentMsg.ar,
    currency,
    generalNote,
    deliveryFee
  );

  const order: OrderRecord = {
    id: crypto.randomUUID(),
    customer,
    lines,
    extras: checkout.extras?.length ? checkout.extras : undefined,
    total:
      lines.reduce((s, l) => s + l.qty * l.price, 0) +
      (deliveryFee ?? 0) +
      (checkout.extras ?? []).reduce((s, ex) => s + ex.price, 0),
    generalNote,
    createdAt: new Date().toISOString(),
    channel: 'whatsapp',
    paymentMethod: checkout.paymentMethod,
    deliveryMethod: checkout.deliveryMethod,
    paymentNumberUsed: paymentNumber,
  };
  await saveItem('orders', order as any);

  const url = `https://wa.me/${target.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  return order;
}

export async function sendOrderToCustomLink(
  lines: CartLine[],
  customer: Customer,
  linkId: string,
  checkout?: CheckoutChoice,
  generalNote?: string
): Promise<OrderRecord> {
  const links = await getCustomLinks();
  const link = links.find((l) => l.id === linkId);
  if (!link) throw new Error('الرابط غير موجود');

  const order: OrderRecord = {
    id: crypto.randomUUID(),
    customer,
    lines,
    total: lines.reduce((s, l) => s + l.qty * l.price, 0),
    generalNote,
    createdAt: new Date().toISOString(),
    channel: linkId,
    paymentMethod: checkout?.paymentMethod,
    deliveryMethod: checkout?.deliveryMethod,
  };
  await saveItem('orders', order as any);
  window.open(link.url, '_blank');
  return order;
}
