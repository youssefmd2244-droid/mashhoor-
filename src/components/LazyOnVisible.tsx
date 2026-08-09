import { Suspense, lazy, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';

// Wraps a dynamic import() so the component's JS chunk (and everything it
// pulls in — three.js, an external HDRI fetch, whatever) is only requested
// once the wrapper is about to scroll into view, instead of being part of
// the initial bundle every visitor has to download before the page can
// render at all.
//
// Usage:
//   const LazyPastaSection = lazyOnVisible(() => import('../sections/PastaSection'), {
//     fallback: <div style={{ minHeight: '100vh' }} />,
//   });
//   ...
//   <LazyPastaSection />
export function lazyOnVisible<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: { rootMargin?: string; fallback?: ReactNode }
) {
  const LazyComponent = lazy(importFn);
  const rootMargin = options?.rootMargin ?? '800px'; // start fetching well before it's actually on screen
  const fallback = options?.fallback ?? null;

  return function LazyOnVisibleWrapper(props: P) {
    const ref = useRef<HTMLDivElement>(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el || shouldLoad) return;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            io.disconnect();
          }
        },
        { rootMargin }
      );
      io.observe(el);
      return () => io.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!shouldLoad) {
      return <div ref={ref}>{fallback}</div>;
    }

    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...(props as P)} />
      </Suspense>
    );
  };
}
