const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const servers = await prisma.server.findMany();
  console.log("Current servers:", servers);

  for (const s of servers) {
    const updated = await prisma.server.update({
      where: { id: s.id },
      data: {
        name: "Deku Workspace",
        imageUrl: "/logo.png",
      },
    });
    console.log("Updated server:", updated);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

