const express = require("express");
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");
const getCompanyByUser = require("../lib/getCompanyByUser");

const router = express.Router();

function normalizeCustomerPayload(body = {}) {
  const street1 = body.street1?.trim() || null;
  const street2 = body.street2?.trim() || null;
  const city = body.city?.trim() || null;
  const province = body.province?.trim() || body.state?.trim() || null;
  const postalCode = body.postalCode?.trim() || null;
  const country = body.country?.trim() || null;

  const address =
    body.address?.trim() ||
    [street1, street2, [city, province].filter(Boolean).join(", "), [postalCode, country].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(" | ") ||
    null;

  return {
    name: body.name?.trim() || "",
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    companyName: body.companyName?.trim() || null,
    leadSource: body.leadSource?.trim() || null,
    address,
    street1,
    street2,
    city,
    province,
    postalCode,
    country,
    notes: body.notes?.trim() || null,
  };
}

// GET /customers
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search = "" } = req.query;
    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    const customers = await prisma.customer.findMany({
      where: {
        companyId: company.id,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
          { companyName: { contains: search, mode: "insensitive" } },
          { leadSource: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ ok: true, customers });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// GET /customers/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!customer) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }

    return res.json({ ok: true, customer });
  } catch (error) {
    console.error("Get customer detail error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// POST /customers
router.post("/", authMiddleware, async (req, res) => {
  try {
    const payload = normalizeCustomerPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        ok: false,
        error: "Customer name is required",
      });
    }

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        ...payload,
      },
    });

    return res.status(201).json({ ok: true, customer });
  } catch (error) {
    console.error("Create customer error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// PUT /customers/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = normalizeCustomerPayload(req.body);

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    const existing = await prisma.customer.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }

    if (!payload.name) {
      return res.status(400).json({
        ok: false,
        error: "Customer name is required",
      });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: payload,
    });

    return res.json({ ok: true, customer });
  } catch (error) {
    console.error("Update customer error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// DELETE /customers/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        ok: false,
        error: "Customer not found",
      });
    }

    await prisma.customer.delete({
      where: { id },
    });

    return res.json({
      ok: true,
      message: "Customer deleted successfully",
    });
  } catch (err) {
    console.error("Delete customer error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;