import {
  Home,
  User,
  Briefcase,
  ChartBar,
  FileText,
  Mail,
} from "@/components/ui/ServerIcons";
import type { Navlink } from "@/types/navlink";

export const navLinks: Navlink[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/about",
    label: "About",
    icon: User,
  },
  {
    href: "/portfolio",
    label: "Projects",
    icon: Briefcase,
  },
  {
    href: "/investments",
    label: "Investments",
    icon: ChartBar,
  },
  {
    href: "/resume",
    label: "Resume",
    icon: FileText,
  },
  {
    href: "/contact",
    label: "Contact",
    icon: Mail,
  },
];
