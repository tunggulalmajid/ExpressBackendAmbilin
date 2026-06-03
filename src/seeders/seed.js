// seed.js
const bcrypt = require("bcryptjs");
const db = require("../config/dbConf");

async function runSeed() {
  try {
    console.log("Memulai proses seeding data user dan profil spesifik...");
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("password123", salt);

    // ==========================================
    // 1. SEEDING SUPER ADMIN (Role 1)
    // ==========================================
    const [adminResult] = await db.query(
      "INSERT INTO user (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
      ["Super Admin", "admin@example.com", defaultPassword, 1],
    );
    const adminUserId = adminResult.insertId;

    // Masukkan ke tabel ekstensi 'admin'
    await db.query("INSERT INTO admin (id_user) VALUES (?)", [adminUserId]);
    console.log("✔ User Admin & Profil Admin berhasil ditambahkan.");

    // ==========================================
    // 2. SEEDING DRIVER/PETUGAS (Role 2)
    // ==========================================
    const [driverResult] = await db.query(
      "INSERT INTO user (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
      ["Driver Jono", "driver@example.com", defaultPassword, 2],
    );
    const driverUserId = driverResult.insertId;

    // Masukkan ke tabel ekstensi 'petugas' (is_aktif diset true/1)
    await db.query("INSERT INTO petugas (id_user, is_aktif) VALUES (?, ?)", [
      driverUserId,
      1,
    ]);
    console.log("✔ User Driver & Profil Petugas berhasil ditambahkan.");

    // ==========================================
    // 3. SEEDING CUSTOMER (Role 3)
    // ==========================================
    const [customerResult] = await db.query(
      "INSERT INTO user (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
      ["Customer Budi", "customer@example.com", defaultPassword, 3],
    );
    const customerUserId = customerResult.insertId;

    // Masukkan ke tabel ekstensi 'customer' (poin=0, is_member=0, is_aktif=1)
    await db.query(
      "INSERT INTO customer (id_user, poin, is_member, is_aktif) VALUES (?, ?, ?, ?)",
      [customerUserId, 0, 0, 1],
    );
    console.log("✔ User Customer & Profil Customer berhasil ditambahkan.");

    console.log("\n=======================================================");
    console.log("Seeding SELESAI! Seluruh relasi data berhasil terpasang.");
    console.log("=======================================================");

    process.exit();
  } catch (error) {
    console.error("Terjadi kesalahan saat seeding:", error);
    process.exit(1);
  }
}

runSeed();
