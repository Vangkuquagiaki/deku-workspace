const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CHANNEL_DEPT_MAPPING = [
  { names: ['hop-ban-giam-doc', 'bdh-chien-luoc', 'bdh'], orgUnitId: '2bdf39c6-de44-5a6f-b3f5-122a85b77ac5' },
  { names: ['hop-phong-cong-nghe', 'it-backend-ai', 'it-frontend-app', 'it'], orgUnitId: 'fad9bece-4c42-5c9b-80a9-2d4f1b2058e7' },
  { names: ['hop-phong-kinh-doanh', 'sales-hop-dong', 'sales'], orgUnitId: '59024501-80cf-5ec7-a687-1af68c7a11e2' },
  { names: ['hop-phong-nhan-su', 'hr-chinh-sach-luong', 'hr'], orgUnitId: 'e573e777-f4c4-5c4c-b667-d721241a5912' },
  { names: ['hop-phong-tai-chinh', 'fin-ngan-sach-chi', 'fin'], orgUnitId: '56577e67-98d0-5bd1-a18e-c356208d8e61' },
];

async function main() {
  for (const mapping of CHANNEL_DEPT_MAPPING) {
    for (const name of mapping.names) {
      await prisma.channel.updateMany({
        where: { name: name },
        data: { orgUnitId: mapping.orgUnitId }
      });
      console.log(`Updated channel ${name} -> ${mapping.orgUnitId}`);
    }
  }
  console.log("Channel orgUnit mapping completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

