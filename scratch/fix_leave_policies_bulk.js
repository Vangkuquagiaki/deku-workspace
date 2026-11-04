const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting bulk fix for leave policies and requests...");

  await prisma.leavePolicy.updateMany({
    where: { code: 'PERSONAL' },
    data: { name: 'Nghỉ việc riêng hưởng lương (Personal Leave)' }
  });

  const policies = await prisma.leavePolicy.findMany();
  const policyMap = {};
  for (const p of policies) {
    policyMap[p.code] = p.id;
  }
  const validPolicyIds = Object.values(policyMap);

  // 1. Bulk update SICK
  const resSick = await prisma.leaveRequest.updateMany({
    where: {
      policyId: { notIn: validPolicyIds },
      OR: [
        { reason: { contains: 'SICK', mode: 'insensitive' } },
        { reason: { contains: 'ốm', mode: 'insensitive' } }
      ]
    },
    data: { policyId: policyMap['SICK'] }
  });
  console.log(`Updated SICK requests: ${resSick.count}`);

  // 2. Bulk update PERSONAL
  const resPersonal = await prisma.leaveRequest.updateMany({
    where: {
      policyId: { notIn: validPolicyIds },
      OR: [
        { reason: { contains: 'PERSONAL', mode: 'insensitive' } },
        { reason: { contains: 'việc riêng', mode: 'insensitive' } }
      ]
    },
    data: { policyId: policyMap['PERSONAL'] }
  });
  console.log(`Updated PERSONAL requests: ${resPersonal.count}`);

  // 3. Bulk update UNPAID
  const resUnpaid = await prisma.leaveRequest.updateMany({
    where: {
      policyId: { notIn: validPolicyIds },
      OR: [
        { reason: { contains: 'UNPAID', mode: 'insensitive' } },
        { reason: { contains: 'không lương', mode: 'insensitive' } }
      ]
    },
    data: { policyId: policyMap['UNPAID'] }
  });
  console.log(`Updated UNPAID requests: ${resUnpaid.count}`);

  // 4. Bulk update MATERNITY
  const resMaternity = await prisma.leaveRequest.updateMany({
    where: {
      policyId: { notIn: validPolicyIds },
      OR: [
        { reason: { contains: 'MATERNITY', mode: 'insensitive' } },
        { reason: { contains: 'thai sản', mode: 'insensitive' } }
      ]
    },
    data: { policyId: policyMap['MATERNITY'] }
  });
  console.log(`Updated MATERNITY requests: ${resMaternity.count}`);

  // 5. Remaining all go to ANNUAL
  const resAnnual = await prisma.leaveRequest.updateMany({
    where: {
      policyId: { notIn: validPolicyIds }
    },
    data: { policyId: policyMap['ANNUAL'] }
  });
  console.log(`Updated ANNUAL requests: ${resAnnual.count}`);

  // Verification
  const remainingOrphaned = await prisma.leaveRequest.count({
    where: {
      policyId: { notIn: validPolicyIds }
    }
  });
  console.log(`Remaining orphaned leave requests: ${remainingOrphaned} (Expected: 0)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

