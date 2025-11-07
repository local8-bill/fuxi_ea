import ProjectNav from "@/components/chrome/ProjectNav";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ProjectNav />
      <div>{children}</div>
    </div>
  );
}
