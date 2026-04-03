const express = require("express");
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");
const getCompanyByUser = require("../lib/getCompanyByUser");

const router = express.Router();

function normalizeCleanerPayload(body = {}) {
  return {
    name: body.name?.trim() || "",
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    avatarUrl: body.avatarUrl?.trim() || null,
    streetAddress: body.streetAddress?.trim() || null,
    city: body.city?.trim() || null,
    province: body.province?.trim() || null,
    postalCode: body.postalCode?.trim() || null,
    country: body.country?.trim() || null,
    labourCost:
      body.labourCost === "" || body.labourCost === null || typeof body.labourCost === "undefined"
        ? null
        : Number(body.labourCost),
    role: body.role?.trim() || "Cleaner",
    status: body.status?.trim() || "active",
    team: body.team?.trim() || null,
    notes: body.notes?.trim() || null,
  };
}

// GET /cleaners
router.get("/", authMiddleware, async (req, res) => {
  try {
    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    const cleaners = await prisma.cleaner.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ ok: true, cleaners });
  } catch (error) {
    console.error("Get cleaners error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// GET /cleaners/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    const cleaner = await prisma.cleaner.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!cleaner) {
      return res.status(404).json({ ok: false, error: "Cleaner not found" });
    }

    return res.json({ ok: true, cleaner });
  } catch (error) {
    console.error("Get cleaner detail error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// POST /cleaners
router.post("/", authMiddleware, async (req, res) => {
  try {
    const payload = normalizeCleanerPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        ok: false,
        error: "Cleaner name is required",
      });
    }

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    const cleaner = await prisma.cleaner.create({
      data: {
        companyId: company.id,
        ...payload,
      },
    });

    return res.status(201).json({ ok: true, cleaner });
  } catch (error) {
    console.error("Create cleaner error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// PUT /cleaners/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = normalizeCleanerPayload(req.body);

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    const existing = await prisma.cleaner.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Cleaner not found" });
    }

    if (!payload.name) {
      return res.status(400).json({
        ok: false,
        error: "Cleaner name is required",
      });
    }

    const cleaner = await prisma.cleaner.update({
      where: { id },
      data: payload,
    });

    return res.json({ ok: true, cleaner });
  } catch (error) {
    console.error("Update cleaner error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;