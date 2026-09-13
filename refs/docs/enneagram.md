# Enneagram — Dokumentasi Lengkap Alat Tes

> Dokumen ini merangkum **persis apa yang berjalan di aplikasi** (`src/pages/enneagram.js`, `src/data/enneagram_mapping.json`, `src/data/enneagram_interpretasi.json`, `src/data/enneagram_wings.json`), dicocokkan dengan dokumen spesifikasi (`files/enneagram_prompt_antigravity.md`). **Ada satu penyimpangan signifikan** antara draft dan kode pada cara pencocokan kolom jawaban — lihat [Catatan & Riwayat Versi](#catatan--riwayat-versi) sebelum menggunakan modul ini untuk data produksi.

---

## 1. Ringkasan Alat Tes

- **Nama:** Enneagram — model kepribadian 9 tipe klasik (dengan sistem "wing"/sayap).
- **Jumlah soal:** 180 pernyataan, masing-masing dijawab dengan skala **0–3**.
- **Format respons:** skala tingkat kesesuaian 4 poin: **0 = tidak sama sekali, 1 = agak, 2 = cukup baik, 3 = sangat baik**.
- **Dimensi yang diukur:** 9 tipe kepribadian (Tipe 1–9), masing-masing terdiri dari **tepat 20 pernyataan** (20 × 9 = 180).
- **Output tambahan:** selain tipe dominan, sistem juga menghitung **wing** (sayap) — satu dari dua tipe tetangga pada lingkaran Enneagram yang mewarnai tipe dominan.
- **Output laporan:** skor 9 tipe (0–60 tiap tipe), tipe dominan (atau status seri bila ada lebih dari satu skor tertinggi sama), wing (bila berlaku), narasi interpretasi tipe inti + wing, dan laporan PDF per peserta.
- **Sumber input:** Google Form → diekspor jadi file Excel/CSV → diupload ke halaman Enneagram di aplikasi.

---

## 2. Instruksi Pengerjaan

Instruksi yang seharusnya ditampilkan ke peserta (melalui Google Form, sebelum diproses aplikasi):

1. Terdapat 180 pernyataan tentang diri Anda.
2. Untuk setiap pernyataan, beri nilai seberapa sesuai pernyataan itu dengan diri Anda, memakai skala:
   - **0** = Tidak sama sekali sesuai
   - **1** = Agak sesuai
   - **2** = Cukup sesuai
   - **3** = Sangat sesuai
3. Jawablah berdasarkan bagaimana diri Anda umumnya, bukan pada situasi khusus tertentu.
4. Tidak ada jawaban benar/salah — jawaban dengan nilai lebih tinggi pada suatu tipe menunjukkan resonansi yang lebih besar dengan pola pikir/perilaku tipe tersebut.

**Instruksi ke Admin/HR (di halaman upload aplikasi):**
- Upload file Excel (`.xlsx`/`.xls`) atau CSV hasil export Google Form.
- Kolom nama/email peserta dicari secara otomatis di antara **kolom indeks 1 sampai 6** (kolom B–G, 0-indexed) — bila tidak ditemukan, sistem memakai kolom indeks 2 (kolom C) sebagai default.
- **180 kolom jawaban dianggap mulai dari kolom indeks 7 (kolom H) dan seterusnya**, diambil berurutan sesuai urutan yang ada di `enneagram_mapping.json` — **bukan** dicocokkan berdasarkan teks pernyataan (lihat peringatan penting di Bagian 4.1 dan Catatan Riwayat Versi).
- Setiap sel jawaban harus berisi angka **0, 1, 2, atau 3**.
- Tersedia tombol **"Unduh Template Excel"**.

---

## 3. Daftar Lengkap 180 Pernyataan (Item Bank Resmi)

Sumber: `enneagram_mapping.json`. Setiap tipe (1–9) memiliki **tepat 20 pernyataan**. Urutan tabel di bawah **adalah urutan posisi kolom yang dipakai mesin skoring** (kolom H = pernyataan No. 1, kolom I = No. 2, dst.) — lihat Bagian 4.1 mengapa urutan ini krusial.

| No | Tipe | Pernyataan |
|---|---|---|
| 1 | 3 | Saya suka ide melibatkan pasangan intim saya dalam kehidupan kerja saya, jadi kami tidak berpisah. |
| 2 | 9 | Kebanyakan orang melihat saya lebih damai daripada yang sebenarnya. |
| 3 | 4 | Saya sering merasakan kerinduan tanpa benar-benar tahu mengapa. |
| 4 | 7 | Keinginan saya untuk berpikir positif terkadang bisa seperti kecanduan. |
| 5 | 5 | Memiliki ruang pribadi adalah kebutuhan, bukan kemewahan. |
| 6 | 3 | Bertemu deadline saya lebih penting daripada mendapatkan setiap detail kecil tepat. |
| 7 | 6 | Perasaan takut saya kurang kuat ketika saya memiliki proyek untuk dikerjakan. |
| 8 | 4 | Saya bisa merangkul sisi manis dari kesedihan. |
| 9 | 8 | Aku adalah kekuatan yang harus diperhitungkan. |
| 10 | 8 | Ketidakjujuran saya kadang-kadang bisa melenyapkan orang. |
| 11 | 2 | Saya benci meminta bantuan, meskipun saya suka memberikannya. |
| 12 | 2 | Saya merasa sulit untuk menahan ketika datang untuk menawarkan bantuan dan saran. |
| 13 | 3 | Menjadi pemenang membuat usaha saya berharga. |
| 14 | 9 | Berada di alam sangat menenangkanku. |
| 15 | 9 | Aku bisa marah ketika semuanya menjadi terlalu rumit. |
| 16 | 6 | Membuat orang lain tertawa membantu saya merasa lebih tenang dan kurang cemas. |
| 17 | 4 | Situasi emosional yang kuat membuat saya merasa benar-benar hidup. |
| 18 | 7 | Saya suka melakukan sesuatu yang baru, bukan hal yang sama. |
| 19 | 2 | Saya bangga dengan cara saya membuat orang merasa nyaman. |
| 20 | 7 | Saya suka melakukan banyak hal sehingga mudah untuk menyebarkan diri terlalu kurus. |
| 21 | 3 | Keinginan saya untuk mencapai tidak mengenal batas. |
| 22 | 4 | Bahkan ketika saya terlihat diterima oleh suatu kelompok, sulit untuk merasa bahwa saya benar-benar milik. |
| 23 | 9 | Saya bisa keras kepala dengan cara yang menghindari konfrontasi langsung. |
| 24 | 8 | Orang mengatakan saya memiliki aura yang kuat. |
| 25 | 8 | Saya bisa membuat peraturan dan menegakkannya. |
| 26 | 2 | Sulit untuk tidak menangis ketika saya merasa sentimental, bahkan ketika saya berada di depan umum. |
| 27 | 1 | Saya bisa merasa kesal karena tidak ada alasan khusus. |
| 28 | 9 | Saya mampu menciptakan keharmonisan di lingkungan saya. |
| 29 | 8 | Saya mencari orang-orang yang tidak dapat melihat diri mereka sendiri. |
| 30 | 4 | Menemukan tujuan hidup saya berarti segalanya bagi saya. |
| 31 | 5 | Saya lebih suka memikirkan masalah sebelum bertindak. |
| 32 | 6 | Belajar untuk menegaskan diri memberi saya kepercayaan diri dan mengurangi kecemasan saya. |
| 33 | 9 | Saya tidak bisa membantu tetapi melihat kedua sisi dari hampir semua pertanyaan. |
| 34 | 2 | Saya merasa tidak nyaman berbicara dengan orang-orang yang tampaknya tidak terlibat secara emosional. |
| 35 | 9 | Saya ingin membuat hidup sederhana dan tidak rumit. |
| 36 | 6 | Mempertahankan hubungan dekat dengan teman dan keluarga membantu saya merasa aman di dunia yang kacau. |
| 37 | 6 | Meskipun saya dapat dengan mudah membayangkan panik dalam krisis, ketika keadaan darurat yang sebenarnya datang, saya melakukannya dengan sangat baik. |
| 38 | 2 | Saya jauh lebih dari hati orang daripada kepala orang. |
| 39 | 1 | Mendapatkan pekerjaan yang dilakukan dengan benar lebih penting daripada menyelesaikan pekerjaan dengan cepat. |
| 40 | 5 | Saya suka membaca terlebih dahulu sebelum mencoba beberapa aktivitas baru. |
| 41 | 4 | Saya lebih menghargai orisinalitas daripada sukses. |
| 42 | 4 | Sesuai dengan norma kelompok tidak memungkinkan saya untuk mengungkapkan siapa diri saya sebenarnya. |
| 43 | 4 | Saya merasa sulit untuk menanggung aspek-aspek kehidupan yang menumpulkan hati dan membunuh jiwa. |
| 44 | 2 | Tidak ada yang saya nikmati seperti membuat perkenalan dan membantu orang saling mengenal satu sama lain. |
| 45 | 1 | Sebagai seorang anak, saya lebih serius dan realistis daripada banyak anak lain. |
| 46 | 9 | Detail masa kecil saya terkadang tampak kabur dan jauh. |
| 47 | 1 | Tidak ada yang lebih kritis terhadap saya daripada saya sendiri. |
| 48 | 9 | Saya sering merasa sulit untuk mencapai sesuatu tanpa terganggu oleh tugas-tugas lain. |
| 49 | 6 | Iman dan kepercayaan itu sulit bagiku, karena aku meragukan hal-hal yang tampaknya diterima sebagian besar orang. |
| 50 | 6 | Perhatian saya terlalu mudah pergi ke skenario terburuk, bahkan ketika mereka tidak mungkin terjadi. |
| 51 | 3 | Saya cenderung membuat diri saya begitu sibuk dengan pekerjaan sehingga tidak ada banyak waktu untuk duduk dan merenung. |
| 52 | 5 | Saya terkadang dilihat oleh orang lain sebagai tidak responsif secara sosial. |
| 53 | 7 | Saya merasakan dorongan untuk melarikan diri ketika saya mendarat dalam situasi yang membutuhkan komitmen emosional. |
| 54 | 6 | Saya cenderung menghormati atau menentang otoritas. |
| 55 | 1 | Saya suka berkonsentrasi pada satu hal pada satu waktu dan tidak menghargai gangguan. |
| 56 | 3 | Terkadang sulit untuk membedakan antara gambar yang saya proyeksikan dan orang yang ada di dalam saya. |
| 57 | 6 | Saya selalu sadar akan aturan yang harus saya ikuti, apakah saya memilih untuk menyesuaikan dengan mereka atau melanggarnya. |
| 58 | 7 | Saya optimis tentang banyak hal. |
| 59 | 6 | Sulit untuk tidak merasa gugup saat bertemu orang baru. |
| 60 | 2 | Saya tidak dapat membayangkan kehidupan tanpa banyak kenalan dan kontak sosial saya. |
| 61 | 2 | Naluri pertama saya selalu membantu orang, apakah mereka memintanya atau tidak. |
| 62 | 8 | Orang-orang melihat saya sebagai pemimpin alami. |
| 63 | 9 | Dalam situasi kelompok, saya biasanya lebih suka berbaur, daripada mengambil pimpinan atau keberatan suara. |
| 64 | 9 | Memiliki rutinitas sehari-hari membantu saya tetap di jalur dan menyelesaikan berbagai hal. |
| 65 | 8 | Saya tidak perlu membuktikan apa pun kepada siapa pun. |
| 66 | 1 | Sebagai orang tua atau wali, saya lebih ketat daripada permisif. |
| 67 | 3 | Saya bekerja keras untuk berhasil karena kegagalan bukanlah pilihan. |
| 68 | 6 | Saya lebih bersedia daripada banyak orang untuk melakukan pekerjaan "menggerutu" pada proyek kelompok. |
| 69 | 4 | Menjadi orang yang autentik lebih berarti bagiku daripada kesuksesan materi. |
| 70 | 7 | Saya memiliki begitu banyak ide berdengung di kepala saya sehingga sulit untuk mengerjakannya satu per satu. |
| 71 | 6 | Saya adalah karyawan yang sangat andal, setia, dan mantap. |
| 72 | 9 | Seringkali saya merasa bahwa pendapat pribadi saya tidak begitu penting untuk diskusi kelompok. |
| 73 | 3 | Saya sangat sadar akan kesan yang saya buat pada orang lain. |
| 74 | 2 | Kebanggaan adalah kekuatan terbesar saya dan kelemahan terbesar saya. |
| 75 | 3 | Meluangkan waktu untuk hubungan bisa jadi sulit karena jadwal sibuk saya. |
| 76 | 2 | Memberi, peduli, dan berbagi sangat berarti bagiku. |
| 77 | 9 | Mendengarkan dengan tidak sopan datang dengan mudah bagi saya. |
| 78 | 7 | Ide sering datang kepada saya seperti kilatan petir. |
| 79 | 6 | Saya memiliki banyak energi gugup dan imajinasi yang terlalu aktif. |
| 80 | 4 | Ketidaktahuan emosi benar-benar menggangguku. |
| 81 | 2 | Saya bisa sangat terbelit oleh keprihatinan saya terhadap orang lain. |
| 82 | 8 | Saya memiliki kekuatan untuk mengambil tugas yang akan mengalahkan orang yang lebih lemah. |
| 83 | 4 | Emosi mendalam saya adalah sumber daya kreatif terbesar saya. |
| 84 | 2 | Ini sangat memalukan untuk dikritik publik. |
| 85 | 1 | Orang yang tidak menganggap serius sesuatu mengganggu saya. |
| 86 | 3 | Tidak ada yang memotivasi saya seperti pencapaian yang tinggi. |
| 87 | 8 | Mengendalikan amarah saya sangat sulit. |
| 88 | 1 | Saya disebut perfeksionis, meskipun saya merasa tidak sempurna. |
| 89 | 2 | Karena saya melakukan banyak hal untuk orang lain, saya terkadang merasa berhak atas perlakuan khusus. |
| 90 | 3 | Pengakuan publik sangat berarti bagi saya. |
| 91 | 7 | Saya cenderung melihat orang lain sebagai sederajat. |
| 92 | 1 | Saya ingin memastikan bahwa saya memenuhi standar perilaku tinggi saya sendiri. |
| 93 | 4 | Ketika saya beresonansi dengan seseorang, itu bukan pada tingkat yang dangkal. |
| 94 | 2 | Penting bagi saya untuk menjadi pendengar yang simpatik dan teman yang mendukung. |
| 95 | 7 | Saya menghargai makanan yang baik, perusahaan yang baik, dan kehidupan yang baik. |
| 96 | 6 | Terkadang melakukan pelanggaran adalah satu-satunya cara untuk menaklukkan rasa takut. |
| 97 | 2 | Saya sangat tertarik dengan pekerjaan kemanusiaan dengan orang atau hewan. |
| 98 | 7 | Kegembiraan alami saya biasanya membuat saya tidak terjebak dalam emosi yang berat. |
| 99 | 2 | Saya adalah pemelihara alami. |
| 100 | 9 | Saya biasanya menikmati mengendap-endap dan kehilangan diri sendiri dalam tugas-tugas kecil kehidupan sehari-hari. |
| 101 | 5 | Saya adalah pengamat yang cermat terhadap orang dan situasi. |
| 102 | 4 | Meskipun saya ingin diterima, saya benci gagasan penyesuaian tanpa berpikir. |
| 103 | 1 | Ketika saya peduli dengan orang lain, saya ingin memperbaiki perilaku mereka. |
| 104 | 7 | Tidak terlalu menyenangkan hanya melakukan satu aktivitas dalam satu waktu. |
| 105 | 8 | Ketika saya berjalan di ruangan penuh orang, saya langsung merasakan siapa yang bertanggung jawab. |
| 106 | 5 | Saya senang mencari solusi yang cerdik untuk masalah yang tidak biasa. |
| 107 | 5 | Saya menemukan tampilan umum emosi tidak menarik. |
| 108 | 8 | Saya mengambil sesuatu secara pribadi dan tidak peduli siapa yang mengetahuinya. |
| 109 | 9 | Kebanyakan orang menganggap saya tidak menghakimi dan santai. |
| 110 | 1 | Menjunjung tinggi etika dan prinsip sangat penting bagi saya. |
| 111 | 4 | Menerjemahkan visi batin saya ke dalam karya seni dapat menjadi sangat menarik. |
| 112 | 3 | Saya dapat menyesuaikan pakaian dan perilaku saya dengan kebutuhan situasi. |
| 113 | 7 | Saya mencoba membuka opsi saya. |
| 114 | 3 | Saya dapat mengabaikan emosi yang menyakitkan untuk menyelesaikan pekerjaan. |
| 115 | 5 | Game dapat membuat saya terpesona. |
| 116 | 4 | Berada di lingkungan yang plastik dan impersonal hanya menguras kehidupan langsung dari saya. |
| 117 | 5 | Saya suka mempelajari pola yang rumit dan konsep yang rumit. |
| 118 | 1 | Saya memiliki kritik batin yang sangat aktif. |
| 119 | 9 | Kadang-kadang sulit untuk memenuhi kebutuhan pribadi saya sendiri. |
| 120 | 1 | Saya merasa sulit untuk tidak menghakimi orang terlalu keras. |
| 121 | 6 | Rumah dan keluarga saya memberi saya tempat berlindung yang aman di dunia yang tidak aman. |
| 122 | 8 | Kata-kata saya adalah ikatan saya. |
| 123 | 9 | Toleransi datang dengan mudah bagi saya. |
| 124 | 8 | Saya tidak keberatan memberikan cinta yang kuat ketika dibutuhkan. |
| 125 | 1 | Saya merasa cukup bersalah ketika saya marah tanpa pembenaran. |
| 126 | 5 | Saya cenderung tidak taat ketika orang mendorong reaksi emosional. |
| 127 | 5 | Ketika saya menyukai seni, sering ada sesuatu yang aneh atau tidak biasa. |
| 128 | 9 | Kenyamanan yang familier memberi saya rasa damai. |
| 129 | 6 | Saya jarang menerima ide yang tidak bertahan dalam ujian waktu. |
| 130 | 5 | Kadang-kadang butuh waktu untuk emosi saya untuk mengejar pikiran saya. |
| 131 | 8 | Saya adalah ketua di lingkaran teman-teman saya. |
| 132 | 8 | Merasa rentan membuatku menggeliat. |
| 133 | 5 | Saya tidak peduli dengan gangguan ketika saya mencoba memikirkan masalah. |
| 134 | 2 | Teman-teman menggambarkan saya sebagai orang yang hangat, romantis, dan penuh kasih sayang. |
| 135 | 3 | Lebih dari segalanya, saya adalah tipe orang yang "bisa melakukan". |
| 136 | 5 | Tidak sulit untuk berhati-hati jika diperlukan. |
| 137 | 1 | Teman-teman terkadang mengatakan bahwa saya terlalu keras untuk diri sendiri. |
| 138 | 1 | Saya menjadi tegang atau kritis lebih mudah daripada kebanyakan orang. |
| 139 | 3 | Berada di mata publik adalah sesuatu yang biasanya saya nikmati. |
| 140 | 8 | Saya selalu melindungi apa milik saya. |
| 141 | 7 | Sudah menjadi sifat saya untuk mencari hal baru, bukan rutinitas. |
| 142 | 4 | Saya sangat sensitif dengan suasana hati orang lain. |
| 143 | 3 | Apapun yang saya lakukan, saya selalu berusaha melebihi yang terbaik dari diri saya. |
| 144 | 6 | Saya sangat setia kepada orang-orang yang telah mendapatkan kepercayaan saya. |
| 145 | 5 | Saya seorang pemikir sistem yang dapat memisahkan pikiran dari emosi. |
| 146 | 8 | Saya adalah orang yang selamat alami, dan persediaan saya ditimbun untuk membuktikannya! |
| 147 | 7 | Saya sering dapat memilih ide "keluar dari udara." |
| 148 | 7 | Ketika saya dihalau, itu membantu saya menjalankan rencana yang ada, bukan hanya mengembangkan yang baru. |
| 149 | 4 | Saya tahu bagaimana rasanya mengalami kesepian yang intens. |
| 150 | 1 | Dalam hubungan yang intim, saya sering mengalami perasaan cemburu, meskipun saya tidak menyetujui mereka. |
| 151 | 3 | Prestasi dan pengakuan memberi tahu saya bahwa saya menargetkan sasaran saya. |
| 152 | 7 | Saya pandai membuat orang tertawa, karena saya cepat tanggap dan tidak menganggap diri saya terlalu serius. |
| 153 | 6 | Saya menggunakan "radar batin" saya untuk menggerakkan motif orang lain dan memutuskan apakah aman untuk memercayai mereka atau tidak. |
| 154 | 5 | Saya menghargai pertukaran intelektual lebih dari berbagi secara emosional. |
| 155 | 7 | Saya merasa terkejut dengan proyek-proyek inovatif atau ide-ide visioner. |
| 156 | 1 | Kata-kata "harus" dan "seharusnya" muncul banyak dalam pemikiran saya. |
| 157 | 4 | Banyak orang menganggap saya terlalu emosional atau dramatis. |
| 158 | 5 | Saya sering menjadi ahli dalam topik yang saya pelajari. |
| 159 | 4 | Sendirian memungkinkan saya untuk berhubungan dengan diri saya yang terdalam. |
| 160 | 5 | Saya lebih terpisah daripada emosional. |
| 161 | 2 | Saya bersedia berkorban untuk berada dalam hubungan. |
| 162 | 8 | Saya memiliki selera besar dan keinginan "lebih besar dari hidup". |
| 163 | 3 | Istilah "Tipe A kepribadian" diciptakan dengan saya dalam pikiran. |
| 164 | 8 | Jika saya masuk ke grup yang tidak memiliki pemimpin, saya akan bertanggung jawab. |
| 165 | 1 | Terkadang saya merasa seperti akan meledak. |
| 166 | 6 | Saya bisa menjadi penindas kejam yang menempel untuk diunggulkan. |
| 167 | 5 | Pembicaraan kecil tidak banyak bermanfaat bagi saya. |
| 168 | 2 | Merasa dihargai sangat berarti bagiku. |
| 169 | 3 | Membuat kesan yang baik itu penting bagiku. |
| 170 | 1 | Mengetahui saya benar mengambil tepi dari ketegangan yang saya rasakan. |
| 171 | 9 | Keputusan pribadi yang besar dapat melumpuhkan saya. |
| 172 | 7 | Saya alami suka bermain, suka bersenang-senang, dan berjiwa bebas. |
| 173 | 6 | Kadang-kadang lebih mudah untuk langsung menghadapi ketakutan saya daripada membiarkan imajinasi saya menjadi liar. |
| 174 | 3 | Saya seorang pemain tim yang hebat. |
| 175 | 5 | Saya secara mental keluar ketika saya kekurangan waktu sendirian. |
| 176 | 7 | Pikiran saya cepat, tetapi tidak terlalu menyeluruh. |
| 177 | 9 | Sangat mudah untuk membiarkan teman-teman saya memutuskan bagaimana kita menghabiskan waktu bersama. |
| 178 | 4 | Saya mudah mengidentifikasi dengan luka yang telah saya terima dalam hidup. |
| 179 | 8 | Saya mengambil tindakan ketika orang lain masih mencoba memilah perasaan mereka. |
| 180 | 7 | Kebebasan lebih berarti bagi saya daripada hampir apa pun. |

---

## 4. Sistem Skoring — Tahap demi Tahap

Implementasi persis: fungsi `processEnneagramCSV()` pada `src/pages/enneagram.js`.

### 4.1 Tahap 1 — Deteksi Kolom (Berbasis Posisi, BUKAN Teks)

```
nameColIdx = 2  (default)
untuk i = 1..6: jika header[i] mengandung "nama" atau "email" → nameColIdx = i

statementsCols = []
qIdx = 0
untuk i = 7 .. (jumlah_kolom - 1):
    jika qIdx < 180:
        statementsCols[qIdx] = { idx: i, tipe: mappingData[qIdx].tipe }
        qIdx++
```

Artinya: kolom jawaban ke-1 di file **selalu** dipasangkan dengan entri pertama `enneagram_mapping.json` (pernyataan No. 1, Tipe 3), kolom ke-2 dengan entri kedua (No. 2, Tipe 9), dan seterusnya — **murni berdasarkan posisi kolom**, tanpa membaca atau mencocokkan isi teks header sama sekali.

> ⚠️ **Ini adalah penyimpangan paling signifikan dari draft spesifikasi.** Lihat penjelasan lengkap di [Catatan & Riwayat Versi](#catatan--riwayat-versi).

### 4.2 Tahap 2 — Akumulasi Skor per Tipe

Untuk tiap dari 180 kolom jawaban:
```
val = Number(nilai_sel)
jika isNaN(val) atau val < 0 atau val > 3:
    val = 0   (nilai tidak valid didiam-diamkan menjadi 0, tanpa peringatan ke pengguna)
scores[tipe_kolom_tsb] += val
```
Skor akhir tiap tipe berkisar **0–60** (20 item × skor maksimum 3 per item).

### 4.3 Tahap 3 — Penentuan Tipe Dominan (dengan Penanganan Seri)

```
maxScore = skor tertinggi di antara scores[1..9]
dominanArr = semua tipe yang skornya == maxScore
```
- Jika `dominanArr` berisi **lebih dari 1 tipe** (seri/tie) → `tipeDominan = "Tipe X & Tipe Y"` (digabung dengan " & "), dan **tidak ada wing** yang dihitung.
- Jika `dominanArr` berisi **tepat 1 tipe** → `tipeDominan` = nomor tipe tersebut (angka), lanjut ke Tahap 4 untuk menghitung wing.

### 4.4 Tahap 4 — Penentuan Wing (Hanya Jika Tipe Dominan Tunggal)

Wing ditentukan dari **dua tipe tetangga** pada lingkaran Enneagram (`1→2→3→4→5→6→7→8→9→1`):

| Tipe Dominan | Tetangga (kandidat wing) |
|---|---|
| 1 | 9, 2 |
| 2 | 1, 3 |
| 3 | 2, 4 |
| 4 | 3, 5 |
| 5 | 4, 6 |
| 6 | 5, 7 |
| 7 | 6, 8 |
| 8 | 7, 9 |
| 9 | 8, 1 |

```
n1, n2 = dua tetangga tipe dominan
jika scores[n1] > scores[n2]:  wing = "{dominan}w{n1}"
jika scores[n2] > scores[n1]:  wing = "{dominan}w{n2}"
jika scores[n1] == scores[n2]: wing = null (tidak ditentukan, seri antar tetangga)
```

### 4.5 Tidak Ada Validasi Kelengkapan/Peringatan ke Pengguna

Berbeda dari DISC/PAPI/MSDT/MBTI, modul ini **tidak menampilkan peringatan apapun** terkait:
- Nilai jawaban di luar rentang 0–3 (didiam-diamkan jadi 0)
- Baris/kolom jawaban yang kosong
- Tingkat kecocokan kolom terhadap 180 mapping (draft memintanya, lihat Bagian 11 draft — tidak diimplementasikan)

Satu-satunya pengecekan data adalah memastikan baris memiliki **setidaknya satu** sel terisi di rentang kolom jawaban (`hasData`), agar baris kosong dilewati.

---

## 5. Kamus 9 Tipe Inti Enneagram

Sumber: `enneagram_interpretasi.json`.

### Tipe 1 — Perfeksionis (The Reformer)
Tipe kepribadian ini adalah tipe orang yang sulit menerima dirinya ketika ia melakukan sebuah kesalahan. Tipe perfeksionis ini memiliki standar yang tinggi terhadap sesuatu, kepribadian perfeksionis dimotivasi oleh kebutuhan untuk menjalani hidup dengan benar, sesuai dengan standar yang ia miliki. Ia merasa harus memperbaiki diri serta lingkungan di sekitarnya. Tipe ini adalah orang yang sangat memegang etika serta bisa diandalkan. Mereka merasa akan gagal jika ia tidak bisa mengontrol situasi dimana ia memikul tanggungjawab disitu. Mereka seringkali mendapat kepercayaan untuk menjadi pucuk pimpinan pada sebuah organisasi, sangat produktif dan amat bijaksana. Orang perfeksionis biasanya juga amat idealis ketika memilih sesuatu.
**Ciri-ciri:** Memiliki standar tinggi, Idealis, Bijaksana, Produktif, Minim membuat kesalahan, Obsesif kompulsif (kelainan yang ditandai dengan pikiran dan ketakutan tidak masuk akal/obsesi yang dapat menyebabkan perilaku repetitif/kompulsi).

### Tipe 2 — Penolong (The Helper)
Tipe penolong adalah tipe manusia yang sangat murah hati dan senang memberikan pertolongan kepada orang lain. Namun belum tentu apa yang ia lakukan itu benar-benar tulus ingin menolong — bisa jadi karena merasa tidak enak untuk menolak. Tergerak oleh motivasi terhadap kebutuhan untuk dicintai, dihargai, juga untuk mengekspresikan perasaan positif mereka kepada orang lain. Seorang tipe penolong memiliki sifat mengasihi, perhatian, berwawasan luas, murah hati, antusias, dan amat peka terhadap apa yang orang lain rasakan. Orang dengan tipe ini adalah orang yang amat menyenangkan dan mudah bergaul, pandai membina relasi pertemanan, serta tahu apa yang orang lain butuhkan.
**Ciri-ciri:** Murah hati, Suka menolong orang lain, Peka terhadap perasaan orang lain, Sosial, Sedikit Manipulatif (kemampuan memanipulasi berkaitan dengan kecerdasan seseorang; ciri khasnya enggan menerima kenyataan dan mengalihkan kesalahan pada pihak lain).

### Tipe 3 — Pengejar Prestasi (The Achiever / Motivator / Performer)
Tipe pemburu prestasi adalah tipe kepribadian yang digerakkan oleh kebutuhan untuk menjadi terus produktif. Tipe ini memiliki ambisi besar meraih kesuksesan, sebisa mungkin menghindari kegagalan (terutama terkait pekerjaan), dan secara natural sangat optimis. Ia sangat yakin tidak ada rintangan yang tidak bisa dihancurkan; semua rintangan adalah batu ujian. Terkadang akan melakukan segala cara untuk meraih kesuksesan — kompetitif dan bisa menjadi sangat manipulatif, memperdaya orang lain agar memuluskan jalannya menuju tujuan yang ia rancang.
**Ciri-ciri:** Produktif, Ambisius, Optimis, Kompetitif, Senang berbagi, Manipulatif.

### Tipe 4 — Romantis / Artist / Individualist (The Melancholy)
Sering disebut *the individualist* — orang yang tenggelam dalam perasaannya sendiri, mengamini serta memaklumi berbagai hal yang ia alami dalam hidup dengan amat dalam. Melankolis ini seringkali merasa tidak ada yang bisa memahami apa yang ia rasakan; seperti berjalan sendirian. Gemar mencari makna hidup, menghindari citra diri yang datar, dan ingin menjadi seseorang yang tidak biasa/eksentrik — tidak mainstream di lingkungannya. Memiliki hati yang amat halus, sehingga sulit melihat hal-hal yang mengerikan atau tindakan yang amat keji.
**Ciri-ciri:** Perasaannya halus, Moody, Dalam, Menyukai seni, Ekspresif, Depresif.

### Tipe 5 — Pengamat / Observer / Thinker (The Investigator)
Seorang yang memiliki rasa ingin tahu yang tinggi, ingin memahami dunia di sekitarnya — ibarat peneliti atau detektif, mencari data dan mengumpulkan cerita untuk menjawab pertanyaan dalam dirinya. Memiliki kepekaan tinggi terhadap lingkungan dan sesamanya; lewat pengamatan yang tajam, bisa menyimpulkan jawaban dari sebuah fenomena tanpa harus banyak bertanya. Sangat analitis dan memiliki tingkat intelektualitas yang tinggi — tepat untuk memetakan permasalahan dan mencari alternatif jawaban yang masuk akal.
**Ciri-ciri:** Rasa ingin tahu tinggi, Analitis, Objektif, Problem solver, Keras kepala, Argumentatif, Tidak mau mendengar pendapat orang.

### Tipe 6 — Pencemas (The Sceptic) / Loyalist / Pessimist
Orang yang selalu menginginkan rasa aman dalam hidupnya; sering merasa cemas karena tidak bisa mengontrol segala hal yang mungkin terjadi. Sulit memasrahkan hidup pada alam semesta atau orang lain, cenderung tidak mudah percaya. Namun ia adalah orang yang setia, amat perhatian dan hangat, serta senang membantu orang lain. Mudah khawatir dan tidak nyaman jika suatu masalah belum benar-benar selesai — perlu menjadi saksi sendiri atas penyelesaiannya, cenderung terus mengontrol dan mengecek ulang. Umumnya memiliki komitmen kuat terhadap sesuatu yang sudah ia pegang.
**Ciri-ciri:** Insecure (perasaan tidak aman), Terlalu khawatir, Tidak mudah percaya, Komitmen kuat, Setia, Bertanggung jawab.

### Tipe 7 — Petualang (The Enthusiast) / Generalist / Optimist / Adventure
Tipe orang yang tidak bisa diam, energinya begitu menggebu. Motivasinya adalah mencapai kehidupan yang gembira dan setiap hari bisa melakukan kegiatan yang menyenangkan — membuatnya cepat bosan dan tidak tahan berada pada satu tempat/kegiatan yang sama terus-menerus. Menyenangkan, spontan, tidak pernah membosankan sebagai teman — selalu ada hal menyenangkan yang bisa dilakukan bersamanya. Amat imajinatif dan antusias jika melakukan kegiatan yang sesuai kata hatinya.
**Ciri-ciri:** Cepat bosan, Spontan, Menyenangkan, Imajinatif, Tidak konsisten, Tidak disiplin, Tidak fokus.

### Tipe 8 — Pejuang (The Challenger) / Leader / Boss / Protector / Intimidator
Tipe manusia yang tidak mudah menyerah, memiliki semangat baja dan pengendalian diri yang luar biasa. Tidak ingin orang lain melihat kelemahannya; amat mandiri, tidak ingin bergantung pada orang lain, dan amat percaya diri dengan kemampuannya — yakin segala sesuatu bisa ia kerjakan sendiri. Namun cenderung otoriter dan ingin menguasai orang lain; tidak bisa diperintah atau dikendalikan orang lain. Bertipe pemberontak, tidak suka berada dalam sistem yang represif, dan kurang sensitif terhadap orang-orang di sekitarnya serta hal-hal yang bersifat artifisial/"jaga image".
**Ciri-ciri:** Tidak mudah menyerah, Semangat baja, Mandiri, Percaya diri, Otoriter, Tidak sensitif, Kurang memiliki sifat empati.

### Tipe 9 — Pendamai (The Mediator) / Peacemaker / Mediator / Accomodator
Tipe manusia yang tidak suka konflik; amat menjaga kedamaian dirinya serta orang-orang di sekitarnya. Jika harus memilih antara dua pihak yang berselisih, akan berusaha mengambil jalan tengah agar tidak ada yang tersinggung. Sebagai teman, ia amat menyenangkan, sabar, dan diplomatis — selalu mencari kata-kata yang tidak menyakiti lawan bicara. Namun cenderung pasif, pemalu, dan tidak lantang berbicara atau memulai gerakan — didorong oleh sikap apatis, lebih suka tidak mau tahu atau berada dalam posisi berbahaya, cenderung cari aman.
**Ciri-ciri:** Tidak suka konflik, Diplomatis, Sabar, Apresiatif, Pendengar yang baik, Pasif, Cari aman, Pelupa.

---

## 6. Kamus 18 Kombinasi Wing

Sumber: `enneagram_wings.json`. Setiap tipe (kecuali kasus seri) memiliki 2 kemungkinan wing dari tetangganya.

| Kode | Label | Deskripsi Singkat | Ciri-ciri |
|---|---|---|---|
| **1w9** | Perfeksionis yang Tenang | Memadukan standar tinggi Tipe 1 dengan ketenangan dan penerimaan Tipe 9. Lebih sabar dan tidak reaktif dibanding 1w2, idealis namun mampu menerima ketidaksempurnaan dengan lapang. Bijak, filosofis, jarang mengungkapkan kemarahan langsung. | Bijaksana, Sabar, Idealis namun fleksibel, Tenang dalam konflik, Menghindari konfrontasi, Perfeksionis yang tidak kaku |
| **1w2** | Perfeksionis yang Peduli | Memadukan standar tinggi Tipe 1 dengan kehangatan Tipe 2. Lebih ekspresif secara emosional dibanding 1w9, terdorong memperbaiki dunia dengan fokus pada orang lain — sering jadi mentor/guru/aktivis yang berprinsip sekaligus hangat. | Berprinsip kuat, Hangat dan peduli, Suka membimbing, Kritis namun suportif, Aktif di bidang sosial/pendidikan, Emosional namun terstruktur |
| **2w1** | Penolong yang Berprinsip | Memadukan kebutuhan membantu Tipe 2 dengan idealisme Tipe 1. Bantuan lebih terstruktur dan berbasis nilai, terdorong rasa "benar untuk membantu". Lebih kritis dan perfeksionis dibanding 2w3. | Murah hati, Berprinsip, Suka membimbing, Perfeksionis dalam membantu, Aktif di bidang kemanusiaan, Kadang kritis |
| **2w3** | Penolong yang Ambisius | Memadukan kehangatan Tipe 2 dengan ambisi dan kesadaran citra Tipe 3. Lebih energik, karismatik, berorientasi hasil dibanding 2w1 — senang membantu sambil membangun jaringan sosial luas. | Karismatik, Energik, Suka jaringan sosial, Ambisius dalam membantu, Sadar citra, Pandai membaca kebutuhan orang |
| **3w2** | Pencapai yang Berjiwa Sosial | Memadukan dorongan berprestasi Tipe 3 dengan kepedulian Tipe 2. Lebih ramah, empatik, berorientasi tim dibanding 3w4 — pemimpin karismatik yang disukai banyak orang. | Karismatik, Ramah, Berorientasi tim, Ambisius namun empatik, Sadar citra, Termotivasi pengakuan publik |
| **3w4** | Pencapai yang Kreatif | Memadukan ambisi Tipe 3 dengan kedalaman emosional Tipe 4. Lebih introspektif dan artistik dibanding 3w2 — ingin sukses secara autentik dan bermakna, menonjol di seni/desain/hiburan. | Ambisius, Kreatif, Introspektif, Ingin sukses autentik, Sensitif estetika, Terjebak antara ambisi dan idealisme |
| **4w3** | Individualis yang Ambisius | Memadukan kedalaman emosional Tipe 4 dengan dorongan Tipe 3. Lebih ekstrover dan berorientasi pengakuan dibanding 4w5 — ingin ekspresi keunikan sekaligus apresiasi dunia luar. | Ekspresif, Kreatif, Ambisius, Butuh pengakuan, Sensitif, Ekstrover dibanding Tipe 4 umumnya |
| **4w5** | Individualis yang Kontemplatif | Memadukan kedalaman emosional Tipe 4 dengan ketenangan analitis Tipe 5. Lebih introspektif, tertutup, mandiri dibanding 4w3 — kreatif namun suka berkarya dalam kesendirian. | Introspektif, Mandiri, Sangat kreatif, Suka kesendirian, Visi artistik mendalam, Sulit membuka diri emosional |
| **5w4** | Pengamat yang Kreatif | Memadukan pikiran analitis Tipe 5 dengan sensitivitas emosional Tipe 4. Lebih ekspresif, imajinatif, terhubung seni dibanding 5w6 — pemikir mendalam sekaligus kreatif. | Analitis, Kreatif, Imajinatif, Sangat mandiri, Orisinal, Suka seni dan ilmu sekaligus |
| **5w6** | Pengamat yang Loyal | Memadukan pikiran analitis Tipe 5 dengan kewaspadaan Tipe 6. Lebih praktis, terstruktur, berorientasi sistem dibanding 5w4 — ahli teknis/ilmiah/sistemik. | Analitis, Sistematis, Loyal, Praktis, Dapat diandalkan, Ahli bidang teknis/ilmiah |
| **6w5** | Pencemas yang Analitis | Memadukan kewaspadaan Tipe 6 dengan kemandirian analitis Tipe 5. Lebih tertutup, mandiri, bergantung fakta dibanding 6w7 — mencari rasa aman lewat pengetahuan, kurang butuh validasi sosial. | Kritis, Analitis, Mandiri, Mencari aman via pengetahuan, Waspada, Kurang butuh validasi sosial |
| **6w7** | Pencemas yang Ramah | Memadukan kewaspadaan Tipe 6 dengan keceriaan Tipe 7. Lebih ekstrover, hangat, humoris dibanding 6w5 — mencari rasa aman lewat hubungan sosial/komunitas. | Setia, Hangat, Humoris, Mencari aman via komunitas, Ekstrover, Mudah cemas namun menyenangkan |
| **7w6** | Petualang yang Bertanggung Jawab | Memadukan semangat Tipe 7 dengan loyalitas Tipe 6. Lebih setia, kooperatif, dapat diandalkan dibanding 7w8 — masih cinta petualangan namun mempertimbangkan dampak pada orang lain. | Antusias, Setia, Kooperatif, Dapat diandalkan, Suka hal baru, Mempertimbangkan dampak sosial |
| **7w8** | Petualang yang Asertif | Memadukan semangat Tipe 7 dengan ketegasan Tipe 8. Lebih asertif, berani, berorientasi kekuasaan dibanding 7w6 — ingin mengontrol pengalaman hidupnya, berani ambil risiko besar. | Asertif, Berani, Energik, Suka risiko besar, Karismatik, Berorientasi kontrol atas pengalaman hidup |
| **8w7** | Pejuang yang Ekspansif | Memadukan kekuatan Tipe 8 dengan antusiasme dan visi Tipe 7. Lebih ekspansif, optimis, visioner dibanding 8w9 — berenergi tinggi, pengusaha/pemimpin penuh semangat. | Kuat, Visioner, Ekspansif, Optimis, Gemar risiko, Pemimpin penuh semangat |
| **8w9** | Pejuang yang Tenang | Memadukan kekuatan Tipe 8 dengan ketenangan Tipe 9. Lebih tenang, stabil, protektif dibanding 8w7 — kekuatan tidak ditampilkan terang-terangan tapi terasa dalam kehadirannya yang berwibawa. | Kuat, Tenang, Stabil, Protektif, Berwibawa, Pelindung diam yang diandalkan |
| **9w8** | Pendamai yang Tegas | Memadukan kedamaian Tipe 9 dengan kekuatan Tipe 8. Lebih percaya diri, asertif, kadang keras kepala dibanding 9w1 — menghindari konflik namun bisa tegas bila diprovokasi. | Tenang, Tegas bila perlu, Percaya diri, Keras kepala, Pelindung sabar, Menghindari konflik namun tidak lemah |
| **9w1** | Pendamai yang Berprinsip | Memadukan kedamaian Tipe 9 dengan idealisme Tipe 1. Lebih idealis, terorganisir, berorientasi nilai dibanding 9w8 — bijak, sabar, penuh empati, mendambakan harmoni berdasar keadilan. | Bijaksana, Idealis, Sabar, Berprinsip, Empatik, Mendambakan harmoni yang adil dan bermakna |

---

## 7. Struktur & Konten Laporan (Detail View / PDF)

Laporan per peserta tersusun sebagai berikut, sesuai `renderDetailView()` pada `enneagram.js`:

### A. Header Identitas & Hasil Utama
- Nama peserta.
- Label tipe dominan besar: **"Tipe {n} ({nama dari kamus})"**, atau **"Tipe X & Tipe Y"** bila seri.
- Label wing (bila ada): **"Wing: {kode} — {label}"**.

### B. Grafik Skor 9 Tipe (Bar Chart)
Bar horizontal untuk kesembilan tipe (urutan tetap 1–9), masing-masing menampilkan:
- Nama tipe singkat (mis. "T1 Perfeksionis")
- Skor `x / 60`
- Bar dengan lebar = (skor/60) × 100%, warna aksen untuk tipe dominan, abu-abu untuk sisanya

### C. Interpretasi Tipe Dominan
- **Kasus tipe tunggal:** satu kartu berisi nama tipe, deskripsi lengkap, dan ciri-ciri dari kamus Bagian 5.
- **Kasus seri:** kartu terpisah untuk **setiap** tipe yang seri di posisi tertinggi, ditampilkan berurutan.

### D. Interpretasi Wing (jika ada)
Kartu tambahan (border hijau, terpisah dari kartu tipe inti) berisi label wing, deskripsi, dan ciri-ciri dari kamus Bagian 6. **Tidak muncul** bila hasilnya seri (karena wing tidak dihitung untuk kasus seri) atau bila kedua tetangga tipe dominan skornya sama persis.

### E. Footer Laporan (khusus versi PDF, disisipkan dinamis)
- Header PDF: logo + "PsikoScoring CNA" + judul "Laporan Enneagram" + tanggal cetak.
- Footer PDF: *"Hasil ini bersifat konfidensial. Dibuat dengan PsikoScoring CNA Group."*
- Pola teknis sama seperti MBTI (elemen header/footer disembunyikan di layar, dimunculkan sesaat sebelum `html2pdf()` dipanggil).

### F. Fitur Unduh & Ekspor
- **Unduh PDF** per peserta (`html2pdf`, margin dalam mm, format A4 potrait) — berfungsi normal.
- **Tombol "Download Semua (ZIP)" ada di UI, tapi hanya menampilkan alert**: *"Fungsi download batch ZIP belum diaktifkan (memerlukan implementasi jszip). Silakan download PDF per peserta."* — **fitur ini secara fungsional belum berjalan**, meski tombolnya sudah ditampilkan ke pengguna seolah tersedia.
- **Tidak ada** fitur export CSV/Excel rekapitulasi di halaman ringkasan.

### G. Navigasi
- Ringkasan (tabel semua peserta: No, Nama, Tipe Dominan, Wing, Skor Tertinggi, tombol Detail) → klik baris untuk ke Detail.
- Di halaman Detail: tombol Sebelumnya/Berikutnya untuk berpindah antar peserta.

---

## 8. Format File Input (Teknis)

- Ekstensi: `.xlsx`, `.xls`, atau `.csv` — validasi dari nama file, bukan isi/MIME.
- Baris pertama = header, tapi header **hanya dipakai untuk mendeteksi kolom nama/email** (dicari di kolom indeks 1–6); isi header di atas kolom jawaban (indeks 7 ke atas) **tidak pernah dibaca**.
- 180 kolom jawaban = kolom indeks 7 sampai (7+179), diambil apa adanya sesuai urutan file.
- Tidak ada deteksi kolom gender/tanggal lahir/tujuan tes seperti tes-tes lain — field yang dikumpulkan hanya `nama`.
- Baris tanpa data numerik apapun di rentang kolom jawaban dilewati (`hasData` check).

---

## Catatan & Riwayat Versi

Dibandingkan dengan `files/enneagram_prompt_antigravity.md` (draft spesifikasi), implementasi aktual konsisten pada **algoritma skoring inti** (20 item/tipe, maks 60, aturan wing dari tetangga, penanganan seri di level tipe dominan), tapi memiliki **satu penyimpangan besar** dan beberapa fitur yang tidak terealisasi:

| Aspek | Draft (`enneagram_prompt_antigravity.md`) | Implementasi Aktual (`enneagram.js`) |
|---|---|---|
| **Cara mencocokkan kolom jawaban ke tipe** | **Eksplisit diminta mencocokkan berdasarkan TEKS HEADER KOLOM** ke `pernyataan` di `enneagram_mapping.json` (dengan fuzzy match untuk toleransi spasi/tanda baca), karena draft mengantisipasi *"Urutan pernyataan di GForm bisa berbeda dari urutan di data mapping (GForm bisa mengacak)"* | **Murni berbasis posisi kolom** (kolom ke-N = mapping entri ke-N), tidak pernah membaca isi header sama sekali. Fungsi `fuzzyMatch()` yang seharusnya melakukan pencocokan teks **sudah ditulis di kode tapi tidak pernah dipanggil** (dead code) — persis skenario yang ditakutkan draft: bila Google Form produksi mengacak urutan pertanyaan (fitur umum di Google Form untuk mencegah contek-menyontek), **seluruh hasil skoring akan salah secara diam-diam** tanpa ada indikasi error apapun ke pengguna |
| Validasi nilai di luar rentang 0–3 | Diminta pesan error: *"Nilai tidak valid ditemukan di baris Y, kolom Z"* | **Tidak ada peringatan** — nilai di luar rentang otomatis dianggap 0 tanpa pemberitahuan |
| Validasi tingkat kecocokan mapping (<90%) | Diminta warning: *"Hanya X/180 pernyataan teridentifikasi. Hasil mungkin tidak akurat."* | **Tidak relevan/tidak diimplementasikan** karena sistem tidak pernah mencoba mencocokkan teks (selalu "cocok" 180/180 secara posisional, terlepas dari benar-tidaknya) |
| Kolom identitas yang dikumpulkan | Nama/Email, Timestamp (untuk tanggal tes) | **Hanya Nama/Email** — tidak ada penangkapan Timestamp/tanggal tes sama sekali |
| Unduh Semua PDF (batch) | Diminta sebagai fitur fungsional | **Tombol ada, tapi hanya menampilkan alert "belum diaktifkan"** — fitur tidak benar-benar berjalan |
| Export Excel/CSV rekapitulasi | Tidak diminta eksplisit di draft ini (berbeda dari MBTI) | Konsisten — juga tidak ada di kode |
| Preview performa batch >100 peserta dalam <3 detik | Disebut sebagai target performa | Tidak ada pengukuran/pengujian eksplisit terlihat di kode, namun karena pemrosesan sederhana (murni akumulasi angka, tanpa fuzzy matching) kemungkinan besar tetap cepat |

**Kesimpulan — risiko paling penting:** Modul Enneagram ini **hanya akan menghasilkan skor yang benar jika urutan 180 kolom jawaban pada file Google Form produksi persis sama** dengan urutan di `enneagram_mapping.json` (Bagian 3 dokumen ini). Draft spesifikasi secara eksplisit mengantisipasi risiko pengacakan urutan soal oleh Google Form dan meminta pencocokan berbasis teks sebagai mitigasi — namun mitigasi ini **tidak pernah diimplementasikan secara aktif** meski kerangka fungsinya (`fuzzyMatch`) sudah tertulis di kode. **Rekomendasi kuat:** sebelum dipakai untuk asesmen sungguhan, pastikan pengaturan Google Form **tidak mengacak urutan pertanyaan** ("Shuffle question order" harus OFF), atau — lebih baik lagi — aktifkan pemanggilan `fuzzyMatch()` pada tahap deteksi kolom sebagai pengaman, mengikuti maksud asli draft.

---

## Sumber Dokumen

- `src/pages/enneagram.js` — implementasi aktual (skoring berbasis posisi, render, PDF).
- `src/data/enneagram_mapping.json` — peta 180 pernyataan ke tipe 1–9 (urutan posisi = urutan skoring).
- `src/data/enneagram_interpretasi.json` — deskripsi & ciri 9 tipe inti.
- `src/data/enneagram_wings.json` — deskripsi & ciri 18 kombinasi wing.
- `files/enneagram_prompt_antigravity.md` — draft spesifikasi (meminta pencocokan berbasis teks header — **tidak** diikuti kode; sisanya konsisten).
