const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const m = await prisma.meeting.findMany({
    include: { participants: true, recordings: true, segments: true },
  });
  const t = await prisma.glossaryTerm.findMany();
  console.log('Meetings count:', m.length, 'Glossary count:', t.length);
  m.forEach((meeting, idx) => {
    console.log(`[${idx}] ${meeting.code} - ${meeting.title} - Status: ${meeting.status} - Segments: ${meeting.segments.length} - Recordings: ${meeting.recordings.length}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
