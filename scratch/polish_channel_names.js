const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const renames = {
  'fin': 'fin-thao-luan-chung',
  'it': 'it-thao-luan-chung',
  'sales': 'sales-thao-luan-chung',
  'hr': 'hr-thao-luan-chung',
  'bdh': 'bdh-dieu-hanh-chung',
  'mkt': 'mkt-truyen-thong',
  'ops': 'ops-van-hanh-chung',
  'cs': 'cs-cham-soc-khach-hang',
  'legal': 'legal-phap-che'
};

async function main() {
  for (const [oldName, newName] of Object.entries(renames)) {
    const ch = await prisma.channel.findFirst({ where: { name: oldName } });
    if (ch) {
      await prisma.channel.update({
        where: { id: ch.id },
        data: { name: newName }
      });
      console.log(`Renamed channel "${oldName}" -> "${newName}"`);
    } else {
      console.log(`Channel "${oldName}" not found or already renamed.`);
    }
  }

  const allChannels = await prisma.channel.findMany({
    select: { id: true, name: true, type: true, orgUnitId: true }
  });
  console.log('\nFinal Channels List:');
  allChannels.forEach(c => console.log(`- [${c.type}] ${c.name} (org: ${c.orgUnitId})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());

