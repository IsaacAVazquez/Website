import { redirect } from "next/navigation";
import { normalizeFantasyRoutePosition } from "@/lib/fantasy";

interface PositionTierRedirectPageProps {
  params: Promise<{
    position: string;
  }>;
}

export default async function PositionTierRedirectPage({ params }: PositionTierRedirectPageProps) {
  const { position } = await params;
  const normalizedPosition = normalizeFantasyRoutePosition(position);
  redirect(`/fantasy-football?position=${normalizedPosition}&scoring=ppr`);
}
