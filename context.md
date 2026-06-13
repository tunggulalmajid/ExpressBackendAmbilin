# Dokumentasi Proyek "Ambilin"
**Sistem Informasi Manajemen Pengelolaan Sampah Ekonomis Menggunakan Geolocation, Subscription, dan Point Reward Berbasis Mobile App**

Dokumentasi ini disusun berdasarkan **Use Case Diagram** dan **Skema Database (SQL DDL)** hasil revisi terbaru untuk membantu proses pembangunan backend menggunakan Express.js.

---

## 1. Arsitektur Aktor & Hak Akses (Role)
Terdapat **3 Role Utama** yang tersimpan di dalam tabel `role` dan terhubung melalui tabel `user`:

1. **Pelanggan (Customer)**: Pengguna aplikasi mobile yang melakukan manajemen profil, pembelian paket subskripsi (membership) dengan pilihan diskon poin reward, pemesanan penjemputan sampah, dan membaca artikel.
2. **Petugas (Courier/Staff)**: Aktor lapangan yang bertugas mengklaim order penjemputan sampah, menimbang berat sampah di lokasi, mengunggah bukti jemput, menyelesaikan order, dan mengalirkan reward poin ke customer.
3. **Admin**: Aktor pengelola sistem yang memiliki hak penuh untuk manajemen data master (pelanggan, petugas, kategori sampah, harga subskripsi, artikel, verifikasi transaksi membership manual, dan melihat dashboard statistik).

---

## 2. Daftar Fitur Berdasarkan Use Case Diagram

### A. Fitur Umum (Semua Pengguna)
* **Mendaftar Akun (Register)**: Khusus untuk Pelanggan baru (bisa secara manual maupun menggunakan Google Sign-In).
* **Melakukan Login**: Autentikasi untuk Pelanggan, Petugas, dan Admin (manual dan Google Sign-In).
* **Melakukan Logout**: Penghapusan sesi/token dari sistem.
* **Melihat Profil & Mengubah Profil**: Manajemen informasi personal masing-masing aktor.
* **Mengubah Password**: Mengganti kata sandi lama dengan kata sandi baru.
* **Melihat Dashboard**: Tampilan utama/ringkasan informasi sesuai dengan hak akses masing-masing (Admin: statistik sistem, Petugas: total tugas & order aktif, Customer: saldo poin, status member, & 5 riwayat terakhir).
* **Auto-Expiry Check**: Sistem otomatis mengubah `is_member` menjadi `false` (0) saat login, get profile, atau dashboard diakses jika `expired_member_date` telah berlalu dari hari ini.

### B. Fitur Pelanggan (Customer)
* **Melihat Paket & Metode Pembayaran**: Mengambil paket premium dan jenis metode bayar yang tersedia (Transfer Bank / Potongan Poin).
* **Membeli Paket Subscription**: Berlangganan membership menggunakan diskon poin. Poin terpotong seketika. Jika sisa bayar > 0, wajib menyertakan bukti bayar transfer. Jika sisa bayar = 0 (lunas poin), transaksi langsung berstatus 'berhasil' dan membership aktif.
* **Memesan Penjemputan Sampah**: Mengajukan request penjemputan sampah berdasarkan lokasi koordinat (*Geolocation*) dengan memilih satu jenis sampah awal yang akan disetor.
* **Melihat History Permintaan Penjemputan**: Melacak riwayat pengajuan penjemputan sampah miliknya sendiri.
* **Melihat Artikel**: Membaca konten edukasi seputar sampah dan lingkungan. Listing artikel memotong preview isi artikel menjadi maksimal 150 karakter.

### C. Fitur Petugas (Petugas)
* **Melihat Order Penjemputan Aktif**: Petugas lapangan melihat pesanan masuk berstatus `'menunggu'`.
* **Mengklaim & Memproses Order**: Mengunci pesanan penjemputan menjadi status `'proses'`.
* **Melihat Histori Penjemputan Sampah**: Melihat daftar riwayat tugas penjemputan yang telah diselesaikan.
* **Selesaikan Order & Input Timbangan**: Petugas menginput timbangan berat sampah (kg) dan mengunggah foto bukti penjemputan. Status order diupdate menjadi `'selesai'` dan customer mendapat reward poin (berat_sampah * rate poin kategori).

### D. Fitur Admin (Back-Office)
* **Manajemen Data Pelanggan & Petugas**: Tambah, edit, dan soft-delete (nonaktifkan `is_aktif`) akun.
* **Manajemen Paket Subscription**: Mengubah harga/skema paket subskripsi.
* **Verifikasi Transaksi Subscription**: Admin menyetujui (`berhasil`) atau menolak (`gagal`) transaksi. Jika berhasil, membership customer diperpanjang +30 hari (dari tanggal expired lama jika masih aktif, atau dari sekarang jika sudah tidak aktif). Jika gagal, poin diskon dikembalikan penuh ke saldo customer.
* **Manajemen Kategori Sampah**: CRUD Master jenis sampah (nama dan rate poin per kg).
* **Manajemen Artikel**: CRUD postingan artikel lingkungan (dengan upload thumbnail gambar Cloudinary, soft-delete).

---

## 3. Kamus Data & Relasi Database (Database Schema)

### 3.1. Tabel Utama Pengguna & Otorisasi

#### `role`
* `id` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama_role` (VARCHAR 255)

#### `user`
* `id_user` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama` (VARCHAR 255)
* `email` (VARCHAR 255, UNIQUE)
* `password` (TEXT)
* `id_role` (BIGINT UNSIGNED, FK -> `role.id`)
* `foto` (VARCHAR 255, Nullable)
* `alamat` (TEXT, Nullable)
* `nomor_telepon` (VARCHAR 255, Nullable)
* `latitude` (DECIMAL 10,8, Nullable)
* `longitude` (DECIMAL 11,8, Nullable)
* `refresh_token` (TEXT, Nullable)
* `created_at` / `updated_at` (TIMESTAMP)

#### `customer`
* `id_customer` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_user` (BIGINT UNSIGNED, FK -> `user.id_user`)
* `poin` (BIGINT, Default: 0) - Saldo poin terupdate.
* `is_member` (BOOLEAN, Default: 0) - Status keanggotaan.
* `is_aktif` (BOOLEAN, Default: 1)
* `expired_member_date` (DATETIME, Nullable) - Batas waktu keanggotaan.

#### `petugas`
* `id_petugas` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_user` (BIGINT UNSIGNED, FK -> `user.id_user`)
* `is_aktif` (BOOLEAN, Default: 1)

#### `admin`
* `id_admin` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_user` (BIGINT UNSIGNED, FK -> `user.id_user`)

---

### 3.2. Tabel Fitur Bisnis & Transaksi

#### `subscribtion`
* `id_subscribtion` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama` (VARCHAR 255)
* `harga` (BIGINT)

#### `metode_pembayaran`
* `id_metode_pembayaran` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama` (VARCHAR 255)
* `keterangan` (TEXT)
* `created_at` (TIMESTAMP)

#### `transaksi`
* `id_transaksi` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_customer` (BIGINT UNSIGNED, FK -> `customer.id_customer`)
* `id_admin` (BIGINT UNSIGNED, Nullable, FK -> `admin.id_admin`)
* `id_metode_pembayaran` (BIGINT UNSIGNED, FK -> `metode_pembayaran.id_metode_pembayaran`)
* `id_subscribtion` (BIGINT UNSIGNED, FK -> `subscribtion.id_subscribtion`)
* `bukti_pembayaran` (VARCHAR 255, Nullable)
* `poin_digunakan` (BIGINT, Default: 0) - Poin pemotong harga.
* `status` (ENUM: 'menunggu', 'berhasil', 'gagal')
* `created_at` (TIMESTAMP)
* `confirmed_at` (TIMESTAMP, Nullable)

#### `jenis_sampah`
* `id_jenis_sampah` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama` (VARCHAR 255)
* `poin_per_kg` (BIGINT) - Rate poin per kilogram.
* `is_delete` (BOOLEAN) - Soft-delete flag.

#### `setor_sampah`
* `id_setor_sampah` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_petugas` (BIGINT UNSIGNED, Nullable, FK -> `petugas.id_petugas`)
* `id_customer` (BIGINT UNSIGNED, FK -> `customer.id_customer`)
* `id_jenis_sampah` (BIGINT UNSIGNED, Nullable, FK -> `jenis_sampah.id_jenis_sampah`)
* `status` (ENUM: 'menunggu', 'proses', 'selesai', 'dibatalkan')
* `alamat` (TEXT)
* `catatan` (TEXT, Nullable)
* `latitude` / `longitude` (DECIMAL 10,8)
* `berat_sampah` (DECIMAL 8,2, Nullable) - Diisi oleh petugas lapangan.
* `foto` (VARCHAR 255) - Foto tumpukan sampah dari customer.
* `foto_bukti_penjemputan` (VARCHAR 255, Nullable) - Diunggah oleh petugas lapangan.
* `created_at` (TIMESTAMP)
* `pickup_at` (TIMESTAMP, Nullable)

---

### 3.3. Tabel Konten & Informasi

#### `jenis_artikel`
* `id_jenis_artikel` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama` (VARCHAR 255)

#### `artikel`
* `id_artikel` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_admin` (BIGINT UNSIGNED, FK -> `admin.id_admin`)
* `id_jenis_artikel` (BIGINT UNSIGNED, FK -> `jenis_artikel.id_jenis_artikel`)
* `judul` (VARCHAR 255)
* `foto_thumbnail` (VARCHAR 255)
* `isi` (TEXT)
* `is_delete` (BOOLEAN)

---

## 4. Panduan Implementasi RESTful API di Express.js

### 4.1. Router Pembagian Endpoint (`/api`)

```javascript
// 1. Auth & Profile Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.post('/auth/google', authController.googleLogin);
router.put('/auth/update-password', verifyToken, authController.updatePassword);
router.get('/profile', verifyToken, profileController.getProfile);
router.put('/profile', verifyToken, profileController.updateProfile);
router.put('/profile/photo', verifyToken, profileController.updatePhoto);

// 2. Customer & Petugas Setor Sampah Routes
router.post('/setor', verifyToken, isCustomer, uploadCloud.single('foto'), setorController.ajukanSetor);
router.get('/setor/history/customer', verifyToken, isCustomer, setorController.dapatkanRiwayatCustomer);
router.get('/setor/active', verifyToken, isPetugas, setorController.dapatkanOrderAktif);
router.get('/setor/history/petugas', verifyToken, isPetugas, setorController.dapatkanRiwayatPetugas);
router.get('/setor/:id', verifyToken, setorController.dapatkanDetailSetor);
router.put('/setor/:id/process', verifyToken, isPetugas, setorController.prosesPenjemputan);
router.put('/setor/:id/complete', verifyToken, isPetugas, uploadCloud.single('foto_bukti_penjemputan'), setorController.selesaikanPenjemputan);

// 3. Subscription & Transaksi Routes
router.get('/subscriptions', verifyToken, subscribtionController.getSubscriptions);
router.get('/subscriptions/payment-methods', verifyToken, subscribtionController.getPaymentMethods);
router.get('/subscriptions/summary', verifyToken, isAdmin, subscribtionController.getSummary);
router.put('/subscriptions/:id', verifyToken, isAdmin, subscribtionController.updateSubscription);
router.post('/subscriptions/purchase', verifyToken, isCustomer, uploadCloud.single('bukti_pembayaran'), subscribtionController.buySubscription);
router.get('/subscriptions/transactions', verifyToken, isAdmin, subscribtionController.getTransactions);
router.put('/subscriptions/transactions/:id/confirm', verifyToken, isAdmin, subscribtionController.confirmTransaction);

// 4. Admin Management Routes
router.get('/manajemen-akun', verifyToken, isAdmin, manajemenAkunController.getAllUsers);
router.get('/manajemen-akun/:id_user', verifyToken, isAdmin, manajemenAkunController.getAkunDetail);
router.post('/manajemen-akun', verifyToken, isAdmin, manajemenAkunController.createUserAccount);
router.put('/manajemen-akun/:id_user', verifyToken, isAdmin, manajemenAkunController.updateUser);
router.delete('/manajemen-akun/:id_user', verifyToken, isAdmin, manajemenAkunController.deleteUser);
router.get('/jenis-sampah', jenisSampahController.getAllJenisSampah);
router.post('/jenis-sampah', verifyToken, isAdmin, jenisSampahController.create);
router.put('/jenis-sampah/:id_jenis_sampah', verifyToken, isAdmin, jenisSampahController.update);
router.delete('/jenis-sampah/:id_jenis_sampah', verifyToken, isAdmin, jenisSampahController.delete);

// 5. Artikel Routes
router.get('/articles/categories', verifyToken, artikelController.getCategories);
router.get('/articles', verifyToken, artikelController.getAllArticles);
router.get('/articles/:id', verifyToken, artikelController.getArticleById);
router.post('/articles', verifyToken, isAdmin, uploadCloud.single('foto_thumbnail'), artikelController.createArticle);
router.put('/articles/:id', verifyToken, isAdmin, uploadCloud.single('foto_thumbnail'), artikelController.updateArticle);
router.delete('/articles/:id', verifyToken, isAdmin, artikelController.deleteArticle);

// 6. Dashboard Routes
router.get('/dashboard', verifyToken, dashboardController.getDashboard);
```
