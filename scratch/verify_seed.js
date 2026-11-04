const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const meetings = await prisma.meeting.findMany({
    include: { participants: true, segments: true, recordings: true }
  });
  console.log("=== MEETINGS ===");
  for (const m of meetings) {
    console.log(`- ${m.title} [${m.code}] Status: ${m.status}, Segments: ${m.segments.length}, Participants: ${m.participants.length}`);
  }

  const glossary = await prisma.glossaryTerm.findMany();
  console.log(`=== GLOSSARY TERMS (${glossary.length}) ===`);
  for (const g of glossary) {
    console.log(`- ${g.source} -> ${g.target} (${g.lang})`);
  }

  const messages = await prisma.message.findMany({
    include: { member: { include: { profile: true } }, channel: true }
  });
  console.log(`=== MESSAGES (${messages.length}) ===`);
  for (const msg of messages) {
    console.log(`[#${msg.channel.name}] ${msg.member.profile.name}: ${msg.content}`);
  }
}

main().finally(() => prisma.$disconnect());
