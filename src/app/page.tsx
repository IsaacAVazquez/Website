"use client";

import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Highlight } from "@/components/Highlight";
import { Paragraph } from "@/components/Paragraph";
import { Circles } from "@/components/Circles";
import Link from "next/link";

const funFacts = [
  "I am an avid chef and foodie.",
  "I am a really big policy nerd.",
  "I love working with data and analytics.",
  "I break things so you don’t have to.",
  "Fantasy football champion (at least once).",
];

function FunFacts() {
  return (
    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-teal-200">
      {funFacts.map((fact, i) => (
        <li key={i} className="transition-all hover:scale-105 hover:text-blue-500 dark:hover:text-yellow-300">{fact}</li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <Container>
      {/* Hero section with animated gradient and emoji */}
      <div className="relative h-40 mb-12 sm:h-60 flex items-center justify-center">
        <Circles />
        <span className="absolute z-10 text-7xl animate-wiggle select-none pointer-events-none drop-shadow-xl">
          👋
        </span>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-300/30 via-transparent to-purple-400/20 dark:from-indigo-900/50 dark:to-fuchsia-900/30 blur-3xl" />
      </div>

      <Heading className="font-black text-5xl mb-4 tracking-tight bg-gradient-to-r from-blue-600 via-teal-400 to-purple-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-indigo-200 dark:to-purple-400">
        Hey, I&apos;m Isaac
      </Heading>
      <Paragraph className="max-w-xl mt-3 text-lg text-gray-800 dark:text-teal-200">
        I'm a QA engineer by day but I love building things. Data whisperer. Builder of things that don’t break (well, at least not twice).  
        My mission? <span className="font-semibold text-blue-600 dark:text-teal-300">Build things that real people use and enjoy.</span>
      </Paragraph>
      <Paragraph className="max-w-xl mt-3 text-gray-700 dark:text-gray-300">
        I thrive where on the cutting edge, catching bugs before they bite, and shipping software you can trust.
      </Paragraph>
      <div className="mt-10">
        <Heading as="h2" className="text-2xl font-bold mb-2 text-gray-900 dark:text-yellow-200">
          Fun Facts About Me
        </Heading>
        <FunFacts />
      </div>
      
      {/* You can uncomment the following for a text animation intro! */}
      {/* <div className="max-w-xl mt-4 text-center text-xl mx-auto">
        <TextGenerateEffect words={words} />
      </div> */}
      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-12deg) scale(1);}
          25% { transform: rotate(6deg) scale(1.1);}
          50% { transform: rotate(-4deg) scale(1);}
          75% { transform: rotate(8deg) scale(1.05);}
        }
        .animate-wiggle {
          animation: wiggle 2s infinite;
        }
      `}</style>
    </Container>
  );
}
