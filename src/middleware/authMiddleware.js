const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: "unauthorized",
      message: "Akses ditolak, token tidak ditemukan",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: "forbidden",
        message: "Token tidak valid atau kadaluarsa",
      });
    }

    // Simpan data user (termasuk id_role) ke request untuk dipakai di endpoint
    req.user = user;
    next();
  });
};

// Middleware baru untuk mengecek Role
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Pastikan req.user sudah terisi oleh verifyToken sebelumnya
    if (!req.user || !req.user.id_role) {
      return res.status(401).json({
        status: "unauthorized",
        message: "Sesi tidak valid, harap login kembali",
      });
    }

    // Cek apakah id_role milik user yang sedang login ada di dalam daftar yang diizinkan
    if (!allowedRoles.includes(req.user.id_role)) {
      return res.status(403).json({
        status: "forbidden",
        message:
          "Akses ditolak, Anda tidak memiliki izin (role) untuk resource ini",
      });
    }

    // Jika role sesuai, lanjut ke controller
    next();
  };
};

module.exports = { verifyToken, checkRole };
