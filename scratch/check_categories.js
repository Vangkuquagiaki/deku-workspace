const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.postCategory.findMany();
  console.log("Categories:", categories);
}

main().finally(() => prisma.$disconnect());

