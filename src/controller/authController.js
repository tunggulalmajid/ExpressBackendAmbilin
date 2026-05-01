const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

class AuthController {
  static async register(req, res) {
    try {
      const { nama, email, password } = req.body;

      if (!nama || !email || !password) {
        return res.status(400).json({
          status: "bad_request",
          message: "Semua field harus diisi",
        });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          status: "bad_request",
          message: "Email sudah terdaftar",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // HARDCODE ROLE CUSTOMER (id_role = 3)
      const id_role = 3;

      const newUserId = await User.create({
        nama,
        email,
        password: hashedPassword,
        id_role,
      });

      res.status(201).json({
        status: "success",
        message: "Registrasi customer berhasil",
        data: { userId: newUserId },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          status: "not_found",
          message: "User tidak ditemukan",
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({
          status: "bad_request",
          message: "Password salah",
        });
      }

      const payload = { id_user: user.id_user, id_role: user.id_role };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });
      const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
      });

      await User.updateRefreshToken(user.id_user, refreshToken);

      res.status(200).json({
        status: "success",
        message: "Login berhasil",
        data: {
          accessToken,
          refreshToken,
          user: {
            id_user: user.id_user,
            nama: user.nama,
            email: user.email,
            id_role: user.id_role,
          },
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(401).json({
          status: "unauthorized",
          message: "Refresh token dibutuhkan",
        });
      }

      jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET,
        async (err, decoded) => {
          if (err) {
            return res.status(403).json({
              status: "forbidden",
              message: "Refresh token tidak valid atau kadaluarsa",
            });
          }

          const user = await User.findById(decoded.id_user);
          if (!user || user.refresh_token !== token) {
            return res.status(403).json({
              status: "forbidden",
              message: "Refresh token tidak cocok",
            });
          }

          const payload = { id_user: user.id_user, id_role: user.id_role };
          const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "15m",
          });

          res.status(200).json({
            status: "success",
            message: "Token berhasil diperbarui",
            data: { accessToken: newAccessToken },
          });
        },
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }

  static async logout(req, res) {
    try {
      const userId = req.user.id_user;
      await User.updateRefreshToken(userId, null);
      res.status(200).json({
        status: "success",
        message: "Logout berhasil",
        data: null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }
}

module.exports = AuthController;
