import type { ComponentType } from "react";

type NavIconProps = {
  className?: string;
  size?: number | string;
  "aria-hidden"?: boolean | "true" | "false";
};

export type Navlink = {
  href: string;
  label: string;
  icon: ComponentType<NavIconProps>;
};
