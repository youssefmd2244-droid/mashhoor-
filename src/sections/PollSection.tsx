import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDirection } from '../hooks/useDirection';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { listItems, onDataChange } from '../lib/store';
import type { PollOption } from '../lib/types';

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_SUBTITLE: TextOverride = {
  ar: 'صوّت وقولنا إنهى كومبو بيقرّب لقلبك — هنبدأ بتحضيرهولك من بكرة',
  en: 'Vote and tell us which combo speaks to your soul — we will start prepping it tomorrow',
};
const FALLBACK_BADGE: TextOverride = { ar: 'تصويت سريع', en: 'Quick Poll' };
const FALLBACK_TITLE1: TextOverride = { ar: 'إيه كومبو', en: 'Pick Your' };
const FALLBACK_TITLE2: TextOverride = { ar: 'المفضل؟', en: 'Combo' };
const FALLBACK_THANKS: TextOverride = {
  ar: 'شكراً لتصويتك! هنحضّر كومبوك المفضل',
  en: 'Thanks! We are prepping your favorite',
};
const FALLBACK_VOTES_LABEL: TextOverride = { ar: 'صوّت', en: 'votes' };

// Shown only until the restaurant adds its own options from Settings →
// المحتوى → قسم التصويت — this is placeholder/demo content, never a
// substitute for it.
const DEMO_OPTIONS: PollOption[] = [
  {
    id: 'demo-spicy',
    emoji: '🌶️',
    titleAr: 'حار و ناري',
    titleEn: 'Spicy & Fire',
    color: '#C11E10',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    votes: 1248,
  },
  {
    id: 'demo-savory',
    emoji: '🍖',
    titleAr: 'لحم مدخن',
    titleEn: 'Smoky Meat',
    color: '#9B3734',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    votes: 892,
  },
  {
    id: 'demo-sweet',
    emoji: '🍯',
    titleAr: 'حلو و دافئ',
    titleEn: 'Sweet & Warm',
    color: '#EDD8BA',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80',
    votes: 654,
  },
];

export default function PollSection() {
  const { dir } = useDirection();
  const ref = useRef<HTMLElement>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const isRTL = dir === 'rtl';
  const [subtitle, setSubtitle] = useState<TextOverride>(FALLBACK_SUBTITLE);
  const [badge, setBadge] = useState<TextOverride>(FALLBACK_BADGE);
  const [title1, setTitle1] = useState<TextOverride>(FALLBACK_TITLE1);
  const [title2, setTitle2] = useState<TextOverride>(FALLBACK_TITLE2);
  const [thanks, setThanks] = useState<TextOverride>(FALLBACK_THANKS);
  const [votesLabel, setVotesLabel] = useState<TextOverride>(FALLBACK_VOTES_LABEL);
  const [options, setOptions] = useState<PollOption[]>(DEMO_OPTIONS);

  useEffect(() => {
    function load() {
      getSiteText('poll.subtitle', FALLBACK_SUBTITLE.ar, FALLBACK_SUBTITLE.en).then(setSubtitle);
      getSiteText('poll.badge', FALLBACK_BADGE.ar, FALLBACK_BADGE.en).then(setBadge);
      getSiteText('poll.title1', FALLBACK_TITLE1.ar, FALLBACK_TITLE1.en).then(setTitle1);
      getSiteText('poll.title2', FALLBACK_TITLE2.ar, FALLBACK_TITLE2.en).then(setTitle2);
      getSiteText('poll.thanks', FALLBACK_THANKS.ar, FALLBACK_THANKS.en).then(setThanks);
      getSiteText('poll.votesLabel', FALLBACK_VOTES_LABEL.ar, FALLBACK_VOTES_LABEL.en).then(setVotesLabel);
      listItems<PollOption>('pollOptions').then((list) =>
        setOptions(list.length ? list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : DEMO_OPTIONS)
      );
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings' || store === 'pollOptions') load();
    });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.poll-q',
        { y: 60, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%' },
        }
      );
      gsap.fromTo(
        '.poll-card',
        { x: (i) => (i % 2 === 0 ? -200 : 200), opacity: 0, rotate: (i) => (i % 2 === 0 ? -10 : 10) },
        {
          x: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.9,
          ease: 'back.out(1.4)',
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: 'top 60%' },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  const total = options.reduce((sum, o) => sum + (o.votes ?? 0), 0) || 1;

  return (
    <section
      id="poll"
      ref={ref}
      dir={dir}
      className="relative min-h-screen bg-[#EDD8BA] text-[#AC0B06] overflow-hidden flex items-center py-20"
    >
      {/* Decorative confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              width: 8 + (i % 4) * 4,
              height: 8 + (i % 4) * 4,
              background: ['#C11E10', '#EEC31C', '#9B3734', '#AC0B06'][i % 4],
            }}
            animate={{ y: [0, -15, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 w-full">
        {/* Question header */}
        <div className="text-center mb-12 lg:mb-16">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-block bg-[#C11E10] text-[#EDD8BA] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6"
            style={badge.color ? { color: badge.color } : undefined}
          >
            {isRTL ? badge.ar : badge.en}
          </motion.div>
          <h2 className="poll-q font-bubble text-6xl sm:text-7xl lg:text-[10rem] leading-[0.85] text-[#C11E10] uppercase">
            <span style={title1.color ? { color: title1.color } : undefined}>{isRTL ? title1.ar : title1.en}</span>
            <br />
            <span className="italic text-[#AC0B06]" style={title2.color ? { color: title2.color } : undefined}>
              {isRTL ? title2.ar : title2.en}
            </span>
          </h2>
          <p
            className="mt-6 text-[#AC0B06]/70 text-base lg:text-lg max-w-xl mx-auto"
            style={subtitle.color ? { color: subtitle.color } : undefined}
          >
            {isRTL ? subtitle.ar : subtitle.en}
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {options.map((opt, i) => {
            const optVotes = opt.votes ?? 0;
            const percentage = voted
              ? Math.round((optVotes / (voted === opt.id ? total + 1 : total)) * 100)
              : Math.round((optVotes / total) * 100);
            const isVoted = voted === opt.id;

            return (
              <motion.button
                key={opt.id}
                onClick={() => setVoted(opt.id)}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="poll-card group relative aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-2xl"
                style={{ transformOrigin: 'center' }}
              >
                {/* Background image */}
                <div className="absolute inset-0">
                  <img
                    src={opt.image}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>

                {/* Vote bar (bottom fill) */}
                {voted && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${percentage}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="absolute bottom-0 inset-x-0 z-10"
                    style={{ background: opt.color, opacity: 0.4 }}
                  />
                )}

                {/* Content */}
                <div className="absolute inset-0 z-20 flex flex-col justify-between p-5 lg:p-7 text-start">
                  {/* Top: number + emoji */}
                  <div className="flex items-start justify-between">
                    <span className="text-5xl lg:text-6xl">{opt.emoji}</span>
                    <span className="text-5xl lg:text-7xl font-bubble text-white/30 leading-none">
                      0{i + 1}
                    </span>
                  </div>

                  {/* Bottom: title + vote */}
                  <div>
                    <h3
                      className="text-white font-bold text-2xl lg:text-3xl uppercase tracking-tight leading-none"
                      style={opt.titleColor ? { color: opt.titleColor } : undefined}
                    >
                      {isRTL ? opt.titleAr : opt.titleEn}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-white/80 text-xs uppercase tracking-widest font-medium">
                        {voted ? `${percentage}%` : `${optVotes} ${isRTL ? votesLabel.ar : votesLabel.en}`}
                      </span>
                      <motion.div
                        animate={isVoted ? { scale: [1, 1.3, 1] } : {}}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                          isVoted ? 'bg-[#EEC31C] text-[#AC0B06]' : 'bg-white/20 text-white'
                        }`}
                      >
                        {isVoted ? '✓' : '→'}
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Border accent */}
                <div
                  className="absolute inset-0 rounded-3xl border-2 z-30 pointer-events-none transition-colors"
                  style={{ borderColor: isVoted ? opt.color : 'transparent' }}
                />
              </motion.button>
            );
          })}
        </div>

        {/* Result footer */}
        <AnimatePresence>
          {voted && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-10 text-center"
            >
              <div className="inline-flex items-center gap-3 bg-[#C11E10] text-[#EDD8BA] px-6 py-3 rounded-full">
                <span className="text-2xl">🎉</span>
                <span
                  className="text-sm lg:text-base font-bold uppercase tracking-wider"
                  style={thanks.color ? { color: thanks.color } : undefined}
                >
                  {isRTL ? thanks.ar : thanks.en}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
