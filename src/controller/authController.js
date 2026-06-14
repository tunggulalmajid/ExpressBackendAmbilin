const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const response = require("../utils/responseHelper");
const db = require("../config/dbConf");
const https = require("https");
const { checkExpiredMemberships } = require("../utils/membershipHelper");
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
      await checkExpiredMemberships();
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
        expiresIn: "2d",
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
            expiresIn: "2d",
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

  googleLogin: async (req, res) => {
    try {
      await checkExpiredMemberships();
      const { idToken } = req.body;
      if (!idToken) {
        return response.error(res, "ID Token Google/Firebase wajib dikirim", 400);
      }

      // 1. Decode token to get 'kid' and 'iss'
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || !decoded.header || !decoded.header.kid) {
        return response.error(res, "Format ID Token tidak valid", 400);
      }
      const kid = decoded.header.kid;
      const payloadDecoded = decoded.payload || {};
      const iss = payloadDecoded.iss;
      const isGoogleDirect = iss === "https://accounts.google.com" || iss === "accounts.google.com";

      // 2. Fetch Google's public certificates dynamically based on issuer
      const certUrl = isGoogleDirect
        ? "https://www.googleapis.com/oauth2/v1/certs"
        : "https://www.googleapis.com/robot/v1/metadata/x509/securetoken-system@system.gserviceaccount.com";

      const getGoogleCerts = () => {
        return new Promise((resolve, reject) => {
          https.get(certUrl, (apiRes) => {
            let data = "";
            apiRes.on("data", (chunk) => { data += chunk; });
            apiRes.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            });
          }).on("error", (e) => { reject(e); });
        });
      };

      const certs = await getGoogleCerts();
      const cert = certs[kid];
      if (!cert) {
        return response.error(res, "Sertifikat publik Google tidak cocok dengan token", 400);
      }

      // 3. Verify JWT with certificates
      const projectId = process.env.FIREBASE_PROJECT_ID;
      if (!projectId) {
        return response.error(res, "Konfigurasi FIREBASE_PROJECT_ID belum diset di server", 500);
      }

      let payload;
      try {
        if (isGoogleDirect) {
          payload = jwt.verify(idToken, cert, {
            issuer: ["https://accounts.google.com", "accounts.google.com"],
            algorithms: ["RS256"]
          });
        } else {
          payload = jwt.verify(idToken, cert, {
            audience: projectId,
            issuer: `https://securetoken.google.com/${projectId}`,
            algorithms: ["RS256"]
          });
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        return response.error(res, "ID Token tidak valid atau kadaluarsa", 401);
      }

      const email = payload.email;
      const nama = payload.name || email.split("@")[0];
      const foto = payload.picture || null;

      if (!email) {
        return response.error(res, "Email tidak ditemukan di token Google", 400);
      }

      // 4. Cari atau Buat User
      let user = await User.findByEmail(email);
      let isNewUser = false;

      if (!user) {
        // REGISTER USER BARU VIA GOOGLE
        isNewUser = true;
        const salt = await bcrypt.genSalt(10);
        // Generate random secure password since they log in via Google
        const randomPassword = Math.random().toString(36) + Date.now().toString();
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user = await User.create({
          nama,
          email,
          password: hashedPassword,
          id_role: 3 // Default Customer
        });

        // Simpan avatar Google jika tersedia
        if (foto) {
          await User.updateProfilePhoto(user.id_user, foto);
        }

        // Buat profile customer
        await User.createCustomerProfile(user.id_user);
      }

      // 5. GENERATE BACKEND TOKENS
      const jwtPayload = { id_user: user.id_user, id_role: user.id_role };
      const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
        expiresIn: "2d",
      });
      const refreshToken = jwt.sign(jwtPayload, process.env.JWT_REFRESH_SECRET, {
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
        isNewUser
      };

      return response.success(res, isNewUser ? "Registrasi & Login Google berhasil" : "Login Google berhasil", responseData, 200);
    } catch (error) {
      console.error("Error googleLogin:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { password_lama, password_baru, konfirmasi_password } = req.body;
      const id_user = req.user.id_user;

      if (!password_lama || !password_baru || !konfirmasi_password) {
        return response.error(res, "Semua field sandi wajib diisi", 400);
      }

      if (password_baru !== konfirmasi_password) {
        return response.error(res, "Konfirmasi password baru tidak cocok", 400);
      }

      if (password_baru.length < 6) {
        return response.error(res, "Password baru minimal 6 karakter", 400);
      }

      // Ambil user untuk mendapatkan password ter-hash saat ini
      const user = await User.findById(id_user);
      if (!user) {
        return response.error(res, "User tidak ditemukan", 404);
      }

      // Verifikasi password lama
      const isMatch = await bcrypt.compare(password_lama, user.password);
      if (!isMatch) {
        return response.error(res, "Password lama salah", 400);
      }

      // Hash password baru
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password_baru, salt);

      // Simpan password baru ke database
      await db.query("UPDATE user SET password = ? WHERE id_user = ?", [hashedPassword, id_user]);

      return response.success(res, "Password berhasil diperbarui", null, 200);
    } catch (error) {
      console.error("Error updatePassword:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },
};

module.exports = AuthController;
