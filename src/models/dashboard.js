const db = require("../config/dbConf");

const Dashboard = {
  // Admin dashboard stats
  getAdminStats: async () => {
    const [userCount] = await db.query("SELECT COUNT(*) AS count FROM user");
    const [customerCount] = await db.query("SELECT COUNT(*) AS count FROM customer");
    const [memberCount] = await db.query("SELECT COUNT(*) AS count FROM customer WHERE is_member = 1");
    const [petugasCount] = await db.query("SELECT COUNT(*) AS count FROM petugas");

    const [earningRows] = await db.query(`
      SELECT COALESCE(SUM(s.harga - t.poin_digunakan), 0) AS total_pendapatan 
      FROM transaksi t 
      JOIN subscribtion s ON t.id_subscribtion = s.id_subscribtion 
      WHERE t.status = 'berhasil'
    `);

    const [setorStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_transaksi_setor, 
        COALESCE(SUM(berat_sampah), 0) AS total_berat_sampah 
      FROM setor_sampah 
      WHERE status = 'selesai'
    `);

    const [pendingTrans] = await db.query("SELECT COUNT(*) AS count FROM transaksi WHERE status = 'menunggu'");
    const [pendingSetor] = await db.query("SELECT COUNT(*) AS count FROM setor_sampah WHERE status = 'menunggu'");

    return {
      total_user: userCount[0].count,
      total_customer: customerCount[0].count,
      total_member_aktif: memberCount[0].count,
      total_petugas: petugasCount[0].count,
      total_pendapatan_subs: Number(earningRows[0].total_pendapatan),
      total_transaksi_setor: setorStats[0].total_transaksi_setor,
      total_berat_sampah_kg: parseFloat(setorStats[0].total_berat_sampah),
      pending_konfirmasi_pembayaran: pendingTrans[0].count,
      pending_jemput_sampah: pendingSetor[0].count
    };
  },

  // Petugas dashboard data
  getPetugasData: async (id_user) => {
    const [petugasRows] = await db.query("SELECT * FROM petugas WHERE id_user = ?", [id_user]);
    const petugas = petugasRows[0];
    if (!petugas) {
      return null;
    }

    const [pickupStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_selesai, 
        COALESCE(SUM(berat_sampah), 0) AS total_berat_kg 
      FROM setor_sampah 
      WHERE id_petugas = ? AND status = 'selesai'
    `, [petugas.id_petugas]);

    // Active jobs (pesanan yang tersedia/menunggu dan belum diambil oleh siapapun)
    const [availableJobs] = await db.query(`
      SELECT 
        s.*,
        js.nama AS nama_jenis_sampah,
        u.nama AS nama_customer, u.nomor_telepon AS nomor_telepon_customer
      FROM setor_sampah s
      JOIN customer c ON s.id_customer = c.id_customer
      JOIN user u ON c.id_user = u.id_user
      LEFT JOIN jenis_sampah js ON s.id_jenis_sampah = js.id_jenis_sampah
      WHERE s.status = 'menunggu'
      ORDER BY s.created_at ASC
    `);

    return {
      profile: {
        id_petugas: petugas.id_petugas,
        is_aktif: petugas.is_aktif
      },
      stats: {
        total_order_selesai: pickupStats[0].total_selesai,
        total_berat_dikumpulkan_kg: parseFloat(pickupStats[0].total_berat_kg)
      },
      active_jobs: availableJobs
    };
  },

  // Customer dashboard data
  getCustomerData: async (id_user) => {
    const [customerRows] = await db.query("SELECT * FROM customer WHERE id_user = ?", [id_user]);
    const customer = customerRows[0];
    if (!customer) {
      return null;
    }

    const [setorStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_setor,
        COALESCE(SUM(berat_sampah), 0) AS total_berat_kg
      FROM setor_sampah
      WHERE id_customer = ? AND status = 'selesai'
    `, [customer.id_customer]);

    const [pendingSetor] = await db.query(`
      SELECT COUNT(*) AS count 
      FROM setor_sampah 
      WHERE id_customer = ? AND status IN ('menunggu', 'proses')
    `, [customer.id_customer]);

    // Ambil 5 riwayat setor terbaru
    const [historyRows] = await db.query(`
      SELECT 
        s.id_setor_sampah, s.alamat, s.status, s.berat_sampah, s.created_at,
        js.nama AS nama_jenis_sampah
      FROM setor_sampah s
      LEFT JOIN jenis_sampah js ON s.id_jenis_sampah = js.id_jenis_sampah
      WHERE s.id_customer = ?
      ORDER BY s.created_at DESC
      LIMIT 5
    `, [customer.id_customer]);

    return {
      profile: {
        id_customer: customer.id_customer,
        poin: customer.poin,
        is_member: customer.is_member === 1,
        expired_member_date: customer.expired_member_date
      },
      stats: {
        total_jemput_selesai: setorStats[0].total_setor,
        total_berat_sampah_kg: parseFloat(setorStats[0].total_berat_kg),
        order_dalam_proses: pendingSetor[0].count
      },
      recent_deposits: historyRows
    };
  }
};

module.exports = Dashboard;
