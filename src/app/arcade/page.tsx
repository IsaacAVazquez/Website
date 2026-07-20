import { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata } from "@/lib/seo";
import ArcadeClient from "./ArcadeClient";

// Characterful display/terminal faces, scoped to this route only. They are
// wired to the local CSS-module variables (--font-arcade-*) and never touch
// the site-wide font stack.
const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-arcade-display",
  display: "swap",
  preload: false,
});

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-arcade-body",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = constructMetadata({
  title: "Reactor Arcade | Isaac Vazquez",
  description:
    "Reactor is a neon synthwave reflex arcade game inside Isaac Vazquez's portfolio, a deliberate style experiment where you light the live cell, dodge the decoys, and keep the combo alive.",
  canonicalUrl: "https://isaacavazquez.com/arcade",
  dateModified: "2026-07-16",
});

export default function ArcadePage() {
  return (
    <>
      <StructuredData
        type="WebPage"
        data={{
          title: "Reactor Arcade",
          description:
            "Reactor is a neon reflex game inside Isaac Vazquez's portfolio, built as a deliberate visual and interaction experiment.",
          url: "https://isaacavazquez.com/arcade",
          dateModified: "2026-07-16",
        }}
      />
      <div className={`${pressStart.variable} ${vt323.variable}`}>
        <ArcadeClient />
      </div>
    </>
  );
}
