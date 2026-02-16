"use client";

import dynamic from "next/dynamic";
import type { SearchInterfaceProps } from "./SearchInterface";

const SearchInterfaceNoSSR = dynamic(
  () => import("./SearchInterface").then((mod) => mod.SearchInterface),
  { ssr: false }
);

export function SearchInterfaceClient(props: SearchInterfaceProps) {
  return <SearchInterfaceNoSSR {...props} />;
}
