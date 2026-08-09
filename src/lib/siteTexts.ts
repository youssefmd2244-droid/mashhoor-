import { getSetting, setSetting } from './store';

// A generic key→{ar,en} override store for site copy that used to be
// hardcoded inside components. Any component can register a text here (see
// getSiteText/useSiteTextSync below) — Settings → النصوص والخطوط lists
// whatever has been registered so far, without every single hardcoded
// string in the app having to be migrated at once.
export interface TextOverride {
  ar: string;
  en: string;
  // Optional custom color for this specific piece of text, chosen by the
  // admin from Settings → كل نصوص الموقع. Hex string (e.g. '#FFD700').
  // Undefined/empty means "use the site's original design color".
  color?: string;
}

const TEXTS_KEY = 'settings.siteTexts';
const FONT_KEY = 'settings.siteFont';

export async function getAllSiteTexts(): Promise<Record<string, TextOverride>> {
  return getSetting<Record<string, TextOverride>>(TEXTS_KEY, {});
}

export async function setSiteText(key: string, value: TextOverride): Promise<void> {
  const all = await getAllSiteTexts();
  await setSetting(TEXTS_KEY, { ...all, [key]: value });
}

export async function resetSiteText(key: string): Promise<void> {
  const all = await getAllSiteTexts();
  delete all[key];
  await setSetting(TEXTS_KEY, all);
}

// Used by components at render time: falls back to the original hardcoded
// copy when nothing's been overridden yet.
export async function getSiteText(key: string, fallbackAr: string, fallbackEn: string): Promise<TextOverride> {
  const all = await getAllSiteTexts();
  return all[key] ?? { ar: fallbackAr, en: fallbackEn };
}

// The curated list of editable text slots this project ships with. More can
// be added the same way — each is just a key + fallback text.
export const EDITABLE_TEXT_SLOTS: { key: string; labelAr: string; fallback: TextOverride }[] = [
  {
    key: 'hero.title',
    labelAr: 'عنوان الصفحة الرئيسية (Hero)',
    fallback: { ar: 'ساخن. حارّ. لا يُقاوم.', en: 'Hot. Spicy. Irresistible.' },
  },
  {
    key: 'hero.subtitle',
    labelAr: 'الوصف تحت العنوان الرئيسي',
    fallback: { ar: 'طبقنا الموقّع — كل لقمة بتحكي قصة نار وتوابل', en: 'Our signature — every bite tells a story of fire & spice' },
  },
  {
    key: 'footer.tagline',
    labelAr: 'الجملة اللي تحت اسم المطعم في الفوتر',
    fallback: { ar: 'تجربة طعام تتجاوز التوقعات — من المطبخ إلى مائدتك', en: 'A dining experience beyond expectations — from kitchen to your table' },
  },
  {
    key: 'story.title1',
    labelAr: 'قسم "خلف الكواليس" — السطر الأول من العنوان',
    fallback: { ar: 'كل تفصيلة', en: 'Every detail,' },
  },
  {
    key: 'story.title2',
    labelAr: 'قسم "خلف الكواليس" — السطر التاني من العنوان (مايل)',
    fallback: { ar: 'مدروسة بعمق', en: 'deeply considered.' },
  },
  {
    key: 'story.subtitle',
    labelAr: 'قسم "خلف الكواليس" — الوصف',
    fallback: { ar: 'نأخذ كل مشروع كبحث تصميمي. نستكشف المرجعيات، نختبر الألوان، ندرس الخطوط قبل أن نرسم أول بكسل.', en: 'We treat every project as a design study. We explore references, test colors, study typefaces before drawing a single pixel.' },
  },
  {
    key: 'signature.heading1',
    labelAr: 'قسم "هويتنا العربية" — السطر الأول من العنوان',
    fallback: { ar: 'من قلب', en: 'From the heart' },
  },
  {
    key: 'signature.heading2',
    labelAr: 'قسم "هويتنا العربية" — السطر التاني (مايل)',
    fallback: { ar: 'التراث', en: 'of heritage,' },
  },
  {
    key: 'signature.heading3',
    labelAr: 'قسم "هويتنا العربية" — السطر التالت',
    fallback: { ar: 'إلى مائدتك', en: 'to your table' },
  },
  {
    key: 'signature.description',
    labelAr: 'قسم "هويتنا العربية" — الوصف',
    fallback: { ar: 'نأخذك في رحلة عبر الزمن — نُحيي وصفات الجدّات بنكهة عصرية ولمسة عصرية. كل طبق يحمل حكاية، وكل لقمة تنقلك إلى ذاكرة دافئة.', en: 'We take you on a journey through time — reviving grandmother\'s recipes with a modern touch. Every dish carries a story, every bite carries you back to a warm memory.' },
  },
  {
    key: 'fastfood.subtitle',
    labelAr: 'قسم الفاست فود — العنوان الفرعي',
    fallback: { ar: '🔥 وصفات الشارع الأصلية — بسرعة الصاروخ 🔥', en: '🔥 Original street recipes — rocket fast 🔥' },
  },
  {
    key: 'fastfood.tagline',
    labelAr: 'قسم الفاست فود — شريط التوصيل السفلي',
    fallback: { ar: '⚡ توصيل في ١٥ دقيقة أو الفلوس يرجع', en: '⚡ 15-MIN DELIVERY OR YOUR MONEY BACK' },
  },
  {
    key: 'pasta.description',
    labelAr: 'قسم الباستا — الوصف',
    fallback: { ar: 'باستا إيطالية أصلية، تُحضَّر يدوياً كل صباح من أجود أنواع الدقيق. وصفة عائلية عمرها ٨٠ عاماً.', en: 'Authentic Italian pasta, hand-rolled every morning from the finest flour. A family recipe 80 years in the making.' },
  },
  {
    key: 'app.subtitle',
    labelAr: 'قسم التطبيق — الوصف تحت العنوان',
    fallback: { ar: 'تطبيق يحول الطبخ إلى تجربة ذكية. وصفات، مؤقت، تسوّق، كله في يدك.', en: 'An app that turns cooking into a smart experience. Recipes, timers, shopping — all in your hand.' },
  },
  {
    key: 'flyer.discountPercent',
    labelAr: 'الفلاير الترويجي — نسبة الخصم (مثال: 25%)',
    fallback: { ar: '25%', en: '25%' },
  },
  {
    key: 'flyer.subtitle',
    labelAr: 'الفلاير الترويجي — الجملة تحت الخصم',
    fallback: { ar: 'على كل طلبات البرانش — هذا الأسبوع فقط', en: 'on all weekend brunch orders — this week only' },
  },
  {
    key: 'flyer.couponCode',
    labelAr: 'الفلاير الترويجي — كود الخصم',
    fallback: { ar: 'MASHHOOR25', en: 'MASHHOOR25' },
  },
  {
    key: 'poll.subtitle',
    labelAr: 'قسم التصويت — الوصف تحت السؤال',
    fallback: { ar: 'صوّت وقولنا إنهى كومبو بيقرّب لقلبك — هنبدأ بتحضيرهولك من بكرة', en: 'Vote and tell us which combo speaks to your soul — we will start prepping it tomorrow' },
  },
  {
    key: 'poster.heading1',
    labelAr: 'قسم العروض — السطر الأول من العنوان (This)',
    fallback: { ar: 'هذا', en: 'This' },
  },
  {
    key: 'poster.heading2',
    labelAr: 'قسم العروض — السطر التاني من العنوان (مايل)',
    fallback: { ar: 'الأسبوع', en: 'Week\'s' },
  },
  {
    key: 'poster.heading3',
    labelAr: 'قسم العروض — السطر التالت من العنوان',
    fallback: { ar: 'فقط', en: 'Only' },
  },
  {
    key: 'footer.newsletterTitle',
    labelAr: 'الفوتر — عنوان الاشتراك في القائمة البريدية',
    fallback: { ar: 'انضم لعائلة [اسم المطعم] — بيتغير تلقائي حسب اسم المطعم', en: 'Join the [Restaurant Name] family — auto-fills with your restaurant name' },
  },
  {
    key: 'menu.title1',
    labelAr: 'قسم المنيو — السطر الأول من العنوان (THE)',
    fallback: { ar: 'THE', en: 'THE' },
  },
  {
    key: 'menu.title2',
    labelAr: 'قسم المنيو — السطر التاني من العنوان (MENU)',
    fallback: { ar: 'MENU', en: 'MENU' },
  },
  {
    key: 'menu.subtitle',
    labelAr: 'قسم المنيو — الوصف تحت العنوان',
    fallback: { ar: 'تشكيلة منتقاة بعناية من الأطباق الموقّعة. كل طبق محضّر من مكونات طازجة ومصدر محلي.', en: 'A curated selection of signature dishes. Every plate prepared from fresh, locally-sourced ingredients.' },
  },
  {
    key: 'hero.ctaPrimary',
    labelAr: 'الصفحة الرئيسية — زر "اطلب الآن"',
    fallback: { ar: 'اطلب الآن', en: 'Order Now' },
  },
  {
    key: 'hero.ctaSecondary',
    labelAr: 'الصفحة الرئيسية — زر "شاهد القائمة"',
    fallback: { ar: 'شاهد القائمة', en: 'View Menu' },
  },
  {
    key: 'hero.badge',
    labelAr: 'الصفحة الرئيسية — شارة "الأكثر طلباً"',
    fallback: { ar: '🔥 الأكثر طلباً', en: '🔥 Most Ordered' },
  },
  {
    key: 'poll.badge',
    labelAr: 'قسم التصويت — شارة "تصويت سريع"',
    fallback: { ar: 'تصويت سريع', en: 'Quick Poll' },
  },
  {
    key: 'poll.title1',
    labelAr: 'قسم التصويت — السطر الأول من العنوان',
    fallback: { ar: 'إيه كومبو', en: 'Pick Your' },
  },
  {
    key: 'poll.title2',
    labelAr: 'قسم التصويت — السطر التاني من العنوان',
    fallback: { ar: 'المفضل؟', en: 'Combo' },
  },
  {
    key: 'poll.thanks',
    labelAr: 'قسم التصويت — رسالة الشكر بعد التصويت',
    fallback: { ar: 'شكراً لتصويتك! هنحضّر كومبوك المفضل', en: 'Thanks! We are prepping your favorite' },
  },
  {
    key: 'poll.votesLabel',
    labelAr: 'قسم التصويت — كلمة "صوّت" بجانب العدد',
    fallback: { ar: 'صوّت', en: 'votes' },
  },
  {
    key: 'fastfood.badge',
    labelAr: 'قسم الفاست فود — شارة "أجواء الشارع"',
    fallback: { ar: '⚡ أجواء الشارع', en: '⚡ STREET FOOD VIBES' },
  },
  {
    key: 'fastfood.hotLabel',
    labelAr: 'قسم الفاست فود — وسم "ناار 🔥" على الكروت',
    fallback: { ar: 'ناار 🔥', en: 'HOT 🔥' },
  },
  {
    key: 'fastfood.cta',
    labelAr: 'قسم الفاست فود — زر "اطلب دلوقتي"',
    fallback: { ar: 'اطلب دلوقتي →', en: 'Order Now →' },
  },
  {
    key: 'signature.badge',
    labelAr: 'قسم الهوية العربية — شارة "هويتنا العربية"',
    fallback: { ar: 'هويتنا العربية', en: 'Arabic Identity' },
  },
  {
    key: 'signature.yearsNumber',
    labelAr: 'قسم الهوية العربية — رقم سنين الخبرة',
    fallback: { ar: '15', en: '15' },
  },
  {
    key: 'signature.yearsLabel',
    labelAr: 'قسم الهوية العربية — نص "سنة من الخبرة"',
    fallback: { ar: 'سنة من الخبرة', en: 'years of experience' },
  },
  {
    key: 'signature.ctaButton',
    labelAr: 'قسم الهوية العربية — زر "اكتشف رحلتنا"',
    fallback: { ar: 'اكتشف رحلتنا', en: 'Discover our journey' },
  },
  {
    key: 'footer.column1',
    labelAr: 'الفوتر — العمود الأول (الصيغة: العنوان|رابط1،رابط2،رابط3)',
    fallback: { ar: 'الرئيسية|القائمة،الفروع،الحجوزات،الوظائف', en: 'Main|Menu,Locations,Reservations,Careers' },
  },
  {
    key: 'footer.column2',
    labelAr: 'الفوتر — العمود التاني (الصيغة: العنوان|رابط1،رابط2،رابط3)',
    fallback: { ar: 'خدمات|التوصيل،الطلبات الخاصة،الهدايا،العضوية', en: 'Services|Delivery,Catering,Gift Cards,Membership' },
  },
  {
    key: 'footer.column3',
    labelAr: 'الفوتر — العمود التالت (الصيغة: العنوان|رابط1،رابط2،رابط3)',
    fallback: { ar: 'المزيد|من نحن،المدونة،الخصوصية،الشروط', en: 'More|About,Journal,Privacy,Terms' },
  },
  {
    key: 'footer.connectLabel',
    labelAr: 'الفوتر — عنوان "تواصل"',
    fallback: { ar: 'تواصل', en: 'Connect' },
  },
  {
    key: 'footer.newsletterSubtitle',
    labelAr: 'الفوتر — جملة الاشتراك في القائمة البريدية',
    fallback: { ar: 'احصل على عروض حصرية ووصفات جديدة كل أسبوع', en: 'Get exclusive offers and new recipes every week' },
  },
  {
    key: 'footer.emailPlaceholder',
    labelAr: 'الفوتر — نص خانة البريد الإلكتروني',
    fallback: { ar: 'بريدك الإلكتروني', en: 'your@email.com' },
  },
  {
    key: 'footer.joinButton',
    labelAr: 'الفوتر — زر "اشترك"',
    fallback: { ar: 'اشترك', en: 'Join' },
  },
  {
    key: 'footer.copyrightText',
    labelAr: 'الفوتر — "جميع الحقوق محفوظة"',
    fallback: { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  },
  {
    key: 'footer.madeWith',
    labelAr: 'الفوتر — "صُنع بـ ❤️"',
    fallback: { ar: 'صُنع بـ ❤️', en: 'Made with ❤️' },
  },
  {
    key: 'footer.complaintsLabel',
    labelAr: 'الفوتر — عنوان "الشكاوي وخدمة العملاء"',
    fallback: { ar: 'الشكاوي وخدمة العملاء', en: 'Complaints & customer support' },
  },
  {
    key: 'nav.hero',
    labelAr: 'شريط التنقل — زر "الرئيسية"',
    fallback: { ar: 'الرئيسية', en: 'Hero' },
  },
  {
    key: 'nav.poll',
    labelAr: 'شريط التنقل — زر "الكومبو"',
    fallback: { ar: 'الكومبو', en: 'Poll' },
  },
  {
    key: 'nav.menu',
    labelAr: 'شريط التنقل — زر "القائمة"',
    fallback: { ar: 'القائمة', en: 'Menu' },
  },
  {
    key: 'nav.signature',
    labelAr: 'شريط التنقل — زر "مميز"',
    fallback: { ar: 'مميز', en: 'Signature' },
  },
  {
    key: 'nav.pasta',
    labelAr: 'شريط التنقل — زر "الباستا"',
    fallback: { ar: 'الباستا', en: 'Pasta' },
  },
  {
    key: 'nav.fastfood',
    labelAr: 'شريط التنقل — زر "فاست فود"',
    fallback: { ar: 'فاست فود', en: 'Fast Food' },
  },
  {
    key: 'nav.posters',
    labelAr: 'شريط التنقل — زر "بوسترات"',
    fallback: { ar: 'بوسترات', en: 'Posters' },
  },
  {
    key: 'nav.app',
    labelAr: 'شريط التنقل — زر "التطبيق"',
    fallback: { ar: 'التطبيق', en: 'App' },
  },
  {
    key: 'nav.story',
    labelAr: 'شريط التنقل — زر "القصة"',
    fallback: { ar: 'القصة', en: 'Story' },
  },
  {
    key: 'nav.flyer',
    labelAr: 'شريط التنقل — زر "العرض"',
    fallback: { ar: 'العرض', en: 'Offer' },
  },
  {
    key: 'app.badge',
    labelAr: 'قسم التطبيق — شارة "متوفر على iOS & Android"',
    fallback: { ar: 'متوفر على iOS & Android', en: 'Available on iOS & Android' },
  },
  {
    key: 'app.ctaButton',
    labelAr: 'قسم التطبيق — زر "حمله مجاناً"',
    fallback: { ar: 'حمله مجاناً', en: 'Download Free' },
  },
  {
    key: 'app.tagline',
    labelAr: 'قسم التطبيق — جملة "ابدأ الطبخ الذكي اليوم"',
    fallback: { ar: 'ابدأ الطبخ الذكي اليوم', en: 'Start smart cooking today' },
  },
  {
    key: 'app.feature1Title',
    labelAr: 'قسم التطبيق — عنوان الميزة الأولى',
    fallback: { ar: 'اقتراحات ذكية', en: 'Smart Suggestions' },
  },
  {
    key: 'app.feature1Desc',
    labelAr: 'قسم التطبيق — وصف الميزة الأولى',
    fallback: { ar: 'وصفات تناسب ذوقك', en: 'Recipes matching your taste' },
  },
  {
    key: 'app.feature2Title',
    labelAr: 'قسم التطبيق — عنوان الميزة التانية',
    fallback: { ar: 'مؤقت متعدد', en: 'Multi Timer' },
  },
  {
    key: 'app.feature2Desc',
    labelAr: 'قسم التطبيق — وصف الميزة التانية',
    fallback: { ar: 'تتبع كل مرحلة', en: 'Track every stage' },
  },
  {
    key: 'app.feature3Title',
    labelAr: 'قسم التطبيق — عنوان الميزة التالتة',
    fallback: { ar: 'قائمة تسوّق', en: 'Shopping List' },
  },
  {
    key: 'app.feature3Desc',
    labelAr: 'قسم التطبيق — وصف الميزة التالتة',
    fallback: { ar: 'كل المكونات بضغطة', en: 'All ingredients, one tap' },
  },
  {
    key: 'app.feature4Title',
    labelAr: 'قسم التطبيق — عنوان الميزة الرابعة',
    fallback: { ar: 'إحصائيات', en: 'Nutrition Stats' },
  },
  {
    key: 'app.feature4Desc',
    labelAr: 'قسم التطبيق — وصف الميزة الرابعة',
    fallback: { ar: 'تتبع سعراتك', en: 'Track your calories' },
  },
  {
    key: 'flyer.useCodeLabel',
    labelAr: 'قسم العرض — نص "استخدم الكود عند الدفع"',
    fallback: { ar: 'استخدم الكود عند الدفع', en: 'Use code at checkout' },
  },
  {
    key: 'flyer.schedule',
    labelAr: 'قسم العرض — جدول المواعيد (الصيغة: نص|فرعي,نص|فرعي,نص|فرعي)',
    fallback: { ar: 'الجمعة|المقبل,السبت|والأحد,من ٨ص|إلى ٣م', en: 'FRI|Next,SAT|& SUN,8AM|TO 3PM' },
  },
  {
    key: 'flyer.reserveCta',
    labelAr: 'قسم العرض — زر "احجز طاولتك"',
    fallback: { ar: 'احجز طاولتك', en: 'Reserve Your Table' },
  },
  {
    key: 'flyer.disclaimer',
    labelAr: 'قسم العرض — تنويه "لا يمكن دمج العروض"',
    fallback: { ar: 'لا يمكن دمج العروض', en: 'Cannot be combined with other offers' },
  },
  {
    key: 'poster.badge',
    labelAr: 'قسم البوسترات — شارة "العروض"',
    fallback: { ar: 'العروض', en: 'Featured' },
  },
  {
    key: 'poster.reserveCta',
    labelAr: 'قسم البوسترات — زر "احجز عرض"',
    fallback: { ar: 'احجز عرض', en: 'Reserve Offer' },
  },
  {
    key: 'menu.hotTag',
    labelAr: 'قسم المنيو — وسم "سخن"',
    fallback: { ar: 'سخن', en: 'Hot' },
  },
  {
    key: 'menu.coldTag',
    labelAr: 'قسم المنيو — وسم "بارد"',
    fallback: { ar: 'بارد', en: 'Cold' },
  },
  {
    key: 'menu.menuTag',
    labelAr: 'قسم المنيو — وسم "من القائمة"',
    fallback: { ar: 'من القائمة', en: 'Menu' },
  },
  {
    key: 'menu.searchPlaceholder',
    labelAr: 'قسم المنيو — نص خانة البحث',
    fallback: { ar: 'دوّر على طبق...', en: 'Search dishes...' },
  },
  {
    key: 'menu.allLabel',
    labelAr: 'قسم المنيو — فلتر "الكل"',
    fallback: { ar: 'الكل', en: 'All' },
  },
  {
    key: 'menu.noResults',
    labelAr: 'قسم المنيو — رسالة عدم وجود نتائج بحث',
    fallback: { ar: 'مفيش أطباق مطابقة للبحث ده', en: 'No dishes match your search' },
  },
  {
    key: 'menu.soldOut',
    labelAr: 'قسم المنيو — وسم "غير متاح حاليًا"',
    fallback: { ar: 'غير متاح حاليًا', en: 'Sold out' },
  },
  {
    key: 'menu.backSoon',
    labelAr: 'قسم المنيو — وسم "هيبقى متاح قريب"',
    fallback: { ar: 'هيبقى متاح قريب', en: 'Back soon' },
  },
  {
    key: 'menu.fullMenuTitle',
    labelAr: 'قسم المنيو — عنوان بطاقة "القائمة الكاملة"',
    fallback: { ar: 'القائمة الكاملة', en: 'Full Menu Available' },
  },
  {
    key: 'menu.fullMenuDesc',
    labelAr: 'قسم المنيو — وصف بطاقة "القائمة الكاملة"',
    fallback: { ar: 'تصفّح كل الأطباق والحلويات والمشروبات', en: 'Browse all dishes, desserts & beverages' },
  },
  {
    key: 'menu.fullMenuCta',
    labelAr: 'قسم المنيو — زر "القائمة الكاملة"',
    fallback: { ar: 'القائمة الكاملة →', en: 'View Full Menu →' },
  },
  {
    key: 'pasta.inclDelivery',
    labelAr: 'قسم الباستا — نص "يشمل التوصيل"',
    fallback: { ar: 'يشمل التوصيل', en: 'incl. delivery' },
  },
  {
    key: 'order.receivedTitle',
    labelAr: 'شاشة تأكيد الطلب — عنوان "تم استلام طلبك!"',
    fallback: { ar: 'تم استلام طلبك!', en: 'Your order was received!' },
  },
  {
    key: 'order.total',
    labelAr: 'الطلب — كلمة "الإجمالي"',
    fallback: { ar: 'الإجمالي', en: 'Total' },
  },
  {
    key: 'order.gotIt',
    labelAr: 'شاشة تأكيد الطلب — زر "تمام"',
    fallback: { ar: 'تمام', en: 'Got it' },
  },
  {
    key: 'order.missingWithAddress',
    labelAr: 'الطلب — تنبيه بيانات ناقصة (مع عنوان)',
    fallback: { ar: 'من فضلك اكتب الاسم ورقم الموبايل والعنوان', en: 'Please enter your name, phone and address' },
  },
  {
    key: 'order.missingNoAddress',
    labelAr: 'الطلب — تنبيه بيانات ناقصة (بدون عنوان)',
    fallback: { ar: 'من فضلك اكتب الاسم ورقم الموبايل', en: 'Please enter your name and phone' },
  },
  {
    key: 'order.deliveryOption',
    labelAr: 'الطلب — خيار "توصيل"',
    fallback: { ar: 'توصيل', en: 'Delivery' },
  },
  {
    key: 'order.pickupOption',
    labelAr: 'الطلب — خيار "استلام من الفرع"',
    fallback: { ar: 'استلام من الفرع', en: 'Pickup' },
  },
  {
    key: 'order.dineInOption',
    labelAr: 'الطلب — خيار "تناول في المكان"',
    fallback: { ar: 'تناول في المكان', en: 'Dine-in' },
  },
  {
    key: 'order.completeOrderTitle',
    labelAr: 'نافذة الطلب — عنوان "إتمام الطلب"',
    fallback: { ar: 'إتمام الطلب', en: 'Complete your order' },
  },
  {
    key: 'order.namePlaceholder',
    labelAr: 'نافذة الطلب — نص خانة الاسم',
    fallback: { ar: 'الاسم', en: 'Name' },
  },
  {
    key: 'order.phonePlaceholder',
    labelAr: 'نافذة الطلب — نص خانة رقم الموبايل',
    fallback: { ar: 'رقم الموبايل', en: 'Phone number' },
  },
  {
    key: 'order.deliveryMethodLabel',
    labelAr: 'نافذة الطلب — عنوان "طريقة الاستلام"',
    fallback: { ar: 'طريقة الاستلام', en: 'How will you get your order?' },
  },
  {
    key: 'order.addressPlaceholder',
    labelAr: 'نافذة الطلب — نص خانة العنوان',
    fallback: { ar: 'العنوان', en: 'Address' },
  },
  {
    key: 'order.optionalLabel',
    labelAr: 'نافذة الطلب — كلمة "اختياري"',
    fallback: { ar: 'اختياري', en: 'optional' },
  },
  {
    key: 'order.paymentMethodLabel',
    labelAr: 'نافذة الطلب — عنوان "طريقة الدفع"',
    fallback: { ar: 'طريقة الدفع', en: 'Payment method' },
  },
  {
    key: 'order.sendToNumber',
    labelAr: 'نافذة الطلب — نص "حوّل قيمة الطلب على رقم"',
    fallback: { ar: 'حوّل قيمة الطلب على رقم', en: 'Send the order total to' },
  },
  {
    key: 'order.noPaymentNumberWarning',
    labelAr: 'نافذة الطلب — تنبيه عدم وجود رقم دفع',
    fallback: { ar: 'رقم الدفع لسه متضافش من الإعدادات — اختر كاش أو كلم الإدارة', en: 'Payment number not set up yet in Settings — choose cash or contact the restaurant' },
  },
  {
    key: 'order.extrasLabel',
    labelAr: 'نافذة الطلب — عنوان "إضافات (اختياري)"',
    fallback: { ar: 'إضافات (اختياري)', en: 'Extras (optional)' },
  },
  {
    key: 'order.sendWhatsapp',
    labelAr: 'نافذة الطلب — زر "إرسال الطلب على واتساب"',
    fallback: { ar: 'إرسال الطلب على واتساب', en: 'Send order via WhatsApp' },
  },
  {
    key: 'order.cancel',
    labelAr: 'نافذة الطلب — زر "إلغاء"',
    fallback: { ar: 'إلغاء', en: 'Cancel' },
  },
  {
    key: 'order.hotTag',
    labelAr: 'السلة — وسم "سخن"',
    fallback: { ar: 'سخن', en: 'Hot' },
  },
  {
    key: 'order.coldTag',
    labelAr: 'السلة — وسم "بارد"',
    fallback: { ar: 'بارد', en: 'Cold' },
  },
  {
    key: 'order.orderNowButton',
    labelAr: 'زر "اطلب الآن" على كروت الأصناف',
    fallback: { ar: 'اطلب الآن', en: 'Order Now' },
  },
  {
    key: 'order.addToGroupOrder',
    labelAr: 'زر "أضف للطلب الجماعي"',
    fallback: { ar: 'أضف للطلب الجماعي', en: 'Add to group order' },
  },
  {
    key: 'order.tapToReview',
    labelAr: 'شريط الطلب الجماعي — "اضغط للمراجعة والإرسال"',
    fallback: { ar: 'اضغط للمراجعة والإرسال', en: 'Tap to review & send' },
  },
  {
    key: 'order.groupOrderTitle',
    labelAr: 'سلة الطلب الجماعي — العنوان',
    fallback: { ar: 'طلبك الجماعي', en: 'Your group order' },
  },
  {
    key: 'order.emptyCart',
    labelAr: 'سلة الطلب الجماعي — رسالة "السلة فاضية"',
    fallback: { ar: 'السلة فاضية', en: 'Your cart is empty' },
  },
  {
    key: 'order.removeButton',
    labelAr: 'سلة الطلب الجماعي — زر "حذف"',
    fallback: { ar: 'حذف', en: 'Remove' },
  },
  {
    key: 'order.imageLinksNote',
    labelAr: 'سلة الطلب الجماعي — ملاحظة روابط الصور',
    fallback: { ar: 'روابط صور الأصناف اللي ليها رابط عام هتتبعت مع رسالة الطلب على واتساب.', en: 'Public image links for items that have one will be sent along with the WhatsApp order message.' },
  },
  {
    key: 'order.orderNotePlaceholder',
    labelAr: 'سلة الطلب الجماعي — نص خانة الملاحظة',
    fallback: { ar: 'ملاحظة عامة على الطلب كله', en: 'General note for the whole order' },
  },
  {
    key: 'order.sendOrderButton',
    labelAr: 'سلة الطلب الجماعي — زر "إرسال الطلب"',
    fallback: { ar: 'إرسال الطلب', en: 'Send order' },
  },
  {
    key: 'status.openLabel',
    labelAr: 'شارة الحالة — "مفتوح الآن"',
    fallback: { ar: 'مفتوح الآن', en: 'Open now' },
  },
  {
    key: 'status.closedLabel',
    labelAr: 'شارة الحالة — "مقفول دلوقتي"',
    fallback: { ar: 'مقفول دلوقتي', en: 'Closed now' },
  },
];

// ---- Admin-added custom text slots (on top of the curated list above) ----
// Lets the admin register a brand-new editable text anywhere on the site
// without a code change: give it a label, then edit/delete it like any
// curated slot. Stored separately so curated slots (which components read
// with their own real fallback) never get confused with these.
const CUSTOM_TEXT_SLOTS_KEY = 'settings.siteTextCustomSlots';

export interface CustomTextSlot {
  key: string;
  labelAr: string;
}

export async function getCustomTextSlots(): Promise<CustomTextSlot[]> {
  return getSetting<CustomTextSlot[]>(CUSTOM_TEXT_SLOTS_KEY, []);
}

export async function addCustomTextSlot(labelAr: string): Promise<CustomTextSlot> {
  const slots = await getCustomTextSlots();
  const slot: CustomTextSlot = { key: `customText.${crypto.randomUUID()}`, labelAr };
  await setSetting(CUSTOM_TEXT_SLOTS_KEY, [...slots, slot]);
  return slot;
}

export async function removeCustomTextSlot(key: string): Promise<void> {
  const slots = await getCustomTextSlots();
  await setSetting(CUSTOM_TEXT_SLOTS_KEY, slots.filter((s) => s.key !== key));
  await resetSiteText(key);
}

export type SiteFont =
  | 'default' // the project's original bundled font
  | 'system' // native OS font (fastest, no download)
  | 'serif'
  | 'roundedSans';

export async function getSiteFont(): Promise<SiteFont> {
  return getSetting<SiteFont>(FONT_KEY, 'default');
}

export async function setSiteFont(font: SiteFont): Promise<void> {
  await setSetting(FONT_KEY, font);
  applySiteFont(font);
}

const FONT_STACKS: Record<SiteFont, string> = {
  default: '',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  roundedSans: '"Segoe UI Rounded", "Varela Round", Tahoma, sans-serif',
};

export function applySiteFont(font: SiteFont): void {
  if (font === 'default' || !FONT_STACKS[font]) {
    document.documentElement.style.removeProperty('--font-override');
  } else {
    document.documentElement.style.setProperty('--font-override', FONT_STACKS[font]);
  }
}
