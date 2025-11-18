import { Metadata } from 'next';
import AllTiersClient from './all-tiers-client';

export const metadata: Metadata = {
  title: 'All Position Tier Rankings | Fantasy Football',
  description: 'View tier rankings for all fantasy football positions: QB, RB, WR, TE, K, DST. Interactive scatter plots with live data indicators showing expert consensus rankings.',
  openGraph: {
    title: 'All Position Tier Rankings | Fantasy Football',
    description: 'Complete fantasy football tier rankings for all positions',
    type: 'website',
  }
};

export default function AllTiersPage() {
  return <AllTiersClient />;
}
