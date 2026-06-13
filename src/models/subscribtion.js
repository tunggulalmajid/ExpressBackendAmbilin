const db = require("../config/dbConf");

const Subscribtion = {
  // Ambil semua paket subscription
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM subscribtion ORDER BY harga ASC");
    return rows;
  },

  // Cari paket berdasarkan ID
  findById: async (id_subscribtion) => {
    const [rows] = await db.query("SELECT * FROM subscribtion WHERE id_subscribtion = ?", [id_subscribtion]);
    return rows[0];
  },

  // Admin memperbarui paket subscription (nama & harga)
  update: async (id_subscribtion, data) => {
    const { nama, harga } = data;
    await db.query(
      "UPDATE subscribtion SET nama = ?, harga = ? WHERE id_subscribtion = ?",
      [nama, harga, id_subscribtion]
    );
    return { id_subscribtion, nama, harga };
  },

  // Customer membuat transaksi pembelian (mengajukan)
  createTransaction: async (data) => {
    const { id_customer, id_subscribtion, bukti_pembayaran, id_metode_pembayaran, poin_digunakan, status } = data;
    const [result] = await db.query(
      `INSERT INTO transaksi (id_customer, id_admin, id_metode_pembayaran, id_subscribtion, bukti_pembayaran, poin_digunakan, status, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, NOW())`,
      [id_customer, id_metode_pembayaran, id_subscribtion, bukti_pembayaran, poin_digunakan, status || 'menunggu']
    );
    return result.insertId;
  },

  // Admin melihat daftar transaksi pembelian (Paginated)
  getTransactions: async (status = null, limit = 10, offset = 0) => {
    let baseQuery = `
      FROM transaksi t
      JOIN customer c ON t.id_customer = c.id_customer
      JOIN user u ON c.id_user = u.id_user
      JOIN subscribtion s ON t.id_subscribtion = s.id_subscribtion
      JOIN metode_pembayaran mp ON t.id_metode_pembayaran = mp.id_metode_pembayaran
    `;
    const params = [];
    let whereClause = "";
    if (status) {
      whereClause = " WHERE t.status = ?";
      params.push(status);
    }

    // Get total
    const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery} ${whereClause}`, params);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        t.*, 
        c.id_user, u.nama AS nama_customer, u.email AS email_customer,
        s.nama AS nama_paket, s.harga AS harga_paket,
        mp.nama AS nama_metode_pembayaran
      ${baseQuery}
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);
    return { total, data: rows };
  },

  // Cari transaksi berdasarkan ID
  getTransactionById: async (id_transaksi) => {
    const [rows] = await db.query("SELECT * FROM transaksi WHERE id_transaksi = ?", [id_transaksi]);
    return rows[0];
  },

  // Admin mengonfirmasi transaksi (berhasil / gagal)
  confirmTransaction: async (id_transaksi, id_admin, statusConfirm) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Update status transaksi
      await conn.query(
        "UPDATE transaksi SET status = ?, id_admin = ?, confirmed_at = NOW() WHERE id_transaksi = ?",
        [statusConfirm, id_admin, id_transaksi]
      );

      // 2. Jika statusnya berhasil, update profil customer (is_member, expired_member_date)
      if (statusConfirm === "berhasil") {
        // Ambil info transaksi
        const [transaksiRows] = await conn.query(
          "SELECT id_customer FROM transaksi WHERE id_transaksi = ?",
          [id_transaksi]
        );
        const trans = transaksiRows[0];

        // Ambil profile customer saat ini untuk mengecek expired_member_date
        const [custRows] = await conn.query(
          "SELECT is_member, expired_member_date FROM customer WHERE id_customer = ?",
          [trans.id_customer]
        );
        const customer = custRows[0];

        let newExpiredDate;
        const now = new Date();

        if (customer.is_member === 1 && customer.expired_member_date && new Date(customer.expired_member_date) > now) {
          // Jika member aktif, perpanjang dari tanggal expired lama
          newExpiredDate = new Date(customer.expired_member_date);
          newExpiredDate.setDate(newExpiredDate.getDate() + 30);
        } else {
          // Jika expired atau bukan member, perpanjang dari sekarang
          newExpiredDate = new Date(now);
          newExpiredDate.setDate(newExpiredDate.getDate() + 30);
        }

        // Format ke format DATETIME MySQL YYYY-MM-DD HH:mm:ss
        const formattedDate = newExpiredDate.toISOString().slice(0, 19).replace('T', ' ');

        await conn.query(
          `UPDATE customer 
           SET is_member = 1, 
               expired_member_date = ?
           WHERE id_customer = ?`,
          [formattedDate, trans.id_customer]
        );
      } else if (statusConfirm === "gagal") {
        // Jika gagal, kembalikan poin diskon yang dipotong ke saldo poin customer
        const [transaksiRows] = await conn.query(
          "SELECT id_customer, poin_digunakan FROM transaksi WHERE id_transaksi = ?",
          [id_transaksi]
        );
        const trans = transaksiRows[0];
        if (trans && trans.poin_digunakan > 0) {
          await conn.query(
            "UPDATE customer SET poin = poin + ? WHERE id_customer = ?",
            [trans.poin_digunakan, trans.id_customer]
          );
        }
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  // Mendapatkan ringkasan pendapatan & member aktif
  getSummary: async () => {
    // Total pendapatan dihitung dari total nominal paket dikurangi poin_digunakan untuk transaksi yang sukses
    const [earningRows] = await db.query(`
      SELECT COALESCE(SUM(s.harga - t.poin_digunakan), 0) AS total_pendapatan 
      FROM transaksi t 
      JOIN subscribtion s ON t.id_subscribtion = s.id_subscribtion 
      WHERE t.status = 'berhasil'
    `);
    const [memberRows] = await db.query(`
      SELECT COUNT(*) AS total_member 
      FROM customer 
      WHERE is_member = 1
    `);
    return {
      total_pendapatan: Number(earningRows[0].total_pendapatan),
      total_member: memberRows[0].total_member
    };
  },

  // Mendapatkan semua metode pembayaran aktif
  getPaymentMethods: async () => {
    const [rows] = await db.query("SELECT * FROM metode_pembayaran");
    return rows;
  }
};

module.exports = Subscribtion;
