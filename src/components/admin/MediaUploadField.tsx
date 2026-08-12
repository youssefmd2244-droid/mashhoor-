import { useState, type DragEvent } from 'react';
import { compressImageFile, fileToDataUrl } from '../../lib/site';

interface MediaUploadFieldProps {
  value?: string;
  onChange: (dataUrlOrUrl: string) => void;
  accept?: string; // e.g. "image/*" or "image/*,video/*"
  label?: string;
  hint?: string;
  previewClassName?: string;
}

// One reusable uploader used everywhere a "رابط" field used to be admin-only:
// drag a file from the device, or click to browse, or paste a public URL —
// all three write to the same value. Used across ContentTab (item images),
// site identity (logo), and payment method icons.
export default function MediaUploadField({
  value,
  onChange,
  accept = 'image/*',
  label,
  hint,
  previewClassName = 'w-14 h-14 rounded-lg object-cover',
}: MediaUploadFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const isImage = accept.includes('image');

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    // Compress images down to a reasonable display size before storing —
    // an uncompressed phone-camera photo (often 5-10MB) blows past the
    // request size the sync endpoint can accept, so the "save" silently
    // gets stuck forever instead of ever reaching GitHub/Supabase/Firebase.
    // Non-image files (e.g. a video picked here by mistake) fall back to
    // the raw data URL — but see the ⚠️ hint below, video really belongs
    // in the dedicated Vercel Blob uploader, not embedded as base64 at all.
    const dataUrl = file.type.startsWith('image/') ? await compressImageFile(file) : await fileToDataUrl(file);
    onChange(dataUrl);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-white/60 text-xs">{label}</label>}
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
        {value && isImage && <img src={value} className={previewClassName} alt="" />}
        <div className="flex-1 text-center text-xs text-white/50">
          {dragOver ? 'سيب الملف هنا…' : 'اسحب ملف هنا، أو'}{' '}
          <label className="text-white underline cursor-pointer">
            اختر من الجهاز
            <input type="file" accept={accept} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        </div>
      </div>
      <input
        value={value?.startsWith('http') ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="أو الصق رابط عام (http/https)"
        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
      />
      {hint && <p className="text-[11px] text-white/40 leading-relaxed">{hint}</p>}
      {value?.startsWith('data:') && (
        <p className="text-[11px] text-amber-300/90 leading-relaxed">
          ⚠️ ده ملف مرفوع من جهازك وموجود جوه المتصفح بس — مش هيظهر كرابط عام (مثلاً جوه رسالة واتساب). لو محتاج
          يظهر بره الموقع، ارفعه على استضافة زي imgbb.com أو postimages.org والصق رابطه فوق.
        </p>
      )}
      {value?.startsWith('http') && <p className="text-[11px] text-emerald-300/80">✓ رابط عام.</p>}
    </div>
  );
}
