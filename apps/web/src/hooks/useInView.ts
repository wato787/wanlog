import { useEffect, useRef, useState } from "react";

/**
 * 要素がビューポートに入ったら true になる ref。
 * TanStack Query の無限スクロール例（useInView + fetchNextPage）と同じ用途。
 */
export function useInView(opts?: { rootMargin?: string; threshold?: number }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      {
        rootMargin: opts?.rootMargin ?? "100px",
        threshold: opts?.threshold ?? 0,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [opts?.rootMargin, opts?.threshold]);

  return { ref, inView };
}
