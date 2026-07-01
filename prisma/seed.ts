// NestKeep — Database Seed
// Rule 14: Default accounts for a new household

import { PrismaClient, SyncStatus } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_ACCOUNTS = [
  { name: "Joint",     icon: "users",        color: "#0A63E0", sortOrder: 0 },
  { name: "Rent",      icon: "home",         color: "#479CFC", sortOrder: 1 },
  { name: "Business",  icon: "briefcase",    color: "#084FC0", sortOrder: 2 },
  { name: "Personal",  icon: "user",         color: "#22C55E", sortOrder: 3 },
  { name: "Mom",       icon: "heart",        color: "#F59E0B", sortOrder: 4 },
  { name: "Groceries", icon: "shopping-cart",color: "#EF4444", sortOrder: 5 },
  { name: "Change",    icon: "coins",        color: "#7C3AED", sortOrder: 6 },
];

async function main() {
  console.log("Seeding database...");

  const household = await prisma.household.create({
    data: {
      name: "My Household",
      currency: "MWK",
      syncStatus: SyncStatus.SYNCED,
      settings: {
        create: {
          currency: "MWK",
          currencySymbol: "MK",
          syncStatus: SyncStatus.SYNCED,
        },
      },
    },
  });

  console.log(`Created household: ${household.id}`);

  await prisma.account.createMany({
    data: DEFAULT_ACCOUNTS.map((account) => ({
      ...account,
      householdId: household.id,
      syncStatus: SyncStatus.SYNCED,
    })),
  });

  console.log(`Created ${DEFAULT_ACCOUNTS.length} default accounts.`);
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
