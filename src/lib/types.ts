export type Temperature = 'hot' | 'cold' | null;

// Payment method chosen by the customer at checkout. 'cash' means cash on
// delivery/pickup — no wallet number involved. The other three are manual
// wallet transfers: the customer sends money themselves to the restaurant's
// configured number and confirms with a screenshot (there's no card-gateway
// integration here — Vodafone Cash/Etisalat Cash/InstaPay don't offer a
// public checkout API for small merchants, so "send to this number + upload
// proof" is genuinely how these are handled in practice).
// A string, not a literal union: besides the 4 built-in methods below, the
// admin can add custom payment methods from Settings → طرق الدفع, each
// getting a generated id like "custom_xxxxxx". Built-in ids are still
// 'cash' | 'instapay' | 'vodafone_cash' | 'etisalat_cash' in practice.
export type PaymentMethod = string;
export type DeliveryMethod = 'delivery' | 'pickup' | 'dine_in';

export interface MenuItemSize {
  id: string;
  label: string; // e.g. "وسط" / "كبير"
  labelEn?: string;
  price: number;
}

// One extra photo or video attached to a menu item, on top of its main cover
// `image`. Used by the multi-upload flow (Settings → الأصناف → رفع جماعي)
// and by the per-item gallery editor — each piece of media can carry its own
// caption/details ("تفاصيل كل واحد فيهم").
export interface MenuItemMedia {
  id: string; // stable id for this gallery entry
  kind: 'image' | 'video';
  url: string; // data URL (compressed image) or remote https:// URL (video / hosted image)
  captionAr?: string;
  captionEn?: string;
}

export interface MenuItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr?: string;
  descEn?: string;
  price: number;
  image?: string; // data URL or remote URL — the cover/thumbnail shown in listings
  gallery?: MenuItemMedia[]; // extra photos/videos for this item, each with its own caption
  categoryId?: string;
  temperature?: Temperature; // set by the admin only, from Settings
  order?: number;
  available?: boolean; // defaults to true when unset — false = "sold out", hidden from ordering
  sizesEnabled?: boolean; // show a size picker (small/medium/large...) instead of the single price
  sizes?: MenuItemSize[];
  nameColor?: string; // hex font color override for the item's name, set from Settings → الأصناف
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  order?: number;
  nameColor?: string; // hex font color override for the category name
}

// An "extra" / add-on the customer can optionally attach to the whole order
// (e.g. "صوص إضافي", "أكياس تقديم", "شمعة عيد ميلاد") — not tied to one menu
// item. Managed from Settings → الإضافات, picked from during checkout.
export interface Extra {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  image?: string; // small thumbnail — resized client-side before saving
  order?: number;
  nameColor?: string; // hex font color override for the extra's name
}

// A featured/promo offer shown in the "This Week Only" poster carousel on
// the homepage. Managed from Settings → العروض المميزة.
export interface FeaturedOffer {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  price: string;
  oldPrice?: string;
  image: string;
  tagAr: string;
  tagEn: string;
  order?: number;
  titleColor?: string; // hex font color override for the offer title
}

// One option in the homepage "صوّت لطبقك المفضل" poll section. Managed from
// Settings → قسم التصويت.
export interface PollOption {
  id: string;
  emoji: string;
  titleAr: string;
  titleEn: string;
  color: string; // hex accent color for this option's card
  image: string;
  votes?: number; // starting/seed vote count shown before a visitor votes
  order?: number;
  titleColor?: string; // hex font color override for the option's title text
}

// One product card in the fast-food strip section. Managed from Settings →
// قسم الفاست فود.
export interface FastFoodProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  color: string; // hex accent color for the card
  image?: string;
  order?: number;
  nameColor?: string; // hex font color override for the product name text
}

// One feature/highlight card in the "هويتنا العربية" (Signature) section —
// e.g. "مكونات عضوية", "شوي على الحطب". Managed from Settings → قسم الهوية.
export interface SignatureFeature {
  id: string;
  icon: string; // emoji shown as the card's icon
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  order?: number;
  titleColor?: string; // hex font color override for the feature title
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
  tableNumber?: string; // table/room number — only meaningful when the "Table/Room number" feature is enabled from Settings
}

export interface CartLine {
  itemId: string;
  lineKey?: string; // internal identity when the same item has multiple size lines — falls back to itemId when absent
  nameAr: string;
  nameEn: string;
  price: number;
  qty: number;
  notes?: string;
  sizeId?: string;
  sizeLabel?: string; // shown to the customer + included in the WhatsApp message
  image?: string; // carried from MenuItem.image so group orders can list every item's photo link too
}

// A snapshot of a selected Extra at order time — kept separate from the
// `Extra` catalog entry so that later editing/deleting an extra in Settings
// never rewrites the historical record of what a customer actually ordered.
export interface OrderExtra {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
}

export interface OrderRecord {
  id: string;
  customer: Customer;
  lines: CartLine[];
  extras?: OrderExtra[];
  total: number;
  generalNote?: string;
  createdAt: string;
  channel: 'whatsapp' | string; // link id used for "other platform" order links
  paymentMethod?: PaymentMethod;
  deliveryMethod?: DeliveryMethod;
  paymentNumberUsed?: string; // snapshot of the wallet number shown to the customer, for the admin's records
}
