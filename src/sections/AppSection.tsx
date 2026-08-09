import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDirection } from '../hooks/useDirection';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { getSiteAsset } from '../lib/siteAssets';
import { onDataChange } from '../lib/store';

gsap.registerPlugin(ScrollTrigger);

type ScreenId = 'home' | 'recipe' | 'timer' | 'list';

const SCREENS: Record<ScreenId, { label: string; labelAr: string }> = {
  home: { label: 'Home', labelAr: 'الرئيسية' },
  recipe: { label: 'Recipe', labelAr: 'وصفة' },
  timer: { label: 'Timer', labelAr: 'مؤقت' },
  list: { label: 'List', labelAr: 'قائمة' },
};

function HomeScreen() {
  return (
    <div className="p-4 space-y-3 h-full bg-[#F3F3F2] overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-[#60564C]">Good morning</div>
          <div className="text-base font-bold text-[#1C1F21]">Chef Ahmad 👋</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#A37C4A] to-[#60564C]" />
      </div>
      {/* Daily pick */}
      <div className="bg-gradient-to-br from-[#60564C] to-[#1C1F21] rounded-2xl p-3 text-white">
        <div className="text-[9px] uppercase tracking-widest opacity-70">Today's Pick</div>
        <div className="text-sm font-bold mt-1">Lemon Herb Salmon</div>
        <div className="text-[10px] opacity-70 mt-0.5">25 min · 4 ingredients</div>
        <div className="mt-2 flex items-center gap-1">
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '65%' }}
              transition={{ duration: 1.5 }}
              className="h-full bg-[#EEC31C]"
            />
          </div>
          <span className="text-[9px]">65%</span>
        </div>
      </div>
      <div className="text-[11px] font-bold text-[#1C1F21] pt-1">Quick Actions</div>
      <div className="grid grid-cols-2 gap-2">
        {['⏱ Timer', '📋 List', '🌡 Temp', '🎯 Goals'].map((a, i) => (
          <div key={i} className="bg-white rounded-xl p-2.5 text-center text-[10px]">
            <div className="text-lg mb-0.5">{a.split(' ')[0]}</div>
            <div className="font-medium text-[#60564C]">{a.split(' ').slice(1).join(' ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipeScreen({ photo }: { photo: string }) {
  return (
    <div className="p-3 h-full bg-[#F3F3F2] overflow-hidden">
      <div className="relative h-32 rounded-2xl overflow-hidden mb-3">
        <img
          src={photo}
          className="w-full h-full object-cover"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-2 left-2 text-white">
          <div className="text-[9px] uppercase tracking-widest opacity-80">Step 3 of 5</div>
          <div className="text-xs font-bold">Sear the salmon</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {['Pat salmon dry', 'Heat pan to high', 'Sear 4 min each side', 'Rest 2 min', 'Plate & serve'].map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 p-2 rounded-lg text-[10px] ${
              i < 2 ? 'bg-[#E8E8E9] text-[#1C1F21]/50 line-through' : 'bg-white text-[#1C1F21]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                i < 2 ? 'bg-[#A37C4A] text-white' : 'border-2 border-[#D1D2D2]'
              }`}
            >
              {i < 2 ? '✓' : i + 1}
            </div>
            <span className="flex-1">{s}</span>
            {i === 2 && <span className="text-[#A37C4A] font-bold">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimerScreen() {
  const [seconds, setSeconds] = useState(184);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 240)), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const progress = ((240 - seconds) / 240) * 100;

  return (
    <div className="p-4 h-full bg-[#F3F3F2] flex flex-col items-center justify-center">
      <div className="text-[10px] text-[#60564C] uppercase tracking-widest mb-2">
        Simmering sauce
      </div>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="#D1D2D2" strokeWidth="6" fill="none" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            stroke="#A37C4A"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={264}
            animate={{ strokeDashoffset: 264 - (264 * progress) / 100 }}
            transition={{ duration: 1 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-display font-black tabular-nums text-[#1C1F21]">
              {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
            </div>
            <div className="text-[9px] text-[#60564C] mt-0.5">remaining</div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="px-3 py-1.5 rounded-full bg-[#1C1F21] text-white text-[10px] font-bold">Pause</button>
        <button className="px-3 py-1.5 rounded-full bg-white text-[#1C1F21] text-[10px] font-bold">+1 min</button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 w-full">
        {['🌡 180°F', '⚖ 2.5 kg', '💧 1.2 L'].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-1.5 text-center text-[9px] font-medium text-[#60564C]">
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function ListScreen() {
  return (
    <div className="p-3 h-full bg-[#F3F3F2] overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-[#1C1F21]">Shopping List</div>
        <span className="text-[9px] text-[#60564C]">5 of 12</span>
      </div>
      <div className="bg-white rounded-xl p-2 mb-2">
        <div className="text-[9px] uppercase tracking-widest text-[#A37C4A] font-bold mb-1">Produce</div>
        {['Salmon fillet', 'Lemon', 'Dill', 'Garlic'].map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1 text-[10px] text-[#1C1F21]">
            <div
              className={`w-3.5 h-3.5 rounded border-2 ${
                i < 2 ? 'bg-[#A37C4A] border-[#A37C4A]' : 'border-[#D1D2D2]'
              } flex items-center justify-center text-white text-[8px]`}
            >
              {i < 2 ? '✓' : ''}
            </div>
            <span className={i < 2 ? 'line-through opacity-50' : ''}>{item}</span>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-2">
        <div className="text-[9px] uppercase tracking-widest text-[#A37C4A] font-bold mb-1">Pantry</div>
        {['Olive oil', 'Sea salt', 'Black pepper'].map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1 text-[10px] text-[#1C1F21]">
            <div className="w-3.5 h-3.5 rounded border-2 border-[#D1D2D2]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FALLBACK_APP_SUB: TextOverride = {
  ar: 'تطبيق يحول الطبخ إلى تجربة ذكية. وصفات، مؤقت، تسوّق، كله في يدك.',
  en: 'An app that turns cooking into a smart experience. Recipes, timers, shopping — all in your hand.',
};
const FALLBACK_RECIPE_PHOTO = 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80';
const FALLBACK_APP_BADGE: TextOverride = { ar: 'متوفر على iOS & Android', en: 'Available on iOS & Android' };
const FALLBACK_APP_CTA: TextOverride = { ar: 'حمله مجاناً', en: 'Download Free' };
const FALLBACK_APP_TAGLINE: TextOverride = { ar: 'ابدأ الطبخ الذكي اليوم', en: 'Start smart cooking today' };
const FALLBACK_FEATURES: { icon: string; title: TextOverride; desc: TextOverride }[] = [
  { icon: '🤖', title: { ar: 'اقتراحات ذكية', en: 'Smart Suggestions' }, desc: { ar: 'وصفات تناسب ذوقك', en: 'Recipes matching your taste' } },
  { icon: '⏱', title: { ar: 'مؤقت متعدد', en: 'Multi Timer' }, desc: { ar: 'تتبع كل مرحلة', en: 'Track every stage' } },
  { icon: '🛒', title: { ar: 'قائمة تسوّق', en: 'Shopping List' }, desc: { ar: 'كل المكونات بضغطة', en: 'All ingredients, one tap' } },
  { icon: '📊', title: { ar: 'إحصائيات', en: 'Nutrition Stats' }, desc: { ar: 'تتبع سعراتك', en: 'Track your calories' } },
];

export default function AppSection() {
  const { dir } = useDirection();
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState<ScreenId>('home');
  const isRTL = dir === 'rtl';
  const [sub, setSub] = useState<TextOverride>(FALLBACK_APP_SUB);
  const [recipePhoto, setRecipePhoto] = useState(FALLBACK_RECIPE_PHOTO);
  const [badge, setBadge] = useState<TextOverride>(FALLBACK_APP_BADGE);
  const [cta, setCta] = useState<TextOverride>(FALLBACK_APP_CTA);
  const [tagline, setTagline] = useState<TextOverride>(FALLBACK_APP_TAGLINE);
  const [features, setFeatures] = useState(FALLBACK_FEATURES);

  useEffect(() => {
    function load() {
      getSiteText('app.subtitle', FALLBACK_APP_SUB.ar, FALLBACK_APP_SUB.en).then(setSub);
      getSiteAsset('app.recipePhoto', FALLBACK_RECIPE_PHOTO).then(setRecipePhoto);
      getSiteText('app.badge', FALLBACK_APP_BADGE.ar, FALLBACK_APP_BADGE.en).then(setBadge);
      getSiteText('app.ctaButton', FALLBACK_APP_CTA.ar, FALLBACK_APP_CTA.en).then(setCta);
      getSiteText('app.tagline', FALLBACK_APP_TAGLINE.ar, FALLBACK_APP_TAGLINE.en).then(setTagline);
      Promise.all(
        FALLBACK_FEATURES.map((f, i) =>
          Promise.all([
            getSiteText(`app.feature${i + 1}Title`, f.title.ar, f.title.en),
            getSiteText(`app.feature${i + 1}Desc`, f.desc.ar, f.desc.en),
          ]).then(([title, desc]) => ({ icon: f.icon, title, desc }))
        )
      ).then(setFeatures);
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings') load();
    });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.app-header',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );
      gsap.fromTo(
        '.app-mockup',
        { y: 100, opacity: 0, rotateY: 15 },
        {
          y: 0,
          opacity: 1,
          rotateY: 0,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 60%' },
        }
      );
      gsap.fromTo(
        '.app-feature',
        { x: isRTL ? 50 : -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.app-features', start: 'top 75%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [isRTL]);

  const screenOrder: ScreenId[] = ['home', 'recipe', 'timer', 'list'];

  return (
    <section
      id="app"
      ref={ref}
      dir={dir}
      className="relative bg-gradient-to-b from-[#D1D2D2] to-[#C5C6C7] text-[#1C1F21] overflow-hidden py-24 lg:py-32"
    >
      <div className="max-w-[1500px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="app-header text-center mb-16">
          <div
            className="inline-flex items-center gap-2 bg-white/60 backdrop-blur px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest text-[#60564C] font-bold mb-6"
            style={badge.color ? { color: badge.color } : undefined}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {isRTL ? badge.ar : badge.en}
          </div>
          <h2 className="font-grotesk text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.05] tracking-tight">
            <span className="block">Your Smart</span>
            <span className="block font-bold">Kitchen Assistant</span>
          </h2>
          <p
            className="mt-4 text-sm lg:text-base text-[#60564C] max-w-xl mx-auto"
            style={sub.color ? { color: sub.color } : undefined}
          >
            {isRTL ? sub.ar : sub.en}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Features */}
          <div className="lg:col-span-4 app-features space-y-4 order-2 lg:order-1">
            {features.map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ x: isRTL ? -8 : 8 }}
                className="app-feature bg-white/60 backdrop-blur p-4 lg:p-5 rounded-2xl border border-white/80 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{f.icon}</div>
                  <div>
                    <h3
                      className="font-bold text-sm lg:text-base text-[#1C1F21]"
                      style={f.title.color ? { color: f.title.color } : undefined}
                    >
                      {isRTL ? f.title.ar : f.title.en}
                    </h3>
                    <p
                      className="text-xs text-[#60564C] mt-0.5"
                      style={f.desc.color ? { color: f.desc.color } : undefined}
                    >
                      {isRTL ? f.desc.ar : f.desc.en}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Phone mockup */}
          <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="app-mockup relative mx-auto w-[260px] lg:w-[300px] aspect-[9/19] bg-[#1C1F21] rounded-[3rem] p-2.5 shadow-2xl">
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1C1F21] rounded-b-2xl z-20" />
              <div className="relative w-full h-full bg-[#F3F3F2] rounded-[2.5rem] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ x: isRTL ? -50 : 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: isRTL ? 50 : -50, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0"
                  >
                    {active === 'home' && <HomeScreen />}
                    {active === 'recipe' && <RecipeScreen photo={recipePhoto} />}
                    {active === 'timer' && <TimerScreen />}
                    {active === 'list' && <ListScreen />}
                  </motion.div>
                </AnimatePresence>

                {/* Bottom nav */}
                <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-[#D1D2D2] px-2 py-1.5 flex items-center justify-around">
                  {screenOrder.map((id) => (
                    <button
                      key={id}
                      onClick={() => setActive(id)}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                        active === id ? 'text-[#A37C4A]' : 'text-[#60564C]/60'
                      }`}
                    >
                      <div className="text-base">
                        {id === 'home' && '🏠'}
                        {id === 'recipe' && '📖'}
                        {id === 'timer' && '⏱'}
                        {id === 'list' && '🛒'}
                      </div>
                      <span className="text-[8px] font-medium">{SCREENS[id].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Download CTA */}
          <div className="lg:col-span-4 order-3 space-y-4">
            <div className="bg-[#1C1F21] text-white p-6 rounded-3xl">
              <div
                className="text-[10px] uppercase tracking-widest text-[#A37C4A] font-bold mb-2"
                style={cta.color ? { color: cta.color } : undefined}
              >
                {isRTL ? cta.ar : cta.en}
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-4" style={tagline.color ? { color: tagline.color } : undefined}>
                {isRTL ? tagline.ar : tagline.en}
              </h3>
              <div className="space-y-2">
                <button className="w-full bg-white text-[#1C1F21] rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl"></span>
                  <div className="text-start">
                    <div className="text-[8px] uppercase">Download on</div>
                    <div className="text-xs font-bold">App Store</div>
                  </div>
                </button>
                <button className="w-full bg-white text-[#1C1F21] rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">▶</span>
                  <div className="text-start">
                    <div className="text-[8px] uppercase">Get it on</div>
                    <div className="text-xs font-bold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { v: '4.9', l: 'Rating' },
                { v: '50k+', l: 'Downloads' },
                { v: '120+', l: 'Recipes' },
              ].map((s, i) => (
                <div key={i} className="bg-white/60 backdrop-blur rounded-2xl p-3">
                  <div className="text-xl font-bold text-[#1C1F21]">{s.v}</div>
                  <div className="text-[9px] uppercase tracking-widest text-[#60564C] mt-0.5">
                    {s.l}
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
