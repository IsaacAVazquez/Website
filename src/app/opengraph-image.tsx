import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";

export const alt = "Isaac Vazquez, Berkeley Haas MBA candidate, Class of 2027";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return createEditorialOgImage({
    eyebrow: "Product and analytics",
    title: "I'm a second-year MBA at Berkeley Haas, moving into product.",
    description:
      "Before Haas I spent six years in campaign data and QA, and in summer 2026 I was the MBA growth intern at Juno.",
  });
}
