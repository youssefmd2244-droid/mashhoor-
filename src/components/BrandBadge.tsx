import { motion } from 'framer-motion';

// A flat (non-3D, no canvas/three.js) animated brand mark: a slow-turning
// gold conic-gradient ring around a solid color disc, plus a soft breathing
// glow, with the letter/label centered on top. Cheap — just CSS transforms
// and box-shadow via framer-motion, no WebGL — but still reads as alive.
export default function BrandBadge({
  label,
  color = '#750001',
  size = 40,
}: {
  label: string;
  color?: string;
  size?: number;
}) {
  const raw = label.trim();
  const words = raw.split(/\s+/).filter(Boolean);
  // A single long word (e.g. "mashhoor") gets split in half onto two
  // stacked lines, same treatment as multi-word labels, so it still fits
  // legibly inside a small circle instead of overflowing.
  const lines =
    words.length > 1
      ? words
      : raw.length > 5
        ? [raw.slice(0, Math.ceil(raw.length / 2)), raw.slice(Math.ceil(raw.length / 2))]
        : [raw];
  const fontSize = lines.length > 1 ? size * 0.22 : size * 0.42;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Slow-turning gold ring */}
      <motion.div
        className="absolute inset-0 rounded-full p-[2px]"
        style={{
          background: 'conic-gradient(from 0deg, #EEC31C, transparent 30%, #EEC31C 60%, transparent 90%, #EEC31C)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
      </motion.div>

      {/* Breathing glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: `0 0 10px 2px ${color}` }}
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <span
        className="absolute inset-0 flex flex-col items-center justify-center font-display font-black italic uppercase pointer-events-none text-center leading-[1.1]"
        style={{ color: '#EEC31C', fontSize, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
      >
        {lines.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </span>
    </div>
  );
}
