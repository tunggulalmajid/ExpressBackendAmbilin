// seed.js
const bcrypt = require("bcryptjs");
const db = require("../config/dbConf");

async function runSeed() {
  try {
    console.log("=======================================================");
    console.log("Memulai proses seeding data untuk seluruh tabel (ERD Baru)...");
    console.log("=======================================================");

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("password123", salt);

    // ==========================================
    // 0. SEEDING / VERIFIKASI ROLE & METODE PEMBAYARAN
    // ==========================================
    await db.query(`
      INSERT INTO role (id, nama_role) VALUES 
      (1, 'Super Admin'),
      (2, 'Petugas'),
      (3, 'Customer')
      ON DUPLICATE KEY UPDATE nama_role = VALUES(nama_role)
    `);
    console.log("✔ Verifikasi master data Role berhasil.");

    await db.query(`
      INSERT INTO metode_pembayaran (id_metode_pembayaran, nama, keterangan) VALUES
      (1, 'Transfer Bank Mandiri', 'Kirim ke rekening Mandiri 142000xxxx a.n Ambilin'),
      (2, 'Transfer Bank BCA', 'Kirim ke rekening BCA 02938xxxx a.n Ambilin'),
      (3, 'Poin Reward', 'Pembayaran menggunakan potongan saldo poin aplikasi')
      ON DUPLICATE KEY UPDATE nama = VALUES(nama), keterangan = VALUES(keterangan)
    `);
    console.log("✔ Verifikasi master data Metode Pembayaran berhasil.");

    // ==========================================
    // 1. SEEDING SUPER ADMIN (Role 1)
    // ==========================================
    const [existingAdmin] = await db.query("SELECT id_user FROM user WHERE email = ?", ["admin@example.com"]);
    let adminUserId;
    if (existingAdmin.length === 0) {
      const [adminResult] = await db.query(
        "INSERT INTO user (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
        ["Super Admin", "admin@example.com", defaultPassword, 1],
      );
      adminUserId = adminResult.insertId;

      // Masukkan ke tabel ekstensi 'admin'
      await db.query("INSERT INTO admin (id_user) VALUES (?)", [adminUserId]);
      console.log("✔ User Admin & Profil Admin berhasil ditambahkan.");
    } else {
      adminUserId = existingAdmin[0].id_user;
      console.log("✔ User Admin sudah terdaftar. Skipping.");
    }

    // ==========================================
    // 2. SEEDING DRIVER/PETUGAS (Role 2)
    // ==========================================
    const [existingDriver] = await db.query("SELECT id_user FROM user WHERE email = ?", ["driver@example.com"]);
    let driverUserId;
    if (existingDriver.length === 0) {
      const [driverResult] = await db.query(
        "INSERT INTO user (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
        ["Driver Jono", "driver@example.com", defaultPassword, 2],
      );
      driverUserId = driverResult.insertId;

      // Masukkan ke tabel ekstensi 'petugas' (is_aktif diset true/1)
      await db.query("INSERT INTO petugas (id_user, is_aktif) VALUES (?, ?)", [
        driverUserId,
        1,
      ]);
      console.log("✔ User Driver & Profil Petugas berhasil ditambahkan.");
    } else {
      driverUserId = existingDriver[0].id_user;
      console.log("✔ User Driver sudah terdaftar. Skipping.");
    }

    // ==========================================
    // 3. SEEDING CUSTOMER (Role 3)
    // ==========================================
    const [existingCustomer] = await db.query("SELECT id_user FROM user WHERE email = ?", ["customer@example.com"]);
    let customerUserId;
    if (existingCustomer.length === 0) {
      const [customerResult] = await db.query(
        "INSERT INTO user (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
        ["Customer Budi", "customer@example.com", defaultPassword, 3],
      );
      customerUserId = customerResult.insertId;

      // Masukkan ke tabel ekstensi 'customer' (poin=10000, is_member=0, is_aktif=1)
      // Diberikan saldo poin awal 10000 untuk pengujian pembayaran poin
      await db.query(
        "INSERT INTO customer (id_user, poin, is_member, is_aktif) VALUES (?, ?, ?, ?)",
        [customerUserId, 10000, 0, 1],
      );
      console.log("✔ User Customer & Profil Customer berhasil ditambahkan.");
    } else {
      customerUserId = existingCustomer[0].id_user;
      console.log("✔ User Customer sudah terdaftar. Skipping.");
    }

    // Dapatkan ID Ekstensi (id_admin, id_petugas, id_customer) untuk relasi
    const [admins] = await db.query("SELECT id_admin FROM admin WHERE id_user = ?", [adminUserId]);
    const adminId = admins[0]?.id_admin;

    const [petugases] = await db.query("SELECT id_petugas FROM petugas WHERE id_user = ?", [driverUserId]);
    const petugasId = petugases[0]?.id_petugas;

    const [customers] = await db.query("SELECT id_customer FROM customer WHERE id_user = ?", [customerUserId]);
    const customerId = customers[0]?.id_customer;

    // ==========================================
    // 4. SEEDING SUBSCRIPTION (Tanpa kolom poin)
    // ==========================================
    const [existingSubs] = await db.query("SELECT id_subscribtion FROM subscribtion LIMIT 1");
    let subId;
    if (existingSubs.length === 0) {
      const [subResult] = await db.query(
        "INSERT INTO subscribtion (nama, harga) VALUES (?, ?)",
        ["Gold Membership 30 Hari", 150000]
      );
      subId = subResult.insertId;
      console.log("✔ Data Subscription berhasil ditambahkan.");
    } else {
      subId = existingSubs[0].id_subscribtion;
      console.log("✔ Data Subscription sudah ada. Skipping.");
    }

    // ==========================================
    // 5. SEEDING TRANSAKSI SUBSCRIPTION (Dengan id_metode_pembayaran)
    // ==========================================
    const [existingTransaksi] = await db.query("SELECT id_transaksi FROM transaksi LIMIT 1");
    if (existingTransaksi.length === 0 && customerId && subId) {
      await db.query(
        `INSERT INTO transaksi (id_customer, id_admin, id_metode_pembayaran, id_subscribtion, bukti_pembayaran, poin_digunakan, status, created_at, confirmed_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [customerId, adminId || null, 1, subId, "bukti_bayar_budi.jpg", 0, "berhasil"]
      );
      console.log("✔ Data Transaksi Subscription berhasil ditambahkan.");
    } else {
      console.log("✔ Data Transaksi Subscription sudah ada. Skipping.");
    }

    // ==========================================
    // 6. SEEDING JENIS SAMPAH
    // ==========================================
    const [existingJenisSampah] = await db.query("SELECT id_jenis_sampah FROM jenis_sampah LIMIT 1");
    let jenisSampahId;
    if (existingJenisSampah.length === 0) {
      const [jsResult] = await db.query(
        "INSERT INTO jenis_sampah (nama, poin_per_kg, is_delete) VALUES (?, ?, ?)",
        ["Plastik PET", 2500, 0]
      );
      jenisSampahId = jsResult.insertId;
      await db.query("INSERT INTO jenis_sampah (nama, poin_per_kg, is_delete) VALUES (?, ?, ?)", ["Kertas Karton", 1200, 0]);
      await db.query("INSERT INTO jenis_sampah (nama, poin_per_kg, is_delete) VALUES (?, ?, ?)", ["Logam Besi", 4000, 0]);
      console.log("✔ Data Jenis Sampah berhasil ditambahkan.");
    } else {
      jenisSampahId = existingJenisSampah[0].id_jenis_sampah;
      console.log("✔ Data Jenis Sampah sudah ada. Skipping.");
    }

    // ==========================================
    // 7. SEEDING SETOR SAMPAH (Langsung terintegrasi)
    // ==========================================
    const [existingSetor] = await db.query("SELECT id_setor_sampah FROM setor_sampah LIMIT 1");
    if (existingSetor.length === 0 && customerId && jenisSampahId) {
      await db.query(
        `INSERT INTO setor_sampah (id_petugas, id_customer, id_jenis_sampah, status, alamat, catatan, latitude, longitude, berat_sampah, foto, foto_bukti_penjemputan, created_at, pickup_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [petugasId || null, customerId, jenisSampahId, "selesai", "Jl. Mawar No. 12, Jakarta Timur", "Ditaruh di depan pagar rumah", -6.20000000, 106.81666600, 8.50, "foto_sampah_budi.jpg", "foto_bukti_jemput_petugas.jpg"]
      );
      console.log("✔ Data Setor Sampah berhasil ditambahkan.");
    } else {
      console.log("✔ Data Setor Sampah sudah ada. Skipping.");
    }

    // ==========================================
    // 8. SEEDING JENIS ARTIKEL
    // ==========================================
    const [existingJenisArtikel] = await db.query("SELECT id_jenis_artikel FROM jenis_artikel LIMIT 1");
    let jenisArtikelId;
    if (existingJenisArtikel.length === 0) {
      const [jaResult] = await db.query("INSERT INTO jenis_artikel (nama) VALUES (?)", ["Edukasi Daur Ulang"]);
      jenisArtikelId = jaResult.insertId;
      console.log("✔ Data Jenis Artikel berhasil ditambahkan.");
    } else {
      jenisArtikelId = existingJenisArtikel[0].id_jenis_artikel;
      console.log("✔ Data Jenis Artikel sudah ada. Skipping.");
    }

    // ==========================================
    // 9. SEEDING ARTIKEL
    // ==========================================
    const [existingArtikel] = await db.query("SELECT id_artikel FROM artikel LIMIT 1");
    if (existingArtikel.length === 0 && adminId && jenisArtikelId) {
      await db.query(
        `INSERT INTO artikel (id_admin, id_jenis_artikel, judul, foto_thumbnail, isi, is_delete) 
         VALUES (?, ?, ?, ?, ?, 0)`,
        [
          adminId,
          jenisArtikelId,
          "Cara Memilah Sampah dengan Benar di Rumah",
          "thumbnail_memilah_sampah.jpg",
          "Memilah sampah adalah langkah awal daur ulang yang sangat efektif. Kita harus memisahkan sampah organik seperti sisa makanan dan sampah anorganik seperti plastik dan kardus agar mempermudah pengolahan..."
        ]
      );
      console.log("✔ Data Artikel berhasil ditambahkan.");
    } else {
      console.log("✔ Data Artikel sudah ada. Skipping.");
    }

    console.log("\n=======================================================");
    console.log("Seeding SELESAI! Seluruh tabel berhasil diisi data awal.");
    console.log("=======================================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat seeding:", error);
    process.exit(1);
  }
}

runSeed();

