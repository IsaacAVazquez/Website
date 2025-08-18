import { generateLocalSitemapXML } from '@/lib/localSitemap';

export async function GET() {
  const sitemap = generateLocalSitemapXML();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}