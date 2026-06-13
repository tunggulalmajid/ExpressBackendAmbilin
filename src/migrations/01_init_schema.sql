-- 01_init_schema.sql

-- 1. Tabel Role (harus dibuat pertama karena direferensikan oleh tabel user)
CREATE TABLE IF NOT EXISTS `role`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama_role` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel User (direferensikan oleh admin, petugas, customer)
CREATE TABLE IF NOT EXISTS `user`(
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

-- 3. Tabel Petugas
CREATE TABLE IF NOT EXISTS `petugas`(
    `id_petugas` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_user` BIGINT UNSIGNED NOT NULL,
    `is_aktif` BOOLEAN NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `petugas_id_user_foreign` FOREIGN KEY(`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Customer
CREATE TABLE IF NOT EXISTS `customer`(
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

-- 5. Tabel Admin
CREATE TABLE IF NOT EXISTS `admin`(
    `id_admin` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_user` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `admin_id_user_foreign` FOREIGN KEY(`id_user`) REFERENCES `user`(`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Subscription
CREATE TABLE IF NOT EXISTS `subscribtion`(
    `id_subscribtion` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(255) NOT NULL,
    `harga` BIGINT NOT NULL,
    `poin` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Transaksi
CREATE TABLE IF NOT EXISTS `transaksi`(
    `id_transaksi` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_customer` BIGINT UNSIGNED NOT NULL,
    `id_admin` BIGINT UNSIGNED NULL,
    `id_subscribtion` BIGINT UNSIGNED NOT NULL,
    `bukti_pembayaran` VARCHAR(255) NOT NULL,
    `metode_pembayaran` VARCHAR(255) NOT NULL,
    `status` ENUM('menunggu', 'berhasil', 'gagal') NOT NULL DEFAULT 'menunggu',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `confirmed_at` TIMESTAMP NULL,
    CONSTRAINT `transaksi_id_customer_foreign` FOREIGN KEY(`id_customer`) REFERENCES `customer`(`id_customer`) ON DELETE CASCADE,
    CONSTRAINT `transaksi_id_admin_foreign` FOREIGN KEY(`id_admin`) REFERENCES `admin`(`id_admin`) ON DELETE SET NULL,
    CONSTRAINT `transaksi_id_subscribtion_foreign` FOREIGN KEY(`id_subscribtion`) REFERENCES `subscribtion`(`id_subscribtion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Jenis Sampah
CREATE TABLE IF NOT EXISTS `jenis_sampah`(
    `id_jenis_sampah` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(255) NOT NULL,
    `poin_per_kg` BIGINT NOT NULL DEFAULT 0,
    `is_delete` BOOLEAN NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabel Setor Sampah
CREATE TABLE IF NOT EXISTS `setor_sampah`(
    `id_setor_sampah` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_petugas` BIGINT UNSIGNED NULL,
    `id_customer` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('menunggu', 'proses', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
    `alamat` TEXT NOT NULL,
    `catatan` TEXT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `foto` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `pickup_at` TIMESTAMP NULL,
    CONSTRAINT `setor_sampah_id_petugas_foreign` FOREIGN KEY(`id_petugas`) REFERENCES `petugas`(`id_petugas`) ON DELETE SET NULL,
    CONSTRAINT `setor_sampah_id_customer_foreign` FOREIGN KEY(`id_customer`) REFERENCES `customer`(`id_customer`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabel Jenis Artikel
CREATE TABLE IF NOT EXISTS `jenis_artikel`(
    `id_jenis_artikel` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Tabel Artikel
CREATE TABLE IF NOT EXISTS `artikel`(
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

-- 12. Tabel Detail Setor Sampah
CREATE TABLE IF NOT EXISTS `detail_setor_sampah`(
    `id_detail_setor_sampah` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_setor_sampah` BIGINT UNSIGNED NOT NULL,
    `id_jenis_sampah` BIGINT UNSIGNED NOT NULL,
    `berat_sampah` DECIMAL(8, 2) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `detail_setor_sampah_id_jenis_sampah_foreign` FOREIGN KEY(`id_jenis_sampah`) REFERENCES `jenis_sampah`(`id_jenis_sampah`) ON DELETE CASCADE,
    CONSTRAINT `detail_setor_sampah_id_setor_sampah_foreign` FOREIGN KEY(`id_setor_sampah`) REFERENCES `setor_sampah`(`id_setor_sampah`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Seeding data master role
INSERT INTO `role` (`id`, `nama_role`) VALUES
(1, 'Super Admin'),
(2, 'Petugas'),
(3, 'Customer')
ON DUPLICATE KEY UPDATE `nama_role` = VALUES(`nama_role`);
