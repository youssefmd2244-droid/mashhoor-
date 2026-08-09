import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDirection } from '../hooks/useDirection';
import { QuickOrderButton } from '../components/ordering/OrderingWidgets';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { listItems, onDataChange } from '../lib/store';
import type { FastFoodProduct } from '../lib/types';

gsap.registerPlugin(ScrollTrigger);

const FLYING_ITEMS = [
  { emoji: '🍅', x: -300, y: -200, rot: -25, delay: 0, color: '#9B3734' },
  { emoji: '🥬', x: 280, y: -180, rot: 30, delay: 0.1, color: '#869B11' },
  { emoji: '🧀', x: -250, y: 150, rot: 15, delay: 0.2, color: '#EEC31C' },
  { emoji: '🌶️', x: 320, y: 200, rot: -40, delay: 0.3, color: '#9B3734' },
  { emoji: '🍔', x: -380, y: 0, rot: 20, delay: 0.4, color: '#9B3734' },
  { emoji: '🍟', x: 380, y: 50, rot: -15, delay: 0.5, color: '#EEC31C' },
  { emoji: '🥤', x: 0, y: -280, rot: 10, delay: 0.6, color: '#9B3734' },
  { emoji: '🥓', x: -100, y: 280, rot: -30, delay: 0.7, color: '#9B3734' },
  { emoji: '🥒', x: 100, y: -300, rot: 25, delay: 0.8, color: '#869B11' },
  { emoji: '🍞', x: 0, y: 320, rot: -10, delay: 0.9, color: '#846950' },
];

// Shown only until the restaurant adds its own cards from Settings →
// المحتوى → قسم الفاست فود — this is placeholder/demo content.
const DEMO_PRODUCTS: FastFoodProduct[] = [
  { id: 'demo-ff-1', nameAr: 'دبل سماش', nameEn: 'DOUBLE SMASH', price: 45, color: '#9B3734' },
  { id: 'demo-ff-2', nameAr: 'بطاطس بالجبنة', nameEn: 'CHEESE FRIES', price: 22, color: '#869B11' },
  { id: 'demo-ff-3', nameAr: 'أجنحة دجاج', nameEn: 'CHICKEN WINGS', price: 38, color: '#9B3734' },
];

const FALLBACK_SUB: TextOverride = {
  ar: '🔥 وصفات الشارع الأصلية — بسرعة الصاروخ 🔥',
  en: '🔥 Original street recipes — rocket fast 🔥',
};
const FALLBACK_TAGLINE: TextOverride = {
  ar: '⚡ توصيل في ١٥ دقيقة أو الفلوس يرجع',
  en: '⚡ 15-MIN DELIVERY OR YOUR MONEY BACK',
};
const FALLBACK_BADGE: TextOverride = { ar: '⚡ أجواء الشارع', en: '⚡ STREET FOOD VIBES' };
const FALLBACK_HOT_LABEL: TextOverride = { ar: 'ناار 🔥', en: 'HOT 🔥' };
const FALLBACK_CTA: TextOverride = { ar: 'اطلب دلوقتي →', en: 'Order Now →' };

export default function FastFoodSection() {
  const { dir } = useDirection();
  const ref = useRef<HTMLElement>(null);
  const isRTL = dir === 'rtl';
  const [sub, setSub] = useState<TextOverride>(FALLBACK_SUB);
  const [tagline, setTagline] = useState<TextOverride>(FALLBACK_TAGLINE);
  const [badge, setBadge] = useState<TextOverride>(FALLBACK_BADGE);
  const [hotLabel, setHotLabel] = useState<TextOverride>(FALLBACK_HOT_LABEL);
  const [cta, setCta] = useState<TextOverride>(FALLBACK_CTA);
  const [products, setProducts] = useState<FastFoodProduct[]>(DEMO_PRODUCTS);

  useEffect(() => {
    function load() {
      getSiteText('fastfood.subtitle', FALLBACK_SUB.ar, FALLBACK_SUB.en).then(setSub);
      getSiteText('fastfood.tagline', FALLBACK_TAGLINE.ar, FALLBACK_TAGLINE.en).then(setTagline);
      getSiteText('fastfood.badge', FALLBACK_BADGE.ar, FALLBACK_BADGE.en).then(setBadge);
      getSiteText('fastfood.hotLabel', FALLBACK_HOT_LABEL.ar, FALLBACK_HOT_LABEL.en).then(setHotLabel);
      getSiteText('fastfood.cta', FALLBACK_CTA.ar, FALLBACK_CTA.en).then(setCta);
      listItems<FastFoodProduct>('fastFoodProducts').then((list) =>
        setProducts(list.length ? list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : DEMO_PRODUCTS)
      );
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings' || store === 'fastFoodProducts') load();
    });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.ff-title',
        { y: 100, opacity: 0, scale: 0.7 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'elastic.out(1, 0.5)',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );

      gsap.fromTo(
        '.ff-sub',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );

      gsap.fromTo(
        '.ff-product',
        { x: (i) => (i % 2 === 0 ? -150 : 150), opacity: 0, rotate: (i) => (i % 2 === 0 ? -15 : 15) },
        {
          x: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.7,
          ease: 'elastic.out(1, 0.6)',
          stagger: 0.1,
          scrollTrigger: { trigger: '.ff-products', start: 'top 75%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="fastfood"
      ref={ref}
      dir={dir}
      className="relative bg-[#F2BF05] text-[#1C1F21] overflow-hidden py-24 lg:py-40"
    >
      {/* Halftone pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#1C1F21 2px, transparent 2px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <motion.div
            initial={{ scale: 0, rotate: 45 }}
            whileInView={{ scale: 1, rotate: -6 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-block bg-[#9B3734] text-[#F2BF05] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 shadow-2xl"
            style={badge.color ? { color: badge.color } : undefined}
          >
            {isRTL ? badge.ar : badge.en}
          </motion.div>

          <h2 className="ff-title font-bubble text-7xl sm:text-8xl lg:text-[12rem] leading-[0.85] italic text-[#1C1F21]">
            <span className="block">EAT</span>
            <span className="block text-[#9B3734] -mt-4">FAST.</span>
            <span className="block text-[#1C1F21] -mt-4">EAT WILD.</span>
          </h2>

          <p
            className="ff-sub mt-8 text-base lg:text-xl text-[#1C1F21]/70 max-w-2xl mx-auto font-bold uppercase tracking-wider"
            style={sub.color ? { color: sub.color } : undefined}
          >
            {isRTL ? sub.ar : sub.en}
          </p>
        </div>

        {/* Flying ingredients composition */}
        <div className="relative h-[400px] lg:h-[500px] mb-16 flex items-center justify-center">
          {/* Center star */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute w-72 h-72 lg:w-96 lg:h-96"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon
                points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35"
                fill="#9B3734"
                stroke="#1C1F21"
                strokeWidth="2"
              />
            </svg>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.3 }}
            className="relative z-10 text-center"
          >
            <div className="text-9xl lg:text-[12rem] leading-none">🍔</div>
            <div className="mt-2 font-bubble text-2xl text-[#1C1F21]">FRESH!</div>
          </motion.div>

          {/* Flying items */}
          {FLYING_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
              whileInView={{ x: item.x, y: item.y, scale: 1, rotate: item.rot }}
              viewport={{ once: true }}
              transition={{
                delay: 0.4 + item.delay,
                type: 'spring',
                stiffness: 200,
                damping: 12,
              }}
              whileHover={{ scale: 1.3, rotate: 0, zIndex: 50 }}
              className="absolute text-5xl lg:text-7xl cursor-pointer"
              style={{ filter: 'drop-shadow(4px 4px 0 #1C1F21)' }}
            >
              {item.emoji}
            </motion.div>
          ))}

          {/* Speed lines */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute h-1 bg-[#1C1F21]"
                style={{
                  top: `${10 + i * 12}%`,
                  left: 0,
                  right: 0,
                  transform: `rotate(${(i % 2 === 0 ? -2 : 2)}deg)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="ff-products grid grid-cols-1 md:grid-cols-3 gap-5">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              whileHover={{ y: -8, rotate: -2 }}
              className="ff-product bg-[#1C1F21] text-[#F2BF05] p-6 lg:p-8 rounded-3xl border-4 border-[#1C1F21] shadow-[8px_8px_0_#9B3734] hover:shadow-[12px_12px_0_#9B3734] transition-shadow overflow-hidden relative"
            >
              {p.image && (
                <img
                  src={p.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                />
              )}
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <span className="font-mono text-xs text-[#F2BF05]/60">0{i + 1}</span>
                  <span className="text-xs font-bold uppercase tracking-widest bg-[#F2BF05] text-[#1C1F21] px-2 py-1 rounded">
                    {isRTL ? hotLabel.ar : hotLabel.en}
                  </span>
                </div>
                <h3
                  className="font-bubble text-4xl lg:text-5xl italic leading-none mb-3"
                  style={p.nameColor ? { color: p.nameColor } : undefined}
                >
                  {isRTL ? p.nameAr : p.nameEn}
                </h3>
                <div className="flex items-end justify-between mt-6 mb-4">
                  <span className="text-5xl font-display font-black italic">
                    {p.price}
                    <span className="text-sm ml-1 not-italic">EGP</span>
                  </span>
                </div>
                <div className="[&_button]:!rounded-full [&_input]:!text-black">
                  <QuickOrderButton
                    item={{ id: p.id, nameAr: p.nameAr, nameEn: p.nameEn, price: p.price, temperature: 'hot' }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tagline banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-[#1C1F21] text-[#F2BF05] rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div
            className="text-2xl lg:text-3xl font-bubble italic text-center md:text-start"
            style={tagline.color ? { color: tagline.color } : undefined}
          >
            {isRTL ? tagline.ar : tagline.en}
          </div>
          <button
            className="bg-[#F2BF05] text-[#1C1F21] px-6 py-3 rounded-full font-bold uppercase tracking-widest text-sm whitespace-nowrap"
            style={cta.color ? { color: cta.color } : undefined}
          >
            {isRTL ? cta.ar : cta.en}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
