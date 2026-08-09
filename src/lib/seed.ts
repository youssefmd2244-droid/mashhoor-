import { listItems, saveItem, getSetting, setSetting, type TrashableStore } from './store';
import type {
  MenuItem,
  FeaturedOffer,
  PollOption,
  FastFoodProduct,
  SignatureFeature,
} from './types';

// -----------------------------------------------------------------------
// Real starting content, written straight into Settings on first run.
//
// This is NOT a "demo mode" — there is no separate fallback path the site
// swaps between. The very first time the site boots, this content is saved
// as normal items in the same stores the admin panel reads and writes
// (menuItems, featuredOffers, pollOptions, fastFoodProducts,
// signatureFeatures). From that point on it behaves exactly like anything
// the admin typed in themselves: it shows up in Settings, can be renamed,
// re-priced, re-photographed, reordered, or deleted — same as any other
// item. Nothing here is invisible or reverts back if edited.
//
// The photos below are stock placeholders and the copy is generic —
// they exist so the site isn't blank on first load, not because they're
// "correct" for مشهور. Replace them from Settings → المحتوى whenever the
// real menu photos and prices are ready.
// -----------------------------------------------------------------------

const SEED_FLAG_KEY = 'content_seeded_v1';

const SEED_MENU_ITEMS: MenuItem[] = [
  {
    id: 'seed-menu-1',
    nameAr: 'ستيك لحم الضأن',
    nameEn: 'Lamb Tenderloin',
    descAr: 'لحم ضأن مشوي ببطء مع صلصة الزعتر والكمأ الأسود',
    descEn: 'Slow-grilled lamb with thyme & black truffle glaze',
    price: 185,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    available: true,
    order: 1,
  },
  {
    id: 'seed-menu-2',
    nameAr: 'باستا الكمأ',
    nameEn: 'Truffle Pasta',
    descAr: 'تاغلياتيلي طازجة مع زبدة الكمأ والبارميزان',
    descEn: 'Fresh tagliatelle with truffle butter & aged parmesan',
    price: 145,
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
    available: true,
    order: 2,
  },
  {
    id: 'seed-menu-3',
    nameAr: 'سلمون مشوي',
    nameEn: 'Charred Salmon',
    descAr: 'سلمون الأطلسي مع خضار موسمية وشمر محمص',
    descEn: 'Atlantic salmon with seasonal vegetables & roasted fennel',
    price: 165,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    available: true,
    order: 3,
  },
  {
    id: 'seed-menu-4',
    nameAr: 'كبسة دجاج',
    nameEn: 'Chicken Kabsa',
    descAr: 'دجاج مدفون مع أرز بسمتي وبهارات عربية أصلية',
    descEn: 'Slow-buried chicken with basmati rice & authentic Arabic spices',
    price: 95,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    available: true,
    order: 4,
  },
  {
    id: 'seed-menu-5',
    nameAr: 'برجر لحم الأنجوس',
    nameEn: 'Angus Beef Burger',
    descAr: 'لحم أنجوس 200 جرام مع جبنة شيدر مدخنة وصوص خاص',
    descEn: '200g Angus beef patty with smoked cheddar & house sauce',
    price: 110,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    available: true,
    order: 5,
  },
  {
    id: 'seed-menu-6',
    nameAr: 'تشيز كيك التوت',
    nameEn: 'Berry Cheesecake',
    descAr: 'تشيز كيك كريمي مع كومبوت التوت الطازج',
    descEn: 'Creamy cheesecake with fresh berry compote',
    price: 55,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    available: true,
    order: 6,
  },
];

const SEED_FEATURED_OFFERS: FeaturedOffer[] = [
  {
    id: 'seed-offer-1',
    titleAr: 'ريزوتو بالكمأ',
    titleEn: 'Truffle Risotto',
    descAr: 'أرز كارنارولي بطيء الطبخ مع بارميجيانو معتّق',
    descEn: 'Slow-cooked carnaroli rice with aged parmigiano',
    price: '120',
    oldPrice: '160',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=900&q=80',
    tagAr: 'جديد',
    tagEn: 'New',
    order: 1,
  },
  {
    id: 'seed-offer-2',
    titleAr: 'لحم واغيو',
    titleEn: 'Wagyu Tenderloin',
    descAr: 'لحم واغيو درجة A5، ٢٠٠ جرام، مع خضار موسمية',
    descEn: 'Grade A5 wagyu, 200g, with seasonal greens',
    price: '320',
    oldPrice: '420',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=900&q=80',
    tagAr: 'مميز',
    tagEn: 'Premium',
    order: 2,
  },
  {
    id: 'seed-offer-3',
    titleAr: 'حساء الكركند',
    titleEn: 'Lobster Bisque',
    descAr: 'حساء كركند فرنسي كريمي مع الكونياك',
    descEn: 'Creamy French lobster soup with cognac finish',
    price: '95',
    oldPrice: '130',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&q=80',
    tagAr: 'محدود',
    tagEn: 'Limited',
    order: 3,
  },
];

const SEED_POLL_OPTIONS: PollOption[] = [
  {
    id: 'seed-poll-1',
    emoji: '🌶️',
    titleAr: 'حار و ناري',
    titleEn: 'Spicy & Fire',
    color: '#C11E10',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    votes: 1248,
    order: 1,
  },
  {
    id: 'seed-poll-2',
    emoji: '🍖',
    titleAr: 'لحم مدخن',
    titleEn: 'Smoky Meat',
    color: '#9B3734',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    votes: 892,
    order: 2,
  },
  {
    id: 'seed-poll-3',
    emoji: '🍯',
    titleAr: 'حلو و دافئ',
    titleEn: 'Sweet & Warm',
    color: '#EDD8BA',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80',
    votes: 654,
    order: 3,
  },
];

const SEED_FASTFOOD_PRODUCTS: FastFoodProduct[] = [
  { id: 'seed-ff-1', nameAr: 'دبل سماش', nameEn: 'DOUBLE SMASH', price: 45, color: '#9B3734', order: 1 },
  { id: 'seed-ff-2', nameAr: 'بطاطس بالجبنة', nameEn: 'CHEESE FRIES', price: 22, color: '#869B11', order: 2 },
  { id: 'seed-ff-3', nameAr: 'أجنحة دجاج', nameEn: 'CHICKEN WINGS', price: 38, color: '#9B3734', order: 3 },
];

const SEED_SIGNATURE_FEATURES: SignatureFeature[] = [
  {
    id: 'seed-sig-1',
    icon: '🌿',
    titleAr: 'مكونات عضوية',
    titleEn: 'Organic Sourcing',
    descAr: 'من مزارع محلية معتمدة، طازجة كل يوم',
    descEn: 'From certified local farms, fresh every day',
    order: 1,
  },
  {
    id: 'seed-sig-2',
    icon: '🔥',
    titleAr: 'شوي على الحطب',
    titleEn: 'Wood-Fire Grill',
    descAr: 'نكهة مدخنة أصيلة من خشب الزيتون',
    descEn: 'Authentic smoky flavor from olive wood',
    order: 2,
  },
  {
    id: 'seed-sig-3',
    icon: '👨\u200d🍳',
    titleAr: 'شيف حائز على نجوم',
    titleEn: 'Michelin-Trained Chef',
    descAr: 'خبرة ١٥ سنة في أرقى المطاعم',
    descEn: "15 years at the world's finest restaurants",
    order: 3,
  },
  {
    id: 'seed-sig-4',
    icon: '🥘',
    titleAr: 'وصفات أمهات',
    titleEn: 'Heritage Recipes',
    descAr: 'موروث عائلي من ثلاث أجيال',
    descEn: 'Family recipes passed down three generations',
    order: 4,
  },
];

// Writes each seed list into its store, but only for stores that are still
// completely empty — if the admin already added even one real item to a
// given store, that store is left alone so this can never overwrite real
// work. Runs once per browser/database (tracked by SEED_FLAG_KEY); safe to
// call on every app boot after that, it becomes a no-op.
export async function seedInitialContent(): Promise<void> {
  const alreadySeeded = await getSetting<boolean>(SEED_FLAG_KEY, false);
  if (alreadySeeded) return;

  async function seedIfEmpty<T extends { id: string }>(
    store: TrashableStore,
    items: T[]
  ) {
    const existing = await listItems(store);
    if (existing.length === 0) {
      for (const item of items) {
        await saveItem(store, item);
      }
    }
  }

  await Promise.all([
    seedIfEmpty('menuItems', SEED_MENU_ITEMS),
    seedIfEmpty('featuredOffers', SEED_FEATURED_OFFERS),
    seedIfEmpty('pollOptions', SEED_POLL_OPTIONS),
    seedIfEmpty('fastFoodProducts', SEED_FASTFOOD_PRODUCTS),
    seedIfEmpty('signatureFeatures', SEED_SIGNATURE_FEATURES),
  ]);

  await setSetting(SEED_FLAG_KEY, true);
}
