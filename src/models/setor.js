const db = require("../config/dbConf");

const Setor = {
  create: async (data) => {
    const { id_customer, alamat, latitude, longitude, foto } = data;
    const [result] = await db.query(
      `INSERT INTO setor_sampah (id_customer, alamat, latitude, longitude, foto, status) 
             VALUES (?, ?, ?, ?, ?, 'menunggu')`,
      [id_customer, alamat, latitude, longitude, foto],
    );
    return result.insertId;
  },

  getCustomerId: async (id_user) => {
    const [rows] = await db.query(
      "SELECT id_customer FROM customer WHERE id_user = ?",
      [id_user],
    );
    return rows[0];
  }, 
};

module.exports = Setor;
