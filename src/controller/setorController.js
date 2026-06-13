const Setor = require("../models/setor");
const db = require("../config/dbConf");

const SetorController = {
  // Customer membuat request setor baru
  ajukanSetor: async (req, res) => {
    try {
      const { id_jenis_sampah, alamat, catatan, latitude, longitude } = req.body;
      const id_user = req.user.id_user; 

      if (!id_jenis_sampah) {
        return res.status(400).json({
          status: "bad_request",
          message: "Jenis sampah wajib dipilih",
        });
      }

      if (!alamat || !latitude || !longitude) {
        return res.status(400).json({
          status: "bad_request",
          message: "Alamat, latitude, dan longitude wajib diisi",
        });
      }

      const customer = await Setor.getCustomerId(id_user);
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
        id_jenis_sampah,
        alamat,
        catatan,
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
  },

  // Customer melihat riwayat setorannya sendiri (Paginated)
  dapatkanRiwayatCustomer: async (req, res) => {
    try {
      const id_user = req.user.id_user;
      const { page = 1, limit = 10 } = req.query;

      const customer = await Setor.getCustomerId(id_user);
      if (!customer) {
        return res.status(404).json({
          status: "error",
          message: "Data customer tidak ditemukan",
        });
      }

      const parsedPage = parseInt(page) || 1;
      const parsedLimit = parseInt(limit) || 10;
      const offset = (parsedPage - 1) * parsedLimit;

      const { total, data } = await Setor.getCustomerHistory(customer.id_customer, parsedLimit, offset);

      return res.status(200).json({
        status: "success",
        message: "Berhasil mengambil riwayat penjemputan customer",
        pagination: {
          total_items: total,
          total_pages: Math.ceil(total / parsedLimit),
          current_page: parsedPage,
          limit: parsedLimit
        },
        data,
      });
    } catch (error) {
      console.error("error dapatkanRiwayatCustomer:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  },

  // 1. Petugas melihat semua order penjemputan yang berstatus 'menunggu' (Paginated)
  dapatkanOrderAktif: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const parsedPage = parseInt(page) || 1;
      const parsedLimit = parseInt(limit) || 10;
      const offset = (parsedPage - 1) * parsedLimit;

      const { total, data } = await Setor.getActiveOrders(parsedLimit, offset);
      return res.status(200).json({
        status: "success",
        message: "Berhasil mengambil order aktif",
        pagination: {
          total_items: total,
          total_pages: Math.ceil(total / parsedLimit),
          current_page: parsedPage,
          limit: parsedLimit
        },
        data,
      });
    } catch (error) {
      console.error("error dapatkanOrderAktif:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  },

  // 2. Petugas melihat riwayat order yang ditanganinya (Paginated)
  dapatkanRiwayatPetugas: async (req, res) => {
    try {
      const id_user = req.user.id_user;
      const { page = 1, limit = 10 } = req.query;

      const [petugasRows] = await db.query("SELECT id_petugas FROM petugas WHERE id_user = ?", [id_user]);
      const petugas = petugasRows[0];
      if (!petugas) {
        return res.status(404).json({
          status: "error",
          message: "Profil petugas tidak ditemukan",
        });
      }

      const parsedPage = parseInt(page) || 1;
      const parsedLimit = parseInt(limit) || 10;
      const offset = (parsedPage - 1) * parsedLimit;

      const { total, data } = await Setor.getPetugasHistory(petugas.id_petugas, parsedLimit, offset);
      return res.status(200).json({
        status: "success",
        message: "Berhasil mengambil riwayat penjemputan petugas",
        pagination: {
          total_items: total,
          total_pages: Math.ceil(total / parsedLimit),
          current_page: parsedPage,
          limit: parsedLimit
        },
        data,
      });
    } catch (error) {
      console.error("error dapatkanRiwayatPetugas:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  },

  // Melihat detail satu order setor sampah
  dapatkanDetailSetor: async (req, res) => {
    try {
      const id_setor = req.params.id;
      const data = await Setor.findById(id_setor);
      if (!data) {
        return res.status(404).json({
          status: "error",
          message: "Order penjemputan sampah tidak ditemukan",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "Berhasil mengambil detail penjemputan",
        data
      });
    } catch (error) {
      console.error("error dapatkanDetailSetor:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan pada server",
      });
    }
  },

  // 3. Petugas mengklaim/memproses order penjemputan
  prosesPenjemputan: async (req, res) => {
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
  },

  // 4. Petugas menyelesaikan order (menimbang sampah & mengunggah bukti penjemputan)
  selesaikanPenjemputan: async (req, res) => {
    try {
      const id_setor = req.params.id;
      const id_user = req.user.id_user;
      const { berat_sampah } = req.body;

      if (!berat_sampah) {
        return res.status(400).json({
          status: "error",
          message: "Berat sampah (dalam kg) wajib diisi",
        });
      }

      // Bukti penjemputan wajib diunggah
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "Foto bukti penjemputan wajib diunggah",
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

      const totalPoinDiperoleh = await Setor.completeOrder(
        id_setor, 
        petugas.id_petugas, 
        parseFloat(berat_sampah), 
        req.file.path // Path dari Cloudinary
      );

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
};

module.exports = SetorController;
