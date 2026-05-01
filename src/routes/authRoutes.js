const express = require("express");
const AuthController = require("../controller/authController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Panggil method dari class AuthController
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refreshToken);
router.delete("/logout", verifyToken, AuthController.logout);

module.exports = router;
