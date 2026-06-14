const express = require("express");
const router = express.Router();
const ArtikelController = require("../controller/artikelController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const uploadCloud = require("../config/cloudinaryConf");

router.get("/categories", verifyToken, ArtikelController.getCategories);

router.get("/", verifyToken, ArtikelController.getAllArticles);

router.get("/:id", verifyToken, ArtikelController.getArticleById);

router.post(
  "/",
  verifyToken,
  checkRole([1]),
  uploadCloud.single("foto_thumbnail"),
  ArtikelController.createArticle,
);

router.put(
  "/:id",
  verifyToken,
  checkRole([1]),
  uploadCloud.single("foto_thumbnail"),
  ArtikelController.updateArticle,
);

router.delete(
  "/:id",
  verifyToken,
  checkRole([1]),
  ArtikelController.deleteArticle,
);

module.exports = router;
