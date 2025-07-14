import { ContactContent } from "@/components/ContactContent";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Contact",
  description: "Get in touch with Isaac Vazquez. Let's discuss QA engineering, test automation, civic tech, or your next project. I'm always open to new opportunities and collaborations.",
  canonicalUrl: "/contact",
});

export default function Contact() {
  return (
    <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <ContactContent />
      </div>
    </div>
  );
}