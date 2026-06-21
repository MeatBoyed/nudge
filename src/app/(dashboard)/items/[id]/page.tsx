import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.item.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">{item.name}</h1>
      <p className="text-sm text-muted-foreground">Stage: {item.stage}</p>
    </main>
  );
}
