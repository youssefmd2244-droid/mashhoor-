import { useState, type DragEvent } from 'react';
import { compressImageFile, yieldToBrowser } from '../../lib/site';
import { uploadVideo } from '../../lib/videoUpload';
import type { MenuItemMedia } from '../../lib/types';

interface GalleryUploadFieldProps {
  value: MenuItemMedia[];
  onChange: (media: MenuItemMedia[]) => void;
}

// Lets a single menu item carry MULTIPLE photos and/or videos (beyond its
// main cover image), each with its own caption — "اكتب تفاصيل كل واحد
// فيهم". Images are compressed client-side before storage; videos go
// straight to Vercel Blob (see VideoUploadField) so nothing huge ever sits
// in IndexedDB as a data URL.
export default function GalleryUploadField({ value, onChange }: GalleryUploadFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleFiles(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setBusy(true);
    setProgress({ done: 0, total: list.length });
    const added: MenuItemMedia[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      try {
        if (file.type.startsWith('video/')) {
          const url = await uploadVideo(file);
          added.push({ id: crypto.randomUUID(), kind: 'video', url });
        } else if (file.type.startsWith('image/')) {
          const url = await compressImageFile(file);
          added.push({ id: crypto.randomUUID(), kind: 'image', url });
        }
      } catch {
        // Skip a failed file (e.g. video upload unavailable) and keep going
        // with the rest instead of aborting the whole batch.
      }
      setProgress({ done: i + 1, total: list.length });
      await yieldToBrowser(); // keep the UI thread free between files
    }
    onChange([...value, ...added]);
    setBusy(false);
    setProgress(null);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function updateCaption(id: string, patch: Partial<MenuItemMedia>) {
    onChange(value.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function remove(id: string) {
    onChange(value.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-2">
      <label className="block text-white/60 text-xs">صور وفيديوهات إضافية للصنف (اختياري)</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex items-center gap-3 rounded-lg border-2 border-dashed px-3 py-3 transition-colors ${
          dragOver ? 'border-white/60 bg-white/10' : 'border-white/20 bg-white/5'
        }`}
      >
        <div className="flex-1 text-center text-xs text-white/50">
          {busy ? (
            <span>جاري المعالجة… {progress?.done}/{progress?.total}</span>
          ) : (
            <>
              اسحب كذا صورة أو فيديو هنا، أو{' '}
              <label className="text-white underline cursor-pointer">
                اختر من الجهاز
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((m) => (
            <div key={m.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
              {m.kind === 'image' ? (
                <img src={m.url} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" />
              ) : (
                <video src={m.url} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-black" />
              )}
              <div className="flex-1 space-y-1">
                <input
                  value={m.captionAr ?? ''}
                  onChange={(e) => updateCaption(m.id, { captionAr: e.target.value })}
                  placeholder="تفاصيل بالعربي (اختياري)"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 outline-none text-[11px]"
                />
              </div>
              <button onClick={() => remove(m.id)} className="text-red-400 text-xs shrink-0">
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
