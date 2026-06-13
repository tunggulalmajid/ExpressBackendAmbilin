const express = require("express");
const router = express.Router();
const SetorController = require("../controller/setorController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const uploadCloud = require("../config/cloudinaryConf");

// == Rute untuk Customer (Role 3) ==

// 1. Customer mengajukan request setor sampah baru (upload foto sampah)
router.post(
  "/",
  verifyToken,
  checkRole([3]),
  uploadCloud.single("foto"), // 'foto' adalah key yang dikirim dari Flutter
  SetorController.ajukanSetor,
);

// 2. Customer melihat riwayat setorannya sendiri
router.get("/history/customer", verifyToken, checkRole([3]), SetorController.dapatkanRiwayatCustomer);

// 3. Detail order penjemputan sampah (Bisa diakses oleh role yang terautentikasi)
router.get("/:id", verifyToken, SetorController.dapatkanDetailSetor);


// == Rute untuk Petugas Lapangan (Role 2) ==

// 1. Ambil semua order aktif berstatus 'menunggu'
router.get("/active", verifyToken, checkRole([2]), SetorController.dapatkanOrderAktif);

// 2. Ambil histori penjemputan petugas
router.get("/history/petugas", verifyToken, checkRole([2]), SetorController.dapatkanRiwayatPetugas);

// 3. Klaim/proses penjemputan sampah
router.put("/:id/process", verifyToken, checkRole([2]), SetorController.prosesPenjemputan);

// 4. Selesaikan penjemputan sampah (input timbangan berat & upload bukti penjemputan)
router.put(
  "/:id/complete", 
  verifyToken, 
  checkRole([2]), 
  uploadCloud.single("foto_bukti_penjemputan"), 
  SetorController.selesaikanPenjemputan
);

module.exports = router;
