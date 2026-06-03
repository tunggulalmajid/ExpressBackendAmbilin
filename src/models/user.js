const db = require("../config/dbConf");

const User = {
  findByEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    return rows[0];
  },

  findById: async (id_user) => {
    const [rows] = await db.query("SELECT * FROM user WHERE id_user = ?", [
      id_user,
    ]);
    return rows[0];
  },

  findCustomerByIdUser: async (id_user) => {
    const [rows] = await db.query("SELECT * FROM customer WHERE id_user = ?", [
      id_user,
    ]);
    return rows[0];
  },

  create: async (userData) => {
    const { nama, email, password, id_role } = userData;
    const [result] = await db.query(
      "INSERT INTO user (nama, email, password, id_role) VALUES (?, ?, ?, ?) ",
      [nama, email, password, id_role],
    );
    return {
      id_user: result.insertId,
      nama: nama,
      email: email,
      id_role: id_role,
    };
  },

  findPetugasByIdUser: async (id_user) => {
    const [rows] = await db.query("SELECT * FROM petugas WHERE id_user = ?", [
      id_user,
    ]);
    return rows[0];
  },

  findAdminByIdUser: async (id_user) => {
    const [rows] = await db.query("SELECT * FROM admin WHERE id_user = ?", [
      id_user,
    ]);
    return rows[0];
  },

  createCustomerProfile: async (id_user) => {
    const [result] = await db.query(
      "INSERT INTO customer (id_user, poin, is_member, is_aktif) VALUES (?, ?, ?, ?)",
      [id_user, 0, 0, 1],
    );
    return {
      id_customer: result.insertId,
      id_aktif: false,
    };
  },

  updateRefreshToken: async (id_user, refreshToken) => {
    await db.query("UPDATE user SET refresh_token = ? WHERE id_user = ?", [
      refreshToken,
      id_user,
    ]);
  },

  updateProfileData: async (id_user, updateData) => {
    const { nama, nomor_telepon, alamat, latitude, longitude } = updateData;
    await db.query(
      "UPDATE user SET nama = ?, nomor_telepon = ?, alamat = ?, latitude = ?, longitude = ? WHERE id_user = ?",
      [nama, nomor_telepon, alamat, latitude, longitude, id_user],
    );
  },
  updateProfilePhoto: async (id_user, fotoUrl) => {
    await db.query("UPDATE user SET foto = ? WHERE id_user = ?", [
      fotoUrl,
      id_user,
    ]);
  },
};

module.exports = User;
