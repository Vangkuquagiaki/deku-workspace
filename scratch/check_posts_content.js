const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    take: 10,
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    include: {
      category: true,
      author: true
    }
  });

  console.log(`Fetched ${posts.length} posts.`);
  posts.forEach((p, idx) => {
    console.log(`\n--- Post #${idx + 1} [ID: ${p.id}] ---`);
    console.log(`Title: ${p.title}`);
    console.log(`Author: ${p.author?.name}`);
    console.log(`Category: ${p.category?.name}`);
    console.log(`Body (first 120 chars): ${p.body ? p.body.substring(0, 120) : 'null'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

