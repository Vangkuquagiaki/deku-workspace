const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SERVER_ID = '9825609f-fc16-49e5-99ca-e2c204fdf8ec';
const CURRENT_USER_PROFILE_ID = '0088f287-0409-4990-9b6d-6530103510b9';

async function main() {
  console.log('--- SEEDING ENTERPRISE DEPARTMENT ROOMS & CHANNELS ---');

  const orgUnits = await prisma.orgUnit.findMany({
    where: { type: 'DEPARTMENT' },
  });
  const orgMap = new Map();
  orgUnits.forEach((u) => {
    orgMap.set(u.code, u.id);
  });

  const deptRooms = [
    // Ban Giám Đốc
    { name: 'hop-ban-giam-doc', type: 'VIDEO', orgUnitCode: 'BDH' },
    { name: 'bdh-chien-luoc', type: 'TEXT', orgUnitCode: 'BDH' },
    // Công nghệ thông tin (IT)
    { name: 'hop-phong-cong-nghe', type: 'VIDEO', orgUnitCode: 'IT' },
    { name: 'it-backend-ai', type: 'TEXT', orgUnitCode: 'IT' },
    { name: 'it-frontend-app', type: 'TEXT', orgUnitCode: 'IT' },
    // Kinh doanh (SALES)
    { name: 'hop-phong-kinh-doanh', type: 'VIDEO', orgUnitCode: 'SALES' },
    { name: 'sales-hop-dong', type: 'TEXT', orgUnitCode: 'SALES' },
    // Nhân sự (HR)
    { name: 'hop-phong-nhan-su', type: 'VIDEO', orgUnitCode: 'HR' },
    { name: 'hr-chinh-sach-luong', type: 'TEXT', orgUnitCode: 'HR' },
    // Tài chính - Kế toán (FIN)
    { name: 'hop-phong-tai-chinh', type: 'VIDEO', orgUnitCode: 'FIN' },
    { name: 'fin-ngan-sach-chi', type: 'TEXT', orgUnitCode: 'FIN' },
  ];

  const existingChannels = await prisma.channel.findMany({
    where: { serverId: SERVER_ID },
    select: { name: true, type: true },
  });
  const existingSet = new Set(existingChannels.map((c) => `${c.name}:${c.type}`));

  let added = 0;
  for (const r of deptRooms) {
    const key = `${r.name}:${r.type}`;
    if (!existingSet.has(key)) {
      const orgUnitId = orgMap.get(r.orgUnitCode) || null;
      await prisma.channel.create({
        data: {
          name: r.name,
          type: r.type,
          serverId: SERVER_ID,
          profileId: CURRENT_USER_PROFILE_ID,
          orgUnitId: orgUnitId,
        },
      });
      console.log(`✓ Created channel: #${r.name} (${r.type}) for OrgUnit: ${r.orgUnitCode}`);
      added++;
    }
  }

  console.log(`Finished: Added ${added} new department rooms.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

