import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type BadgeProps = {
  text: string;
  href: string;
} & React.ComponentProps<typeof Link>;

export const Badge = ({ text, href, ...props }: BadgeProps) => {
  return (
    <Link
      href={href}
      className="bg-terminal-bg no-underline group cursor-pointer relative shadow-2xl shadow-terminal-bg rounded-full p-px text-xs font-semibold leading-6 text-matrix-green inline-block font-terminal"
      {...props}
    >
      <span className="absolute inset-0 overflow-hidden rounded-full ">
        <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(0,245,255,0.6)_0%,rgba(0,245,255,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
      </span>
      <div className="relative flex space-x-2 items-center z-10 rounded-full bg-transparent py-2 px-4 ring-1 ring-electric-blue/20 hover:ring-electric-blue/50 transition-all">
        <span>{text}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M10.75 8.75L14.25 12L10.75 15.25"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          ></motion.path>
        </svg>
      </div>
    </Link>
  );
};
