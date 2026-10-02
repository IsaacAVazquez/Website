"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { SearchInterfaceProps } from "./SearchInterface";

const SearchInterfaceNoSSR = dynamic<SearchInterfaceProps>(
  () => import("./SearchInterface").then((mod) => mod.SearchInterface),
  {
    ssr: false,
    // Holds the field's 48px while the chunk loads so the band does not jump in.
    loading: () => (
      <span className="c97-skeleton" aria-hidden="true" style={{ display: "block", height: 48, width: "100%" }} />
    ),
  }
);

export function SearchInterfaceClient(props: SearchInterfaceProps) {
  const searchParams = useSearchParams();

  return (
    <SearchInterfaceNoSSR
      {...props}
      initialQuery={searchParams.get("q") ?? ""}
      initialType={searchParams.get("type") ?? "all"}
      initialCategory={searchParams.get("category") ?? "all"}
    />
  );
}
