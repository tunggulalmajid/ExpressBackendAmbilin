const db = require("../config/dbConf");

const Setor = {
  // Customer membuat request setor baru
  create: async (data) => {
    const { id_customer, alamat, latitude, longitude, foto } = data;
    const [result] = await db.query(
      `INSERT INTO setor_sampah (id_customer, alamat, latitude, longitude, foto, status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'menunggu', NOW())`,
      [id_customer, alamat, latitude, longitude, foto],
    );
    return result.insertId;
  },

  // Dapatkan id_customer berdasarkan id_user
  getCustomerId: async (id_user) => {
    const [rows] = await db.query(
      "SELECT id_customer FROM customer WHERE id_user = ?",
      [id_user],
    );
    return rows[0];
  },

  // 1. Petugas melihat semua order penjemputan dengan status 'menunggu'
  getActiveOrders: async () => {
    const [rows] = await db.query(`
      SELECT 
        s.id_setor_sampah, s.alamat, s.catatan, s.latitude, s.longitude, s.foto, s.status, s.created_at,
        c.id_customer, u.nama AS nama_customer, u.nomor_telepon AS nomor_telepon_customer
      FROM setor_sampah s
      JOIN customer c ON s.id_customer = c.id_customer
      JOIN user u ON c.id_user = u.id_user
      WHERE s.status = 'menunggu'
      ORDER BY s.created_at ASC
    `);
    return rows;
  },

  // 2. Petugas melihat histori penjemputan sampah yang mereka tangani
  getPetugasHistory: async (id_petugas) => {
    const [rows] = await db.query(`
      SELECT 
        s.id_setor_sampah, s.alamat, s.catatan, s.latitude, s.longitude, s.foto, s.status, s.created_at, s.pickup_at,
        c.id_customer, u.nama AS nama_customer, u.nomor_telepon AS nomor_telepon_customer
      FROM setor_sampah s
      JOIN customer c ON s.id_customer = c.id_customer
      JOIN user u ON c.id_user = u.id_user
      WHERE s.id_petugas = ?
      ORDER BY s.pickup_at DESC, s.created_at DESC
    `, [id_petugas]);
    return rows;
  },

  // 3. Petugas mengklaim/memproses order penjemputan
  processOrder: async (id_setor, id_petugas) => {
    const [result] = await db.query(
      "UPDATE setor_sampah SET status = 'proses', id_petugas = ? WHERE id_setor_sampah = ? AND status = 'menunggu'",
      [id_petugas, id_setor]
    );
    return result.affectedRows > 0;
  },

  // 4. Petugas menyelesaikan order (menimbang sampah, input detail, kalkulasi poin customer)
  completeOrder: async (id_setor, id_petugas, items) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Pastikan order ini memang diproses oleh petugas bersangkutan
      const [orderRows] = await conn.query(
        "SELECT id_customer, status FROM setor_sampah WHERE id_setor_sampah = ? AND id_petugas = ?",
        [id_setor, id_petugas]
      );
      const order = orderRows[0];

      if (!order) {
        throw new Error("Order tidak ditemukan atau bukan milik petugas ini");
      }

      if (order.status !== "proses") {
        throw new Error("Hanya order dengan status 'proses' yang bisa diselesaikan");
      }

      // a. Update status order menjadi 'selesai' dan catat waktu jemput
      await conn.query(
        "UPDATE setor_sampah SET status = 'selesai', pickup_at = NOW() WHERE id_setor_sampah = ?",
        [id_setor]
      );

      let totalPoinDiperoleh = 0;

      // b. Loop item timbangan sampah
      for (const item of items) {
        const { id_jenis_sampah, berat_sampah } = item;

        // Ambil rate poin per kg untuk jenis sampah ini
        const [jenisRows] = await conn.query(
          "SELECT poin_per_kg FROM jenis_sampah WHERE id_jenis_sampah = ?",
          [id_jenis_sampah]
        );
        const jenis = jenisRows[0];
        if (!jenis) {
          throw new Error(`Jenis sampah dengan ID ${id_jenis_sampah} tidak ditemukan`);
        }

        // Simpan rincian ke detail_setor_sampah
        await conn.query(
          `INSERT INTO detail_setor_sampah (id_setor_sampah, id_jenis_sampah, berat_sampah, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [id_setor, id_jenis_sampah, berat_sampah]
        );

        // Kalkulasi poin subtotal
        const subtotalPoin = Math.round(berat_sampah * jenis.poin_per_kg);
        totalPoinDiperoleh += subtotalPoin;
      }

      // c. Tambahkan poin ke saldo customer
      await conn.query(
        "UPDATE customer SET poin = poin + ? WHERE id_customer = ?",
        [totalPoinDiperoleh, order.id_customer]
      );

      await conn.commit();
      return totalPoinDiperoleh;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
};

module.exports = Setor;

