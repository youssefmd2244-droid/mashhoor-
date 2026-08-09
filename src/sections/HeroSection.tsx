import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDirection } from '../hooks/useDirection';
import { getSiteIdentity } from '../lib/site';
import { onDataChange } from '../lib/store';
import { getSiteText } from '../lib/siteTexts';

gsap.registerPlugin(ScrollTrigger);

const INGREDIENTS = [
  { emoji: '🌶️', label: 'فلفل حار', color: '#EEC31C', x: -180, y: -120, rot: -25 },
  { emoji: '🧅', label: 'بصل', color: '#D4A373', x: 180, y: -100, rot: 20 },
  { emoji: '🍅', label: 'صوص طماطم', color: '#C11E10', x: -200, y: 80, rot: 15 },
  { emoji: '🥬', label: 'خس', color: '#869B11', x: 200, y: 100, rot: -15 },
  { emoji: '🧀', label: 'جبنة ذائبة', color: '#EEC31C', x: -120, y: 180, rot: 30 },
  { emoji: '🥖', label: 'خبز طازج', color: '#846950', x: 140, y: -180, rot: -10 },
  { emoji: '🌿', label: 'ريحان', color: '#31492D', x: 0, y: -220, rot: 0 },
  { emoji: '💨', label: 'دخان', color: '#ffffff', x: 0, y: 220, rot: 0 },
];

export default function HeroSection() {
  const { dir } = useDirection();
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [introVideo, setIntroVideo] = useState<string | undefined>(undefined);
  const [titleOverride, setTitleOverride] = useState({ ar: '', en: '' });
  const [subtitleOverride, setSubtitleOverride] = useState({ ar: '', en: '' });
  const [ctaPrimaryOv, setCtaPrimaryOv] = useState({ ar: '', en: '' });
  const [ctaSecondaryOv, setCtaSecondaryOv] = useState({ ar: '', en: '' });
  const [badgeOv, setBadgeOv] = useState({ ar: '', en: '' });

  // Real, live-updating: whatever video the admin uploads/removes from
  // Settings → المحتوى → اسم الموقع واللوجو shows up here immediately, no
  // reload needed (same pattern used across the site for live sync). Same
  // for the headline/subtitle/CTA/badge text overrides from Settings →
  // كل نصوص الموقع.
  useEffect(() => {
    function load() {
      getSiteIdentity().then((id) => setIntroVideo(id.introVideo));
      getSiteText('hero.title', '', '').then(setTitleOverride);
      getSiteText('hero.subtitle', '', '').then(setSubtitleOverride);
      getSiteText('hero.ctaPrimary', '', '').then(setCtaPrimaryOv);
      getSiteText('hero.ctaSecondary', '', '').then(setCtaSecondaryOv);
      getSiteText('hero.badge', '', '').then(setBadgeOv);
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings') load();
    });
  }, []);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const yMid = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacityHero = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Headline split reveal
      if (headlineRef.current) {
        const chars = headlineRef.current.querySelectorAll('.char');
        gsap.fromTo(
          chars,
          {
            y: 120,
            opacity: 0,
            rotateX: -90,
          },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.04,
            delay: 0.2,
          }
        );
      }

      // Sub reveal
      gsap.fromTo(
        '.hero-sub',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 1.0 }
      );

      // CTA reveal
      gsap.fromTo(
        '.hero-cta',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 1.3, stagger: 0.1 }
      );

      // Ingredients fly in
      gsap.fromTo(
        '.ingredient',
        { x: 0, y: 0, scale: 0, opacity: 0, rotation: 0 },
        {
          x: (i) => INGREDIENTS[i].x,
          y: (i) => INGREDIENTS[i].y,
          rotation: (i) => INGREDIENTS[i].rot,
          scale: 1,
          opacity: 1,
          duration: 1.4,
          ease: 'elastic.out(1, 0.6)',
          stagger: 0.08,
          delay: 1.5,
        }
      );

      // Whip pan intro
      gsap.fromTo(
        '.hero-stage',
        { scale: 1.15, filter: 'blur(8px)' },
        { scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power3.out' }
      );

      // Parallax on scroll
      gsap.to('.hero-heat', {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const headlineText =
    (dir === 'rtl' ? titleOverride.ar : titleOverride.en) ||
    (dir === 'rtl' ? 'ساخن. حارّ. لا يُقاوم.' : 'Hot. Spicy. Irresistible.');
  const subText =
    (dir === 'rtl' ? subtitleOverride.ar : subtitleOverride.en) ||
    (dir === 'rtl'
      ? 'طبقنا الموقّع — كل لقمة بتحكي قصة نار وتوابل'
      : 'Our signature — every bite tells a story of fire & spice');
  const ctaPrimary =
    (dir === 'rtl' ? ctaPrimaryOv.ar : ctaPrimaryOv.en) || (dir === 'rtl' ? 'اطلب الآن' : 'Order Now');
  const ctaSecondary =
    (dir === 'rtl' ? ctaSecondaryOv.ar : ctaSecondaryOv.en) || (dir === 'rtl' ? 'شاهد القائمة' : 'View Menu');
  const badge =
    (dir === 'rtl' ? badgeOv.ar : badgeOv.en) || (dir === 'rtl' ? '🔥 الأكثر طلباً' : '🔥 Most Ordered');

  const isRTL = dir === 'rtl';

  return (
    <section
      id="hero"
      ref={sectionRef}
      dir={dir}
      className="relative min-h-screen w-full overflow-hidden bg-[#750001] text-white"
    >
      {/* Heat shimmer layer */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ y: yBg }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#750001] via-[#A90009] to-[#5A0001]" />
        {introVideo && (
          <video
            src={introVideo}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="hero-heat absolute top-1/3 left-1/2 -translate-x-1/2 w-[120vw] h-[120vw] rounded-full opacity-60"
             style={{
               background: 'radial-gradient(circle, rgba(255,140,40,0.35) 0%, transparent 60%)',
               filter: 'blur(40px)',
             }}
        />
        {/* Smoke particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: 60 + i * 20,
              height: 60 + i * 20,
              left: `${20 + i * 10}%`,
              top: `${30 + (i % 3) * 15}%`,
            }}
            animate={{
              y: [-20, -100, -200],
              opacity: [0, 0.4, 0],
              scale: [0.8, 1.2, 1.6],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.07] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(238,195,28,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(238,195,28,0.5) 1px, transparent 1px)',
             backgroundSize: '60px 60px',
           }}
      />

      <motion.div
        style={{ opacity: opacityHero, y: yMid }}
        className="relative z-10 hero-stage max-w-[1600px] mx-auto px-6 lg:px-10 pt-32 lg:pt-40 pb-20 min-h-screen flex flex-col justify-between"
      >
        {/* Top: Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: isRTL ? 8 : -8 }}
          transition={{ delay: 1.6, type: 'spring', stiffness: 180 }}
          className="self-start inline-flex items-center gap-2 bg-[#EEC31C] text-[#750001] px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-2xl shadow-[#EEC31C]/30"
          style={badgeOv.color ? { color: badgeOv.color } : undefined}
        >
          {badge}
        </motion.div>

        {/* Middle: Headline + Ingredients stage */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-12">
          <div className={`lg:col-span-7 ${isRTL ? 'lg:order-2' : 'lg:order-1'}`}>
            <h1
              ref={headlineRef}
              className="font-display text-6xl sm:text-7xl lg:text-[8rem] xl:text-[9rem] leading-[0.85] font-black italic text-white"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)', color: titleOverride.color || undefined }}
            >
              {/* Split by WORD, not by character: splitting Arabic text into
                  per-character spans breaks natural letter joining/shaping,
                  and manually reversing the array fights the browser's own
                  correct RTL order (already handled by dir="rtl"). Animating
                  whole words keeps letters connected while still staggering. */}
              {headlineText.split(' ').map((word, i, arr) => (
                <span key={i} className="char inline-block">
                  {word}{i < arr.length - 1 ? '\u00a0' : ''}
                </span>
              ))}
            </h1>
            <p
              className="hero-sub mt-6 text-lg lg:text-2xl text-[#EEC31C] max-w-2xl font-light leading-relaxed"
              style={subtitleOverride.color ? { color: subtitleOverride.color } : undefined}
            >
              {subText}
            </p>
          </div>

          {/* Ingredients composition */}
          <div className={`lg:col-span-5 ${isRTL ? 'lg:order-1' : 'lg:order-2'} relative h-[420px] lg:h-[560px]`}>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Center hero dish */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 1.8, type: 'spring', stiffness: 120, damping: 14 }}
                className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-full flex items-center justify-center z-20"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #EEC31C 0%, #C11E10 50%, #750001 100%)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 -20px 40px rgba(0,0,0,0.4)',
                }}
              >
                <div className="text-9xl lg:text-[12rem]">🥪</div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-[#EEC31C]/40"
                />
              </motion.div>

              {/* Flying ingredients */}
              {INGREDIENTS.map((ing, i) => (
                <motion.div
                  key={i}
                  className="ingredient absolute w-20 h-20 lg:w-24 lg:h-24 rounded-2xl flex flex-col items-center justify-center backdrop-blur-md z-10"
                  style={{
                    background: `linear-gradient(135deg, ${ing.color}30, ${ing.color}10)`,
                    border: `1px solid ${ing.color}60`,
                    boxShadow: `0 10px 30px ${ing.color}30`,
                  }}
                  whileHover={{ scale: 1.2, zIndex: 30 }}
                >
                  <span className="text-3xl lg:text-4xl">{ing.emoji}</span>
                  <span className="text-[9px] mt-1 text-white/80 font-medium">{ing.label}</span>
                </motion.div>
              ))}

              {/* Heat distortion ring */}
              <div className="absolute inset-0 rounded-full heat-shimmer pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bottom: CTAs */}
        <div className="flex flex-wrap items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(238,195,28,0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="hero-cta group relative bg-[#EEC31C] text-[#750001] px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm overflow-hidden"
            style={ctaPrimaryOv.color ? { color: ctaPrimaryOv.color } : undefined}
          >
            <span className="relative z-10">{ctaPrimary}</span>
            <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span
              className="absolute inset-0 flex items-center justify-center text-[#750001] font-bold uppercase tracking-widest text-sm translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20"
              style={ctaPrimaryOv.color ? { color: ctaPrimaryOv.color } : undefined}
            >
              {ctaPrimary}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, borderColor: '#EEC31C' }}
            whileTap={{ scale: 0.95 }}
            className="hero-cta border-2 border-white/40 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm backdrop-blur-sm"
            style={ctaSecondaryOv.color ? { color: ctaSecondaryOv.color } : undefined}
          >
            {ctaSecondary} →
          </motion.button>

          <div className="hero-cta flex items-center gap-3 text-white/70 text-sm ml-auto">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full border-2 border-[#750001] bg-gradient-to-br from-[#EEC31C] to-[#9B3734] flex items-center justify-center text-xs font-bold"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="font-medium">+2.4k {dir === 'rtl' ? 'طلب اليوم' : 'orders today'}</span>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/60"
      >
        <span className="text-[10px] uppercase tracking-widest">{dir === 'rtl' ? 'اسحب' : 'Scroll'}</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent" />
      </motion.div>
    </section>
  );
}
