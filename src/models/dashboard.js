const db = require("../config/dbConf");

const Dashboard = {
  // 1. Admin dashboard data
  getAdminDashboardData: async () => {
    // a. total pending transaksi (transaksi status = 'menunggu')
    const [pendingTrans] = await db.query("SELECT COUNT(*) AS count FROM transaksi WHERE status = 'menunggu'");
    
    // b. total pendapatan
    const [earningRows] = await db.query(`
      SELECT COALESCE(SUM(s.harga - t.poin_digunakan), 0) AS total_pendapatan 
      FROM transaksi t 
      JOIN subscribtion s ON t.id_subscribtion = s.id_subscribtion 
      WHERE t.status = 'berhasil'
    `);
    
    // c. total sampah terkumpul (berat_sampah from status = 'selesai')
    const [setorStats] = await db.query(`
      SELECT COALESCE(SUM(berat_sampah), 0) AS total_berat_sampah 
      FROM setor_sampah 
      WHERE status = 'selesai'
    `);
    
    // d. total artikel (is_delete = 0)
    const [artikelCount] = await db.query("SELECT COUNT(*) AS count FROM artikel WHERE is_delete = 0");
    
    // e. list transaksi masuk 5 terbaru
    const [recentTransactions] = await db.query(`
      SELECT 
        t.id_transaksi,
        u.nama AS nama_customer,
        s.nama AS nama_paket,
        s.harga AS harga_paket,
        t.bukti_pembayaran,
        t.poin_digunakan,
        t.status,
        t.created_at,
        mp.nama AS nama_metode_pembayaran
      FROM transaksi t
      JOIN customer c ON t.id_customer = c.id_customer
      JOIN user u ON c.id_user = u.id_user
      JOIN subscribtion s ON t.id_subscribtion = s.id_subscribtion
      JOIN metode_pembayaran mp ON t.id_metode_pembayaran = mp.id_metode_pembayaran
      ORDER BY t.created_at DESC
      LIMIT 5
    `);

    return {
      total_pending_transaksi: pendingTrans[0].count,
      total_pendapatan: Number(earningRows[0].total_pendapatan),
      total_sampah_terkumpul: parseFloat(setorStats[0].total_berat_sampah),
      total_artikel: artikelCount[0].count,
      recent_transactions: recentTransactions
    };
  },

  // 2. Customer dashboard data
  getCustomerDashboardData: async (id_user) => {
    const [customerRows] = await db.query("SELECT * FROM customer WHERE id_user = ?", [id_user]);
    const customer = customerRows[0];
    if (!customer) {
      return null;
    }

    // list artikel 3 terbaru
    const [recentArticles] = await db.query(`
      SELECT 
        a.id_artikel, a.judul, a.foto_thumbnail, a.isi, a.created_at,
        ja.nama AS nama_kategori
      FROM artikel a
      LEFT JOIN jenis_artikel ja ON a.id_jenis_artikel = ja.id_jenis_artikel
      WHERE a.is_delete = 0
      ORDER BY a.created_at DESC
      LIMIT 3
    `);

    const formattedArticles = recentArticles.map(art => {
      let preview = art.isi;
      if (preview && preview.length > 150) {
        preview = preview.substring(0, 150) + "...";
      }
      return {
        id_artikel: art.id_artikel,
        judul: art.judul,
        foto_thumbnail: art.foto_thumbnail,
        isi: preview,
        created_at: art.created_at,
        nama_kategori: art.nama_kategori || ""
      };
    });

    return {
      total_poin: customer.poin,
      is_member: customer.is_member === 1,
      expired_member_date: customer.expired_member_date,
      recent_articles: formattedArticles
    };
  },

  // 3. Petugas dashboard data
  getPetugasDashboardData: async (id_user) => {
    const [petugasRows] = await db.query("SELECT id_petugas FROM petugas WHERE id_user = ?", [id_user]);
    const petugas = petugasRows[0];
    if (!petugas) {
      return null;
    }

    const [pickupStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_pesanan, 
        COALESCE(SUM(berat_sampah), 0) AS total_sampah_diangkut 
      FROM setor_sampah 
      WHERE id_petugas = ? AND status = 'selesai'
    `, [petugas.id_petugas]);

    return {
      total_pesanan_dilayani: pickupStats[0].total_pesanan,
      total_sampah_diangkut: parseFloat(pickupStats[0].total_sampah_diangkut)
    };
  }
};

module.exports = Dashboard;
