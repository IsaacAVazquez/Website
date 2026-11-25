import { createEditorialOgImage } from "@/lib/og";

export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Bay Area Transit Pulse";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Civic Product",
    title: "Bay Area Transit Pulse",
    description:
      "BART dashboard for Bay Area lines, departure boards refreshed from BART, and service alerts.",
    accent: "teal",
    footer: "isaacvazquez.com/bay-area-transit",
  });
}
