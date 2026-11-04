const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const server = await prisma.server.findFirst({
    include: {
      channels: true,
      members: {
        include: { profile: true }
      }
    }
  });
  console.log('Server found:', server?.name);
  console.log('Channels count:', server?.channels?.length);
  console.log('Members count:', server?.members?.length);
  const nullProfiles = server?.members.filter(m => !m.profile);
  console.log('Members with null profile:', nullProfiles?.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
