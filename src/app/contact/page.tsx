import { Container } from "@/components/Container";
import { Heading } from "@/components/Heading";
import { Paragraph } from "@/components/Paragraph";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Isaac Vazquez",
  description: "Get in touch with Isaac Vazquez",
};

export default function Contact() {
  return (
    <Container>
      <span className="text-4xl">✉️</span>
      <Heading className="font-black mb-2">Contact Me</Heading>
      <Paragraph className="mb-10 max-w-xl">
        Feel free to reach out via{" "}
        <a
          className="text-blue-600 underline"
          href="https://www.linkedin.com/in/isaac-vazquez"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        .
      </Paragraph>
    </Container>
  );
}
