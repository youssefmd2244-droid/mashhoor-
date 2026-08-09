import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

export function getLenis() {
  return lenisInstance;
}

export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      // IMPORTANT for mobile: let touch scroll natively instead of Lenis
      // simulating it. Simulated touch scrolling is what causes the
      // "scroll freezes / touch hangs" feeling on phones.
      syncTouch: false,
      touchMultiplier: 1,
      infinite: false,
    });

    lenisInstance = lenis;

    // THE FIX: previously Lenis ran its own separate requestAnimationFrame
    // loop while GSAP ScrollTrigger listened to the native scroll event on
    // its own ticker. Those two loops drift apart frame by frame, and any
    // pinned/scrubbed ScrollTrigger animation would stutter or appear to
    // freeze because it kept reading a stale scroll position. Driving both
    // from the SAME ticker (GSAP's) keeps them perfectly in sync.
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisInstance = null;
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);
}
