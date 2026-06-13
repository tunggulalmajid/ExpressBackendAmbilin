const db = require("../config/dbConf");

const Artikel = {
  // === KATEGORI ARTIKEL (jenis_artikel) ===
  getJenisArtikel: async () => {
    const [rows] = await db.query("SELECT * FROM jenis_artikel ORDER BY nama ASC");
    return rows;
  },

  findJenisArtikelById: async (id_jenis_artikel) => {
    const [rows] = await db.query("SELECT * FROM jenis_artikel WHERE id_jenis_artikel = ?", [id_jenis_artikel]);
    return rows[0];
  },

  createJenisArtikel: async (nama) => {
    const [result] = await db.query("INSERT INTO jenis_artikel (nama) VALUES (?)", [nama]);
    return { id_jenis_artikel: result.insertId, nama };
  },

  // === ARTIKEL ===
  getAll: async (limit = 10, offset = 0) => {
    const baseQuery = `
      FROM artikel a
      JOIN jenis_artikel ja ON a.id_jenis_artikel = ja.id_jenis_artikel
      JOIN admin ad ON a.id_admin = ad.id_admin
      JOIN user u ON ad.id_user = u.id_user
      WHERE a.is_delete = 0
    `;

    const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT 
        a.id_artikel, a.judul, a.foto_thumbnail, a.isi, a.created_at, a.updated_at,
        ja.id_jenis_artikel, ja.nama AS nama_kategori,
        u.nama AS nama_penulis
      ${baseQuery}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(dataQuery, [parseInt(limit), parseInt(offset)]);
    return { total, data: rows };
  },

  findById: async (id_artikel) => {
    const [rows] = await db.query(`
      SELECT 
        a.id_artikel, a.judul, a.foto_thumbnail, a.isi, a.created_at, a.updated_at,
        ja.id_jenis_artikel, ja.nama AS nama_kategori,
        u.nama AS nama_penulis
      FROM artikel a
      JOIN jenis_artikel ja ON a.id_jenis_artikel = ja.id_jenis_artikel
      JOIN admin ad ON a.id_admin = ad.id_admin
      JOIN user u ON ad.id_user = u.id_user
      WHERE a.id_artikel = ? AND a.is_delete = 0
    `, [id_artikel]);
    return rows[0];
  },

  create: async (data) => {
    const { id_admin, id_jenis_artikel, judul, foto_thumbnail, isi } = data;
    const [result] = await db.query(
      `INSERT INTO artikel (id_admin, id_jenis_artikel, judul, foto_thumbnail, isi, is_delete)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id_admin, id_jenis_artikel, judul, foto_thumbnail, isi]
    );
    return result.insertId;
  },

  update: async (id_artikel, data) => {
    const { id_jenis_artikel, judul, foto_thumbnail, isi } = data;
    let query = "UPDATE artikel SET id_jenis_artikel = ?, judul = ?, isi = ?";
    const params = [id_jenis_artikel, judul, isi];

    // Update thumbnail jika ada yang baru diunggah
    if (foto_thumbnail) {
      query += ", foto_thumbnail = ?";
      params.push(foto_thumbnail);
    }

    query += " WHERE id_artikel = ? AND is_delete = 0";
    params.push(id_artikel);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  },

  delete: async (id_artikel) => {
    const [result] = await db.query(
      "UPDATE artikel SET is_delete = 1 WHERE id_artikel = ?",
      [id_artikel]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Artikel;
