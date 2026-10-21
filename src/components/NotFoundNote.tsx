"use client";
/* eslint-disable react-refresh/only-export-components -- co-located matcher is intentional */

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The 404 reads the address it failed on. A few addresses people type on
 * purpose, or that scanners try, get a line of their own under the lead. The
 * matching is on the pathname alone, lower-cased, so a query string or a
 * trailing slash changes nothing. Listed in docs/EASTER_EGGS.md.
 */

interface NotFoundNote {
  text: string;
  /** A way on, printed after the text as a link. */
  link?: { href: string; label: string };
}

const NOTES: ReadonlyArray<{ test: (path: string) => boolean; note: NotFoundNote }> = [
  {
    test: (path) => /^\/(coffee|cafe|espresso|latte)\/?$/.test(path),
    note: {
      text: "I can't brew coffee at this address either.",
      link: { href: "/teapot", label: "The teapot will tell you the same thing." },
    },
  },
  {
    test: (path) =>
      /\.php$/.test(path) || /^\/(wp-|admin|administrator|login|signin|xmlrpc)/.test(path),
    note: {
      text: "There's no back room to log in to. The site is printed ahead of time and nobody is at the desk.",
    },
  },
  {
    test: (path) => /^\/dashboard\/?$/.test(path),
    note: {
      text: "Close. The dashboards have an s on the end.",
      link: { href: "/dashboards", label: "Go to the dashboards." },
    },
  },
  {
    test: (path) => /^\/(home|index(\.html?)?)\/?$/.test(path),
    note: {
      text: "The home page is at the root, with nothing after the slash.",
      link: { href: "/", label: "Go there." },
    },
  },
  {
    test: (path) => /^\/(cv|resume\.pdf|resume\/download)\/?$/.test(path),
    note: {
      text: "The résumé is at /resume, and the PDF is linked from the top of it.",
      link: { href: "/resume", label: "Open the résumé." },
    },
  },
  {
    test: (path) => /^\/(secret|secrets|hidden|easter-?eggs?|eggs)\/?$/.test(path),
    note: {
      text: "They're hidden, so they don't have an address. Searching the site for easter eggs gets you a hint.",
      link: { href: "/search?q=easter+eggs", label: "Search for them." },
    },
  },
  {
    test: (path) => /^\/404\/?$/.test(path),
    note: {
      text: "This one is a real 404, which I suppose is what you came for.",
    },
  },
];

/** The note for a missing address, or null when the address is just missing. */
export function getNotFoundNote(pathname: string): NotFoundNote | null {
  const path = pathname.toLowerCase();
  return NOTES.find(({ test }) => test(path))?.note ?? null;
}

export function NotFoundNote({ className }: { className?: string }) {
  const note = getNotFoundNote(usePathname() ?? "");
  if (!note) return null;
  return (
    <p className={className}>
      {note.text}
      {note.link ? (
        <>
          {" "}
          <Link href={note.link.href} className="c97-link">
            {note.link.label}
          </Link>
        </>
      ) : null}
    </p>
  );
}
