const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const channels = await prisma.channel.findMany({
    where: { serverId: '9825609f-fc16-49e5-99ca-e2c204fdf8ec' },
    include: { orgUnit: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log('Total channels:', channels.length);
  channels.forEach((c) => {
    console.log(`- ${c.name} (${c.type}) | Org: ${c.orgUnit?.name || 'Toàn công ty'} (${c.orgUnitId})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

