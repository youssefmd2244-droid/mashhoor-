// Real video upload — the browser streams the file straight to Vercel Blob
// storage (not through our own server, and definitely not as a base64 data
// URL crammed into IndexedDB the way images are). See api/upload.ts for the
// server half of this (it only ever hands out a short-lived upload token; it
// never touches the video bytes themselves).
import { upload } from '@vercel/blob/client';

export interface VideoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// True once we know for sure the /api/upload endpoint exists (i.e. this
// build is actually running on Vercel with Blob storage connected). We only
// find out by trying — there's no way to detect it upfront — so the field
// starts undefined ("unknown yet") and flips to true/false after the first
// attempt.
let apiAvailable: boolean | undefined;

export function isVideoUploadKnownUnavailable(): boolean {
  return apiAvailable === false;
}

export async function uploadVideo(
  file: File,
  onProgress?: (p: VideoUploadProgress) => void
): Promise<string> {
  try {
    const blob = await upload(`videos/${Date.now()}-${file.name}`, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      onUploadProgress: (p) => {
        onProgress?.({ loaded: p.loaded, total: p.total, percentage: p.percentage });
      },
    });
    apiAvailable = true;
    return blob.url;
  } catch (err) {
    // A 404 on /api/upload means this build isn't deployed on Vercel (or
    // Blob storage isn't connected to the project yet) — tell the admin the
    // real reason instead of a generic error.
    const message = (err as Error)?.message || '';
    if (message.includes('404') || message.includes('Failed to fetch')) {
      apiAvailable = false;
      throw new Error(
        'رفع الفيديو محتاج الموقع يكون شغال على Vercel مع تفعيل Vercel Blob Storage. ادخل على مشروعك في Vercel → Storage → Create Database → Blob، وبعد ما تربطه هيشتغل الرفع من هنا مباشرة.'
      );
    }
    throw new Error('فشل رفع الفيديو: ' + message);
  }
}
