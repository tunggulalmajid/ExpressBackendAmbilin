// run-migrations.js
const fs = require("fs");
const path = require("path");
const db = require("../config/dbConf");

async function runMigrations() {
  console.log("=== MEMULAI MIGRASI DATABASE ===");

  try {
    // 1. Buat tabel migrations metadata jika belum ada
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`migrations\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`migration_name\` VARCHAR(255) NOT NULL UNIQUE,
        \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Ambil riwayat migrasi yang sudah pernah sukses dijalankan
    const [rows] = await db.query("SELECT migration_name FROM migrations");
    const executedMigrations = new Set(rows.map(r => r.migration_name));

    // 3. Baca daftar file migrasi SQL di folder migrations ini
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith(".sql"))
      .sort(); // Urutkan nama file secara alfabetis (misal 01_..., 02_...)

    for (const file of files) {
      if (executedMigrations.has(file)) {
        console.log(`Migration ${file} sudah pernah dijalankan. Skipping.`);
        continue;
      }

      console.log(`Menjalankan migrasi: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, "utf-8");

      // Bersihkan komentar SQL (-- atau #) dan baris kosong
      const cleanSqlLines = sqlContent
        .split("\n")
        .filter(line => {
          const trimmed = line.trim();
          return !trimmed.startsWith("--") && !trimmed.startsWith("#") && trimmed !== "";
        });
      
      const cleanSql = cleanSqlLines.join("\n");

      // Pisahkan setiap query berdasarkan tanda titik koma (;)
      const queries = cleanSql
        .split(";")
        .map(q => q.trim())
        .filter(q => q.length > 0);

      // Jalankan query satu per satu dalam transaksi atau sekuensial
      for (const query of queries) {
        await db.query(query);
      }

      // Catat migrasi yang berhasil ke tabel metadata
      await db.query("INSERT INTO migrations (migration_name) VALUES (?)", [file]);
      console.log(`✔ Migration ${file} berhasil dijalankan.`);
    }

    console.log("=== MIGRASI DATABASE SELESAI ===\n");
  } catch (error) {
    console.error("❌ Terjadi kesalahan pada proses migrasi database:", error);
    throw error;
  }
}

module.exports = { runMigrations };
