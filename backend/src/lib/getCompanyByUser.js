const prisma = require("./prisma");

async function getCompanyByUser(user) {
  if (!user?.email) return null;

  let company = await prisma.company.findFirst({
    where: {
      OR: [
        { supabaseUserId: user.id },
        { email: user.email },
      ],
    },
  });

  if (!company) return null;

  if (!company.supabaseUserId && user.id) {
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        supabaseUserId: user.id,
      },
    });
  }

  return company;
}

module.exports = getCompanyByUser;