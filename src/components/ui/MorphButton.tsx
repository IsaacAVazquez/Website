"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface MorphButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

export const MorphButton = forwardRef<HTMLButtonElement, MorphButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = "morph-button relative overflow-hidden font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-gradient-to-r from-electric-blue to-cyber-teal text-white focus:ring-electric-blue",
      secondary: "bg-gradient-to-r from-neon-purple to-vivid-pink text-white focus:ring-neon-purple",
      outline: "bg-transparent border-2 border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-white focus:ring-electric-blue",
      ghost: "bg-transparent text-electric-blue hover:bg-electric-blue/10 focus:ring-electric-blue",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-6 py-3 text-base rounded-xl",
      lg: "px-8 py-4 text-lg rounded-2xl",
    };

    return (
      <motion.button
        ref={ref}
        className={twMerge(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        aria-label={loading ? "Loading..." : undefined}
        whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
        whileTap={!disabled ? { scale: 0.98, y: 1 } : undefined}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        {...props}
      >
        {/* Background overlay for hover effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyber-teal to-neon-purple opacity-0 transition-opacity duration-300"
          whileHover={{ opacity: variant === "primary" ? 1 : 0 }}
        />

        {/* Content container */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <>
              {icon && iconPosition === "left" && (
                <motion.span
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {icon}
                </motion.span>
              )}
              
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {children}
              </motion.span>

              {icon && iconPosition === "right" && (
                <motion.span
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {icon}
                </motion.span>
              )}
            </>
          )}
        </span>

        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-inherit"
          whileTap={{
            background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    );
  }
);

MorphButton.displayName = "MorphButton";