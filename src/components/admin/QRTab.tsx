import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { getSetting, setSetting } from '../../lib/store';

const URL_KEY = 'settings.qrUrl';
const TABLE_COUNT_KEY = 'settings.qrTableCount';
const TABLE_PREFIX_KEY = 'settings.qrTablePrefix'; // "table" or "room" — matches ?table=/?room= read by the site

export default function QRTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'single' | 'tables'>('single');
  const [tableCount, setTableCount] = useState(10);
  const [tablePrefix, setTablePrefix] = useState<'table' | 'room'>('table');
  const [tableUrls, setTableUrls] = useState<{ label: string; url: string }[]>([]);

  useEffect(() => {
    (async () => {
      setUrl(await getSetting<string>(URL_KEY, window.location.origin));
      setTableCount(await getSetting<number>(TABLE_COUNT_KEY, 10));
      setTablePrefix(await getSetting<'table' | 'room'>(TABLE_PREFIX_KEY, 'table'));
    })();
  }, []);

  useEffect(() => {
    if (mode === 'single' && url && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 260, margin: 2 }).catch(() => {});
    }
  }, [url, mode]);

  useEffect(() => {
    if (mode !== 'tables') return;
    const base = url || window.location.origin;
    const list = Array.from({ length: Math.max(1, tableCount) }, (_, i) => {
      const n = i + 1;
      const sep = base.includes('?') ? '&' : '?';
      return {
        label: `${tablePrefix === 'room' ? 'أوضة' : 'ترابيزة'} ${n}`,
        url: `${base}${sep}${tablePrefix}=${n}`,
      };
    });
    setTableUrls(list);
  }, [mode, url, tableCount, tablePrefix]);

  async function save() {
    await setSetting(URL_KEY, url);
    await setSetting(TABLE_COUNT_KEY, tableCount);
    await setSetting(TABLE_PREFIX_KEY, tablePrefix);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'menu-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="space-y-4 text-sm max-w-2xl">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('single')}
          className={`px-4 py-1.5 rounded-full text-xs border ${
            mode === 'single' ? 'bg-white text-black border-white font-medium' : 'border-white/20 text-white/60'
          }`}
        >
          باركود واحد للموقع
        </button>
        <button
          onClick={() => setMode('tables')}
          className={`px-4 py-1.5 rounded-full text-xs border ${
            mode === 'tables' ? 'bg-white text-black border-white font-medium' : 'border-white/20 text-white/60'
          }`}
        >
          باركود لكل ترابيزة/أوضة
        </button>
      </div>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={save}
        placeholder="رابط الموقع"
        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
      />

      {mode === 'single' ? (
        <>
          <p className="text-white/50 text-xs">
            الباركود ده بيفتح لينك الموقع مباشرة — تقدر تطبعه على المنيو أو تحطه على التربيزة، وأي حد يمسحه هيدخل الموقع فورًا.
          </p>
          <div className="bg-white p-4 rounded-xl w-fit">
            <canvas ref={canvasRef} />
          </div>
          <button onClick={download} className="bg-white text-black px-4 py-2 rounded-lg font-medium">
            تحميل الباركود PNG
          </button>
        </>
      ) : (
        <>
          <p className="text-white/50 text-xs">
            كل باركود هنا بيفتح الموقع ويقول له تلقائي إن الطلب ده جاي من رقم كام — العميل مش هيحتاج يكتب رقم
            الترابيزة يدوي (لازم تفعّل ميزة "رقم الترابيزة/الأوضة" من تبويب "المميزات" الأول عشان الرقم ده يترصد).
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-white/60 text-xs">العدد</label>
              <input
                type="number"
                min={1}
                max={200}
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value) || 1)}
                onBlur={save}
                className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-white/60 text-xs">النوع</label>
              <select
                value={tablePrefix}
                onChange={(e) => {
                  setTablePrefix(e.target.value as 'table' | 'room');
                  save();
                }}
                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs"
              >
                <option value="table">ترابيزة (مطعم)</option>
                <option value="room">أوضة (فندق)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto pt-2">
            {tableUrls.map((t) => (
              <TableQRCard key={t.url} label={t.label} url={t.url} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TableQRCard({ label, url }: { label: string; url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 140, margin: 1 }).catch(() => {});
    }
  }, [url]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${label.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2">
      <div className="bg-white p-2 rounded-lg">
        <canvas ref={canvasRef} />
      </div>
      <span className="text-xs text-white/70">{label}</span>
      <button onClick={download} className="text-[10px] text-[#EEC31C] hover:underline">
        تحميل
      </button>
    </div>
  );
}
