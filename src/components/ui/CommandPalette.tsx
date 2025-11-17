"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { navlinks } from "@/constants/navlinks";
import { socials } from "@/constants/socials";
import { IconSearch, IconCommand } from "@tabler/icons-react";
import { WarmCard } from "./WarmCard";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: "navigation" | "social" | "action";
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Create command items
  const commands: CommandItem[] = [
    // Navigation
    ...navlinks.map((link) => ({
      id: `nav-${link.href}`,
      title: link.label,
      subtitle: `Go to ${link.label}`,
      icon: link.icon,
      action: () => {
        router.push(link.href);
        setIsOpen(false);
      },
      category: "navigation" as const,
    })),
    // Social links
    ...socials.map((link) => ({
      id: `social-${link.href}`,
      title: link.label,
      subtitle: "Open external link",
      icon: link.icon,
      action: () => {
        window.open(link.href, "_blank");
        setIsOpen(false);
      },
      category: "social" as const,
    })),
    // Actions
    // Theme toggle temporarily hidden
    // {
    //   id: "theme-toggle",
    //   title: "Toggle Theme",
    //   subtitle: "Switch between light and dark mode",
    //   icon: IconCommand,
    //   action: () => {
    //     const isDark = document.documentElement.classList.contains("dark");
    //     if (isDark) {
    //       document.documentElement.classList.remove("dark");
    //       localStorage.setItem("theme", "light");
    //     } else {
    //       document.documentElement.classList.add("dark");
    //       localStorage.setItem("theme", "dark");
    //     }
    //     setIsOpen(false);
    //   },
    //   category: "action" as const,
    // },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter((command) =>
    command.title.toLowerCase().includes(search.toLowerCase()) ||
    command.subtitle?.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Open command palette with Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsOpen(true);
    }

    // Close with Escape
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
      setSelectedIndex(0);
    }

    if (!isOpen) return;

    // Navigation
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    }

    // Execute command
    if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
    }
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const categoryIcons = {
    navigation: "🧭",
    social: "🔗",
    action: "⚡",
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 p-3 glass-card elevation-2 hover:elevation-3 transition-all duration-300 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <IconSearch className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
          ⌘K
        </span>
      </motion.button>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20"
            onClick={() => setIsOpen(false)}
          >
            <WarmCard
              hover={false}
              padding="none"
              className="w-full max-w-2xl mx-4 overflow-hidden"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.9, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b-2 border-[#FFE4D6] dark:border-[#FF8E53]/30">
                  <IconSearch className="h-5 w-5 text-[#FF6B35] dark:text-[#FF8E53]" />
                  <input
                    type="text"
                    placeholder="Search commands..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[#4A3426] dark:text-[#FFE4D6] placeholder-[#6B4F3D] dark:placeholder-[#D4A88E]"
                    autoFocus
                  />
                  <kbd className="px-2 py-1 text-xs bg-[#FFF8F0] dark:bg-[#4A3426]/50 rounded text-[#6B4F3D] dark:text-[#D4A88E] border border-[#FFE4D6] dark:border-[#FF8E53]/30">
                    ESC
                  </kbd>
                </div>

                {/* Commands List */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredCommands.length > 0 ? (
                    <div className="p-2">
                      {Object.entries(
                        filteredCommands.reduce((acc, command) => {
                          if (!acc[command.category]) acc[command.category] = [];
                          acc[command.category].push(command);
                          return acc;
                        }, {} as Record<string, CommandItem[]>)
                      ).map(([category, items]) => (
                        <div key={category} className="mb-4">
                          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                            <span>{categoryIcons[category as keyof typeof categoryIcons]}</span>
                            {category}
                          </div>
                          {items.map((command) => {
                            const globalIndex = filteredCommands.indexOf(command);
                            const Icon = command.icon;
                            
                            return (
                              <motion.button
                                key={command.id}
                                onClick={command.action}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                                  selectedIndex === globalIndex
                                    ? "bg-vivid-blue/20 text-vivid-blue"
                                    : "hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 text-primary"
                                }`}
                                whileHover={{ x: 4 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {command.title}
                                  </div>
                                  {command.subtitle && (
                                    <div className="text-sm text-secondary truncate">
                                      {command.subtitle}
                                    </div>
                                  )}
                                </div>
                                {selectedIndex === globalIndex && (
                                  <kbd className="px-2 py-1 text-xs bg-vivid-blue/20 rounded text-vivid-blue">
                                    ↵
                                  </kbd>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-secondary">
                      <IconSearch className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p>No commands found</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-3 border-t border-neutral-200/20 dark:border-neutral-700/20 text-xs text-secondary">
                  <div className="flex items-center gap-4">
                    <span>Navigate with ↑↓</span>
                    <span>Select with ↵</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Powered by</span>
                    <kbd className="px-1 py-0.5 bg-neutral-200/20 dark:bg-neutral-700/20 rounded">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </motion.div>
            </WarmCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}