"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, useRef, useEffect } from "react";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  elevation?: 1 | 2 | 3 | 4 | 5;
  interactive?: boolean;
  floating?: boolean;
  cursorGlow?: boolean;
  noiseTexture?: boolean;
  /** 2025: Performance optimization for offscreen content */
  offscreen?: boolean;
  /** 2025: Container query support */
  containerQuery?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      elevation = 2,
      interactive = false,
      floating = false,
      cursorGlow = false,
      noiseTexture = false,
      offscreen = false,
      containerQuery = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (cardRef.current && cursorGlow) {
          const rect = cardRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;

          // Set CSS custom properties for cursor position
          cardRef.current.style.setProperty('--cursor-x', `${x}%`);
          cardRef.current.style.setProperty('--cursor-y', `${y}%`);
        }
      };

      const card = cardRef.current;
      if (card && cursorGlow) {
        card.addEventListener('mousemove', handleMouseMove);
        return () => card.removeEventListener('mousemove', handleMouseMove);
      }
    }, [cursorGlow]);

    const baseClasses = "glass-card";
    const elevationClass = `elevation-${elevation}`;
    const conditionalClasses = twMerge(
      interactive && "glass-interactive",
      floating && "floating",
      cursorGlow && "cursor-glow",
      noiseTexture && "noise-texture",
      offscreen && "offscreen-content",  // 2025: Performance
      containerQuery && "container"       // 2025: Container queries
    );

    return (
      <motion.div
        ref={ref || cardRef}
        className={twMerge(
          baseClasses,
          elevationClass,
          conditionalClasses,
          className
        )}
        role={interactive ? "button" : "region"}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? "Interactive card" : undefined}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        whileHover={
          interactive
            ? {
                scale: 1.02,
                y: -4,
                transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
              }
            : undefined
        }
        whileTap={
          interactive
            ? { scale: 0.98, y: 2 }
            : undefined
        }
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // Trigger a click on the element itself
                  e.currentTarget.click();
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";