import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /blog to /writing
  if (pathname === '/blog') {
    return NextResponse.redirect(new URL('/writing', request.url));
  }

  // Redirect /blog/[slug] to /writing/[slug]
  if (pathname.startsWith('/blog/')) {
    const slug = pathname.replace('/blog/', '');
    return NextResponse.redirect(new URL(`/writing/${slug}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/blog/:path*']
};