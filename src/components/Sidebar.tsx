"use client";
import { navlinks } from "@/constants/navlinks";
import { Navlink } from "@/types/navlink";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Heading } from "./ui/Heading";
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
              px-6 z-[100] py-10 bg-terminal-bg/90 dark:bg-terminal-bg/95
              max-w-[15rem] w-full lg:w-fit fixed lg:relative left-0 top-0
              shadow-xl border-r border-electric-blue/20 dark:border-electric-blue/30
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
        className="fixed lg:hidden bottom-4 right-4 h-10 w-10 border border-electric-blue/30 bg-terminal-bg/80 rounded-full backdrop-blur-md flex items-center justify-center z-50 shadow-lg transition-all glow-effect"
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        <IconLayoutSidebarRightCollapse className="h-5 w-5 text-electric-blue" />
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
            "group relative text-slate-400 hover:text-electric-blue transition duration-200 flex items-center space-x-2 py-2 px-2 rounded-md text-[1rem] font-medium hover:bg-electric-blue/10 focus:outline-none focus:ring-2 focus:ring-electric-blue font-terminal",
            isActive(link.href) &&
              "bg-electric-blue/20 shadow-lg text-electric-blue border border-electric-blue/30"
          )}
        >
          {/* Animated active underline */}
          <motion.span
            layoutId="activeLink"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className={twMerge(
              "absolute left-0 top-0 h-full w-[3px] rounded bg-electric-blue opacity-0 group-hover:opacity-60",
              isActive(link.href) && "opacity-100 shadow-electric"
            )}
          />
          {typeof link.icon === "function" ? (
            <link.icon
              className={twMerge(
                "h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform",
                isActive(link.href)
                  ? "text-electric-blue"
                  : "text-slate-400"
              )}
            />
          ) : null}
          <span className="z-10">{link.label}</span>
        </Link>
      ))}

      <Heading as="p" className="text-sm pt-10 px-2 text-slate-500 font-terminal font-semibold tracking-wider opacity-70 uppercase">
        Social_Links
      </Heading>
      <div className="flex flex-wrap gap-2 mt-1 px-2">
        {socials.map((link: Navlink) => (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm rounded-full bg-terminal-bg/50 border border-matrix-green/30 text-matrix-green px-3 py-1 shadow hover:shadow-lg hover:bg-matrix-green/10 hover:border-matrix-green transition font-terminal"
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
          alt="Isaac Vazquez Avatar"
          height={48}
          width={48}
          sizes="48px"
          className="object-cover object-top rounded-full bg-terminal-bg shadow border-2 border-electric-blue/50"
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAbEAADAAMBAQAAAAAAAAAAAAABAgMABAURUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAECEf/aAAwDAQACEQMRAD8Amo1owkKnothG7HzGnx"
        />
        {/* Animated online dot */}
       <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-matrix-green ring-2 ring-terminal-bg animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-electric-blue text-base leading-tight font-heading">ISAAC VAZQUEZ</span>
        <span className="inline-flex items-center gap-1 mt-1">
          <Badge text="QA Engineer" href="/about" />
        </span>
      </div>
      <style jsx global>{`
        @keyframes glow {
          0% { box-shadow: 0 0 6px 2px rgba(0, 245, 255, 0.4), 0 0 0px 0 rgba(0, 245, 255, 0.2); }
          50% { box-shadow: 0 0 24px 6px rgba(0, 245, 255, 0.6), 0 0 4px 1px rgba(57, 255, 20, 0.4); }
          100% { box-shadow: 0 0 6px 2px rgba(0, 245, 255, 0.4), 0 0 0px 0 rgba(0, 245, 255, 0.2); }
        }
        .animate-glow {
          animation: glow 2.5s infinite;
        }
        .shadow-electric {
          box-shadow: 0 0 10px rgba(0, 245, 255, 0.6);
        }
      `}</style>
    </div>
  );
};
