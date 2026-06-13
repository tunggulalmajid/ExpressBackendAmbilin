const express = require("express");
const AuthController = require("../controller/authController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refreshToken);
router.delete("/logout", verifyToken, AuthController.logout);

// Fitur Google Auth & Update Password
router.post("/google", AuthController.googleLogin);
router.put("/update-password", verifyToken, AuthController.updatePassword);

module.exports = router;
