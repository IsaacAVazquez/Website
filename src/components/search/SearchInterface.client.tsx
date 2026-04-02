"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { SearchInterfaceProps } from "./SearchInterface";

const SearchInterfaceNoSSR = dynamic(
  () => import("./SearchInterface").then((mod) => mod.SearchInterface),
  { ssr: false }
);

export function SearchInterfaceClient(props: SearchInterfaceProps) {
  const searchParams = useSearchParams();

  return (
    <SearchInterfaceNoSSR
      {...props}
      initialQuery={searchParams.get("q") ?? props.initialQuery}
      initialType={searchParams.get("type") ?? props.initialType}
      initialCategory={searchParams.get("category") ?? props.initialCategory}
    />
  );
}
