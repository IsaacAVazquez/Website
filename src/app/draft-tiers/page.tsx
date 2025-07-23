import { Metadata } from "next";
import DraftTiersContent from "@/components/DraftTiersContent";

export const metadata: Metadata = {
  title: "Draft Tiers | Fantasy Football Rankings",
  description: "Interactive fantasy football draft tiers visualization. See player rankings grouped by tiers for optimal draft strategy.",
};

export default function DraftTiersPage() {
  return <DraftTiersContent />;
}