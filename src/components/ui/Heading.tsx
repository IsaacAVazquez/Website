import React from "react";
import type { JSX } from "react";
import { twMerge } from "tailwind-merge";

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
  const HeadingTag = Tag || (`h${level}` as keyof JSX.IntrinsicElements);

  const levelStyles = {
    1: "text-5xl sm:text-6xl font-bold tracking-tight",
    2: "text-4xl sm:text-5xl font-bold tracking-tight",
    3: "text-3xl sm:text-4xl font-semibold tracking-tight",
    4: "text-2xl sm:text-3xl font-semibold",
    5: "text-xl sm:text-2xl font-medium",
    6: "text-lg sm:text-xl font-medium",
  };

  return (
    <HeadingTag
      className={twMerge(
        levelStyles[level],
        "text-[var(--text-primary)] leading-tight",
        className
      )}
    >
      {children}
    </HeadingTag>
  );
};
