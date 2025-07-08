import { ProjectsContent } from "@/components/ProjectsContent";
import { metadata } from "./metadata";

export { metadata };

export default function ProjectsPage() {
  return (
    <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ProjectsContent />
      </div>
    </div>
  );
}