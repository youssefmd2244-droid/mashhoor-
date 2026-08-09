import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSetting, setSetting } from './store';

// Three language modes:
// - 'normal' : the site shows content exactly as it was authored/typed
//              (mixed Arabic + English stays mixed, nothing is forced).
//              This is the default/base mode.
// - 'ar'     : every piece of text that has an Arabic version is forced
//              to show Arabic, full stop.
// - 'en'     : every piece of text that has an English version is forced
//              to show English, full stop.
export type LanguageMode = 'normal' | 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

const MODE_KEY = 'settings.languageMode';

interface LanguageContextValue {
  mode: LanguageMode;
  setMode: (m: LanguageMode) => void;
  dir: Direction;
  // Pick the right string for the current mode.
  // - ar/en modes force that language.
  // - normal mode falls back to the current visual direction (rtl -> ar).
  t: (ar: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<LanguageMode>('normal');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSetting<LanguageMode>(MODE_KEY, 'normal').then((m) => {
      setModeState(m);
      setLoaded(true);
    });
  }, []);

  // normal + ar => rtl layout. en => ltr layout.
  const dir: Direction = mode === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', dir === 'rtl' ? 'ar' : 'en');
  }, [dir]);

  function setMode(m: LanguageMode) {
    setModeState(m);
    setSetting(MODE_KEY, m);
  }

  function t(ar: string, en: string): string {
    if (mode === 'ar') return ar;
    if (mode === 'en') return en;
    // normal mode: show whichever matches the base RTL direction, i.e.
    // the content stays exactly as it would by default (nothing forced).
    return dir === 'rtl' ? ar : en;
  }

  if (!loaded) return null; // avoid a flash of the wrong language on first paint

  return (
    <LanguageContext.Provider value={{ mode, setMode, dir, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
