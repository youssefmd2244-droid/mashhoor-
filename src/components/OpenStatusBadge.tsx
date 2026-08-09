import { useEffect, useState } from 'react';
import { getOperatingHours, computeOpenStatus, type OpenStatus } from '../lib/ops';
import { useLanguage } from '../lib/LanguageContext';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { onDataChange } from '../lib/store';

// Small live "Open now / Closed now" pill. Re-checks every minute so it
// flips automatically at opening/closing time without a page refresh.
// Renders nothing if the restaurant hasn't turned hours on from Settings.
export default function OpenStatusBadge({ className = '' }: { className?: string }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<OpenStatus | null>(null);
  const [openLabel, setOpenLabel] = useState<TextOverride>({ ar: 'مفتوح الآن', en: 'Open now' });
  const [closedLabel, setClosedLabel] = useState<TextOverride>({ ar: 'مقفول دلوقتي', en: 'Closed now' });

  useEffect(() => {
    function load() {
      getSiteText('status.openLabel', openLabel.ar, openLabel.en).then(setOpenLabel);
      getSiteText('status.closedLabel', closedLabel.ar, closedLabel.en).then(setClosedLabel);
    }
    load();
    return onDataChange((store) => {
      if (store === 'settings') load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    async function tick() {
      const hours = await getOperatingHours();
      if (!alive) return;
      setStatus(computeOpenStatus(hours));
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!status || !status.enabled) return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
        status.isOpen
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
      <span>{status.isOpen ? t(openLabel.ar, openLabel.en) : t(closedLabel.ar, closedLabel.en)}</span>
      {status.changeLabel && (
        <span className="opacity-60">· {t(status.changeLabel.ar, status.changeLabel.en)}</span>
      )}
    </div>
  );
}
