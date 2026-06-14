const jenisSampah = require("../models/jenisSampah");
const response = require("../utils/responseHelper");

const jenisSampahController = {
  // 1. GET ALL DATA (Paginated)
  getAllJenisSampah: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const parsedPage = parseInt(page) || 1;
      const parsedLimit = parseInt(limit) || 10;
      const offset = (parsedPage - 1) * parsedLimit;

      const { total, data } = await jenisSampah.getJenisSampah(parsedLimit, offset);
      return res.status(200).json({
        status: "success",
        message: "Berhasil mengambil semua jenis sampah",
        pagination: {
          total_items: total,
          total_pages: Math.ceil(total / parsedLimit),
          current_page: parsedPage,
          limit: parsedLimit
        },
        data,
      });
    } catch (error) {
      console.log("error getAllJenisSampah: " + error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 2. CREATE DATA
  create: async (req, res) => {
    try {
      const { nama, poin_per_kg } = req.body;

      if (!nama || !poin_per_kg) {
        return response.error(res, "Nama dan poin per kg wajib diisi", 400);
      }

      const result = await jenisSampah.createJenisSampah(nama, poin_per_kg);

      const responseData = {
        id: result.insertId,
        nama: nama,
        poin_per_kg,
      };

      return response.success(
        res,
        "Berhasil menambahkan jenis sampah baru",
        responseData,
        201,
      );
    } catch (error) {
      console.log("error createJenisSampah: " + error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 3. UPDATE DATA
  update: async (req, res) => {
    try {
      const id = req.params.id_jenis_sampah;
      const { nama, poin_per_kg } = req.body;

      if (!nama || !poin_per_kg) {
        return response.error(res, "Nama dan poin per kg wajib diisi", 400);
      }

      console.log(id);
      const exist = await jenisSampah.getJenisSampahById(id);
      console.log(exist);
      if (!exist) {
        return response.error(res, "Jenis sampah tidak ditemukan", 404);
      }

      await jenisSampah.updateJenisSampah(id, nama, poin_per_kg);
      const responseData = {
        id: id,
        nama: nama,
        point_per_kg: poin_per_kg,
      };
      return response.success(
        res,
        "Berhasil memperbarui data jenis sampah",
        responseData,
      );
    } catch (error) {
      console.log("error updateJenisSampah: " + error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 4. DELETE DATA (SOFT DELETE)
  delete: async (req, res) => {
    try {
      const id = req.params.id_jenis_sampah;

      const exist = await jenisSampah.getJenisSampahById(id);
      if (!exist) {
        return response.error(
          res,
          "Jenis sampah tidak ditemukan atau sudah dihapus",
          404,
        );
      }

      await jenisSampah.deleteJenisSampah(id);
      const responseData = {
        id: id,
      };
      return response.success(
        res,
        "Berhasil menghapus jenis sampah",
        responseData,
      );
    } catch (error) {
      console.log("error deleteJenisSampah: " + error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },
};

module.exports = jenisSampahController;
