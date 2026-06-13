const Subscribtion = require("../models/subscribtion");
const response = require("../utils/responseHelper");
const db = require("../config/dbConf");

const SubscribtionController = {
  // 1. Ambil paket-paket subscription
  getSubscriptions: async (req, res) => {
    try {
      const data = await Subscribtion.getAll();
      return response.success(res, "Berhasil mengambil paket subscription", data);
    } catch (error) {
      console.error("error getSubscriptions:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 2. Admin membuat paket subscription baru
  createSubscription: async (req, res) => {
    try {
      const { nama, harga, poin } = req.body;
      if (!nama || !harga || poin === undefined) {
        return response.error(res, "Nama, harga, dan poin wajib diisi", 400);
      }

      const newSub = await Subscribtion.create({ nama, harga, poin });
      return response.success(res, "Berhasil membuat paket subscription baru", newSub, 201);
    } catch (error) {
      console.error("error createSubscription:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 3. Customer membeli subscription (mengajukan transaksi)
  buySubscription: async (req, res) => {
    try {
      const { id_subscribtion, metode_pembayaran } = req.body;
      const id_user = req.user.id_user;

      if (!id_subscribtion || !metode_pembayaran) {
        return response.error(res, "ID subscription dan metode pembayaran wajib diisi", 400);
      }

      // Pastikan file bukti pembayaran ter-upload
      if (!req.file) {
        return response.error(res, "Bukti pembayaran wajib diunggah", 400);
      }

      // Cari id_customer berdasarkan id_user
      const [customerRows] = await db.query("SELECT id_customer FROM customer WHERE id_user = ?", [id_user]);
      const customer = customerRows[0];
      if (!customer) {
        return response.error(res, "Profil customer tidak ditemukan", 404);
      }

      // Pastikan paket subscription ada
      const subExists = await Subscribtion.findById(id_subscribtion);
      if (!subExists) {
        return response.error(res, "Paket subscription tidak ditemukan", 404);
      }

      // Simpan transaksi
      const insertId = await Subscribtion.createTransaction({
        id_customer: customer.id_customer,
        id_subscribtion,
        bukti_pembayaran: req.file.path, // Path Cloudinary
        metode_pembayaran
      });

      return response.success(res, "Permintaan pembelian subscription berhasil diajukan, menunggu konfirmasi admin", {
        id_transaksi: insertId,
        bukti_pembayaran_url: req.file.path
      }, 201);
    } catch (error) {
      console.error("error buySubscription:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 4. Admin melihat seluruh transaksi masuk
  getTransactions: async (req, res) => {
    try {
      const { status } = req.query; // 'menunggu', 'berhasil', 'gagal'
      const data = await Subscribtion.getTransactions(status);
      return response.success(res, "Berhasil mengambil data transaksi", data);
    } catch (error) {
      console.error("error getTransactions:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 5. Admin mengonfirmasi/verifikasi transaksi
  confirmTransaction: async (req, res) => {
    try {
      const id_transaksi = req.params.id;
      const { status } = req.body; // 'berhasil' atau 'gagal'
      const id_user = req.user.id_user;

      if (!status || !["berhasil", "gagal"].includes(status)) {
        return response.error(res, "Status konfirmasi tidak valid (harus 'berhasil' atau 'gagal')", 400);
      }

      // Cari id_admin berdasarkan id_user admin
      const [adminRows] = await db.query("SELECT id_admin FROM admin WHERE id_user = ?", [id_user]);
      const admin = adminRows[0];
      if (!admin) {
        return response.error(res, "Profil admin tidak ditemukan", 404);
      }

      // Cari transaksi
      const transaksi = await Subscribtion.getTransactionById(id_transaksi);
      if (!transaksi) {
        return response.error(res, "Transaksi tidak ditemukan", 404);
      }

      if (transaksi.status !== "menunggu") {
        return response.error(res, "Transaksi ini sudah dikonfirmasi sebelumnya", 400);
      }

      await Subscribtion.confirmTransaction(id_transaksi, admin.id_admin, status);

      return response.success(res, `Transaksi berhasil dikonfirmasi sebagai '${status}'`, {
        id_transaksi,
        status
      });
    } catch (error) {
      console.error("error confirmTransaction:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  }
};

module.exports = SubscribtionController;
