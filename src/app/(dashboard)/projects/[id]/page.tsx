import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">{project.name}</h1>
      <p className="text-sm text-muted-foreground">
        {project.description ?? "No description yet."}
      </p>
    </main>
  );
}
