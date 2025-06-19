import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Paragraph } from "@/components/Paragraph";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Isaac Vazquez",
  description:
    "Thoughts on quality assurance, data, and civic technology.",
};

export default function Blog() {
  return (
    <Container>
      <span className="text-4xl">📝</span>
      <Heading className="font-black pb-4">Blog</Heading>
      <Paragraph className="pb-10">
        Posts on QA engineering and civic tech coming soon.
      </Paragraph>
    </Container>
  );
}
