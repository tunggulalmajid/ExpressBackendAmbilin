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
| **Membeli Paket Subscription** | Customer | **Selesai (100%)** | [subscribtionController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/subscribtionController.js) | Customer memilih paket dan mengunggah gambar bukti transfer pembayaran ke Cloudinary. |
| **Verifikasi Transaksi Subscription** | Admin | **Selesai (100%)** | [subscribtionController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/subscribtionController.js) | Admin menyetujui (`berhasil`) atau menolak (`gagal`) transaksi. Status `is_member` customer diaktifkan selama +30 hari dan poin bonus otomatis dikreditkan jika berhasil. |
| **Manajemen Kategori Artikel** | Admin | **Selesai (100%)** | [artikelController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/artikelController.js) | Menambah kategori tulisan baru (misal: "Edukasi Daur Ulang"). |
| **Manajemen Posting Artikel** | Admin | **Selesai (100%)** | [artikelController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/artikelController.js) | CRUD lengkap postingan artikel lingkungan (dengan upload thumbnail gambar Cloudinary, soft-delete). |
| **Membaca Artikel & Kategori** | Semua Role | **Selesai (100%)** | [artikelController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/artikelController.js) | Menampilkan list artikel aktif dan detail isi artikel untuk dipelajari user. |
| **Mengajukan Request Penjemputan Sampah** | Customer | **Selesai (100%)** | [setorController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/setorController.js) | Customer mengisi alamat penjemputan, titik koordinat peta (latitude/longitude), dan mengunggah foto tumpukan sampah. |
| **Melihat Order Penjemputan Aktif** | Petugas | **Selesai (100%)** | [setorController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/setorController.js) | Petugas lapangan melihat pesanan masuk berstatus `'menunggu'`. |
| **Mengklaim & Memproses Order** | Petugas | **Selesai (100%)** | [setorController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/setorController.js) | Mengunci pesanan penjemputan menjadi status `'proses'` dan terikat ke petugas bersangkutan. |
| **Selesaikan Order & Input Timbangan** | Petugas | **Selesai (100%)** | [setorController.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/controller/setorController.js) | Petugas menginput detail berat timbangan (satu atau banyak jenis sampah), status menjadi `'selesai'`, dan customer otomatis memperoleh reward poin secara dinamis. |

---

## 2. Keselarasan Tabel Database (DDL vs Model)

Seluruh tabel pada database MySQL telah sepenuhnya dibuat dan dihubungkan ke model backend masing-masing:
* Tabel **Kredensial & Profil**: `role`, `user`, `admin`, `petugas`, `customer` -> Dioperasikan oleh [user.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/models/user.js) dan [manajemenAkun.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/models/manajemenAkun.js).
* Tabel **Subscription**: `subscribtion`, `transaksi` -> Dioperasikan oleh [subscribtion.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/models/subscribtion.js).
* Tabel **Edukasi**: `jenis_artikel`, `artikel` -> Dioperasikan oleh [artikel.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/models/artikel.js).
* Tabel **Transaksi Sampah**: `jenis_sampah`, `setor_sampah`, `detail_setor_sampah` -> Dioperasikan oleh [jenisSampah.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/models/jenisSampah.js) dan [setor.js](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/models/setor.js).

---

## 3. Dokumentasi Swagger API

Seluruh rute endpoints baru (Subscription, Artikel, Fitur Petugas, Google Auth Firebase, dan Update Password) telah lengkap ditambahkan ke file konfigurasi Swagger di [swagger.json](file:///e:/code%20code/MobileITDev/Backend/ExpressBackendAmbilin/src/config/swagger.json). 

Hal ini memastikan:
- Dokumentasi API di endpoint `/api-docs` selalu sinkron dan ter-update secara *real-time*.
- Flutter/frontend developer dapat dengan mudah melihat kontrak request body, header JWT token, parameter query/path, dan response format dari backend.
