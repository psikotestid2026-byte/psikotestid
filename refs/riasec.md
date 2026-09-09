# Holland RIASEC — Dokumentasi Lengkap Alat Tes

> Dokumen ini merangkum **persis apa yang berjalan di aplikasi** (`src/pages/riasec.js`), dicocokkan dengan dokumen spesifikasi (`zlainnya/PROMPT_Generator_Skoring_RIASEC.md`). Implementasi sangat konsisten dengan draft — perbedaan yang ada bersifat kecil (lihat [Catatan & Riwayat Versi](#catatan--riwayat-versi)).

---

## 1. Ringkasan Alat Tes

- **Nama:** Holland RIASEC Interest Test — mengukur minat karir berdasarkan **teori heksagon Holland**: **R**ealistic, **I**nvestigative, **A**rtistic, **S**ocial, **E**nterprising, **C**onventional.
- **Jumlah soal:** 108 pernyataan minat/kemampuan, masing-masing dijawab **Ya/Tidak** (bukan skala Likert).
- **Format respons:** dikotomis — setiap pernyataan dijawab **Ya** (sesuai dengan diri) atau **Tidak** (tidak sesuai).
- **Dimensi yang diukur:** 6 tipe minat (R, I, A, S, E, C), masing-masing terdiri dari **tepat 18 item** (18 × 6 = 108).
- **Output:** skor 6 tipe (0–18 tiap tipe), ranking tipe, kode minat 3 huruf (kombinasi 3 tipe tertinggi), tingkat konsistensi (Tinggi/Sedang/Rendah), narasi interpretasi, rekomendasi profesi, dan laporan PDF per peserta.
- **Sumber input:** Google Form → diekspor jadi file Excel/CSV → diupload ke halaman RIASEC di aplikasi.

---

## 2. Instruksi Pengerjaan

Instruksi yang seharusnya ditampilkan ke peserta (melalui Google Form, sebelum diproses aplikasi):

1. Terdapat 108 pernyataan tentang minat, kemampuan, dan preferensi aktivitas/pekerjaan.
2. Untuk setiap pernyataan, jawab **"Ya"** jika sesuai dengan diri Anda, atau **"Tidak"** jika tidak sesuai.
3. Jawablah berdasarkan minat/preferensi Anda yang sesungguhnya, bukan berdasarkan ekspektasi orang lain.
4. Tidak ada jawaban benar/salah — jawaban "Ya" yang lebih banyak pada suatu tipe menunjukkan minat yang lebih besar terhadap area tersebut.
5. Jawab seluruh 108 pernyataan; item yang kosong akan tetap dihitung dari yang tersedia (lihat Bagian 4.1), namun sebaiknya diisi lengkap.

**Instruksi ke Admin/HR (di halaman upload aplikasi):**
- Upload file Excel (`.xlsx`/`.xls`) atau CSV hasil export Google Form.
- Kolom identitas (Nama Lengkap, Jenis Kelamin, Tanggal Lahir, Pendidikan) dideteksi otomatis berdasarkan nama header.
- 108 kolom jawaban berisi teks "Ya" atau "Tidak" sesuai pilihan peserta.
- Kolom soal dideteksi berdasarkan header berlabel **"1."** hingga (secara implisit) **"108."**, atau melalui deteksi teks pernyataan pertama sebagai fallback.
- Setiap baris = satu peserta; semua diproses sekaligus.
- Tersedia tombol **"Unduh Template Excel"** yang menghasilkan header 108 kolom siap pakai.

---

## 3. Daftar Lengkap 108 Soal (Item Bank Resmi)

Sumber: `RIASEC_SOAL` di `src/pages/riasec.js` — identik dengan kunci di dokumen spesifikasi. Setiap tipe memiliki **tepat 18 item**.

| No | Tipe | Pernyataan |
|---|---|---|
| 1 | A | Senang menonton drama |
| 2 | S | Senang Melatih Orang |
| 3 | A | Mampu bermain dalam drama / berakting |
| 4 | I | Suka membaca mengenai topik-topik khusus atas keinginan sendiri |
| 5 | I | Mampu melakukan percobaan atau penelitian ilmiah |
| 6 | A | Artistik |
| 7 | I | Mampu memprogram komputer untuk mempelajari masalah ilmiah |
| 8 | R | Tertarik menjadi pengawas konstruksi bangunan |
| 9 | I | Suka dalam memecahkan soal eksak |
| 10 | C | Mampu melakukan dan menyukai tugas administratif |
| 11 | E | Bisa mempengaruhi dan membujuk orang lain |
| 12 | C | Prosedural (Mengikuti aturan) |
| 13 | C | Suka menggunakan aplikasi pencatatan keuangan |
| 14 | R | Suka memperbaiki motor |
| 15 | A | Bisa mengekspresikan diri secara kreatif |
| 16 | C | Ingin bekerja dibagian Staff keuangan |
| 17 | I | Mampu menyebutkan makanan yang memiliki protein tinggi |
| 18 | S | Suka melakukan pekerjaan social |
| 19 | E | Mampu mengetahui bagaimana menjadi pemimpin yang baik/ berhasil |
| 20 | R | Tidak suka menyatakan perasaan |
| 21 | E | Percaya diri |
| 22 | I | Suka menerapkan matematika dalam masalah praktis |
| 23 | A | Emosional |
| 24 | R | Menyukai memperbaiki peralatan mekanik |
| 25 | S | Mampu menghibur dan menemani orang yang lebih tua dari saya |
| 26 | E | Senang memulai proyek baru |
| 27 | I | Suka kegiatan akademis |
| 28 | S | Ramah |
| 29 | C | Efisien dan Terstruktur |
| 30 | R | Suka menggunakan perkakas bengkel dan mesin |
| 31 | S | Suka menjaga / mengurus mengawasi anak-anak |
| 32 | I | Senang menganalisa dan mengevaluasi |
| 33 | R | Senang melatih binatang |
| 34 | A | Tertarik menjadi aktor/ aktris |
| 35 | A | Mampu memainkan alat musik |
| 36 | S | Tertarik menjadi konselor masalah pribadi |
| 37 | A | Ingin menjadi pemain dalam kelompok musik |
| 38 | I | Tertarik menjadi ahli biologi/ hayati |
| 39 | S | Tertarik menjadi pekerja sosial |
| 40 | E | Energetik |
| 41 | S | Suka bekerja dalam kelompok |
| 42 | I | Suka membaca buku/ majalah ilmiah |
| 43 | R | Suka mengutak-atik mesin/alat elektronik |
| 44 | R | Suka kegiatan di luar ruangan |
| 45 | A | Senang memotret atau videographer |
| 46 | A | Suka membuat lukisan/ foto orang |
| 47 | A | Senang bekerja di situasi yang bebas |
| 48 | C | Membuat Hari Saya Terstruktur |
| 49 | S | Mampu menarik perhatian orang untuk menceritakan masalah mereka |
| 50 | C | Memperhatikan Detailnya |
| 51 | C | Sering diminta mengumpulkan data |
| 52 | A | Suka membuat sketsa, Mendesign atau melukis |
| 53 | S | Mampu mengajar orang dewasa dengan mudah |
| 54 | S | Antusias berparisipasi dalam pencarian dana/ amal |
| 55 | S | Mampu mudah berbicara dengan semua orang |
| 56 | I | Suka mempelajari teori ilmiah |
| 57 | I | Tertarik menjadi pekerja riset ilmiah |
| 58 | E | Mampu mengatur pekerjaan orang lain |
| 59 | R | Bisa menguasai diri |
| 60 | E | Mampu membuat kelompok sosial/ kerja berjalan dengan baik |
| 61 | R | Tertarik menjadi insinyur otomotif |
| 62 | C | Suka membuat catatan pengeluaran yang terperinci |
| 63 | I | Kompleks |
| 64 | E | Mampu mengelola usaha kecil |
| 65 | A | Rumit |
| 66 | R | Tertarik menjadi spesialis perikanan/ margasatwa |
| 67 | E | Suka memimpin kelompok dalam meraih tujuan tertentu |
| 68 | E | Suka menjual suatu barang |
| 69 | E | Tegas |
| 70 | C | Mampu mencatat dengan cermat pembayaran/ penjualan |
| 71 | I | Suka mengerjakan proyek ilmiah |
| 72 | S | Bisa menyatakan perasaan dengan jelas |
| 73 | R | Menyusun Sesuatu Atau Merakit Model |
| 74 | I | Senang mengamati |
| 75 | E | Mampu memengaruhi orang lain supaya melakukan sesuatu dengan caranya |
| 76 | A | Senang mengerjakan kerajinan tangan |
| 77 | R | Suka bekerja menggunakan tangan |
| 78 | S | Suka membantu orang lain dengan masalah pribadinya |
| 79 | R | Senang kegiatan fisik |
| 80 | I | Tertarik menjadi ahli teknisi laboratorium medis |
| 81 | A | Ingin menjadi seniman |
| 82 | R | Mampu melakukan perbaikan kecil pada pipa air, kran, dan lain-lain |
| 83 | R | Mampu membuat gambar dengan skala |
| 84 | C | Prosedural (Suka mengikuti aturan) |
| 85 | C | Suka mengarsip surat dan berkas-berkas lain |
| 86 | E | Mampu menjadi seorang pembicara di depan umum yang baik |
| 87 | S | Mampu memimpin diskusi kelompok |
| 88 | C | Suka melakukan pekerjaan surat menyurat/ masalah perkantoran |
| 89 | E | Senang bertemu orang baru |
| 90 | C | Bisa bekerja dengan baik dalam system /aturan |
| 91 | A | Suka merancang perabotan, pakaian atau poster |
| 92 | E | Tertarik menjadi pembawa acara / MC |
| 93 | I | Tertarik menjadi ilmuwan peneliti |
| 94 | R | Suka memperbaiki alat-alat listrik |
| 95 | E | Terbuka |
| 96 | C | Tertarik menjadi penaksir biaya |
| 97 | S | Suka mendamaikan orang |
| 98 | I | Suka mengerjakan teka-teki |
| 99 | S | Mampu mengajar anak-anak dengan mudah |
| 100 | C | Suka membuat daftar inventaris dari persediaan/ produk |
| 101 | R | Suka olahraga |
| 102 | A | Bisa menulis karya sastra |
| 103 | S | Tertarik menjadi konselor kejuruan dan pekerjaan |
| 104 | A | Sensitif |
| 105 | E | Senang petualangan / mengambil resiko |
| 106 | E | Ambisius dan cenderung berbicara apa adanya (Spontan) |
| 107 | C | Penurut |
| 108 | C | Suka menyusun sistem pengarsipan |

---

## 4. Sistem Skoring — Tahap demi Tahap

Implementasi persis: fungsi `scoreRiasec()` pada `src/pages/riasec.js`.

### 4.1 Tahap 1 — Normalisasi & Penilaian Jawaban per Item

Untuk tiap satu dari 108 jawaban, nilai sel dikonversi melalui pencocokan bertingkat:

1. **Normalisasi:** lowercase + trim.
2. **Dianggap "Ya"** (skor +1 ke dimensi item tersebut) jika nilai persis: `"ya"`, `"y"`, `"1"`, atau `"true"`.
3. **Dianggap "Tidak"** (tidak menyumbang skor, tapi tercatat sebagai terjawab) jika nilai persis: `"tidak"`, `"n"`, `"0"`, `"false"`, atau `"x"`.
4. **Dianggap kosong** jika nilai adalah string kosong `""` → dicatat sebagai `unanswered`.
5. **Fallback prefix-matching** untuk nilai lain yang tidak cocok di atas: jika diawali `"ya"` (case-insensitive) → dianggap Ya; jika diawali `"ti"` → dianggap Tidak; selain itu → dianggap `unanswered`.

Hasil akhir tahap ini: `scores = {R, I, A, S, E, C}` (masing-masing 0–18), plus `totalYa` dan `unanswered` (jumlah item yang gagal dikenali/kosong).

### 4.2 Tahap 2 — Ranking 6 Tipe

Keenam tipe diurutkan dari skor tertinggi ke terendah. **Aturan tie-break** (jika skor sama persis): tipe dengan urutan lebih awal pada `TYPE_ORDER = ['R','I','A','S','E','C']` ditempatkan lebih dulu — artinya prioritas tie-break tetap **R > I > A > S > E > C**, bukan ditandai sebagai "seri" secara eksplisit ke pengguna.

### 4.3 Tahap 3 — Kode Minat (3 Huruf)

```
top3 = 3 tipe dengan skor tertinggi (hasil ranking Tahap 2)
kodeMinat = gabungan kode top3, contoh: "RIA", "SEC", "AES"
```

### 4.4 Tahap 4 — Pengecekan Konsistensi

Konsistensi dihitung dari **pasangan 2 tipe teratas** (`top3[0] + top3[1]`), dicocokkan ke tabel heksagon Holland klasik. Jika pasangan dalam urutan tersebut tidak ditemukan, dicoba urutan terbalik.

**Tabel Konsistensi (`CONSISTENCY_MAP`):**

| Kategori | Pasangan (posisi berdekatan di heksagon) |
|---|---|
| **Tinggi** | RI, RC, IR, IA, AI, AS, SA, SE, ES, CE, EC, CR |
| **Sedang** | RA, RE, IS, IC, AR, AE, SI, SC, EA, ER, CS, CI |
| **Rendah** | RS, IE, AC, SR, EI, CA |

Jika kedua arah pasangan tidak ditemukan di tabel manapun (praktiknya tidak akan terjadi karena tabel mencakup semua 30 kombinasi 2-dari-6 tanpa pengulangan huruf sama) → hasil `"Tidak Diketahui"`.

> **Logika di balik tabel:** ini merepresentasikan **model heksagon RIASEC** — tipe yang bersebelahan di heksagon (R-I, I-A, A-S, S-E, E-C, C-R) punya konsistensi Tinggi; yang berjarak satu (R-A, I-S, dst) Sedang; yang berseberangan/berlawanan (R-S, I-E, A-C) Rendah, karena secara teori minat kedua tipe tersebut cenderung bertentangan secara psikologis.

### 4.5 Field Tambahan yang Disimpan

- `totalYa` — jumlah total jawaban "Ya" dari seluruh 108 item (bukan per tipe).
- `unanswered` — jumlah item yang tidak berhasil dikenali sebagai Ya/Tidak.
- **Tidak ada validasi/badge peringatan eksplisit** di ringkasan atau detail (berbeda dari DISC/PAPI/MSDT yang menampilkan badge "⚠️ data tidak lengkap") — nilai `unanswered` dihitung dan diekspor ke CSV, tapi tidak memengaruhi tampilan visual apapun di summary/detail view.

---

## 5. Kamus 6 Tipe RIASEC

Sumber: `TYPE_DETAILS` di `riasec.js`.

### R — Realistic (warna `#f97316`)
Profil ini menyukai pekerjaan yang mencakup masalah dan jawaban praktis dan langsung. Menyukai kegiatan yang melibatkan keterampilan motorik, peralatan, mesin. Seringkali orang dengan minat Realistis tidak menyukai karier yang melibatkan dokumen atau bekerja sama dengan orang lain secara intensif.
**Contoh profesi:** Mekanik, Insinyur, Pengawas Bangunan, Petani/Peternak Modern, Atlet, Operator, Polisi, Pemadam Kebakaran, Koki.

### I — Investigative (warna `#3b82f6`)
Profil ini menyukai pekerjaan yang berkaitan dengan ide dan pemikiran. Memilih kegiatan penyelidikan yang observasional, simbolis, sistematis dan kreatif atas fenomena fisik, biologis dan kultural. Berprestasi terutama di bidang akademik dan ilmiah, serta biasanya kurang menyukai aktivitas fisik atau memimpin orang.
**Contoh profesi:** Ahli antropologi, astronomi, biologi, botani, kimia, editor penerbitan ilmiah, geologi, pekerjaan penelitian.

### A — Artistic (warna `#ec4899`)
Profil ini menyukai pekerjaan dan aktivitas yang bebas, tidak sistematis. Ambisius dalam usahanya memanipulasi material fisik, verbal dan humanistik untuk menciptakan bentuk atau produk seni. Memiliki kompetensi artistik, bahasa, musik, drama, mengarang.
**Contoh profesi:** Desainer, Penulis, Musisi, Arsitek, Wartawan, Penari, Translator, Artis.

### S — Social (warna `#22c55e`)
Profil ini menyukai aktivitas yang melibatkan berelasi, berkomunikasi dan mengajar orang. Dilambangkan dengan keterampilan sosial dan kebutuhan untuk interaksi sosial. Pekerjaannya sering melibatkan membantu atau memberikan layanan kepada orang lain.
**Contoh profesi:** Guru, Terapis, Tour Guide, Perawat, Hakim, Konselor, Psikolog, Sejarawan, Pekerja Sosial.

### E — Enterprising (warna `#eab308`)
Profil ini menghasilkan preferensi yang mendorong individu menikmati memanipulasi kegiatan orang lain dalam usahanya mencapai tujuan organisasi atau keuntungan ekonomi. Memiliki kompetensi kepemimpinan, persuasif, dan kemampuan verbal.
**Contoh profesi:** Pengacara, Politikus, Pegawai Humas, Manajer Penjualan, Staf Penjualan, Perwakilan Dagang.

### C — Conventional (warna `#8b5cf6`)
Profil ini menghasilkan preferensi yang membawa individu untuk menyenangi aktivitas yang teratur dan sistematis seperti mengarsipkan sesuatu, mereproduksi material, mencatat data, mengolah data. Menyukai pekerjaan yang mengikuti prosedur dan rutinitas yang ditetapkan.
**Contoh profesi:** Akuntan, Aktuaris, Ahli Statistik, Analis Keuangan, Operator Komputer, Pustakawan, Programer Bisnis, Pengarsip.

---

## 6. Kamus Profesi Kombinasi 2 Tipe (29 Kombinasi)

Diambil dari pasangan **tipe 1 + tipe 2** teratas (`top3[0] + top3[1]`). Sumber: `PROFESI_KOMBINASI` di `riasec.js`. Jika kombinasi persis tidak ditemukan, dicoba urutan terbalik.

| Kode | Contoh Profesi |
|---|---|
| **RI** | Network Engineer, Mechanical Engineer, Automotive Engineer, Electronic Engineer, Pilot, Laboratory Technician |
| **RC** | Lorry Driver, Machine Operator, Security Guard, Plumber, Warehouse Operative, Service Technician |
| **RA** | Photographer, Tailor, Artist, Pastry Chef, Furniture Designer |
| **RE** | Koki, Engineering Manager, Police Officer, Process Operator, Taxi Driver |
| **RS** | Asisten Perawatan, Fire Fighter, Masseur, Sports Coach, Veterinary Assistant |
| **IR** | Aerospace Engineer, Biomedical Engineer, Biologist, Electrical Engineer, Veterinarian |
| **IA** | Architect, Technical Writer, Animator, Desktop Publisher |
| **IS** | Dokter, Physics Teacher, Nurse, Physiotherapist, Coach |
| **IC** | Software Developer, UX Designer, Paralegal, Data Analyst, Quality Controller |
| **IE** | Consultant, Detektif, Market Researcher, Business Controller, Online Marketer |
| **AI** | Architect, Poet, Special Effects Artist, Animator |
| **AS** | Guru, Translator, Nanny, Career Advisor, Interpreter |
| **AE** | Design Interior, Illustrator, Entrepreneur, Journalist, Producer, Art Director, Copywriter |
| **AR** | Camera Operator, Furniture Finisher, Museum Technician, Sound Engineering Technician |
| **AC** | Graphic Designer, Proofreader, Web/Mobile Design, UI Designer, Visual Designer |
| **SA** | Interpreter, Translator, Choreographer |
| **SE** | HR Manager, Account Manager, Customer Service Advisor, Waiter/Waitress |
| **SI** | Dokter, Audiologist, Dietitian, Epidemiologist, School Psychologist |
| **SC** | Librarian, Telephone Operator, Medical Assistant, Teaching Assistant |
| **SR** | Asisten Perawatan, Fire Fighter, Sports Coach |
| **EA** | Talent Director, Advertising Manager, Producer, Public Relations Specialist |
| **EC** | General Manager, Air Traffic Controller, Branch Manager, Fundraiser, Recruiter |
| **ES** | HR Manager, Social and Community Service Manager, Training and Development Manager |
| **ER** | Koki, Engineering Manager, Police Officer |
| **EI** | Lawyer, Natural Sciences Manager |
| **CE** | Bill Collector, Bookkeeper, Cost Estimator, Cashier, Legal Secretary, Tax Examiner |
| **CS** | Medical Secretary, Library Technician, Social and Human Service Assistant |
| **CR** | Postal Clerk, Pharmacy Technician, Medical Transcriptionist, Meter Reader |
| **CI** | Archivist, Database Administrator, Statistician, Clinical Data Manager |
| **CA** | Proofreader, Copy Marker |

> Draft spesifikasi juga memberi nama tematik untuk tiap kombinasi (mis. RI = "Profil fisik-analitis", IC = "Profil analitis-terstruktur") — nama tematik ini **tidak ada** di kode aktual, hanya daftar profesi yang diimplementasikan.

---

## 7. Struktur & Konten Laporan (Detail View / PDF)

Laporan per peserta tersusun sebagai berikut, sesuai `renderDetailView()` dan `riasecGeneratePDFHTML()`:

### A. Header Identitas (Hero Section)
- Nama Lengkap
- Jenis Kelamin
- Tanggal Lahir
- Pendidikan
- **Kode Minat** (3 huruf) ditampilkan besar di kanan atas, disertai badge **Konsistensi** (Tinggi=hijau, Sedang=kuning, Rendah=merah).

### B. Kartu Ranking 6 Tipe
6 kartu berjajar menampilkan urutan lengkap dari tipe ke-1 (tertinggi) sampai ke-6 (terendah), masing-masing dengan kode, nama tipe, dan skor `x/18`. 3 kartu teratas diberi border warna sesuai tipe.

### C. Profil Skor (Bar Chart 6 Tipe)
Bar horizontal untuk keenam tipe (urutan tetap R, I, A, S, E, C — bukan urutan ranking), masing-masing menampilkan:
- Kode + nama tipe
- Badge **"Top {n}"** jika termasuk 3 tipe teratas
- Skor `x/18`
- Bar proporsional (lebar = skor/18 × 100%), berwarna sesuai tipe untuk 3 teratas, abu-abu untuk sisanya

### D. Interpretasi 3 Tipe Dominan
Untuk masing-masing dari 3 tipe teratas (urutan 1, 2, 3), kartu berisi: nama tipe, deskripsi lengkap dari kamus Bagian 5, dan daftar contoh profesi tunggal tipe tersebut.

### E. Contoh Profesi Kombinasi (2 Tipe Teratas)
Kartu terpisah menampilkan daftar profesi kombinasi berdasarkan `top3[0]+top3[1]` dari kamus Bagian 6.

### F. Footer Laporan (khusus versi PDF)
- Judul dokumen: **"Laporan Holland RIASEC"**
- Disclaimer kerahasiaan (pola sama seperti tes lain) — *catatan: berbeda dari DISC/PAPI/BigFive/MSDT, versi PDF RIASEC tidak menyertakan blok promosi kontak "Coach Alifya" maupun baris disclaimer penutup terpisah; PDF berakhir langsung setelah blok profesi kombinasi.*

### G. Fitur Unduh & Ekspor
- **Unduh PDF** per peserta (`html2pdf`, format A4 potrait).
- **Unduh Semua (ZIP)** — seluruh peserta dikemas jadi satu file ZIP berisi PDF per orang.
- **Export Rekapitulasi (CSV)** — satu baris per peserta, kolom: Nama, Jenis Kelamin, Tgl Lahir, Pendidikan, skor 6 tipe (R,I,A,S,E,C), Kode Minat, Konsistensi, Jawaban Ya (total), Item Kosong.

### H. Navigasi
- Ringkasan (tabel semua peserta: No, Nama, L/P, skor 6 tipe, Kode Minat, Konsistensi, tombol Detail) → klik baris untuk ke Detail.
- Di halaman Detail: tombol Sebelumnya/Berikutnya untuk berpindah antar peserta.

---

## 8. Format File Input (Teknis)

- Ekstensi: `.xlsx`, `.xls`, atau `.csv`, sheet/baris pertama sebagai header.
- Deteksi kolom awal soal: dicari header yang cocok persis pola `/^\s*1\s*\.?\s*$/` (misal "1" atau "1."). Jika gagal, fallback ke deteksi teks pernyataan soal pertama (`/senang menonton|senang melatih|mampu bermain/i`) — mengantisipasi template dengan header berupa teks pernyataan lengkap alih-alih nomor.
- Deteksi kolom identitas: Nama `/nama\s*(lengkap)?/i`, Jenis kelamin `/kelamin|gender|sex|l\/p/i`, Tanggal lahir `/tanggal\s*lahir|tgl\s*lahir|lahir|birth/i`, Pendidikan `/pendidikan|education/i`.
- **Fallback nama:** sel pertama berisi teks di antara kolom sebelum blok 108 soal (kecuali index 0/Timestamp); default `"Kandidat {nomor baris}"`.
- Tanggal lahir mendukung `Date` Excel, serial number Excel, atau string apa adanya.
- Baris kosong dilewati.

---

## Catatan & Riwayat Versi

Dibandingkan dengan `zlainnya/PROMPT_Generator_Skoring_RIASEC.md`, implementasi aktual **sangat konsisten** — 108 item, pemetaan tipe, tabel konsistensi heksagon, dan daftar profesi kombinasi **identik persis**. Perbedaan yang ditemukan:

| Aspek | Draft (`PROMPT_Generator_Skoring_RIASEC.md`) | Implementasi Aktual (`riasec.js`) |
|---|---|---|
| Penanganan skor seri (tie) | "Jika 2 tipe memiliki skor sama dan keduanya berada di posisi 1-3, cantumkan keduanya dan tambahkan catatan bahwa terdapat skor seri" | **Tidak ada catatan/flag seri** yang ditampilkan — sistem diam-diam menerapkan tie-break tetap sesuai urutan `R > I > A > S > E > C` tanpa memberi tahu pengguna bahwa skor sebenarnya seri |
| Peringatan data tidak lengkap | "Jika ada item yang tidak terjawab, tandai peserta sebagai 'DATA TIDAK LENGKAP'" | Nilai `unanswered` dihitung dan tersedia di data serta diekspor ke CSV, **tapi tidak ada badge/alert visual apapun** di ringkasan maupun detail (berbeda dari DISC/PAPI/MSDT yang eksplisit menampilkan peringatan validasi) |
| Nama tematik kombinasi 2 tipe | Setiap kombinasi punya judul (mis. "Profil fisik-analitis" untuk RI) | **Tidak diimplementasikan** — hanya daftar profesi tanpa judul tematik |
| Rekomendasi profesi kombinasi 3 tipe | Disebutkan sebagai bagian laporan terpisah: "Berdasarkan kombinasi [Kode 3 huruf]: [daftar profesi], hanya valid jika konsistensi Tinggi/Sedang" | **Kode mati (dead code):** variabel `profesi3` dihitung di `renderDetailView()` (baris ~397-399) tapi **tidak pernah dirender** ke HTML manapun — tidak muncul di layar maupun PDF. Fitur ini secara efektif tidak berjalan meski logikanya sudah ditulis |
| Progress bar untuk batch >50 peserta | Disebutkan sebagai fitur yang diinginkan | **Tidak diimplementasikan** — tidak ada indikator progres pemrosesan |
| Blok promosi & disclaimer PDF | Tidak dibahas eksplisit di draft | Berbeda dari 4 tes lain (DISC, PAPI, Big Five, MSDT) yang seluruhnya punya blok "Punya alat ukur sendiri..." + disclaimer kerahasiaan di akhir PDF, **PDF RIASEC tidak menyertakan blok-blok ini** — kemungkinan terlewat saat implementasi dibanding tes lain yang lebih baru |

**Kesimpulan:** Logika skoring inti (paling penting: pemetaan item, ranking, kode minat, konsistensi heksagon) sudah benar dan sesuai spesifikasi. Yang perlu diperhatikan adalah beberapa **fitur pelaporan yang disebutkan di draft tapi tidak sampai ke pengguna**: flag skor seri, badge data tidak lengkap, dan kode profesi kombinasi 3-tipe yang sudah dihitung tapi tidak pernah ditampilkan (dead code) — serta absennya blok promosi/disclaimer di PDF yang konsisten ada di keempat tes lainnya.

---

## Sumber Dokumen

- `src/pages/riasec.js` — implementasi aktual (skoring, render, PDF, ekspor).
- `zlainnya/PROMPT_Generator_Skoring_RIASEC.md` — draft spesifikasi (kunci 108 item, tabel konsistensi, kamus profesi — konsisten dengan kode aktual pada bagian skoring inti).
