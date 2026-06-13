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

  // Admin membuat paket baru
  create: async (data) => {
    const { nama, harga, poin } = data;
    const [result] = await db.query(
      "INSERT INTO subscribtion (nama, harga, poin) VALUES (?, ?, ?)",
      [nama, harga, poin]
    );
    return { id_subscribtion: result.insertId, nama, harga, poin };
  },

  // Customer membuat transaksi pembelian (mengajukan)
  createTransaction: async (data) => {
    const { id_customer, id_subscribtion, bukti_pembayaran, metode_pembayaran } = data;
    const [result] = await db.query(
      `INSERT INTO transaksi (id_customer, id_admin, id_subscribtion, bukti_pembayaran, metode_pembayaran, status, created_at)
       VALUES (?, NULL, ?, ?, ?, 'menunggu', NOW())`,
      [id_customer, id_subscribtion, bukti_pembayaran, metode_pembayaran]
    );
    return result.insertId;
  },

  // Admin melihat daftar transaksi pembelian
  getTransactions: async (status = null) => {
    let query = `
      SELECT 
        t.*, 
        c.id_user, u.nama AS nama_customer, u.email AS email_customer,
        s.nama AS nama_paket, s.harga AS harga_paket, s.poin AS poin_bonus
      FROM transaksi t
      JOIN customer c ON t.id_customer = c.id_customer
      JOIN user u ON c.id_user = u.id_user
      JOIN subscribtion s ON t.id_subscribtion = s.id_subscribtion
    `;
    const params = [];
    if (status) {
      query += " WHERE t.status = ?";
      params.push(status);
    }
    query += " ORDER BY t.created_at DESC";
    const [rows] = await db.query(query, params);
    return rows;
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

      // 2. Jika statusnya berhasil, update profil customer (is_member, expired_member_date, poin)
      if (statusConfirm === "berhasil") {
        // Ambil info transaksi & paket subscription
        const [transaksiRows] = await conn.query(
          "SELECT id_customer, id_subscribtion FROM transaksi WHERE id_transaksi = ?",
          [id_transaksi]
        );
        const trans = transaksiRows[0];

        const [subRows] = await conn.query(
          "SELECT poin FROM subscribtion WHERE id_subscribtion = ?",
          [trans.id_subscribtion]
        );
        const sub = subRows[0];

        // Tambah poin dan aktifkan membership (+30 hari)
        await conn.query(
          `UPDATE customer 
           SET is_member = 1, 
               expired_member_date = DATE_ADD(NOW(), INTERVAL 30 DAY),
               poin = poin + ?
           WHERE id_customer = ?`,
          [sub.poin, trans.id_customer]
        );
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
};

module.exports = Subscribtion;
