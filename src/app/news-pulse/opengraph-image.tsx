import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "News Pulse Dashboard";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Media Analytics",
    title: "News Pulse Dashboard",
    description:
      "A dashboard for comparing how major outlets frame the same story across feeds, topics, and tone.",
    accent: "cobalt",
    footer: "isaacavazquez.com/news-pulse",
  });
}
