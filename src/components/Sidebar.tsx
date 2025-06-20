"use client";
import { navlinks } from "@/constants/navlinks";
import { Navlink } from "@/types/navlink";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Heading } from "./Heading";
import { socials } from "@/constants/socials";
import { AnimatePresence, motion } from "framer-motion";
import { IconLayoutSidebarRightCollapse } from "@tabler/icons-react";
import { isMobile } from "@/lib/utils";
import { Badge } from "./Badge"; // <-- Add this line


export const Sidebar = () => {
  const [open, setOpen] = useState(isMobile() ? false : true);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside // changed from div to aside for semantics
            initial={{ x: -64, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            exit={{ x: -64, opacity: 0 }}
            // Key changes are below:
            className="flex flex-col h-screen justify-between
              px-6 z-[100] py-10 bg-neutral-100/80 dark:bg-neutral-800/85
              max-w-[15rem] w-full lg:w-fit fixed lg:relative left-0 top-0
              shadow-xl border-r border-neutral-200 dark:border-neutral-700/40
              backdrop-blur-xl"
          >
            <div className="flex-1 flex flex-col overflow-auto">
              <SidebarHeader />
              <Navigation setOpen={setOpen} />
            </div>
            {/* You can put any sticky-bottom elements here if needed */}
          </motion.aside>
        )}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.07 }}
        className="fixed lg:hidden bottom-4 right-4 h-10 w-10 border border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/60 rounded-full backdrop-blur-md flex items-center justify-center z-50 shadow-lg transition-all"
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        <IconLayoutSidebarRightCollapse className="h-5 w-5 text-secondary dark:text-gray-300" />
      </motion.button>
    </>
  );
};


export const Navigation = ({
  setOpen,
}: {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="flex flex-col space-y-1 my-10 relative z-[100]">
      {navlinks.map((link: Navlink) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => isMobile() && setOpen(false)}
          className={twMerge(
            "group relative text-secondary dark:text-gray-300 hover:text-primary dark:hover:text-cyan-200 transition duration-200 flex items-center space-x-2 py-2 px-2 rounded-md text-[1rem] font-medium dark:hover:bg-neutral-700/30 focus:outline-none focus:ring-2 focus:ring-sky-400",
            isActive(link.href) &&
              "bg-white/90 dark:bg-neutral-700/70 shadow-lg text-sky-600 dark:text-cyan-300"
          )}
        >
          {/* Animated active underline */}
          <motion.span
            layoutId="activeLink"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className={twMerge(
              "absolute left-0 top-0 h-full w-[5px] rounded bg-sky-400 dark:bg-cyan-400 opacity-0 group-hover:opacity-40",
              isActive(link.href) && "opacity-100"
            )}
          />
          {typeof link.icon === "function" ? (
            <link.icon
              className={twMerge(
                "h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform",
                isActive(link.href)
                  ? "text-sky-500 dark:text-cyan-300"
                  : "dark:text-gray-300"
              )}
            />
          ) : null}
          <span className="z-10">{link.label}</span>
        </Link>
      ))}

      <Heading as="p" className="text-sm pt-10 px-2 text-secondary dark:text-gray-400 font-semibold tracking-wider opacity-70">
        Socials
      </Heading>
      <div className="flex flex-wrap gap-2 mt-1 px-2">
        {socials.map((link: Navlink) => (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm rounded-full bg-blue-50 dark:bg-neutral-700/40 px-3 py-1 shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-cyan-900/50 transition"
          >
            {typeof link.icon === "function" ? (
              <link.icon className="h-4 w-4" />
            ) : null}
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

const SidebarHeader = () => {
  return (
    <div className="flex space-x-3 items-center mb-6">
      <div className="relative">
        <Image
          src="/favicon.png"
          alt="Avatar"
          height={48}
          width={48}
          sizes="48px"
          className="object-cover object-top rounded-full bg-neutral-300 dark:bg-neutral-700 shadow border-2 border-white dark:border-neutral-800"
          priority
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-avatar.png";
          }}
        />
        {/* Animated online dot */}
       <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-neutral-800 animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-primary dark:text-cyan-200 text-base leading-tight">Isaac Vazquez</span>
        <span className="inline-flex items-center gap-1 mt-1">
          <Badge text="QA Engineer" href="/about" />
        </span>
      </div>
      <style jsx global>{`
        @keyframes glow {
          0% { box-shadow: 0 0 6px 2px #38bdf8aa, 0 0 0px 0 #38bdf855; }
          50% { box-shadow: 0 0 24px 6px #38bdf8cc, 0 0 4px 1px #06b6d4bb; }
          100% { box-shadow: 0 0 6px 2px #38bdf8aa, 0 0 0px 0 #38bdf855; }
        }
        .animate-glow {
          animation: glow 2.5s infinite;
        }
      `}</style>
    </div>
  );
};
