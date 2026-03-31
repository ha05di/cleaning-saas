const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, companyName, ownerName } = req.body;

    if (!email || !password || !companyName) {
      return res.status(400).json({
        ok: false,
        error: "Email, password and companyName are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        ok: false,
        error: "User already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.company.create({
      data: {
        companyName,
        ownerName: ownerName || null,
        users: {
          create: {
            email,
            passwordHash,
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = result.users[0];

    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      message: "Register successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        companyName: result.companyName,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        companyName: user.company?.companyName || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;
