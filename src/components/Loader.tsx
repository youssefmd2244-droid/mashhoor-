import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDirection } from '../hooks/useDirection';
import { getSiteIdentity, type SiteIdentity } from '../lib/site';

// Splash screen duration: EXACTLY 4 seconds total, always — not "roughly
// around 4s depending on the device". 3.6s for the progress bar to fill +
// 0.4s fade-out = 4.0s flat.
const FILL_MS = 3600;
const EXIT_MS = 400;

export default function Loader() {
  const { dir } = useDirection();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [identity, setIdentity] = useState<SiteIdentity>({ nameAr: 'مشهور', nameEn: 'Mashhoor' });

  useEffect(() => {
    getSiteIdentity().then(setIdentity);
  }, []);

  const displayName = dir === 'rtl' ? identity.nameAr : identity.nameEn;
  // Split "Mashhoor" -> "MASH" / "HOOR" style: first half plain, second half
  // in the accent color/italic, matching the original two-tone brand mark —
  // but now driven by whatever name the admin actually set.
  const mid = Math.ceil(displayName.length / 2);
  const namePart1 = displayName.slice(0, mid);
  const namePart2 = displayName.slice(mid);

  useEffect(() => {
    // Driven by requestAnimationFrame + real elapsed time (performance.now()),
    // NOT setInterval with random step sizes. setInterval ticks get delayed
    // or dropped whenever the main thread is busy (exactly when the site
    // "feels like it's hanging"), so the old bar could silently stall well
    // past 4 seconds. Computing progress from actual elapsed time instead
    // self-corrects every frame, so the splash always finishes at exactly
    // 4 seconds regardless of how busy the device is.
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / FILL_MS) * 100);
      setProgress(pct);
      if (elapsed < FILL_MS) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setVisible(false), EXIT_MS);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ duration: EXIT_MS / 1000, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[100] bg-[#750001] flex items-center justify-center overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-[#EEC31C]"
                style={{
                  left: `${(i * 5) % 100}%`,
                  top: `${(i * 7) % 100}%`,
                  width: 8 + (i % 4) * 4,
                  height: 8 + (i % 4) * 4,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 text-center text-white">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-8 flex flex-col items-center gap-4"
            >
              <div className="font-display text-6xl lg:text-8xl font-black italic leading-none uppercase" dir={dir}>
                <span>{namePart1}</span>
                <span className="text-[#EEC31C]">{namePart2}</span>
              </div>
            </motion.div>

            <div className="w-64 h-px bg-white/20 mx-auto relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#EEC31C]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 font-mono text-xs uppercase tracking-widest text-white/60">
              {Math.round(progress)}% {progress >= 100 ? '— ready' : '— loading'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
