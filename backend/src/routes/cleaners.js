const express = require("express");
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");
const getCompanyByUser = require("../lib/getCompanyByUser");

const router = express.Router();

// GET /cleaners
router.get("/", authMiddleware, async (req, res) => {
  try {
    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const cleaners = await prisma.cleaner.findMany({
      where: {
        companyId: company.id,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      ok: true,
      cleaners,
    });
  } catch (error) {
    console.error("Get cleaners error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// POST /cleaners
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, phone, status = "active", team, notes } = req.body;

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Cleaner name is required",
      });
    }

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const cleaner = await prisma.cleaner.create({
      data: {
        companyId: company.id,
        name,
        phone,
        status,
        team,
        notes,
      },
    });

    return res.status(201).json({
      ok: true,
      cleaner,
    });
  } catch (error) {
    console.error("Create cleaner error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// PUT /cleaners/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, phone, status, team, notes } = req.body;

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const existing = await prisma.cleaner.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: "Cleaner not found",
      });
    }

    const cleaner = await prisma.cleaner.update({
      where: { id },
      data: {
        name,
        phone,
        status,
        team,
        notes,
      },
    });

    return res.json({
      ok: true,
      cleaner,
    });
  } catch (error) {
    console.error("Update cleaner error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;