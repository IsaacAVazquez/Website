import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Class names joined, with later Tailwind utilities overriding earlier ones.
 * It has its own module because tailwind-merge is 8 KB gzip and `utils.ts` is
 * imported by routes that only want `clamp`, `slugify`, or `relativeAge`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
