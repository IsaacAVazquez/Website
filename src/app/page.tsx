import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Highlight } from "@/components/Highlight";
import { Paragraph } from "@/components/Paragraph";
import { Products } from "@/components/Products";
import { TechStack } from "@/components/TechStack";
import Image from "next/image";

export default function Home() {
  return (
    <Container>
      <span className="text-4xl">👋</span>
      <Heading className="font-black">Hello there! I&apos;m Isaac</Heading>
      <Paragraph className="max-w-xl mt-4">
        I&apos;m a <Highlight>QA engineer</Highlight> and data enthusiast focused
        on building reliable software.
      </Paragraph>
      <Paragraph className="max-w-xl mt-4">
        With over <Highlight>6 years of experience</Highlight>, I help teams
        deliver quality products through thoughtful testing and analysis.
      </Paragraph>
      <Heading
        as="h2"
        className="font-black text-lg md:text-lg lg:text-lg mt-20 mb-4"
      >
        What I&apos;ve been working on
      </Heading>
      <Products />
      <TechStack />
    </Container>
  );
}
