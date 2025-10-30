import React from "react";
import type { JSX } from "react";
import localFont from "next/font/local";
import { twMerge } from "tailwind-merge";

// Font files can be colocated inside of `app`
const CalSans = localFont({
  src: [{ path: "../../../fonts/CalSans-SemiBold.woff2" }],
  display: "swap",
});

export const Heading = ({
  className,
  children,
  as: Tag,
  level = 1,
}: {
  className?: string;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}) => {
  // Determine the semantic heading tag based on level prop
  const HeadingTag = Tag || (`h${level}` as keyof JSX.IntrinsicElements);
  
  // Fluid typography using CSS custom properties from globals.css
  const levelStyles = {
    1: "text-6xl font-bold", // h1 - largest, uses --text-6xl clamp()
    2: "text-5xl font-bold",  // h2 - large, uses --text-5xl clamp()
    3: "text-4xl font-semibold", // h3 - medium, uses --text-4xl clamp()
    4: "text-3xl font-semibold", // h4 - smaller, uses --text-3xl clamp()
    5: "text-2xl font-medium", // h5 - small, uses --text-2xl clamp()
    6: "text-xl font-medium", // h6 - smallest, uses --text-xl clamp()
  };

  return (
    <HeadingTag
      className={twMerge(
        CalSans.className,
        levelStyles[level],
        "bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-tight",
        className
      )}
    >
      {children}
    </HeadingTag>
  );
};
