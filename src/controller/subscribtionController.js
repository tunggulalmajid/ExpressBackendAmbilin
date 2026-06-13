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

  // 2. Admin meng-update paket subscription (mengganti create dengan update)
  updateSubscription: async (req, res) => {
    try {
      const id_subscribtion = req.params.id;
      const { nama, harga } = req.body;
      if (!nama || !harga) {
        return response.error(res, "Nama dan harga wajib diisi", 400);
      }

      const subExists = await Subscribtion.findById(id_subscribtion);
      if (!subExists) {
        return response.error(res, "Paket subscription tidak ditemukan", 404);
      }

      const updatedSub = await Subscribtion.update(id_subscribtion, { nama, harga });
      return response.success(res, "Berhasil memperbarui paket subscription", updatedSub);
    } catch (error) {
      console.error("error updateSubscription:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 3. Customer membeli subscription (mengajukan transaksi dengan diskon poin)
  buySubscription: async (req, res) => {
    try {
      const { id_subscribtion, id_metode_pembayaran, poin_digunakan } = req.body;
      const id_user = req.user.id_user;

      if (!id_subscribtion || !id_metode_pembayaran) {
        return response.error(res, "ID subscription dan ID metode pembayaran wajib diisi", 400);
      }

      // Cari id_customer berdasarkan id_user
      const [customerRows] = await db.query("SELECT * FROM customer WHERE id_user = ?", [id_user]);
      const customer = customerRows[0];
      if (!customer) {
        return response.error(res, "Profil customer tidak ditemukan", 404);
      }

      // Pastikan paket subscription ada
      const subExists = await Subscribtion.findById(id_subscribtion);
      if (!subExists) {
        return response.error(res, "Paket subscription tidak ditemukan", 404);
      }

      // Validasi input poin_digunakan
      const inputPoin = parseInt(poin_digunakan) || 0;
      if (inputPoin < 0) {
        return response.error(res, "Jumlah poin yang digunakan tidak boleh negatif", 400);
      }
      if (inputPoin > customer.poin) {
        return response.error(res, "Saldo poin Anda tidak mencukupi", 400);
      }

      // Batasi agar poin yang digunakan tidak melebihi harga paket subscription
      const actualPoinUsed = Math.min(inputPoin, subExists.harga);
      const sisaBayar = subExists.harga - actualPoinUsed;

      // Jika sisaBayar > 0, wajib mengunggah bukti pembayaran
      if (sisaBayar > 0 && !req.file) {
        return response.error(res, "Bukti pembayaran wajib diunggah karena masih ada sisa pembayaran", 400);
      }

      // Jalankan transaksi database
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // 1. Potong poin customer secara otomatis
        if (actualPoinUsed > 0) {
          await conn.query("UPDATE customer SET poin = poin - ? WHERE id_customer = ?", [actualPoinUsed, customer.id_customer]);
        }

        // 2. Tentukan status awal transaksi
        // Jika sisaBayar adalah 0, maka transaksi langsung lunas (status = berhasil)
        const status = sisaBayar === 0 ? "berhasil" : "menunggu";
        const bukti_pembayaran = req.file ? req.file.path : null;

        // 3. Masukkan transaksi
        const [transResult] = await conn.query(
          `INSERT INTO transaksi (id_customer, id_admin, id_metode_pembayaran, id_subscribtion, bukti_pembayaran, poin_digunakan, status, created_at, confirmed_at)
           VALUES (?, NULL, ?, ?, ?, ?, ?, NOW(), ${status === 'berhasil' ? 'NOW()' : 'NULL'})`,
          [customer.id_customer, id_metode_pembayaran, id_subscribtion, bukti_pembayaran, actualPoinUsed, status]
        );
        const insertId = transResult.insertId;

        // 4. Jika statusnya berhasil (karena sisaBayar === 0), update membership customer
        if (status === "berhasil") {
          let newExpiredDate;
          const now = new Date();

          if (customer.is_member === 1 && customer.expired_member_date && new Date(customer.expired_member_date) > now) {
            newExpiredDate = new Date(customer.expired_member_date);
            newExpiredDate.setDate(newExpiredDate.getDate() + 30);
          } else {
            newExpiredDate = new Date(now);
            newExpiredDate.setDate(newExpiredDate.getDate() + 30);
          }

          const formattedDate = newExpiredDate.toISOString().slice(0, 19).replace('T', ' ');

          await conn.query(
            `UPDATE customer 
             SET is_member = 1, 
                 expired_member_date = ?
             WHERE id_customer = ?`,
            [formattedDate, customer.id_customer]
          );
        }

        await conn.commit();

        let msg = "Permintaan pembelian subscription berhasil diajukan, menunggu konfirmasi admin";
        if (status === "berhasil") {
          msg = "Pembayaran lunas menggunakan poin, membership Anda telah aktif";
        }

        return response.success(res, msg, {
          id_transaksi: insertId,
          status,
          bukti_pembayaran_url: bukti_pembayaran,
          sisa_bayar: sisaBayar,
          poin_digunakan: actualPoinUsed
        }, 201);

      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error("error buySubscription:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 4. Admin melihat seluruh transaksi masuk (Paginated)
  getTransactions: async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query; // 'menunggu', 'berhasil', 'gagal'
      const parsedPage = parseInt(page) || 1;
      const parsedLimit = parseInt(limit) || 10;
      const offset = (parsedPage - 1) * parsedLimit;

      const { total, data } = await Subscribtion.getTransactions(status, parsedLimit, offset);
      return res.status(200).json({
        status: "success",
        message: "Berhasil mengambil data transaksi",
        pagination: {
          total_items: total,
          total_pages: Math.ceil(total / parsedLimit),
          current_page: parsedPage,
          limit: parsedLimit
        },
        data
      });
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
  },

  // 6. Admin melihat ringkasan pendapatan & member aktif
  getSummary: async (req, res) => {
    try {
      const data = await Subscribtion.getSummary();
      return response.success(res, "Berhasil mengambil ringkasan transaksi & member", data);
    } catch (error) {
      console.error("error getSummary:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 7. Mengambil daftar metode pembayaran
  getPaymentMethods: async (req, res) => {
    try {
      const data = await Subscribtion.getPaymentMethods();
      return response.success(res, "Berhasil mengambil daftar metode pembayaran", data);
    } catch (error) {
      console.error("error getPaymentMethods:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  }
};

module.exports = SubscribtionController;
