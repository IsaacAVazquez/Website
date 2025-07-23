"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigation } from "@/hooks/useNavigation";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { IconMenu2, IconX, IconExternalLink } from "@tabler/icons-react";
import { GlassCard } from "./GlassCard";

const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Fantasy Football" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
];

const socialLinks = [
  { 
    href: "https://linkedin.com/in/isaac-vazquez", 
    label: "LinkedIn",
    external: true
  },
  { 
    href: "https://github.com/isaacvazquez", 
    label: "GitHub",
    external: true
  },
  { 
    href: "mailto:isaacavazquez95@gmail.com", 
    label: "Email",
    external: false
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const { isMobile, pathname, closeSidebar } = useNavigation();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={onToggle}
          className="fixed top-6 left-6 z-50 p-3 glass-card elevation-2 hover:elevation-3 transition-all duration-300"
        >
          {isOpen ? (
            <IconX className="w-5 h-5 text-electric-blue" />
          ) : (
            <IconMenu2 className="w-5 h-5 text-electric-blue" />
          )}
        </button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onToggle}
              />
            )}

            {/* Sidebar Content */}
            <motion.aside
              initial={{ x: isMobile ? -280 : 0, opacity: isMobile ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? -280 : 0, opacity: isMobile ? 0 : 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={twMerge(
                "fixed top-0 left-0 h-full z-40 w-72",
                "bg-terminal-bg/95 backdrop-blur-lg border-r border-electric-blue/20",
                "md:relative md:z-0 md:bg-terminal-bg/50"
              )}
            >
              <div className="flex flex-col h-full p-6">
                {/* Profile Section */}
                <div className="mb-8 pt-4">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h1 className="text-2xl font-bold text-electric-blue font-orbitron">
                      Isaac Vazquez
                    </h1>
                    <p className="text-slate-400 mt-1 font-mono text-sm">
                      QA Engineer & Builder
                    </p>
                    <div className="mt-2 px-3 py-1 bg-matrix-green/10 border border-matrix-green/30 rounded-full inline-block">
                      <span className="text-matrix-green text-xs font-mono uppercase tracking-wider">
                        Available for Work
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 min-h-0">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    {navigationLinks.map((link, index) => {
                      const active = isActive(link.href);
                      
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={isMobile ? closeSidebar : undefined}
                          className={twMerge(
                            "block px-4 py-3 rounded-lg transition-all duration-200 font-mono text-sm",
                            active
                              ? "bg-electric-blue/20 text-electric-blue border border-electric-blue/30"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                          )}
                        >
                          <motion.div
                            whileHover={{ x: 4 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            {active && <span className="text-matrix-green mr-2">&gt;</span>}
                            {link.label}
                          </motion.div>
                        </Link>
                      );
                    })}
                  </motion.div>
                </nav>

                {/* Bottom Section - Social Links + Footer */}
                <div className="flex-shrink-0 mt-auto">
                  {/* Social Links */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="border-t border-slate-700 pt-6"
                  >
                    <h3 className="text-slate-500 text-xs uppercase tracking-wider font-mono mb-4">
                      Connect
                    </h3>
                    <div className="space-y-2">
                      {socialLinks.map((link, index) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noopener noreferrer" : undefined}
                          className="flex items-center text-slate-400 hover:text-electric-blue transition-colors text-sm font-mono"
                        >
                          <motion.div
                            whileHover={{ x: 2 }}
                            className="flex items-center gap-2"
                          >
                            {link.label}
                            {link.external && (
                              <IconExternalLink className="w-3 h-3" />
                            )}
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>

                  {/* Footer */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="border-t border-slate-700 pt-4 mt-4"
                  >
                    <p className="text-slate-500 text-xs font-mono">
                      © 2025 Isaac Vazquez
                    </p>
                    <p className="text-slate-600 text-xs font-mono mt-1">
                      Built with Next.js & TypeScript
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}