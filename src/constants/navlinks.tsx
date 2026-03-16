import {
  Home,
  User,
  Briefcase,
  ChartBar,
  FileText,
  Mail,
} from "@/components/ui/ServerIcons";

export const navlinks = [
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
    label: "Work",
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
