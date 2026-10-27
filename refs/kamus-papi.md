# PAPI Kostick — Dokumentasi Lengkap Alat Tes

> Dokumen ini merangkum **persis apa yang berjalan di aplikasi** (`src/pages/papikostik.js`), dicocokkan dengan dokumen spesifikasi historis (`zlainnya/PROMPT_PAPI_GENERATOR.md`). Berbeda dari DISC, implementasi PAPI Kostick **sangat konsisten** dengan draft aslinya — hampir tidak ada penyimpangan berarti, kecuali sedikit perbedaan ambang kategori dan cara pencocokan jawaban. Semua perbedaan dicatat di [Catatan & Riwayat Versi](#catatan--riwayat-versi).

---

## 1. Ringkasan Alat Tes

- **Nama:** PAPI Kostick (**P**ersonality **a**nd **P**reference **I**nventory).
- **Jumlah soal:** 90 soal, masing-masing berisi **2 pernyataan** (A dan B).
- **Format respons:** *forced-choice ipsatif berpasangan* — pada tiap soal peserta **harus memilih salah satu** dari 2 pernyataan yang **paling menggambarkan dirinya**. Tidak ada opsi "keduanya" atau "tidak keduanya".
- **Dimensi yang diukur:** 20 aspek kepribadian kerja (kode 1 huruf: N, G, A, L, P, I, T, V, X, S, B, O, R, D, C, Z, E, K, F, W).
- **Total tanda per peserta:** 90 pilihan (1 per soal), yang terdistribusi ke 20 aspek — total skor gabungan semua aspek harus = 90.
- **Output:** profil 20-aspek dengan kategori Low/Middle/High, narasi interpretasi per aspek dominan/rendah, ringkasan kepribadian terintegrasi, dan laporan PDF per peserta.
- **Sumber input:** Google Form → diekspor jadi file Excel/CSV → diupload ke halaman PAPI Kostick di aplikasi.

---

## 2. Instruksi Pengerjaan

Instruksi yang seharusnya ditampilkan ke peserta (melalui Google Form, sebelum diproses aplikasi):

1. Terdapat 90 nomor. Setiap nomor berisi **2 pernyataan** (Pernyataan A dan Pernyataan B).
2. Dari 2 pernyataan tersebut, pilih **satu (1)** yang **paling menggambarkan/sesuai dengan diri Anda**.
3. Tidak ada jawaban benar atau salah — pilih berdasarkan kecenderungan alami Anda, bukan berdasarkan apa yang "seharusnya" ideal.
4. Kerjakan seluruh 90 nomor tanpa ada yang terlewat — sistem memvalidasi bahwa total jawaban harus tepat 90.
5. Jawablah secara spontan; jangan terlalu lama menimbang tiap pasangan pernyataan.

**Instruksi ke Admin/HR (di halaman upload aplikasi):**
- Upload file Excel (`.xlsx`/`.xls`) atau CSV hasil export Google Form.
- Kolom identitas (Nama Lengkap, Jenis Kelamin, Tanggal Lahir) dideteksi otomatis berdasarkan nama header (tidak harus di posisi tetap).
- Kolom soal harus berlabel **"1."** sampai **"90."** (sesuai format template resmi aplikasi).
- Isi tiap sel kolom soal adalah **teks lengkap pernyataan yang dipilih peserta** (bukan huruf "A"/"B") — ini karena Google Form biasanya merekam teks pilihan radio-button apa adanya. Sistem menggunakan pencocokan bertingkat (lihat Bagian 4.2) untuk tetap dapat mencocokkan meski ada variasi kecil ejaan/kapitalisasi.
- Baris pertama yang mengandung kata "nama" atau pola header soal "1" dianggap baris header (pencarian dilakukan pada 20 baris pertama file, mengantisipasi baris judul/section tambahan di atas header asli).
- Setiap baris di bawah header = satu peserta. Sistem memproses semua baris sekaligus (multi-peserta dalam satu file).
- Tersedia tombol **"Unduh Template Excel"** yang menghasilkan header 90 kolom siap pakai (meskipun nilai contoh di template memakai literal "A"/"B" — lihat catatan di Bagian 8).

---

## 3. Daftar Lengkap 90 Soal (Item Bank Resmi)

Sumber: `PAPI_SOAL` di `src/pages/papikostik.js` — identik dengan kunci jawaban di `PROMPT_PAPI_GENERATOR.md`.

Kolom **Aspek A** = kode aspek yang mendapat +1 skor jika peserta memilih Pernyataan A.
Kolom **Aspek B** = kode aspek yang mendapat +1 skor jika peserta memilih Pernyataan B.

| No | Pernyataan A | Aspek A | Pernyataan B | Aspek B |
|---|---|---|---|---|
| 1 | Saya seorang pekerja keras | **G** | Saya tidak suka uring-uringan | **E** |
| 2 | Saya suka menghasilkan pekerjaan yang lebih baik daripada orang lain | **A** | Saya akan tetap menangani suatu pekerjaan sampai selesai | **N** |
| 3 | Saya suka menunjukkan pada orang lain cara melakukan sesuatu | **P** | Saya ingin berusaha sebaik mungkin | **A** |
| 4 | Saya suka melucu | **X** | Saya senang memberitahu orang lain hal-hal yang harus dikerjakan | **P** |
| 5 | Saya suka bergabung dengan kelompok | **B** | Saya senang diperhatikan oleh kelompok | **X** |
| 6 | Saya suka menjalin hubungan pribadi yang akrab | **O** | Saya suka berteman dengan kelompok | **B** |
| 7 | Saya dapat cepat berubah jika merasa perlu | **Z** | Saya berusaha menjalin hubungan pribadi yang akrab | **O** |
| 8 | Saya suka menyerang kembali jika benar-benar disakiti | **K** | Saya suka melakukan hal-hal yang baru dan berbeda | **Z** |
| 9 | Saya ingin agar atasan menyukai saya | **F** | Saya suka menegur orang lain jika mereka melakukan kesalahan | **K** |
| 10 | Saya suka mengikuti petunjuk-petunjuk yang diberikan pada saya | **W** | Saya suka menyenangkan orang-orang yang menjadi atasan saya | **F** |
| 11 | Saya berusaha keras sekali | **G** | Saya seorang yang teratur. Saya meletakkan segala sesuatu pada tempatnya | **C** |
| 12 | Saya dapat membuat orang lain melakukan apa yang saya inginkan | **L** | Saya tidak mudah marah | **E** |
| 13 | Saya suka memberitahu kelompok, hal-hal yang harus mereka kerjakan | **P** | Saya selalu bertahan pada suatu pekerjaan sampai selesai | **N** |
| 14 | Saya ingin menjadi orang yang penuh gairah dan menarik | **X** | Saya ingin menjadi orang yang sangat berhasil | **A** |
| 15 | Saya ingin menjadi bagian dalam kelompok | **B** | Saya suka membantu orang lain mengambil keputusan | **P** |
| 16 | Saya cemas bila seseorang tidak menyukai saya | **O** | Saya ingin agar orang lain memperhatikan saya | **X** |
| 17 | Saya suka mencoba hal-hal baru | **Z** | Saya lebih suka bekerja bersama orang lain daripada sendiri | **B** |
| 18 | Kadang-kadang saya menyalahkan orang lain jika ada yang tidak beres | **K** | Saya merasa terganggu jika seseorang tidak menyukai saya | **O** |
| 19 | Saya suka menyenangkan orang yang menjadi atasan saya | **F** | Saya senang mencoba pekerjaan yang baru dan berbeda | **Z** |
| 20 | Saya menyukai petunjuk-petunjuk terperinci untuk melaksanakan tugas | **W** | Saya suka memberitahu orang lain apabila mereka menjengkelkan | **K** |
| 21 | Saya selalu berusaha keras | **G** | Saya selalu melaksanakan setiap langkah dengan sangat hati-hati | **D** |
| 22 | Saya seorang pemimpin yang baik | **L** | Saya menata pekerjaan dengan baik | **C** |
| 23 | Saya mudah marah | **I** | Saya lambat dalam membuat keputusan | **E** |
| 24 | Saya suka mengerjakan beberapa tugas pada saat yang bersamaan | **X** | Bila berada dalam satu kelompok, saya suka berdiam diri | **N** |
| 25 | Saya senang sekali bila diundang | **B** | Saya ingin melakukan sesuatu lebih baik dari pada orang lain | **A** |
| 26 | Saya suka menjalin hubungan pribadi yang akrab | **O** | Saya suka memberi nasihat pada orang lain | **P** |
| 27 | Saya suka melakukan hal-hal yang baru dan berbeda | **Z** | Saya suka menceritakan bagaimana saya berhasil dalam melakukan sesuatu | **X** |
| 28 | Apabila pendapat saya benar, saya suka mempertahankannya | **K** | Saya ingin menjadi bagian dari suatu kelompok | **B** |
| 29 | Saya tidak mau berbeda dari orang lain | **F** | Saya berusaha akrab dengan orang lain | **O** |
| 30 | Saya senang diberitahu bagaimana melakukan suatu pekerjaan | **W** | Saya mudah bosan | **Z** |
| 31 | Saya bekerja keras | **G** | Saya banyak berpikir dan membuat rencana | **R** |
| 32 | Saya memimpin kelompok | **L** | Detail (hal-hal kecil) menarik buat saya | **D** |
| 33 | Saya membuat keputusan dengan mudah dan cepat | **I** | Saya menyimpan barang-barang secara rapi dan teratur | **C** |
| 34 | Saya membuat keputusan dengan mudah dan cepat | **T** | Saya jarang marah atau sedih | **E** |
| 35 | Saya ingin menjadi bagian dalam kelompok | **B** | Saya ingin melakukan hanya satu pekerjaan pada satu waktu | **N** |
| 36 | Saya berusaha berteman secara akrab | **O** | Saya berusaha sangat keras untuk menjadi yang terbaik | **A** |
| 37 | Saya suka gaya terbaru dalam hal pakaian dan mobil | **Z** | Saya suka bertanggung jawab atas orang lain | **P** |
| 38 | Saya senang berdebat | **K** | Saya suka mendapat perhatian | **X** |
| 39 | Saya suka menyenangkan orang yang menjadi atasan saya | **F** | Saya tertarik untuk menjadi bagian dari kelompok | **B** |
| 40 | Saya suka mengikuti peraturan dengan hati-hati | **W** | Saya suka orang lain mengenal saya dengan baik | **O** |
| 41 | Saya berusaha keras sekali | **G** | Saya sangat ramah | **S** |
| 42 | Orang lain berpendapat bahwa saya pemimpin yang baik | **L** | Saya berpikir hati-hati dan lama | **R** |
| 43 | Saya sering memanfaatkan kesempatan | **I** | Saya suka cerewet mengenai hal-hal yang kecil | **D** |
| 44 | Orang lain berpendapat bahwa saya bekerja cepat | **T** | Orang lain berpendapat bahwa saya menyimpan segala sesuatu secara teratur dan rapi | **C** |
| 45 | Saya menyukai permainan dan olahraga | **V** | Saya sangat menyenangkan | **E** |
| 46 | Saya senang bila orang lain bersikap akrab dan ramah | **O** | Saya selalu berusaha menyelesaikan sesuatu yang telah saya mulai | **N** |
| 47 | Saya suka bereksperimen dan mencoba hal-hal baru | **Z** | Saya suka melaksanakan pekerjaan yang sulit dengan baik | **A** |
| 48 | Saya suka diperlakukan secara adil | **K** | Saya suka memberitahu orang lain cara mengerjakan sesuatu | **P** |
| 49 | Saya suka melakukan hal-hal yang diharapkan dari saya | **F** | Saya suka mendapat perhatian | **X** |
| 50 | Saya suka petunjuk-petunjuk terperinci untuk melaksanakan suatu tugas | **W** | Saya senang berada bersama orang lain | **B** |
| 51 | Saya selalu berusaha melakukan pekerjaan secara sempurna | **G** | Orang mengatakan bahwa saya hampir tidak pernah lelah | **V** |
| 52 | Saya tipe seorang pemimpin | **L** | Saya mudah berteman | **S** |
| 53 | Saya memanfaatkan kesempatan | **I** | Saya banyak sekali berpikir | **R** |
| 54 | Saya bekerja dengan tempo yang cepat dan mantap | **T** | Saya senang menangani pekerjaan detail | **D** |
| 55 | Saya memiliki banyak tenaga untuk permainan dan olahraga | **V** | Saya menyimpan segala sesuatu secara rapi dan teratur | **C** |
| 56 | Saya bergaul dengan semua orang | **S** | Saya berwatak tenang | **E** |
| 57 | Saya ingin bertemu orang-orang baru dan melakukan hal-hal baru | **Z** | Saya selalu ingin menyelesaikan pekerjaan yang telah saya mulai | **N** |
| 58 | Saya biasanya suka mempertahankan keyakinan saya | **K** | Saya biasanya suka bekerja keras | **A** |
| 59 | Saya menyukai saran-saran dari orang-orang yang saya kagumi | **F** | Saya suka bertanggung jawab terhadap orang lain | **P** |
| 60 | Saya membiarkan orang lain memengaruhi diri saya secara kuat | **W** | Saya suka mendapat banyak perhatian | **X** |
| 61 | Saya biasanya bekerja keras sekali | **G** | Saya biasanya bekerja cepat | **T** |
| 62 | Apabila saya berbicara, kelompok menyimak | **L** | Saya terampil menggunakan peralatan | **V** |
| 63 | Saya lambat dalam berteman | **I** | Saya lambat dalam mengambil keputusan | **S** |
| 64 | Saya biasa makan dengan cepat | **T** | Saya senang membaca | **R** |
| 65 | Saya menyukai pekerjaan yang membuat saya banyak bergerak | **V** | Saya menyukai pekerjaan yang harus saya kerjakan secara hati-hati | **D** |
| 66 | Saya berteman dengan sebanyak mungkin orang | **S** | Saya dapat menemukan sesuatu yang telah saya sisihkan | **C** |
| 67 | Saya merencanakan jauh dimuka | **R** | Saya selalu menyenangkan | **E** |
| 68 | Saya sangat bangga akan nama baik saya | **K** | Saya tetap menangani suatu permasalahan sampai terpecahkan | **N** |
| 69 | Saya suka menyenangkan orang-orang yang saya kagumi | **F** | Saya ingin berhasil | **A** |
| 70 | Saya suka orang-orang lain membuat keputusan-keputusan untuk kelompok | **W** | Saya suka membuat keputusan-keputusan untuk kelompok | **P** |
| 71 | Saya selalu berusaha sangat keras | **G** | Saya membuat keputusan secara mudah & cepat | **I** |
| 72 | Kelompok biasanya melaksanakan keinginan saya | **L** | Saya biasa tergesa-gesa | **T** |
| 73 | Saya sering merasa lelah | **I** | Saya lambat dalam membuat keputusan | **V** |
| 74 | Saya bekerja cepat | **T** | Saya mudah berteman | **S** |
| 75 | Saya biasa bersemangat atau bergairah | **V** | Saya menggunakan banyak waktu untuk berpikir | **R** |
| 76 | Saya sangat ramah terhadap orang lain | **S** | Saya menyukai pekerjaan yang menuntut ketelitian | **D** |
| 77 | Saya banyak berpikir dan merencanakan | **R** | Saya menyimpan segala sesuatu pada tempatnya | **C** |
| 78 | Saya menyukai pekerjaan yang menuntut hal-hal yang mendetail | **D** | Saya tidak cepat marah | **E** |
| 79 | Saya suka mengikuti orang-orang yang saya kagumi | **F** | Saya selalu menyelesaikan pekerjaan yang telah saya mulai | **N** |
| 80 | Saya menyukai petunjuk-petunjuk yang jelas | **W** | Saya suka bekerja keras | **A** |
| 81 | Saya mengejar hal-hal yang menjadi keinginan saya | **G** | Saya seorang pemimpin yang baik | **L** |
| 82 | Saya membuat orang lain bekerja keras | **L** | Saya suka bersenang-senang | **I** |
| 83 | Saya membuat keputusan dengan cepat | **I** | Saya berbicara cepat | **T** |
| 84 | Saya biasanya bekerja secara tergesa-gesa | **T** | Saya berolahraga secara teratur | **V** |
| 85 | Saya tidak suka bertemu orang-orang lain | **V** | Saya cepat lelah | **S** |
| 86 | Saya berteman dengan banyak sekali orang | **S** | Saya menggunakan banyak waktu untuk berpikir | **R** |
| 87 | Saya suka bekerja dengan teori | **R** | Saya suka melaksanakan pekerjaan detail | **D** |
| 88 | Saya suka melaksanakan pekerjaan detail | **D** | Saya suka mengatur pekerjaan saya | **C** |
| 89 | Saya meletakkan segala sesuatu pada tempatnya | **C** | Saya selalu menyenangkan | **E** |
| 90 | Saya senang diberitahu hal-hal yang harus saya kerjakan | **W** | Saya harus menyelesaikan apa yang telah saya mulai | **N** |

> **Catatan struktur soal:** Berbeda dari DISC yang punya kolom "netral" (X sebagai dimensi kosong), di PAPI Kostick **setiap pernyataan selalu terhubung ke sebuah aspek** — tidak ada pilihan netral. Kode `X` di sini **bukan netral**, melainkan aspek ke-9 yang sah: **Need for Recognition**. Total 20 kode aspek unik yang dipakai di seluruh 90 soal: `N, G, A, L, P, I, T, V, X, S, B, O, R, D, C, Z, E, K, F, W`.

---

## 4. Sistem Skoring — Tahap demi Tahap

Implementasi persis: fungsi `matchPapiAnswer()` dan blok pemrosesan di `handlePapiFile()` pada `src/pages/papikostik.js`.

### 4.1 Tahap 1 — Inisialisasi

Untuk setiap peserta, siapkan objek skor dengan 20 aspek, semua dimulai dari 0:
```
scores = { N:0, G:0, A:0, L:0, P:0, I:0, T:0, V:0, X:0, S:0, B:0, O:0, R:0, D:0, C:0, Z:0, E:0, K:0, F:0, W:0 }
```

### 4.2 Tahap 2 — Pencocokan Jawaban per Soal (`matchPapiAnswer`)

Untuk tiap satu dari 90 soal, ambil nilai sel jawaban peserta (`val`) dan cocokkan terhadap `pernyataan_a`/`pernyataan_b` soal tersebut, dengan algoritma bertingkat (fallback berjenjang — berhenti begitu satu tingkat berhasil mencocokkan):

1. **Normalisasi:** `val` diubah ke lowercase dan di-trim. Jika kosong/`null`/`undefined` → tidak cocok (`null`), soal dicatat sebagai *unmatched*.
2. **Exact match:** bandingkan persis dengan `pernyataan_a` atau `pernyataan_b` (keduanya juga di-lowercase+trim). Jika sama persis → cocok.
3. **Substring fallback:** jika teks jawaban peserta adalah bagian dari teks pernyataan resmi, **atau sebaliknya** (pernyataan resmi adalah bagian dari teks jawaban) → cocok ke pernyataan tersebut. Ini menoleransi jawaban yang terpotong atau punya tambahan whitespace/karakter di ujung.
4. **Word-overlap fallback (token voting):** jika langkah 2–3 gagal, pecah teks jawaban peserta menjadi kata (token dengan panjang > 2 huruf), lalu hitung berapa banyak token yang muncul sebagai substring di `pernyataan_a` (skor `matchA`) vs di `pernyataan_b` (skor `matchB`). Pernyataan dengan skor overlap lebih tinggi (dan > 0) yang dipilih sebagai pemenang.
5. Jika seluruh langkah gagal (tidak ada overlap sama sekali) → jawaban dianggap **unmatched**, dicatat nomor soalnya, dan tidak menyumbang skor ke aspek manapun.

> Ini **bukan** fuzzy-matching berbasis jarak-edit (Levenshtein) seperti disebut di draft (`PROMPT_PAPI_GENERATOR.md` menyebut "toleransi perbedaan minor"), melainkan strategi bertingkat: exact → substring dua-arah → voting kata. Cukup untuk menoleransi perbedaan kapitalisasi, spasi berlebih, dan potongan kalimat, tapi **tidak menoleransi typo** huruf.

### 4.3 Tahap 3 — Akumulasi Skor

Untuk tiap soal yang berhasil dicocokkan:
- Jika hasil = `'a'` → `scores[aspek_a]++` dan `totalSkor++`.
- Jika hasil = `'b'` → `scores[aspek_b]++` dan `totalSkor++`.
- Jika `null` (unmatched) → tidak menambah skor apapun; nomor soal masuk daftar `unmatchedQuestions`.

Skor akhir tiap aspek berkisar **0–9** karena setiap aspek muncul di rata-rata sekitar 9 dari 90 soal (jumlah eksak kemunculan tiap kode bervariasi tergantung desain item, tapi kisaran realistis skor adalah 0–9).

### 4.4 Tahap 4 — Validasi Total Skor

```
isValid = (totalSkor === 90)
```
- Jika peserta menjawab semua 90 soal dan seluruhnya berhasil dicocokkan ke salah satu aspek → total tepat 90, `isValid = true`.
- Jika ada soal yang tidak terjawab atau gagal dicocokkan (unmatched) → `totalSkor < 90`, `isValid = false`, dan peserta ditandai badge peringatan **"⚠️ {totalSkor} Skor"** di tabel ringkasan serta alert kuning di halaman detail ("Data tidak lengkap (harus 90)"). Laporan tetap diproses dan bisa diunduh dengan skor yang ada.

### 4.5 Tahap 5 — Kategorisasi Skor per Aspek

Diterapkan saat merender tampilan (bar chart & tabel), **bukan** disimpan sebagai field terpisah di data:

| Kategori | Ambang (implementasi aktual) | Warna |
|---|---|---|
| **High** | skor **≥ 6** | Merah (`var(--error)`) |
| **Middle** | skor **4–5** | Kuning/oranye (`var(--warning)`) |
| **Low** | skor **≤ 3** | Cyan (`var(--cyan)`) |

`summary.high` = daftar aspek dengan skor ≥ 6, diurutkan dari skor tertinggi ke terendah.
`summary.low` = daftar aspek dengan skor ≤ 3, diurutkan dari skor **terendah** ke tertinggi (paling ekstrem ditampilkan lebih dulu).

---

## 5. Kamus 20 Aspek Kepribadian PAPI Kostick

Setiap aspek punya: nama resmi, deskripsi singkat, narasi untuk kondisi **High** (skor ≥ 6), dan narasi untuk kondisi **Low** (skor ≤ 3). Sumber: `ASPECT_DETAILS` di `papikostik.js`.

| Kode | Nama Aspek | Deskripsi | Narasi jika **High** | Narasi jika **Low** |
|---|---|---|---|---|
| **N** | Need to Finish a Task | Dorongan untuk menyelesaikan pekerjaan sampai tuntas | Sangat berkomitmen dan berorientasi pada penyelesaian tugas secara tuntas. | Kurang mendesak atau fleksibel dalam penyelesaian akhir tugas. |
| **G** | Hard Intense Worker | Kecenderungan bekerja keras dan sungguh-sungguh | Memiliki etos kerja yang kuat, gigih, dan pekerja keras. | Menyukai gaya kerja yang santai dan menghindari tekanan berlebih. |
| **A** | Need for Achievement | Dorongan berprestasi dan melakukan yang terbaik | Memiliki motivasi berprestasi tinggi dan ingin selalu menghasilkan karya terbaik. | Kurang terdorong untuk bersaing secara performa atau berprestasi menonjol. |
| **L** | Leadership Role | Kecenderungan memimpin dan mengambil tanggung jawab | Cenderung dominan, mengambil inisiatif, dan percaya diri memimpin kelompok. | Lebih nyaman sebagai anggota kelompok dan menghindari peran kepemimpinan. |
| **P** | Need to Control Others | Keinginan mengarahkan dan mengontrol orang lain | Suka memegang kendali, mengarahkan, dan mengontrol pekerjaan orang lain. | Menghindari perilaku mendikte dan cenderung membiarkan orang lain mandiri. |
| **I** | Ease in Decision Making | Kemampuan membuat keputusan dengan mudah dan cepat | Sangat tanggap, cepat, dan percaya diri dalam mengambil keputusan. | Cenderung ragu-ragu atau membutuhkan waktu lama untuk mempertimbangkan keputusan. |
| **T** | Pace / Tempo | Kecenderungan bekerja dengan tempo cepat | Bekerja dengan tempo dan dinamika yang cepat serta cekatan. | Bekerja dengan tenang, berhati-hati, dan cenderung lambat. |
| **V** | Vigour | Energi fisik dan gairah dalam aktivitas | Memiliki energi fisik yang besar dan menyukai aktivitas dinamis. | Memiliki keterbatasan stamina atau cenderung cepat lelah secara fisik. |
| **X** | Need for Recognition | Keinginan mendapat perhatian dan pengakuan | Sangat termotivasi oleh apresiasi, pujian, dan sorotan publik. | Rendah hati dan tidak terlalu membutuhkan perhatian atau panggung. |
| **S** | Social Extensiveness | Keluasan dalam pergaulan sosial | Sangat ramah, terbuka, dan senang menjalin jaringan sosial yang luas. | Lebih introvert, pendiam, dan selektif dalam bersosialisasi. |
| **B** | Need to Belong to Groups | Keinginan menjadi bagian dari kelompok | Sangat berorientasi kelompok dan membutuhkan keterlibatan sosial tim. | Individualis dan mandiri, tidak terlalu tergantung pada kelompok. |
| **O** | Need for Closeness & Affection | Kebutuhan kedekatan emosional dan afeksi | Membutuhkan hubungan interpersonal yang erat, hangat, dan akrab. | Lebih menjaga jarak secara emosional dan mandiri dalam relasi. |
| **R** | Theoretical Type | Kecenderungan berpikir analitis dan teoritis | Suka menganalisis konsep, teori, dan berpikir secara mendalam. | Lebih praktis dan pragmatis, berfokus pada eksekusi nyata daripada teori. |
| **D** | Detail Conscious | Perhatian terhadap hal-hal detail dan ketelitian | Sangat teliti, cermat, dan peduli pada detail-detail kecil. | Lebih berfokus pada gambaran besar (big picture) dan cenderung abai detail. |
| **C** | Organized Type | Kecenderungan bersikap teratur dan sistematis | Sangat terstruktur, rapi, dan terorganisir dalam bekerja. | Spontan, kurang terstruktur, dan fleksibel dalam penataan. |
| **Z** | Need for Change | Dorongan untuk mencoba hal baru dan perubahan | Menyukai variasi, inovasi, dan mudah beradaptasi dengan perubahan. | Lebih menyukai rutinitas yang stabil dan cenderung menolak perubahan mendadak. |
| **E** | Emotional Restraint | Kemampuan mengendalikan emosi | Sangat tenang, berkepala dingin, dan mampu mengendalikan emosi dengan baik. | Ekspresif, reaktif secara emosional, atau mudah terpancing stres. |
| **K** | Need for Aggression | Kecenderungan asertif/agresif mempertahankan pendapat | Asertif, kompetitif, dan berani bersikap konfrontatif demi keyakinannya. | Pasif, menghindari konflik, dan cenderung mengalah demi kedamaian. |
| **F** | Need for Support & Dependence | Kebutuhan dukungan dari figur otoritas | Membutuhkan bimbingan, persetujuan, dan kepastian dari atasan. | Sangat mandiri dan tidak terlalu membutuhkan validasi dari otoritas. |
| **W** | Need for Rules & Supervision | Kenyamanan dengan aturan dan pengawasan | Taat aturan, patuh, dan merasa aman dengan instruksi yang jelas. | Lebih suka kebebasan dalam bertindak dan tidak menyukai birokrasi ketat. |

**Kategori Middle (skor 4–5):** tidak punya narasi khusus tersendiri di kamus — aspek dengan skor menengah ditampilkan di tabel lengkap dengan label "🟡 Middle" tanpa narasi interpretatif tambahan (tidak masuk ke bagian "Aspek Dominan" maupun "Aspek Rendah" pada laporan).

---

## 6. Struktur & Konten Laporan (Detail View / PDF)

Laporan per peserta tersusun sebagai berikut, sesuai `renderDetailView()` dan `papiGeneratePDFHTML()`:

### A. Header Identitas (Hero Section)
- Nama Lengkap
- Jenis Kelamin
- Tanggal Lahir
- **Validasi Skor** ditampilkan menonjol di kanan atas: `{totalSkor} / 90`, hijau jika valid (=90), kuning jika tidak (disertai teks "Data tidak lengkap (harus 90)").

### B. Profil Grafis (Bar Chart 20 Aspek)
Bar horizontal untuk **seluruh 20 aspek** (urutan tetap sesuai definisi kamus, bukan diurutkan skor), masing-masing menampilkan:
- Kode aspek + nama aspek
- Skor `x/9` + kategori (High/Middle/Low)
- Bar proporsional: lebar = `(skor / 9) × 100%`, warna sesuai kategori (merah=High, kuning=Middle, cyan=Low)

### C. Analisis Karakter Kerja & Sosial (Ringkasan Naratif Terintegrasi)
Satu paragraf otomatis (`generateIntegratedSummary()`) yang merangkai:
1. Kalimat pembuka standar.
2. Jika ada aspek High: sebutkan hingga 3 kode aspek tertinggi + gabungkan deskripsi singkat (`desc`, huruf kecil) masing-masing jadi satu kalimat.
3. Jika ada aspek Low: sebutkan hingga 2 kode aspek terendah + gabungkan narasi `low` masing-masing (dengan nama peserta dihapus dari kalimat agar tidak duplikat).
4. Kalimat penutup standar tentang pengaruh kombinasi ini terhadap produktivitas, kepemimpinan, koordinasi, dan adaptasi sosial.

### D. Aspek Dominan (High) — Narasi per Aspek
Untuk **setiap** aspek dengan skor ≥ 6 (tidak dibatasi jumlah tertentu — draft awal menyebut "3–5 aspek" tapi implementasi aktual menampilkan **semua** yang masuk kategori High), tampilkan kartu:
> **{Kode} – {Nama Aspek} (Skor {n})**
> {Nama peserta} {narasi high dari kamus}

Jika tidak ada aspek High sama sekali → tampilkan teks italic: *"Tidak ada aspek berkategori High."*

### E. Aspek Rendah (Low) — Narasi per Aspek
Sama seperti di atas tapi untuk seluruh aspek dengan skor ≤ 3, memakai narasi `low` dari kamus. Jika kosong → *"Tidak ada aspek berkategori Low."*

### F. Tabel Skor Lengkap (Terurut Tinggi ke Rendah)
Tabel semua 20 aspek diurutkan dari skor tertinggi ke terendah, kolom: Kode, Nama Aspek + deskripsi singkat, Skor, Kategori (dengan emoji: 🔴 High / 🟡 Middle / 🔵 Low).

### G. Footer Laporan (khusus versi PDF)
- Judul dokumen: **"LAPORAN PAPI KOSTICK"**
- Catatan promosi kontak (Coach Alifya)
- Disclaimer kerahasiaan: *"Laporan ini bersifat rahasia dan hanya untuk keperluan asesmen."*

### H. Fitur Unduh & Ekspor
- **Unduh PDF** per peserta (`html2pdf`, format A4 potrait).
- **Unduh Semua (ZIP)** — seluruh peserta dikemas jadi satu file ZIP berisi PDF per orang.
- **Export Rekapitulasi (CSV)** — satu baris per peserta, kolom: Nama, Jenis Kelamin, Tanggal Lahir, skor 20 aspek (`N,G,A,L,P,I,T,V,X,S,B,O,R,D,C,Z,E,K,F,W`), Total Skor, status Valid (Ya/Tidak).

### I. Navigasi
- Ringkasan (tabel semua peserta: Nama + badge peringatan jika skor tidak lengkap, L/P, badge Aspek Dominan, badge Aspek Rendah, Total Skor, tombol Detail) → klik baris untuk ke Detail.
- Di halaman Detail: tombol Sebelumnya/Berikutnya untuk berpindah antar peserta.

---

## 7. Format File Input (Teknis)

- Ekstensi: `.xlsx`, `.xls`, atau `.csv` (dibaca via `XLSX.read`, mendukung ketiganya).
- Pencarian baris header: dicek pada **20 baris pertama** file — baris pertama yang mengandung sel berisi kata "nama" (regex `/nama/i`) **atau** pola nomor soal pertama (regex `/^1(?:\.|\s|$)/`) dianggap sebagai baris header. Ini mengantisipasi adanya baris judul/informasi tambahan di atas header sesungguhnya.
- Deteksi kolom awal soal: cari header yang cocok `/^1(?:\.|\s|$)/` (yakni "1." atau "1 " atau persis "1"). Kolom-kolom sesudahnya (90 kolom berurutan) diasumsikan soal 2–90.
- Validasi kelengkapan: sistem juga mencari header soal ke-90 (`/^90(?:\.|\s|$)/`) dan memastikan posisinya **≥** (posisi soal 1 + 89) — kalau tidak, file ditolak dengan pesan *"Kolom soal 1 hingga 90 tidak ditemukan secara lengkap."*
- Deteksi kolom identitas (posisi bebas, dicari di seluruh header):
  - Nama: `/nama\s*(lengkap)?/i`
  - Jenis kelamin: `/kelamin|gender|sex|l\/p/i`
  - Tanggal lahir: `/tanggal\s*lahir|tgl\s*lahir|lahir|birth/i`
- **Fallback nama:** jika kolom nama tidak terdeteksi via header, sistem mengambil sel pertama yang berisi teks di antara kolom sebelum soal-1 (kecuali kolom index 0, biasanya Timestamp). Jika tetap tidak ada → nama default `"Kandidat {nomor baris}"`.
- Tanggal lahir mendukung 3 bentuk: objek `Date` Excel, serial number Excel (`(raw - 25569) × 86400 × 1000` epoch ms), atau string apa adanya.
- Baris tanpa data (`row.length === 0`) dilewati.

---

## Catatan & Riwayat Versi

Dibandingkan dengan `zlainnya/PROMPT_PAPI_GENERATOR.md` (draft awal), implementasi aktual **sangat setia** pada spesifikasi — 90 soal dan 20 aspek identik persis. Perbedaan yang ditemukan:

| Aspek | Draft (`PROMPT_PAPI_GENERATOR.md`) | Implementasi Aktual (`papikostik.js`) |
|---|---|---|
| Ambang kategori | Low 0–3, Middle 4–5, High **6–9** (rentang eksplisit 0–9) | Sama persis: Low ≤3, Middle 4–5, High ≥6 (skala bar chart pakai pembagi 9, konsisten dengan rentang draft) |
| Metode pencocokan jawaban | Disebut sebagai **"fuzzy matching"** generik, toleransi "spasi, kapitalisasi" | Implementasi bertingkat: exact match → substring dua arah → *word-overlap voting* — bukan fuzzy string-distance sesungguhnya, jadi typo huruf tidak akan tertoleransi |
| Jumlah aspek dinarasikan di laporan | Disarankan fokus **3–5 aspek High** dan **2–3 aspek Low** saja | Kode aktual menampilkan **seluruh** aspek yang masuk kategori High dan **seluruh** yang masuk kategori Low, tanpa pembatasan jumlah |
| Format nilai jawaban di file | Contoh header CSV draft: `Soal 1, Soal 2, ...` dan nilai sel = teks pernyataan lengkap | Implementasi mendukung header format `"1.", "2.", ...` (bukan "Soal 1"); nilai sel tetap diharapkan berupa teks pernyataan lengkap — **namun** file template yang di-generate aplikasi (`downloadPapiTemplate()`) justru mengisi contoh baris dengan literal `"A"`/`"B"` bergantian, **bukan** teks pernyataan penuh. Ini berpotensi membingungkan pengguna template karena nilai `"A"`/`"B"` kemungkinan besar akan gagal dicocokkan dengan tepat oleh `matchPapiAnswer()` secara konsisten (huruf tunggal "a" akan sering muncul sebagai substring di kedua pernyataan sekaligus, membuat hasil pencocokan token-overlap tidak dapat diandalkan). **Data asli dari Google Form sungguhan** (yang merekam teks pilihan radio button apa adanya) tidak mengalami masalah ini. |
| Kategorisasi "Middle" | Disebutkan sebagai kategori resmi dengan rentang 4–5 | Sama, tapi **tidak dinarasikan** di laporan — aspek Middle hanya muncul di tabel skor lengkap dan bar chart, tidak mendapat bagian narasi interpretasi tersendiri (draft juga tidak menjelaskan narasi khusus untuk Middle) |
| Validasi | Sama — total skor harus 90 | Sama persis, ditambah pencatatan `unmatchedQuestions` (daftar nomor soal yang gagal dicocokkan) sebagai field data meski tidak ditampilkan eksplisit di UI laporan (hanya memengaruhi `totalSkor` dan status `isValid`) |

**Kesimpulan:** PAPI Kostick adalah alat tes dengan tingkat kesetiaan implementasi-ke-spesifikasi **paling tinggi** dibanding DISC. Satu-satunya area yang perlu perhatian praktis adalah **template Excel unduhan** yang contoh datanya tidak representatif terhadap format asli Google Form (lihat baris terakhir tabel di atas) — sebaiknya diperbaiki agar contoh baris memakai teks pernyataan penuh, bukan literal "A"/"B", supaya tidak menyesatkan pengguna yang mengisi manual berdasarkan template tersebut.

---

## Sumber Dokumen

- `src/pages/papikostik.js` — implementasi aktual (skoring, pencocokan jawaban, render, PDF, ekspor).
- `zlainnya/PROMPT_PAPI_GENERATOR.md` — draft spesifikasi awal (kunci jawaban 90 soal & kamus 20 aspek — identik dengan kode aktual).
