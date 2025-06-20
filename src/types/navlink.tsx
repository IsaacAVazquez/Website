import React from "react";

export type Navlink = {
  href: string;
  label: string;
  icon?: React.ReactNode | React.ComponentType<any>;
};
