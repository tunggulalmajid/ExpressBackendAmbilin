const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const response = require("../utils/responseHelper");
require("dotenv").config();

const AuthController = {
  register: async (req, res) => {
    try {
      const { nama, email, password } = req.body;

      if (!nama || !email || !password) {
        return response.error(res, "Semua field harus diisi", 400);
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return response.error(res, "Email sudah terdaftar", 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const id_role = 3;

      const newUser = await User.create({
        nama,
        email,
        password: hashedPassword,
        id_role,
      });

      const customer = await User.createCustomerProfile(newUser.id_user);

      const responseData = {
        id_user: newUser.id_user,
        nama: newUser.nama,
        email: newUser.email,
        id_role: newUser.id_role,
        customer_profile: {
          id_customer: customer.id_customer,
          poin: 0,
          is_member: false,
          is_aktif: customer.id_aktif,
        },
      };

      return response.success(
        res,
        "Registrasi customer berhasil",
        responseData,
        201,
      );
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return response.error(res, "User tidak ditemukan", 404);
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return response.error(res, "Password salah", 400);
      }

      const payload = { id_user: user.id_user, id_role: user.id_role };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
      });

      await User.updateRefreshToken(user.id_user, refreshToken);
      const customer = await User.findCustomerByIdUser(user.id_user);

      const responseData = {
        accessToken,
        refreshToken,
        user: {
          id_user: user.id_user,
          nama: user.nama,
          email: user.email,
          id_role: user.id_role,
        },
        customer: customer
          ? {
              id_customer: customer.id_customer,
              poin: customer.poin,
              is_member: customer.is_member,
            }
          : null,
      };

      return response.success(res, "Login berhasil", responseData, 200);
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  

  refreshToken: async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return response.error(res, "Refresh token dibutuhkan", 401);
      }

      jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET,
        async (err, decoded) => {
          if (err) {
            return response.error(
              res,
              "Refresh token tidak valid atau kadaluarsa",
              403,
            );
          }

          const user = await User.findById(decoded.id_user);
          if (!user || user.refresh_token !== token) {
            return response.error(res, "Refresh token tidak cocok", 403);
          }

          const payload = { id_user: user.id_user, id_role: user.id_role };
          const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "15m",
          });

          return response.success(
            res,
            "Token berhasil diperbarui",
            { accessToken: newAccessToken },
            200,
          );
        },
      );
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  logout: async (req, res) => {
    try {
      const userId = req.user.id_user;
      await User.updateRefreshToken(userId, null);

      return response.success(res, "Logout berhasil", null, 200);
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },
};

module.exports = AuthController;
