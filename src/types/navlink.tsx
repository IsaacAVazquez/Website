import { ForwardRefExoticComponent, RefAttributes } from "react";
import { IconProps, Icon } from "@tabler/icons-react";

export type Navlink = {
  href: string;
  label: string;
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
};