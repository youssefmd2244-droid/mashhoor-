import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDirection } from '../hooks/useDirection';
import { getSiteIdentity, type SiteIdentity } from '../lib/site';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { onDataChange } from '../lib/store';
import { openSettingsPanel, focusMenuSearch } from '../lib/uiEvents';
import OpenStatusBadge from './OpenStatusBadge';
import BrandBadge from './BrandBadge';

const NAV_ITEMS = [
  { id: 'hero', ar: 'الرئيسية', en: 'Hero' },
  { id: 'poll', ar: 'الكومبو', en: 'Poll' },
  { id: 'menu', ar: 'القائمة', en: 'Menu' },
  { id: 'signature', ar: 'مميز', en: 'Signature' },
  { id: 'pasta', ar: 'الباستا', en: 'Pasta' },
  { id: 'fastfood', ar: 'فاست فود', en: 'Fast Food' },
  { id: 'posters', ar: 'بوسترات', en: 'Posters' },
  { id: 'app', ar: 'التطبيق', en: 'App' },
  { id: 'story', ar: 'القصة', en: 'Story' },
  { id: 'flyer', ar: 'العرض', en: 'Offer' },
];

export default function Navigation() {
  const { dir, toggle, mode } = useDirection();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [identity, setIdentity] = useState<SiteIdentity>({ nameAr: 'مشهور', nameEn: 'Mashhoor' });
  // Nav labels are editable from Settings → كل نصوص الموقع (keys nav.hero,
  // nav.menu, ...) — falls back to the original label until overridden.
  const [navOverrides, setNavOverrides] = useState<Record<string, TextOverride>>({});

  useEffect(() => {
    getSiteIdentity().then(setIdentity);
  }, []);

  useEffect(() => {
    function load() {
      Promise.all(
        NAV_ITEMS.map((item) => getSiteText(`nav.${item.id}`, item.ar, item.en).then((v) => [item.id, v] as const))
      ).then((entries) => setNavOverrides(Object.fromEntries(entries)));
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings') load();
    });
  }, []);
  function navLabel(item: (typeof NAV_ITEMS)[number], isRTL: boolean) {
    const ov = navOverrides[item.id];
    return isRTL ? ov?.ar || item.ar : ov?.en || item.en;
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOpen(false);
    }
  };

  const isRTL = dir === 'rtl';
  const displayName = isRTL ? identity.nameAr : identity.nameEn;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'backdrop-blur-xl bg-black/40 border-b border-white/10'
            : 'bg-transparent'
        }`}
        dir={dir}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-16 lg:h-20 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => scrollTo('hero')}
            className="flex items-center gap-2 group"
          >
            {identity.logo ? (
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.6 }}
                className="w-9 h-9 rounded-full border-2 border-[#EEC31C] flex items-center justify-center overflow-hidden"
              >
                <img src={identity.logo} alt={displayName} className="w-full h-full object-cover" />
              </motion.div>
            ) : (
              <BrandBadge label={identity.nameEn?.trim() || 'Mashhoor'} color="#750001" size={36} />
            )}
            <span
              className="font-display text-white text-xl tracking-wider hidden sm:inline"
              style={identity.nameColor ? { color: identity.nameColor } : undefined}
            >
              {displayName}
            </span>
          </button>

          <OpenStatusBadge className="hidden md:flex" />

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="px-3 py-2 text-xs font-medium text-white/70 hover:text-white tracking-wider uppercase transition-colors"
              >
                {navLabel(item, isRTL)}
              </button>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                scrollTo('menu');
                setTimeout(focusMenuSearch, 500);
              }}
              className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/10 transition-all"
              aria-label={isRTL ? 'بحث' : 'Search'}
              title={isRTL ? 'ابحث عن أي صنف في الموقع' : 'Search the menu'}
            >
              🔍
            </button>
            <button
              onClick={openSettingsPanel}
              className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/10 transition-all"
              aria-label={isRTL ? 'الإعدادات' : 'Settings'}
              title={isRTL ? 'فتح الإعدادات' : 'Open settings'}
            >
              ⚙
            </button>
            <button
              onClick={toggle}
              className="px-3 py-1.5 rounded-full border border-white/20 text-white/80 text-xs font-medium hover:bg-white/10 transition-all uppercase tracking-widest"
              aria-label="Language mode"
              title={mode === 'normal' ? 'Normal (as written)' : mode === 'ar' ? 'العربية' : 'English'}
            >
              {mode === 'normal' ? (isRTL ? 'الأساسي' : 'Default') : mode === 'ar' ? 'AR' : 'EN'}
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden w-9 h-9 rounded-full border border-white/20 flex items-center justify-center"
              aria-label="Menu"
            >
              <div className="space-y-1">
                <span className="block w-4 h-px bg-white" />
                <span className="block w-4 h-px bg-white" />
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden bg-black/95 backdrop-blur-xl"
            dir={dir}
          >
            <div className="pt-24 px-8 grid grid-cols-2 gap-3">
              {NAV_ITEMS.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => scrollTo(item.id)}
                  className="text-start p-4 border border-white/10 rounded-2xl text-white/80 hover:text-white hover:border-[#EEC31C] transition-all"
                >
                  <span className="block text-xs text-white/40 mb-1">
                    0{i + 1}
                  </span>
                  <span className="block text-lg font-medium">
                    {navLabel(item, isRTL)}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
