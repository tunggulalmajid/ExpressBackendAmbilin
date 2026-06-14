# API Backend Ambilin

API Backend Ambilin adalah backend application berbasis **Node.js** dan **Express.js** untuk mengelola layanan penjemputan sampah, keanggotaan (subscriptions), artikel edukasi, manajemen akun, serta dashboard multi-role (Admin, Customer, Petugas).

---

## Tech Stack

- **Core**: Node.js & Express.js
- **Database**: MySQL (menggunakan driver `mysql2` dengan raw queries terstruktur)
- **Otentikasi & Keamanan**: JSON Web Token (JWT) & BcryptJS
- **Upload Gambar**: Cloudinary (menggunakan `multer` & `multer-storage-cloudinary`)
- **Dokumentasi API**: Swagger UI (`swagger-ui-express` & `swagger.json`)
- **Logging**: Morgan
- **Containerization**: Docker & Docker Compose

---

## Fitur Utama

1. **Autentikasi (JWT)**: Login/Register, Google Sign-In (Firebase ID Token), refresh token, update password, dan logout.
2. **Manajemen Akun**: CRUD akun Petugas dan Customer oleh Super Admin (mendukung soft delete).
3. **Pengajuan Setor Sampah**: Pengajuan penjemputan sampah oleh Customer dengan validasi koordinat (latitude & longitude) dan unggah foto.
4. **Riwayat Penjemputan**:
   - Customer: Riwayat penjemputan dengan pagination.
   - Petugas: Penjemputan aktif (menunggu) dan riwayat tugas yang ditangani (proses dan selesai) terurut dengan pagination.
5. **Dashboard Multi-Role**:
   - **Admin**: pending transactions, total pendapatan, total sampah terkumpul, total artikel, dan 5 transaksi terbaru.
   - **Customer**: total poin reward, status membership, tanggal kedaluwarsa membership, dan 3 artikel terbaru.
   - **Petugas**: total pesanan dilayani dan total sampah yang diangkut.
6. **Subscription (Membership)**: Pembelian paket membership bulanan dengan pemotongan poin reward, verifikasi bukti transfer pembayaran oleh Admin, dan riwayat transaksi subscription bulanan.
7. **Artikel Edukasi**: Menulis, mengupdate, menghapus artikel edukasi oleh Admin dengan filter kategori dan pagination.

---

## Struktur Direktori

```text
├── src/
│   ├── config/          # Konfigurasi Database, Cloudinary, Swagger.json
│   ├── controller/      # Handler Logika API
│   ├── middleware/      # Middleware Otentikasi (verifyToken) & Otorisasi Peran (checkRole)
│   ├── migrations/      # Migrasi Skema Basis Data MySQL otomatis
│   ├── models/          # Query Basis Data & Logika Bisnis
│   ├── routes/          # Defini Rute API
│   ├── seeders/         # Master Data Seeding (Role, Metode Pembayaran)
│   ├── utils/           # Helper Response, Membership Expired checker
│   └── index.js         # Entrypoint utama server
├── Dockerfile           # Docker configuration
├── docker-compose.yaml  # Docker Compose configuration
├── package.json         # Dependensi & Script Node.js
└── README.md
```

---

## Panduan Instalasi & Penggunaan

### Prasyarat
- **Node.js** (v18 ke atas disarankan)
- **MySQL Database**
- **Cloudinary Account** (untuk upload foto profil, foto sampah, & bukti pembayaran)

### Langkah Setup

1. **Clone repository** dan masuk ke direktori project.
2. **Instal dependensi**:
   ```bash
   npm install
   ```
3. **Konfigurasi Environment Variables**:
   Salin berkas `.env.example` ke `.env` lalu lengkapi isinya:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=password_db
   DB_NAME=ambilin_db
   JWT_SECRET=rahasia_jwt_secret
   JWT_REFRESH_SECRET=rahasia_jwt_refresh_secret
   CLOUDINARY_CLOUD_NAME=nama_cloud_cloudinary
   CLOUDINARY_API_KEY=key_api_cloudinary
   CLOUDINARY_API_SECRET=secret_api_cloudinary
   ```
4. **Jalankan Seeders (Opsional)**:
   Migrasi tabel database berjalan otomatis saat server pertama kali dijalankan. Untuk mengisi data master awal (seperti role & metode pembayaran), jalankan:
   ```bash
   npm run seed
   ```
5. **Jalankan Aplikasi dalam Mode Pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`. Dokumentasi Swagger API dapat diakses melalui `http://localhost:3000/api-docs`.

---

## Docker Setup

Gunakan Docker Compose untuk menjalankan aplikasi dan database MySQL secara kontainerisasi instan:

```bash
docker-compose up --build -d
```

Rute Swagger API di Docker juga akan tersedia di `http://localhost:3000/api-docs`.
