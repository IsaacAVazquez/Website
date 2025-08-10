export const isMobile = () => {
  if (typeof window === "undefined") return false;
  const width = window.innerWidth;
  return width < 768; // Match Tailwind's md: breakpoint (768px)
};
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
