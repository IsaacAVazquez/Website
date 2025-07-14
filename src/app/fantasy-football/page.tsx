import { constructMetadata } from "@/lib/seo";
import FantasyFootballClient from "./fantasy-football-client";

export const metadata = constructMetadata({
  title: "Fantasy Football Tier Rankings",
  description: "Interactive fantasy football tier rankings using data visualization and clustering algorithms. View player tiers, expert consensus rankings, and make informed draft decisions.",
  canonicalUrl: "/fantasy-football",
});

export default function FantasyFootballPage() {
  return <FantasyFootballClient />;
}