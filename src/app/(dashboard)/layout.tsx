import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex gap-4 border-b p-4">
        <Link href="/">Dashboard</Link>
        <Link href="/inbox">Inbox</Link>
        <Link href="/calendar">Calendar</Link>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
