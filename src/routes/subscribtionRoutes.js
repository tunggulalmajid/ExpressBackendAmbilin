const express = require("express");
const router = express.Router();
const SubscribtionController = require("../controller/subscribtionController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const uploadCloud = require("../config/cloudinaryConf");

// 1. Ambil daftar paket subscription (Customer, Petugas, Admin)
router.get("/", verifyToken, SubscribtionController.getSubscriptions);

// 2. Impor daftar metode pembayaran (Customer, Petugas, Admin)
router.get("/payment-methods", verifyToken, SubscribtionController.getPaymentMethods);

// Lihat histori transaksi customer (Hanya Customer)
router.get("/history", verifyToken, checkRole([3]), SubscribtionController.getCustomerHistory);

// 3. Ambil ringkasan pendapatan & member aktif (Hanya Admin)
router.get("/summary", verifyToken, checkRole([1]), SubscribtionController.getSummary);

// 4. Update paket subscription (Hanya Admin)
router.put("/:id", verifyToken, checkRole([1]), SubscribtionController.updateSubscription);

// 5. Customer memesan paket subscription (Hanya Customer, upload bukti transfer)
router.post(
  "/purchase",
  verifyToken,
  checkRole([3]),
  uploadCloud.single("bukti_pembayaran"), // Flutter akan mengirim key file 'bukti_pembayaran'
  SubscribtionController.buySubscription
);

// 6. Lihat transaksi masuk (Hanya Admin)
router.get("/transactions", verifyToken, checkRole([1]), SubscribtionController.getTransactions);

// 7. Konfirmasi transaksi (Hanya Admin)
router.put("/transactions/:id/confirm", verifyToken, checkRole([1]), SubscribtionController.confirmTransaction);

module.exports = router;
