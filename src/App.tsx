import { useLenis } from './hooks/useLenis';
import { useDirection } from './hooks/useDirection';
import { useEffect } from 'react';
import Navigation from './components/Navigation';
import Loader from './components/Loader';
import Cursor from './components/Cursor';
import ProgressIndicator from './components/ProgressIndicator';
import HeroSection from './sections/HeroSection';
import PollSection from './sections/PollSection';
import MenuSection from './sections/MenuSection';
import SignatureSection from './sections/SignatureSection';
import FastFoodSection from './sections/FastFoodSection';
import PosterSection from './sections/PosterSection';
import AppSection from './sections/AppSection';
import StorySection from './sections/StorySection';
import FlyerSection from './sections/FlyerSection';
import Footer from './sections/Footer';
import SettingsPanel from './components/admin/SettingsPanel';
import { CustomerGateModal, GroupOrderBar, CartDrawer, OrderConfirmationModal } from './components/ordering/OrderingWidgets';
import { getColorOverrides, applyColorOverrides } from './lib/colors';
import { getDisplayMode, applyDisplayMode } from './lib/displayMode';
import { getSiteFont, applySiteFont } from './lib/siteTexts';
import { lazyOnVisible } from './components/LazyOnVisible';
import { startRealtimeSync } from './lib/realtimeSync';
import { seedInitialContent } from './lib/seed';

// PastaSection is the heaviest piece of the app — it's the only section
// besides the logo that pulls in three.js/@react-three, and it also fetches
// an HDRI environment map from an external CDN at runtime. Loading its JS
// chunk only when it's about to scroll into view (instead of upfront with
// everything else) keeps the initial page load light. The fallback keeps
// roughly the same height so the page doesn't jump when it swaps in.
const PastaSection = lazyOnVisible(() => import('./sections/PastaSection'), {
  fallback: <div style={{ minHeight: '100vh' }} />,
});

export default function App() {
  useLenis();
  const { dir } = useDirection();

  // Apply any saved color overrides (Settings → Colors) as soon as the app boots.
  useEffect(() => {
    getColorOverrides().then(applyColorOverrides);
  }, []);

  // Apply the saved display mode (نهاري / راحة العين / دارك / أبيض وأسود).
  useEffect(() => {
    getDisplayMode().then(applyDisplayMode);
  }, []);

  // Apply the saved site-wide font choice (Settings → النصوص والخطوط).
  useEffect(() => {
    getSiteFont().then(applySiteFont);
  }, []);

  // First-run only: writes the starting menu/offers/poll/fast-food/signature
  // content as real saved items in Settings (see src/lib/seed.ts) — never
  // touches a store the admin has already added real items to, and never
  // runs again once it has (tracked by a settings flag).
  useEffect(() => {
    seedInitialContent();
  }, []);

  // Start listening for cloud realtime changes (if a cloud provider is
  // configured in Settings → Storage). This is what makes edits made
  // elsewhere show up here instantly with no refresh — see
  // src/lib/realtimeSync.ts and src/lib/storageAdapters.ts.
  useEffect(() => {
    startRealtimeSync();
  }, []);

  // Update document direction globally
  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', dir === 'rtl' ? 'ar' : 'en');
  }, [dir]);

  // Refresh ScrollTrigger after window load
  useEffect(() => {
    const onLoad = () => {
      // Dispatch a custom event so GSAP ScrollTriggers refresh
      window.dispatchEvent(new Event('resize'));
    };
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      <Loader />
      <Cursor />
      <Navigation />
      <ProgressIndicator />

      <main>
        <HeroSection />
        <PollSection />
        <MenuSection />
        <SignatureSection />
        <PastaSection />
        <FastFoodSection />
        <PosterSection />
        <AppSection />
        <StorySection />
        <FlyerSection />
        <Footer />
      </main>

      <SettingsPanel />
      <CustomerGateModal />
      <OrderConfirmationModal />
      <GroupOrderBar />
      <CartDrawer />
    </div>
  );
}
