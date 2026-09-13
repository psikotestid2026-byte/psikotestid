# Big Five Inventory (BFI-44) — Dokumentasi Lengkap Alat Tes

> Dokumen ini merangkum **persis apa yang berjalan di aplikasi** (`src/pages/bigfive.js`), dicocokkan dengan dokumen spesifikasi (`zlainnya/Prompt_BigFive_Patch.md`). Implementasi konsisten dengan draft — hanya ada satu catatan penting soal **teks contoh item di template Excel** yang perlu diperhatikan (lihat [Catatan & Riwayat Versi](#catatan--riwayat-versi)).

---

## 1. Ringkasan Alat Tes

- **Nama:** Big Five Inventory (BFI-44) — mengukur model kepribadian **OCEAN**: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism.
- **Jumlah soal:** 44 pernyataan (item), masing-masing dijawab dengan skala Likert 5 poin.
- **Format respons:** Skala kesesuaian diri 5 tingkat: **Sangat Sesuai, Sesuai, Netral, Tidak Sesuai, Sangat Tidak Sesuai**.
- **Dimensi yang diukur:** 5 dimensi kepribadian (kode 1 huruf: **E** = Extraversion, **A** = Agreeableness, **C** = Conscientiousness, **N** = Neuroticism, **O** = Openness).
- **Item reversed (skor terbalik):** 16 dari 44 item memakai skoring terbalik (lihat Bagian 3).
- **Output:** profil 5-dimensi dengan skor mentah, persentase, kategori (Tinggi/Sedang/Rendah), narasi interpretasi per dimensi, dan laporan PDF per peserta.
- **Sumber input:** Google Form → diekspor jadi file Excel (`.xlsx`/`.xls`) → diupload ke halaman Big Five di aplikasi.

---

## 2. Instruksi Pengerjaan

Instruksi yang seharusnya ditampilkan ke peserta (melalui Google Form, sebelum diproses aplikasi):

1. Terdapat 44 pernyataan tentang diri Anda.
2. Untuk setiap pernyataan, pilih salah satu dari 5 tingkat kesesuaian:
   - **Sangat Sesuai** — pernyataan sangat menggambarkan diri Anda
   - **Sesuai**
   - **Netral** — ragu-ragu / tidak yakin
   - **Tidak Sesuai**
   - **Sangat Tidak Sesuai** — pernyataan sangat tidak menggambarkan diri Anda
3. Jawablah berdasarkan bagaimana diri Anda **umumnya/biasanya**, bukan pada momen tertentu saja.
4. Tidak ada jawaban benar/salah. Jawab semua 44 pernyataan — item yang dilewati akan dihitung secara proporsional dari item yang terisi (lihat Bagian 4.4), tapi sebaiknya tetap diisi lengkap untuk akurasi maksimal.

**Instruksi ke Admin/HR (di halaman upload aplikasi):**
- Upload file Excel (`.xlsx`/`.xls`) hasil export Google Form.
- Kolom identitas (Nama Lengkap, Jenis Kelamin, Pendidikan, Tanggal Lahir) dideteksi otomatis berdasarkan nama header, di manapun posisinya dalam sheet.
- **44 kolom terakhir** pada sheet **selalu** dianggap sebagai jawaban BFI, terlepas dari apa isi teks header-nya (lihat Bagian 6 — deteksi berbasis posisi, bukan nama kolom).
- Sheet harus memiliki minimal 44 kolom total.
- Setiap baris = satu peserta. Sistem memproses semua baris sekaligus.
- Tersedia tombol **"Unduh Template Excel"** yang menghasilkan header lengkap (5 kolom identitas + 44 kolom pernyataan) siap pakai.

---

## 3. Pemetaan 44 Item ke Dimensi (Kunci Skoring Resmi BFI-44)

Ini adalah kunci skoring standar **BFI-44 (John, Donahue & Kentle, 1991)** yang diimplementasikan persis di `DIMENSIONS` pada `bigfive.js`. Pemetaan berbasis **nomor urut item (posisi kolom ke-1 s.d. ke-44)**, bukan berdasarkan makna teks pernyataan.

| Dimensi | Kode | Nomor Item Anggota | Item Reversed (skor terbalik) | Skor Maksimum |
|---|---|---|---|---|
| **Extraversion** | E | 1, 6, 11, 16, 21, 26, 31, 36 | 6, 21, 31 | 40 (8 item × 5) |
| **Agreeableness** | A | 2, 7, 12, 17, 22, 27, 32, 37, 42 | 2, 12, 27, 37 | 45 (9 item × 5) |
| **Conscientiousness** | C | 3, 8, 13, 18, 23, 28, 33, 38, 43 | 8, 18, 23, 43 | 45 (9 item × 5) |
| **Neuroticism** | N | 4, 9, 14, 19, 24, 29, 34, 39 | 9, 24, 34 | 40 (8 item × 5) |
| **Openness** | O | 5, 10, 15, 20, 25, 30, 35, 40, 41, 44 | 35, 41 | 50 (10 item × 5) |

**Total 16 item reversed** dari 44: item nomor **2, 6, 8, 9, 12, 18, 21, 23, 24, 27, 31, 34, 35, 37, 41, 43**.

### Tabel Lengkap 44 Item (Nomor, Dimensi, Status Reversed)

> Teks pernyataan di bawah ini diambil dari **contoh isian template Excel** yang dihasilkan aplikasi (`downloadBfiTemplate()`). Perhatikan: teks ini adalah **placeholder generik**, bukan hasil terjemahan resmi 44 item asli BFI — lihat peringatan penting di [Catatan & Riwayat Versi](#catatan--riwayat-versi). Yang **pasti berlaku secara sah** adalah kolom **Dimensi** dan **Reversed**, karena itulah yang dipakai mesin skoring (berbasis posisi kolom, bukan isi teks).

| No | Pernyataan (contoh template) | Dimensi | Reversed? |
|---|---|---|---|
| 1 | Saya mudah cemas | E | Tidak |
| 2 | Saya ramah dan mudah bergaul | A | Ya |
| 3 | Saya suka menjaga kerapian | C | Tidak |
| 4 | Saya mudah marah | N | Tidak |
| 5 | Saya memiliki imajinasi yang kaya | O | Tidak |
| 6 | Saya tenang dalam menghadapi tekanan | E | Ya |
| 7 | Saya cenderung pendiam | A | Tidak |
| 8 | Saya bisa ceroboh | C | Ya |
| 9 | Saya sangat sabar | N | Ya |
| 10 | Saya tidak terlalu tertarik pada seni | O | Tidak |
| 11 | Saya sering khawatir | E | Tidak |
| 12 | Saya penuh energi | A | Ya |
| 13 | Saya dapat diandalkan | C | Tidak |
| 14 | Saya jarang sedih | N | Tidak |
| 15 | Saya ingin tahu banyak hal | O | Tidak |
| 16 | Saya mudah stres | E | Tidak |
| 17 | Saya suka bertemu orang baru | A | Tidak |
| 18 | Saya cenderung tidak terorganisir | C | Ya |
| 19 | Saya mudah tersinggung | N | Tidak |
| 20 | Saya suka refleksi mendalam | O | Tidak |
| 21 | Saya stabil secara emosional | E | Ya |
| 22 | Saya suka jadi pusat perhatian | A | Tidak |
| 23 | Saya pekerja keras | C | Ya |
| 24 | Saya jarang merasa sedih | N | Ya |
| 25 | Saya kreatif dan imajinatif | O | Tidak |
| 26 | Saya mudah panik | E | Tidak |
| 27 | Saya suka mengobrol | A | Ya |
| 28 | Saya tepat waktu dan terencana | C | Tidak |
| 29 | Saya mudah kesal | N | Tidak |
| 30 | Saya menghargai pengalaman baru | O | Tidak |
| 31 | Saya jarang gugup | E | Ya |
| 32 | Saya antusias | A | Tidak |
| 33 | Saya efisien | C | Tidak |
| 34 | Saya sering merasa tidak aman | N | Ya |
| 35 | Saya memiliki rasa seni yang tinggi | O | Ya |
| 36 | Saya mudah takut | E | Tidak |
| 37 | Saya suka bersosialisasi | A | Ya |
| 38 | Saya membuat rencana dan mengikutinya | C | Tidak |
| 39 | Saya mudah marah | N | Tidak |
| 40 | Saya suka hal-hal yang kompleks | O | Tidak |
| 41 | Saya jarang cemas | O | Ya |
| 42 | Saya penuh semangat | A | Tidak |
| 43 | Saya mudah terganggu | C | Ya |
| 44 | Saya memiliki imajinasi yang aktif | O | Tidak |

> **Perhatikan ganjilnya beberapa baris** — mis. item 1 "Saya mudah cemas" masuk dimensi **E** (Extraversion), padahal secara isi kalimat lebih terasa seperti item Neuroticism; item 21 "Saya stabil secara emosional" (reversed) juga masuk **E**, bukan **N**. Ini **bukan bug pemetaan dimensi** (kunci posisi 1–44 memang sudah sesuai standar BFI-44 asli), melainkan bukti bahwa **teks placeholder di template tidak benar-benar diselaraskan** dengan makna psikologis tiap nomor — lihat penjelasan lengkap di bagian catatan.

---

## 4. Sistem Skoring — Tahap demi Tahap

Implementasi persis: fungsi `parseBfiAnswer()` dan blok pemrosesan skor di `handleBfiFile()` pada `src/pages/bigfive.js`.

### 4.1 Tahap 1 — Parsing Jawaban per Item (`parseBfiAnswer`)

Untuk tiap sel jawaban, nilai dikonversi ke skor 1–5 melalui pencocokan bertingkat:

1. **Normalisasi:** nilai sel diubah ke lowercase dan di-trim. Kosong/`null`/`undefined` → tidak dihitung (`null`, item dilewati).
2. **Exact match** terhadap salah satu dari 5 label baku (lowercase): `"sangat sesuai"`, `"sesuai"`, `"netral"`, `"tidak sesuai"`, `"sangat tidak sesuai"`.
3. **Substring fallback** (jika tidak exact match): dicek berurutan — mengandung `"sangat sesuai"` → cocok; mengandung `"sangat tidak sesuai"` → cocok; mengandung `"tidak sesuai"` → cocok; mengandung `"sesuai"` → cocok; mengandung `"netral"` → cocok. (Urutan pengecekan ini penting: `"sangat tidak sesuai"` dicek sebelum `"tidak sesuai"` dan sebelum `"sesuai"`, agar substring yang lebih spesifik tidak salah tertangkap oleh pola yang lebih umum.)
4. **Numeric fallback:** jika sel berisi angka 1–5 (mis. hasil Google Form skala linear/angka), angka tersebut dipakai langsung sebagai skor mentah sebelum pembalikan.
5. Jika semua langkah gagal → `null` (item dilewati, tidak dihitung ke total maupun pembagi rata-rata).

**Tabel konversi teks → skor** (tergantung apakah item termasuk reversed):

| Teks Jawaban | Skor Normal | Skor Reversed |
|---|---|---|
| Sangat Sesuai | 5 | 1 |
| Sesuai | 4 | 2 |
| Netral | 3 | 3 |
| Tidak Sesuai | 2 | 4 |
| Sangat Tidak Sesuai | 1 | 5 |

Untuk input angka 1–5: skor normal = angka apa adanya; skor reversed = `6 - angka`.

### 4.2 Tahap 2 — Akumulasi Skor per Dimensi

Untuk tiap dimensi (E, A, C, N, O), iterasi semua nomor item anggotanya:
```
sum = Σ skor tiap item (setelah dibalik jika reversed)
answeredCount = jumlah item yang berhasil di-parse (tidak null)
```

### 4.3 Tahap 3 — Perhitungan Persentase & Kategori

```
finalMax = answeredCount × 5   (bukan max tetap dimensi — lihat 4.4)
finalPercent = (sum / finalMax) × 100   (jika finalMax > 0, selain itu 0)
```

**Kategorisasi:**

| Persentase | Kategori |
|---|---|
| ≥ 75% | **Tinggi** |
| 50% – 74,999% | **Sedang** |
| < 50% | **Rendah** |

### 4.4 Penanganan Item Kosong/Tidak Dikenali (Proporsional)

Jika ada item dalam suatu dimensi yang jawabannya kosong atau tidak berhasil di-parse, item tersebut **dikeluarkan sepenuhnya** dari perhitungan — baik dari pembilang (`sum`) maupun penyebut (`finalMax`). Jadi persentase dihitung **proporsional dari item yang benar-benar terisi**, bukan dibagi skor maksimum dimensi secara tetap (40/45/45/40/50). Konsekuensinya:
- Field `max` yang ditampilkan di laporan (`s.max` pada tabel/chart) adalah `finalMax` yang **dinamis** (bisa lebih kecil dari skor maksimum "resmi" dimensi bila ada item kosong), **bukan** angka tetap 40/45/45/40/50 dari tabel `DIMENSIONS`.
- Bila **seluruh** item suatu dimensi kosong, `finalMax = 0` dan persentase otomatis dianggap `0` (masuk kategori Rendah).

### 4.5 Tidak Ada Validasi "Total Harus Sekian"

Berbeda dari DISC (validasi 1P+1K per soal) dan PAPI Kostick (validasi total skor = 90), Big Five **tidak memiliki mekanisme validasi kelengkapan** yang eksplisit ditampilkan ke pengguna (tidak ada badge peringatan "data tidak lengkap"). Item kosong ditangani secara diam-diam lewat perhitungan proporsional di atas.

---

## 5. Kamus Kategori per Dimensi (Narasi Interpretasi)

Narasi ditentukan oleh kombinasi (Dimensi × Kategori), sumber: `NARRATIVES` di `bigfive.js`.

### E — Extraversion (Ekstraversion)

| Kategori | Narasi |
|---|---|
| **Tinggi** | Memiliki motivasi tinggi dalam bergaul, menjalin hubungan sosial, dan cenderung dominan dalam lingkungannya. Energik, antusias, dan mudah berinteraksi dengan orang lain. |
| **Sedang** | Cukup nyaman dalam situasi sosial, namun juga menghargai waktu sendiri. Dapat beradaptasi antara situasi ramai dan tenang. |
| **Rendah** | Lebih suka aktivitas yang tenang dan menyendiri. Cenderung pendiam dan lebih selektif dalam bersosialisasi. |

### A — Agreeableness

| Kategori | Narasi |
|---|---|
| **Tinggi** | Ramah, mudah memaafkan, menghindari konflik, dan memiliki kecenderungan kooperatif. Menunjukkan perhatian dan empati yang tinggi terhadap orang lain. |
| **Sedang** | Memiliki keseimbangan antara kepercayaan dan skeptisisme. Dapat bekerja sama namun tetap mempertahankan pendiriannya bila perlu. |
| **Rendah** | Cenderung kompetitif, kritis, dan lebih mengutamakan kepentingan pribadi daripada kelompok. |

### C — Conscientiousness

| Kategori | Narasi |
|---|---|
| **Tinggi** | Terencana, terorganisir, dan disiplin. Memiliki kontrol diri yang baik, berorientasi pada tujuan, dan dapat diandalkan dalam menyelesaikan tugas. |
| **Sedang** | Cukup teratur dan bertanggung jawab, namun masih fleksibel dan tidak terlalu kaku dalam mengikuti rencana. |
| **Rendah** | Cenderung spontan, kurang terstruktur, dan mudah terganggu dalam menyelesaikan tugas. |

### N — Neuroticism

| Kategori | Narasi |
|---|---|
| **Tinggi** | Mudah mengalami tekanan emosional, cemas, dan stres. Membutuhkan dukungan emosional lebih tinggi dalam situasi menekan. |
| **Sedang** | Memiliki stabilitas emosi yang cukup baik. Dapat mengendalikan diri meskipun menghadapi situasi cemas tertentu. |
| **Rendah** | Tenang, stabil secara emosi, dan tidak mudah terganggu oleh tekanan. Mampu mengatasi stres dengan baik. |

### O — Openness

| Kategori | Narasi |
|---|---|
| **Tinggi** | Kreatif, imajinatif, dan terbuka terhadap pengalaman baru. Memiliki kapasitas tinggi untuk menyerap informasi dan menjelajahi ide-ide baru. |
| **Sedang** | Memiliki keseimbangan antara apresiasi hal baru dan kenyamanan dengan rutinitas. |
| **Rendah** | Cenderung konvensional, lebih menyukai rutinitas, dan kurang tertarik pada hal-hal abstrak atau artistik. |

### Aturan Warna Kategori (khusus untuk Neuroticism dibalik)

Fungsi `getCategoryColor()` membalik makna warna untuk dimensi N karena secara psikologis "Neuroticism rendah" adalah kondisi yang diinginkan (stabil), sedangkan untuk 4 dimensi lain "Tinggi" yang dianggap positif:

| Dimensi | Tinggi | Sedang | Rendah |
|---|---|---|---|
| E, A, C, O | Hijau (success) | Kuning (warning) | Merah (error) |
| **N (dibalik)** | Merah (error) | Kuning (warning) | **Hijau (success)** |

Tidak ada perbedaan pada rumus skor atau kategorisasi — pembalikan ini **murni kosmetik** (pewarnaan visual), tidak memengaruhi angka apapun.

---

## 6. Struktur & Konten Laporan (Detail View / PDF)

Laporan per peserta tersusun sebagai berikut, sesuai `renderDetailView()` dan `bfGeneratePDFHTML()`:

### A. Header Identitas
- Nama Lengkap
- Jenis Kelamin
- Pendidikan
- Tanggal Lahir

### B. Visualisasi Profil 5 Dimensi (Bar Chart)
Bar horizontal untuk kelima dimensi (urutan tetap E, A, C, N, O), masing-masing menampilkan:
- Nama dimensi + kode
- Skor `raw/max` (max dinamis sesuai jumlah item terjawab, lihat 4.4)
- Persentase (dengan warna sesuai kategori & aturan pembalikan N)
- Badge kategori (Tinggi/Sedang/Rendah)
- Bar proporsional selebar persentase

### C. Tabel Skor Detail
Kolom: Dimensi, Raw Score/Max, Persentase, Kategori — untuk kelima dimensi.

### D. Interpretasi Kepribadian (Blok Narasi per Dimensi)
Untuk tiap dimensi, kartu dengan border kiri berwarna (sesuai kategori) berisi nama dimensi + kategori + narasi lengkap dari kamus Bagian 5.

### E. Footer Laporan (khusus versi PDF)
- Judul dokumen: **"LAPORAN BIG FIVE INVENTORY (BFI)"**
- Catatan promosi kontak (Coach Alifya)
- Disclaimer kerahasiaan: *"Laporan ini bersifat rahasia dan hanya untuk keperluan asesmen."*

### F. Fitur Unduh & Ekspor
- **Unduh PDF** per peserta (`html2pdf`, format A4 potrait).
- **Unduh Semua (ZIP)** — seluruh peserta dikemas jadi satu file ZIP berisi PDF per orang.
- **Export ke Excel/CSV** — satu baris per peserta, kolom: Nama, Jenis Kelamin, Pendidikan, Tanggal Lahir, lalu untuk tiap dimensi (E, A, C, N, O): `{Dim}_RawScore`, `{Dim}_Persen` (format desimal Indonesia, koma), `{Dim}_Kategori`.

### G. Navigasi
- Ringkasan (tabel semua peserta: No, Nama, L/P, badge persentase+kategori untuk tiap dimensi E/A/C/N/O) → klik baris untuk ke Detail.
- Di halaman Detail: tombol Sebelumnya/Berikutnya untuk berpindah antar peserta.

---

## 7. Format File Input (Teknis)

- Ekstensi: `.xlsx` atau `.xls`, sheet pertama dibaca.
- Baris pertama = header. Minimal 44 kolom total, jika kurang → error *"File Excel harus memiliki setidaknya 44 kolom jawaban BFI."*
- **Deteksi kolom jawaban BFI: murni berbasis posisi**, bukan nama header — **44 kolom terakhir** pada sheet (`numCols - 44` hingga akhir) selalu dianggap jawaban item 1–44 secara berurutan. Ini berarti:
  - Kolom identitas (Nama, Gender, dll) **harus** berada sebelum kolom-kolom jawaban.
  - Urutan 44 kolom jawaban **harus** persis mengikuti urutan nomor item 1–44 sesuai kunci Bagian 3 — kolom pertama dari 44 kolom terakhir dianggap item 1, dst.
  - Isi teks header di atas 44 kolom ini **tidak dibaca/tidak berpengaruh** ke logika skoring — apapun labelnya, posisi tetap yang menentukan.
- Deteksi kolom identitas (dicari di antara kolom-kolom **sebelum** blok 44 kolom terakhir):
  - Nama: `/nama|name/i`
  - Jenis kelamin: `/kelamin|gender|sex|l\/p/i`
  - Pendidikan: `/pendidikan|education|sekolah/i`
  - Tanggal lahir: `/lahir|birth/i`
- **Fallback nama:** jika kolom nama tidak terdeteksi via header, ambil sel pertama berisi teks di antara kolom sebelum blok jawaban (kecuali kolom index 0, biasanya Timestamp). Jika tetap kosong → nama default `"Responden {nomor baris}"`.
- Tanggal lahir mendukung 3 bentuk: objek `Date` Excel, serial number Excel (`(raw - 25569) × 86400 × 1000` epoch ms), atau string apa adanya.
- Baris kosong dilewati.

---

## Catatan & Riwayat Versi

Dibandingkan dengan `zlainnya/Prompt_BigFive_Patch.md` (draft spesifikasi), implementasi aktual **sangat konsisten** — kunci pemetaan item ke dimensi, item reversed, skala Likert, rumus persentase, dan ambang kategori (≥75% Tinggi, 50–74% Sedang, <50% Rendah) **sama persis**. Bahkan contoh data validasi di draft (responden "ADAM WIJAYA": E=32/80% Tinggi, A=40/88,9% Tinggi, C=39/86,7% Tinggi, N=23/57,5% Sedang, O=37/74% Sedang) konsisten dengan rumus yang diimplementasikan.

Satu catatan penting yang ditemukan di luar cakupan draft:

| Aspek | Temuan |
|---|---|
| **Kunci pemetaan item→dimensi** | Sesuai standar akademis **BFI-44 asli** (John, Donahue & Kentle, 1991) — nomor item dan status reversed identik dengan kunci skoring resmi yang dipublikasikan. Ini bukan skema custom buatan aplikasi. |
| **Teks pernyataan contoh di template** (`downloadBfiTemplate()`) | **Bukan** terjemahan resmi 44 item BFI asli. Ini adalah kalimat-kalimat generik Indonesia yang dibuat untuk keperluan demo/contoh isian, dan **isinya tidak selalu cocok secara makna psikologis** dengan dimensi yang seharusnya diukur pada nomor tersebut (lihat contoh item 1, 21, 41 di Bagian 3 yang isinya terasa lebih pas untuk Neuroticism padahal secara kunci berada di E atau O). |
| **Implikasi praktis** | Karena skoring aplikasi murni berbasis **posisi kolom** (bukan isi teks), sistem akan tetap menghitung skor dengan benar **selama urutan 44 kolom jawaban pada file yang diupload mengikuti urutan resmi BFI-44** — apapun kalimat pernyataan yang sesungguhnya dipakai di Google Form produksi (asalkan itu memang benar representasi item BFI ke-1 sampai ke-44 sesuai standar). Risiko baru muncul **jika** seseorang membuat Google Form baru dengan menyalin literal teks placeholder dari template unduhan sebagai pernyataan sungguhan — pernyataan tersebut tidak divalidasi secara psikometri dan bisa jadi tidak benar-benar mengukur dimensi yang diklaim. |
| **Rekomendasi** | Pastikan Google Form produksi yang sesungguhnya dipakai untuk mengumpulkan data BFI memakai **44 item BFI resmi (versi Indonesia yang telah divalidasi/adaptasi)**, disusun dalam urutan 1–44 standar, bukan menyalin teks placeholder dari template Excel aplikasi ini apa adanya. |

---

## Sumber Dokumen

- `src/pages/bigfive.js` — implementasi aktual (skoring, parsing jawaban, render, PDF, ekspor).
- `zlainnya/Prompt_BigFive_Patch.md` — draft spesifikasi (kunci pemetaan item, narasi interpretasi, contoh validasi — konsisten dengan kode aktual).
