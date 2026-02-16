"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TopLoadingBar - NProgress-style loading indicator
 *
 * Shows a slim loading bar at the top of the page during route transitions.
 * Automatically starts on navigation and completes when page loads.
 */
function TopLoadingBarInner() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start loading animation
    setIsLoading(true);
    setProgress(0);

    // Simulate progress (0 → 70% quickly)
    const progressTimer = setTimeout(() => {
      setProgress(70);
    }, 100);

    // Complete after a short delay (simulates page load)
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    }, 800);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-black via-neutral-600 to-black dark:from-white dark:via-neutral-300 dark:to-white"
          initial={{ width: "0%", opacity: 1 }}
          animate={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1
          }}
          exit={{ opacity: 0 }}
          transition={{
            width: {
              duration: progress === 100 ? 0.3 : 0.5,
              ease: [0.25, 0.46, 0.45, 0.94]
            },
            opacity: {
              duration: 0.2,
              delay: progress === 100 ? 0.3 : 0
            }
          }}
          style={{
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1), 0 0 5px rgba(0, 0, 0, 0.2)",
          }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}

export function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarInner />
    </Suspense>
  );
}
