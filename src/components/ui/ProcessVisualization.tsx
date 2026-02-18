"use client";

import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconArrowRight, IconCheck } from '@tabler/icons-react';

interface ProcessStep {
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
}

interface ProcessVisualizationProps {
  steps: ProcessStep[];
  layout?: 'horizontal' | 'vertical';
  variant?: 'timeline' | 'cards' | 'connected';
  className?: string;
}

/**
 * ProcessVisualization - Visualize PM process and decision-making flow
 *
 * Features:
 * - Multiple layout options (horizontal/vertical)
 * - Timeline, card, or connected variants
 * - Staggered animations for each step
 * - Responsive design
 * - Respects reduced motion preferences
 */
export function ProcessVisualization({
  steps,
  layout = 'horizontal',
  variant = 'connected',
  className,
}: ProcessVisualizationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  if (variant === 'timeline') {
    return <TimelineProcess steps={steps} layout={layout} className={className} />;
  }

  if (variant === 'cards') {
    return <CardProcess steps={steps} layout={layout} className={className} />;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative',
        layout === 'horizontal' ? 'flex flex-col md:flex-row gap-4 items-center' : 'flex flex-col gap-4',
        className
      )}
    >
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : index * 0.15,
              ease: "easeOut"
            }}
            className={cn(
              'relative flex-1 p-6 bg-white dark:bg-[var(--neutral-900)] rounded-xl border-2 border-[var(--border-primary)] shadow-lg',
              'hover:-translate-y-1 transition-transform duration-300'
            )}
          >
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-warning)] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {index + 1}
            </div>

            {step.icon && (
              <div className="mb-4 text-[var(--color-primary)]">
                {step.icon}
              </div>
            )}

            <h4 className="font-bold text-lg text-[var(--text-primary)] mb-2">
              {step.title}
            </h4>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {step.description}
            </p>
          </motion.div>

          {index < steps.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.3,
                delay: shouldReduceMotion ? 0 : index * 0.15 + 0.3,
              }}
              className={cn(
                'flex items-center justify-center text-[var(--color-primary)]',
                layout === 'horizontal' ? 'mx-2' : 'my-2 rotate-90'
              )}
            >
              <IconArrowRight className="w-8 h-8" />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Timeline variant - Vertical timeline with connecting line
 */
function TimelineProcess({ steps, className }: { steps: ProcessStep[]; layout?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn('relative pl-8', className)}>
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-warning)] to-[var(--color-primary)]" />

      <div className="space-y-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : index * 0.1,
            }}
            className="relative"
          >
            <div className="absolute -left-[35px] top-4 w-4 h-4 bg-white dark:bg-[var(--neutral-900)] border-4 border-[var(--color-primary)] rounded-full" />

            <div className="p-6 bg-white dark:bg-[var(--neutral-900)] rounded-xl border-2 border-[var(--border-primary)] shadow-lg">
              <div className="flex items-start gap-4">
                {step.icon && (
                  <div className="text-[var(--color-primary)] flex-shrink-0">
                    {step.icon}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-[var(--text-primary)] mb-2">
                    {step.title}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card variant - Grid of cards without connectors
 */
function CardProcess({ steps, className }: { steps: ProcessStep[]; layout?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            delay: shouldReduceMotion ? 0 : index * 0.1,
          }}
          className="relative p-6 bg-white dark:bg-[var(--neutral-900)] rounded-xl border-2 border-[var(--border-primary)] shadow-lg hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-warning)] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {index + 1}
          </div>

          {step.icon && (
            <div className="mb-4 text-[var(--color-primary)]">
              {step.icon}
            </div>
          )}

          <h4 className="font-bold text-lg text-[var(--text-primary)] mb-2 pr-10">
            {step.title}
          </h4>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {step.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * DecisionFramework - Visualize PM decision-making frameworks
 */
interface DecisionOption {
  option: string;
  pros: string[];
  cons: string[];
  chosen?: boolean;
}

interface DecisionFrameworkProps {
  title: string;
  options: DecisionOption[];
  className?: string;
}

export function DecisionFramework({ title, options, className }: DecisionFrameworkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn('space-y-4', className)}>
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : index * 0.1,
            }}
            className={cn(
              'relative p-6 rounded-xl border-2 shadow-lg',
              option.chosen
                ? 'bg-gradient-to-br from-[var(--color-success)]/10 to-[var(--color-success)]/5 border-[var(--color-success)]'
                : 'bg-white dark:bg-[var(--neutral-900)] border-[var(--border-primary)]'
            )}
          >
            {option.chosen && (
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-[var(--color-success)] rounded-full flex items-center justify-center text-white shadow-lg">
                <IconCheck className="w-6 h-6" />
              </div>
            )}

            <h4 className="font-bold text-lg text-[var(--text-primary)] mb-4">
              {option.option}
            </h4>

            <div className="mb-4">
              <p className="text-sm font-semibold text-[var(--color-success)] mb-2">Pros:</p>
              <ul className="space-y-1">
                {option.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--color-success)] mt-0.5">+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)] mb-2">Cons:</p>
              <ul className="space-y-1">
                {option.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--color-primary)] mt-0.5">−</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
