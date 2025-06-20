"use client";

import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Highlight } from "@/components/Highlight";
import { Paragraph } from "@/components/Paragraph";
import { Circles } from "@/components/Circles";
// Update the import path below to the correct location of TextGenerateEffect, or remove if not available
// import { TextGenerateEffect } from "../ui/text-generate-effect";

// If you have the correct path for TextGenerateEffect, update and uncomment the imports and usage below.
// Otherwise, remove the TextGenerateEffectDemo and its usage to avoid errors.

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
        {/* You can add more content here if needed */}
        {/* Example placeholder text */}
        {/* Remove or replace this text as needed */}
        &nbsp;
      </Paragraph>
      <div className="mt-8">
        {/* TextGenerateEffectDemo removed due to missing implementation */}
      </div>
      <div className="mt-20" />
      <Paragraph className="max-w-xl mt-4">
        {/* You can add more content here if needed */}
        {/* Example content: */}
        Welcome to my website!
      </Paragraph>
      <div className="mt-8">
        {/* TextGenerateEffectDemo removed due to missing implementation */}
      </div>
      <div className="mt-20" />
    </Container>
  );
}

