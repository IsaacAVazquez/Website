import React from "react";

// BEFORE
// export function Container({ children }: { children: React.ReactNode }) {

// AFTER
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`max-w-4xl mx-auto w-full px-4 sm:px-8 ${className}`}>
      {children}
    </main>
  );
}
