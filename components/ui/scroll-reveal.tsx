"use client";

import { useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * Adds the "in" class only once (default) so content doesn't pop when scrolling back up.
   */
  once?: boolean;
  /**
   * IntersectionObserver threshold.
   */
  threshold?: number;
  /**
   * IntersectionObserver rootMargin (e.g. "0px 0px -10% 0px").
   */
  rootMargin?: string;
  /**
   * Optional stagger without inline styles elsewhere.
   * Example: 80 => "[transition-delay:80ms]"
   */
  delayMs?: number;
};

export function ScrollReveal({
  children,
  className,
  once = true,
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
  delayMs,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion: show immediately.
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return (
    <div
      ref={ref}
      className={[
        "ff-reveal",
        isInView ? "ff-reveal--in" : "",
        delayMs ? `[transition-delay:${delayMs}ms]` : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

