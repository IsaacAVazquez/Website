import type { Variants } from "framer-motion";

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

/**
 * Reduced-motion variants keep the same initial SSR styles as the default
 * variants, then resolve instantly on the client to avoid hydration drift.
 */
export function getReducedMotionVariants() {
  return {
    fadeInVariants: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
    } as Variants,
  };
}
