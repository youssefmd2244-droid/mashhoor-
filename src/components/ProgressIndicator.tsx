import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SECTIONS = [
  { id: 'hero', label: 'Hero', color: '#A90009' },
  { id: 'poll', label: 'Poll', color: '#C11E10' },
  { id: 'menu', label: 'Menu', color: '#B9B097' },
  { id: 'signature', label: 'Signature', color: '#687457' },
  { id: 'pasta', label: 'Pasta', color: '#CB977F' },
  { id: 'fastfood', label: 'Fast Food', color: '#F2BF05' },
  { id: 'posters', label: 'Posters', color: '#A37C4A' },
  { id: 'app', label: 'App', color: '#60564C' },
  { id: 'story', label: 'Story', color: '#D7B3B2' },
  { id: 'flyer', label: 'Flyer', color: '#846950' },
];

export default function ProgressIndicator() {
  const [active, setActive] = useState('hero');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(Math.min(1, window.scrollY / total));

      // Find which section is in view
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            current = s.id;
          }
        }
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed end-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3">
      {/* Progress bar */}
      <div className="relative w-px h-32 bg-white/10 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 right-0 bg-white origin-top"
          style={{ scaleY: progress, height: '100%' }}
        />
      </div>

      {/* Section pips */}
      <div className="flex flex-col gap-3">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              const el = document.getElementById(s.id);
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative w-2 h-2 rounded-full bg-white/20 transition-all hover:scale-150"
            style={{
              background: active === s.id ? s.color : 'rgba(255,255,255,0.2)',
              transform: active === s.id ? 'scale(1.4)' : 'scale(1)',
            }}
            aria-label={s.label}
          >
            <span className="absolute end-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] uppercase tracking-widest text-white/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
