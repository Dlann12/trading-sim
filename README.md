# 📈 NusaTrade Sim — Trading Simulator Game (PRD v1.0)

**NusaTrade Sim** adalah platform simulasi pasar saham Indonesia berbasis web yang dirancang untuk **edukasi finansial, pembelajaran analisis teknikal, serta latihan manajemen risiko portofolio 100% bebas risiko finansial**.

Setiap pengguna menerima modal awal virtual sebesar <strong style="color:#10b981;">Rp 100.000.000</strong> untuk menganalisis pergerakan harga saham, mengeksekusi order *Buy* & *Sell* dengan kalkulasi *Average Cost Basis* presisi, menyelesaikan misi edukasi, dan bersaing di Leaderboard.

> [!NOTE]
> **Pernyataan Penafian (Disclaimer):**
> Aplikasi ini adalah **100% SIMULASI EDUKASI & STRATEGI**. Seluruh saldo, transaksi, saham, dan emiten adalah data tiruan (dummy). **TIDAK ADA** uang asli, deposit, atau transaksi pasar modal nyata di dalam aplikasi ini.

---

## 📁 Struktur Direktori Proyek

Arsitektur aplikasi telah dipisahkan secara modular, rapi, dan langsung kompatibel dengan **GitHub Pages**:

```text
Trading Simulator/
├── index.html              # Halaman utama aplikasi (Entry point & GitHub Pages ready)
├── css/
│   └── style.css           # Styling terminal dark mode, flash harga & canvas chart
├── js/
│   ├── tailwind-config.js  # Konfigurasi tema Tailwind CSS (Warna terminal, font mono)
│   ├── state.js            # State global, katalog 8 saham, data misi, & akun default
│   ├── engine.js           # Engine pergerakan harga real-time & sistem transaksi Buy/Sell
│   ├── admin.js            # Evaluator misi, multi-akun switcher, & kontrol admin pasar
│   ├── charts.js           # Grafik interaktif Canvas (Line Chart & Candlestick OHLC)
│   └── app.js              # View renderers (10+ views), toast notification & bootloader
├── .gitignore              # Berkas pengecualian Git
└── README.md               # Dokumentasi resmi proyek & panduan deploy
```

---

## ✨ Fitur Utama Terminal

### 1. Terminal Trading Interaktif & Grafik Canvas Real-Time
- **Grafik Interaktif Canvas High-DPI**: Pilihan mode grafik **Line Chart** dan **Candlestick (OHLC)** lengkap dengan volume bar.
- **Indikator Rata-rata Beli (*Avg Price Line*)**: Garis horizontal visual yang memperlihatkan titik modal rata-rata kepemilikan Anda pada grafik saham.
- **8 Emiten Saham Pilihan**: BNUS (Perbankan), TLKD (Teknologi), GOTOX (Ekosistem Digital), BRENX (Energi), ANTMX (Tambang), ASIIX (Otomotif), BBCAX (Finansial), dan ICBPX (Konsumer).

### 2. Eksekusi Order Presisi & Manajemen Portofolio
- **Atomic Order System**: Transaksi *Buy* & *Sell* instan dengan potongan komisi broker (0.15%), validasi ketersediaan kas/unit, dan dialog konfirmasi order (*Idempotency lock*).
- **Kalkulasi Portofolio Real-Time**: Perhitungan otomatis nilai ekuitas, kas mengendap, *Unrealized P&L*, *Realized P&L*, dan persentase *Total Return*.
- **Quick Sell & Watchlist**: Jual seluruh atau sebagian posisi langsung dari tabel portofolio serta fitur bookmark saham pantauan.

### 3. Misi Edukasi, Level & Prestasi
- **Misi Pembelajaran Terstruktur**: Beli saham pertama, bangun portofolio dengan 3 sektor berbeda, dan capai target profit.
- **Sistem Level Trader**: Dapatkan XP dan naik peringkat mulai dari *Novice Trader* hingga *Institutional Whale*.

### 4. Papan Peringkat (Leaderboard) & Multi-Akun
- Bersaing dengan trader lain berdasarkan indikator **Total Return %**, **Nilai Portofolio**, maupun **Win Rate**.
- **Multi-Account Switcher**: Beralih antar profil simulasi (misal: *Sultan_Trader*, *Investor_Pemula*, *Scalper_Kilat*) untuk menguji berbagai gaya investasi.

### 5. Panel Kontrol Admin & Simulasi Dinamis
- **Kontrol Kecepatan Ticker**: Atur interval detak simulasi harga (1.5 detik, 3.5 detik, atau jeda sementara).
- **Injeksi Kondisi Pasar**: Simulasikan sentimen pasar (*Bull Market*, *Bear Market / Crash*, atau *Kondisi Normal*).
- **Audit Logs Transparan**: Setiap transaksi tercatat secara otomatis pada log audit sistem.

---

## 🚀 Cara Menjalankan Secara Lokal

Aplikasi ini berbasis web statis murni tanpa ketergantungan build-tool:

### Opsi 1: Python HTTP Server (Direkomendasikan)
```bash
cd "/home/kerja/Documents/Project Of Me/Trading Simulator"
python3 -m http.server 8080
```
Buka peramban favorit Anda di: `http://localhost:8080`

### Opsi 2: VS Code Live Server
- Buka folder `Trading Simulator` di Visual Studio Code.
- Klik kanan file `index.html` lalu pilih **Open with Live Server**.

### Opsi 3: Node.js `serve`
```bash
npx serve .
```

---

## 📤 Panduan Push ke GitHub

Untuk mengunggah proyek ini ke repositori GitHub Anda:

1. **Inisialisasi Git & Commit:**
   ```bash
   cd "/home/kerja/Documents/Project Of Me/Trading Simulator"
   git init
   git add .
   git commit -m "feat: inisialisasi arsitektur modular NusaTrade Trading Simulator"
   ```

2. **Hubungkan & Push ke Repositori GitHub Anda:**
   ```bash
   # Ganti URL di bawah dengan URL repositori GitHub baru Anda:
   git remote add origin https://github.com/<username-anda>/<nama-repo>.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy Gratis di GitHub Pages:**
   - Buka repositori Anda di situs GitHub.
   - Masuk ke tab **Settings** > **Pages**.
   - Pada bagian **Build and deployment**, pilih branch `main` dan folder `/ (root)`, lalu klik **Save**.
   - Platform simulasi trading Anda akan langsung online dan dapat diakses publik!

---

## 🛠️ Teknologi yang Digunakan

- **HTML5 Semantic & Canvas API 2D** (Grafik Saham High-DPI Resizable)
- **Tailwind CSS (JIT CDN)** untuk tata letak terminal bertema gelap modern
- **Vanilla JavaScript (ES6+)** berarsitektur modular tanpa framework berat
- **Google Fonts** (*Inter* & *JetBrains Mono*)
- **Font Awesome 6** untuk ikon navigasi & indikator pasar
