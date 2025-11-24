import { IconBolt, IconMail, IconFileText, IconUser, IconBriefcase } from "@tabler/icons-react";

// PM-focused navigation: prioritizes portfolio and professional content
export const navlinks = [
  {
    href: "/",
    label: "Home",
    icon: IconBolt,
  },
  {
    href: "/about",
    label: "About",
    icon: IconUser,
  },
  {
    href: "/projects",
    label: "Case Studies", // Renamed from "Projects" for PM positioning
    icon: IconBriefcase,
  },
  {
    href: "/resume",
    label: "Resume",
    icon: IconFileText,
  },
  {
    href: "/contact",
    label: "Contact",
    icon: IconMail,
  },
];
