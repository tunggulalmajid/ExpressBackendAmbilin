const db = require("../config/dbConf");

const User = {
  findByEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  },
  findById: async (id_user) => {
    const [rows] = await db.query("SELECT * FROM users WHERE id_user = ?", [
      id_user,
    ]);
    return rows[0];
  },
  create: async (userData) => {
    const { nama, email, password, id_role } = userData;
    const [result] = await db.query(
      "INSERT INTO users (nama, email, password, id_role) VALUES (?, ?, ?, ?)",
      [nama, email, password, id_role],
    );
    return result.insertId;
  },
  updateRefreshToken: async (id_user, refreshToken) => {
    await db.query("UPDATE users SET refresh_token = ? WHERE id_user = ?", [
      refreshToken,
      id_user,
    ]);
  },
};

module.exports = User;
