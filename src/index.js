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
