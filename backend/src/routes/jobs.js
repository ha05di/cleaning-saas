const express = require("express");
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");
const getCompanyByUser = require("../lib/getCompanyByUser");

const router = express.Router();

// GET /jobs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, date } = req.query;

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const where = {
      companyId: company.id,
    };

    if (status) {
      where.status = status;
    }

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);

      where.serviceDate = {
        gte: start,
        lte: end,
      };
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        customer: true,
        cleaner: true,
      },
      orderBy: [
        { serviceDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return res.json({
      ok: true,
      jobs,
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// POST /jobs
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      customerId,
      cleanerId,
      serviceDate,
      serviceTime,
      serviceType,
      address,
      notes,
    } = req.body;

    if (!customerId || !serviceDate) {
      return res.status(400).json({
        ok: false,
        error: "customerId and serviceDate are required",
      });
    }

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: Number(customerId),
        companyId: company.id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        ok: false,
        error: "Customer not found",
      });
    }

    let finalCleanerId = null;
    let finalStatus = "pending";

    if (cleanerId) {
      const cleaner = await prisma.cleaner.findFirst({
        where: {
          id: Number(cleanerId),
          companyId: company.id,
        },
      });

      if (!cleaner) {
        return res.status(404).json({
          ok: false,
          error: "Cleaner not found",
        });
      }

      finalCleanerId = Number(cleanerId);
      finalStatus = "assigned";
    }

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        customerId: Number(customerId),
        cleanerId: finalCleanerId,
        serviceDate: new Date(serviceDate),
        serviceTime,
        serviceType,
        address: address || customer.address || "",
        notes,
        status: finalStatus,
      },
      include: {
        customer: true,
        cleaner: true,
      },
    });

    return res.status(201).json({
      ok: true,
      job,
    });
  } catch (error) {
    console.error("Create job error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// PUT /jobs/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      customerId,
      cleanerId,
      serviceDate,
      serviceTime,
      serviceType,
      address,
      notes,
      status,
    } = req.body;

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const existing = await prisma.job.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: "Job not found",
      });
    }

    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: Number(customerId),
          companyId: company.id,
        },
      });

      if (!customer) {
        return res.status(404).json({
          ok: false,
          error: "Customer not found",
        });
      }
    }

    if (cleanerId) {
      const cleaner = await prisma.cleaner.findFirst({
        where: {
          id: Number(cleanerId),
          companyId: company.id,
        },
      });

      if (!cleaner) {
        return res.status(404).json({
          ok: false,
          error: "Cleaner not found",
        });
      }
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        customerId: customerId ? Number(customerId) : undefined,
        cleanerId: cleanerId ? Number(cleanerId) : null,
        serviceDate: serviceDate ? new Date(serviceDate) : undefined,
        serviceTime,
        serviceType,
        address,
        notes,
        status,
      },
      include: {
        customer: true,
        cleaner: true,
      },
    });

    return res.json({
      ok: true,
      job,
    });
  } catch (error) {
    console.error("Update job error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// PUT /jobs/:id/assign
router.put("/:id/assign", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { cleanerId } = req.body;

    if (!cleanerId) {
      return res.status(400).json({
        ok: false,
        error: "cleanerId is required",
      });
    }

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const existing = await prisma.job.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: "Job not found",
      });
    }

    const cleaner = await prisma.cleaner.findFirst({
      where: {
        id: Number(cleanerId),
        companyId: company.id,
      },
    });

    if (!cleaner) {
      return res.status(404).json({
        ok: false,
        error: "Cleaner not found",
      });
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        cleanerId: Number(cleanerId),
        status: "assigned",
      },
      include: {
        customer: true,
        cleaner: true,
      },
    });

    return res.json({
      ok: true,
      job,
    });
  } catch (error) {
    console.error("Assign job error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// PUT /jobs/:id/status
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowed = ["pending", "assigned", "completed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid status",
      });
    }

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const existing = await prisma.job.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: "Job not found",
      });
    }

    const job = await prisma.job.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        cleaner: true,
      },
    });

    return res.json({
      ok: true,
      job,
    });
  } catch (error) {
    console.error("Update job status error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// DELETE /jobs/:id
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

    const existing = await prisma.job.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: "Job not found",
      });
    }

    await prisma.job.delete({
      where: { id },
    });

    return res.json({
      ok: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// PUT /jobs/:id/reassign
router.put("/:id/reassign", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { cleanerId } = req.body;

    if (!cleanerId) {
      return res.status(400).json({
        ok: false,
        error: "Cleaner ID is required",
      });
    }

    const company = await getCompanyByUser(req.user);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Company not found",
      });
    }

    const existingJob = await prisma.job.findFirst({
      where: {
        id,
        companyId: company.id,
      },
    });

    if (!existingJob) {
      return res.status(404).json({
        ok: false,
        error: "Job not found",
      });
    }

    const cleaner = await prisma.cleaner.findFirst({
      where: {
        id: Number(cleanerId),
        companyId: company.id,
      },
    });

    if (!cleaner) {
      return res.status(404).json({
        ok: false,
        error: "Cleaner not found",
      });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        cleanerId: Number(cleanerId),
        status: "assigned",
      },
      include: {
        customer: true,
        cleaner: true,
      },
    });

    return res.json({
      ok: true,
      job: updatedJob,
    });
  } catch (error) {
    console.error("Reassign job error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;