const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany();
  console.log('Existing Profiles:', JSON.stringify(profiles, null, 2));
  const servers = await prisma.server.findMany({
    include: { channels: true, members: true }
  });
  console.log('Existing Servers:', JSON.stringify(servers, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
