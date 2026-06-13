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

// == Rute untuk Petugas Lapangan (Role 2) ==

// 1. Ambil semua order aktif berstatus 'menunggu'
router.get("/active", verifyToken, checkRole([2]), SetorController.dapatkanOrderAktif);

// 2. Ambil histori penjemputan petugas
router.get("/history/petugas", verifyToken, checkRole([2]), SetorController.dapatkanRiwayatPetugas);

// 3. Klaim/proses penjemputan sampah
router.put("/:id/process", verifyToken, checkRole([2]), SetorController.prosesPenjemputan);

// 4. Selesaikan penjemputan sampah (input timbangan berat)
router.put("/:id/complete", verifyToken, checkRole([2]), SetorController.selesaikanPenjemputan);

module.exports = router;
