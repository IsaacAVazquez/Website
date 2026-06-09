"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { SearchInterfaceProps } from "./SearchInterface";

const SearchInterfaceNoSSR = dynamic<SearchInterfaceProps>(
  () => import("./SearchInterface").then((mod) => mod.SearchInterface),
  { ssr: false }
);

function resolveInitialSearchState(searchParams: ReturnType<typeof useSearchParams>) {
  if (!searchParams.toString()) {
    return {
      initialQuery: "",
      initialType: "all",
      initialCategory: "all",
    };
  }

  return {
    initialQuery: searchParams.get("q") ?? "",
    initialType: searchParams.get("type") ?? "all",
    initialCategory: searchParams.get("category") ?? "all",
  };
}

export function SearchInterfaceClient(props: SearchInterfaceProps) {
  const searchParams = useSearchParams();
  const initialState = resolveInitialSearchState(searchParams);

  return (
    <SearchInterfaceNoSSR
      {...props}
      initialQuery={initialState.initialQuery}
      initialType={initialState.initialType}
      initialCategory={initialState.initialCategory}
    />
  );
}
