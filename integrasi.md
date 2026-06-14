# Panduan Lengkap Integrasi API untuk Developer Mobile (Flutter / React Native)

Dokumen ini dirancang khusus untuk memudahkan developer mobile dalam mengintegrasikan aplikasi dengan **API Backend Ambilin**. Panduan ini menyertakan contoh kode Dart/Flutter (menggunakan library `dio`), detail skema JSON request/response, dan alur otentikasi.

---

## 1. Standar Integrasi & Penanganan Otentikasi

### Base URL
- **Localhost Emulator Android**: `http://10.0.2.2:3000` (IP emulator bawaan Android untuk mengakses localhost PC)
- **Localhost Emulator iOS / Device Fisik**: Menggunakan IP local PC Anda (contoh: `http://192.168.1.10:3000`) atau domain production.
- **Rute Dokumentasi Swagger**: `/api-docs`

---

## 2. Penanganan Token Otentikasi (JWT) via Dio Interceptor (Flutter)

Untuk memudahkan penanganan refresh token secara otomatis di aplikasi mobile, sangat direkomendasikan menggunakan **Dio Interceptor**. Interceptor ini bertugas:
1. Menyisipkan token `Authorization: Bearer <token>` secara otomatis ke setiap request yang membutuhkan otentikasi.
2. Mendeteksi error `401 Unauthorized` (token expired), melakukan pemanggilan otomatis ke API `/api/auth/refresh` untuk memperbarui token, memperbarui storage lokal, dan mengulangi request awal yang sempat gagal tanpa memutus jalannya aplikasi.

### Contoh Implementasi `DioInterceptor` (Dart/Flutter):

```dart
import 'package:dio/dio.dart';

class AppInterceptor extends Interceptor {
  final Dio dio;
  AppInterceptor(this.dio);

  // Gantilah dengan mekanisme penyimpanan lokal Anda (contoh: flutter_secure_storage atau shared_preferences)
  Future<String?> getAccessToken() async => "ACCESS_TOKEN_LOKAL";
  Future<String?> getRefreshToken() async => "REFRESH_TOKEN_LOKAL";
  Future<void> saveTokens(String access, String refresh) async {
    // Simpan token baru ke secure storage
  }

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Kecualikan endpoint public yang tidak memerlukan token
    if (!options.path.contains('/api/auth/login') && 
        !options.path.contains('/api/auth/register') && 
        !options.path.contains('/api/auth/refresh')) {
      final token = await getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    return handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Deteksi jika server mengembalikan 401 (Unauthorized / Token Expired)
    if (err.response?.statusCode == 401) {
      final refreshToken = await getRefreshToken();
      if (refreshToken != null) {
        try {
          // Buat instance Dio baru agar tidak memicu interceptor loop
          final refreshDio = Dio(BaseOptions(baseUrl: dio.options.baseUrl));
          
          final response = await refreshDio.post('/api/auth/refresh', data: {
            'token': refreshToken
          });

          if (response.statusCode == 200) {
            final newAccess = response.data['data']['accessToken'];
            final newRefresh = response.data['data']['refreshToken'];
            
            // Simpan token baru ke storage
            await saveTokens(newAccess, newRefresh);

            // Perbarui header request awal yang gagal dan jalankan ulang
            final options = err.requestOptions;
            options.headers['Authorization'] = 'Bearer $newAccess';
            
            final cloneReq = await dio.request(
              options.path,
              options: Options(
                method: options.method,
                headers: options.headers,
              ),
              data: options.data,
              queryParameters: options.queryParameters,
            );
            return handler.resolve(cloneReq);
          }
        } catch (e) {
          // Jika refresh token juga expired / gagal, arahkan user ke halaman Login (Logout paksa)
          print("Refresh token kedaluwarsa. Arahkan ke Login.");
        }
      }
    }
    return handler.next(err);
  }
}
```

---

## 3. Format Response Pagination Standard

Setiap data list (seperti riwayat, artikel, akun) dibungkus dengan format response terstandarisasi. Pastikan model data di mobile memetakan properti `pagination` ini untuk memicu *infinite scroll* atau pagination button:

```json
{
  "status": "success",
  "message": "Berhasil mengambil data",
  "pagination": {
    "total_items": 35,
    "total_pages": 4,
    "current_page": 1,
    "limit": 10
  },
  "data": [
    // Array dari objek data
  ]
}
```

---

## 4. Alur Integrasi Rinci Peran (Multi-Role API Reference)

### A. FITUR OOTB / AUTH (Semua Peran)

#### 1. Register Akun Customer Baru
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "nama": "Tunggul",
    "email": "tunggul@gmail.com",
    "password": "password123"
  }
  ```
- **Response Sukses (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "Registrasi user berhasil",
    "data": {
      "id_user": 12,
      "nama": "Tunggul",
      "email": "tunggul@gmail.com"
    }
  }
  ```

#### 2. Login Akun Biasa
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "tunggul@gmail.com",
    "password": "password123"
  }
  ```
- **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Login berhasil",
    "data": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "user": {
        "id_user": 12,
        "nama": "Tunggul",
        "email": "tunggul@gmail.com",
        "id_role": 3,
        "nama_role": "Customer"
      }
    }
  }
  ```

#### 3. Login Google (Google Sign-In)
- **Endpoint**: `POST /api/auth/google`
- **Request Body**:
  ```json
  {
    "idToken": "FIREBASE_ID_TOKEN_DARI_FLUTTER_GOOGLE_SIGN_IN"
  }
  ```
- **Fungsi**: Backend akan memverifikasi token ke Firebase Auth. Jika email belum terdaftar di database, backend otomatis membuat akun customer baru (Auto-Register) lalu mengembalikan token JWT.

---

### B. ALUR INTEGRASI CUSTOMER (Role ID: 3)

#### 1. Dashboard Customer
- **Endpoint**: `GET /api/dashboard/customer`
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Berhasil memuat dashboard Customer",
    "data": {
      "total_poin": 1500,
      "is_member": true,
      "expired_member_date": "2026-07-14T10:00:00.000Z",
      "recent_articles": [
        {
          "id_artikel": 1,
          "judul": "Cara Memilah Sampah Plastik",
          "foto_thumbnail": "https://res.cloudinary.com...",
          "isi": "Isi artikel pendek (maksimal 150 karakter)...",
          "created_at": "2026-06-14T10:00:00.000Z"
        }
      ]
    }
  }
  ```

#### 2. Get Jenis Sampah (Paginated, Wajib menyertakan Bearer Token)
- **Endpoint**: `GET /api/jenis-sampah?page=1&limit=10`
- **Fungsi**: Tampilkan di form drop-down pilihan jenis sampah saat customer ingin menyetor.

#### 3. Pengajuan Setor Sampah (Multipart Form-Data)
Pastikan request dikirim sebagai `multipart/form-data`. Di Flutter menggunakan Dio, buat objek `FormData` seperti berikut:

```dart
Future<void> ajukanSetor(String alamat, double lat, double lng, String catatan, int idJenisSampah, String imagePath) async {
  FormData formData = FormData.fromMap({
    'id_jenis_sampah': idJenisSampah,
    'alamat': alamat,
    'latitude': lat.toString(),
    'longitude': lng.toString(),
    'catatan': catatan,
    'foto': await MultipartFile.fromFile(imagePath, filename: 'sampah.jpg'),
  });

  Response response = await dio.post('/api/setor', data: formData);
  // Tangani response...
}
```
- **Response Sukses (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "Permintaan setor sampah berhasil dikirim",
    "data": {
      "id_setor": 15,
      "foto_url": "https://res.cloudinary.com/dbhycng5p/image/upload/v17782/ambilin/setor_sampah/sampah.jpg"
    }
  }
  ```

#### 4. Riwayat Penjemputan Sampah Customer
- **Endpoint**: `GET /api/setor/history/customer?page=1&limit=10`
- **Data yang dikembalikan**: Riwayat penjemputan sampah lengkap beserta statusnya (`menunggu`, `proses`, `selesai`, `dibatalkan`).

#### 5. Pengajuan Pembelian Membership (Subscription)
- **Endpoint**: `POST /api/subscriptions/purchase` (Multipart Form-Data)
- **Fungsi**: Membeli paket membership.
- **Request Fields**:
  - `id_subscribtion` (integer/string)
  - `id_metode_pembayaran` (integer/string)
  - `poin_digunakan` (integer/string, default: 0)
  - `bukti_pembayaran` (File/Binary, Wajib jika sisa bayar > 0)
- **Catatan Logika Integrasi**:
  1. Jika harga paket 100.000 dan poin customer ada 120.000, lalu customer menginput `poin_digunakan = 100000`, maka sisa bayar = 0. Frontend **tidak perlu** mengunggah berkas `bukti_pembayaran`, dan status transaksi lunas otomatis (`status = berhasil`).
  2. Jika ada sisa bayar > 0, frontend **wajib** mengunggah berkas `bukti_pembayaran`. Status transaksi awal adalah `menunggu`.

#### 6. Riwayat Pembelian Membership Customer
- **Endpoint**: `GET /api/subscriptions/history?page=1&limit=10`
- **Fungsi**: Menampilkan daftar riwayat pengajuan subscription bulanan customer sendiri.

---

### C. ALUR INTEGRASI PETUGAS LAPANGAN (Role ID: 2)

#### 1. Dashboard Petugas
- **Endpoint**: `GET /api/dashboard/petugas`
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Berhasil memuat dashboard Petugas",
    "data": {
      "total_pesanan_dilayani": 12,
      "total_sampah_diangkut": 150.8
    }
  }
  ```

#### 2. Mengambil Order Aktif (Waitlist Antrean Penjemputan)
- **Endpoint**: `GET /api/setor/active?page=1&limit=10`
- **Fungsi**: Menampilkan semua pesanan dari customer yang berstatus `menunggu` dan lokasinya paling dekat/siap dijemput petugas.

#### 3. Memproses / Mengklaim Order
- **Endpoint**: `PUT /api/setor/:id/process`
- **Fungsi**: Mengubah status order menjadi `proses` dan mencatat ID petugas yang menangani.

#### 4. Selesaikan Order (Timbang & Foto Bukti - Multipart)
Petugas menimbang sampah di lokasi customer, lalu mengupload data untuk penyelesaian order.
- **Endpoint**: `PUT /api/setor/:id/complete` (Multipart Form-Data)
- **Fields**:
  - `berat_sampah` (number/string, contoh: `4.2`)
  - `foto_bukti_penjemputan` (File/Binary)
- **Dio/Flutter Request Snippet**:
  ```dart
  FormData formData = FormData.fromMap({
    'berat_sampah': '4.2',
    'foto_bukti_penjemputan': await MultipartFile.fromFile(imagePath, filename: 'bukti.jpg'),
  });
  Response response = await dio.put('/api/setor/15/complete', data: formData);
  ```

#### 5. Riwayat Pekerjaan Petugas (Terurut Prioritas)
- **Endpoint**: `GET /api/setor/history/petugas?page=1&limit=10`
- **Fungsi**: Menampilkan semua order yang dipegang petugas.
- **Catatan Prioritas Sorting**: Database menyortir order berstatus `proses` di paling atas (agar petugas tahu tugas aktif saat ini), disusul oleh order berstatus `selesai` (diurutkan dari waktu terbaru).

---

### D. ALUR INTEGRASI SUPER ADMIN (Role ID: 1)

#### 1. Dashboard Admin
- **Endpoint**: `GET /api/dashboard/admin`
- **Data**: Menampilkan total nominal transaksi berhasil, total pending verifikasi pembayaran, total sampah yang berhasil dikumpulkan secara global, total artikel aktif, dan list 5 transaksi masuk terbaru.

#### 2. Manajemen Akun Petugas & Customer (CRUD)
- **Get Akun**: `GET /api/manajemen-akun?role=2&page=1&limit=10`
- **Detail Akun**: `GET /api/manajemen-akun/:id_user`
- **Create Akun**: `POST /api/manajemen-akun`
- **Update Akun**: `PUT /api/manajemen-akun/:id_user`
- **Soft Delete Akun**: `DELETE /api/manajemen-akun/:id_user` (Kirim json body: `{ "id_role": 2 }` untuk menonaktifkan petugas, atau `{ "id_role": 3 }` untuk customer).

#### 3. Verifikasi Transaksi Membership
- **Melihat Permintaan Membership**: `GET /api/subscriptions/transactions?status=menunggu&page=1&limit=10`
- **Konfirmasi Pembayaran**: `PUT /api/subscriptions/transactions/:id/confirm`
  - **Body**: `{ "status": "berhasil" }` atau `{ "status": "gagal" }`
  - **Catatan Logika**: Jika disetujui (`berhasil`), membership customer diaktifkan selama +30 hari. Jika ditolak (`gagal`), saldo poin yang dipotong akan dikembalikan utuh ke customer.

#### 4. Pengelolaan Jenis Sampah & Artikel
Admin dapat menambah, mengupdate, dan melakukan soft delete pada jenis-sampah dan artikel melalui rute yang dilindungi (`/api/jenis-sampah` & `/api/articles`).

---

## 5. Daftar Penanganan Status Error (Error Handling)

Pastikan frontend Anda menangani status error HTTP berikut secara ramah kepada pengguna:
- **`400 Bad Request`**: Format body request salah, data wajib kosong, atau berkas file/gambar yang diupload tidak terbaca (key form-data tidak pas).
- **`401 Unauthorized`**: Token kedaluwarsa atau tidak disertakan pada request. Lakukan refresh token.
- **`403 Forbidden`**: Peran akun Anda tidak diizinkan mengakses endpoint ini (misal: customer mengakses dashboard petugas).
- **`404 Not Found`**: Data tidak ditemukan (misal: ID order, ID user, atau profil tidak ada).
- **`500 Internal Server Error`**: Terjadi galat pada basis data atau server. Tampilkan pesan general kesalahan sistem ke user.
