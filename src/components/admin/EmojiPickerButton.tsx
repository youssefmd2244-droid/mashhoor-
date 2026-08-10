import { useEffect, useRef, useState } from 'react';

// A small reusable "insert emoji" button — for admins working from a laptop
// where there's no OS emoji keyboard handy. Emoji themselves need zero
// special support anywhere in the app: every text field here is a plain
// string (item names, descriptions, site texts, captions...) stored as-is in
// IndexedDB/JSON, so typing 😋🔥🎉 directly from a phone keyboard already
// works everywhere with no changes. This button is purely a convenience for
// picking one without a keyboard that has emoji built in.
const EMOJI_GROUPS: { label: string; items: string[] }[] = [
  {
    label: 'أكل ومطاعم',
    items: ['🍔', '🍕', '🍟', '🌯', '🥙', '🍗', '🥩', '🍖', '🍤', '🍛', '🍲', '🥘', '🍝', '🍜', '🍣', '🥗', '🥪', '🌮', '🧆', '🍳', '🥞', '🧇', '🍰', '🎂', '🍩', '🍪', '🍫', '🍬', '🍦', '🍨', '☕', '🍵', '🧃', '🥤', '🍹', '🍺', '🥂'],
  },
  {
    label: 'تعبيرات وحماس',
    items: ['🔥', '⭐', '✨', '💯', '👌', '👍', '❤️', '😋', '😍', '🤩', '🥳', '🎉', '👑', '🏆', '💎', '⚡', '✅', '🆕', '🌟'],
  },
  {
    label: 'أخرى',
    items: ['📍', '📞', '🕐', '🚚', '🛵', '💳', '🎁', '🏠', '🌙', '☀️', '❄️', '🌶️'],
  },
];

export default function EmojiPickerButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="إضافة ايموجي"
        className="w-7 h-7 flex items-center justify-center rounded-md bg-white/10 border border-white/20 hover:bg-white/20 text-sm shrink-0"
      >
        🙂
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 end-0 w-64 max-h-56 overflow-y-auto bg-neutral-800 border border-white/15 rounded-xl p-2 shadow-2xl"
          dir="rtl"
        >
          {EMOJI_GROUPS.map((g) => (
            <div key={g.label} className="mb-2">
              <p className="text-[10px] text-white/40 mb-1">{g.label}</p>
              <div className="grid grid-cols-8 gap-1">
                {g.items.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onPick(emoji);
                      setOpen(false);
                    }}
                    className="text-lg hover:bg-white/10 rounded-md py-0.5"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
