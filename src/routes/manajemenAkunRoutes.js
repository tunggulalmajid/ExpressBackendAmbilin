const express = require("express");
const router = express.Router();
const manajemenAkunController = require("../controller/manajemenAkunController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

router.use(verifyToken, checkRole([1]));
router.get("/", manajemenAkunController.getAllUsers);
router.get("/:id_user", manajemenAkunController.getAkunDetail);
router.post("/", manajemenAkunController.createUserAccount);
router.put("/:id_user", manajemenAkunController.updateUser);
router.delete("/:id_user", manajemenAkunController.deleteUser);

module.exports = router;
