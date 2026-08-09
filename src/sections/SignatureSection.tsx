import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDirection } from '../hooks/useDirection';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { getSiteAsset } from '../lib/siteAssets';
import { listItems, onDataChange } from '../lib/store';
import type { SignatureFeature } from '../lib/types';

gsap.registerPlugin(ScrollTrigger);

// Shown only until the restaurant adds its own cards from Settings →
// المحتوى → قسم الهوية — this is placeholder/demo content.
const DEMO_FEATURES: SignatureFeature[] = [
  {
    id: 'demo-sig-1',
    icon: '🌿',
    titleAr: 'مكونات عضوية',
    titleEn: 'Organic Sourcing',
    descAr: 'من مزارع محلية معتمدة، طازجة كل يوم',
    descEn: 'From certified local farms, fresh every day',
  },
  {
    id: 'demo-sig-2',
    icon: '🔥',
    titleAr: 'شوي على الحطب',
    titleEn: 'Wood-Fire Grill',
    descAr: 'نكهة مدخنة أصيلة من خشب الزيتون',
    descEn: 'Authentic smoky flavor from olive wood',
  },
  {
    id: 'demo-sig-3',
    icon: '👨‍🍳',
    titleAr: 'شيف حائز على نجوم',
    titleEn: 'Michelin-Trained Chef',
    descAr: 'خبرة ١٥ سنة في أرقى المطاعم',
    descEn: '15 years at the world\'s finest restaurants',
  },
  {
    id: 'demo-sig-4',
    icon: '🥘',
    titleAr: 'وصفات أمهات',
    titleEn: 'Heritage Recipes',
    descAr: 'موروث عائلي من ثلاث أجيال',
    descEn: 'Family recipes passed down three generations',
  },
];

const FALLBACK_H1: TextOverride = { ar: 'من قلب', en: 'From the heart' };
const FALLBACK_H2: TextOverride = { ar: 'التراث', en: 'of heritage,' };
const FALLBACK_H3: TextOverride = { ar: 'إلى مائدتك', en: 'to your table' };
const FALLBACK_DESC: TextOverride = {
  ar: 'نأخذك في رحلة عبر الزمن — نُحيي وصفات الجدّات بنكهة عصرية ولمسة عصرية. كل طبق يحمل حكاية، وكل لقمة تنقلك إلى ذاكرة دافئة.',
  en: 'We take you on a journey through time — reviving grandmother\'s recipes with a modern touch. Every dish carries a story, every bite carries you back to a warm memory.',
};
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80';
const FALLBACK_BADGE: TextOverride = { ar: 'هويتنا العربية', en: 'Arabic Identity' };
const FALLBACK_YEARS_NUM: TextOverride = { ar: '15', en: '15' };
const FALLBACK_YEARS_LABEL: TextOverride = { ar: 'سنة من الخبرة', en: 'years of experience' };
const FALLBACK_CTA: TextOverride = { ar: 'اكتشف رحلتنا', en: 'Discover our journey' };

export default function SignatureSection() {
  const { dir } = useDirection();
  const ref = useRef<HTMLElement>(null);
  const isRTL = dir === 'rtl';
  const [h1, setH1] = useState<TextOverride>(FALLBACK_H1);
  const [h2, setH2] = useState<TextOverride>(FALLBACK_H2);
  const [h3, setH3] = useState<TextOverride>(FALLBACK_H3);
  const [desc, setDesc] = useState<TextOverride>(FALLBACK_DESC);
  const [photo, setPhoto] = useState(FALLBACK_PHOTO);
  const [badge, setBadge] = useState<TextOverride>(FALLBACK_BADGE);
  const [yearsNum, setYearsNum] = useState<TextOverride>(FALLBACK_YEARS_NUM);
  const [yearsLabel, setYearsLabel] = useState<TextOverride>(FALLBACK_YEARS_LABEL);
  const [cta, setCta] = useState<TextOverride>(FALLBACK_CTA);
  const [features, setFeatures] = useState<SignatureFeature[]>(DEMO_FEATURES);

  useEffect(() => {
    function load() {
      getSiteText('signature.heading1', FALLBACK_H1.ar, FALLBACK_H1.en).then(setH1);
      getSiteText('signature.heading2', FALLBACK_H2.ar, FALLBACK_H2.en).then(setH2);
      getSiteText('signature.heading3', FALLBACK_H3.ar, FALLBACK_H3.en).then(setH3);
      getSiteText('signature.description', FALLBACK_DESC.ar, FALLBACK_DESC.en).then(setDesc);
      getSiteAsset('signature.photo', FALLBACK_PHOTO).then(setPhoto);
      getSiteText('signature.badge', FALLBACK_BADGE.ar, FALLBACK_BADGE.en).then(setBadge);
      getSiteText('signature.yearsNumber', FALLBACK_YEARS_NUM.ar, FALLBACK_YEARS_NUM.en).then(setYearsNum);
      getSiteText('signature.yearsLabel', FALLBACK_YEARS_LABEL.ar, FALLBACK_YEARS_LABEL.en).then(setYearsLabel);
      getSiteText('signature.ctaButton', FALLBACK_CTA.ar, FALLBACK_CTA.en).then(setCta);
      listItems<SignatureFeature>('signatureFeatures').then((list) =>
        setFeatures(list.length ? list : DEMO_FEATURES)
      );
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings' || store === 'signatureFeatures') load();
    });
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const xSlide = useTransform(scrollYProgress, [0, 1], [isRTL ? '5%' : '-5%', isRTL ? '-5%' : '5%']);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.sig-heading',
        { x: isRTL ? 100 : -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );

      gsap.fromTo(
        '.sig-sub',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );

      gsap.fromTo(
        '.sig-feature',
        { x: isRTL ? 60 : -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          stagger: 0.12,
          scrollTrigger: { trigger: '.sig-grid', start: 'top 75%' },
        }
      );

      gsap.fromTo(
        '.sig-img',
        { scale: 1.1, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 60%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section
      id="signature"
      ref={ref}
      dir="rtl"
      className="relative bg-[#31492D] text-[#E8E8E9] overflow-hidden py-24 lg:py-40"
    >
      {/* Decorative leaves */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(6)].map((_, i) => (
          <svg
            key={i}
            className="absolute"
            style={{
              top: `${10 + i * 15}%`,
              left: `${5 + (i % 3) * 30}%`,
              transform: `rotate(${i * 45}deg)`,
            }}
            width="80"
            height="80"
            viewBox="0 0 100 100"
            fill="#687457"
          >
            <path d="M50 10 Q30 30 50 50 Q70 30 50 10 M50 50 Q30 70 50 90 Q70 70 50 50" />
          </svg>
        ))}
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <motion.div style={{ x: xSlide }} className="relative">
              <div className="sig-img relative aspect-[4/5] rounded-[2rem] overflow-hidden border-2 border-[#687457]/40">
                <img
                  src={photo}
                  alt="signature"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#31492D] via-transparent to-transparent" />
              </div>
              {/* Floating badge */}
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                whileInView={{ rotate: -8, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="absolute -bottom-6 -right-6 lg:-bottom-10 lg:-right-10 bg-[#687457] text-[#E8E8E9] p-6 lg:p-8 rounded-3xl shadow-2xl max-w-[200px]"
              >
                <div className="text-4xl lg:text-5xl font-display font-black italic">
                  {isRTL ? yearsNum.ar : yearsNum.en}
                </div>
                <div className="text-xs uppercase tracking-widest mt-1 font-light">
                  {isRTL ? yearsLabel.ar : yearsLabel.en}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Text content */}
          <div className="lg:col-span-7 order-2 lg:order-1 text-right">
            <div className="sig-sub inline-flex items-center gap-2 text-[#687457] text-xs uppercase tracking-widest font-bold mb-6">
              <span className="w-8 h-px bg-[#687457]" />
              <span style={badge.color ? { color: badge.color } : undefined}>{isRTL ? badge.ar : badge.en}</span>
            </div>

            <h2 className="sig-heading font-ar-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] mb-6">
              <span className="block" style={h1.color ? { color: h1.color } : undefined}>{isRTL ? h1.ar : h1.en}</span>
              <span className="block italic text-[#687457] font-light" style={h2.color ? { color: h2.color } : undefined}>{isRTL ? h2.ar : h2.en}</span>
              <span className="block" style={h3.color ? { color: h3.color } : undefined}>{isRTL ? h3.ar : h3.en}</span>
            </h2>

            <p
              className="sig-sub text-base lg:text-lg text-[#E8E8E9]/70 leading-loose font-light max-w-2xl"
              style={desc.color ? { color: desc.color } : undefined}
            >
              {isRTL ? desc.ar : desc.en}
            </p>

            {/* Features grid */}
            <div className="sig-grid grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
              {features.map((f, i) => (
                <motion.div
                  key={f.id ?? i}
                  whileHover={{ x: isRTL ? -8 : 8 }}
                  className="sig-feature group p-5 lg:p-6 rounded-2xl bg-[#34492E]/60 border border-[#687457]/30 hover:border-[#687457] hover:bg-[#34492E] transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4 flex-row-reverse">
                    <div className="text-3xl lg:text-4xl">{f.icon}</div>
                    <div className="flex-1">
                      <h3
                        className="font-ar-display font-bold text-lg lg:text-xl text-[#E8E8E9]"
                        style={f.titleColor ? { color: f.titleColor } : undefined}
                      >
                        {isRTL ? f.titleAr : f.titleEn}
                      </h3>
                      <p className="text-sm text-[#E8E8E9]/50 font-light mt-1">
                        {isRTL ? f.descAr : f.descEn}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-10 bg-[#E8E8E9] text-[#31492D] px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm inline-flex items-center gap-3"
            >
              <span style={cta.color ? { color: cta.color } : undefined}>{isRTL ? cta.ar : cta.en}</span>
              <span>←</span>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
