const express = require("express");
const profileController = require("../controller/profileController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();
const uploadCloud = require("../config/cloudinaryConf");

router.get("/", verifyToken, profileController.getProfile);
router.put("/", verifyToken, profileController.updateProfile);
router.put(
  "/photo",
  verifyToken,
  uploadCloud.single("foto"),
  profileController.updatePhoto,
);

module.exports = router;
