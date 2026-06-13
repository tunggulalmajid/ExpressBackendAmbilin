-- 02_revisi_erd.sql

-- 1. Nonaktifkan pengecekan foreign key sementara
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Drop semua tabel lama agar bisa direkonstruksi bersih
DROP TABLE IF EXISTS `detail_setor_sampah`;
DROP TABLE IF EXISTS `setor_sampah`;
DROP TABLE IF EXISTS `artikel`;
DROP TABLE IF EXISTS `jenis_artikel`;
DROP TABLE IF EXISTS `transaksi`;
DROP TABLE IF EXISTS `subscribtion`;
DROP TABLE IF EXISTS `admin`;
DROP TABLE IF EXISTS `petugas`;
DROP TABLE IF EXISTS `customer`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `role`;
DROP TABLE IF EXISTS `jenis_sampah`;
DROP TABLE IF EXISTS `metode_pembayaran`;

-- 3. Rekonstruksi Tabel Berdasarkan Revisi ERD

-- Tabel Role
CREATE TABLE `role`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama_role` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel User (diperbaiki koordinat & refresh_token menjadi nullable agar registrasi tidak crash)
CREATE TABLE `user`(
    `id_user` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` TEXT NOT NULL,
    `id_role` BIGINT UNSIGNED NOT NULL,
    `foto` VARCHAR(255) NULL,
    `alamat` TEXT NULL,
    `nomor_telepon` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `refresh_token` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `user_id_role_foreign` FOREIGN KEY(`id_role`) REFERENCES `role`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Petugas
CREATE TABLE `petugas`(
    `id_petugas` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_user` BIGINT UNSIGNED NOT NULL,
    `is_aktif` BOOLEAN NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `petugas_id_user_foreign` FOREIGN KEY(`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Customer
CREATE TABLE `customer`(
    `id_customer` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_user` BIGINT UNSIGNED NOT NULL,
    `poin` BIGINT NOT NULL DEFAULT 0,
    `is_member` BOOLEAN NOT NULL DEFAULT 0,
    `is_aktif` BOOLEAN NOT NULL DEFAULT 1,
    `expired_member_date` DATETIME NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `customer_id_user_foreign` FOREIGN KEY(`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Admin
CREATE TABLE `admin`(
    `id_admin` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_user` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `admin_id_user_foreign` FOREIGN KEY(`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Subscribtion (di-drop kolom poin sesuai spesifikasi)
CREATE TABLE `subscribtion`(
    `id_subscribtion` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(255) NOT NULL,
    `harga` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Metode Pembayaran
CREATE TABLE `metode_pembayaran`(
    `id_metode_pembayaran` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(255) NOT NULL,
    `keterangan` TEXT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Transaksi (ditambah kolom poin_digunakan untuk menyimpan diskon poin)
CREATE TABLE `transaksi`(
    `id_transaksi` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_customer` BIGINT UNSIGNED NOT NULL,
    `id_admin` BIGINT UNSIGNED NULL,
    `id_metode_pembayaran` BIGINT UNSIGNED NOT NULL,
    `id_subscribtion` BIGINT UNSIGNED NOT NULL,
    `bukti_pembayaran` VARCHAR(255) NULL, -- Bisa NULL jika diskon poin 100%
    `poin_digunakan` BIGINT NOT NULL DEFAULT 0,
    `status` ENUM('menunggu', 'berhasil', 'gagal') NOT NULL DEFAULT 'menunggu',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `confirmed_at` TIMESTAMP NULL,
    CONSTRAINT `transaksi_id_customer_foreign` FOREIGN KEY(`id_customer`) REFERENCES `customer`(`id_customer`) ON DELETE CASCADE,
    CONSTRAINT `transaksi_id_admin_foreign` FOREIGN KEY(`id_admin`) REFERENCES `admin`(`id_admin`) ON DELETE SET NULL,
    CONSTRAINT `transaksi_id_metode_pembayaran_foreign` FOREIGN KEY(`id_metode_pembayaran`) REFERENCES `metode_pembayaran`(`id_metode_pembayaran`) ON DELETE CASCADE,
    CONSTRAINT `transaksi_id_subscribtion_foreign` FOREIGN KEY(`id_subscribtion`) REFERENCES `subscribtion`(`id_subscribtion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Jenis Sampah
CREATE TABLE `jenis_sampah`(
    `id_jenis_sampah` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(255) NOT NULL,
    `poin_per_kg` BIGINT NOT NULL DEFAULT 0,
    `is_delete` BOOLEAN NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Setor Sampah (langsung menyatu timbangan & foto bukti dari petugas)
CREATE TABLE `setor_sampah`(
    `id_setor_sampah` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_petugas` BIGINT UNSIGNED NULL,
    `id_customer` BIGINT UNSIGNED NOT NULL,
    `id_jenis_sampah` BIGINT UNSIGNED NULL,
    `status` ENUM('menunggu', 'proses', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
    `alamat` TEXT NOT NULL,
    `catatan` TEXT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `berat_sampah` DECIMAL(8, 2) NULL,
    `foto` VARCHAR(255) NOT NULL,
    `foto_bukti_penjemputan` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `pickup_at` TIMESTAMP NULL,
    CONSTRAINT `setor_sampah_id_jenis_sampah_foreign` FOREIGN KEY(`id_jenis_sampah`) REFERENCES `jenis_sampah`(`id_jenis_sampah`) ON DELETE SET NULL,
    CONSTRAINT `setor_sampah_id_petugas_foreign` FOREIGN KEY(`id_petugas`) REFERENCES `petugas`(`id_petugas`) ON DELETE SET NULL,
    CONSTRAINT `setor_sampah_id_customer_foreign` FOREIGN KEY(`id_customer`) REFERENCES `customer`(`id_customer`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Jenis Artikel
CREATE TABLE `jenis_artikel`(
    `id_jenis_artikel` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Artikel
CREATE TABLE `artikel`(
    `id_artikel` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_admin` BIGINT UNSIGNED NOT NULL,
    `id_jenis_artikel` BIGINT UNSIGNED NOT NULL,
    `judul` VARCHAR(255) NOT NULL,
    `foto_thumbnail` VARCHAR(255) NOT NULL,
    `isi` TEXT NOT NULL,
    `is_delete` BOOLEAN NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `artikel_id_admin_foreign` FOREIGN KEY(`id_admin`) REFERENCES `admin`(`id_admin`) ON DELETE CASCADE,
    CONSTRAINT `artikel_id_jenis_artikel_foreign` FOREIGN KEY(`id_jenis_artikel`) REFERENCES `jenis_artikel`(`id_jenis_artikel`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Aktifkan kembali pengecekan foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- 5. Seeding data master dasar untuk migrasi ini
INSERT INTO `role` (`id`, `nama_role`) VALUES
(1, 'Super Admin'),
(2, 'Petugas'),
(3, 'Customer')
ON DUPLICATE KEY UPDATE `nama_role` = VALUES(`nama_role`);

INSERT INTO `metode_pembayaran` (`id_metode_pembayaran`, `nama`, `keterangan`) VALUES
(1, 'Transfer Bank Mandiri', 'Kirim ke rekening Mandiri 142000xxxx a.n Ambilin'),
(2, 'Transfer Bank BCA', 'Kirim ke rekening BCA 02938xxxx a.n Ambilin'),
(3, 'Poin Reward', 'Pembayaran menggunakan potongan saldo poin aplikasi')
ON DUPLICATE KEY UPDATE `nama` = VALUES(`nama`), `keterangan` = VALUES(`keterangan`);
