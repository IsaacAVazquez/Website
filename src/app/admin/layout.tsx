import { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo';
import { AdminProviders } from './AdminProviders';

const adminMetadata = constructMetadata({
  title: 'Admin',
  description: 'Private controls for Isaac Vazquez site data and publishing workflows.',
  canonicalUrl: '/admin',
  dateModified: '2026-07-23',
  noIndex: true,
});

export const metadata: Metadata = {
  ...adminMetadata,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminProviders>{children}</AdminProviders>;
}
