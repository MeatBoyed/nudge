import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suggestCategoryForItem } from "@/lib/ai/suggestCategory";

export async function POST(request: NextRequest) {
  const { name, link } = await request.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const item = await db.item.create({ data: { name, link: link ?? null } });

  // Fire-and-forget: capture must stay a single fast insert (see docs/SAD.md §5).
  // Safe only because this runs as a long-lived Node process, not a serverless function.
  void suggestCategoryForItem(item.id, item.name, item.link);

  return NextResponse.json(item, { status: 201 });
}
