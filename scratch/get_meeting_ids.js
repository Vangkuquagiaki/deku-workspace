const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.meeting.findMany({ select: { id: true, code: true, title: true } })
  .then(rows => console.log(JSON.stringify(rows, null, 2)))
  .finally(() => p.$disconnect());
