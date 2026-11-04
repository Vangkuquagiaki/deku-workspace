const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fixing leave policies and orphaned leave requests...");

  // 1. Rename personal policy to remove (demo)
  await prisma.leavePolicy.updateMany({
    where: { code: 'PERSONAL' },
    data: { name: 'Nghỉ việc riêng hưởng lương (Personal Leave)' }
  });

  const policies = await prisma.leavePolicy.findMany();
  const policyMap = {};
  for (const p of policies) {
    policyMap[p.code] = p.id;
  }
  console.log("Current policy map:", policyMap);

  const annualId = policyMap['ANNUAL'];
  const sickId = policyMap['SICK'];
  const unpaidId = policyMap['UNPAID'];
  const maternityId = policyMap['MATERNITY'];
  const personalId = policyMap['PERSONAL'];

  // 2. Fetch all orphaned requests
  const validPolicyIds = Object.values(policyMap);
  const orphaned = await prisma.leaveRequest.findMany({
    where: {
      policyId: { notIn: validPolicyIds }
    },
    select: { id: true, reason: true }
  });

  console.log(`Found ${orphaned.length} orphaned requests to fix.`);

  let updatedAnnual = 0;
  let updatedSick = 0;
  let updatedPersonal = 0;
  let updatedUnpaid = 0;
  let updatedMaternity = 0;

  for (const req of orphaned) {
    let targetPolicyId = annualId;
    const r = (req.reason || "").toUpperCase();

    if (r.includes('SICK') || r.includes('ỐM')) {
      targetPolicyId = sickId;
      updatedSick++;
    } else if (r.includes('PERSONAL') || r.includes('VIỆC RIÊNG')) {
      targetPolicyId = personalId;
      updatedPersonal++;
    } else if (r.includes('UNPAID') || r.includes('KHÔNG LƯƠNG')) {
      targetPolicyId = unpaidId;
      updatedUnpaid++;
    } else if (r.includes('MATERNITY') || r.includes('THAI SẢN')) {
      targetPolicyId = maternityId;
      updatedMaternity++;
    } else {
      updatedAnnual++;
    }

    await prisma.leaveRequest.update({
      where: { id: req.id },
      data: { policyId: targetPolicyId }
    });
  }

  console.log(`Successfully fixed all orphaned leave requests:`);
  console.log(`- Annual: ${updatedAnnual}`);
  console.log(`- Sick: ${updatedSick}`);
  console.log(`- Personal: ${updatedPersonal}`);
  console.log(`- Unpaid: ${updatedUnpaid}`);
  console.log(`- Maternity: ${updatedMaternity}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

