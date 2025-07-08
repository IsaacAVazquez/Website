import About from "@/components/About";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "About",
  description: "Learn more about Isaac Vazquez - QA engineer, civic tech advocate, and data enthusiast. Discover my journey, skills, and passion for building reliable software.",
});

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <About />
      </div>
    </div>
  );
}
