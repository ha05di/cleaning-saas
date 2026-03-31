const express = require("express");
const prisma = require("../lib/prisma");

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

    const existing = await prisma.company.findFirst({
      where: { email },
    });

    if (existing) {
      return res.json({
        ok: true,
        created: false,
        company: existing,
      });
    }

    const company = await prisma.company.create({
      data: {
        companyName: businessName || "My Company",
        ownerName: fullName || "Owner",
        email,
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