import {
  IconBolt,
  IconMail,
  IconFileText,
  IconUser,
  IconBriefcase,
  IconPencil,
  IconQuestionMark,
  IconTrophy,
} from "@tabler/icons-react";

// Full navigation: all major sections accessible
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
    label: "Case Studies", // PM-focused positioning
    icon: IconBriefcase,
  },
  {
    href: "/writing",
    label: "Writing",
    icon: IconPencil,
  },
  {
    href: "/fantasy-football",
    label: "Fantasy Football",
    icon: IconTrophy,
  },
  {
    href: "/faq",
    label: "FAQ",
    icon: IconQuestionMark,
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
