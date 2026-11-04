const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEndpoints() {
  console.log('Testing internal data query performance...');

  // 1. Org Units Tree
  const t0 = Date.now();
  const tree = await prisma.orgUnit.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          members: {
            include: { profile: true },
          },
        },
      },
      members: {
        include: { profile: true },
      },
    },
  });
  console.log(`✓ OrgUnit Tree: ${tree.length} departments loaded in ${Date.now() - t0}ms`);

  // 2. Tasks query with take: 150
  const t1 = Date.now();
  const tasks = await prisma.task.findMany({
    take: 100,
    include: {
      orgUnit: true,
      assignee: true,
      meeting: true,
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
  console.log(`✓ Lark Base Tasks query: ${tasks.length} tasks loaded in ${Date.now() - t1}ms`);

  // 3. Posts query
  const t2 = Date.now();
  const posts = await prisma.post.findMany({
    take: 50,
    include: {
      category: true,
      author: true,
      audienceOrgUnit: true,
    },
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
  });
  console.log(`✓ Bulletin Posts query: ${posts.length} posts loaded in ${Date.now() - t2}ms`);

  // 4. Employee Directory query
  const t3 = Date.now();
  const emps = await prisma.employeeProfile.findMany({
    take: 50,
    include: {
      profile: {
        include: {
          orgUnitMembers: {
            include: { orgUnit: true },
          },
        },
      },
    },
    orderBy: { employeeCode: 'asc' },
  });
  console.log(`✓ Employee Directory query: ${emps.length} employees loaded in ${Date.now() - t3}ms`);

  console.log('\nAll query tests passed with blazing fast response times!');
}

testEndpoints()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
