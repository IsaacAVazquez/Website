"use client";
import { Paragraph } from "@/components/Paragraph";
import Image from "next/image";

import { motion } from "framer-motion";

export default function About() {
  const images = [
    "https://images.unsplash.com/photo-1692544350322-ac70cfd63614?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw1fHx8ZW58MHx8fHx8&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1692374227159-2d3592f274c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw4fHx8ZW58MHx8fHx8&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1692005561659-cdba32d1e4a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwxOHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1692445381633-7999ebc03730?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwzM3x8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
  ];
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 my-10">
        {images.map((image, index) => (
          <motion.div
            key={image}
            initial={{
              opacity: 0,
              y: -50,
              rotate: 0,
            }}
            animate={{
              opacity: 1,
              y: 0,
              rotate: index % 2 === 0 ? 3 : -3,
            }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <Image
              src={image}
              width={200}
              height={400}
              alt="about"
              className="rounded-md object-cover transform rotate-3 shadow-xl block w-full h-40 md:h-60 hover:rotate-0 transition duration-200"
            />
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl">
        <h2 className="text-3xl font-bold mb-4">About Me</h2>
        <Paragraph className="mt-4">
          QA Engineer, data enthusiast, and passionate advocate for civic engagement through technology.
        </Paragraph>
        <Paragraph className="mt-4">
          With a robust background in quality assurance, data analysis, and political technology, I focus on ensuring software reliability and functionality to empower social impact initiatives. My professional journey has spanned roles in client services, digital media, and analytics, always driven by the goal of making complex information accessible and actionable.
        </Paragraph>
        <Paragraph className="mt-4">
          I believe deeply in technology&apos;s potential to foster civic participation and drive meaningful change. Throughout my career, I&apos;ve prioritized clear communication, meticulous testing, and collaborative problem-solving to deliver products that resonate and perform.
        </Paragraph>
        <Paragraph className="mt-4">
          Outside of my professional life, I engage actively in political organizing, explore new technologies, and continuously seek opportunities to learn and contribute to the tech and civic communities.
        </Paragraph>

        <h3 className="text-2xl font-semibold mt-8 mb-2">Education</h3>
        <Paragraph className="mt-2">
          B.A. Political Science and International Affairs, FSU (magna cum laude, Phi Beta Kappa)
        </Paragraph>

        <h3 className="text-2xl font-semibold mt-8 mb-2">Skills</h3>
        <Paragraph className="mt-2">
          QA, T-SQL, MySQL, NoSQL, Data Analysis, Automation Testing
        </Paragraph>

        <h3 className="text-2xl font-semibold mt-8 mb-2">Experience</h3>
        <Paragraph className="mt-2">
          6+ years in QA, data analytics, and political technology
        </Paragraph>

        <h3 className="text-2xl font-semibold mt-8 mb-2">Focus Areas</h3>
        <Paragraph className="mt-2">
          Quality Assurance, Civic Tech, Data-Driven Decision Making
        </Paragraph>
      </div>
    </div>
  );
}
