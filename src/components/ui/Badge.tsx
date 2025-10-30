import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "electric" | "matrix";
  children: React.ReactNode;
}

export function Badge({ variant = "secondary", className = "", children, ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-blue";

  const variantClasses = {
    default: "bg-electric-blue text-slate-900",
    secondary: "bg-terminal-border text-slate-300 border border-terminal-border",
    destructive: "bg-error-red text-white",
    outline: "border border-electric-blue text-electric-blue",
    electric: "bg-electric-blue/20 text-electric-blue border border-electric-blue/40",
    matrix: "bg-matrix-green/20 text-matrix-green border border-matrix-green/40",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes} tabIndex={0} {...props}>
      {children}
    </div>
  );
}