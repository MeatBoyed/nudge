import { connection } from "next/server";
import { db } from "@/lib/db";

export default async function InboxPage() {
  await connection();
  const items = await db.item.findMany({
    where: { stage: "CAPTURED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-6 space-y-2">
      <h1 className="text-xl font-semibold">Inbox</h1>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
