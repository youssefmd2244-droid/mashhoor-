import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Cursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);
  const [variant, setVariant] = useState<'default' | 'view' | 'drag'>('default');

  useEffect(() => {
    let raf = 0;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      setPos({ x: currentX, y: currentY });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-cursor="hover"]')) {
        setHovering(true);
        if (target.closest('[data-cursor="view"]')) setVariant('view');
        else if (target.closest('[data-cursor="drag"]')) setVariant('drag');
        else setVariant('default');
      } else {
        setHovering(false);
        setVariant('default');
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
    };
  }, []);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  if (isMobile) return null;

  const size = hovering ? (variant === 'view' ? 80 : 60) : 14;
  const label = variant === 'view' ? 'View' : variant === 'drag' ? 'Drag' : '';

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[999] mix-blend-difference hidden lg:block"
        animate={{
          x: pos.x - size / 2,
          y: pos.y - size / 2,
          width: size,
          height: size,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          borderRadius: '50%',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {label && (
          <span className="text-white text-[10px] uppercase tracking-widest font-bold">
            {label}
          </span>
        )}
      </motion.div>

      {/* Inner dot */}
      <div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-white pointer-events-none z-[999] mix-blend-difference hidden lg:block"
        style={{
          transform: `translate(${pos.x - 3}px, ${pos.y - 3}px)`,
        }}
      />
    </>
  );
}
