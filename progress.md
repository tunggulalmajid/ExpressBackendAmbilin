# Laporan Kemajuan Proyek (Progress Report) — Backend Ambilin

Dokumen ini melacak seluruh kemajuan implementasi fitur backend Express.js untuk proyek **Ambilin** dan membandingkannya dengan spesifikasi kebutuhan yang didefinisikan dalam [context.md](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/context.md).

---

## 1. Tabel Perbandingan Fitur: Context vs Implementasi

| Modul Fitur (Berdasarkan `context.md`) | Hak Akses (Role) | Status Implementasi | Nama File yang Bertanggung Jawab | Keterangan / Catatan |
| :--- | :--- | :---: | :--- | :--- |
| **Registrasi Akun Baru** | Customer | **Selesai (100%)** | [authController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/authController.js) | Melakukan hashing password (bcrypt), mendaftarkan ke tabel `user`, dan otomatis membuat baris profil di tabel `customer`. |
| **Login & Logout Sesi** | Semua Role | **Selesai (100%)** | [authController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/authController.js) | Menghasilkan JWT Access Token dan Refresh Token, serta menghapus token saat logout. |
| **Login & Register via Google** | Customer | **Selesai (100%)** | [authController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/authController.js) | Memverifikasi Firebase ID Token (Google Auth) dari Flutter. Otomatis mendaftarkan user baru (Register) atau masuk untuk user lama (Login). |
| **Mengubah Kata Sandi (Update Password)** | Semua Role | **Selesai (100%)** | [authController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/authController.js) | Mengganti password user yang sedang masuk dengan memverifikasi password lama dan mencocokkan konfirmasi password baru. |
| **Manajemen Profil & Koordinat Geolocation** | Semua Role | **Selesai (100%)** | [profileController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/profileController.js) | Mendukung update data profil, update koordinat latitude/longitude, dan upload foto ke Cloudinary. |
| **Manajemen Akun Petugas & Customer** | Admin | **Selesai (100%)** | [manajemenAkunController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/manajemenAkunController.js) | CRUD akun petugas/customer baru secara langsung dari admin panel dengan sistem soft-delete (menonaktifkan flag `is_aktif`). |
| **Manajemen Kategori/Jenis Sampah** | Admin | **Selesai (100%)** | [jenisSampahController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/jenisSampahController.js) | CRUD Master jenis sampah (nama, rate poin per kg, is_delete soft-delete). |
| **Membeli Paket Subscription** | Customer | **Selesai (100%)** | [subscribtionController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/subscribtionController.js) | Memanfaatkan poin diskon secara instan. Jika nominal sisa bayar > 0, wajib mengunggah bukti bayar. Jika sisa bayar = 0, transaksi langsung berhasil dan membership diaktifkan. |
| **Verifikasi Transaksi Subscription** | Admin | **Selesai (100%)** | [subscribtionController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/subscribtionController.js) | Admin menyetujui (`berhasil`) atau menolak (`gagal`) transaksi. Status `is_member` customer diaktifkan selama +30 hari (akumulatif jika membership masih aktif). Jika ditolak, poin dikembalikan ke saldo customer. |
| **Manajemen Kategori Artikel** | Admin | **Selesai (100%)** | [artikelController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/artikelController.js) | Menampilkannya via GET. Endpoint POST kategori dihapus untuk penyederhanaan data master seeder. |
| **Manajemen Posting Artikel** | Admin | **Selesai (100%)** | [artikelController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/artikelController.js) | CRUD lengkap postingan artikel lingkungan (dengan upload thumbnail gambar Cloudinary, soft-delete). |
| **Membaca Artikel & Detail** | Semua Role | **Selesai (100%)** | [artikelController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/artikelController.js) | Menampilkan list artikel aktif (di mana `isi` dipangkas max 150 karakter) dan detail isi lengkap artikel di endpoint `GET /api/articles/:id`. |
| **Mengajukan Request Penjemputan Sampah** | Customer | **Selesai (100%)** | [setorController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/setorController.js) | Customer mengisi alamat penjemputan, titik koordinat peta (latitude/longitude), memilih jenis sampah awal, dan mengunggah foto tumpukan sampah. |
| **Melihat History Permintaan Customer** | Customer | **Selesai (100%)** | [setorController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/setorController.js) | Customer melihat riwayat setorannya sendiri di endpoint `GET /api/setor/history/customer`. |
| **Melihat Order Penjemputan Aktif** | Petugas | **Selesai (100%)** | [setorController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/setorController.js) | Petugas melihat pesanan masuk berstatus `'menunggu'`. |
| **Mengklaim & Memproses Order** | Petugas | **Selesai (100%)** | [setorController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/setorController.js) | Mengunci pesanan penjemputan menjadi status `'proses'`. |
| **Selesaikan Order & Input Timbangan** | Petugas | **Selesai (100%)** | [setorController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/setorController.js) | Petugas menginput timbangan berat sampah (kg) dan mengunggah foto bukti penjemputan, status order diubah menjadi `'selesai'`, dan customer mendapat reward poin. |
| **Dashboard Informasi** | Semua Role | **Selesai (100%)** | [dashboardController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/dashboardController.js) | Endpoint `GET /api/dashboard` yang otomatis menampilkan rangkasan informasi, data riwayat, statistik, serta memperbarui membership kedaluwarsa secara otomatis. |

---

## 2. Keselarasan Tabel Database (DDL vs Model)

Seluruh tabel pada database MySQL telah sepenuhnya disesuaikan dengan skema DDL revisi terbaru (`02_revisi_erd.sql`):
* Pivot tabel `detail_setor_sampah` dihilangkan. Field `id_jenis_sampah`, `berat_sampah`, dan `foto_bukti_penjemputan` disatukan langsung ke dalam tabel `setor_sampah` agar struktur pengiriman data lebih ramping.
* Kolom `poin` pada tabel `subscribtion` dihilangkan, digantikan dengan kolom `poin_digunakan` di tabel `transaksi` untuk mendukung konsep poin reward sebagai diskon harga.
* Tabel `metode_pembayaran` dibentuk untuk menampung metode transfer bank maupun pembayaran poin langsung.
* Status membership customer (`is_member` menjadi `false`) akan di-update seketika jika tanggal kedaluwarsa telah terlewati saat login, refresh token, get profile, atau dashboard dimuat.

---

## 3. Dokumentasi Swagger API

Seluruh rute endpoints (termasuk Dashboard baru, Metode Pembayaran, Detail Artikel, Riwayat Setoran Customer, serta parameter timbangan berat dan foto bukti jemput) telah sukses didefinisikan di file konfigurasi Swagger di [swagger.json](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/config/swagger.json). 
