const prisma = require("./prisma");

async function getCompanyByUser(user) {
  try {
    console.log("========== getCompanyByUser START ==========");

    // 打印 user 信息
    console.log("USER OBJECT:", JSON.stringify(user, null, 2));

    if (!user) {
      console.log("❌ No user provided");
      console.log("========== getCompanyByUser END ==========");
      return null;
    }

    if (!user.email) {
      console.log("❌ User has no email");
      console.log("========== getCompanyByUser END ==========");
      return null;
    }

    console.log("➡️ Searching company by:");
    console.log("   - user.id:", user.id);
    console.log("   - user.email:", user.email);

    // Step 1：先通过 supabaseUserId 或 email 查找
    let company = await prisma.company.findFirst({
      where: {
        OR: [
          { supabaseUserId: user.id || undefined },
          { email: user.email },
        ],
      },
    });

    console.log("🔎 Query result (company):", company);

    // Step 2：查不到就自动创建
    if (!company) {
      console.log("⚠️ Company NOT FOUND, auto-creating company...");

      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.display_name ||
        "Owner";

      const businessName =
        user.user_metadata?.business_name ||
        user.user_metadata?.company_name ||
        `${fullName}'s Company`;

      company = await prisma.company.create({
        data: {
          companyName: businessName,
          ownerName: fullName,
          email: user.email,
          timezone: "America/New_York",
          supabaseUserId: user.id || null,
        },
      });

      console.log("✅ Auto-created company:", company);
      console.log("========== getCompanyByUser END ==========");
      return company;
    }

    // Step 3：如果找到 company 但还没绑定 supabaseUserId，就补上
    if (!company.supabaseUserId && user.id) {
      console.log("⚠️ Company found but missing supabaseUserId, updating...");

      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          supabaseUserId: user.id,
        },
      });

      console.log("✅ Company updated with supabaseUserId:", company);
    }

    console.log("✅ Final company:", company);
    console.log("========== getCompanyByUser END ==========");

    return company;
  } catch (error) {
    console.error("🔥 getCompanyByUser ERROR:", error);
    console.log("========== getCompanyByUser END ==========");
    return null;
  }
}

module.exports = getCompanyByUser;