import { useState, type DragEvent } from 'react';
import { uploadVideo } from '../../lib/videoUpload';

interface VideoUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}

// Real video uploader: the file goes straight to Vercel Blob storage (see
// src/lib/videoUpload.ts + api/upload.ts) and this field only ever stores
// the resulting public https:// URL — never the raw file itself, so it works
// fine even for large clips.
export default function VideoUploadField({ value, onChange, label, hint }: VideoUploadFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('الملف ده مش فيديو');
      return;
    }
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadVideo(file, (p) => setProgress(p.percentage));
      onChange(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-white/60 text-xs">{label}</label>}

      {value && (
        <video src={value} controls className="w-full max-h-48 rounded-lg bg-black" />
      )}

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
          {uploading ? (
            <span>جاري الرفع… {progress}%</span>
          ) : dragOver ? (
            'سيب الفيديو هنا…'
          ) : (
            <>
              اسحب فيديو هنا، أو{' '}
              <label className="text-white underline cursor-pointer">
                اختر من الجهاز
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {uploading && (
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {value && (
        <button onClick={() => onChange('')} className="text-red-400 text-xs underline">
          شيل الفيديو
        </button>
      )}

      {error && <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>}
      {hint && <p className="text-[11px] text-white/40 leading-relaxed">{hint}</p>}
    </div>
  );
}
