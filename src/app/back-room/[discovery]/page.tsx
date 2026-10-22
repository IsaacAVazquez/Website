import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PainterGallery } from "@/components/discoveries/PainterGallery";
import { RegistrationGame } from "@/components/discoveries/RegistrationGame";
import { RetroHome } from "@/components/discoveries/RetroHome";
import { SiteTransitMap } from "@/components/discoveries/SiteTransitMap";
import { VisitReceipt } from "@/components/discoveries/VisitReceipt";
import styles from "@/components/discoveries/discoveries.module.css";

const DISCOVERIES = {
  receipt: { title: "A Receipt for Your Visit", description: "Everything you looked at. Nothing to pay." },
  transit: { title: "The Site Transit Authority", description: "Three lines through the things I spend my time building. Pick a station and see where it goes." },
  gallery: { title: "The After-Hours Gallery", description: "The museum is closed, but the portraits are still here." },
  "1997": { title: "Greetings From 1997", description: "I seem to have misplaced the last few decades of web design." },
  registration: { title: "Mind the Registration", description: "The print came out wrong. You can probably fix it." },
};

type Discovery = keyof typeof DISCOVERIES;
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(DISCOVERIES).map((discovery) => ({ discovery })); }

async function getDiscovery(params: Promise<{ discovery: string }>) {
  const { discovery } = await params;
  if (!Object.hasOwn(DISCOVERIES, discovery)) notFound();
  return discovery as Discovery;
}

export async function generateMetadata({ params }: { params: Promise<{ discovery: string }> }): Promise<Metadata> {
  const discovery = await getDiscovery(params);
  return { title: DISCOVERIES[discovery].title, description: DISCOVERIES[discovery].description, robots: { index: false, follow: true } };
}

export default async function DiscoveryPage({ params }: { params: Promise<{ discovery: string }> }) {
  const discovery = await getDiscovery(params);
  const { title, description } = DISCOVERIES[discovery];
  return <section className={styles.page} data-c97-surface="paper">
    <div className="c97-shell">
      <header className={styles.intro}>
        <Link className={styles.back} href="/">Back to the front of the shop</Link>
        <p className="c97-kicker">You found the back room</p>
        <h1 className={styles.title}>{title}</h1><p className="c97-lead">{description}</p>
      </header>
      {discovery === "receipt" && <VisitReceipt />}
      {discovery === "transit" && <SiteTransitMap />}
      {discovery === "gallery" && <PainterGallery />}
      {discovery === "1997" && <RetroHome />}
      {discovery === "registration" && <RegistrationGame />}
    </div>
  </section>;
}
