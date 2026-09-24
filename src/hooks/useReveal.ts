import { useEffect, useRef } from 'react';

interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Reveal-on-scroll via IntersectionObserver (no scroll listeners, no per-frame
 * React state). Toggles data-visible on the element; the `.reveal` utility in
 * index.css does the transition and is forced visible under prefers-reduced-motion.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options: RevealOptions = {}) {
  const { threshold = 0.18, rootMargin = '0px 0px -8% 0px', once = true } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-visible', 'true');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.setAttribute('data-visible', 'false');
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}
