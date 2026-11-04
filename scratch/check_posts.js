const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.post.count();
  const sample = await prisma.post.findMany({
    take: 5,
    include: { category: true, author: true }
  });
  console.log("Post count:", count);
  console.log("Sample posts:", sample);
}

main().finally(() => prisma.$disconnect());

