import { motion } from 'framer-motion';
import type { IconCodeFlag } from '../lib/iconCode';

// Small "worked in these countries" strip for the Icon Code credit block.
// Saudi Arabia (always first) stays completely fixed/still — it's the home
// base flag. Every other enabled flag gets a light, cheap little bounce
// (translateY + a touch of scale) once in a while, staggered so the strip
// still feels alive — no continuous 3D rotation, so it's not doing constant
// work on the main thread while sitting off-screen or piling up with the
// rest of the page's scroll animations.
export default function FlagStrip({ flags, isRTL }: { flags: IconCodeFlag[]; isRTL: boolean }) {
  const enabled = flags.filter((f) => f.enabled);
  if (enabled.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-white/40 text-[11px] uppercase tracking-widest">
        {isRTL ? 'سبق وشتغلنا في' : 'Previously worked in'}
      </p>
      <div className="flex flex-wrap items-center gap-2.5" dir="ltr">
        {enabled.map((f, i) => {
          const pinned = f.code === 'sa';
          return (
            <motion.span
              key={f.code}
              title={isRTL ? f.nameAr : f.nameEn}
              className="inline-block text-xl leading-none select-none"
              animate={pinned ? undefined : { y: [0, -3, 0], scale: [1, 1.08, 1] }}
              transition={
                pinned
                  ? undefined
                  : { duration: 1.6, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut', delay: i * 0.2 }
              }
            >
              {f.emoji}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
