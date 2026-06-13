const Artikel = require("../models/artikel");
const response = require("../utils/responseHelper");
const db = require("../config/dbConf");

const ArtikelController = {
  // === KATEGORI ARTIKEL ===

  // 1. Ambil semua kategori artikel
  getCategories: async (req, res) => {
    try {
      const data = await Artikel.getJenisArtikel();
      return response.success(res, "Berhasil mengambil kategori artikel", data);
    } catch (error) {
      console.error("error getCategories:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 2. Admin membuat kategori baru
  createCategory: async (req, res) => {
    try {
      const { nama } = req.body;
      if (!nama) {
        return response.error(res, "Nama kategori wajib diisi", 400);
      }

      const newCategory = await Artikel.createJenisArtikel(nama);
      return response.success(res, "Berhasil menambahkan kategori artikel baru", newCategory, 201);
    } catch (error) {
      console.error("error createCategory:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // === ARTIKEL ===

  // 3. Ambil semua artikel aktif
  getAllArticles: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const parsedPage = parseInt(page) || 1;
      const parsedLimit = parseInt(limit) || 10;
      const offset = (parsedPage - 1) * parsedLimit;

      const { total, data } = await Artikel.getAll(parsedLimit, offset);
      const formattedData = data.map(art => {
        let preview = art.isi;
        if (preview && preview.length > 150) {
          preview = preview.substring(0, 150) + "...";
        }
        return {
          ...art,
          isi: preview
        };
      });
      return res.status(200).json({
        status: "success",
        message: "Berhasil mengambil daftar artikel",
        pagination: {
          total_items: total,
          total_pages: Math.ceil(total / parsedLimit),
          current_page: parsedPage,
          limit: parsedLimit
        },
        data: formattedData
      });
    } catch (error) {
      console.error("error getAllArticles:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 4. Ambil satu artikel berdasarkan ID
  getArticleById: async (req, res) => {
    try {
      const id = req.params.id;
      const article = await Artikel.findById(id);

      if (!article) {
        return response.error(res, "Artikel tidak ditemukan", 404);
      }

      return response.success(res, "Berhasil mengambil detail artikel", article);
    } catch (error) {
      console.error("error getArticleById:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 5. Admin menulis artikel baru
  createArticle: async (req, res) => {
    try {
      const { id_jenis_artikel, judul, isi } = req.body;
      const id_user = req.user.id_user;

      if (!id_jenis_artikel || !judul || !isi) {
        return response.error(res, "Kategori, judul, dan isi artikel wajib diisi", 400);
      }

      if (!req.file) {
        return response.error(res, "Foto thumbnail artikel wajib diunggah", 400);
      }

      // Hubungkan ke id_admin
      const [adminRows] = await db.query("SELECT id_admin FROM admin WHERE id_user = ?", [id_user]);
      const admin = adminRows[0];
      if (!admin) {
        return response.error(res, "Profil admin tidak ditemukan", 404);
      }

      // Pastikan kategori artikel ada
      const catExists = await Artikel.findJenisArtikelById(id_jenis_artikel);
      if (!catExists) {
        return response.error(res, "Kategori artikel tidak ditemukan", 404);
      }

      const insertId = await Artikel.create({
        id_admin: admin.id_admin,
        id_jenis_artikel,
        judul,
        foto_thumbnail: req.file.path, // URL Cloudinary
        isi
      });

      const responseData = {
        id_artikel: insertId,
        id_jenis_artikel,
        judul,
        foto_thumbnail_url: req.file.path,
        isi
      };

      return response.success(res, "Berhasil menambahkan artikel baru", responseData, 201);
    } catch (error) {
      console.error("error createArticle:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 6. Admin memperbarui artikel
  updateArticle: async (req, res) => {
    try {
      const id_artikel = req.params.id;
      const { id_jenis_artikel, judul, isi } = req.body;

      if (!id_jenis_artikel || !judul || !isi) {
        return response.error(res, "Kategori, judul, dan isi artikel wajib diisi", 400);
      }

      const articleExists = await Artikel.findById(id_artikel);
      if (!articleExists) {
        return response.error(res, "Artikel tidak ditemukan", 404);
      }

      // Pastikan kategori artikel ada
      const catExists = await Artikel.findJenisArtikelById(id_jenis_artikel);
      if (!catExists) {
        return response.error(res, "Kategori artikel tidak ditemukan", 404);
      }

      const foto_thumbnail = req.file ? req.file.path : null;

      const isUpdated = await Artikel.update(id_artikel, {
        id_jenis_artikel,
        judul,
        foto_thumbnail,
        isi
      });

      if (!isUpdated) {
        return response.error(res, "Gagal memperbarui artikel", 500);
      }

      const updatedArticle = await Artikel.findById(id_artikel);
      return response.success(res, "Berhasil memperbarui artikel", updatedArticle);
    } catch (error) {
      console.error("error updateArticle:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  },

  // 7. Admin menghapus artikel (Soft Delete)
  deleteArticle: async (req, res) => {
    try {
      const id_artikel = req.params.id;

      const articleExists = await Artikel.findById(id_artikel);
      if (!articleExists) {
        return response.error(res, "Artikel tidak ditemukan atau sudah dihapus", 404);
      }

      const isDeleted = await Artikel.delete(id_artikel);
      if (!isDeleted) {
        return response.error(res, "Gagal menghapus artikel", 500);
      }

      return response.success(res, "Berhasil menghapus artikel (soft delete)", { id_artikel });
    } catch (error) {
      console.error("error deleteArticle:", error);
      return response.error(res, "Terjadi kesalahan pada server", 500);
    }
  }
};

module.exports = ArtikelController;
