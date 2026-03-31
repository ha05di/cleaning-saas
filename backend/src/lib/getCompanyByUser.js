const prisma = require("./prisma");

async function getCompanyByUser(user) {
  if (!user?.id) return null;

  const company = await prisma.company.findFirst({
    where: {
      supabaseUserId: user.id,
    },
  });

  return company;
}

module.exports = getCompanyByUser;