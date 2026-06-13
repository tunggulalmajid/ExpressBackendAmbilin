const db = require("../config/dbConf");

const Setor = {
  // Customer membuat request setor baru
  create: async (data) => {
    const { id_customer, id_jenis_sampah, alamat, catatan, latitude, longitude, foto } = data;
    const [result] = await db.query(
      `INSERT INTO setor_sampah (id_customer, id_jenis_sampah, alamat, catatan, latitude, longitude, foto, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'menunggu', NOW())`,
      [id_customer, id_jenis_sampah || null, alamat, catatan || null, latitude, longitude, foto],
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

  // Cari request setor berdasarkan ID
  findById: async (id_setor_sampah) => {
    const query = `
      SELECT 
        s.*,
        js.nama AS nama_jenis_sampah, js.poin_per_kg,
        c.id_user, u.nama AS nama_customer, u.nomor_telepon AS nomor_telepon_customer
      FROM setor_sampah s
      JOIN customer c ON s.id_customer = c.id_customer
      JOIN user u ON c.id_user = u.id_user
      LEFT JOIN jenis_sampah js ON s.id_jenis_sampah = js.id_jenis_sampah
      WHERE s.id_setor_sampah = ?
    `;
    const [rows] = await db.query(query, [id_setor_sampah]);
    return rows[0];
  },

  // Customer melihat riwayat setorannya sendiri (Paginated)
  getCustomerHistory: async (id_customer, limit = 10, offset = 0) => {
    const baseQuery = `
      FROM setor_sampah s
      LEFT JOIN jenis_sampah js ON s.id_jenis_sampah = js.id_jenis_sampah
      WHERE s.id_customer = ?
    `;

    const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, [id_customer]);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT 
        s.*,
        js.nama AS nama_jenis_sampah, js.poin_per_kg
      ${baseQuery}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [id_customer, parseInt(limit), parseInt(offset)]);
    return { total, data: rows };
  },

  // 1. Petugas melihat semua order penjemputan dengan status 'menunggu' (Paginated)
  getActiveOrders: async (limit = 10, offset = 0) => {
    const baseQuery = `
      FROM setor_sampah s
      JOIN customer c ON s.id_customer = c.id_customer
      JOIN user u ON c.id_user = u.id_user
      LEFT JOIN jenis_sampah js ON s.id_jenis_sampah = js.id_jenis_sampah
      WHERE s.status = 'menunggu'
    `;

    const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT 
        s.*,
        js.nama AS nama_jenis_sampah, js.poin_per_kg,
        c.id_user, u.nama AS nama_customer, u.nomor_telepon AS nomor_telepon_customer
      ${baseQuery}
      ORDER BY s.created_at ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [parseInt(limit), parseInt(offset)]);
    return { total, data: rows };
  },

  // 2. Petugas melihat histori penjemputan sampah yang mereka tangani (Paginated)
  getPetugasHistory: async (id_petugas, limit = 10, offset = 0) => {
    const baseQuery = `
      FROM setor_sampah s
      JOIN customer c ON s.id_customer = c.id_customer
      JOIN user u ON c.id_user = u.id_user
      LEFT JOIN jenis_sampah js ON s.id_jenis_sampah = js.id_jenis_sampah
      WHERE s.id_petugas = ?
    `;

    const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, [id_petugas]);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT 
        s.*,
        js.nama AS nama_jenis_sampah, js.poin_per_kg,
        c.id_user, u.nama AS nama_customer, u.nomor_telepon AS nomor_telepon_customer
      ${baseQuery}
      ORDER BY s.pickup_at DESC, s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [id_petugas, parseInt(limit), parseInt(offset)]);
    return { total, data: rows };
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
  completeOrder: async (id_setor, id_petugas, berat_sampah, foto_bukti_penjemputan) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Pastikan order ini memang diproses oleh petugas bersangkutan
      const [orderRows] = await conn.query(
        "SELECT id_customer, id_jenis_sampah, status FROM setor_sampah WHERE id_setor_sampah = ? AND id_petugas = ?",
        [id_setor, id_petugas]
      );
      const order = orderRows[0];

      if (!order) {
        throw new Error("Order tidak ditemukan atau bukan milik petugas ini");
      }

      if (order.status !== "proses") {
        throw new Error("Hanya order dengan status 'proses' yang bisa diselesaikan");
      }

      // Ambil rate poin per kg untuk jenis sampah ini
      let poin_per_kg = 0;
      if (order.id_jenis_sampah) {
        const [jenisRows] = await conn.query(
          "SELECT poin_per_kg FROM jenis_sampah WHERE id_jenis_sampah = ?",
          [order.id_jenis_sampah]
        );
        const jenis = jenisRows[0];
        if (jenis) {
          poin_per_kg = jenis.poin_per_kg;
        }
      }

      const totalPoinDiperoleh = Math.round(parseFloat(berat_sampah) * poin_per_kg);

      // a. Update status order menjadi 'selesai' dan catat timbangan serta bukti jemput
      await conn.query(
        `UPDATE setor_sampah 
         SET status = 'selesai', 
             berat_sampah = ?, 
             foto_bukti_penjemputan = ?, 
             pickup_at = NOW() 
         WHERE id_setor_sampah = ?`,
        [berat_sampah, foto_bukti_penjemputan, id_setor]
      );

      // b. Tambahkan poin ke saldo customer
      if (totalPoinDiperoleh > 0) {
        await conn.query(
          "UPDATE customer SET poin = poin + ? WHERE id_customer = ?",
          [totalPoinDiperoleh, order.id_customer]
        );
      }

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
