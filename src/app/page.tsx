import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Highlight } from "@/components/Highlight";
import { Paragraph } from "@/components/Paragraph";
import Image from "next/image";
import { Circles } from "@/components/Circles";

export default function Home() {
  return (
    <Container>
      <div className="relative h-40 mb-8 sm:h-60">
        <Circles />
      </div>
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
      <div className="mt-20" />
    </Container>
  );
}
