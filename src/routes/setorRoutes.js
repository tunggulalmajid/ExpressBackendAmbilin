const express = require("express");
const router = express.Router();
const SetorController = require("../controller/setorController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const uploadCloud = require("../config/cloudinaryConf");

router.post(
  "/",
  verifyToken,
  checkRole([3]),
  uploadCloud.single("foto"),
  SetorController.ajukanSetor,
);

router.get(
  "/history/customer",
  verifyToken,
  checkRole([3]),
  SetorController.dapatkanRiwayatCustomer,
);

router.get(
  "/active",
  verifyToken,
  checkRole([2]),
  SetorController.dapatkanOrderAktif,
);

router.get(
  "/history/petugas",
  verifyToken,
  checkRole([2]),
  SetorController.dapatkanRiwayatPetugas,
);

router.get("/:id", verifyToken, SetorController.dapatkanDetailSetor);

router.put(
  "/:id/process",
  verifyToken,
  checkRole([2]),
  SetorController.prosesPenjemputan,
);

router.put(
  "/:id/complete",
  verifyToken,
  checkRole([2]),
  uploadCloud.single("foto_bukti_penjemputan"),
  SetorController.selesaikanPenjemputan,
);

module.exports = router;
