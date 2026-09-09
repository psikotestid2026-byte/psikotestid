# DISC — Dokumentasi Lengkap Alat Tes

> Dokumen ini merangkum **persis apa yang berjalan di aplikasi** (`src/pages/disc.js`), dikonfirmasi silang dengan sumber data soal asli (`zlainnya/Format DISC.xlsx`) dan dua dokumen spesifikasi historis (`PROMPT_DISC_GENERATOR.md`, `PROMPT_DISC_V2.md`). Bila ada perbedaan antara dokumen historis dan kode yang berjalan, **kode yang berjalan (disc.js) adalah rujukan utama** — perbedaan dicatat eksplisit di bagian [Catatan & Riwayat Versi](#catatan--riwayat-versi).

---

## 1. Ringkasan Alat Tes

- **Nama:** DISC (Dominance, Influence, Steadiness, Compliance) — versi implementasi disebut "DISC V2"/"Psikogram DISC".
- **Jumlah soal:** 24 soal (blok), masing-masing berisi 4 pernyataan/kata sifat.
- **Format respons:** *forced-choice ipsatif* — pada tiap blok peserta memilih **1 pernyataan yang PALING menggambarkan dirinya (P / Most)** dan **1 pernyataan yang PALING TIDAK menggambarkan dirinya (K / Least)** dari 4 pilihan yang tersedia. Dua pilihan lain dibiarkan kosong.
- **Total tanda per peserta:** 24× P dan 24× K (96 kolom jawaban di file input, tapi hanya 48 tanda yang diisi — 24 P + 24 K).
- **Output:** 3 grafik (Adaptif / Alami / Gabungan), tipe kepribadian, kamus trait D/I/S/C, saran pengembangan, dan laporan PDF per peserta.
- **Sumber input:** Google Form → diekspor jadi file Excel (`.xlsx`) → diupload ke halaman DISC di aplikasi.

---

## 2. Instruksi Pengerjaan

Instruksi yang ditampilkan ke peserta (melalui Google Form, sebelum diproses aplikasi):

1. Terdapat 24 nomor. Setiap nomor berisi 4 pernyataan/kata sifat.
2. Dari 4 pernyataan tersebut, pilih:
   - **satu (1)** yang **PALING** menggambarkan diri Anda → tandai **P**
   - **satu (1)** yang **PALING TIDAK** menggambarkan diri Anda → tandai **K**
3. Sisa 2 pernyataan yang lain dibiarkan kosong (tidak dipilih).
4. Kerjakan secara spontan/insting pertama, jangan terlalu lama berpikir per nomor.
5. Tidak ada jawaban benar/salah — jawablah sesuai kondisi nyata diri Anda saat ini (bukan kondisi ideal).

**Instruksi ke Admin/HR (di halaman upload aplikasi):**
- Upload file Excel hasil Google Form asesmen DISC V2 (24 soal × 4 pilihan P/K).
- Kolom identitas wajib: Nama Lengkap, Jenis Kelamin, Tanggal Lahir, Posisi/Pekerjaan (opsional: Nomor Asesmen, Tanggal Asesmen, Pendidikan).
- Header kolom soal harus berformat `"1 [teks pilihan]"`, `"2 [teks pilihan]"`, dst — aplikasi mendeteksi kolom soal lewat pola regex `^\s*{nomor}\s*(\[|\.)`.
- Setiap baris pada file = satu peserta. Aplikasi memproses semua baris sekaligus (multi-peserta dalam satu file).
- Aplikasi menyediakan tombol **"Unduh Template Excel"** yang menghasilkan header 96 kolom siap pakai.

---

## 3. Daftar Lengkap 24 Soal (Item Bank Resmi)

Sumber: `zlainnya/Format DISC.xlsx` (file template Google Form asli), dicocokkan dengan kunci skoring `KEYS` di `disc.js`.

Kolom **"Dim Most"** = dimensi yang mendapat poin jika pilihan ini ditandai **P**.
Kolom **"Dim Least"** = dimensi yang mendapat poin jika pilihan ini ditandai **K**.
`X` = netral, tidak menyumbang poin ke dimensi manapun.

> Catatan penting: dimensi Most dan Least untuk pilihan yang **sama** bisa **berbeda** (mis. Soal 12 pilihan 1: Most=X, Least=S). Ini bagian dari desain ipsatif — satu pernyataan bisa "netral" bila dipilih sebagai yang paling menggambarkan, tapi "bermakna" bila dipilih sebagai yang paling tidak menggambarkan (atau sebaliknya).

### Soal 1

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Mudah bergaul, ramah, menyenangkan | S | S |
| 2 | Penuh Kepercayaan, percaya kepada orang lain | I | I |
| 3 | Petualang, pengambil risiko | X | D |
| 4 | Toleran, penuh hormat | C | C |

### Soal 2

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Lembut dalam tutur kata, pendiam | C | X |
| 2 | Optimis, berpikir ke masa depan | D | D |
| 3 | Suka menjadi pusat perhatian, mudah bersosialisasi | X | I |
| 4 | Pendamai, menyukai keseimbangan | S | S |

### Soal 3

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Memotivasi orang lain | I | I |
| 2 | Berjuang mencapai kesempurnaan | X | C |
| 3 | Menyukai menjadi bagian dari kelompok | X | S |
| 4 | Ingin menggapai hasil/target | D | X |

### Soal 4

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Mudah frustasi | C | C |
| 2 | Menyimpan sendiri perasaan dan emosi | S | S |
| 3 | Dapat menceritakan kejadian dengan versi saya sendiri | X | I |
| 4 | Berani menghadapi pihak oposisi | D | D |

### Soal 5

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Lincah, suka bicara | S | S |
| 2 | Cekatan, mempunyai keyakinan | I | I |
| 3 | Mencoba menjaga keseimbangan | X | D |
| 4 | Mencoba mengikuti aturan | C | C |

### Soal 6

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Dapat mengelola waktu secara efisien | C | X |
| 2 | Tergesa-gesa, merasa tertekan | D | D |
| 3 | Lebih mementingkan hal-hal sosial | I | I |
| 4 | Menuntaskan apa yang sudah dikerjakan | S | S |

### Soal 7

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Menolak perubahan yang mendadak | S | X |
| 2 | Cenderung berjanji secara berlebihan | I | I |
| 3 | Menarik diri ketika tertekan | X | C |
| 4 | Tidak takut untuk melawan | X | D |

### Soal 8

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Motivator yang andal | I | I |
| 2 | Pendengar yang baik | S | S |
| 3 | Penganalisa yang teliti | C | C |
| 4 | Pendelegasi yang efisien | D | D |

### Soal 9

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Hasil adalah yang terpenting | D | D |
| 2 | Mengerjakan dengan benar, ketepatan sangat penting | C | C |
| 3 | Menikmati proses | X | I |
| 4 | Mengerjakan bersama-sama | X | S |

### Soal 10

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Tidak tergantung apapun, kontrol diri | X | C |
| 2 | Akan membeli berdasarkan hasrat | D | D |
| 3 | Akan menunggu, tidak ada tekanan | S | S |
| 4 | Akan membelanjakan sesuai keinginan | I | X |

### Soal 11

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Ramah, teman yang menyenangkan | S | X |
| 2 | Unik, bosan dengan rutinitas | X | I |
| 3 | Sering mengubah sesuatu | D | D |
| 4 | Menginginkan kepastian | C | C |

### Soal 12

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Tidak konfrontatif, mudah menyerah | X | S |
| 2 | Sangat perhatian terhadap detail | C | X |
| 3 | Mudah berubah pada detik-detik terakhir | I | I |
| 4 | Penuntut, gegabah | D | D |

### Soal 13

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Menghendaki kemajuan | D | D |
| 2 | Mudah puas diri, merasa terpenuhi | S | X |
| 3 | Memperlihatkan perasaan secara terbuka, ekspresif | I | X |
| 4 | Rendah hati, sederhana | X | C |

### Soal 14

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Dingin, pendiam | C | C |
| 2 | Bahagia, riang | I | I |
| 3 | Menyenangkan, baik hati | S | X |
| 4 | Tegas, pemberani | D | D |

### Soal 15

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Menghabiskan waktu yang berkualitas dengan orang lain | S | S |
| 2 | Mempersiapkan masa depan, mempersiapkan diri | C | X |
| 3 | Menyukai petualangan baru | I | I |
| 4 | Menikmati penghargaan atas pencapaian | D | D |

### Soal 16

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Peraturan perlu dipertanyakan | X | D |
| 2 | Peraturan membuat adil | C | X |
| 3 | Peraturan membosankan | I | I |
| 4 | Peraturan membuat aman | S | S |

### Soal 17

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Pendidikan, kebudayaan | X | C |
| 2 | Pencapaian, penghargaan | D | D |
| 3 | Keselamatan, keamanan | S | S |
| 4 | Sosialisasi, pertemuan kelompok | I | X |

### Soal 18

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Mengambil tanggung jawab, terlibat langsung | D | D |
| 2 | Senang berteman, antusias | X | I |
| 3 | Mudah ditebak, konsisten | X | S |
| 4 | Berhati-hati, waspada | C | X |

### Soal 19

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Tidak mudah dikalahkan | D | D |
| 2 | Melakukan seperti yang diperintahkan, mengikuti pemimpin | S | X |
| 3 | Penuh semangat, gembira | I | I |
| 4 | Menghendaki keteraturan, rapi | X | C |

### Soal 20

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Saya akan memimpin mereka | D | X |
| 2 | Saya akan mengikuti dengan setia | S | S |
| 3 | Saya akan membujuk mereka | I | I |
| 4 | Saya akan mendapatkan faktanya | C | X |

### Soal 21

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Memikirkan orang lain terlebih dahulu | S | S |
| 2 | Kompetitif, menyukai tantangan | D | D |
| 3 | Optimis, bersikap positif | I | I |
| 4 | Berpikir logis, sistematis | X | C |

### Soal 22

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Menyenangkan orang lain, ramah | S | S |
| 2 | Tertawa terbahak-bahak, enerjik | X | I |
| 3 | Berani, tegas | D | D |
| 4 | Tenang, pendiam | C | C |

### Soal 23

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Menghendaki kekuasaan lebih | X | D |
| 2 | Menghendaki kesempatan baru | I | X |
| 3 | Menghindari konflik | S | S |
| 4 | Menghendaki petunjuk dan arahan yang jelas | X | C |

### Soal 24

| Pilihan | Teks | Dim Most (P) | Dim Least (K) |
|---|---|---|---|
| 1 | Dapat diandalkan, dapat dipercaya | X | S |
| 2 | Kreatif, unik | I | I |
| 3 | Berorientasi kepada hasil | D | X |
| 4 | Berpegang teguh pada standar yang tinggi, akurat | C | X |

---

## 4. Sistem Skoring — Tahap demi Tahap

Implementasi persis: fungsi `scoreDiscV2()`, `lookup()`, `calcType()`, `checkStatus()` di `src/pages/disc.js`.

### 4.1 Tahap 1 — Raw Score (Most & Least)

Untuk setiap peserta, iterasi 24 soal. Untuk tiap soal `q` (0–23):

- Ambil pilihan yang ditandai **P** (indeks 0–3) → lihat karakter ke-`pIndex` dari `KEYS[q][0]` (string 4 karakter Most). Jika bukan `X`, tambahkan +1 ke `rawMost[dimensi]`.
- Ambil pilihan yang ditandai **K** (indeks 0–3) → lihat karakter ke-`kIndex` dari `KEYS[q][1]` (string 4 karakter Least). Jika bukan `X`, tambahkan +1 ke `rawLeast[dimensi]`.

Hasil akhir: `rawMost = {D, I, S, C}` dan `rawLeast = {D, I, S, C}`, masing-masing dengan total maksimum 24 (tergantung berapa banyak yang jatuh ke `X`).

### 4.2 Tahap 2 — Raw Change

```
rawChange.D = rawMost.D - rawLeast.D
rawChange.I = rawMost.I - rawLeast.I
rawChange.S = rawMost.S - rawLeast.S
rawChange.C = rawMost.C - rawLeast.C
```

### 4.3 Tahap 3 — Konversi ke Skala Grafik (Lookup Table)

Raw score (Most, Least, dan Change) masing-masing dikonversi ke **nilai skala grafik** menggunakan satu tabel lookup tunggal `TABEL`, terindeks oleh nilai raw (dari **-22 hingga +22**), dengan 12 kolom output: `[Dm, Im, Sm, Cm, Dl, Il, Sl, Cl, Dc, Ic, Sc, Cc]` (m=Most, l=Least, c=Change).

**Algoritma `lookup(raw, kolom)`:**
1. Jika `raw` persis ada sebagai key di `TABEL`, pakai baris itu.
2. Jika tidak ada (di luar rentang -22..22), cari key ter-dekat (*nearest neighbour*) secara numerik.
3. Jika nilai pada kolom yang dituju bernilai `null` (kolom itu tidak punya data pada raw tersebut — umum terjadi karena Most/Least hanya valid di rentang tertentu), geser `raw` selangkah menuju nol (`r += r>0 ? -1 : 1`) dan coba lagi, hingga maksimum 40 percobaan.
4. Jika tetap `null`, kembalikan `0`.

Ini berarti sistem **tidak pernah menginterpolasi secara linear** — nilai skala selalu diambil dari tabel hasil kalibrasi asli, dengan strategi "cari tetangga terdekat yang punya data" saat rawnya di luar jangkauan kalibrasi untuk kombinasi dimensi tertentu (mis. Most/Least secara desain hanya bermakna di rentang raw tertentu, sedangkan Change mencakup rentang penuh -22..+22).

**Tabel lengkap `TABEL`** (raw → [Dm,Im,Sm,Cm, Dl,Il,Sl,Cl, Dc,Ic,Sc,Cc]) — persis seperti di kode:

| Raw | Dm | Im | Sm | Cm | Dl | Il | Sl | Cl | Dc | Ic | Sc | Cc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 22 | — | — | — | — | — | — | — | — | — | — | — | -16 |
| 21 | — | — | — | — | — | — | — | — | — | — | — | -15 |
| 20 | — | — | — | — | — | — | — | — | -15 | — | — | -15 |
| 19 | — | — | — | — | — | — | — | — | -14 | — | — | -15 |
| 18 | — | — | — | — | — | — | — | — | -14 | -15 | -16 | -14 |
| 17 | — | — | — | — | — | — | — | — | -14 | -14 | -15 | -14 |
| 16 | — | — | — | — | — | — | — | — | -14 | -14 | -15 | -14 |
| 15 | — | — | — | — | — | — | — | — | -13 | -14 | -14 | -13 |
| 14 | — | — | — | — | — | — | — | — | -13 | -14 | -14 | -13 |
| 13 | — | — | — | — | — | — | — | — | -13 | -14 | -14 | -12 |
| 12 | — | — | — | — | — | — | — | — | -12 | -14 | -14 | -12 |
| 11 | — | — | — | — | — | — | — | — | -11 | -14 | -14 | -12 |
| 10 | — | — | — | — | — | — | — | — | -9 | -14 | -13 | -12 |
| 9 | — | — | — | — | — | — | — | — | -7 | -13 | -10 | -10 |
| 8 | — | — | — | — | — | — | — | — | -6 | -12 | -9 | -9 |
| 7 | — | — | — | — | — | — | — | — | -6 | -10 | -7 | -7 |
| 6 | — | — | — | — | — | — | — | — | -5 | -9 | -6 | -6 |
| 5 | — | — | — | — | — | — | — | — | -4 | -7 | -4 | -5 |
| 4 | — | — | — | — | — | — | — | — | -3 | -6 | -3 | -1 |
| 3 | — | — | — | — | — | — | — | — | -2 | -4 | -2 | 0 |
| 2 | — | — | — | — | — | — | — | — | -1 | -3 | -1 | 1 |
| 1 | — | — | — | — | — | — | — | — | -1 | 0 | 0 | 2 |
| 0 | -13 | -15 | -12 | -13 | 16 | 15 | 16 | 16 | 0 | 1 | 2 | 3 |
| -1 | -11 | -10 | -9 | -10 | 14 | 13 | 15 | 15 | 1 | 3 | 3 | 6 |
| -2 | -8 | -5 | -7 | -7 | 9 | 8 | 13 | 12 | 1 | 4 | 4 | 8 |
| -3 | -5 | -2 | -3 | -3 | 5 | 5 | 8 | 8 | 2 | 6 | 6 | 9 |
| -4 | -3 | 2 | -1 | 1 | 3 | 2 | 5 | 5 | 2 | 8 | 7 | 12 |
| -5 | -2 | 6 | 1 | 4 | 1 | 0 | 3 | 3 | 3 | 9 | 8 | 13 |
| -6 | 0 | 7 | 2 | 6 | 0 | -4 | 1 | 1 | 4 | 11 | 9 | 14 |
| -7 | 1 | 11 | 5 | 11 | -2 | -6 | -2 | 0 | 5 | 12 | 10 | 14 |
| -8 | 2 | 12 | 6 | 12 | -3 | -9 | -4 | -3 | 7 | 14 | 11 | 14 |
| -9 | 4 | 13 | 8 | 13 | -5 | -11 | -6 | -5 | 8 | 14 | 12 | 14 |
| -10 | 6 | 14 | 10 | 13 | -6 | -13 | -9 | -7 | 10 | 15 | 13 | 15 |
| -11 | 7 | 15 | 11 | 14 | -7 | -14 | -11 | -11 | 10 | 15 | 14 | 15 |
| -12 | 8 | 15 | 12 | 14 | -9 | -15 | -13 | -12 | 11 | 15 | 14 | 15 |
| -13 | 10 | 15 | 13 | 15 | -11 | -15 | -14 | -13 | 12 | 15 | 14 | 15 |
| -14 | 11 | 15 | 14 | 15 | -12 | -15 | -14 | -14 | 13 | 15 | 14 | 15 |
| -15 | 14 | 15 | 15 | 15 | -13 | -15 | -14 | -15 | 14 | 15 | 15 | 15 |
| -16 | 15 | 15 | 15 | 15 | -14 | -15 | -15 | -15 | 14 | 15 | 15 | 15 |
| -17 | 15 | 15 | 15 | 16 | -15 | -15 | -15 | -16 | 14 | 15 | 15 | 16 |
| -18 | 15 | 15 | 15 | — | -15 | -15 | -15 | — | 15 | 16 | 15 | — |
| -19 | 15 | 16 | 15 | — | -15 | -16 | -16 | — | 15 | — | 15 | — |
| -20 | 15 | — | 16 | — | -16 | — | — | — | 15 | — | 16 | — |
| -21 | 16 | — | — | — | — | — | — | — | 16 | — | — | — |
| -22 | — | — | — | — | — | — | — | — | — | — | — | — |

> **Cara membaca:** kolom `Raw` diindeks TERBALIK — indeks tabel di kode JS sebenarnya menggunakan key `"0"` s.d. `"22"` (menyimpan nilai Most/Least, semakin besar index = semakin banyak jawaban ke arah dimensi itu tapi diberi bobot NEGATIF pada kolom Dm/Im/Sm/Cm dan POSITIF pada Dl/Il/Sl/Cl — karena secara desain, raw Most yang tinggi berarti dimensi itu **dominan** sehingga posisinya di skala Adaptif justru dianggap "rendah tekanan/defisit" secara terbalik matematis mengikuti kalibrasi asli test DISC klasik). Kolom Change (`Dc,Ic,Sc,Cc`) diindeks dari `"-22"` s.d. `"22"` sesuai `rawChange` yang bisa negatif maupun positif.
>
> **Penting:** Tabel ini adalah hasil kalibrasi psikometrik asli dan **tidak boleh diinterpolasi ulang** — gunakan persis seperti di atas, konsisten dengan peringatan yang ada di dokumen legacy (`PROMPT_DISC_V2.md`, `PROMPT_DISC_GENERATOR.md`): *"Angka-angka skala grafik HARUS DIGUNAKAN PERSIS... Tidak boleh diinterpolasi, dihitung ulang, atau diubah."*

Hasil akhir Tahap 3: tiga set skor skala per peserta:
- `scaleMost = {D, I, S, C}` → **Grafik 1 — Public Self / Mask / Kepribadian Adaptif**
- `scaleLeast = {D, I, S, C}` → **Grafik 2 — Private Self / Core / Kepribadian Alami**
- `scaleChange = {D, I, S, C}` → **Grafik 3 — Perceived Self / Mirror / Kepribadian Gabungan (Tersembunyi)** — **grafik utama** yang menentukan tipe kepribadian final.

### 4.4 Tahap 4 — Penentuan Tipe Kepribadian (`calcType`)

Untuk tiap grafik (Most/Least/Change), fungsi `calcType(gv)`:

1. Urutkan 4 dimensi `[D, I, S, C]` dari nilai **tertinggi ke terendah**. Jika ada nilai sama persis, urutan tie-break mengikuti urutan tetap `D > I > S > C`.
2. Ambil hanya dimensi yang nilainya **≥ 0** (positif atau nol), dengan urutan hasil sort tadi.
3. Gabungkan kode dimensi tersebut dengan tanda `-` (mis. `D-I-S`).
4. Jika **tidak ada** dimensi yang ≥ 0 (semua negatif), kode tipe adalah dimensi tertinggi saja (mis. `D` walau nilainya negatif) — kasus ini nantinya "ditutupi" oleh status khusus (lihat 4.5).

Kode tipe ini dihasilkan **terpisah untuk masing-masing dari 3 grafik**:
- `type1` = kode dari `scaleMost` (Grafik I / Adaptif)
- `type2` = kode dari `scaleLeast` (Grafik II / Alami)
- `type3` = kode dari `scaleChange` (Grafik III / Gabungan) — **dipakai sebagai tipe utama laporan**

Dimensi utama tunggal (`mainDim`) = dimensi dengan nilai `scaleChange` tertinggi (dipakai untuk kamus D/I/S/C penuh di laporan, lihat Bagian 6).

### 4.5 Tahap 5 — Status Khusus (`checkStatus`)

Dicek terpisah untuk tiap grafik (Most/Least/Change), **menggantikan** kode tipe biasa bila kondisi terpenuhi:

| Status | Kondisi (pada skala grafik terkait) | Arti |
|---|---|---|
| **Transisi** | Semua 4 dimensi berada di rentang **-2.0 ≤ nilai ≤ 2.0** | Skor terlalu datar/mendekati nol di semua dimensi — individu belum menunjukkan pola dominan yang jelas. |
| **Super Syndrom** | Semua 4 dimensi bernilai **> 0** | Individu menunjukkan seluruh karakteristik D, I, S, C secara bersamaan — sangat adaptif namun berpotensi kurang konsisten/otentik. |
| **Undershift** | Semua 4 dimensi bernilai **< 0** | Individu dalam kondisi tertekan, kehilangan motivasi, atau merasa sangat dibatasi — tidak ada dimensi yang menonjol positif. |

Bila salah satu status ini terpenuhi, laporan menampilkan **label status**, bukan kode tipe D/I/S/C, disertai penjelasan kontekstual berbeda tergantung grafik mana yang terkena (lihat fungsi `getStatInfo` — untuk Transisi, teksnya berbeda antara Grafik I (masalah lingkungan kerja/peran sosial), Grafik II (masalah pribadi/keluarga yang memengaruhi stabilitas emosi dasar), dan Grafik III (bimbang arah kontribusi/peran)).

### 4.6 Validasi Input

Untuk tiap baris/peserta, sistem mem-parsing 24 blok kolom jawaban dan memvalidasi:
- Tiap soal **harus** memiliki tepat 1 tanda `P` (di antara 4 kolom pilihannya) — bila tidak ditemukan, dicatat sebagai error: `"Soal {n}: P tidak ditemukan"`.
- Tiap soal **harus** memiliki tepat 1 tanda `K` — bila tidak ditemukan: `"Soal {n}: K tidak ditemukan"`.
- Total P dan total K dihitung (`totalP`, `totalK`) dan ditampilkan pada tabel ringkasan/CSV.
- Peserta dengan error validasi tetap diproses (skor dihitung dari data yang ada), tapi ditandai dengan badge peringatan pada tabel ringkasan dan alert di halaman detail — laporan tetap bisa diunduh, HR/psikolog perlu menilai kualitas datanya secara manual.

---

## 5. Kamus Tipe Kepribadian (Kombinasi Dimensi)

Tipe ditentukan oleh urutan dimensi positif dari `scaleChange` (Grafik III), namun label & narasi yang sama juga dipakai untuk menjelaskan `type1`/`type2` bila kodenya identik. Jika kode gabungan tidak persis cocok di kamus (mis. kombinasi 4 dimensi atau urutan yang tidak terdaftar), sistem *fallback* mengambil 2 dimensi pertama, lalu 1 dimensi pertama saja (`findTypeInfo`).

Berikut **seluruh 22 entri** yang benar-benar terdaftar di kamus aplikasi (`TYPE_INFO` pada `disc.js`):

### C — LOGICAL THINKER
Seorang yang praktis, cakap dan unik. Ia orang yang mampu menilai diri sendiri dan kritis terhadap dirinya dan orang lain. Ia menyukai hal yang detil dan logis; secara alamiah ia sangat analitis. Karena menyimpan informasi, ia meneliti isu berulang-ulang kali. Ia cenderung hati-hati dalam membuat keputusan yang berdasarkan pada logika, bukan emosi, selalu menggunakan pertanyaan "bagaimana dan mengapa". Ia mengerjakan sesuatu dengan sistematis dan akurat. Sangat teliti dalam segala sesuatu.
**Profesi cocok:** Planner, Engineer, Statistician, Academic, Government Worker, IT Management, Quality Controller.

### D — ESTABLISHER
Memiliki rasa ego yang tinggi dan cenderung individualis dengan standard yang sangat tinggi. Ia lebih suka menganalisa masalah sendirian daripada bersama orang lain. Rasa egoisnya yang kuat membuatnya tidak nyaman di bawah kendali orang lain; ia lebih suka menjadi "boss" dan menetapkan standard tinggi. Ia menghindari sesuatu yang biasa-biasa dan cenderung mencari tantangan baru. Mampu memimpin situasi dan orang lain dalam rangka mencapai sasarannya; ia ingin selalu unggul dalam persaingan.
**Profesi cocok:** Attorney, Sales Representative, Production Director/Manager, Strategic Planning, Trouble Shooting, Engineering Director/Manager, Self-Employment.

### D-I — PENGAMBIL KEPUTUSAN
Tidak basa-basi dan tegas, ia cenderung merupakan seorang individualis yang kuat. Ia berpandangan jauh ke depan, progresif dan mau berkompetisi untuk mencapai sasaran. Ia seorang yang logis, kritis dan tajam dalam memecahkan masalah. Ia mencanangkan standard tinggi pada dirinya dan mengutamakan kesempurnaan. Ia menginginkan otoritas yang jelas dan menyukai tugas-tugas baru.
**Profesi cocok:** General Management, Public Relations, Business Consultant, Sales, Marketing, Production.

### D-I-S — DIRECTOR
Fokus pada penyelesaian pekerjaan dan menunjukkan penghargaan yang tinggi kepada orang lain. Ia memiliki kemampuan untuk menggerakkan orang dan pekerjaan. Enerjik dan sosial, ia mampu memotivasi orang lain sambil menyelesaikan pekerjaannya. Ia menampilkan rasa percaya diri dan mampu meyakinkan orang lain. Sekali ia memutuskan sesuatu, ia akan terus mengerjakannya sampai selesai.
**Profesi cocok:** Engineering & Production Management, Sales, Service Manager, Customer Service, IT, Lecturer.

### D-S — SELF-MOTIVATED
Seorang yang obyektif dan analitis. Ia ingin terlibat dalam situasi, dan ia juga ingin memberikan bantuan dan dukungan kepada orang yang ia hormati. Secara internal termotivasi oleh target pribadi. Karena determinasinya yang kuat, ia sering berhasil dalam berbagai hal; karakternya yang tenang, stabil dan daya tahannya yang tinggi memiliki kontribusi dalam keberhasilannya.
**Profesi cocok:** Engineering & Production, Project Management, Research, Systems Analyst, Programmer, IT.

### D-C — CHALLENGER
Seorang yang sensitif terhadap permasalahan, dan memiliki kreativitas yang baik dalam memecahkan masalah. Ia dapat menyelesaikan tugas-tugas penting dalam waktu singkat karena mempunyai keputusan yang kuat. Seorang yang tekun dan memiliki reaksi yang cepat. Ia banyak memberikan ide-ide dengan berfokus pada pekerjaan. Ia cenderung perfeksionis.
**Profesi cocok:** Engineering Management, Technical/Scientific, Finance, Production Planning.

### D-I-C — CHANCELLOR
Ia menggabungkan antara kesenangan dengan pekerjaan/bisnis ketika melakukan sesuatu. Ia kelihatan menyukai hubungan dengan sesama tetapi juga dapat mengerjakan hal-hal detil. Ia ingin melakukan segala sesuatu dengan tepat. Seorang yang ramah secara alami dan menikmati interaksi dengan sesama, akan tetapi ia akan juga menilai orang dan tugas secara hati-hati.
**Profesi cocok:** Technical/Scientific Management, Engineering, Finance, Business Consultant, IT.

### D-S-I — DIRECTOR
Seorang yang obyektif dan analitis. Ia ingin terlibat dalam situasi, dan ia juga ingin memberikan bantuan dan dukungan. Secara internal termotivasi oleh target pribadi, ia berorientasi terhadap pekerjaannya tapi juga menyukai hubungan dengan sesama. Karena determinasinya yang kuat, ia sering berhasil dalam berbagai hal.
**Profesi cocok:** Engineering & Production Management, Sales, Service Manager, Customer Service.

### I — COMMUNICATOR
Seorang yang berhasil dalam membangkitkan antusiasme orang lain. Ia cenderung optimis dan mudah percaya. Ia banyak bicara dan suka bertemu dengan orang yang baru dikenal. Ia lebih menyukai lingkungan kerja yang bersahabat dan berusaha untuk menciptakan lingkungan yang seperti itu. Orang ini membujuk dan memotivasi orang lain secara efektif untuk mencapai tujuan atau menyelesaikan masalah.
**Profesi cocok:** Promoting, Marketing Services, Public Relations, Lecturing, Hospitality, Journalist.

### I-S — ADVISOR
Seorang yang suka bergaul dengan orang lain serta bersahabat. Ia cenderung untuk berbicara lebih banyak dari pada mendengar; ia benar-benar menikmati percakapan dengan orang lain. Ia terbuka dalam mengungkapkan perasaan dirinya. Menikmati pekerjaan yang berhubungan dengan orang banyak. Mempunyai kemampuan untuk memotivasi orang lain.
**Profesi cocok:** Personnel, Welfare, Training, Hotelier, Nurse, Human Resources, Social Work.

### I-C — ASSESSOR
Seorang yang berhasil dalam membangkitkan antusiasme orang lain tetapi juga memiliki kepedulian terhadap ketepatan dan akurasi. Ia bersahabat namun juga memperhatikan detail. Memadukan kemampuan komunikasi dengan kemampuan analitis yang kuat.
**Profesi cocok:** Teaching, Training, Inventing, Specialist Selling, Finance, Public Relations.

### I-S-C — RESPONSIVE & THOUGHTFUL
Merupakan individu konsisten yang berusaha menjaga lingkungan/suasana yang tidak berubah. Ia bekerja dengan baik bersama orang-orang dengan berbagai kepribadian karena perilakunya yang terkendali dan rendah hati. Sabar, loyal dan suka menolong. Persahabatan dikembangkannya dengan lambat dan selektif.
**Profesi cocok:** Actors, Personnel, Training, Teaching, Accounting, Customer Services, Public Relations.

### S — SPECIALIST
Berpikir sistematis dan cenderung mengikuti prosedur dalam kehidupan pribadi dan pekerjaannya. Teratur dan memiliki perencanaan yang baik, ia teliti dan fokus pada detil. Bertindak dengan penuh kebijaksanaan, diplomatis dan jarang menentang rekan kerjanya. Ia sangat berhati-hati, sungguh-sungguh mengharapkan akurasi dan standard tinggi dalam pekerjaannya.
**Profesi cocok:** Administrative Work, Engineering, Chef, Telemarketing, Research, Retail, Accounting.

### S-C — PEACEMAKER
Seorang yang sensitif terhadap permasalahan, dan memiliki kreativitas yang baik dalam memecahkan masalah. Ia dapat menyelesaikan tugas-tugas penting dalam waktu singkat karena mempunyai keputusan yang kuat. Ia akan meneliti dan mengejar semua kemungkinan yang ada dalam mencari solusi permasalahan. Ia cenderung perfeksionis.
**Profesi cocok:** Office Manager, Production Supervisor, Accountant, Flight Attendant, Data Entry.

### S-I — ADVISOR
Seorang yang suka bergaul dengan orang lain serta bersahabat. Ia cenderung untuk berbicara lebih banyak dari pada mendengar; ia benar-benar menikmati percakapan dengan orang lain. Ia terbuka dalam mengungkapkan perasaan dirinya. Menikmati pekerjaan yang berhubungan dengan orang banyak.
**Profesi cocok:** Personnel, Welfare, Training, Teaching, Customer Services, Public Relations.

### S-I-C — ADVOCATE
Seorang yang suka melakukan pendekatan dengan orang lain secara hati-hati dan analitis. Ia menggabungkan kehangatan sosial dengan perhatian terhadap detail dan prosedur. Loyal dan konsisten, ia dapat diandalkan untuk menyelesaikan tugas dengan penuh tanggung jawab.
**Profesi cocok:** Engineering & Production Supervision, Customer Service, Programmer, Accounting.

### C-I — ASSESSOR
Memadukan kemampuan analitis yang kuat dengan kemampuan komunikasi interpersonal. Ia dapat menggabungkan perhatian terhadap detail dengan kemampuan mempengaruhi orang lain.
**Profesi cocok:** Sales Technical/Specialist, Public Relations, Lecturer, Training, Hospitality.

### C-D-I — CHALLENGER
Seorang yang sensitif terhadap permasalahan dan kreatif dalam memecahkan masalah. Menggabungkan ketepatan analitis dengan kepemimpinan dan kemampuan interpersonal yang kuat.
**Profesi cocok:** Engineering R&D, Research, Work Study, Sales Technical, Systems Analyst, Lecturer.

### C-D-S — CONTEMPLATOR
Seorang yang sangat analitis dan metodis. Ia mengumpulkan fakta secara menyeluruh sebelum mengambil tindakan. Ia memperhitungkan berbagai faktor dengan hati-hati sebelum membuat keputusan. Menggabungkan ketepatan dengan kesabaran dan ketekunan.
**Profesi cocok:** Engineering, Research, Production, Accountant, Quality Controller, Market Analyst.

### C-S-D — PRECISIONIST
Seorang yang analitis dan sabar yang menggabungkan perhatian terhadap detail dengan orientasi pada hasil. Ia dapat memimpin orang lain melalui pendekatan yang sistematis dan terstruktur. Sangat teliti dan berhati-hati dalam setiap aspek pekerjaannya.
**Profesi cocok:** Engineering, Research, Production, Financial Services Manager, Quality Controller, Planner.

### Fallback (kombinasi tak terdaftar)

Bila kode gabungan (mis. hasil dari 4 dimensi positif sekaligus tapi bukan Super Syndrom karena syaratnya ketat, atau urutan langka seperti `S-D-C`) tidak ada di atas, `findTypeInfo()`:
1. Coba cocokkan 2 dimensi pertama dari kode (mis. `S-D-C` → coba `S-D`).
2. Bila masih tidak ketemu, pakai dimensi pertama saja (mis. → `S`).
3. Bila tetap tidak ada, tampilkan kode apa adanya tanpa nama/deskripsi/profesi (kamus kosong).

> **Catatan cakupan:** Dokumen historis (`PROMPT_DISC_GENERATOR.md`, `PROMPT_DISC_V2.md`) menyebut skema **40 tipe** dengan variasi nama tambahan (Negotiator, Designer, Motivator, Inquirer, Mediator, Practitioner, Perfectionist, dst). **Kamus yang benar-benar aktif di aplikasi saat ini hanya memuat 22 entri** seperti di atas — kombinasi 40-tipe versi lama belum/tidak diimplementasikan ke `TYPE_INFO`. Lihat [Catatan & Riwayat Versi](#catatan--riwayat-versi).

---

## 6. Kamus Trait Dimensi Utama (D / I / S / C)

Ditentukan dari `mainDim` (dimensi tertinggi pada Grafik III/Change), dan "Core Dims" (irisan dimensi yang konsisten muncul positif di ketiga grafik — atau dimensi dominan Grafik I bila tidak ada irisan) dipakai untuk merangkai bagian potret/kelebihan/dst secara gabungan bila individu memiliki lebih dari satu dimensi menonjol.

### D — Dominance (warna `#ef4444`)

| Aspek | Isi |
|---|---|
| **Potret Diri** | Bersaing · Cepat bertindak · Berani mengambil resiko · Menuntut sesuatu · Memerintah · Rasional · Berorientasi pada tugas · Formal · Mandiri/tertutup · Disiplin |
| **Kelebihan** | To the Point · Cepat membuat keputusan · Menyukai perubahan · Menetapkan banyak sasaran · Berani mengambil resiko · Inovatif kompetitif efisien · Menghargai waktu · Memiliki inisiatif |
| **Kekurangan** | Tidak sensitif terhadap orang lain · Tidak sabaran · Suka mendominasi · Tidak memperhatikan perasaan orang lain · Tidak peduli terhadap aturan · Kurang hati-hati |
| **Kecenderungan** | Memecahkan masalah dengan cepat · Menerima proyek penuh tantangan · Mengambil wewenang · Membuat keputusan · Melakukan banyak pekerjaan sekaligus · Mencapai sasaran/tujuan |
| **Lingkungan Cocok** | Kekuasaan dan otoritas · Prestise dan tantangan · Hasil yang langsung kelihatan · Kebebasan untuk mengontrol · Variasi dan kegiatan yang berbeda · Kesempatan untuk maju |
| **Saran Perbaikan** | Menghargai kebutuhan orang lain · Sabar dengan orang lain · Mengkomunikasikan alasan di balik keputusan · Peduli terhadap perincian · Mengembangkan pendekatan yang lebih sabar |

### I — Influence (warna `#f97316`)

| Aspek | Isi |
|---|---|
| **Potret Diri** | Ramah · Antusias · Suka bergaul · Optimis · Banyak bicara · Impulsif · Emosional · Berorientasi pada orang · Tidak formal · Terbuka/ekspresif |
| **Kelebihan** | Bersemangat · Membangkitkan antusiasme orang lain · Persuasif · Kreatif · Optimis · Suka bersenang-senang · Pandai berkomunikasi · Membuat orang lain merasa nyaman |
| **Kekurangan** | Tidak suka dikritik · Terlalu mempercayai orang lain · Cenderung tidak mampu menetapkan prioritas · Kurang sensitif terhadap hal kurang penting · Kurang teliti |
| **Kecenderungan** | Melaksanakan tugas secara konsisten · Menunjukan kesabaran · Senang membantu orang lain · Menunjukan loyalitas · Menjadi pendengar yang baik · Menangani orang secara menyenangkan |
| **Lingkungan Cocok** | Popularitas dan pengakuan sosial · Kebebasan berekspresi · Aktivitas kelompok di luar pekerjaan · Hubungan demokratik · Pembimbingan dan pelatihan · Suasana kerja yang menyenangkan |
| **Saran Perbaikan** | Berkonsentrasi pada tugas · Memperhitungkan resiko · Menggunakan prinsip kehati-hatian · Mempelajari fakta-fakta · Berhati-hati sebelum memutuskan |

### S — Steadiness (warna `#22c55e`)

| Aspek | Isi |
|---|---|
| **Potret Diri** | Sabar · Dapat dipercaya · Berhati-hati · Stabil · Kooperatif · Tidak menyukai perubahan · Berorientasi pada orang · Terbuka/ekspresif |
| **Kelebihan** | Dapat dipercaya · Bekerja keras · Tidak mudah berubah pikiran · Pengambilan keputusan yang matang · Baik dalam koordinasi · Sabar · Tulus · Dapat diandalkan · Setia |
| **Kekurangan** | Terlalu sensitif terhadap kritik · Sulit menghadapi perubahan mendadak · Menghindari konflik · Kurang tegas · Terlalu bergantung pada rutinitas |
| **Kecenderungan** | Bekerja secara konsisten · Membantu orang lain · Mendukung orang-orang terdekat · Menciptakan suasana harmonis · Menjadi mediator · Melakukan tugas rutin dengan teliti |
| **Lingkungan Cocok** | Keamanan dan stabilitas · Prosedur yang jelas · Lingkungan kerja yang ramah · Pengakuan atas kesetiaan · Pekerjaan yang bervariasi namun terstruktur |
| **Saran Perbaikan** | Lebih tegas dalam menyampaikan pendapat · Belajar menerima perubahan · Mengambil inisiatif · Tidak terlalu bergantung pada persetujuan orang lain |

### C — Compliance (warna `#8b5cf6`)

| Aspek | Isi |
|---|---|
| **Potret Diri** | Kooperatif · Lambat bertindak · Menghindari resiko · Menerima · Pendiam · Rasional · Berorientasi pada tugas · Formal · Mandiri/tertutup · Disiplin |
| **Kelebihan** | Berpikir objektif · Hati-hati/teliti · Mempertahankan standar tinggi · Menanyakan hal yang benar · Keterampilan diplomatik · Memberikan perhatian sampai detail · Logika dan seksama |
| **Kekurangan** | Ragu-ragu dalam bertindak · Cenderung rewel sampai hal detail · Cenderung bersikap defensif bila dikritik · Cenderung hanya memberikan instruksi tanpa menjelaskan |
| **Kecenderungan** | Mengikuti standar dan petunjuk · Berkonsentrasi pada hal terperinci · Berpikir analitis · Memeriksa keakuratan dan menganalisis kinerja · Menggunakan pendekatan sistematis |
| **Lingkungan Cocok** | Ekspresi kinerja yang terdefinisi jelas · Nilai kualitas dan akurasi · Kesempatan menunjukan keahlian · Pengendalian terhadap faktor yang mempengaruhi kinerja |
| **Saran Perbaikan** | Mendelegasikan tugas penting · Cepat membuat keputusan · Berkompromi dengan orang lain · Memulai dan memfasilitasi diskusi · Mendukung kerja sama |

**Cara aplikasi merangkai bagian ini di laporan (`renderDetailContent`):**
- `coreDims` = dimensi yang **konsisten muncul positif** pada `type1` **dan** `type2` **dan** `type3` sekaligus. Jika irisan kosong, fallback ke dimensi-dimensi `type1`, atau ke `mainDim` saja bila `type1` juga kosong (kasus status khusus).
- Untuk tiap aspek (Potret/Kelebihan/dst), semua item dari `coreDims` digabung dan **di-dedup** (`Set`) — jadi bila `coreDims = [D, I]`, potret diri yang tampil adalah gabungan unik potret D + potret I.
- **Saran Pengembangan** pada laporan (bagian terpisah, di luar rincian per grafik) memakai cakupan lebih luas: gabungan dimensi dari **ketiga** grafik (`type1 ∪ type2 ∪ type3`), bukan hanya irisan — sehingga daftar saran biasanya lebih panjang daripada daftar potret/kelebihan.

---

## 7. Struktur & Konten Laporan (Detail View / PDF)

Laporan per peserta (baik tampilan di layar maupun PDF) tersusun sebagai berikut, sesuai `renderDetailContent()`:

### A. Header Identitas (Hero Section)
- Nama Lengkap
- No. Asesmen
- Jenis Kelamin
- Tanggal Lahir
- Tanggal Asesmen
- Posisi/Pekerjaan
- Pendidikan
- Ringkasan tipe utama (kode `type3`/status khusus + nama tipe) ditampilkan menonjol di pojok kanan atas hero.

### B. Visualisasi 3 Grafik DISC
Tiga grafik line-chart (SVG) berdampingan, sumbu Y dari **+18 (atas)** hingga **-16 (bawah)** secara visual (skala plotting `AXMIN=-16, AXMAX=18`, dengan pita "Zona Transisi" tervisualisasi antara nilai +2 dan -2):
1. **Public Self (Mask) — Grafik I** — dari `scaleMost`, warna biru `#3b82f6`.
2. **Private Self (Core) — Grafik II** — dari `scaleLeast`, warna merah muda `#f43f5e`.
3. **Perceived Self (Mirror) — Grafik III** — dari `scaleChange`, warna sesuai `mainDim` (merah/oranye/hijau/ungu).

Tiap grafik menampilkan 4 titik (D, I, S, C) dengan garis penghubung dan label nilai di atas tiap titik.

### C. Rincian Kepribadian per Grafik (3 kartu berdampingan)
Untuk masing-masing dari 3 grafik, ditampilkan kartu berisi:
- Label grafik + kode tipe (atau label status khusus bila berlaku)
- **Bila status khusus (Transisi/Super Syndrom/Undershift):** nama status + penjelasan kontekstual (lihat tabel Bagian 4.5)
- **Bila tipe normal:** nama tipe (dari kamus Bagian 5) + deskripsi naratif + daftar profesi cocok

### D. Saran Pengembangan
Daftar bullet gabungan dari saran perbaikan (`perbaikan`) semua dimensi yang pernah muncul positif di ketiga grafik (`type1 ∪ type2 ∪ type3`), di-dedup.

### E. Footer Laporan (khusus versi PDF)
- Judul dokumen: **"LAPORAN PSIKOGRAM DISC"**
- Catatan promosi kontak (Coach Alifya)
- Disclaimer kerahasiaan: *"Laporan ini bersifat rahasia dan hanya untuk keperluan asesmen."*

### F. Fitur Unduh & Ekspor
- **Unduh PDF** per peserta (`html2pdf`, format A4 potrait).
- **Unduh Semua (ZIP)** — seluruh peserta dikemas jadi satu file ZIP berisi PDF per orang (`JSZip` + `FileSaver`).
- **Export Rekapitulasi (CSV)** — satu baris per peserta, kolom: Nama, No. Asesmen, L/P, Tgl Lahir, Posisi, Pendidikan, raw Most D/I/S/C, Tipe Adaptif (`type1`), Tipe Alami (`type2`), Tipe Gabungan (`type3`), Tipe Utama (`mainDim`), status Validasi.

### G. Navigasi
- Ringkasan (tabel semua peserta dengan kolom Grafik 1/2/3 + status validasi) → klik baris untuk ke Detail.
- Di halaman Detail: tombol Sebelumnya/Berikutnya untuk berpindah antar peserta tanpa kembali ke ringkasan.

---

## 8. Format File Input (Teknis)

- Ekstensi: `.xlsx` atau `.xls`, sheet pertama dibaca (`wb.Sheets[wb.SheetNames[0]]`).
- Baris pertama = header. Deteksi kolom identitas via regex pencarian kata kunci (case-insensitive), tidak bergantung urutan kolom:
  - Nama: `/nama\s*(lengkap)?/`
  - Jenis kelamin: `/jenis\s*kelamin|gender|sex|l\/p/`
  - Tanggal lahir: `/tanggal\s*lahir|tgl\s*lahir|lahir|birth/`
  - Nomor asesmen: `/nomor\s*asesmen|no.*asesmen/`
  - Tanggal asesmen: `/tanggal\s*asesmen|tgl.*asesmen/`
  - Posisi: `/pekerjaan|posisi|jabatan/`
  - Pendidikan: `/pendidikan|education/`
- Kolom tanggal (lahir & asesmen) mendukung 2 format: objek `Date` Excel, atau serial number Excel (dikonversi dengan formula `(raw - 25569) * 86400 * 1000` epoch ms).
- Kolom soal dideteksi via regex `^\s*{nomor}\s*(\[|\.)` per nomor soal 1–24 — jadi header boleh berformat `"1 [teks]"` maupun `"1. teks"`.
- Nilai sel jawaban dibaca sebagai string, di-trim, di-uppercase; dicocokkan dengan `'P'` atau `'K'` persis.
- Baris kosong (semua sel `''`) dilewati (tidak dihitung sebagai peserta).

---

## Catatan & Riwayat Versi

Ada **dua dokumen spesifikasi historis** (`zlainnya/PROMPT_DISC_GENERATOR.md` — draft v1, dan `zlainnya/PROMPT_DISC_V2.md` — draft v2) yang berisi rancangan skoring **berbeda** dari yang akhirnya diimplementasikan di `disc.js`:

| Aspek | Draft v1/v2 (legacy) | Implementasi Aktual (`disc.js`) |
|---|---|---|
| Tabel lookup | 3 tabel terpisah per grafik (skala desimal, mis. Grafik1 raw 0 → D:-6.0), rentang raw 0–20 atau -22..22 | **1 tabel tunggal `TABEL`** dengan 12 kolom sekaligus (integer, skala -16..16), rentang key -22..22, plus mekanisme *nearest-neighbour + step-to-zero* untuk nilai kosong |
| Jumlah tipe di kamus | 40 tipe (termasuk Negotiator, Designer, Motivator, Inquirer, Mediator, Practitioner, Perfectionist, Confident & Determined, Reformer) | **22 tipe** — subset dari 40 tipe draft; tipe yang tidak ada memakai fallback 2-dimensi/1-dimensi |
| Sub Trait (High/Low pairing, mis. "Self Confidence", "Efficiency") | Direncanakan (Bagian 6 di `PROMPT_DISC_V2.md`) | **Tidak diimplementasikan** — tidak ada di `disc.js` |
| Job Matching (kuadran ideal jabatan + tabel probabilitas gap) | Direncanakan lengkap (Bagian 8 di `PROMPT_DISC_V2.md`, termasuk tabel toleransi gap 0–28 per gender) | **Tidak diimplementasikan** — tidak ada input Job Profile maupun kalkulasi kecocokan di kode saat ini |
| Potensi Stress (banding kombinasi Grafik I vs II) | Direncanakan | **Tidak diimplementasikan** sebagai field eksplisit (meski secara konsep bisa diturunkan manual dari `type1` vs `type2`) |
| Status khusus | Sama-sama ada Super Syndrome & Undershift | **Ditambah "Transisi"** (tidak ada di draft v1/v2) sebagai status ketiga |

**Kesimpulan:** dokumen ini (disc.md) mengikuti **kode yang benar-benar berjalan** sebagai kebenaran utama karena itulah yang dipakai untuk memproses peserta sungguhan saat ini. Fitur Sub Trait dan Job Matching dari draft lama **belum ada di produk** — bila suatu saat ingin dibangun, draft di `PROMPT_DISC_V2.md` Bagian 6 & 8 bisa dipakai sebagai starting point, tapi perlu dikalibrasi ulang karena tabel skalanya berbeda dari `TABEL` yang sekarang dipakai.

---

## Sumber Dokumen

- `src/pages/disc.js` — implementasi aktual (skoring, render, PDF, ekspor).
- `zlainnya/Format DISC.xlsx` — template Google Form asli, sumber 96 teks soal.
- `zlainnya/PROMPT_DISC_GENERATOR.md` — draft spesifikasi v1 (referensi historis, sebagian tidak terpakai).
- `zlainnya/PROMPT_DISC_V2.md` — draft spesifikasi v2 (referensi historis, sebagian tidak terpakai).
