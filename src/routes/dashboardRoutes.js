const express = require("express");
const router = express.Router();
const DashboardController = require("../controller/dashboardController");
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/dashboard
// Accessible by verified Admin, Petugas, and Customer accounts.
router.get("/", verifyToken, DashboardController.getDashboard);

module.exports = router;
