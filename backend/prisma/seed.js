const bcrypt = require("bcrypt");
const prisma = require("../src/lib/prisma");

async function main() {
  const company = await prisma.company.create({
    data: {
      companyName: "Demo Cleaning Co",
      ownerName: "Eddie",
      phone: "123456789",
      email: "demo@cleaning.com",
      address: "New York",
      timezone: "America/New_York",
    },
  });

  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.user.create({
    data: {
      email: "admin@test.com",
      passwordHash,
      companyId: company.id,
    },
  });

  console.log("Seed completed");
  console.log("Login email: admin@test.com");
  console.log("Login password: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });