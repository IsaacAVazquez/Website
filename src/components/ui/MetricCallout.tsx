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

  // Extract numeric value for animation
  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.-]/g, ''))
    : value;

  const hasNumericValue = !isNaN(numericValue);
  const prefix = typeof value === 'string' ? value.match(/^[^0-9]*/)?.[0] || '' : '';
  const suffix = typeof value === 'string' ? value.match(/[^0-9]*$/)?.[0] || '' : '';

  // Count-up animation
  useEffect(() => {
    if (!animateValue || !hasNumericValue || !isInView || shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const duration = 2000; // 2 seconds
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
      gradient: 'from-[#6B4F3D] to-[#4A3426]',
      bg: 'bg-[#FFF8F0] dark:bg-[#4A3426]/50',
      border: 'border-[#FFE4D6] dark:border-[#FF8E53]/30',
      text: 'text-[#FF6B35] dark:text-[#FF8E53]',
    },
    success: {
      gradient: 'from-[#6BCF7F] to-[#4CAF50]',
      bg: 'bg-[#6BCF7F]/10 dark:bg-[#6BCF7F]/20',
      border: 'border-[#6BCF7F]/30 dark:border-[#6BCF7F]/40',
      text: 'text-[#6BCF7F] dark:text-[#8FE39E]',
    },
    primary: {
      gradient: 'from-[#FF6B35] to-[#F7B32B]',
      bg: 'bg-gradient-to-br from-[#FF6B35]/10 to-[#F7B32B]/10 dark:from-[#FF8E53]/20 dark:to-[#FFC857]/20',
      border: 'border-[#FF6B35]/30 dark:border-[#FF8E53]/40',
      text: 'text-[#FF6B35] dark:text-[#FF8E53]',
    },
    warning: {
      gradient: 'from-[#FFB020] to-[#FF8E53]',
      bg: 'bg-[#FFB020]/10 dark:bg-[#FFB020]/20',
      border: 'border-[#FFB020]/30 dark:border-[#FFB020]/40',
      text: 'text-[#FFB020] dark:text-[#FFC857]',
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
        "hover:shadow-warm-lg hover:-translate-y-1",
        className
      )}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5",
        variantStyles.gradient
      )} />

      {/* Content */}
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
          "font-medium text-[#6B4F3D] dark:text-[#D4A88E] mb-1",
          sizeStyles.label
        )}>
          {label}
        </div>

        {improvement && (
          <motion.div
            className="text-xs text-[#6BCF7F] dark:text-[#8FE39E] font-medium mt-1 flex items-center gap-1"
            initial={{ opacity: 0, x: -10 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <span>↑</span>
            {improvement}
          </motion.div>
        )}
      </div>

      {/* Shine effect on hover */}
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
