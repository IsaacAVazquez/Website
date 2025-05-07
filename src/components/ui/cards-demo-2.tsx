
"use client";
import React from "react";
import { motion } from "motion/react";

export function CardDemo2() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {Array.from({ length: 2 }, (_, i) => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-1"
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
              Feature {i + 1}
            </h3>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Interactive card with gradient border and hover animation.
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
