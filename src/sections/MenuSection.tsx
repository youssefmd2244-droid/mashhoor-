import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDirection } from '../hooks/useDirection';
import { QuickOrderButton } from '../components/ordering/OrderingWidgets';
import { listItems, onDataChange } from '../lib/store';
import { onFocusMenuSearch } from '../lib/uiEvents';
import { getCurrency, CURRENCY_PRESETS, type CurrencySettings } from '../lib/currency';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import type { MenuItem, Category } from '../lib/types';

gsap.registerPlugin(ScrollTrigger);

// Shown only until the restaurant adds its own items from Settings → المحتوى
// → الأصناف — this is placeholder/demo content, never a substitute for it.
const DEMO_ITEMS = [
  {
    id: 'demo-1',
    nameAr: 'ستيك لحم الضأن',
    nameEn: 'Lamb Tenderloin',
    descAr: 'لحم ضأن مشوي ببطء مع صلصة الزعتر والكمأ الأسود',
    descEn: 'Slow-grilled lamb with thyme & black truffle glaze',
    price: 185,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    tag: 'Signature',
    available: true,
  },
  {
    id: 'demo-2',
    nameAr: 'باستا الكمأ',
    nameEn: 'Truffle Pasta',
    descAr: 'تاغلياتيلي طازجة مع زبدة الكمأ والبارميزان',
    descEn: 'Fresh tagliatelle with truffle butter & aged parmesan',
    price: 145,
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
    tag: 'Chef’s Pick',
    available: true,
  },
  {
    id: 'demo-3',
    nameAr: 'سلمون مشوي',
    nameEn: 'Charred Salmon',
    descAr: 'سلمون الأطلسي مع خضار موسمية وشمر محمص',
    descEn: 'Atlantic salmon with seasonal vegetables & roasted fennel',
    price: 165,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    tag: 'New',
    available: true,
  },
  {
    id: 'demo-4',
    nameAr: 'كبسة دجاج',
    nameEn: 'Chicken Kabsa',
    descAr: 'دجاج مدفون مع أرز بسمتي و بهارات عربية أصلية',
    descEn: 'Slow-buried chicken with basmati rice & authentic Arabic spices',
    price: 95,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    tag: 'Heritage',
    available: true,
  },
  {
    id: 'demo-5',
    nameAr: 'برجر لحم الأنجوس',
    nameEn: 'Angus Beef Burger',
    descAr: 'لحم أنجوس 200 جرام مع جبنة شيدر مدخنة وصوص خاص',
    descEn: '200g Angus beef patty with smoked cheddar & house sauce',
    price: 110,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    tag: 'Popular',
    available: true,
  },
  {
    id: 'demo-6',
    nameAr: 'تشيز كيك التوت',
    nameEn: 'Berry Cheesecake',
    descAr: 'تشيز كيك كريمي مع كومبوت التوت الطازج',
    descEn: 'Creamy cheesecake with fresh berry compote',
    price: 55,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
    tag: 'Sweet',
    available: true,
  },
];

interface DisplayItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr?: string;
  descEn?: string;
  price: number;
  image?: string;
  gallery?: MenuItem['gallery'];
  tag: string;
  available: boolean;
  sizesEnabled?: boolean;
  sizes?: MenuItem['sizes'];
  nameColor?: string;
  tagColor?: string;
}

export default function MenuSection() {
  const { dir } = useDirection();
  const ref = useRef<HTMLElement>(null);
  const isRTL = dir === 'rtl';
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>(DEMO_ITEMS);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeTag, setActiveTag] = useState<string>('all');
  const [quickView, setQuickView] = useState<DisplayItem | null>(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState<{ kind: 'image' | 'video'; url: string } | null>(null);
  const [currency, setCurrencyState] = useState<CurrencySettings>(CURRENCY_PRESETS[0]);
  const [title1, setTitle1] = useState<TextOverride>({ ar: 'THE', en: 'THE' });
  const [title2, setTitle2] = useState<TextOverride>({ ar: 'MENU', en: 'MENU' });
  const [subtitle, setSubtitle] = useState<TextOverride>({
    ar: 'تشكيلة منتقاة بعناية من الأطباق الموقّعة. كل طبق محضّر من مكونات طازجة ومصدر محلي.',
    en: 'A curated selection of signature dishes. Every plate prepared from fresh, locally-sourced ingredients.',
  });
  const [hotTag, setHotTag] = useState<TextOverride>({ ar: 'سخن', en: 'Hot' });
  const [coldTag, setColdTag] = useState<TextOverride>({ ar: 'بارد', en: 'Cold' });
  const [menuTag, setMenuTag] = useState<TextOverride>({ ar: 'من القائمة', en: 'Menu' });
  const [searchPlaceholder, setSearchPlaceholder] = useState<TextOverride>({ ar: 'دوّر على طبق...', en: 'Search dishes...' });
  const [allLabel, setAllLabel] = useState<TextOverride>({ ar: 'الكل', en: 'All' });
  const [noResults, setNoResults] = useState<TextOverride>({ ar: 'مفيش أطباق مطابقة للبحث ده', en: 'No dishes match your search' });
  const [soldOut, setSoldOut] = useState<TextOverride>({ ar: 'غير متاح حاليًا', en: 'Sold out' });
  const [backSoon, setBackSoon] = useState<TextOverride>({ ar: 'هيبقى متاح قريب', en: 'Back soon' });
  const [fullMenuTitle, setFullMenuTitle] = useState<TextOverride>({ ar: 'القائمة الكاملة', en: 'Full Menu Available' });
  const [fullMenuDesc, setFullMenuDesc] = useState<TextOverride>({ ar: 'تصفّح كل الأطباق والحلويات والمشروبات', en: 'Browse all dishes, desserts & beverages' });
  const [fullMenuCta, setFullMenuCta] = useState<TextOverride>({ ar: 'القائمة الكاملة →', en: 'View Full Menu →' });

  useEffect(() => {
    getCurrency().then(setCurrencyState);
    getSiteText('menu.title1', title1.ar, title1.en).then(setTitle1);
    getSiteText('menu.title2', title2.ar, title2.en).then(setTitle2);
    getSiteText('menu.subtitle', subtitle.ar, subtitle.en).then(setSubtitle);
    getSiteText('menu.hotTag', hotTag.ar, hotTag.en).then(setHotTag);
    getSiteText('menu.coldTag', coldTag.ar, coldTag.en).then(setColdTag);
    getSiteText('menu.menuTag', menuTag.ar, menuTag.en).then(setMenuTag);
    getSiteText('menu.searchPlaceholder', searchPlaceholder.ar, searchPlaceholder.en).then(setSearchPlaceholder);
    getSiteText('menu.allLabel', allLabel.ar, allLabel.en).then(setAllLabel);
    getSiteText('menu.noResults', noResults.ar, noResults.en).then(setNoResults);
    getSiteText('menu.soldOut', soldOut.ar, soldOut.en).then(setSoldOut);
    getSiteText('menu.backSoon', backSoon.ar, backSoon.en).then(setBackSoon);
    getSiteText('menu.fullMenuTitle', fullMenuTitle.ar, fullMenuTitle.en).then(setFullMenuTitle);
    getSiteText('menu.fullMenuDesc', fullMenuDesc.ar, fullMenuDesc.en).then(setFullMenuDesc);
    getSiteText('menu.fullMenuCta', fullMenuCta.ar, fullMenuCta.en).then(setFullMenuCta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull the restaurant's real menu (added from Settings → المحتوى → الأصناف).
  // Falls back to the built-in demo dishes only when the admin hasn't added
  // anything yet, so a fresh install isn't a blank section — but the moment
  // real items exist, they fully replace the demo ones.
  //
  // loadMenu is re-run automatically whenever local data changes — either
  // because this same browser edited it, or because a realtime cloud sync
  // (Supabase/Firebase push, or GitHub polling) just merged in a change made
  // on another device. Either way, visitors see it instantly, no refresh.
  useEffect(() => {
    async function loadMenu() {
      const [items, cats] = await Promise.all([
        listItems<MenuItem>('menuItems'),
        listItems<Category>('categories'),
      ]);
      if (items.length === 0) return; // keep demo content
      const catName = (id?: string) => cats.find((c) => c.id === id);
      const mapped: DisplayItem[] = items
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((it) => {
          const cat = catName(it.categoryId);
          const tag = cat
            ? isRTL
              ? cat.nameAr
              : cat.nameEn
            : it.temperature === 'hot'
              ? isRTL ? hotTag.ar : hotTag.en
              : it.temperature === 'cold'
                ? isRTL ? coldTag.ar : coldTag.en
                : isRTL ? menuTag.ar : menuTag.en;
          return {
            id: it.id,
            nameAr: it.nameAr,
            nameEn: it.nameEn,
            descAr: it.descAr,
            descEn: it.descEn,
            price: it.price,
            image: it.image,
            gallery: it.gallery,
            tag,
            available: it.available !== false,
            sizesEnabled: it.sizesEnabled,
            sizes: it.sizes,
            nameColor: it.nameColor,
            tagColor: cat?.nameColor,
          };
        });
      setDisplayItems(mapped);
    }

    loadMenu();
    const unsubscribe = onDataChange((store) => {
      if (store === 'menuItems' || store === 'categories') loadMenu();
    });
    return unsubscribe;
  }, [isRTL]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const ySlow = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);
  const yFast = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);

  // Search icon in the top nav (see Navigation.tsx) scrolls here then fires
  // this event so the search box gets focused, ready to type immediately.
  useEffect(() => onFocusMenuSearch(() => searchInputRef.current?.focus()), []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.menu-title-line',
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.15,
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );

      gsap.fromTo(
        '.menu-card',
        { y: 80, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '.menu-grid', start: 'top 75%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [displayItems]);

  // Tag chips are derived straight from the items so they scale automatically
  // whether the menu has 6 dishes or 200 — no manual chip configuration needed,
  // which matters for a system meant to serve small shops and big hotel menus alike.
  const tags = Array.from(new Set(displayItems.map((i) => i.tag))).filter(Boolean);

  const filteredItems = displayItems.filter((item) => {
    const matchesTag = activeTag === 'all' || item.tag === activeTag;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.nameAr.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      (item.descAr ?? '').toLowerCase().includes(q) ||
      (item.descEn ?? '').toLowerCase().includes(q);
    return matchesTag && matchesSearch;
  });

  return (
    <section
      id="menu"
      ref={ref}
      dir={dir}
      className="relative bg-[#1C1F21] text-[#B9B097] overflow-hidden py-24 lg:py-40"
    >
      {/* Background layers with parallax */}
      <motion.div
        style={{ y: ySlow }}
        className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        // glow
      >
        <div className="w-full h-full rounded-full bg-[#B9B097]" />
      </motion.div>
      <motion.div
        style={{ y: yFast }}
        className="absolute bottom-20 left-0 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
      >
        <div className="w-full h-full rounded-full bg-[#403933]" />
      </motion.div>

      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(#B9B097 1px, transparent 1px), linear-gradient(90deg, #B9B097 1px, transparent 1px)',
             backgroundSize: '80px 80px',
           }}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-10">
        {/* Section header */}
        <div className="mb-16 lg:mb-24">
          <div className="flex items-baseline gap-6 mb-8">
            <span className="font-mono text-xs text-[#B9B097]/50">— 01 / MENU</span>
            <div className="h-px flex-1 bg-[#403933]" />
            <span className="font-mono text-xs text-[#B9B097]/50">2026</span>
          </div>

          <h2 className="font-grotesk text-7xl sm:text-8xl lg:text-[10rem] font-black leading-[0.85] tracking-tight">
            <span className="menu-title-line block text-[#B9B097]" style={title1.color ? { color: title1.color } : undefined}>{isRTL ? title1.ar : title1.en}</span>
            <span className="menu-title-line block italic text-[#B9B097]/40 font-thin text-stroke" style={title2.color ? { color: title2.color } : undefined}>{isRTL ? title2.ar : title2.en}</span>
          </h2>

          <p
            className="mt-8 text-[#B9B097]/60 max-w-xl text-base lg:text-lg font-light leading-relaxed"
            style={subtitle.color ? { color: subtitle.color } : undefined}
          >
            {isRTL ? subtitle.ar : subtitle.en}
          </p>

        </div>

        {/* Search + filter chips — keeps big menus (multi-branch / hotel room-service scale) easy to scan */}
        <div className="mb-10 space-y-4">
          <div className="relative max-w-md">
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRTL ? searchPlaceholder.ar : searchPlaceholder.en}
              className="w-full bg-[#202325] border border-[#403933]/60 rounded-full px-5 py-3 text-sm text-[#B9B097]
                         placeholder:text-[#B9B097]/40 outline-none focus:border-[#B9B097]/50 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute top-1/2 -translate-y-1/2 end-4 text-[#B9B097]/50 hover:text-[#B9B097]"
                aria-label="clear"
              >
                ×
              </button>
            )}
          </div>

          {tags.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeTag === 'all'
                    ? 'bg-[#B9B097] text-[#1C1F21] border-[#B9B097]'
                    : 'border-[#403933]/60 text-[#B9B097]/60 hover:border-[#B9B097]/40'
                }`}
              >
                {isRTL ? allLabel.ar : allLabel.en}
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeTag === tag
                      ? 'bg-[#B9B097] text-[#1C1F21] border-[#B9B097]'
                      : 'border-[#403933]/60 text-[#B9B097]/60 hover:border-[#B9B097]/40'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {filteredItems.length === 0 && (
            <p className="text-[#B9B097]/40 text-sm">
              {isRTL ? noResults.ar : noResults.en}
            </p>
          )}
        </div>

        {/* Grid */}
        <div className="menu-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredItems.map((item, i) => (
            <motion.article
              key={item.id}
              whileHover={{ y: -10 }}
              className="menu-card group relative bg-[#202325] rounded-3xl overflow-hidden border border-[#403933]/40 hover:border-[#B9B097]/30 transition-all duration-500"
            >
              {/* Image with parallax — tap/click to open a full quick-view */}
              <div
                className="relative h-72 overflow-hidden cursor-zoom-in"
                onClick={() => item.available && (setQuickView(item), setActiveMediaUrl(item.image ? { kind: 'image', url: item.image } : null))}
              >
                {item.image ? (
                  <motion.img
                    src={item.image}
                    alt={isRTL ? item.nameAr : item.nameEn}
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`w-full h-full object-cover ${!item.available ? 'grayscale opacity-50' : ''}`}
                    style={{ y: yFast }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#403933]/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#202325] via-transparent to-transparent" />
                <div
                  className="absolute top-4 start-4 bg-[#B9B097] text-[#1C1F21] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={item.tagColor ? { color: item.tagColor } : undefined}
                >
                  {item.tag}
                </div>
                <div className="absolute top-4 end-4 bg-[#1C1F21]/80 backdrop-blur text-[#B9B097] px-3 py-1 rounded-full text-[10px] font-mono">
                  0{i + 1}
                </div>
                {!item.available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="bg-red-500/90 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                      {isRTL ? soldOut.ar : soldOut.en}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 lg:p-7">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3
                    className="text-2xl lg:text-3xl font-bold text-[#B9B097] leading-tight"
                    style={item.nameColor ? { color: item.nameColor } : undefined}
                  >
                    {isRTL ? item.nameAr : item.nameEn}
                  </h3>
                  <span className="font-mono text-lg text-[#B9B097] whitespace-nowrap">
                    {item.price}
                    <span className="text-[#B9B097]/50 text-sm"> {isRTL ? currency.symbolAr : currency.symbolEn}</span>
                  </span>
                </div>
                {(isRTL ? item.descAr : item.descEn) && (
                  <p className="text-sm text-[#B9B097]/60 font-light leading-relaxed mb-5">
                    {isRTL ? item.descAr : item.descEn}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#403933]/40">
                  {item.available ? (
                    <div className="[&_button]:!rounded-full [&_button]:!text-xs flex-1">
                      <QuickOrderButton
                        item={{ id: item.id, nameAr: item.nameAr, nameEn: item.nameEn, price: item.price, image: item.image, sizesEnabled: item.sizesEnabled, sizes: item.sizes }}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-[#B9B097]/40">
                      {isRTL ? backSoon.ar : backSoon.en}
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-20 flex flex-col lg:flex-row items-center justify-between gap-6 p-8 lg:p-12 rounded-3xl border border-[#403933]/40 bg-[#202325]">
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold text-[#B9B097] mb-2">
              {isRTL ? fullMenuTitle.ar : fullMenuTitle.en}
            </h3>
            <p className="text-[#B9B097]/60 text-sm">
              {isRTL ? fullMenuDesc.ar : fullMenuDesc.en}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, x: 5 }}
            className="bg-[#B9B097] text-[#1C1F21] px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm"
          >
            {isRTL ? fullMenuCta.ar : fullMenuCta.en}
          </motion.button>
        </div>
      </div>

      {/* Quick-view — big hero image + full details, closes on backdrop tap */}
      {quickView && (
        <div
          className="fixed inset-0 z-[180] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setQuickView(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#202325] rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#403933]/50"
          >
            <div className="relative h-80 sm:h-96">
              {activeMediaUrl?.kind === 'video' ? (
                <video src={activeMediaUrl.url} controls autoPlay className="w-full h-full object-cover bg-black" />
              ) : quickView.image || activeMediaUrl?.url ? (
                <img
                  src={activeMediaUrl?.url || quickView.image}
                  alt={isRTL ? quickView.nameAr : quickView.nameEn}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#403933]/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#202325] via-transparent to-transparent" />
              <div
                className="absolute top-4 start-4 bg-[#B9B097] text-[#1C1F21] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={quickView.tagColor ? { color: quickView.tagColor } : undefined}
              >
                {quickView.tag}
              </div>
              <button
                onClick={() => setQuickView(null)}
                className="absolute top-4 end-4 w-9 h-9 rounded-full bg-[#1C1F21]/80 backdrop-blur text-[#B9B097] flex items-center justify-center text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Extra photos/videos gallery — tap a thumbnail to view it big above */}
            {!!quickView.gallery?.length && (
              <div className="flex gap-2 px-6 lg:px-8 pt-4 overflow-x-auto">
                {quickView.image && (
                  <button
                    onClick={() => setActiveMediaUrl({ kind: 'image', url: quickView.image! })}
                    className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 ${
                      activeMediaUrl?.url === quickView.image ? 'border-[#B9B097]' : 'border-transparent'
                    }`}
                  >
                    <img src={quickView.image} className="w-full h-full object-cover" alt="" />
                  </button>
                )}
                {quickView.gallery.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMediaUrl({ kind: m.kind, url: m.url })}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 bg-black ${
                      activeMediaUrl?.url === m.url ? 'border-[#B9B097]' : 'border-transparent'
                    }`}
                  >
                    {m.kind === 'video' ? (
                      <>
                        <video src={m.url} className="w-full h-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center text-white text-lg">▶</span>
                      </>
                    ) : (
                      <img src={m.url} className="w-full h-full object-cover" alt="" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3
                  className="text-3xl lg:text-4xl font-bold text-[#B9B097] leading-tight"
                  style={quickView.nameColor ? { color: quickView.nameColor } : undefined}
                >
                  {isRTL ? quickView.nameAr : quickView.nameEn}
                </h3>
                <span className="font-mono text-xl text-[#B9B097] whitespace-nowrap">
                  {quickView.price}
                  <span className="text-[#B9B097]/50 text-sm"> {isRTL ? currency.symbolAr : currency.symbolEn}</span>
                </span>
              </div>
              {(isRTL ? quickView.descAr : quickView.descEn) && (
                <p className="text-base text-[#B9B097]/70 font-light leading-relaxed mb-6">
                  {isRTL ? quickView.descAr : quickView.descEn}
                </p>
              )}
              {!!quickView.gallery?.length && (
                <div className="space-y-1 mb-6">
                  {quickView.gallery.filter((m) => m.captionAr || m.captionEn).map((m) => (
                    <p key={m.id} className="text-xs text-[#B9B097]/50">
                      • {isRTL ? m.captionAr || m.captionEn : m.captionEn || m.captionAr}
                    </p>
                  ))}
                </div>
              )}
              <div className="pt-4 border-t border-[#403933]/40 [&_button]:!rounded-full">
                <QuickOrderButton
                  item={{ id: quickView.id, nameAr: quickView.nameAr, nameEn: quickView.nameEn, price: quickView.price, image: quickView.image, sizesEnabled: quickView.sizesEnabled, sizes: quickView.sizes }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
