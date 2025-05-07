
"use client";
import React from "react";
import { motion } from "motion/react";

export function CardDemo1() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {Array.from({ length: 3 }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-4">
            <h3 className="text-xl font-bold mb-2">Card {i + 1}</h3>
            <p className="text-gray-600 dark:text-gray-300">
              This is a sample card with animation and hover effects.
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
