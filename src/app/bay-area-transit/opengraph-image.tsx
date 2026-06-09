import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
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
      "BART dashboard for Bay Area lines, station departure boards, and service alerts from a checked-in transit snapshot.",
    accent: "teal",
    footer: "isaacavazquez.com/bay-area-transit",
  });
}
