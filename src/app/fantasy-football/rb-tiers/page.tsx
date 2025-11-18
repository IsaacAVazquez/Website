import { Metadata } from 'next';
import RBTiersChartPage from './rb-tiers-client';

export const metadata: Metadata = {
  title: 'RB Tier Rankings | Fantasy Football',
  description: 'Weekly running back tier rankings scatter plot. Visualize RB tiers by average expert rank vs consensus rank with color-coded tier groupings.',
  openGraph: {
    title: 'RB Tier Rankings | Fantasy Football',
    description: 'Weekly running back tier rankings scatter plot',
    type: 'website',
  }
};

export default function RBTiersPage() {
  return <RBTiersChartPage />;
}
