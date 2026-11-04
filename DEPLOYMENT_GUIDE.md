# 🚀 Panduan Menjalankan & Update POS MJB SPORT Menggunakan Docker di VPS

Dokumentasi ini dibuat untuk memudahkan proses deployment dan update aplikasi POS **MJB SPORT** (Golang Backend + React Vite Nginx Frontend) di VPS menggunakan Docker.

---

## ⚡ Cara Cepat Update di VPS (Jika Menggunakan Docker Compose)

Jika di VPS Anda menjalankan project dengan `docker compose`:

```bash
# 1. Masuk ke direktori project di VPS
cd ~/allinspos   # sesuaikan path folder Anda

# 2. Tarik update terbaru dari masing-masing repo
cd backend && git pull origin main && cd ..
cd frontend && git pull origin main && cd ..

# 3. Rebuild dan restart container (zero downtime / otomatis apply kode baru)
docker compose down
docker compose up -d --build

# 4. Cek apakah container sudah berjalan normal
docker compose ps
```

---

## 🐳 Cara Update Jika Menggunakan Container Docker Terpisah

Jika Anda menjalankan backend dan frontend sebagai container docker terpisah:

### 1. Update Backend (Golang):
```bash
cd /var/www/be_alins   # atau folder backend di VPS
git pull origin main

# Build image baru
docker build -t be_alins .

# Stop & jalankan ulang container
docker stop allins_backend || true
docker rm allins_backend || true

docker run -d \
  --name allins_backend \
  --network allins_net \
  --network-alias backend \
  --restart unless-stopped \
  -p 8085:8080 \
  -v /var/www/be_alins/data:/app/data \
  be_alins
```

### 2. Update Frontend (React + Nginx):
```bash
cd /var/www/fe_alins   # atau folder frontend di VPS
git pull origin main

# Build image baru
docker build -t fe_alins .

# Stop & jalankan ulang container
docker stop allins_frontend || true
docker rm allins_frontend || true

docker run -d \
  --name allins_frontend \
  --network allins_net \
  --restart unless-stopped \
  -p 3005:80 \
  fe_alins
```

---

## 🔑 Akun Login Resmi Sistem

| Peran | Username | Password / PIN | Akses & Wewenang |
| :--- | :--- | :--- | :--- |
| **Owner (Admin & Toko)** | `owner_allins` | `AllinsPadang2026!` | Dashboard omzet, laba bersih, manajemen stok, harga diskon, campaign |
| **Kasir 1 (Shift Pagi)** | `kasir_pagi` | `112233` | Transaksi kasir shift pagi, keranjang, cetak struk |
| **Kasir 2 (Shift Malam)** | `kasir_malam` | `223344` | Transaksi kasir shift malam, keranjang, cetak struk |

*(PIN darurat `1234` atau username `owner`, `kasir1`, `kasir2` tetap aktif).*

---

## 📋 Tips & Perintah Bermanfaat

- **Lihat log backend:**
  ```bash
  docker logs -f allins_pos_backend
  ```
- **Lihat log frontend:**
  ```bash
  docker logs -f allins_pos_frontend
  ```
- **Cek koneksi API backend:**
  ```bash
  curl http://localhost:8080/api/health
  # Respon: {"message":"POS Golang Backend is running smoothly","status":"ok"}
  ```
- **Backup data transaksi & produk:**
  ```bash
  cp ~/pos-data/pos_store.json ~/pos_store_backup_$(date +%F).json
  ```

