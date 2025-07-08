"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { navlinks } from "@/constants/navlinks";
import { twMerge } from "tailwind-merge";

export function FloatingNav() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isActive = (href: string) => pathname === href;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 md:hidden"
        >
          <div className="glass-card elevation-4 px-4 py-3 flex items-center gap-2 cursor-glow noise-texture">
            {navlinks.map((link, index) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative"
                >
                  <motion.div
                    className={twMerge(
                      "relative p-3 rounded-xl transition-all duration-300",
                      active 
                        ? "text-vivid-blue" 
                        : "text-secondary hover:text-primary"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 300 
                    }}
                  >
                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 bg-vivid-blue/20 rounded-xl"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    
                    {/* Icon */}
                    <Icon 
                      className={twMerge(
                        "relative z-10 h-5 w-5 transition-transform duration-300",
                        active && "scale-110"
                      )} 
                    />
                    
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-vivid-blue/20 blur-md opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

// Gesture-enhanced navigation for mobile
export function GestureNavigation({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);

  return (
    <motion.div
      className="relative min-h-screen"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        
        // Trigger navigation based on swipe direction
        const threshold = 100;
        if (Math.abs(info.offset.x) > threshold) {
          const direction = info.offset.x > 0 ? "right" : "left";
          setDragDirection(direction);
          
          // Here you could implement actual navigation logic
          // For example, navigate to next/previous page
          setTimeout(() => setDragDirection(null), 300);
        }
      }}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {/* Swipe indicators */}
      <AnimatePresence>
        {dragDirection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={twMerge(
              "fixed top-1/2 transform -translate-y-1/2 z-40 p-4 glass-card elevation-3 rounded-full",
              dragDirection === "left" ? "left-4" : "right-4"
            )}
          >
            <motion.div
              className="text-vivid-blue"
              animate={{ x: dragDirection === "left" ? -5 : 5 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.5 }}
            >
              {dragDirection === "left" ? "←" : "→"}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </motion.div>
  );
}