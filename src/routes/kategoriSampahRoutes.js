const express = require("express");
const router = express.Router();
const jenisSampahController = require("../controller/jenisSampahController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

router.get("/", jenisSampahController.getAllJenisSampah);
router.post("/", verifyToken, checkRole([1]), jenisSampahController.create);

router.put(
  "/:id_jenis_sampah",
  verifyToken,
  checkRole([1]),
  jenisSampahController.update,
);
router.delete(
  "/:id_jenis_sampah",
  verifyToken,
  checkRole([1]),
  jenisSampahController.delete,
);

module.exports = router;
