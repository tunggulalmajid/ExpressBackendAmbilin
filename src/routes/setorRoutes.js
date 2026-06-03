const express = require("express");
const router = express.Router();
const SetorController = require("../controller/setorController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const uploadCloud = require("../config/cloudinaryConf");

// Route: POST /api/setor
// Hanya Customer (Role 3) yang boleh mengakses
router.post(
  "/",
  verifyToken,
  checkRole([3]),
  uploadCloud.single("foto"), // 'foto' adalah key yang dikirim dari Flutter
  SetorController.ajukanSetor,
);

module.exports = router;
