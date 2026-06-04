const db = require("../config/dbConf");

const jenisSampah = {
  // Hanya mengambil data yang belum di-soft delete
  getJenisSampah: async () => {
    const [result] = await db.query(
      "SELECT id_jenis_sampah, nama, poin_per_kg, is_delete,created_at, updated_at FROM jenis_sampah WHERE is_delete = false",
    );
    return result;
  },

  // Mengambil satu data spesifik berdasarkan ID untuk keperluan validasi
  getJenisSampahById: async (id) => {
    const [result] = await db.query(
      "SELECT * FROM jenis_sampah WHERE id_jenis_sampah = ? AND is_delete = false",
      [id],
    );
    return result[0];
  },

  createJenisSampah: async (nama, poin_per_kg) => {
    const [result] = await db.query(
      "INSERT INTO jenis_sampah (nama, poin_per_kg) VALUES (?, ?)",
      [nama, poin_per_kg],
    );
    return result;
  },

  updateJenisSampah: async (id, nama, poin_per_kg) => {
    const [result] = await db.query(
      "UPDATE jenis_sampah SET nama = ?, poin_per_kg = ? WHERE id_jenis_sampah = ? AND is_delete = false",
      [nama, poin_per_kg, id],
    );
    return result;
  },

  // Menerapkan SOFT DELETE
  deleteJenisSampah: async (id) => {
    const [result] = await db.query(
      "UPDATE jenis_sampah SET is_delete = true WHERE id_jenis_sampah = ?",
      [id],
    );
    return result;
  },
};

module.exports = jenisSampah;
