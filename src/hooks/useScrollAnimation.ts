"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface ScrollAnimationOptions {
  /** Threshold for when element should trigger (0-1) */
  threshold?: number;
  /** Root margin for IntersectionObserver */
  rootMargin?: string;
  /** Whether animation should trigger only once */
  triggerOnce?: boolean;
  /** Delay before triggering animation (ms) */
  delay?: number;
}

/**
 * useScrollAnimation Hook
 *
 * Provides scroll-triggered animations using IntersectionObserver API.
 * Automatically respects user's reduced motion preferences.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
 *
 *   return (
 *     <div
 *       ref={ref}
 *       className={isVisible ? 'fade-in-on-scroll is-visible' : 'fade-in-on-scroll'}
 *     >
 *       Content here
 *     </div>
 *   );
 * }
 * ```
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: ScrollAnimationOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = "0px",
    triggerOnce = true,
    delay = 0,
  } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // If user prefers reduced motion, make visible immediately
    if (shouldReduceMotion) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
          } else {
            setIsVisible(true);
          }

          // Disconnect if triggerOnce is true
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          // Reset visibility if not triggerOnce
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, delay, shouldReduceMotion]);

  return { ref, isVisible };
}

/**
 * useStaggeredScrollAnimation Hook
 *
 * Provides staggered animation for multiple child elements.
 * Each child will animate with a delay based on its index.
 *
 * @example
 * ```tsx
 * function ListComponent() {
 *   const items = ['Item 1', 'Item 2', 'Item 3'];
 *   const { containerRef, visibleIndices } = useStaggeredScrollAnimation(items.length);
 *
 *   return (
 *     <div ref={containerRef}>
 *       {items.map((item, index) => (
 *         <div
 *           key={index}
 *           className={`stagger-item ${
 *             visibleIndices.has(index) ? 'is-visible stagger-delay-' + (index % 5 + 1) : ''
 *           }`}
 *         >
 *           {item}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStaggeredScrollAnimation(
  itemCount: number,
  options: ScrollAnimationOptions & { staggerDelay?: number } = {}
) {
  const {
    threshold = 0.1,
    rootMargin = "0px",
    triggerOnce = true,
    staggerDelay = 100,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // If user prefers reduced motion, make all visible immediately
    if (shouldReduceMotion) {
      setVisibleIndices(new Set(Array.from({ length: itemCount }, (_, i) => i)));
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Trigger items sequentially with stagger delay
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleIndices((prev) => new Set([...prev, i]));
            }, i * staggerDelay);
          }

          // Disconnect if triggerOnce is true
          if (triggerOnce) {
            observer.unobserve(container);
          }
        } else if (!triggerOnce) {
          // Reset visibility if not triggerOnce
          setVisibleIndices(new Set());
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [itemCount, threshold, rootMargin, triggerOnce, staggerDelay, shouldReduceMotion]);

  return { containerRef, visibleIndices };
}

/**
 * useParallaxScroll Hook
 *
 * Provides simple parallax effect based on scroll position.
 * Respects reduced motion preferences.
 *
 * @example
 * ```tsx
 * function ParallaxComponent() {
 *   const { ref, offset } = useParallaxScroll({ speed: 0.5 });
 *
 *   return (
 *     <div
 *       ref={ref}
 *       style={{ transform: `translateY(${offset}px)` }}
 *     >
 *       Parallax content
 *     </div>
 *   );
 * }
 * ```
 */
export function useParallaxScroll(options: { speed?: number } = {}) {
  const { speed = 0.5 } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Disable parallax if user prefers reduced motion
    if (shouldReduceMotion) {
      setOffset(0);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const elementTop = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      // Calculate parallax offset
      const scrolled = windowHeight - elementTop;
      const parallaxOffset = scrolled * speed;

      setOffset(parallaxOffset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [speed, shouldReduceMotion]);

  return { ref, offset };
}
