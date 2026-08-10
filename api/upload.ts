// Real Vercel serverless function — NOT decorative. This is what makes video
// upload actually work in production.
//
// Why this file has to exist at all: images are small enough to store as
// base64 data URLs inside the browser's IndexedDB (see src/lib/site.ts →
// fileToDataUrl), but video files are way too big for that — a 20MB clip
// would blow up localStorage/IndexedDB and can never be pasted into a
// WhatsApp message anyway. Real video hosting needs a real backend, so this
// route hands out short-lived, scoped upload tokens that let the browser
// upload the video FILE DIRECTLY to Vercel Blob storage (bypassing this
// function's own body-size limit entirely), then confirms the upload and
// hands back a public https:// URL your admin panel can save and your
// storefront can play with a plain <video> tag.
//
// Deployment requirement: this only works once the project is deployed to
// Vercel (or run locally with `vercel dev`) AND has Vercel Blob storage
// connected, which auto-provisions the BLOB_READ_WRITE_TOKEN env var. If
// you're just running `npm run dev` (plain Vite, no Vercel), this endpoint
// won't exist and the uploader in Settings will tell the admin that clearly
// instead of pretending to work.
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// Node.js serverless runtime (NOT edge): @vercel/blob's handleUpload relies
// on Node-only built-ins (stream/net/tls/http) that the Edge runtime can't
// bundle — using 'edge' here is what breaks the Vercel deployment.
export const config = {
  runtime: 'nodejs',
};

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-matroska', // .mkv
  'video/ogg',
];

// Up to 4GB per video — Vercel Blob's own ceiling for a single upload.
const MAX_VIDEO_BYTES = 4 * 1024 * 1024 * 1024;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        return {
          addRandomSuffix: true,
          allowedContentTypes: ALLOWED_VIDEO_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // The blob is now live at blob.url — nothing else to persist
        // server-side; the admin panel stores that URL in site settings the
        // moment the client-side upload() call resolves.
        console.log('Video uploaded to Vercel Blob:', blob.url);
      },
    });

    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
