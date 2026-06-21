import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const categories = [
    "Groceries",
    "Furniture",
    "Clothing",
    "Home Improvement",
    "Gifts",
    "Misc",
  ];
  for (const name of categories) {
    await db.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const schedules: { name: string; offsets: number[] }[] = [
    { name: "Quick", offsets: [3, 1] },
    { name: "Standard", offsets: [30, 14, 7, 5, 3] },
    { name: "Big purchase", offsets: [60, 30, 14, 7, 3, 1] },
  ];
  for (const schedule of schedules) {
    await db.reminderSchedule.upsert({
      where: { name: schedule.name },
      update: { offsets: schedule.offsets },
      create: schedule,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
