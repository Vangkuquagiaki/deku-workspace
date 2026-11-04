const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const channels = await prisma.channel.findMany({
    select: { id: true, name: true, type: true, orgUnitId: true, serverId: true }
  });
  console.log('Channels in DB:');
  channels.forEach(c => console.log(`- [${c.type}] ${c.name} (orgUnitId: ${c.orgUnitId})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
