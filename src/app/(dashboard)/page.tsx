import { connection } from "next/server";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  await connection();
  const inboxCount = await db.item.count({ where: { stage: "CAPTURED" } });

  return (
    <main className="p-6 space-y-2">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p>Inbox: {inboxCount} item(s) waiting to be cleaned.</p>
      <p className="text-sm text-muted-foreground">
        Upcoming/Overdue coming soon.
      </p>
    </main>
  );
}
