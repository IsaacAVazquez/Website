"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MetricCalloutProps {
  value: string | number;
  label: string;
  improvement?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'primary' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  animateValue?: boolean;
  className?: string;
}

/**
 * MetricCallout - Highlighted metric display with count-up animation
 *
 * Features:
 * - Count-up animation for numeric values
 * - Multiple color variants for different metric types
 * - Responsive sizing
 * - Intersection observer for triggering animations
 * - Respects reduced motion preferences
 */
export function MetricCallout({
  value,
  label,
  improvement,
  icon,
  variant = 'default',
  size = 'md',
  animateValue = true,
  className,
}: MetricCalloutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<string | number>(animateValue ? 0 : value);

  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.-]/g, ''))
    : value;

  const hasNumericValue = !isNaN(numericValue);
  const prefix = typeof value === 'string' ? value.match(/^[^0-9]*/)?.[0] || '' : '';
  const suffix = typeof value === 'string' ? value.match(/[^0-9]*$/)?.[0] || '' : '';

  useEffect(() => {
    if (!animateValue || !hasNumericValue || !isInView || shouldReduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Skip animation and snap to final value when conditions disqualify the animation
      setDisplayValue(value);
      return;
    }

    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        const currentValue = Math.floor(increment * currentStep);
        setDisplayValue(`${prefix}${currentValue}${suffix}`);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [animateValue, hasNumericValue, isInView, numericValue, prefix, suffix, value, shouldReduceMotion]);

  const variants = {
    default: {
      gradient: 'from-[var(--home-ink-muted)] to-[var(--home-ink-muted)]',
      bg: 'bg-[var(--home-paper-alt)]',
      border: 'border-[var(--home-rule)]',
      text: 'text-[var(--home-haze)]',
    },
    success: {
      gradient: 'from-[var(--color-success)] to-[var(--color-success)]',
      bg: 'bg-[var(--color-success)]/10',
      border: 'border-[var(--color-success)]/30',
      text: 'text-[var(--color-success)]',
    },
    primary: {
      gradient: 'from-[var(--home-haze)] to-[var(--color-warning)]',
      bg: 'bg-gradient-to-br from-[var(--home-haze)]/10 to-[var(--color-warning)]/10',
      border: 'border-[var(--home-haze)]/30',
      text: 'text-[var(--home-haze)]',
    },
    warning: {
      gradient: 'from-[var(--color-warning)] to-[var(--home-haze)]',
      bg: 'bg-[var(--color-warning)]/10',
      border: 'border-[var(--color-warning)]/30',
      text: 'text-[var(--color-warning)]',
    },
  };

  const sizes = {
    sm: {
      value: 'text-2xl',
      label: 'text-xs',
      padding: 'p-3',
    },
    md: {
      value: 'text-3xl md:text-4xl',
      label: 'text-sm',
      padding: 'p-4',
    },
    lg: {
      value: 'text-4xl md:text-5xl',
      label: 'text-base',
      padding: 'p-6',
    },
  };

  const variantStyles = variants[variant];
  const sizeStyles = sizes[size];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
        ease: "easeOut"
      }}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 transition-all duration-300",
        variantStyles.bg,
        variantStyles.border,
        sizeStyles.padding,
        "hover:shadow-[var(--shadow-lg)] hover:-translate-y-1",
        className
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5",
        variantStyles.gradient
      )} />

      <div className="relative z-10 flex flex-col items-start">
        {icon && (
          <div className={cn("mb-2", variantStyles.text)}>
            {icon}
          </div>
        )}

        <motion.div
          className={cn(
            "font-bold mb-1 tabular-nums",
            sizeStyles.value,
            variantStyles.text
          )}
          animate={isInView && !shouldReduceMotion ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: "easeInOut"
          }}
        >
          {displayValue}
        </motion.div>

        <div className={cn(
          "font-medium text-[var(--home-ink-muted)] mb-1",
          sizeStyles.label
        )}>
          {label}
        </div>

        {improvement && (
          <motion.div
            className="text-xs text-[var(--color-success)] font-medium mt-1 flex items-center gap-1"
            initial={{ opacity: 0, x: -10 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <span>↑</span>
            {improvement}
          </motion.div>
        )}
      </div>

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/**
 * MetricGrid - Container for displaying multiple metrics in a grid
 */
interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({ children, columns = 3, className }: MetricGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      'grid gap-4',
      gridCols[columns],
      className
    )}>
      {children}
    </div>
  );
}
