# 🎵 OpenMusic API

OpenMusic API adalah aplikasi backend untuk mengelola data lagu, dibangun menggunakan **JavaScript**, **Node.js**, dan **Hapi Framework**. API ini menyediakan fitur untuk menambah, membaca, memperbarui, dan menghapus lagu dengan validasi data yang aman dan efisien.

> 💡 **Submission Dicoding Fundamental Backend JavaScript.**

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Hapi.js](https://img.shields.io/badge/Hapi.js-v21-blue)](https://hapi.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-orange?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Redis](https://img.shields.io/badge/Redis-7.2-red?logo=redis&logoColor=white)](https://redis.io/)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-8.x-yellow?logo=gmail&logoColor=white)](https://nodemailer.com/about/)
[![AWS S3](https://img.shields.io/badge/AWS%20S3-Cloud-orange?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/s3/)

---

## ⚡ Fitur

- **CRUD Lagu:** Create, Read, Update, Delete lagu.
- **Filter Lagu:** Cari lagu berdasarkan judul atau performer.
- **Data Validation:** Menggunakan **Joi** untuk memastikan input valid.
- **Database:** Menggunakan **PostgreSQL** untuk penyimpanan data yang handal.
- **Hapi Plugin:** Struktur modular untuk memisahkan fitur dan service.
- **Authentication** & Authorization: Login menggunakan JWT untuk memastikan hanya pengguna yang berhak dapat mengakses data.
- **Playlist**:
  - Membuat, membaca, memperbarui, dan menghapus playlist.
  - Playlist bersifat private (hanya pemilik dapat mengelola dan melihatnya).
- **Playlist Song Management**: Menambah dan menghapus lagu dari playlist.
- **Collaboration**: Pemilik playlist dapat menambahkan pengguna lain sebagai kolaborator agar bisa ikut mengelola playlist.
- **Activity Log**: Mencatat setiap aktivitas dalam playlist (misalnya menambahkan atau menghapus lagu), termasuk siapa yang melakukan aksi tersebut.
- **Export Playlist:** Mengekspor lagu pada playlist melalui **RabbitMQ**, hasil ekspor dikirimkan melalui email menggunakan **Nodemailer**.
- **Upload Album Cover:** Mengunggah sampul album (lokal/S3) dengan validasi ukuran & tipe file, dan menampilkannya di endpoint detail album.
- **Album Likes:** Pengguna bisa menyukai atau batal menyukai album. Tiap pengguna hanya bisa menyukai album satu kali.
- **Server-Side Cache:** Menggunakan Redis untuk caching data (jumlah like album, detail lagu, lagu dalam playlist), dengan header `X-Data-Source: cache` bila respons dari cache.

---

## 🛠 Teknologi

- **JavaScript (ES6+)**
- **Node.js**
- **Hapi.js Framework**
- **Hapi Plugin Architecture**
- **Joi** (Data Validation)
- **PostgreSQL** (Database)
- **JWT (JSON Web Token)** untuk autentikasi & otorisasi
- **RabbitMQ** (Message Broker untuk ekspor playlist → [openmusic-api-consumer](https://github.com/AnamSadat/openmusic-api-consumer))
- **Nodemailer** (Pengiriman email hasil ekspor playlist di sisi [openmusic-api-consumer](https://github.com/AnamSadat/openmusic-api-consumer))
- **Redis** (Server-side caching untuk jumlah like album, detail lagu, dan playlist songs)
- **Multer / AWS S3 SDK** (Upload dan penyimpanan file sampul album)

---

## 🚀 Instalasi & Setup

1. Clone repository:

```bash
git clone https://github.com/AnamSadat/openmusic-api.git
cd openmusic-api
```

2. Install dependencies:

```bash
npm install
```

3. Konfigurasi environment variables:

Buat file `.env.development` dan `.env.production` lalu sesuaikan:

- `.env.development`

```env
# server configuration
HOST=localhost
PORT=5000

# database configuration
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGHOST=localhost
PGDATABASE=openmusic
PGPORT=5432
PORT=5000

# authentication
ACCESS_TOKEN_KEY=
REFRESH_TOKEN_KEY=
ACCESS_TOKEN_AGE=1800

# rabbitmq
RABBITMQ_SERVER=amqp://localhost

# redis
REDIS_SERVER=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

- `.env.production`

```env
# server configuration
HOSTPROD=
PORT=5000

# database configuration
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGHOST=localhost
PGDATABASE=openmusic
PGPORT=5432
PORT=5000

# authentication
ACCESS_TOKEN_KEY=
REFRESH_TOKEN_KEY=
ACCESS_TOKEN_AGE=1800

# aws amazonmq
AWS_AMAZONMQ=

# aws s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

# aws elasticache
AWS_ELASTICACHE=
```

Kamu bisa generate ssl untuk `ACCESS_TOKEN_KEY` dan `REFRESH_TOKEN_KEY`:

```bash
# script
npm run generate:ssl

# or

# hex string (default, panjang 128 karakter karena 64 byte)
node -e 'console.log(require("crypto").randomBytes(64).toString("hex"))'

# base64 string (lebih pendek, cocok buat secret)
node -e 'console.log(require("crypto").randomBytes(64).toString("base64"))'

# url-safe string (biar bisa dipakai di URL/JWT dsb.)
node -e 'console.log(require("crypto").randomBytes(64).toString("base64url"))'

# pakai crypto.randomUUID() (UUID v4)
node -e 'console.log(require("crypto").randomUUID())'

# pake crypto.createHash (misalnya SHA256 dari randomBytes)
node -e 'console.log(require("crypto").createHash("sha256").update(require("crypto").randomBytes(64)).digest("hex"))'

# secret yang aman buat JWT atau session
node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))'

# or

# openssl (hex / base64)
openssl rand -hex 64
openssl rand -base64 64

# or

# Linux / Mac: urandom + xxd
head -c 64 /dev/urandom | xxd -p -c 64

# Linux / Mac: urandom + base64
head -c 64 /dev/urandom | base64

# or

# uuid (kalau cukup unik aja)
uuidgen

# or

# pwsh: native GUID
[guid]::NewGuid()

# pwsh: base64 random
[Convert]::ToBase64String((1..64 | ForEach-Object {Get-Random -Maximum 256}))
```

4. Jalankan server:

```bash
npm run start
# or
npm run start:dev

# production
npm run start:prod
```

Server berjalan di: http://localhost:5000

## 📌 Endpoint Utama

| Method | Endpoint                           | Deskripsi                                                                |
| ------ | ---------------------------------- | ------------------------------------------------------------------------ |
| GET    | /albums/{id}                       | Ambil albums berdasarkan id                                              |
| POST   | /albums                            | Tambah album baru                                                        |
| PUT    | /albums/{id}                       | Update data album                                                        |
| DELETE | /albums/{id}                       | Hapus album                                                              |
| POST   | /albums/{id}/covers                | Unggah sampul album (file gambar, max 512KB)                             |
| POST   | /albums/{id}/likes                 | Menyukai album (hanya bisa sekali per user)                              |
| DELETE | /albums/{id}/likes                 | Batal menyukai album                                                     |
| GET    | /albums/{id}/likes                 | Lihat jumlah yang menyukai album (gunakan cache Redis 30 menit)          |
| GET    | /songs                             | Ambil semua lagu                                                         |
| GET    | /songs/{id}                        | Ambil detail lagu berdasarkan id                                         |
| POST   | /songs                             | Tambah lagu baru                                                         |
| PUT    | /songs/{id}                        | Update data lagu                                                         |
| DELETE | /songs/{id}                        | Hapus lagu                                                               |
| POST   | /users                             | Registrasi user baru                                                     |
| POST   | /authentications                   | Login user, menghasilkan access token & refresh token                    |
| PUT    | /authentications                   | Refresh access token menggunakan refresh token                           |
| DELETE | /authentications                   | Logout user, hapus refresh token dari database                           |
| POST   | /playlists                         | Buat playlist baru (private, milik user)                                 |
| GET    | /playlists                         | Ambil semua playlist milik user                                          |
| DELETE | /playlists/{id}                    | Hapus playlist milik user                                                |
| POST   | /playlists/{playlistId}/songs      | Tambahkan lagu ke playlist                                               |
| GET    | /playlists/{playlistId}/songs      | Ambil semua lagu dalam playlist                                          |
| DELETE | /playlists/{playlistId}/songs      | Hapus lagu dari playlist                                                 |
| POST   | /collaborations                    | Tambahkan user lain sebagai kolaborator pada playlist                    |
| DELETE | /collaborations                    | Hapus kolaborator dari playlist                                          |
| GET    | /playlists/{playlistId}/activities | Ambil riwayat aktivitas playlist (add/delete lagu oleh user/kolaborator) |
| POST   | /export/playlists/{playlistId}     | Ekspor lagu pada playlist (via RabbitMQ, hasil dikirim ke email target)  |

## ✅ Testing

Gunakan Postman untuk menguji API.

Pastikan header: Content-Type: application/json

Test semua endpoint dengan validasi data sesuai requirement.

[Postman Test bisa akses disini](https://github.com/AnamSadat/project-openmusic-api-v1/blob/main/postman/postman_cli_script.md)

## 📂 Struktur Proyek

```tree
openmusic-api/
├── migrations          # Folder berisi skrip migrasi database (PostgreSQL)
├── postman             # Folder berisi collection Postman untuk testing API
├── src                 # Folder utama kode sumber aplikasi
│   ├── api             # Route & handler Hapi untuk endpoint API
│   ├── exceptions      # Kelas custom error handling
│   ├── scripts         # Script utilitas, misal generate-ssl.js
│   ├── services        # Logic bisnis aplikasi (interaksi DB)
│   ├── tokenize        # Modul untuk JWT / autentikasi
│   ├── utils           # Helper/utility (termasuk setup config/env & validation)
│   ├── validator       # Validasi data input menggunakan Joi
│   └── server.js       # Entry point aplikasi, konfigurasi Hapi server
├── uploads             # Folder penyimpanan file (contoh: gambar upload lewat Postman)
├── .env                # Environment variables untuk konfigurasi lokal
├── .env.example        # Contoh format file .env
├── .eslintrc.json      # Konfigurasi ESLint
├── .gitignore          # File untuk mengecualikan file/folder dari Git
├── .prettierrc         # Konfigurasi Prettier
├── package-lock.json   # Lock file npm
├── package.json        # Metadata proyek & dependensi
└── README.md           # Dokumentasi proyek, cara setup & penggunaan
```
