// Backward-compatible wrapper around the global LanguageContext.
// Existing sections call useDirection() and read { dir, toggle } — that
// keeps working unchanged, now backed by the 3-mode language system
// (normal / ar / en) instead of a simple rtl/ltr flag.
import { useLanguage, type Direction } from '../lib/LanguageContext';

export type { Direction };

export function useDirection() {
  const { dir, mode, setMode } = useLanguage();

  // toggle() now cycles normal -> ar -> en -> normal, for any old code
  // (or a simple two-state UI) that just calls toggle().
  const toggle = () => {
    if (mode === 'normal') setMode('ar');
    else if (mode === 'ar') setMode('en');
    else setMode('normal');
  };

  const setDir = (d: Direction) => setMode(d === 'rtl' ? 'ar' : 'en');

  return { dir, setDir, toggle, mode, setMode };
}
