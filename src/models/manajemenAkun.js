const db = require("../config/dbConf");
const User = require("../models/user");

const manajemenAkun = {
  getAkun: async (id_role = null) => {
    let query = `
      SELECT 
        u.id_user, u.nama, u.email, u.nomor_telepon, u.foto, u.alamat, u.id_role,
        r.nama_role,
        c.id_customer, c.poin, c.is_member, c.is_aktif AS customer_aktif, c.expired_member_date,
        p.id_petugas, p.is_aktif AS petugas_aktif
      FROM user u
      JOIN role r ON u.id_role = r.id
      LEFT JOIN customer c ON u.id_user = c.id_user
      LEFT JOIN petugas p ON u.id_user = p.id_user
      
    `;

    const params = [];

    if (id_role) {
      query += " WHERE u.id_role = ?";
      params.push(id_role);
    } else {
      query += " WHERE u.id_role <> 1";
      params.push(id_role);
    }

    query += " ORDER BY u.nama;";

    const [result] = await db.query(query, params);
    return result;
  },
  createUser: async (userData) => {
    const { nama, email, password, id_role, nomor_telepon } = userData;
    const [result] = await db.query(
      "INSERT INTO user (nama, email, password, id_role, nomor_telepon) VALUES (?, ?, ?, ?, ?)",
      [nama, email, password, id_role, nomor_telepon || null],
    );
    return {
      id_user: result.insertId,
      nama,
      email,
      id_role,
      nomor_telepon,
    };
  },
  insertCustomer: async (id_user) => {
    const [result] = await db.query(
      "INSERT INTO customer (id_user, poin, is_member, is_aktif) VALUES (?, ?, ?, ?)",
      [id_user, 0, 0, 1],
    );
    return {
      id_customer: result.insertId,
      is_aktif: true,
    };
  },

  insertPetugas: async (id_user) => {
    const [result] = await db.query(
      "INSERT INTO petugas (id_user, is_aktif) VALUES (?, ?)",
      [id_user, 1],
    );
    return {
      id_petugas: result.insertId,
      is_aktif: true,
    };
  },

  updateUser: async (data) => {
    await db.query(
      "UPDATE user SET nama = ?, email = ?, nomor_telepon = ? WHERE id_user = ?",
      [data.nama, data.email, data.nomor_telepon, data.id_user],
    );
    return {
      id_user: data.id_user,
      nama: data.nama,
      email: data.email,
      nomor_telepon: data.nomor_telepon,
    };
  },

  deleteUser: async (id_user, id_role) => {
    let id = null;
    let query = "";
    console.log(id_user, id_role);

    if (parseInt(id_role) === 2) {
      const data = await User.findPetugasByIdUser(id_user);
      console.log(data);
      if (!data) throw new Error("Data petugas tidak ditemukan");

      id = data.id_petugas;
      query = "UPDATE petugas SET is_aktif = 0 WHERE id_petugas = ?";
    } else if (parseInt(id_role) === 3) {
      const data = await User.findCustomerByIdUser(id_user);
      console.log(data);

      if (!data) throw new Error("Data customer tidak ditemukan");

      id = data.id_customer;
      query = "UPDATE customer SET is_aktif = 0 WHERE id_customer = ?";
    } else {
      throw new Error("Role tidak valid untuk dihapus melalui rute ini");
    }

    await db.query(query, [id]);

    return {
      id_user: id_user,
      id_ekstensi: id,
      is_aktif: false,
    };
  },
};

module.exports = manajemenAkun;
