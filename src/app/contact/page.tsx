"use client";
import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Paragraph } from "@/components/Paragraph";
import { FaLinkedin, FaEnvelope } from "react-icons/fa";


export default function Contact() {
  return (
    <Container>
      <div className="flex flex-col items-center mt-4">
        <span className="text-5xl mb-2 animate-wiggle">✉️</span>
        <Heading className="font-black mb-2 text-3xl text-center">
          Let’s Connect!
        </Heading>
        <Paragraph className="mb-8 max-w-xl text-center text-lg text-gray-700 dark:text-teal-200">
          Whether you want to talk product, brainstorm ideas, or just grab a virtual coffee—my inbox is always open. Drop me a note and I’ll get back to you soon!
        </Paragraph>
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <a
            href="mailto:isaacavazquez95@gmail.com"
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold shadow hover:from-blue-700 hover:to-teal-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <FaEnvelope className="text-xl" /> Email Me
          </a>
          <a
            href="https://www.linkedin.com/in/isaac-vazquez"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#0077b5] to-blue-500 text-white font-semibold shadow hover:from-[#005983] hover:to-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <FaLinkedin className="text-xl" /> LinkedIn
          </a>
          {/* Uncomment if you want to add Twitter/X
          <a
            href="https://twitter.com/YOUR_HANDLE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-400 to-blue-700 text-white font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <FaTwitter className="text-xl" /> Twitter
          </a>
          */}
        </div>
        <Paragraph className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Or just say hi and tell me about your latest project!
        </Paragraph>
      </div>
      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-10deg) scale(1);}
          25% { transform: rotate(8deg) scale(1.08);}
          50% { transform: rotate(-4deg) scale(1);}
          75% { transform: rotate(10deg) scale(1.05);}
        }
        .animate-wiggle {
          animation: wiggle 2.5s infinite;
        }
      `}</style>
    </Container>
  );
}