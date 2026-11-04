const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const server = await prisma.server.findFirst({
    include: {
      profile: true,
      members: {
        include: { profile: true }
      }
    }
  });
  console.log('Server ID:', server?.id);
  console.log('Server Name:', server?.name);
  console.log('Server Owner Profile ID:', server?.profileId);
  console.log('Server Owner Profile Name:', server?.profile?.name);
  console.log('Server Owner Profile UserId:', server?.profile?.userId);

  const adminMembers = server?.members.filter(m => m.role === 'ADMIN');
  console.log('Admin members:');
  for (const m of adminMembers || []) {
    console.log(` - Member ID: ${m.id}, Profile ID: ${m.profileId}, Name: ${m.profile?.name}, UserId: ${m.profile?.userId}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

