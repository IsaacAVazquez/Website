import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Highlight } from "@/components/Highlight";
import { Paragraph } from "@/components/Paragraph";
import { Metadata } from "next";
import About from "@/components/About";

export const metadata: Metadata = {
  title: "About | Isaac Vazquez",
  description:
    "Learn more about Isaac Vazquez, a QA engineer and civic tech enthusiast.",
};

export default function AboutPage() {
  return (
    <Container>
      <About />
    </Container>
  );
}
