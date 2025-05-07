
"use client";
import React from "react";
import { motion } from "motion/react";

export function CardDemo3() {
  return (
    <motion.div 
      className="grid grid-cols-1 gap-8 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {Array.from({ length: 1 }, (_, i) => (
        <div
          key={i}
          className="relative group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ zIndex: -1 }}
          />
          <h3 className="text-2xl font-bold mb-4">Premium Card</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Advanced card with background gradient animation on hover.
          </p>
        </div>
      ))}
    </motion.div>
  );
}
