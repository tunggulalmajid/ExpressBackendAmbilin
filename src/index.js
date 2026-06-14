const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan"); // 1. Import morgan
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");
require("dotenv").config();
const { runMigrations } = require("./migrations/run-migrations");

const authRoutes = require("./routes/authRoutes");
const setorRoutes = require("./routes/setorRoutes");
const profileRoutes = require("./routes/profileRoutes");
const manajemenAkunRoutes = require("./routes/manajemenAkunRoutes");
const kategoriSampahRoutes = require("./routes/kategoriSampahRoutes");
const subscribtionRoutes = require("./routes/subscribtionRoutes");
const artikelRoutes = require("./routes/artikelRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoutes);
app.use("/api/setor", setorRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/manajemen-akun", manajemenAkunRoutes);
app.use("/api/jenis-sampah", kategoriSampahRoutes);
app.use("/api/subscriptions", subscribtionRoutes);
app.use("/api/articles", artikelRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "API Ambilin Berjalan Dengan Baik",
    documentation: "/api-docs",
    route: [
      { path: "/", method: "GET" },
      { path: "/api-docs", method: "GET" },
      { path: "/api/auth/register", method: "POST" },
      { path: "/api/auth/login", method: "POST" },
      { path: "/api/auth/refresh", method: "POST" },
      { path: "/api/auth/google", method: "POST" },
      { path: "/api/auth/update-password", method: "PUT" },
      { path: "/api/auth/logout", method: "DELETE" },
      { path: "/api/setor", method: "POST" },
      { path: "/api/setor/history/customer", method: "GET" },
      { path: "/api/setor/active", method: "GET" },
      { path: "/api/setor/history/petugas", method: "GET" },
      { path: "/api/setor/:id", method: "GET" },
      { path: "/api/setor/:id/process", method: "PUT" },
      { path: "/api/setor/:id/complete", method: "PUT" },
      { path: "/api/profile", method: "GET" },
      { path: "/api/profile", method: "PUT" },
      { path: "/api/profile/photo", method: "PUT" },
      { path: "/api/manajemen-akun", method: "GET" },
      { path: "/api/manajemen-akun/:id_user", method: "GET" },
      { path: "/api/manajemen-akun", method: "POST" },
      { path: "/api/manajemen-akun/:id_user", method: "PUT" },
      { path: "/api/manajemen-akun/:id_user", method: "DELETE" },
      { path: "/api/jenis-sampah", method: "GET" },
      { path: "/api/jenis-sampah", method: "POST" },
      { path: "/api/jenis-sampah/:id_jenis_sampah", method: "PUT" },
      { path: "/api/jenis-sampah/:id_jenis_sampah", method: "DELETE" },
      { path: "/api/subscriptions", method: "GET" },
      { path: "/api/subscriptions/payment-methods", method: "GET" },
      { path: "/api/subscriptions/history", method: "GET" },
      { path: "/api/subscriptions/summary", method: "GET" },
      { path: "/api/subscriptions/:id", method: "PUT" },
      { path: "/api/subscriptions/purchase", method: "POST" },
      { path: "/api/subscriptions/transactions", method: "GET" },
      { path: "/api/subscriptions/transactions/:id/confirm", method: "PUT" },
      { path: "/api/articles/categories", method: "GET" },
      { path: "/api/articles", method: "GET" },
      { path: "/api/articles/:id", method: "GET" },
      { path: "/api/articles", method: "POST" },
      { path: "/api/articles/:id", method: "PUT" },
      { path: "/api/articles/:id", method: "DELETE" },
      { path: "/api/dashboard/admin", method: "GET" },
      { path: "/api/dashboard/customer", method: "GET" },
      { path: "/api/dashboard/petugas", method: "GET" }
    ]
  });
});

const PORT = process.env.PORT || 3000;

// Run migrations first, then start the server
runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log("======================================================");
      console.log(`Server Berjalan pada port ${PORT}`);
      console.log(`Dokumentasi Swagger http://localhost:${PORT}/api-docs`);
      console.log("======================================================");
    });
  })
  .catch((err) => {
    console.error("Gagal menjalankan migrasi database. Server tidak dapat dinyalakan:", err);
    process.exit(1);
  });
