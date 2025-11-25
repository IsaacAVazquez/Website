"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WarmCard } from "@/components/ui/WarmCard";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

interface FAQSectionProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export function FAQSection({ question, answer, defaultOpen = false }: FAQSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <WarmCard hover={false} padding="none" className="overflow-hidden">
      <button
        onClick={toggleOpen}
        className="w-full p-6 text-left hover:bg-[#FFF8F0] dark:hover:bg-[#4A3426]/20 transition-colors duration-200 focus:ring-2 focus:ring-[#FF6B35] focus:ring-inset focus:outline-none rounded-lg"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg md:text-xl font-semibold text-[#2D1B12] dark:text-[#FFE4D6] pr-4 flex-1">
            {question}
          </h3>
          <div className="flex-shrink-0">
            {isOpen ? (
              <IconChevronUp className="w-5 h-5 text-[#FF6B35] dark:text-[#FF8E53] transition-transform duration-200" />
            ) : (
              <IconChevronDown className="w-5 h-5 text-[#6B4F3D] dark:text-[#D4A88E] group-hover:text-[#FF6B35] dark:group-hover:text-[#FF8E53] transition-colors duration-200" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
              opacity: { duration: 0.2 }
            }}
            className="overflow-hidden"
            id={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <div className="px-6 pb-6 pt-0">
              <div className="border-t border-[#FFE4D6] dark:border-[#6B4F3D] pt-4">
                <p className="text-base md:text-lg text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                  {answer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </WarmCard>
  );
}