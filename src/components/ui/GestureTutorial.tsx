"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function GestureTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Only show on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem('gesture-tutorial-seen');

    if (!hasSeenTutorial) {
      // Show tutorial after 4 seconds on first visit
      const tutorialTimer = setTimeout(() => {
        setShowTutorial(true);
      }, 4000);

      return () => clearTimeout(tutorialTimer);
    }
  }, []);

  const handleDismiss = () => {
    setShowTutorial(false);
    localStorage.setItem('gesture-tutorial-seen', 'true');
  };

  return (
    <AnimatePresence>
      {showTutorial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative mx-4 max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              aria-label="Close tutorial"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Tutorial content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Navigate with Gestures
              </h2>

              <p className="text-neutral-600 dark:text-neutral-300">
                Swipe left or right to navigate between pages quickly!
              </p>

              {/* Visual gesture demo */}
              <div className="relative h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden">
                <motion.div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-4"
                  animate={{
                    x: [-40, 40, -40],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="text-4xl">👈</div>
                  <div className="text-4xl">👉</div>
                </motion.div>
              </div>

              {/* Additional tips */}
              <div className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                <div className="flex items-start gap-2">
                  <span className="text-lg">📱</span>
                  <span>Use the navigation menu at the bottom for quick access</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">⬆️</span>
                  <span>Scroll up to reveal hidden navigation</span>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
