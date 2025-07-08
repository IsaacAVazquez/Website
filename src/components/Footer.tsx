"use client";
import React from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export const Footer = () => {
  return (
    <footer className="relative z-20 flex flex-col items-center justify-center p-5 pb-2 min-h-[72px] bg-gradient-to-t from-terminal-bg/70 to-transparent backdrop-blur rounded-t-xl border-t border-electric-blue/20">
      <div className="flex items-center gap-2 text-base font-semibold text-slate-400 mb-1 animate-footerIn font-terminal">
        <span className="text-lg animate-wave select-none">⚡</span>
        <span>{new Date().getFullYear()}</span>
        <span>&#8212; BUILT BY</span>
        <a
          href="https://isaacvazquez.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-electric-blue via-matrix-green to-neon-purple hover:drop-shadow-glow transition uppercase"
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
          className="text-slate-500 hover:text-electric-blue transition"
        >
          <FaLinkedin size={18} />
        </a>
        <a
          href="https://github.com/isaacvazquez"
          aria-label="GitHub"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-matrix-green transition"
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
          filter: drop-shadow(0 0 4px rgba(0, 245, 255, 0.6));
        }
      `}</style>
    </footer>
  );
};
