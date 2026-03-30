const express = require("express");
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET /customers
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search = "" } = req.query;

    const customers = await prisma.customer.findMany({
      where: {
        companyId: req.user.companyId,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      ok: true,
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// POST /customers
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Customer name is required",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        companyId: req.user.companyId,
        name,
        phone,
        address,
        notes,
      },
    });

    return res.status(201).json({
      ok: true,
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// PUT /customers/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, phone, address, notes } = req.body;

    const existing = await prisma.customer.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: "Customer not found",
      });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        notes,
      },
    });

    return res.json({
      ok: true,
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;