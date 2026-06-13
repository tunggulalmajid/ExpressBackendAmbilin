const express = require("express");
const router = express.Router();
const ArtikelController = require("../controller/artikelController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const uploadCloud = require("../config/cloudinaryConf");

// === KATEGORI ARTIKEL ===
// 1. Ambil semua kategori artikel (Customer, Petugas, Admin)
router.get("/categories", verifyToken, ArtikelController.getCategories);

// === ARTIKEL ===
// 3. Ambil semua artikel aktif (Customer, Petugas, Admin)
router.get("/", verifyToken, ArtikelController.getAllArticles);

// 4. Ambil detail satu artikel berdasarkan ID (Customer, Petugas, Admin)
router.get("/:id", verifyToken, ArtikelController.getArticleById);

// 5. Admin menulis artikel baru (Hanya Admin, upload thumbnail)
router.post(
  "/",
  verifyToken,
  checkRole([1]),
  uploadCloud.single("foto_thumbnail"), // Key file 'foto_thumbnail'
  ArtikelController.createArticle
);

// 6. Admin memperbarui artikel (Hanya Admin, upload thumbnail bersifat opsional)
router.put(
  "/:id",
  verifyToken,
  checkRole([1]),
  uploadCloud.single("foto_thumbnail"),
  ArtikelController.updateArticle
);

// 7. Admin menghapus artikel (Hanya Admin)
router.delete("/:id", verifyToken, checkRole([1]), ArtikelController.deleteArticle);

module.exports = router;
