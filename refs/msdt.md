# MSDT (Management Style Diagnostic Test) — Dokumentasi Lengkap Alat Tes

> Dokumen ini merangkum **persis apa yang berjalan di aplikasi** (`src/pages/msdt.js`), dicocokkan dengan **dua** dokumen spesifikasi historis: `zlainnya/prompt_msdt.md` (draft awal) dan `zlainnya/prompt_msdt_patch_konversi.md` (patch koreksi logika hasil akhir). **Penting:** draft awal dan patch **saling bertentangan** pada langkah penentuan hasil akhir — kode yang berjalan mengikuti **patch**, bukan draft awal. Detail lengkap ada di [Catatan & Riwayat Versi](#catatan--riwayat-versi).

---

## 1. Ringkasan Alat Tes

- **Nama:** MSDT (**M**anagement **S**tyle **D**iagnostic **T**est) — mengukur gaya manajemen/kepemimpinan seseorang berdasarkan model grid manajerial klasik (mirip pendekatan Blake-Mouton / Reddin 3-D, diadaptasi ke 8 gaya).
- **Jumlah soal:** 64 soal, masing-masing berisi **2 pernyataan** (A dan B), disusun sebagai matriks tersembunyi **8 blok × 8 posisi**.
- **Format respons:** *forced-choice ipsatif berpasangan* — pada tiap soal peserta memilih **satu** dari 2 pernyataan yang **paling menggambarkan gaya kerjanya sebagai pemimpin/manajer**.
- **Dimensi yang diukur:** 8 gaya manajemen (Ds, Mi, Au, Co, Bu, Dv, Ba, E), yang lalu diringkas jadi **4 skor orientasi** (TO, RO, E, O), dan akhirnya dikonversi menjadi **1 hasil akhir tunggal** dari 8 kemungkinan gaya dominan.
- **Total tanda per peserta:** 64 pilihan (1 per soal).
- **Output:** skor 8 dimensi, 4 skor orientasi (dengan konversi Tinggi/Rendah), 1 hasil akhir (gaya manajemen dominan), narasi interpretasi, dan laporan PDF per peserta.
- **Sumber input:** Google Form → diekspor jadi file Excel/CSV → diupload ke halaman MSDT di aplikasi.
- **Target penggunaan:** ditujukan untuk peserta yang memegang **peran manajerial/kepemimpinan** — pernyataan-pernyataan soal secara eksplisit berbicara tentang cara memperlakukan "bawahan", "Direktur", "Dewan Direksi", dsb.

---

## 2. Instruksi Pengerjaan

Instruksi yang seharusnya ditampilkan ke peserta (melalui Google Form, sebelum diproses aplikasi):

1. Terdapat 64 nomor. Setiap nomor berisi **2 pernyataan** (Pernyataan A dan Pernyataan B) tentang bagaimana Anda bersikap/bertindak sebagai seorang pemimpin/manajer.
2. Dari 2 pernyataan tersebut, pilih **satu (1)** yang **paling menggambarkan cara Anda bersikap** dalam situasi tersebut.
3. Jawablah berdasarkan kebiasaan/kecenderungan nyata Anda dalam mengelola bawahan, bukan berdasarkan apa yang dianggap ideal secara teori manajemen.
4. Tidak ada jawaban benar atau salah.
5. Jawab seluruh 64 nomor tanpa ada yang terlewat — sistem memvalidasi bahwa total jawaban harus tepat 64.

**Instruksi ke Admin/HR (di halaman upload aplikasi):**
- Upload file Excel (`.xlsx`/`.xls`) atau CSV hasil export Google Form.
- Kolom identitas (Nama Lengkap, Jenis Kelamin, Tanggal Lahir) dideteksi otomatis berdasarkan nama header.
- Kolom soal harus berlabel **"1."** sampai **"64."** (atau berupa angka polos 1–64), sesuai format template resmi aplikasi.
- Isi tiap sel kolom soal idealnya berupa **teks lengkap pernyataan yang dipilih peserta**, tapi sistem juga menerima literal huruf **"A"/"B"** langsung (lihat Bagian 4.2 — beda dari PAPI Kostick yang tidak punya jalur literal huruf ini).
- Baris header dicari di antara 20 baris pertama file. Setiap baris di bawah header = satu peserta; semua diproses sekaligus.
- Tersedia tombol **"Unduh Template Excel"** yang menghasilkan header 64 kolom siap pakai.

---

## 3. Struktur Tersembunyi: Matriks 8×8

Berbeda dari DISC/PAPI/Big Five, ke-64 soal MSDT sebenarnya membentuk sebuah **matriks 8 baris × 8 kolom** yang tidak terlihat eksplisit dalam urutan penomoran linear 1–64, tapi menentukan cara skoring:

- Soal dikelompokkan menjadi **8 blok** berurutan, masing-masing berisi **8 soal**: Blok 1 = soal 1–8, Blok 2 = soal 9–16, …, Blok 8 = soal 57–64.
- Setiap **blok** mewakili satu **baris** matriks; posisi soal ke berapa di dalam bloknya (1–8) mewakili **kolom** matriks.
- Skor tiap satu dari 8 dimensi gaya manajemen dihitung dengan **membaca satu baris penuh untuk menghitung jawaban A**, dan **membaca satu kolom penuh (lintas 8 blok) untuk menghitung jawaban B**. Ini adalah metode skoring grid diagonal klasik yang dipakai instrumen gaya manajemen semacam ini (mirip prinsip LEAD/Reddin).
- Baris/kolom ke-*n* dalam matriks ini berkorespondensi dengan dimensi ke-*n* pada urutan tetap: **Ds(1), Mi(2), Au(3), Co(4), Bu(5), Dv(6), Ba(7), E(8)**.

```
rawCounts[dimensi ke-n].a = jumlah jawaban "A" pada BARIS ke-n (8 soal dalam blok ke-n)
rawCounts[dimensi ke-n].b = jumlah jawaban "B" pada KOLOM ke-n (posisi ke-n di tiap 8 blok)
```

---

## 4. Daftar Lengkap 64 Soal (Item Bank Resmi)

Sumber: `MSDT_SOAL` di `src/pages/msdt.js` — identik dengan kunci di kedua dokumen prompt legacy.

Kolom **Blok (Baris)** dan **Posisi dalam blok (Kolom)** menunjukkan koordinat soal tersebut dalam matriks 8×8 (lihat Bagian 3).

| No | Pernyataan A | Pernyataan B | Blok (Baris) | Posisi (Kolom) |
|---|---|---|---|---|
| 1 | Saya mengabaikan pelanggar-pelanggar peraturan bila saya merasa pasti bahwa tidak ada satu orangpun yang mengetahui tentang pelanggar-pelanggar tersebut. | Bila saya mengumumkan suatu keputusan yang kurang menyenangkan, saya akan menjelaskan kepada bawahan saya bahwa keputusan ini dibuat oleh Direktur. | 1 | 1 |
| 2 | Bila ada seorang karyawan yang hasil kerjanya selalu tidak memuaskan saya, saya akan menunggu suatu kesempatan untuk memindahkannya dan bukan untuk memecatnya. | Bila ada bawahan saya yang dikucilkan dari kelompok kerjanya, saya akan mencarikan cara-cara agar supaya orang lain dapat berteman dengannya. | 1 | 2 |
| 3 | Bila Direktur memberikan perintah yang kurang menyenangkan, saya pikir adalah cukup bijaksana bila saya menyebutkan namanya dan bukan nama saya. | Saya biasanya membuat keputusan-keputusan saya sendiri dan menyampaikannya kepada bawahan saya. | 1 | 3 |
| 4 | Bila saya ditegur oleh atasan saya, saya akan memanggil semua bawahan saya dan mengatakan semua teguran tersebut kepada mereka. | Saya selalu memberikan tugas-tugas yang sangat sulit kepada karyawan-karyawan yang paling berpengalaman. | 1 | 4 |
| 5 | Saya selalu melakukan diskusi-diskusi untuk mencapai kata sepakat. | Saya selalu menganjurkan kepada bawahan saya untuk memberikan usul-usul, tetapi kadang-kadang juga saya langsung membuat suatu tindakan tertentu. | 1 | 5 |
| 6 | Kadang-kadang saya berpikir bahwa perasaan-perasaan saya dan sikap-sikap saya adalah mementingkan tugas saya. | Saya mengijinkan bawahan-bawahan saya untuk ikut serta mengambil keputusan yang dibuat berdasarkan atas suara terbanyak. | 1 | 6 |
| 7 | Bila jumlah dan mutu hasil kerja bagian saya tidak memuaskan, saya menjelaskan kepada bawahan-bawahan saya bahwa Direktur merasa kecewa dan oleh karena itu mereka harus memperbaiki kerja mereka. | Saya membuat keputusan-keputusan sendiri dan kemudian saya mencoba untuk menjual keputusan-keputusan itu kepada bawahan saya. | 1 | 7 |
| 8 | Bila saya mengumumkan suatu keputusan yang kurang menyenangkan, saya akan menjelaskan kepada bawahan saya bahwa keputusan ini dibuat oleh Direktur. | Saya mengijinkan bawahan-bawahan saya untuk ikut serta di dalam pengambilan keputusan, tetapi sayapun menyediakan sesuatu keputusan terakhir. | 1 | 8 |
| 9 | Saya akan memberikan tugas-tugas yang sulit kepada bawahan saya yang belum berpengalaman, tetapi bila mereka memperoleh kesukaran, saya akan mengambil alih tanggung jawab mereka. | Bila jumlah dan mutu hasil kerja bagian saya tidak memuaskan, saya menjelaskan kepada bawahan-bawahan saya bahwa Direktur merasa kecewa dan oleh karena itu mereka harus memperbaiki mutu kerja mereka itu. | 2 | 1 |
| 10 | Saya merasa bahwa adalah penting agar bawahan-bawahan menyukai saya apabila saya bekerja keras untuk mereka. | Saya membiarkan orang-orang lain menangani tugas-tugas mereka masing-masing, walaupun mereka membuat banyak kesalahan. | 2 | 2 |
| 11 | Saya menunjukkan minat saya terhadap kehidupan pribadi bawahan-bawahan saya, sebab saya merasa bahwa saya mengerti mengapa mereka mengerjakan sesuatu hal sejauh mereka mengerjakan hal tersebut. | Saya merasa bahwa adalah tidak terlalu perlu untuk bawahan-bawahan saya mengerti mengapa mereka mengerjakan sesuatu hal sejauh mereka mengerjakan hal tersebut. | 2 | 3 |
| 12 | Saya percaya bahwa bawahan-bawahan yang disiplin tidak akan memperbaiki jumlah atau mutu kerja mereka di dalam jangka waktu yang panjang. | Bila menghadapi masalah yang sulit, saya berusaha untuk mencapai pemecahan yang paling sedikit bisa diterima oleh sebagian besar orang-orang yang bersangkutan. | 2 | 4 |
| 13 | Saya berpikir bahwa bila beberapa bawahan saya merasa tidak berbahagia, saya akan mencoba melakukan sesuatu mengenai hal tersebut. | Saya mengurusi pekerjaan saya sendiri dan saya merasa bahwa pekerjaan saya itu bisa mencapai "Dewan Direksi" untuk mengembangkan ide-ide baru. | 2 | 5 |
| 14 | Saya menyetujui kenaikan tunjangan-tunjangan untuk staf dan karyawan. | Saya menunjukkan persetujuan untuk meningkatkan pengetahuan tentang pekerjaan dan perusahaan dari bawahan-bawahan saya, walaupun hal itu sebenarnya belum diperlukan untuk kedudukan mereka sekarang. | 2 | 6 |
| 15 | Saya membiarkan orang-orang lain menangani tugas-tugas mereka masing-masing, walaupun mereka membuat banyak kesalahan. | Saya membuat keputusan-keputusan sendiri tetapi saya akan mempertimbangkan usul-usul yang masuk di akal dari bawahan-bawahan saya untuk memperbaiki keputusan tersebut apabila saya bertanya kepada mereka. | 2 | 7 |
| 16 | Bila ada bawahan saya yang dikucilkan dari kelompok kerjanya, saya akan mencarikan cara-cara agar supaya orang lain dapat berteman dengannya. | Bila seorang karyawan tidak sanggup menyelesaikan tugasnya, saya akan membantu dia untuk menyelesaikan tugas tersebut. | 2 | 8 |
| 17 | Saya percaya bahwa suatu penerapan disiplin adalah merupakan seperangkat contoh untuk karyawan-karyawan lainnya. | Kadang-kadang saya berpikir bahwa perasaan-perasaan saya dan sikap-sikap saya adalah mementingkan tugas saya. | 3 | 1 |
| 18 | Saya mencela pembicaraan-pembicaraan yang tidak perlu di antara bawahan-bawahan saya selama mereka bekerja. | Saya menyetujui tunjangan-tunjangan untuk staf dan karyawan-karyawan. | 3 | 2 |
| 19 | Saya selalu memperhatikan mengenai keterlambatan dan kemangkiran. | Saya percaya bahwa Serikat-Serikat Buruh akan mencoba untuk meruntuhkan kewibawaan pimpinan perusahaan. | 3 | 3 |
| 20 | Kadang-kadang saya menentang keluhan-keluhan serikat buruh sebagai suatu perkara yang prinsipil. | Saya merasa bahwa keluhan-keluhan tidak dapat dicegah dan saya mencoba sebaik mungkin untuk dapat dilenyapkan. | 3 | 4 |
| 21 | Adalah penting bagi saya untuk memperoleh nilai kredit bagi ide-ide saya yang baik. | Saya menyuarakan pendapat-pendapat saya di muka umum hanya bila saya merasa bahwa orang lain akan setuju dengan saya. | 3 | 5 |
| 22 | Saya percaya bahwa Serikat-Serikat Buruh akan mencoba meruntuhkan kewibawaan pimpinan perusahaan. | Saya percaya bahwa pertemuan-pertemuan yang sering dengan karyawan secara pribadi adalah membantu pengembangan diri mereka. | 3 | 6 |
| 23 | Saya merasa bahwa tidak terlalu perlu untuk bawahan-bawahan saya mengerti mengapa mereka mengerjakan sesuatu hal sejauh mereka mengerjakan hal tersebut. | Saya merasa bahwa jam pencatat waktu datang dan pulangnya para pegawai, mengurangi keterlambatan. | 3 | 7 |
| 24 | Saya biasanya membuat keputusan-keputusan saya sendiri dan menyampaikannya kepada bawahan saya. | Saya merasa bahwa Serikat-Serikat Buruh dan pimpinan perusahaan adalah bekerja untuk mencapai tujuan-tujuan yang sama. | 3 | 8 |
| 25 | Saya menyukai penggunaan dari skala penggajian karyawan. | Saya selalu melakukan diskusi-diskusi untuk mencapai kata sepakat. | 4 | 1 |
| 26 | Saya merasa bangga di dalam kenyataannya bahwa saya biasanya tidak akan menanyakan kepada seseorang untuk mengerjakan suatu tugas yang kalau untuk saya sendiri, tidak akan saya kerjakan. | Saya berpikir bahwa bila beberapa bawahan saya merasa tidak berbahagia, saya akan mencoba melakukan sesuatu mengenai hal tersebut. | 4 | 2 |
| 27 | Bila ada suatu tugas yang mendesak, walaupun semua peralatannya sudah disediakan saya akan membiarkannya saja, dan mengatakan kepada salah seorang bawahan saya untuk mengerjakan sesuatu tugas tersebut. | Adalah penting bagi saya untuk memperoleh nilai kredit bagi ide-ide saya yang baik. | 4 | 3 |
| 28 | Tujuan saya adalah mencapai bagaimana tugas-tugas dapat dikerjakan, tanpa saya merasa lebih benci daripada siapapun yang mengerjakan. | Saya mungkin menentukan tugas-tugas tanpa banyak mempertimbangkan pengalaman atau kemampuan, tetapi saya lebih menuntut pada pencapaian hasil-hasilnya saja. | 4 | 4 |
| 29 | Saya mungkin menentukan tugas-tugas tanpa banyak mempertimbangkan pengalaman atau kemampuan, tetapi saya lebih menuntut pada pencapaian hasil-hasilnya saja. | Saya dengan sabar mendengarkan keluhan-keluhan dan ketidakpuasan-ketidakpuasan dari bawahan saya tetapi seringkali saya meralat apa yang mereka katakan. | 4 | 5 |
| 30 | Saya merasa bahwa keluhan-keluhan tidak dapat dicegah dan saya mencoba sebaik mungkin untuk dapat dilenyapkan. | Saya percaya bahwa bawahan-bawahan saya akan merasakan kepuasan kerja mereka tanpa merasakan tekanan apapun dari saya. | 4 | 6 |
| 31 | Bila menghadapi masalah yang sulit, saya berusaha untuk mencapai pemecahan yang paling sedikit bisa diterima oleh sebagian besar orang-orang yang bersangkutan. | Saya percaya bahwa latihan melalui pengalaman bekerja, adalah lebih bermanfaat daripada pendidikan teoritis. | 4 | 7 |
| 32 | Saya selalu memberikan tugas-tugas yang sangat sulit kepada karyawan-karyawan yang paling berpengalaman. | Saya percaya bahwa kenaikan jabatan adalah semata-mata berdasarkan kemampuan yang ada. | 4 | 8 |
| 33 | Saya merasa bahwa masalah-masalah yang timbul di antara para karyawan biasanya akan dapat diselesaikan di antara mereka sendiri, tanpa campur tangan dari saya. | Bila saya ditegur oleh atasan saya, saya akan memanggil semua bawahan saya dan mengatakan semua teguran tersebut kepada mereka. | 5 | 1 |
| 34 | Saya tidak peduli dengan apa yang dikerjakan oleh karyawan saya di luar jam kerja kantornya. | Saya percaya bahwa bawahan-bawahan yang disiplin tidak akan memperbaiki jumlah atau mutu kerja mereka di dalam jangka waktu panjang. | 5 | 2 |
| 35 | Saya memberikan informasi kepada "Dewan Direksi" tidak lebih dari pada apa yang mereka tanyakan. | Kadang-kadang saya menentang keluhan-keluhan Serikat Buruh sebagai sesuatu perkara yang prinsipil. | 5 | 3 |
| 36 | Saya kadang-kadang merasa ragu-ragu untuk membuat suatu keputusan yang akan tidak disukai oleh bawahan-bawahan saya. | Tujuan saya adalah mencapai bagaimana tugas-tugas dapat dikerjakan, tanpa saya merasa lebih benci daripada siapapun yang mengerjakannya. | 5 | 4 |
| 37 | Saya dengan sabar mendengarkan keluhan-keluhan dan ketidakpuasan-ketidakpuasan dari bawahan saya, tetapi seringkali saya meralat apa yang mereka katakan. | Saya kadang-kadang merasa ragu-ragu untuk membuat keputusan-keputusan yang akan tidak disukai oleh bawahan-bawahan saya. | 5 | 5 |
| 38 | Saya menyuarakan pendapat-pendapat saya di muka umum hanya bila saya merasa bahwa orang lain akan setuju dengan saya. | Sebagian besar dari bawahan-bawahan saya dapat menyelesaikan tugas-tugas mereka, bila perlu, tanpa kehadiran saya. | 5 | 6 |
| 39 | Saya mengurusi pekerjaan saya sendiri, dan saya merasa bahwa pekerjaan saya itu bisa mencapai "Dewan Direksi" untuk mengembangkan ide-ide baru. | Bila saya memberikan perintah kepada bawahan-bawahan saya, saya menentukan batas waktu untuk mereka menyelesaikannya. | 5 | 7 |
| 40 | Saya selalu menganjurkan kepada bawahan saya untuk memberikan usul-usul, tetapi kadang-kadang juga saya langsung membuat suatu tindakan tertentu. | Saya mencoba untuk membuat bawahan-bawahan saya merasa senang hatinya apabila mereka berbicara dengan saya. | 5 | 8 |
| 41 | Di dalam diskusi, saya memberikan fakta-fakta seperti apa yang mereka pahami, dan membiarkan mereka melukiskan kesimpulan-kesimpulan mereka sendiri. | Bila Direktur memberikan perintah yang kurang menyenangkan, saya pikir adalah cukup bijaksana bila saya menyebutkan namanya dan bukan nama saya. | 6 | 1 |
| 42 | Bila ada tugas-tugas yang tidak dikehendaki yang harus dikerjakan, sebelumnya saya akan menanyakan kepada beberapa sukarelawan yang mau mengerjakan tugas tersebut. | Saya menunjukkan minat saya terhadap kehidupan pribadi bawahan-bawahan saya, sebab saya merasa bahwa sayapun mengharapkan mereka berbuat seperti itu kepada saya. | 6 | 2 |
| 43 | Saya adalah seorang yang sangat memperhatikan kebahagiaan karyawan-karyawan saya di dalam mereka mengerjakan tugas-tugas mereka. | Saya selalu memperhatikan mengenai keterlambatan dan kemangkiran. | 6 | 3 |
| 44 | Sebagian besar dari bawahan-bawahan saya dapat menyelesaikan tugas-tugas mereka, bila perlu tanpa kehadiran saya. | Bila ada sesuatu tugas yang mendesak, walaupun semua peralatannya sesudah disediakan, saya akan membiarkannya saja dan mengatakan kepada salah seorang bawahan saya untuk mengerjakan tugas tersebut. | 6 | 4 |
| 45 | Saya percaya bahwa bawahan-bawahan saya akan merasakan kepuasan kerja mereka tanpa merasakan tekanan apapun dari saya. | Saya memberikan informasi kepada "Dewan Direksi" tidak lebih daripada apa yang mereka tanyakan. | 6 | 5 |
| 46 | Saya percaya bahwa pertemuan-pertemuan yang sering dengan karyawan secara pribadi adalah membantu pengembangan diri mereka. | Saya adalah seorang yang sangat memperhatikan karyawan-karyawan saya di dalam mereka mengerjakan tugas-tugas mereka. | 6 | 6 |
| 47 | Saya menunjukkan persetujuan untuk meningkatkan pengetahuan tentang pekerjaan dan perusahaan dari bawahan-bawahan saya, walaupun hal itu sebenarnya belum diperlukan untuk kedudukan mereka sekarang. | Saya mengawasi benar bawahan-bawahan saya yang kurang mahir di dalam bekerjanya atau bawahan-bawahan saya yang hasil kerjanya kurang memuaskan. | 6 | 7 |
| 48 | Saya mengijinkan bawahan-bawahan saya untuk ikut serta mengambil keputusan dan saya selalu mematuhi keputusan yang dibuat berdasarkan atas suara terbanyak. | Saya membuat bawahan-bawahan saya bekerja keras, dan saya berusaha meyakinkan mereka bahwa biasanya mereka mendapat perlakuan yang adil dari "Dewan Direksi". | 6 | 8 |
| 49 | Saya merasa bahwa semua karyawan pada jabatan yang sama seharusnya memperoleh gaji yang sama. | Bila ada seorang karyawan yang hasil kerjanya selalu tidak memuaskan saya, saya akan menunggu suatu kesempatan untuk memindahkannya dan bukan untuk memecatnya. | 7 | 1 |
| 50 | Saya merasa bahwa tujuan-tujuan Serikat Buruh dan tujuan-tujuan perusahaan adalah saling berbeda dan saya mencoba untuk tidak membuat pandangan saya secara jelas. | Saya merasa bahwa adalah penting agar bawahan saya menyukai saya apabila saya bekerja keras untuk mereka. | 7 | 2 |
| 51 | Saya mengawasi benar bawahan-bawahan saya yang kurang mahir di dalam bekerjanya atau bawahan-bawahan saya yang hasil kerjanya kurang memuaskan. | Saya mencela pembicaraan-pembicaraan yang tidak perlu di antara bawahan-bawahan saya selama mereka bekerja. | 7 | 3 |
| 52 | Bila saya memberikan perintah kepada bawahan-bawahan saya, saya menentukan batas waktu untuk mereka menyelesaikannya. | Saya merasa bangga di dalam kenyataannya bahwa saya biasanya tidak akan menanyakan kepada seseorang untuk mengerjakan suatu tugas yang kalau saya sendiri tidak akan saya kerjakan. | 7 | 4 |
| 53 | Saya percaya bahwa latihan melalui pengalaman bekerja, adalah lebih bermanfaat daripada pendidikan teoritis. | Saya tidak peduli dengan apa yang dikerjakan oleh para pegawai saya di luar jam kantornya. | 7 | 5 |
| 54 | Saya merasa bahwa jam pencatat waktu datang dan pulangnya para pegawai, mengurangi keterlambatan. | Saya mengijinkan bawahan-bawahan saya untuk ikut serta mengambil keputusan dan saya selalu mematuhi keputusan yang dibuat berdasarkan atas suara terbanyak. | 7 | 6 |
| 55 | Saya mengambil keputusan-keputusan saya sendiri, tetapi saya dapat mempertimbangkan saran-saran yang wajar dari bawahan-bawahan saya untuk saya manfaatkan, bilamana saya bertanya kepada mereka. | Saya merasa bahwa tujuan-tujuan Serikat Buruh dan tujuan-tujuan perusahaan adalah saling berbeda, dan saya mencoba untuk tidak membuat pandangan saya secara jelas. | 7 | 7 |
| 56 | Saya membuat keputusan-keputusan sendiri dan kemudian saya mencoba untuk "menjual" keputusan-keputusan itu kepada bawahan saya. | Apabila mungkin saya membentuk kelompok-kelompok kerja yang terdiri dari orang-orang yang sudah menjadi teman-teman baik saya. | 7 | 8 |
| 57 | Saya tidak akan ragu-ragu untuk mempekerjakan pegawai-pegawai yang cacat jasmaninya, bilamana saya merasa pasti bahwa dia dapat mempelajari pekerjaannya. | Saya mengabaikan pelanggar-pelanggar peraturan bila saya merasa pasti bahwa tidak ada satu orangpun yang mengetahui tentang pelanggaran-pelanggaran tersebut. | 8 | 1 |
| 58 | Apabila mungkin saya membentuk kelompok-kelompok kerja yang terdiri dari orang-orang yang sudah menjadi teman-teman baik saya. | Saya akan memberikan tugas-tugas yang sulit kepada bawahan-bawahan saya yang berpengalaman, tetapi bila mereka memperoleh kesukaran, saya akan mengambil alih tanggung jawab mereka. | 8 | 2 |
| 59 | Saya membuat bawahan-bawahan saya bekerja keras, dan saya berusaha meyakinkan mereka bahwa biasanya mereka mendapat perlakuan yang adil dari "Dewan Direksi". | Saya percaya bahwa suatu penerapan disiplin adalah merupakan seperangkat contoh untuk karyawan-karyawan lainnya. | 8 | 3 |
| 60 | Saya mencoba untuk membuat bawahan-bawahan saya merasa senang hatinya apabila mereka berbicara dengan saya. | Saya menyukai penggunaan dari skala penggajian karyawan. | 8 | 4 |
| 61 | Saya percaya bahwa kenaikan jabatan adalah semata-mata berdasarkan kemampuan yang ada. | Saya merasa bahwa masalah-masalah yang timbul di antara para karyawan biasanya akan dapat diselesaikan di antara mereka sendiri, tanpa campur tangan dari saya. | 8 | 5 |
| 62 | Saya merasa bahwa Serikat-Serikat Buruh dan pimpinan perusahaan adalah bekerja untuk mencapai tujuan-tujuan yang sama. | Di dalam diskusi, saya memberikan fakta-fakta seperti apa yang mereka pahami, dan membiarkan mereka melukiskan kesimpulan-kesimpulan mereka sendiri. | 8 | 6 |
| 63 | Bila seorang karyawan tidak sanggup menyelesaikan tugasnya, saya akan membantu dia untuk menyelesaikan tugas tersebut. | Saya merasa bahwa semua karyawan pada jabatan yang sama seharusnya memperoleh gaji yang sama. | 8 | 7 |
| 64 | Saya mengijinkan bawahan-bawahan saya untuk ikut serta di dalam pengambilan keputusan, tetapi sayapun menyediakan sesuatu yang jitu untuk membuat keputusan terakhir. | Saya tidak akan ragu-ragu untuk mempekerjakan pegawai-pegawai yang cacat jasmaninya, bilamana saya merasa bahwa dia dapat mempelajari pekerjaannya. | 8 | 8 |

---

## 5. Sistem Skoring — Tahap demi Tahap

Implementasi persis: fungsi `matchMsdtAnswer()` dan blok pemrosesan di `handleMsdtFile()` pada `src/pages/msdt.js`.

### 5.1 Tahap 1 — Pencocokan Jawaban per Soal (`matchMsdtAnswer`)

Untuk tiap satu dari 64 soal, nilai sel jawaban dicocokkan dengan algoritma bertingkat:

1. **Normalisasi:** lowercase + trim. Kosong/`null`/`undefined` → tidak cocok.
2. **Literal huruf:** jika nilai sel persis `"a"` atau `"b"` → langsung dipakai sebagai hasil match. **(Fitur ini tidak ada di PAPI Kostick — MSDT lebih permisif menerima jawaban berupa huruf tunggal.)**
3. **Exact match** teks lengkap terhadap `pernyataan_a`/`pernyataan_b` soal tersebut.
4. **Substring fallback** dua arah (teks jawaban adalah bagian dari pernyataan resmi, atau sebaliknya).
5. **Word-overlap fallback** (voting token kata > 2 huruf, dimenangkan oleh pernyataan dengan overlap lebih banyak).
6. Jika semua gagal → `null` (soal dianggap tidak terjawab).

### 5.2 Tahap 2 — Membangun Grid 8×8

```
grid[baris][kolom] = 'a' | 'b' | null
baris = floor((nomor_soal - 1) / 8)
kolom = (nomor_soal - 1) % 8
```
`totalJawaban` dihitung dari jumlah sel grid yang berhasil terisi (bukan null).

### 5.3 Tahap 3 — Hitung Raw Count A & B per Dimensi

Untuk tiap dimensi ke-*n* (n = 0..7, urutan `Ds, Mi, Au, Co, Bu, Dv, Ba, E`):
```
rawCounts[n].a = jumlah 'a' pada grid[n][semua kolom]      (baca satu BARIS penuh)
rawCounts[n].b = jumlah 'b' pada grid[semua baris][n]      (baca satu KOLOM penuh)
```

### 5.4 Tahap 4 — Skor per Dimensi (dengan Koreksi Tetap)

```
skor[dimensi] = rawCounts[dimensi].a + rawCounts[dimensi].b + koreksi[dimensi]
```

**Tabel Koreksi Tetap** (nilai ini adalah konstanta kalibrasi resmi instrumen, tidak boleh diubah):

| Dimensi | Kode | Koreksi |
|---|---|---|
| Deserter | Ds | +1 |
| Missionary | Mi | +2 |
| Autocrat | Au | +1 |
| Compromiser | Co | 0 |
| Bureaucrat | Bu | +3 |
| Developer | Dv | −1 |
| Benevolent Autocrat | Ba | 0 |
| Executive | E | −4 |

> Catatan: karena `rawA + rawB` selalu bernilai antara 0–8 (total jawaban dalam satu baris/kolom, meski dalam praktiknya bisa kurang dari 8 jika ada jawaban tidak terbaca), skor dimensi murni tanpa koreksi umumnya berkisar 0–8, ditambah/dikurangi konstanta koreksi di atas.

### 5.5 Tahap 5 — Hitung 4 Skor Orientasi

```
TO (Task Orientation)         = skor[Au] + skor[Co] + skor[Ba] + skor[E]
RO (Relationship Orientation) = skor[Mi] + skor[Co] + skor[Dv] + skor[E]
E  (Effectiveness)            = skor[Bu] + skor[Dv] + skor[Ba] + skor[E]
O  (Deserter check / Overall) = skor[Ds]           (tidak digabung dengan dimensi lain, tidak dikonversi)
```

### 5.6 Tahap 6 — Konversi Skor Orientasi (TO, RO, E saja — bukan O)

```
convertOrientation(val):
  val < 30        → 0.0
  30 ≤ val ≤ 31    → 0.6
  val = 32        → 1.2
  val = 33        → 1.8
  val = 34        → 2.4
  val = 35        → 3.0
  36 ≤ val ≤ 37    → 3.6
  val ≥ 38        → 4.0
```

Kategori: **nilai konversi > 2 → Tinggi**; **≤ 2 → Rendah**. Karena tabel konversi di atas, ini secara praktis berarti **hanya skor orientasi mentah ≥ 35 yang masuk kategori Tinggi**.

### 5.7 Tahap 7 — Tentukan Hasil Akhir (Matriks 8 Kombinasi)

Hasil akhir **bukan** dimensi dengan skor tertinggi — melainkan ditentukan murni dari kombinasi kategori (Tinggi/Rendah) ketiga orientasi TO, RO, E:

| TO | RO | E | → Hasil Akhir |
|---|---|---|---|
| Tinggi | Tinggi | Tinggi | **E — Executive** |
| Tinggi | Tinggi | Rendah | **Co — Compromiser** |
| Tinggi | Rendah | Tinggi | **Ba — Benevolent Autocrat** |
| Tinggi | Rendah | Rendah | **Au — Autocrat** |
| Rendah | Tinggi | Tinggi | **Dv — Developer** |
| Rendah | Tinggi | Rendah | **Mi — Missionary** |
| Rendah | Rendah | Tinggi | **Bu — Bureaucrat** |
| Rendah | Rendah | Rendah | **Ds — Deserter** (default) |

**Contoh perhitungan (dari dokumen patch, diverifikasi konsisten dengan kode):**
Peserta "Ujang Widi Wasmoto" — skor dimensi: Ds=12, Mi=8, Au=8, Co=6, Bu=6, Dv=8, Ba=11, E=7.
- TO = Au+Co+Ba+E = 8+6+11+7 = **32** → konversi 1,2 → **Rendah**
- RO = Mi+Co+Dv+E = 8+6+8+7 = **29** → konversi 0,0 → **Rendah**
- E = Bu+Dv+Ba+E = 6+8+11+7 = **32** → konversi 1,2 → **Rendah**
- Kombinasi Rendah-Rendah-Rendah → **Hasil akhir: Ds (Deserter)**
- *Meski Ba=11 adalah skor dimensi tertinggi secara mentah, hasil akhirnya tetap Ds* — ini adalah inti dari logika patch: dominasi skor mentah tunggal **tidak** menentukan hasil akhir.

### 5.8 Validasi Kelengkapan

```
isValid = (totalJawaban === 64)
```
Jika tidak lengkap, peserta ditandai badge peringatan **"⚠️ {totalJawaban} Jawaban"** di ringkasan dan alert di halaman detail ("Data tidak lengkap (harus 64)"). Laporan tetap diproses dengan data yang tersedia.

---

## 6. Kamus 8 Gaya Manajemen (Narasi Interpretasi)

Narasi lengkap dipakai untuk mendeskripsikan **hasil akhir** (`finalResult` dari Tahap 7), sumber: `TYPE_DESCRIPTIONS` di `msdt.js`.

### E — Executive
Gaya ini dianggap efektif karena dapat mengelola dengan baik antara tugas dan hubungan. Model ini adalah sisi efektif dari gaya kompromis. Pola yang dilakukan dapat mengintegrasikan antara tugas dan hubungan dengan baik, mengelola dan memanfaatkan kedua aspek dengan sinergi yang optimal. Pendekatan ini dapat dikatakan sebagai pendekatan konsultatif, interaktif dan pemecah masalah. Pendekatan ini memanfaatkan eksplorasi terhadap berbagai sumber daya, keragaman informasi dan dapat memanfaatkan isu negatif menjadi dorongan untuk hasil yang lebih optimal. Gaya ini melibatkan tim dalam perencanaan dan mengambil kesimpulan. Komunikasi dilakukan terhadap bawahan untuk meningkatkan kualitas informasi yang dapat menjadikan keputusan lebih baik.

### Co — Compromiser
Mengandalkan tugas dan relasi yang seimbang, namun dianggap kurang efektif karena tidak berpendirian tetap, tidak ada keputusan yang jelas. Gaya ini akan merasa kebingungan antara pengaturan tugas dan kebutuhan untuk berinteraksi. Dalam menghadapi tekanan, maka akan cenderung kompromi sehingga berbagai tujuan seringkali menyimpang dan tidak tercapai.

### Ba — Benevolent Autocrat
Gaya ini dianggap efektif karena memberikan unsur komunikatif dalam melakukan gaya otokratik. Gaya ini masih mengandalkan instruksi dan intervensi. Skor tinggi dapat dilihat sebagai guru dalam memberi tugas, dimana dapat memberikan instruksi dengan tidak mengesampingkan komunikasi kepada bawahan secara lebih fleksibel. Pola yang dilakukan memberikan kesediaan untuk bertanya, membantu apabila ada hal yang dianggap salah atau menyimpang. Pola keseharian terstruktur dalam menentukan target kerja, produktivitas dan memberi perintah, tidak ragu memberikan hukuman namun bertindak adil dalam menyikapinya. Gaya ini dapat bekerjasama dengan baik namun menghindari hubungan keterdekatan antar personal.

### Au — Autocrat
Lebih perhatian hanya pada produktivitas dan hasil. Memberikan tugas ke bawahan berdasarkan instruksi dan mengawasi secara ketat proses yang terjadi. Kesalahan tidak bisa ditolerir, penyimpangan harus dihindari. Kebijakan adalah urusan atasan sementara bawahan cukup melaksanakan apa yang harus dikerjakan tanpa ada alasan.

### Dv — Developer
Gaya manajemen developer adalah sisi efektif dari gaya missionary. Tujuan dari gaya seperti ini adalah untuk bertindak secara profesional tanpa mengesampingkan aspek emosi. Bawahan diberikan kesempatan untuk memberikan ide, pandangan atau peran lebih dari kebijakan yang ada untuk mengembangkan potensi. Kontribusi diberikan dan perhatian untuk pengembangan pun diperhatikan. Skor tinggi memiliki keyakinan optimis tentang individu untuk bekerja dan menghasilkan. Sifat pendekatan berupa kolegial, bawahan sebagai partner bukan hanya sebagai "pembantu" dalam mengerjakan sesuatu. Gaya seperti ini senang untuk berbagi pengetahuan dan keahlian dan potensi bawahan dapat dioptimalkan.

### Mi — Missionary
Menggunakan unsur afektif yang sangat kental. Missionary berupaya mendorong situasi positif dalam manajemen dengan memberikan kandungan sensitivitas, kepedulian dan hal-hal yang mungkin dianggap penting untuk meningkatkan kinerja melalui sentuhan emosi/perasaan. Model manajerial seperti ini berupaya menjaga orang lain termasuk bawahan pada situasi bahagia dalam situasi apapun. Gaya ini dikatakan kurang efektif karena kurang ketersediaannya peluang konflik, berupaya tetap halus dalam bertindak dan kesulitan untuk menolak atau berkata tidak, padahal banyak pekerjaan perlu ketegasan dalam manajemen.

### Bu — Bureaucrat
Prosedural, berdasarkan aturan atau tata pelaksanaan, menerima dengan tulus hirarki kewenangan dan menggunakan komunikasi sangat formal dalam bersikap. Birokrat berpegang pada sistem, gaya manajemen seperti ini tampak seperti otokrat, kaku dan dapat membosankan bagi orang-orang yang fleksibel.

### Ds — Deserter
Suka mengabaikan masalah, cuci tangan, tidak mau bertanggung jawab (laisser-faire). Tipe gaya ini mengabaikan berbagai keterlibatan atau intervensi yang dapat menjadikan situasi dianggap sulit atau rumit. Sikapnya selalu mencoba netral terhadap apa yang terjadi di keseharian, mencari jalan untuk menghindar dari aturan yang dianggap menyulitkan. Pola yang tampak secara manajerial adalah defensif, misalkan ada kebijakan yang menyulitkan bawahan maka ia mengatakan saya hanya menjalankan perintah, kebijakan dari atasan. Bukan berarti pola seperti ini buruk, deserter hanya berupaya menjaga keadaan status-quo dan menghindari perubahan drastis atau "guncangan dalam manajemen".

### Ringkasan Deskripsi Singkat per Dimensi (untuk tabel skor)

| Kode | Nama | Deskripsi Ringkas |
|---|---|---|
| Ds | Deserter | Gaya melepaskan diri / laisser-faire |
| Mi | Missionary | Gaya penolong / missionary |
| Au | Autocrat | Gaya otokrat / autocrat |
| Co | Compromiser | Gaya kompromis / compromiser |
| Bu | Bureaucrat | Gaya birokrat / bureaucrat |
| Dv | Developer | Gaya pembangun / developer |
| Ba | Benevolent Autocrat | Gaya otokrat bijak / benevolent autocrat |
| E | Executive | Gaya eksekutif / executive |

---

## 7. Struktur & Konten Laporan (Detail View / PDF)

Laporan per peserta tersusun sebagai berikut, sesuai `renderDetailView()` dan `msdtGeneratePDFHTML()`:

### A. Header Identitas (Hero Section)
- Nama Lengkap
- Jenis Kelamin
- Tanggal Lahir
- **Total Jawaban** ditampilkan menonjol di kanan atas: `{totalJawaban} / 64`, hijau jika lengkap, kuning jika tidak (disertai teks "Data tidak lengkap (harus 64)").

### B. Kartu 4 Skor Orientasi
Empat kartu berdampingan menampilkan **angka mentah** (bukan nilai konversi/kategori Tinggi-Rendah):
- Task Orientation (TO)
- Relationship Orientation (RO)
- Effectiveness (E)
- Deserter check / Overall (O)

> **Catatan UX:** meskipun sistem menyimpan nilai konversi (`TO_conv`, `RO_conv`, `E_conv`) dan kategorinya (`catTO`, `catRO`, `catE`) di data hasil, kartu ini **hanya menampilkan angka mentah orientasi**, bukan nilai konversi maupun label Tinggi/Rendah yang sesungguhnya menentukan hasil akhir. Pengguna laporan tidak bisa melihat secara langsung *mengapa* hasil akhirnya adalah gaya tertentu tanpa melakukan konversi manual sendiri menggunakan tabel Bagian 5.6 — lihat pembahasan lebih lanjut di Catatan & Riwayat Versi.

### C. Profil Grafis 8 Dimensi (Bar Chart)
Bar horizontal untuk seluruh 8 dimensi (urutan tetap Ds, Mi, Au, Co, Bu, Dv, Ba, E), masing-masing menampilkan:
- Kode + nama dimensi
- Badge **"Dominan"** khusus pada dimensi yang menjadi **hasil akhir** (bukan otomatis dimensi skor tertinggi — lihat Bagian 5.7)
- Skor akhir (raw A + raw B + koreksi)
- Bar dengan lebar proporsional (dibagi basis 16 sebagai estimasi skala maksimum praktis)

### D. Tabel Skor Lengkap
Kolom: Kode, Dimensi + deskripsi ringkas, Jumlah A, Jumlah B, Koreksi, Skor Akhir — untuk seluruh 8 dimensi, dengan baris hasil akhir (`dominantType`) diberi highlight latar belakang.

### E. Interpretasi Gaya Manajemen
Kartu narasi untuk **hasil akhir** (`r.dominantType`, yang berisi satu kode gaya hasil Tahap 7) — judul **"🏆 Gaya Dominan: {Nama} ({Kode})"** diikuti deskripsi lengkap dari kamus Bagian 6.

> Meskipun secara struktur data `dominantType` adalah array (mendukung multi-tipe seandainya ada seri/tie), logika Tahap 7 di kode aktual **selalu menghasilkan tepat satu kode** (`finalResult`) karena penentuannya berbasis kombinasi kategori tetap, bukan pembandingan skor mentah yang bisa seri.

### F. Footer Laporan (khusus versi PDF)
- Judul dokumen: **"LAPORAN MSDT"**
- Catatan promosi kontak (Coach Alifya)
- Disclaimer kerahasiaan: *"Laporan ini bersifat rahasia dan hanya untuk keperluan asesmen."*

### G. Fitur Unduh & Ekspor
- **Unduh PDF** per peserta (`html2pdf`, format A4 potrait).
- **Unduh Semua (ZIP)** — seluruh peserta dikemas jadi satu file ZIP berisi PDF per orang.
- **Export Rekapitulasi (CSV)** — satu baris per peserta, kolom: Nama, Jenis Kelamin, Tanggal Lahir, skor 8 dimensi (`Ds,Mi,Au,Co,Bu,Dv,Ba,E`), TO, RO, E, O(Ds), Tipe Dominan (hasil akhir), Total Jawaban, status Valid.

### H. Navigasi
- Ringkasan (tabel semua peserta: No, Nama + badge peringatan jika tidak lengkap, L/P, Tipe Dominan, kolom TO/RO/E/O, tombol Detail) → klik baris untuk ke Detail.
- Di halaman Detail: tombol Sebelumnya/Berikutnya untuk berpindah antar peserta.

---

## 8. Format File Input (Teknis)

- Ekstensi: `.xlsx`, `.xls`, atau `.csv`.
- Pencarian baris header: dicek pada 20 baris pertama — baris pertama dengan sel berisi kata "nama" **atau** pola nomor soal pertama (`/^1(?:\.|\s|$)/`) dianggap header.
- Deteksi kolom awal soal: header yang cocok `/(?:^|\b)1(?:\.|\s|$)/` (lebih longgar dari PAPI — memakai word-boundary `\b`, bukan hanya awal string).
- Validasi tambahan (lebih longgar dari PAPI): dicari header soal ke-64 (`/^64(?:\.|\s|$)/`); jika tidak ditemukan **dan** sisa kolom setelah kolom soal-1 kurang dari 10, file ditolak dengan pesan *"Format kolom tidak terdeteksi sebagai template MSDT yang valid."* — berbeda dari PAPI yang memvalidasi keberadaan kolom soal terakhir secara lebih ketat.
- Deteksi kolom identitas: Nama `/nama\s*(lengkap)?/i`, Jenis kelamin `/kelamin|gender|sex|l\/p/i`, Tanggal lahir `/tanggal\s*lahir|tgl\s*lahir|lahir|birth/i`.
- **Fallback nama:** sel pertama berisi teks di antara kolom sebelum blok soal (kecuali index 0/Timestamp); default `"Kandidat {nomor baris}"`.
- Tanggal lahir mendukung `Date` Excel, serial number Excel, atau string apa adanya.

---

## Catatan & Riwayat Versi

MSDT memiliki riwayat dokumentasi paling kompleks di antara alat tes yang sudah didokumentasikan — ada **draft awal** (`prompt_msdt.md`) yang kemudian **dikoreksi total** oleh **patch** (`prompt_msdt_patch_konversi.md`) pada bagian paling krusial: cara menentukan hasil akhir.

| Aspek | Draft Awal (`prompt_msdt.md`) | Patch (`prompt_msdt_patch_konversi.md`) | Implementasi Aktual (`msdt.js`) |
|---|---|---|---|
| Penentuan hasil akhir | **Tipe dominan = dimensi dengan skor JUMLAH tertinggi** di antara 8 dimensi; jika seri, sebutkan semua | **Dihapus total**, diganti: konversi TO/RO/E ke skala 0–4 → kategori Tinggi/Rendah → matriks 8 kombinasi → 1 hasil akhir | Mengikuti **patch** — fungsi `convertOrientation()` dan blok `if/else if` matriks 8 kombinasi persis seperti spesifikasi patch |
| Tampilan output "Tipe Dominan" | Field tunggal berdasar skor tertinggi | Diganti tabel "Konversi Orientasi" yang menampilkan skor, nilai konversi, dan kategori Tinggi/Rendah untuk TO/RO/E, baru lalu hasil akhir | **Sebagian diimplementasikan**: data konversi (`TO_conv`, `RO_conv`, `E_conv`, `catTO`, `catRO`, `catE`) dihitung dan disimpan, **tapi UI laporan (kartu orientasi & PDF) hanya menampilkan angka mentah TO/RO/E/O**, tidak menampilkan tabel konversi/kategori yang diminta patch — lihat catatan UX di Bagian 7.B |
| Field `dominantType` | Bisa berisi >1 kode jika ada dimensi seri nilai tertinggi | Konsepnya diganti "hasil akhir tunggal" | Tetap bernama `dominantType` (array), tapi **selalu berisi tepat 1 elemen** (`[finalResult]`) — nama variabel adalah sisa peninggalan draft lama, isinya sudah mengikuti logika patch |
| Deskripsi 8 tipe | Sedikit berbeda redaksional (versi lebih ringkas) dari draft ke kode | — | Kode memakai versi deskripsi **lebih panjang dan detail** (identik dengan yang dijabarkan di Bagian 6 dokumen ini), bukan versi ringkas di badan utama draft |

**Kesimpulan:** Implementasi aktual mengikuti **logika patch** untuk penentuan hasil akhir (bukan draft awal) — ini sudah benar dan terverifikasi lewat contoh perhitungan "Ujang Widi Wasmoto" yang cocok persis. Namun ada **gap transparansi** antara data yang dihitung dan yang ditampilkan: pengguna laporan tidak bisa melihat nilai konversi maupun kategori Tinggi/Rendah TO/RO/E secara langsung di UI atau PDF, padahal itulah yang sesungguhnya menentukan hasil akhir — mereka hanya melihat angka mentah orientasi dan kesimpulan akhirnya. Ini berpotensi membingungkan pengguna yang mencoba memverifikasi manual mengapa seseorang mendapat hasil tertentu (seperti pada contoh Ba=11 tertinggi tapi hasil akhir Ds). **Rekomendasi:** tambahkan kolom/baris "Nilai Konversi" dan "Kategori" pada tampilan kartu orientasi maupun tabel PDF, agar transparansi perhitungan sesuai maksud patch sepenuhnya tercapai di lapisan presentasi, bukan hanya di lapisan data.

---

## Sumber Dokumen

- `src/pages/msdt.js` — implementasi aktual (skoring, pencocokan jawaban, konversi, render, PDF, ekspor).
- `zlainnya/prompt_msdt.md` — draft spesifikasi awal (kunci 64 soal, 8 dimensi, koreksi tetap — bagian ini konsisten dengan kode; logika hasil akhir sudah digantikan patch).
- `zlainnya/prompt_msdt_patch_konversi.md` — patch koreksi logika hasil akhir (konversi orientasi + matriks 8 kombinasi — bagian ini yang diikuti kode).
