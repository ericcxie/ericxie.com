import SectionHeader from "@/components/Sections/SectionHeader";
import ProjectCarousel from "@/components/ui/ProjectCarousel";
import { getFeaturedProjects } from "@/lib/projects";

export default function Projects() {
  return (
    <>
      <SectionHeader title="Projects" href="/projects" />
      <ProjectCarousel projects={getFeaturedProjects()} />
    </>
  );
}
