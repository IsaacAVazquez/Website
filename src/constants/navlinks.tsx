import {
  IconHome,
  IconMail,
  IconBriefcase,
  IconUser,
} from "@tabler/icons-react";

// Simplified navigation: 4 core sections for product-focused portfolio
export const navlinks = [
  {
    href: "/",
    label: "Home",
    icon: IconHome,
  },
  {
    href: "/#about",
    label: "About",
    icon: IconUser,
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: IconBriefcase,
  },
  {
    href: "/#contact",
    label: "Contact",
    icon: IconMail,
  },
];
