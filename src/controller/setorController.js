const Setor = require("../models/setor");
const db = require("../config/dbConf");

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

  // 1. Petugas melihat semua order penjemputan yang berstatus 'menunggu'
  static async dapatkanOrderAktif(req, res) {
    try {
      const data = await Setor.getActiveOrders();
      return res.status(200).json({
        status: "success",
        message: "Berhasil mengambil order aktif",
        data,
      });
    } catch (error) {
      console.error("error dapatkanOrderAktif:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }

  // 2. Petugas melihat riwayat order yang ditanganinya
  static async dapatkanRiwayatPetugas(req, res) {
    try {
      const id_user = req.user.id_user;

      const [petugasRows] = await db.query("SELECT id_petugas FROM petugas WHERE id_user = ?", [id_user]);
      const petugas = petugasRows[0];
      if (!petugas) {
        return res.status(404).json({
          status: "error",
          message: "Profil petugas tidak ditemukan",
        });
      }

      const data = await Setor.getPetugasHistory(petugas.id_petugas);
      return res.status(200).json({
        status: "success",
        message: "Berhasil mengambil riwayat penjemputan petugas",
        data,
      });
    } catch (error) {
      console.error("error dapatkanRiwayatPetugas:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }

  // 3. Petugas mengklaim/memproses order penjemputan
  static async prosesPenjemputan(req, res) {
    try {
      const id_setor = req.params.id;
      const id_user = req.user.id_user;

      const [petugasRows] = await db.query("SELECT id_petugas FROM petugas WHERE id_user = ?", [id_user]);
      const petugas = petugasRows[0];
      if (!petugas) {
        return res.status(404).json({
          status: "error",
          message: "Profil petugas tidak ditemukan",
        });
      }

      const isProcessed = await Setor.processOrder(id_setor, petugas.id_petugas);
      if (!isProcessed) {
        return res.status(400).json({
          status: "error",
          message: "Order tidak dapat diproses (mungkin sudah diklaim petugas lain atau status tidak valid)",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Order penjemputan berhasil diklaim, silakan menuju lokasi customer",
        data: { id_setor_sampah: id_setor }
      });
    } catch (error) {
      console.error("error prosesPenjemputan:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  }

  // 4. Petugas menyelesaikan order (menimbang sampah & kalkulasi poin)
  static async selesaikanPenjemputan(req, res) {
    try {
      const id_setor = req.params.id;
      const id_user = req.user.id_user;
      const { items } = req.body; // [{ id_jenis_sampah, berat_sampah }]

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Rincian barang timbangan sampah wajib dikirimkan",
        });
      }

      const [petugasRows] = await db.query("SELECT id_petugas FROM petugas WHERE id_user = ?", [id_user]);
      const petugas = petugasRows[0];
      if (!petugas) {
        return res.status(404).json({
          status: "error",
          message: "Profil petugas tidak ditemukan",
        });
      }

      const totalPoinDiperoleh = await Setor.completeOrder(id_setor, petugas.id_petugas, items);

      return res.status(200).json({
        status: "success",
        message: "Order penjemputan selesai diproses dan poin reward telah dikirim ke customer",
        data: {
          id_setor_sampah: id_setor,
          total_poin_diperoleh: totalPoinDiperoleh
        }
      });
    } catch (error) {
      console.error("error selesaikanPenjemputan:", error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Terjadi kesalahan pada server",
      });
    }
  }
}

module.exports = SetorController;
