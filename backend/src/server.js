const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/company");
const customersRoutes = require("./routes/customers");
const cleanersRoutes = require("./routes/cleaners");
const jobsRoutes = require("./routes/jobs");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://cleaning-saas-delta.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Cleaning SaaS backend is running",
  });
});

app.use("/auth", authRoutes);
app.use("/company", companyRoutes);
app.use("/customers", customersRoutes);
app.use("/cleaners", cleanersRoutes);
app.use("/jobs", jobsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});