const express = require("express");
const router = express.Router();
const DashboardController = require("../controller/dashboardController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

router.get("/admin", verifyToken, checkRole([1]), DashboardController.getAdminDashboard);
router.get("/customer", verifyToken, checkRole([3]), DashboardController.getCustomerDashboard);
router.get("/petugas", verifyToken, checkRole([2]), DashboardController.getPetugasDashboard);

module.exports = router;
