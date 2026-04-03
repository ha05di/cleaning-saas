const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

const DAY_NAME_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const DAY_INDEX_TO_NAME = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

async function resolveCompanyAndWorkspace(req) {
  const supabaseUserId =
    req.user?.supabaseUserId ||
    req.user?.id ||
    req.auth?.sub ||
    req.headers["x-supabase-user-id"] ||
    null;

  let company = null;

  if (supabaseUserId) {
    company = await prisma.company.findFirst({
      where: {
        OR: [
          { supabaseUserId: String(supabaseUserId) },
          {
            companyUsers: {
              some: {
                supabaseUserId: String(supabaseUserId),
              },
            },
          },
        ],
      },
      include: {
        workspaces: {
          orderBy: { id: "asc" },
        },
      },
    });
  }

  if (!company) {
    company = await prisma.company.findFirst({
      include: {
        workspaces: {
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });
  }

  if (!company) {
    throw new Error("No company found");
  }

  let workspace = null;

  if (company.defaultWorkspaceId) {
    workspace =
      company.workspaces.find((w) => w.id === company.defaultWorkspaceId) || null;
  }

  if (!workspace) {
    workspace = company.workspaces[0] || null;
  }

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        companyId: company.id,
        name: company.companyName || "Main Workspace",
        isActive: true,
      },
    });
  }

  return { company, workspace };
}

function defaultHoursMap() {
  return {
    Sunday: { enabled: false, start: "09:00", end: "17:00" },
    Monday: { enabled: true, start: "09:00", end: "17:00" },
    Tuesday: { enabled: true, start: "09:00", end: "17:00" },
    Wednesday: { enabled: true, start: "09:00", end: "17:00" },
    Thursday: { enabled: true, start: "09:00", end: "17:00" },
    Friday: { enabled: true, start: "09:00", end: "17:00" },
    Saturday: { enabled: false, start: "09:00", end: "17:00" },
  };
}

router.get("/company", async (req, res) => {
  try {
    const { company, workspace } = await resolveCompanyAndWorkspace(req);

    const [settings, taxProfile, businessHours] = await Promise.all([
      prisma.workspaceSettings.findUnique({
        where: { workspaceId: workspace.id },
      }),
      prisma.workspaceTaxProfile.findUnique({
        where: { workspaceId: workspace.id },
      }),
      prisma.workspaceBusinessHour.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { dayOfWeek: "asc" },
      }),
    ]);

    const hours = defaultHoursMap();

    for (const row of businessHours) {
      const dayName = DAY_INDEX_TO_NAME[row.dayOfWeek];
      if (!dayName) continue;

      hours[dayName] = {
        enabled: row.isOpen,
        start: row.startTime || "09:00",
        end: row.endTime || "17:00",
      };
    }

    return res.json({
      ok: true,
      settings: {
        companyName:
          settings?.companyName || company.companyName || "",
        phone: settings?.phone || company.phone || "",
        website: settings?.website || "",
        email: settings?.email || company.email || "",
        street1: settings?.street1 || "",
        street2: settings?.street2 || "",
        city: settings?.city || "",
        state: settings?.state || "",
        zipCode: settings?.zipCode || "",
        country: settings?.country || "",
        timezone: settings?.timezone || company.timezone || "Asia/Phnom_Penh",
        dateFormat: settings?.dateFormat || "Jan 31, 2026",
        timeFormat: settings?.timeFormat || "24 Hour (13:30)",
        firstDayOfWeek: settings?.firstDayOfWeek || "Sunday",
        showBusinessHours:
          settings?.showBusinessHours !== undefined
            ? settings.showBusinessHours
            : true,

        taxName: taxProfile?.taxName || "",
        taxNumber: taxProfile?.taxNumber || "",
        taxRate:
          taxProfile?.taxRate !== null && taxProfile?.taxRate !== undefined
            ? String(taxProfile.taxRate)
            : "",

        businessHours: hours,
      },
    });
  } catch (error) {
    console.error("GET /settings/company failed:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to load company settings",
    });
  }
});

router.post("/company", async (req, res) => {
  try {
    const { company, workspace } = await resolveCompanyAndWorkspace(req);

    const {
      companyName = "",
      phone = "",
      website = "",
      email = "",
      street1 = "",
      street2 = "",
      city = "",
      state = "",
      zipCode = "",
      country = "",
      timezone = "Asia/Phnom_Penh",
      dateFormat = "Jan 31, 2026",
      timeFormat = "24 Hour (13:30)",
      firstDayOfWeek = "Sunday",
      showBusinessHours = true,
      taxName = "",
      taxNumber = "",
      taxRate = "",
      businessHours = {},
    } = req.body || {};

    await prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: company.id },
        data: {
          companyName: companyName || company.companyName,
          phone: phone || null,
          email: email || null,
          timezone: timezone || null,
        },
      });

      await tx.workspaceSettings.upsert({
        where: { workspaceId: workspace.id },
        create: {
          companyId: company.id,
          workspaceId: workspace.id,
          companyName: companyName || null,
          website: website || null,
          email: email || null,
          phone: phone || null,
          street1: street1 || null,
          street2: street2 || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          country: country || null,
          timezone: timezone || null,
          dateFormat: dateFormat || null,
          timeFormat: timeFormat || null,
          firstDayOfWeek: firstDayOfWeek || null,
          showBusinessHours: !!showBusinessHours,
        },
        update: {
          companyName: companyName || null,
          website: website || null,
          email: email || null,
          phone: phone || null,
          street1: street1 || null,
          street2: street2 || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          country: country || null,
          timezone: timezone || null,
          dateFormat: dateFormat || null,
          timeFormat: timeFormat || null,
          firstDayOfWeek: firstDayOfWeek || null,
          showBusinessHours: !!showBusinessHours,
        },
      });

      await tx.workspaceTaxProfile.upsert({
        where: { workspaceId: workspace.id },
        create: {
          companyId: company.id,
          workspaceId: workspace.id,
          taxName: taxName || null,
          taxNumber: taxNumber || null,
          taxRate: taxRate === "" ? null : Number(taxRate),
        },
        update: {
          taxName: taxName || null,
          taxNumber: taxNumber || null,
          taxRate: taxRate === "" ? null : Number(taxRate),
        },
      });

      await tx.workspaceBusinessHour.deleteMany({
        where: { workspaceId: workspace.id },
      });

      const hourRows = Object.entries(businessHours)
        .map(([dayName, value]) => {
          const idx = DAY_NAME_TO_INDEX[dayName];
          if (idx === undefined) return null;

          return {
            companyId: company.id,
            workspaceId: workspace.id,
            dayOfWeek: idx,
            isOpen: !!value?.enabled,
            startTime: value?.enabled ? value?.start || "09:00" : null,
            endTime: value?.enabled ? value?.end || "17:00" : null,
          };
        })
        .filter(Boolean);

      if (hourRows.length > 0) {
        await tx.workspaceBusinessHour.createMany({
          data: hourRows,
        });
      }
    });

    return res.json({
      ok: true,
      message: "Company settings saved successfully",
    });
  } catch (error) {
    console.error("POST /settings/company failed:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to save company settings",
    });
  }
});

module.exports = router;