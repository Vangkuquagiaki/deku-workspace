const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const servers = await prisma.server.findMany();
  console.log("SERVERS:", servers);
}

main().finally(() => prisma.$disconnect());

