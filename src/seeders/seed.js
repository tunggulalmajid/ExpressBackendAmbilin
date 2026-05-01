// seed.js
const bcrypt = require("bcryptjs");
const db = require("../config/dbConf");

async function runSeed() {
  try {
    console.log("Memulai proses seeding data user...");

    // Buat satu password standar untuk semua akun: "password123"
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("password123", salt);

    // Insert Admin (id_role = 1)
    await db.query(
      "INSERT INTO users (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
      ["Super Admin", "admin@ambilin.com", defaultPassword, 1],
    );

    // Insert Petugas (id_role = 2)
    await db.query(
      "INSERT INTO users (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
      ["Driver Jono", "driver@ambilin.com", defaultPassword, 2],
    );

    // Insert Customer (id_role = 3)
    await db.query(
      "INSERT INTO users (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
      ["Customer Budi", "customer@ambilin.com", defaultPassword, 3],
    );

    console.log(
      "Seeding berhasil! 3 User (Admin, Petugas, Customer) telah ditambahkan.",
    );
    process.exit(); // Matikan proses setelah selesai
  } catch (error) {
    console.error("Terjadi kesalahan saat seeding:", error);
    process.exit(1);
  }
}

runSeed();
