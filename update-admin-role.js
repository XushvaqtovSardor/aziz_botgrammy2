// Update admin role to SUPERADMIN
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const telegramId = '6652831703';

  const admin = await prisma.admin.findUnique({
    where: { telegramId },
  });

  if (!admin) {
    console.log('❌ Admin topilmadi!');
    return;
  }

  console.log(`📝 Hozirgi role: ${admin.role}`);

  const updated = await prisma.admin.update({
    where: { telegramId },
    data: { role: 'SUPERADMIN' },
  });

  console.log(`✅ Role yangilandi: ${updated.role}`);
  console.log("Endi /admin buyrug'ini telegram'da qayta yuboring!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
