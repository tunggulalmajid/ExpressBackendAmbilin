const express = require("express");
const router = express.Router();
const SubscribtionController = require("../controller/subscribtionController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const uploadCloud = require("../config/cloudinaryConf");

// 1. Ambil daftar paket subscription (Customer, Petugas, Admin)
router.get("/", verifyToken, SubscribtionController.getSubscriptions);

// 2. Buat paket subscription baru (Hanya Admin)
router.post("/", verifyToken, checkRole([1]), SubscribtionController.createSubscription);

// 3. Customer memesan paket subscription (Hanya Customer, upload bukti transfer)
router.post(
  "/purchase",
  verifyToken,
  checkRole([3]),
  uploadCloud.single("bukti_pembayaran"), // Flutter akan mengirim key file 'bukti_pembayaran'
  SubscribtionController.buySubscription
);

// 4. Lihat transaksi masuk (Hanya Admin)
router.get("/transactions", verifyToken, checkRole([1]), SubscribtionController.getTransactions);

// 5. Konfirmasi transaksi (Hanya Admin)
router.put("/transactions/:id/confirm", verifyToken, checkRole([1]), SubscribtionController.confirmTransaction);

module.exports = router;
