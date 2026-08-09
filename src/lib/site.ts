import { getSetting, setSetting } from './store';

export interface SiteIdentity {
  nameAr: string;
  nameEn: string;
  logo?: string; // data URL or remote URL
  introVideo?: string; // public https:// URL from Vercel Blob storage — shown in the Hero section
  nameColor?: string; // hex font color override for the site name wherever it's shown as text
}

const KEY = 'settings.siteIdentity';

export async function getSiteIdentity(): Promise<SiteIdentity> {
  return getSetting<SiteIdentity>(KEY, { nameAr: 'مشهور', nameEn: 'Mashhoor' });
}

export async function setSiteIdentity(v: SiteIdentity): Promise<void> {
  await setSetting(KEY, v);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Resizes an image file down to a tiny square thumbnail (default 64×64) and
// returns it as a compressed JPEG data URL. Used for the "الإضافات" extras
// icons, which are meant to be small badges next to a name/price — not full
// photos — so we actually shrink the pixels down at upload time instead of
// just applying a small CSS size to a full-resolution image.
export function resizeImageToThumbnail(file: File, maxSize = 64, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Resizes+compresses a photo down to a reasonable "display" size (default
// max edge 1400px, JPEG quality 0.82) instead of storing the raw phone-camera
// original (often 8-12MB) as a data URL. This is what makes bulk-uploading
// dozens/hundreds of product photos stay fast: a typical 4000×3000 photo
// shrinks from ~6MB to ~150-300KB, so IndexedDB writes and gallery scrolling
// both stay smooth even with 100 items on screen. PNGs with transparency are
// kept as PNG; everything else is re-encoded as JPEG.
export function compressImageFile(file: File, maxEdge = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const wantsPng = file.type === 'image/png' && /\.png$/i.test(file.name);
        resolve(wantsPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Yields control back to the browser between chunks of heavy work (image
// compression, IndexedDB writes) so a bulk operation over many files never
// blocks the main thread long enough to freeze the tab ("تهنيج").
export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void) => void);
    if (ric) ric(() => resolve());
    else setTimeout(resolve, 0);
  });
}
