import { generateLocalBusinessIndex } from '@/lib/localSitemap';

export async function GET() {
  const businessIndex = generateLocalBusinessIndex();

  return new Response(JSON.stringify(businessIndex, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}