import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function EnvelopePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const envelope = await db.envelope.findUnique({
    where: { id },
    include: { topUps: true },
  });
  if (!envelope) notFound();

  const allocated = envelope.topUps.reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">{envelope.name}</h1>
      <p className="text-sm text-muted-foreground">
        Allocated: {allocated}
      </p>
    </main>
  );
}
