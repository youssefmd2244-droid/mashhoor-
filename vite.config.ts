import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
//
// NOTE: we deliberately do NOT use vite-plugin-singlefile anymore.
// Inlining everything (JS, CSS) into one giant index.html meant:
//   - the browser had to download + parse the ENTIRE app (three.js,
//     framer-motion, gsap, all sections) before anything could render —
//     no code-splitting, no lazy loading.
//   - nothing was individually cacheable — a one-word content change
//     invalidated the whole file, so repeat visits re-downloaded
//     everything instead of just the changed piece.
// Netlify/Vercel/any normal static host serve a folder of files just
// fine, so there's no deployment reason to keep it single-file — and
// splitting it up is the single biggest lever for real speed. Heavy,
// below-the-fold pieces (the 3D pasta section, the 3D logo) are now
// lazy-loaded (see LazyOnVisible / React.lazy usages) so their JS only
// downloads when the visitor is actually about to see them.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Group the heaviest, rarely-changing vendor libraries into their
        // own long-term-cacheable chunks instead of one big vendor blob —
        // so a code change to the app doesn't force re-downloading three.js.
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          motion: ["framer-motion", "gsap"],
        },
      },
    },
  },
});
