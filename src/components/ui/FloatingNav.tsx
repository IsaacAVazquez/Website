"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { navlinks } from "@/constants/navlinks";
import { twMerge } from "tailwind-merge";
import { useNavigation } from "@/hooks/useNavigation";

export function FloatingNav() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const { isMobile } = useNavigation();

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const currentScrollY = window.scrollY;
        
        // Show nav when scrolling up, hide when scrolling down
        if (currentScrollY < lastScrollY || currentScrollY < 100) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
        
        setLastScrollY(currentScrollY);
      }, 16); // Throttle to ~60fps
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY]);

  const isActive = (href: string) => pathname === href;
  const isHomePage = pathname === '/';

  // Responsive positioning based on screen size and page
  const getNavClasses = () => {
    if (isHomePage) {
      // Home page: bottom center on mobile, top-right on desktop
      return isMobile 
        ? "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        : "fixed top-6 right-6 z-50";
    } else {
      // Other pages: bottom center on mobile only
      return "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50";
    }
  };

  const getInitialAnimation = () => {
    if (isHomePage && !isMobile) {
      return { x: 100, opacity: 0 }; // Slide in from right on desktop
    }
    return { y: 100, opacity: 0 }; // Slide in from bottom on mobile
  };

  const getAnimateAnimation = () => {
    if (isHomePage && !isMobile) {
      return { x: 0, opacity: 1 }; // Slide to position from right
    }
    return { y: 0, opacity: 1 }; // Slide to position from bottom
  };

  const getExitAnimation = () => {
    if (isHomePage && !isMobile) {
      return { x: 100, opacity: 0 }; // Slide out to right
    }
    return { y: 100, opacity: 0 }; // Slide out to bottom
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          id="navigation"
          role="navigation"
          aria-label="Main site navigation"
          initial={getInitialAnimation()}
          animate={getAnimateAnimation()}
          exit={getExitAnimation()}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className={getNavClasses()}
        >
          <div className="bg-white/80 dark:bg-[#2D1B12]/90 backdrop-blur-sm border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 shadow-warm-lg rounded-2xl px-4 py-3 flex items-center gap-2">
            {navlinks.map((link, index) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative"
                  aria-label={`Navigate to ${link.label}`}
                >
                  <motion.div
                    className={twMerge(
                      "relative p-3 rounded-xl transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center",
                      active
                        ? "text-white"
                        : "text-[#6B4F3D] dark:text-[#D4A88E] hover:text-[#FF6B35] dark:hover:text-[#FF8E53]"
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
                        className="absolute inset-0 bg-gradient-to-br from-[#FF6B35] to-[#F7B32B] dark:from-[#FF8E53] dark:to-[#FFC857] rounded-xl shadow-warm-lg"
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
                      aria-hidden="true"
                    />

                    {/* Warm glow effect on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-[#FF6B35]/10 dark:bg-[#FF8E53]/20 blur-md opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </Link>
              );
            })}

            {/* CTA Button - Let's Talk */}
            <div className="relative ml-2 pl-2 border-l-2 border-[#FFE4D6]/50 dark:border-[#FF8E53]/20">
              <Link
                href="/contact"
                aria-label="Contact Isaac Vazquez"
              >
                <motion.button
                  className="relative px-5 py-2 bg-gradient-to-br from-[#FF6B35] to-[#F7B32B] dark:from-[#FF8E53] dark:to-[#FFC857] text-white font-semibold rounded-xl shadow-warm-lg min-h-[44px] whitespace-nowrap text-sm"
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(255, 107, 53, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: navlinks.length * 0.1,
                    type: "spring",
                    stiffness: 300
                  }}
                >
                  Let&apos;s Talk
                </motion.button>
              </Link>
            </div>
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
  const pathname = usePathname();
  const { isMobile } = useNavigation();

  const router = useRouter();
  
  const handleNavigation = useCallback((direction: "left" | "right") => {
    // Simple navigation logic - cycle through main pages
    const pages = ["/", "/about", "/projects", "/resume", "/contact"];
    const currentIndex = pages.indexOf(pathname);
    
    if (currentIndex === -1) return; // Not on a main page
    
    let nextIndex;
    if (direction === "right") {
      nextIndex = (currentIndex + 1) % pages.length;
    } else {
      nextIndex = (currentIndex - 1 + pages.length) % pages.length;
    }
    
    // Use Next.js router for better performance
    router.push(pages[nextIndex]);
  }, [pathname, router]);

  // Only enable drag on mobile to reduce performance overhead
  const dragProps = isMobile ? {
    drag: "x" as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.2,
    onDragStart: () => setIsDragging(true),
    onDragEnd: (_: any, info: any) => {
      setIsDragging(false);
      
      // Trigger navigation based on swipe direction
      const threshold = 100;
      if (Math.abs(info.offset.x) > threshold) {
        const direction = info.offset.x > 0 ? "right" : "left";
        setDragDirection(direction);
        
        // Implement actual navigation logic
        handleNavigation(direction);
        
        setTimeout(() => setDragDirection(null), 300);
      }
    }
  } : {};
  
  return (
    <motion.div
      className="relative min-h-screen"
      {...dragProps}
      style={{
        cursor: isMobile && isDragging ? "grabbing" : isMobile ? "grab" : "default",
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
              "fixed top-1/2 transform -translate-y-1/2 z-40 p-4 bg-white/90 dark:bg-[#2D1B12]/90 backdrop-blur-sm border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 shadow-warm-xl rounded-full",
              dragDirection === "left" ? "left-4" : "right-4"
            )}
          >
            <motion.div
              className="text-[#FF6B35] dark:text-[#FF8E53] text-2xl"
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