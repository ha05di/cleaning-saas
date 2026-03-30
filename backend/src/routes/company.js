const express = require("express");
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET /company
router.get("/", authMiddleware, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    });

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    return res.json({
      ok: true,
      company,
    });
  } catch (error) {
    console.error("Get company error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// PUT /company
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { companyName, ownerName, phone, email, address, timezone } = req.body;

    const updated = await prisma.company.update({
      where: { id: req.user.companyId },
      data: {
        companyName,
        ownerName,
        phone,
        email,
        address,
        timezone,
      },
    });

    return res.json({
      ok: true,
      company: updated,
    });
  } catch (error) {
    console.error("Update company error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;