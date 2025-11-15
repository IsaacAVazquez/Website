import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  size = "sm",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B35]";

  const variantClasses = {
    default: "bg-[#FF6B35]/20 text-[#FF6B35] dark:text-[#FF8E53] border border-[#FF6B35]/40 dark:border-[#FF8E53]/40",
    success: "bg-[#6BCF7F]/20 text-[#6BCF7F] border border-[#6BCF7F]/40",
    warning: "bg-[#F7B32B]/20 text-[#F7B32B] border border-[#F7B32B]/40",
    outline: "border border-[#FFE4D6] dark:border-[#FF8E53]/30 text-[#4A3426] dark:text-[#D4A88E]",
  };

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <div className={classes} tabIndex={0} {...props}>
      {children}
    </div>
  );
}