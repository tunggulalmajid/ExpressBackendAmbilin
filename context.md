# Dokumentasi Proyek "Ambilin"
**Sistem Informasi Manajemen Pengelolaan Sampah Ekonomis Menggunakan Geolocation, Subscription, dan Point Reward Berbasis Mobile App**

Dokumentasi ini disusun berdasarkan **Use Case Diagram** dan **Skema Database (SQL DDL)** yang disediakan untuk membantu proses pembangunan backend menggunakan Express.js.

---

## 1. Arsitektur Aktor & Hak Akses (Role)
Berdasarkan analisis *database* dan *use case diagram*, terdapat **3 Role Utama** yang tersimpan di dalam tabel `role` dan terhubung melalui tabel `user`:

1. **Pelanggan (Customer)**: Pengguna aplikasi mobile yang melakukan manajemen profil, pembelian paket subskripsi (membership), pemesanan penjemputan sampah, penukaran poin, dan membaca artikel.
2. **Petugas (Courier/Staff)**: Aktor lapangan yang bertugas memproses dan mengambil pesanan penjemputan sampah dari pelanggan.
3. **Admin**: Aktor pengelola sistem yang memiliki hak penuh untuk manajemen data master (pelanggan, petugas, kategori sampah, harga subskripsi, artikel, dan konfigurasi poin).

---

## 2. Daftar Fitur Berdasarkan Use Case Diagram

### A. Fitur Umum (Semua Pengguna)
* **Mendaftar Akun (Register)**: Khusus untuk Pelanggan baru (bisa secara manual maupun menggunakan Google Sign-In).
* **Melakukan Login**: Autentikasi untuk Pelanggan, Petugas, dan Admin (manual dan Google Sign-In).
* **Melihat Profil & Mengubah Profil**: Manajemen informasi personal masing-masing aktor.
* **Mengubah Password**: Mengganti kata sandi lama dengan kata sandi baru.
* **Melihat Dashboard**: Tampilan utama/ringkasan informasi sesuai dengan hak akses masing-masing.
* **Melakukan Logout**: Penghapusan sesi/token dari sistem.

### B. Fitur Pelanggan (Customer)
* **Membeli Paket Subscription**: Berlangganan fitur premium sampah ekonomis.
* **Memesan Penjemputan Sampah**: Mengajukan request penjemputan sampah berdasarkan lokasi koordinat (*Geolocation*).
* **Menukarkan Poin**: Menukar poin yang didapat dari penyetoran sampah menjadi *reward*.
* **Melihat History Permintaan Penjemputan**: Melacak riwayat pengajuan penjemputan sampah.
* **Melihat Artikel**: Membaca konten edukasi seputar sampah dan lingkungan.

### C. Fitur Petugas (Petugas)
* **Melihat Histori Penjemputan Sampah**: Melihat daftar riwayat tugas penjemputan.
* **Memproses Pemesanan**: Mengubah status penjemputan dan mengeksekusi pengambilan sampah pelanggan di lokasi.

### D. Fitur Admin (Back-Office)
* **Manajemen Data Pelanggan**: Menambah, melihat, mengedit, dan menghapus data pelanggan.
* **Manajemen Data Petugas**: Menambah, melihat, mengedit, dan menghapus data petugas lapangan.
* **Manajemen Paket Subscription**: Melihat harga paket dan mengubah harga/skema paket subskripsi.
* **Manajemen Kategori Sampah**: Menambah, melihat, mengedit, dan menghapus kategori/jenis sampah beserta rate poin per kilogram.
* **Manajemen Artikel**: Menambah, melihat, mengedit (mengubah), dan menghapus artikel (edukasi/informasi).
* **Manajemen Konfigurasi Poin**: Melihat dan mengubah konfigurasi aturan atau nilai konversi poin di sistem.

---

## 3. Kamus Data & Relasi Database (Database Schema)

Berikut adalah restrukturisasi skema database dari file `.sql` ke dalam format representasi tabel untuk pengembangan Express.js.

### 3.1. Tabel Utama Pengguna & Otorisasi

#### `role`
Menyimpan jenis-jenis role dalam sistem.
* `id` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama_role` (VARCHAR 255)

#### `user`
Tabel master kredensial dan biodata umum untuk semua aktor.
* `id_user` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama` (VARCHAR 255)
* `email` (VARCHAR 255)
* `password` (TEXT)
* `id_role` (BIGINT, FK -> `role.id`)
* `foto` (VARCHAR 255, Nullable)
* `alamat` (TEXT, Nullable)
* `nomor_telepon` (VARCHAR 255, Nullable)
* `latitude` (DECIMAL 10,8) - Lokasi untuk pemetaan koordinat.
* `longitude` (DECIMAL 11,8) - Lokasi untuk pemetaan koordinat.
* `refresh_token` (TEXT) - Digunakan untuk manajemen JWT Auth.
* `created_at` / `updated_at` (TIMESTAMP)

#### `customer`
Extends dari tabel `user` khusus untuk data spesifik pelanggan.
* `id_customer` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_user` (BIGINT, FK -> `user.id_user`)
* `poin` (BIGINT) - Saldo poin akumulasi dari setor sampah.
* `is_member` (BOOLEAN, Default: 0) - Status keaktifan paket premium.
* `is_aktif` (BOOLEAN, Default: 1)
* `expired_member_date` (DATETIME, Nullable) - Batas waktu keanggotaan subskripsi.

#### `petugas`
Extends dari tabel `user` khusus untuk petugas lapangan.
* `id_petugas` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_user` (BIGINT, FK -> `user.id_user`)
* `is_aktif` (BOOLEAN)

#### `admin`
Extends dari tabel `user` khusus untuk administrator.
* `id_admin` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_user` (BIGINT, FK -> `user.id_user`)

---

### 3.2. Tabel Fitur Bisnis & Transaksi

#### `subscribtion`
Master data paket langganan/membership yang bisa dibeli pelanggan.
* `id_subscribtion` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama` (VARCHAR 255)
* `harga` (BIGINT)
* `poin` (BIGINT) - Bonus/benefit poin yang langsung didapat saat beli paket.

#### `transaksi`
Mencatat pembelian paket subskripsi oleh pelanggan yang perlu dikonfirmasi oleh Admin.
* `id_transaksi` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_customer` (BIGINT, FK -> `customer.id_customer`)
* `id_admin` (BIGINT, Nullable, FK -> `admin.id_admin`) - Admin yang melakukan verifikasi/konfirmasi.
* `id_subscribtion` (BIGINT, FK -> `subscribtion.id_subscribtion`)
* `bukti_pembayaran` (VARCHAR 255) - Path/URL file gambar bukti transfer.
* `metode_pembayaran` (VARCHAR 255)
* `status` (ENUM: 'menunggu', 'berhasil', 'gagal')
* `created_at` (TIMESTAMP)
* `confirmed_at` (TIMESTAMP, Nullable)

#### `jenis_sampah`
Master data jenis sampah ekonomis beserta nilai tukarnya.
* `id_jenis_sampah` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama` (VARCHAR 255) - Contoh: Plastik, Kertas, Logam, Elektronik.
* `poin_per_kg` (BIGINT) - Nilai konversi poin per satu kilogram sampah.
* `is_delete` (BOOLEAN) - Soft delete flags.

#### `setor_sampah`
Data order/permintaan penjemputan sampah dari Customer ke Petugas.
* `id_setor_sampah` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_petugas` (BIGINT, Nullable, FK -> `petugas.id_petugas`) - Petugas yang mengambil/menangani order.
* `id_customer` (BIGINT, FK -> `customer.id_customer`)
* `status` (ENUM: 'menunggu', 'proses', 'selesai', 'dibatalkan') - Contoh status penjemputan.
* `alamat` (TEXT) - Alamat spesifik penjemputan.
* `catatan` (TEXT, Nullable)
* `latitude` / `longitude` (DECIMAL 10,8) - Titik koordinat penjemputan *Geolocation*.
* `foto` (VARCHAR 255) - Foto tumpukan sampah sebagai bukti awal atau final.
* `created_at` (TIMESTAMP) - Waktu pengajuan order.
* `pickup_at` (TIMESTAMP, Nullable) - Waktu eksekusi penjemputan oleh petugas.

#### `detail_setor_sampah`
Tabel pivot/relasi item-item jenis sampah dalam satu kali transaksi penjemputan.
* `id_detail_setor_sampah` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_setor_sampah` (BIGINT, FK -> `setor_sampah.id_setor_sampah`)
* `id_jenis_sampah` (BIGINT, FK -> `jenis_sampah.id_jenis_sampah`)
* `berat_sampah` (DECIMAL 8,2) - Berat timbangan riil dalam Kilogram (kg).

---

### 3.3. Tabel Konten & Informasi

#### `jenis_artikel`
Master data kategori artikel.
* `id_jenis_artikel` (BIGINT UNSIGNED, PK, Auto Increment)
* `nama` (VARCHAR 255)

#### `artikel`
Konten artikel edukasi lingkungan yang diunggah oleh Admin.
* `id_artikel` (BIGINT UNSIGNED, PK, Auto Increment)
* `id_admin` (BIGINT, FK -> `admin.id_admin`)
* `id_jenis_artikel` (BIGINT, FK -> `jenis_artikel.id_jenis_artikel`)
* `judul` (VARCHAR 255)
* `foto_thumbnail` (VARCHAR 255)
* `isi` (TEXT)
* `is_delete` (BOOLEAN)

---

## 4. Panduan Implementasi RESTful API di Express.js

### 4.1. Router Pembagian Endpoint (`/api`)

```javascript
// 1. Auth & Profile Routes
router.post('/auth/register', authController.register); // Input ke user & customer
router.post('/auth/login', authController.login);       // Generate JWT & Refresh Token
router.post('/auth/logout', authController.logout);
router.post('/auth/google', authController.googleLogin); // Login & Register otomatis via Firebase ID Token
router.put('/auth/update-password', verifyToken, authController.updatePassword); // Mengubah password user
router.get('/profile', verifyToken, profileController.getProfile);
router.put('/profile', verifyToken, profileController.updateProfile);
router.put('/profile/photo', verifyToken, profileController.updatePhoto);

// 2. Customer Features Routes (Subscription & Order)
router.post('/setor', verifyToken, isCustomer, setorController.ajukanSetor); // Mengajukan request setor
router.get('/subscriptions', verifyToken, subscribtionController.getSubscriptions);
router.post('/subscriptions/purchase', verifyToken, isCustomer, subscribtionController.buySubscription); // Pembelian membership

// 3. Petugas Features Routes
router.get('/setor/active', verifyToken, isPetugas, setorController.dapatkanOrderAktif);
router.get('/setor/history/petugas', verifyToken, isPetugas, setorController.dapatkanRiwayatPetugas);
router.put('/setor/:id/process', verifyToken, isPetugas, setorController.prosesPenjemputan); // Petugas mengambil order
router.put('/setor/:id/complete', verifyToken, isPetugas, setorController.selesaikanPenjemputan); // Menginput berat timbangan sampah

// 4. Admin Management Routes
router.post('/subscriptions', verifyToken, isAdmin, subscribtionController.createSubscription);
router.get('/subscriptions/transactions', verifyToken, isAdmin, subscribtionController.getTransactions);
router.put('/subscriptions/transactions/:id/confirm', verifyToken, isAdmin, subscribtionController.confirmTransaction);
router.get('/manajemen-akun', verifyToken, isAdmin, manajemenAkunController.getAkun);
router.post('/manajemen-akun', verifyToken, isAdmin, manajemenAkunController.createUser);
router.put('/manajemen-akun/:id_user', verifyToken, isAdmin, manajemenAkunController.updateUser);
router.delete('/manajemen-akun/:id_user', verifyToken, isAdmin, manajemenAkunController.deleteUser);
router.get('/jenis-sampah', jenisSampahController.getAllJenisSampah);
router.post('/jenis-sampah', verifyToken, isAdmin, jenisSampahController.create);
router.put('/jenis-sampah/:id_jenis_sampah', verifyToken, isAdmin, jenisSampahController.update);
router.delete('/jenis-sampah/:id_jenis_sampah', verifyToken, isAdmin, jenisSampahController.delete);
```

### 4.2. Otentikasi Google via Firebase Auth
Backend memverifikasi Firebase ID Token (JWT) yang dikirim oleh Flutter terhadap sertifikat publik milik Google. 
* **Otomatis Register/Login**: Jika email pengguna Google belum terdaftar di database local, backend akan mendaftarkan pengguna baru sebagai Customer (Role 3), mengunduh URL foto profil Google untuk disimpan sebagai foto profil, membuat entri customer, kemudian membuat token JWT lokal backend. Jika email sudah ada, pengguna langsung masuk dan memperoleh token JWT lokal.
* **Variabel ENV**: Membutuhkan `FIREBASE_PROJECT_ID` di file `.env`.
