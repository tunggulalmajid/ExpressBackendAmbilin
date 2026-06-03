const User = require("../models/user");
const response = require("../utils/responseHelper");

const profileController = {
  getProfile: async (req, res) => {
    try {
      const idUser = req.user.id_user;
      const idRole = req.user.id_role;

      const userData = await User.findById(idUser);
      if (!userData) {
        return response.error(res, "User tidak ditemukan", 404);
      }

      const responseData = {
        id_user: userData.id_user,
        nama: userData.nama,
        email: userData.email,
        id_role: userData.id_role,
        foto: userData.foto,
        alamat: userData.alamat,
        nomor_telepon: userData.nomor_telepon,
        latitude: userData.latitude,
        longitude: userData.longitude,
      };

      if (idRole === 3) {
        const customerData = await User.findCustomerByIdUser(idUser);
        if (customerData) {
          responseData.customer_profile = {
            id_customer: customerData.id_customer,
            poin: customerData.poin,
            is_member: customerData.is_member,
            is_aktif: customerData.is_aktif,
            expired_member_date: customerData.expired_member_date,
          };
        }
      } else if (idRole === 2) {
        const petugasData = await User.findPetugasByIdUser(idUser);
        if (petugasData) {
          responseData.petugas_profile = {
            id_petugas: petugasData.id_petugas,
            is_aktif: petugasData.is_aktif,
          };
        }
      } else if (idRole === 1) {
        const adminData = await User.findAdminByIdUser(idUser);
        if (adminData) {
          responseData.admin_profile = {
            id_admin: adminData.id_admin,
          };
        }
      }

      return response.success(
        res,
        "Berhasil mendapatkan data profil",
        responseData,
        200,
      );
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  updateProfile: async (req, res) => {
    try {
      const idUser = req.user.id_user;
      const { nama, nomor_telepon, alamat, latitude, longitude } = req.body;

      const currentProfile = await User.findById(idUser);
      if (!currentProfile) {
        return response.error(res, "User tidak ditemukan", 404);
      }

      const dataToUpdate = {
        nama: nama || currentProfile.nama,
        nomor_telepon: nomor_telepon || currentProfile.nomor_telepon,
        alamat: alamat || currentProfile.alamat,
        latitude: latitude || currentProfile.latitude,
        longitude: longitude || currentProfile.longitude,
      };

      await User.updateProfileData(idUser, dataToUpdate);

      return response.success(
        res,
        "Profil berhasil diperbarui",
        dataToUpdate,
        200,
      );
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  updatePhoto: async (req, res) => {
    try {
      const idUser = req.user.id_user;

      // Validasi apakah ada file yang diunggah dari Multer (Cloudinary)
      if (!req.file) {
        return response.error(res, "File foto wajib diunggah", 400);
      }

      // Ambil URL aman hasil upload Cloudinary
      const fotoUrl = req.file.path;

      // Update kolom foto di database
      await User.updateProfilePhoto(idUser, fotoUrl);

      return response.success(
        res,
        "Foto profil berhasil diperbarui",
        { foto: fotoUrl },
        200,
      );
    } catch (error) {
      console.error(error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },
};

module.exports = profileController;
