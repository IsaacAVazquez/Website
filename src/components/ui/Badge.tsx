import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  children: React.ReactNode;
}

export function Badge({ variant = "secondary", className = "", children, ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";
  
  const variantClasses = {
    default: "bg-electric-blue text-slate-900",
    secondary: "bg-terminal-border text-slate-300 border border-terminal-border",
    destructive: "bg-error-red text-white",
    outline: "border border-electric-blue text-electric-blue",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}