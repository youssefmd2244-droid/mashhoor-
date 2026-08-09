import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDirection } from '../hooks/useDirection';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { onDataChange } from '../lib/store';

gsap.registerPlugin(ScrollTrigger);

const STARS = [
  { x: '15%', y: '12%', size: 18, delay: 0 },
  { x: '85%', y: '18%', size: 22, delay: 0.2 },
  { x: '12%', y: '78%', size: 16, delay: 0.4 },
  { x: '88%', y: '82%', size: 20, delay: 0.6 },
  { x: '50%', y: '8%', size: 14, delay: 0.8 },
];

const FALLBACK_PERCENT: TextOverride = { ar: '25%', en: '25%' };
const FALLBACK_SUBTITLE: TextOverride = {
  ar: 'على كل طلبات البرانش — هذا الأسبوع فقط',
  en: 'on all weekend brunch orders — this week only',
};
const FALLBACK_CODE: TextOverride = { ar: 'MASHHOOR25', en: 'MASHHOOR25' };
const FALLBACK_USE_CODE: TextOverride = { ar: 'استخدم الكود عند الدفع', en: 'Use code at checkout' };
const FALLBACK_SCHEDULE: TextOverride = {
  ar: 'الجمعة|المقبل,السبت|والأحد,من ٨ص|إلى ٣م',
  en: 'FRI|Next,SAT|& SUN,8AM|TO 3PM',
};
const FALLBACK_RESERVE_CTA: TextOverride = { ar: 'احجز طاولتك', en: 'Reserve Your Table' };
const FALLBACK_DISCLAIMER: TextOverride = { ar: 'لا يمكن دمج العروض', en: 'Cannot be combined with other offers' };

export default function FlyerSection() {
  const { dir } = useDirection();
  const ref = useRef<HTMLElement>(null);
  const isRTL = dir === 'rtl';
  const [percent, setPercent] = useState<TextOverride>(FALLBACK_PERCENT);
  const [subtitle, setSubtitle] = useState<TextOverride>(FALLBACK_SUBTITLE);
  const [code, setCode] = useState<TextOverride>(FALLBACK_CODE);
  const [useCode, setUseCode] = useState<TextOverride>(FALLBACK_USE_CODE);
  const [schedule, setSchedule] = useState<TextOverride>(FALLBACK_SCHEDULE);
  const [reserveCta, setReserveCta] = useState<TextOverride>(FALLBACK_RESERVE_CTA);
  const [disclaimer, setDisclaimer] = useState<TextOverride>(FALLBACK_DISCLAIMER);

  useEffect(() => {
    function load() {
      getSiteText('flyer.discountPercent', FALLBACK_PERCENT.ar, FALLBACK_PERCENT.en).then(setPercent);
      getSiteText('flyer.subtitle', FALLBACK_SUBTITLE.ar, FALLBACK_SUBTITLE.en).then(setSubtitle);
      getSiteText('flyer.couponCode', FALLBACK_CODE.ar, FALLBACK_CODE.en).then(setCode);
      getSiteText('flyer.useCodeLabel', FALLBACK_USE_CODE.ar, FALLBACK_USE_CODE.en).then(setUseCode);
      getSiteText('flyer.schedule', FALLBACK_SCHEDULE.ar, FALLBACK_SCHEDULE.en).then(setSchedule);
      getSiteText('flyer.reserveCta', FALLBACK_RESERVE_CTA.ar, FALLBACK_RESERVE_CTA.en).then(setReserveCta);
      getSiteText('flyer.disclaimer', FALLBACK_DISCLAIMER.ar, FALLBACK_DISCLAIMER.en).then(setDisclaimer);
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings') load();
    });
  }, []);
  // Schedule format is "label1|sub1,label2|sub2,label3|sub3" — one editable
  // text field (Settings → كل نصوص الموقع) so the admin can change the promo
  // hours shown on the flyer without a code change.
  const scheduleItems = (isRTL ? schedule.ar : schedule.en)
    .split(',')
    .map((pair) => {
      const [t, d] = pair.split('|');
      return { t: (t ?? '').trim(), d: (d ?? '').trim() };
    });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.flyer-frame',
        { scale: 0.9, opacity: 0, rotateX: 20 },
        {
          scale: 1,
          opacity: 1,
          rotateX: 0,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );

      gsap.fromTo(
        '.flyer-stamp',
        { scale: 2, rotate: -10, opacity: 0 },
        {
          scale: 1,
          rotate: -3,
          opacity: 1,
          duration: 0.6,
          ease: 'back.out(1.6)',
          stagger: 0.15,
          scrollTrigger: { trigger: ref.current, start: 'top 60%' },
        }
      );

      gsap.fromTo(
        '.flyer-line',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.2,
          scrollTrigger: { trigger: ref.current, start: 'top 60%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="flyer"
      ref={ref}
      dir={dir}
      className="relative bg-[#F5E9DD] text-[#2A1C1A] overflow-hidden py-20 lg:py-32"
    >
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ rotate: -1 }}
          whileInView={{ rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flyer-frame paper-grain relative bg-[#F7EDE3] border-[3px] border-[#2A1C1A] p-8 lg:p-16"
          style={{ boxShadow: '12px 12px 0 rgba(42,28,26,0.15)' }}
        >
          {/* Decorative stars */}
          {STARS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: 0 }}
              whileInView={{ scale: 1, rotate: 360 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + s.delay, type: 'spring' as const }}
              className="absolute text-[#2A1C1A]"
              style={{
                left: s.x,
                top: s.y,
                fontSize: s.size,
              }}
            >
              ✦
            </motion.div>
          ))}

          {/* Corner ornaments */}
          {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-6 h-6 border-2 border-[#2A1C1A]`}
            />
          ))}

          {/* Top stamp */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-[#2A1C1A]/40">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#2A1C1A]/60">
              № 0 1 2
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#2A1C1A]/60">
              EST. 2026
            </div>
          </div>

          {/* Center content */}
          <div className="text-center py-8 lg:py-12">
            {/* Sub stamp */}
            <motion.div
              initial={{ scale: 2, rotate: 8, opacity: 0 }}
              whileInView={{ scale: 1, rotate: 2, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="flyer-stamp inline-block bg-[#846950] text-[#F7EDE3] px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6"
            >
              ✦ Limited Time ✦
            </motion.div>

            <h2 className="font-display text-6xl sm:text-7xl lg:text-[9rem] font-black italic leading-[0.85] text-[#2A1C1A] mb-4">
              <span className="block">Mashhoor</span>
              <span className="block text-[#846950]" style={percent.color ? { color: percent.color } : undefined}>{isRTL ? percent.ar : percent.en}</span>
              <span className="block italic font-light text-[#2A1C1A]">Off</span>
            </h2>

            <p
              className="font-display italic text-2xl lg:text-3xl text-[#846950] mb-8"
              style={subtitle.color ? { color: subtitle.color } : undefined}
            >
              {isRTL ? subtitle.ar : subtitle.en}
            </p>

            {/* Divider lines */}
            <div className="space-y-1 my-8">
              <div className="flyer-line h-px bg-[#2A1C1A] origin-left" />
              <div className="flyer-line h-px bg-[#2A1C1A] origin-left" />
            </div>

            {/* Coupon code */}
            <div className="my-8">
              <div
                className="font-mono text-[10px] uppercase tracking-widest text-[#2A1C1A]/60 mb-2"
                style={useCode.color ? { color: useCode.color } : undefined}
              >
                {isRTL ? useCode.ar : useCode.en}
              </div>
              <motion.div
                initial={{ scale: 2, rotate: -5, opacity: 0 }}
                whileInView={{ scale: 1, rotate: -2, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="flyer-stamp inline-block border-[3px] border-dashed border-[#2A1C1A] px-8 py-4 bg-[#F5E9DD]"
              >
                <span
                  className="font-display text-4xl lg:text-5xl font-black tracking-[0.2em] text-[#2A1C1A]"
                  style={code.color ? { color: code.color } : undefined}
                >
                  {isRTL ? code.ar : code.en}
                </span>
              </motion.div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto my-10">
              {scheduleItems.map((d, i) => (
                <div key={i} className="text-center">
                  <div className="font-display text-2xl lg:text-3xl font-black italic text-[#2A1C1A]">
                    {d.t}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-[#2A1C1A]/60">
                    {d.d}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#2A1C1A] text-[#F5E9DD] px-10 py-4 font-display font-black italic text-xl uppercase tracking-wider"
              style={reserveCta.color ? { color: reserveCta.color } : undefined}
            >
              {isRTL ? reserveCta.ar : reserveCta.en} →
            </motion.button>

            <p
              className="font-mono text-[10px] uppercase tracking-widest text-[#2A1C1A]/50 mt-6"
              style={disclaimer.color ? { color: disclaimer.color } : undefined}
            >
              * {isRTL ? disclaimer.ar : disclaimer.en}
            </p>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-4 border-t-2 border-dashed border-[#2A1C1A]/40 flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#2A1C1A]/60">
              MASHHOOR.CO
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#2A1C1A]/60">
              @MASHHOOR
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#2A1C1A]/60">
              PRINTED 2026
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
