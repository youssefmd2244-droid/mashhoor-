import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDirection } from '../hooks/useDirection';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { onDataChange } from '../lib/store';

gsap.registerPlugin(ScrollTrigger);

const PALETTE = [
  { name: 'Maroon Spice', hex: '#A90009', use: 'Hero / Appetite' },
  { name: 'Tomato Red', hex: '#B3172D', use: 'Pasta Spotlight' },
  { name: 'Mustard Pop', hex: '#F2BF05', use: 'Street Food' },
  { name: 'Olive Deep', hex: '#31492D', use: 'Heritage' },
  { name: 'Charcoal Warm', hex: '#1C1F21', use: 'Premium Menus' },
  { name: 'Sand Beige', hex: '#B9B097', use: 'Editorial Text' },
];

const TYPE_SAMPLES = [
  { family: 'Cairo', weight: 'Black', use: 'Arabic Display' },
  { family: 'Playfair', weight: 'Italic 900', use: 'Editorial' },
  { family: 'Space Grotesk', weight: 'Light', use: 'Minimal UI' },
  { family: 'Bebas Neue', weight: 'Regular', use: 'Fast Food' },
];

const ARTIFACTS = [
  { label: 'Color Study 01', color: '#A90009', size: 'wide' },
  { label: 'Type Pairing', color: '#31492D', size: 'tall' },
  { label: 'UI Fragment', color: '#E8E8E9', size: 'square' },
  { label: 'Moodboard', color: '#D7B3B2', size: 'square' },
  { label: 'Sketch 04', color: '#F5E9DD', size: 'wide' },
  { label: 'Motion Study', color: '#B3172D', size: 'tall' },
];

const FALLBACK_TITLE1: TextOverride = { ar: 'كل تفصيلة', en: 'Every detail,' };
const FALLBACK_TITLE2: TextOverride = { ar: 'مدروسة بعمق', en: 'deeply considered.' };
const FALLBACK_SUBTITLE: TextOverride = {
  ar: 'نأخذ كل مشروع كبحث تصميمي. نستكشف المرجعيات، نختبر الألوان، ندرس الخطوط قبل أن نرسم أول بكسل.',
  en: 'We treat every project as a design study. We explore references, test colors, study typefaces before drawing a single pixel.',
};

export default function StorySection() {
  const { dir } = useDirection();
  const ref = useRef<HTMLElement>(null);
  const isRTL = dir === 'rtl';
  const [title1, setTitle1] = useState<TextOverride>(FALLBACK_TITLE1);
  const [title2, setTitle2] = useState<TextOverride>(FALLBACK_TITLE2);
  const [subtitle, setSubtitle] = useState<TextOverride>(FALLBACK_SUBTITLE);

  useEffect(() => {
    function load() {
      getSiteText('story.title1', FALLBACK_TITLE1.ar, FALLBACK_TITLE1.en).then(setTitle1);
      getSiteText('story.title2', FALLBACK_TITLE2.ar, FALLBACK_TITLE2.en).then(setTitle2);
      getSiteText('story.subtitle', FALLBACK_SUBTITLE.ar, FALLBACK_SUBTITLE.en).then(setSubtitle);
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings') load();
    });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.story-title',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );

      // Staggered fade-in following grid order (top-left to bottom-right)
      gsap.fromTo(
        '.artifact',
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.story-grid', start: 'top 75%' },
        }
      );

      gsap.fromTo(
        '.palette-swatch',
        { opacity: 0, x: isRTL ? 20 : -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.05,
          scrollTrigger: { trigger: '.palette-grid', start: 'top 80%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section
      id="story"
      ref={ref}
      dir={dir}
      className="relative bg-[#F3F3F2] text-[#866A68] overflow-hidden py-24 lg:py-40"
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#D7B3B2 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="mb-16 lg:mb-24 max-w-4xl">
          <div className="inline-flex items-center gap-3 text-[#866A68]/60 text-[10px] uppercase tracking-[0.4em] font-medium mb-6">
            <span className="w-8 h-px bg-[#866A68]/40" />
            <span>{isRTL ? 'الفصل ٠٩ — خلف الكواليس' : 'CHAPTER 09 — BEHIND THE DESIGN'}</span>
          </div>
          <h2 className="story-title font-grotesk text-6xl sm:text-7xl lg:text-[9rem] font-light leading-[0.9] tracking-tight">
            <span className="block" style={title1.color ? { color: title1.color } : undefined}>{isRTL ? title1.ar : title1.en}</span>
            <span className="block italic font-thin text-[#D7B3B2]" style={title2.color ? { color: title2.color } : undefined}>
              {isRTL ? title2.ar : title2.en}
            </span>
          </h2>
          <p
            className="mt-8 text-base lg:text-lg text-[#866A68]/80 font-light leading-loose max-w-2xl"
            style={subtitle.color ? { color: subtitle.color } : undefined}
          >
            {isRTL ? subtitle.ar : subtitle.en}
          </p>
        </div>

        {/* Artifacts grid */}
        <div className="story-grid grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-20">
          {ARTIFACTS.map((a, i) => {
            const sizeClass = a.size === 'wide' ? 'col-span-2' : a.size === 'tall' ? 'row-span-2' : 'col-span-1';
            const aspectClass = a.size === 'wide' ? 'aspect-[2/1]' : a.size === 'tall' ? 'aspect-square' : 'aspect-square';

            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02, rotate: 0 }}
                className={`artifact ${sizeClass} group relative ${aspectClass} rounded-2xl overflow-hidden border border-[#D7B3B2]/30 cursor-pointer`}
                style={{ background: a.color }}
              >
                {/* Decorative content based on type */}
                {a.label.includes('Color') && (
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1 self-start">
                      <span className="text-[9px] text-white uppercase tracking-widest font-bold">
                        01 / Palette
                      </span>
                    </div>
                  </div>
                )}
                {a.label.includes('Type') && (
                  <div className="absolute inset-0 p-6 flex items-center justify-center">
                    <span className="font-display text-6xl lg:text-8xl text-white italic font-black">
                      Aa
                    </span>
                  </div>
                )}
                {a.label.includes('UI') && (
                  <div className="absolute inset-0 p-4 space-y-2">
                    <div className="h-2 bg-white/40 rounded w-1/3" />
                    <div className="h-1.5 bg-white/30 rounded w-full" />
                    <div className="h-1.5 bg-white/30 rounded w-5/6" />
                    <div className="grid grid-cols-3 gap-1.5 mt-3">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="aspect-square bg-white/40 rounded" />
                      ))}
                    </div>
                  </div>
                )}
                {a.label.includes('Moodboard') && (
                  <div className="absolute inset-0 p-3 grid grid-cols-3 gap-1">
                    {['#A90009', '#F2BF05', '#31492D', '#1C1F21', '#B3172D', '#D7B3B2'].map((c, j) => (
                      <div key={j} className="rounded" style={{ background: c }} />
                    ))}
                  </div>
                )}
                {a.label.includes('Sketch') && (
                  <div className="absolute inset-0 p-6 flex items-center justify-center">
                    <svg viewBox="0 0 100 60" className="w-full h-auto">
                      <path
                        d="M10 30 Q30 5, 50 30 T90 30"
                        stroke="#866A68"
                        strokeWidth="0.8"
                        fill="none"
                        strokeDasharray="2,2"
                      />
                      <circle cx="10" cy="30" r="2" fill="#866A68" />
                      <circle cx="50" cy="30" r="2" fill="#866A68" />
                      <circle cx="90" cy="30" r="2" fill="#866A68" />
                    </svg>
                  </div>
                )}
                {a.label.includes('Motion') && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 border-2 border-white/60 border-t-white rounded-full"
                    />
                  </div>
                )}

                {/* Label */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-medium text-white/90 bg-black/20 backdrop-blur px-2 py-1 rounded">
                    {a.label}
                  </span>
                  <span className="text-[9px] text-white/60 font-mono">
                    0{i + 1}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Palette + Type samples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Palette */}
          <div className="palette-grid bg-white/60 backdrop-blur rounded-3xl p-6 lg:p-8 border border-[#D7B3B2]/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-[#866A68]">
                {isRTL ? 'لوحة الألوان' : 'Color System'}
              </h3>
              <span className="text-[10px] text-[#866A68]/50 font-mono">v2.4</span>
            </div>
            <div className="space-y-2">
              {PALETTE.map((p) => (
                <div
                  key={p.hex}
                  className="palette-swatch flex items-center gap-4 p-2 rounded-xl hover:bg-white/60 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-lg border border-[#D7B3B2]/30 shadow-sm"
                    style={{ background: p.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#1C1F21]">{p.name}</div>
                    <div className="text-[10px] text-[#866A68]/60 font-mono">
                      {p.hex} · {p.use}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white/60 backdrop-blur rounded-3xl p-6 lg:p-8 border border-[#D7B3B2]/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs uppercase tracking-[0.4em] font-bold text-[#866A68]">
                {isRTL ? 'الطباعة' : 'Typography'}
              </h3>
              <span className="text-[10px] text-[#866A68]/50 font-mono">04 families</span>
            </div>
            <div className="space-y-6">
              {TYPE_SAMPLES.map((t) => (
                <div key={t.family} className="border-b border-[#D7B3B2]/30 pb-4 last:border-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-3xl lg:text-5xl font-bold text-[#1C1F21] leading-none">
                      {t.family === 'Cairo' && 'مرحبا'}
                      {t.family === 'Playfair' && 'Bello.'}
                      {t.family === 'Space Grotesk' && 'Hello.'}
                      {t.family === 'Bebas Neue' && 'EAT FAST.'}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-[#866A68]/50">
                      {t.weight}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#866A68]/60 uppercase tracking-widest">
                    {t.use}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
