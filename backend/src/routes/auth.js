const express = require("express");
const prisma = require("../lib/prisma");
const supabase = require("../lib/supabase");

const router = express.Router();

// POST /auth/bootstrap-company
router.post("/bootstrap-company", async (req, res) => {
  try {
    const { email, fullName, businessName } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "Email is required",
      });
    }

    const { data, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("Supabase listUsers error:", listError);
      return res.status(500).json({
        ok: false,
        error: "Failed to lookup Supabase user",
      });
    }

    const users = data?.users || [];
    const matchedUser = users.find((u) => u.email === email);

    if (!matchedUser) {
      return res.status(404).json({
        ok: false,
        error: "Supabase user not found",
      });
    }

    const existing = await prisma.company.findFirst({
      where: {
        OR: [
          { supabaseUserId: matchedUser.id },
          { email },
        ],
      },
    });

    if (existing) {
      const updated = await prisma.company.update({
        where: { id: existing.id },
        data: {
          email,
          supabaseUserId: existing.supabaseUserId || matchedUser.id,
          companyName: existing.companyName || businessName || "My Company",
          ownerName: existing.ownerName || fullName || "Owner",
        },
      });

      return res.json({
        ok: true,
        created: false,
        company: updated,
      });
    }

    const company = await prisma.company.create({
      data: {
        companyName: businessName || "My Company",
        ownerName: fullName || "Owner",
        email,
        supabaseUserId: matchedUser.id,
        timezone: "America/New_York",
      },
    });

    return res.status(201).json({
      ok: true,
      created: true,
      company,
    });
  } catch (error) {
    console.error("Bootstrap company error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;