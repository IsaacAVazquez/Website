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
  
  // Responsive sizing based on heading level for better hierarchy
  const levelStyles = {
    1: "text-2xl md:text-4xl lg:text-6xl font-bold", // h1 - largest
    2: "text-xl md:text-3xl lg:text-5xl font-bold",  // h2 - large  
    3: "text-lg md:text-2xl lg:text-4xl font-semibold", // h3 - medium
    4: "text-base md:text-xl lg:text-3xl font-semibold", // h4 - smaller
    5: "text-sm md:text-lg lg:text-2xl font-medium", // h5 - small
    6: "text-xs md:text-base lg:text-xl font-medium", // h6 - smallest
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
