import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDirection } from '../hooks/useDirection';
import { listItems, onDataChange } from '../lib/store';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import type { FeaturedOffer } from '../lib/types';

gsap.registerPlugin(ScrollTrigger);

const SAMPLE_POSTERS: FeaturedOffer[] = [
  {
    id: 'sample-1',
    titleEn: 'Truffle Risotto',
    titleAr: 'ريزوتو بالكمأ',
    descEn: 'Slow-cooked carnaroli rice with aged parmigiano',
    descAr: 'أرز كارنارولي بطيء الطبخ مع بارميجيانو معتّق',
    price: '120',
    oldPrice: '160',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=900&q=80',
    tagAr: 'جديد',
    tagEn: 'New',
  },
  {
    id: 'sample-2',
    titleEn: 'Wagyu Tenderloin',
    titleAr: 'لحم واغيو',
    descEn: 'Grade A5 wagyu, 200g, with seasonal greens',
    descAr: 'لحم واغيو درجة A5، ٢٠٠ جرام، مع خضار موسمية',
    price: '320',
    oldPrice: '420',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=900&q=80',
    tagAr: 'مميز',
    tagEn: 'Premium',
  },
  {
    id: 'sample-3',
    titleEn: 'Lobster Bisque',
    titleAr: 'حساء الكركند',
    descEn: 'Creamy French lobster soup with cognac finish',
    descAr: 'حساء كركند فرنسي كريمي مع الكونياك',
    price: '95',
    oldPrice: '130',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&q=80',
    tagAr: 'محدود',
    tagEn: 'Limited',
  },
];

export default function PosterSection() {
  const { dir } = useDirection();
  const ref = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [revealType, setRevealType] = useState<'circle' | 'line'>('circle');
  const [posters, setPosters] = useState<FeaturedOffer[]>(SAMPLE_POSTERS);
  const [heading1, setHeading1] = useState<TextOverride>({ ar: 'هذا', en: 'This' });
  const [heading2, setHeading2] = useState<TextOverride>({ ar: 'الأسبوع', en: "Week's" });
  const [heading3, setHeading3] = useState<TextOverride>({ ar: 'فقط', en: 'Only' });
  const [badge, setBadge] = useState<TextOverride>({ ar: 'العروض', en: 'Featured' });
  const [reserveCta, setReserveCta] = useState<TextOverride>({ ar: 'احجز عرض', en: 'Reserve Offer' });
  const isRTL = dir === 'rtl';

  useEffect(() => {
    async function load() {
      const list = await listItems<FeaturedOffer>('featuredOffers');
      setPosters(list.length > 0 ? list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : SAMPLE_POSTERS);
      setIndex(0);
    }
    load();
    return onDataChange((store) => {
      if (store === 'featuredOffers') load();
    });
  }, []);

  useEffect(() => {
    getSiteText('poster.heading1', heading1.ar, heading1.en).then(setHeading1);
    getSiteText('poster.heading2', heading2.ar, heading2.en).then(setHeading2);
    getSiteText('poster.heading3', heading3.ar, heading3.en).then(setHeading3);
    getSiteText('poster.badge', badge.ar, badge.en).then(setBadge);
    getSiteText('poster.reserveCta', reserveCta.ar, reserveCta.en).then(setReserveCta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.poster-header',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  const next = () => {
    setRevealType(Math.random() > 0.5 ? 'circle' : 'line');
    setIndex((p) => (p + 1) % posters.length);
  };
  const prev = () => {
    setRevealType(Math.random() > 0.5 ? 'circle' : 'line');
    setIndex((p) => (p - 1 + posters.length) % posters.length);
  };

  const current = posters[index] ?? posters[0];
  if (!current) return null;

  return (
    <section
      id="posters"
      ref={ref}
      dir={dir}
      className="relative bg-[#E8E8E9] text-[#1C1F21] overflow-hidden py-24 lg:py-32"
    >
      <div className="max-w-[1500px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="poster-header text-center mb-12 lg:mb-20">
          <div className="inline-flex items-center gap-3 text-[#A37C4A] text-xs uppercase tracking-[0.4em] font-medium mb-6">
            <span className="w-12 h-px bg-[#A37C4A]" />
            <span style={badge.color ? { color: badge.color } : undefined}>{isRTL ? badge.ar : badge.en}</span>
            <span className="w-12 h-px bg-[#A37C4A]" />
          </div>
          <h2 className="font-grotesk font-thin text-6xl sm:text-7xl lg:text-[8rem] leading-[0.95] tracking-tight">
            <span className="block" style={heading1.color ? { color: heading1.color } : undefined}>{isRTL ? heading1.ar : heading1.en}</span>
            <span className="block italic font-extralight text-[#A37C4A]" style={heading2.color ? { color: heading2.color } : undefined}>{isRTL ? heading2.ar : heading2.en}</span>
            <span className="block" style={heading3.color ? { color: heading3.color } : undefined}>{isRTL ? heading3.ar : heading3.en}</span>
          </h2>
        </div>

        {/* Carousel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual poster */}
          <div className="lg:col-span-7 relative aspect-[3/4] lg:aspect-[4/5]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 rounded-3xl overflow-hidden"
              >
                {/* Mask reveal */}
                <motion.div
                  key={`mask-${current.id}-${revealType}`}
                  initial={{
                    clipPath:
                      revealType === 'circle'
                        ? 'circle(0% at 50% 50%)'
                        : 'polygon(0 0, 0 0, 0 100%, 0 100%)',
                  }}
                  animate={{
                    clipPath:
                      revealType === 'circle'
                        ? 'circle(150% at 50% 50%)'
                        : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                  }}
                  transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
                  className="absolute inset-0"
                >
                  <div className="relative w-full h-full bg-white">
                    <img
                      src={current.image}
                      alt=""
                      className="w-full h-full object-cover ken-burns"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Tag */}
                    <div className="absolute top-6 left-6 bg-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#A37C4A]">
                      {isRTL ? current.tagAr : current.tagEn}
                    </div>

                    {/* Price tag */}
                    <div className="absolute bottom-6 right-6 bg-[#A37C4A] text-white px-5 py-3 rounded-2xl">
                      <div className="text-[10px] uppercase tracking-widest opacity-80 line-through">
                        {current.oldPrice} EGP
                      </div>
                      <div className="text-3xl font-display font-black italic">
                        {current.price} EGP
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Pagination dots */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {posters.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setRevealType(i % 2 === 0 ? 'circle' : 'line');
                    setIndex(i);
                  }}
                  className={`h-1 rounded-full transition-all ${
                    i === index ? 'w-8 bg-[#A37C4A]' : 'w-1 bg-[#1C1F21]/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Text side */}
          <div className="lg:col-span-5 text-center lg:text-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#A37C4A] font-medium mb-4">
                  0{index + 1} / 0{posters.length}
                </div>
                <h3
                  className="font-grotesk font-thin text-5xl lg:text-7xl leading-[0.95] tracking-tight mb-6"
                  style={current.titleColor ? { color: current.titleColor } : undefined}
                >
                  {isRTL ? current.titleAr : current.titleEn}
                </h3>
                <p className="text-base lg:text-lg text-[#1C1F21]/60 font-light leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                  {isRTL ? current.descAr : current.descEn}
                </p>

                <div className="flex items-center gap-6 justify-center lg:justify-start">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-2 border-[#1C1F21] text-[#1C1F21] px-8 py-4 rounded-full font-medium uppercase tracking-widest text-xs hover:bg-[#1C1F21] hover:text-white transition-colors"
                    style={reserveCta.color ? { color: reserveCta.color } : undefined}
                  >
                    {isRTL ? reserveCta.ar : reserveCta.en}
                  </motion.button>
                  <div className="flex gap-2">
                    <button
                      onClick={prev}
                      className="w-12 h-12 rounded-full border border-[#1C1F21]/20 hover:border-[#A37C4A] hover:text-[#A37C4A] transition-colors flex items-center justify-center"
                      aria-label="Previous"
                    >
                      {isRTL ? '→' : '←'}
                    </button>
                    <button
                      onClick={next}
                      className="w-12 h-12 rounded-full border border-[#1C1F21]/20 hover:border-[#A37C4A] hover:text-[#A37C4A] transition-colors flex items-center justify-center"
                      aria-label="Next"
                    >
                      {isRTL ? '←' : '→'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
