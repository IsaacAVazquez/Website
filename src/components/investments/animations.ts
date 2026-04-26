import type { Variants } from "framer-motion";

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

/**
 * Reduced-motion variants — keep elements fully visible from the start so
 * vestibular-sensitive users see no fade or stagger. Initial opacity is 1
 * to skip the fade-in entirely.
 */
export function getReducedMotionVariants() {
  return {
    containerVariants: {
      hidden: { opacity: 1 },
      visible: { opacity: 1, transition: { staggerChildren: 0 } },
    } as Variants,
    itemVariants: {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0, transition: { duration: 0 } },
    } as Variants,
    fadeInVariants: {
      hidden: { opacity: 1 },
      visible: { opacity: 1, transition: { duration: 0 } },
    } as Variants,
  };
}
