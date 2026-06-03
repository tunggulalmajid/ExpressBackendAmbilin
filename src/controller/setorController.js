const Setor = require("../models/setor");

class SetorController {
  static async ajukanSetor(req, res) {
    try {
      const { alamat, latitude, longitude } = req.body;
      const id_user = req.user.id_user; 
      console.log(id_user);
      const customer = await Setor.getCustomerId(id_user);
      console.log(customer);
      if (!customer) {
        return res.status(404).json({
          status: "not_found",
          message: "Data customer tidak ditemukan",
        });
      }

      // 2. Cek apakah file foto berhasil diupload oleh Multer-Cloudinary
      if (!req.file) {
        return res.status(400).json({
          status: "bad_request",
          message: "Foto sampah wajib diunggah",
        });
      }

      // 3. Simpan data ke database
      const dataSetor = {
        id_customer: customer.id_customer,
        alamat,
        latitude,
        longitude,
        foto: req.file.path, // URL dari Cloudinary
      };

      const insertId = await Setor.create(dataSetor);

      res.status(201).json({
        status: "success",
        message: "Permintaan setor sampah berhasil dikirim",
        data: {
          id_setor: insertId,
          foto_url: req.file.path,
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
}

module.exports = SetorController;
