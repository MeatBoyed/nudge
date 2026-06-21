import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function GoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal) notFound();

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">{goal.name}</h1>
      <p className="text-sm text-muted-foreground">
        {goal.description ?? "No description yet."}
      </p>
    </main>
  );
}
