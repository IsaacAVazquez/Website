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
    <WarmCard hover={false} padding="md" className="overflow-hidden">
      <button
        onClick={toggleOpen}
        className="w-full p-6 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-200 focus:ring-2 focus:ring-electric-blue focus:ring-inset focus:outline-none"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center justify-between gap-4">
          <Heading level={3} className="text-lg font-semibold pr-4 flex-1">
            {question}
          </Heading>
          <div className="flex-shrink-0">
            {isOpen ? (
              <IconChevronUp className="w-5 h-5 text-electric-blue transition-transform duration-200" />
            ) : (
              <IconChevronDown className="w-5 h-5 text-slate-400 group-hover:text-electric-blue transition-colors duration-200" />
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
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <Paragraph className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {answer}
                </Paragraph>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </WarmCard>
  );
}