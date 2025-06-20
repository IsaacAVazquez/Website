"use client";
import { Paragraph } from "@/components/Paragraph";

export default function About() {
  return (
    <div>
      {/* Images hidden for now */}
      {/* 
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
      */}

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
