const manajemenAkun = require("../models/manajemenAkun");
const bcrypt = require("bcryptjs");
const response = require("../utils/responseHelper");
const User = require("../models/user");

const manajemenAkunController = {
  createUserAccount: async (req, res) => {
    try {
      const { nama, email, password, id_role, nomor_telepon } = req.body;

      if (!nama || !email || !password || !id_role) {
        return response.error(
          res,
          "Nama, email, password, dan tipe user wajib diisi",
          400,
        );
      }

      const roleId = parseInt(id_role);
      if (roleId !== 2 && roleId !== 3) {
        return response.error(
          res,
          "Tipe user tidak valid. Gunakan Petugas (2) atau Customer (3)",
          400,
        );
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return response.error(res, "Email sudah terdaftar di sistem", 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await manajemenAkun.createUser({
        nama,
        email,
        password: hashedPassword,
        id_role: roleId,
        nomor_telepon: nomor_telepon || null,
      });

      let profileResult = null;

      if (roleId === 3) {
        profileResult = await manajemenAkun.insertCustomer(newUser.id_user);
      } else if (roleId === 2) {
        profileResult = await manajemenAkun.insertPetugas(newUser.id_user);
      }

      const finalResponse = {
        id_user: newUser.id_user,
        nama: newUser.nama,
        email: newUser.email,
        id_role: newUser.id_role,
        nomor_telepon: newUser.nomor_telepon,
        detail: profileResult,
      };

      return response.success(
        res,
        "Akun baru berhasil dibuat oleh Admin",
        finalResponse,
        201,
      );
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const { role, page = 1, limit = 10 } = req.query;

      // Jika role dimasukkan, validasi nilainya
      if (role !== undefined && role !== "") {
        const roleId = parseInt(role);
        if (roleId !== 2 && roleId !== 3) {
          return response.error(res, "Role tidak tersedia", 400);
        }
      }

      const parsedPage = parseInt(page) || 1;
      const parsedLimit = parseInt(limit) || 10;
      const offset = (parsedPage - 1) * parsedLimit;

      const { total, data } = await manajemenAkun.getAkun(
        role ? parseInt(role) : null,
        parsedLimit,
        offset
      );

      const formattedUsers = data.map((user) => {
        const baseData = {
          id_user: user.id_user,
          nama: user.nama,
          email: user.email,
          nomor_telepon: user.nomor_telepon,
          foto: user.foto,
          alamat: user.alamat,
          role: {
            id_role: user.id_role,
            nama_role: user.nama_role,
          },
        };

        if (user.id_role === 3) {
          baseData.customer_profile = {
            id_customer: user.id_customer,
            poin: user.poin,
            is_member: user.is_member,
            is_aktif: user.customer_aktif,
            expired_member_date: user.expired_member_date,
          };
        } else if (user.id_role === 2) {
          baseData.petugas_profile = {
            id_petugas: user.id_petugas,
            is_aktif: user.petugas_aktif,
          };
        }

        return baseData;
      });

      return res.status(200).json({
        status: "success",
        message: "Berhasil mendapatkan daftar akun",
        pagination: {
          total_items: total,
          total_pages: Math.ceil(total / parsedLimit),
          current_page: parsedPage,
          limit: parsedLimit
        },
        data: formattedUsers
      });
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  getAkunDetail: async (req, res) => {
    try {
      const { id_user } = req.params;
      const user = await manajemenAkun.findById(id_user);
      if (!user) {
        return response.error(res, "Akun tidak ditemukan", 404);
      }

      const formattedUser = {
        id_user: user.id_user,
        nama: user.nama,
        email: user.email,
        nomor_telepon: user.nomor_telepon,
        foto: user.foto,
        alamat: user.alamat,
        role: {
          id_role: user.id_role,
          nama_role: user.nama_role,
        },
      };

      if (user.id_role === 3) {
        formattedUser.customer_profile = {
          id_customer: user.id_customer,
          poin: user.poin,
          is_member: user.is_member,
          is_aktif: user.customer_aktif,
          expired_member_date: user.expired_member_date,
        };
      } else if (user.id_role === 2) {
        formattedUser.petugas_profile = {
          id_petugas: user.id_petugas,
          is_aktif: user.petugas_aktif,
        };
      }

      return response.success(res, "Berhasil mendapatkan detail akun", formattedUser);
    } catch (error) {
      console.error("error getAkunDetail:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id_user } = req.params;
      const { nama, email, nomor_telepon } = req.body;

      if (!nama || !email || !nomor_telepon) {
        return response.error(
          res,
          "Nama, email, dan nomor telepon wajib diisi",
          400,
        );
      }

      const updatedData = await manajemenAkun.updateUser({
        id_user,
        nama,
        email,
        nomor_telepon,
      });

      return response.success(
        res,
        "Data user berhasil diperbarui",
        updatedData,
        200,
      );
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id_user } = req.params;
      const { id_role } = req.body;

      if (!id_role) {
        return response.error(
          res,
          "id_role wajib disertakan di dalam request body",
          400,
        );
      }

      const deleteResult = await manajemenAkun.deleteUser(id_user, id_role);

      return response.success(
        res,
        "Akun berhasil dinonaktifkan (Soft Delete)",
        deleteResult,
        200,
      );
    } catch (error) {
      console.error(error);

      if (
        error.message.includes("tidak ditemukan") ||
        error.message.includes("tidak valid")
      ) {
        return response.error(res, error.message, 400);
      }

      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },
};

module.exports = manajemenAkunController;
