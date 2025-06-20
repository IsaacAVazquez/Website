"use client";
import React from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export const Footer = () => {
  return (
    <footer className="relative z-20 flex flex-col items-center justify-center p-5 pb-2 min-h-[72px] bg-gradient-to-t from-neutral-200/70 dark:from-neutral-900/80 to-transparent backdrop-blur rounded-t-xl border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2 text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-1 animate-footerIn">
        <span className="text-lg animate-wave select-none">🛠️</span>
        <span>{new Date().getFullYear()}</span>
        <span>&#8212; Built by</span>
        <a
          href="https://isaacvazquez.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-teal-400 to-purple-600 dark:from-cyan-300 dark:via-indigo-200 dark:to-purple-400 hover:drop-shadow-glow transition"
        >
          Isaac Vazquez
        </a>
      </div>
      <div className="flex gap-4 mt-1 opacity-75">
        <a
          href="https://linkedin.com/in/isaac-vazquez"
          aria-label="LinkedIn"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 dark:hover:text-teal-300 transition"
        >
          <FaLinkedin size={18} />
        </a>
        <a
          href="https://github.com/isaacvazquez"
          aria-label="GitHub"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-800 dark:hover:text-gray-200 transition"
        >
          <FaGithub size={18} />
        </a>
      </div>
      <style jsx global>{`
        @keyframes footerIn {
          0% { opacity: 0; transform: translateY(24px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        .animate-footerIn {
          animation: footerIn 1s cubic-bezier(0.4,0.0,0.2,1) 0.2s both;
        }
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg);}
          10%, 30% { transform: rotate(-20deg);}
          20% { transform: rotate(10deg);}
          40% { transform: rotate(8deg);}
          50% { transform: rotate(-12deg);}
        }
        .animate-wave {
          animation: wave 2.4s infinite;
          display: inline-block;
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 4px #38bdf8bb);
        }
      `}</style>
    </footer>
  );
};
