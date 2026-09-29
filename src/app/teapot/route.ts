/**
 * An easter egg for anyone who tries the address. It is a route handler, so
 * it never reaches the sitemap, which walks `page.tsx` files only.
 */
const BODY = `418 I'm a teapot

This address is a teapot, so it can't brew coffee. The status code comes from
RFC 2324, which was published as an April Fools' joke in 1998.
`;

export function GET() {
  return new Response(BODY, {
    status: 418,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
