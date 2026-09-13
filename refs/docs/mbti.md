# MBTI (Myers-Briggs Type Indicator) — Dokumentasi Lengkap Alat Tes

> Dokumen ini merangkum **persis apa yang berjalan di aplikasi** (`src/pages/mbti.js`, `src/data/mbti_data.js`, `src/data/mbti_mapping.json`), dicocokkan dengan dokumen spesifikasi (`zlainnya/prompt_mbti_psikoscoring.md`). **Keterbatasan penting:** berbeda dari DISC/PAPI/RIASEC/MSDT, teks lengkap ke-70 butir soal (kalimat pernyataan A dan B) **tidak tersimpan** di manapun dalam kode aplikasi — yang tersedia hanya kamus pencocokan jawaban (fragmen teks pilihan) dan posisi soal. Lihat [Catatan & Riwayat Versi](#catatan--riwayat-versi) untuk detail dan implikasinya.

---

## 1. Ringkasan Alat Tes

- **Nama:** MBTI (Myers-Briggs Type Indicator) — versi adaptasi 70 soal forced-choice yang umum dipakai di asesmen psikometri korporat Indonesia.
- **Jumlah soal:** 70 soal, tersusun dalam **10 blok × 7 soal per blok**.
- **Format respons:** *forced-choice berpasangan* — tiap soal punya 2 pilihan (**A** dan **B**), peserta memilih salah satu.
- **Dimensi yang diukur:** 4 pasangan kutub kepribadian: **E**xtraversion vs **I**ntroversion, **S**ensing vs i**N**tuition, **T**hinking vs **F**eeling, **J**udging vs **P**erceiving → menghasilkan salah satu dari **16 tipe kepribadian**.
- **Output:** tipe MBTI 4-huruf, persentase kecenderungan tiap 4 pasangan dimensi, status validitas (Valid/Kurang Lengkap/Tidak Valid berdasar jumlah soal tak terjawab), narasi deskripsi + saran pengembangan + saran profesi, dan laporan PDF per peserta.
- **Sumber input:** Google Form → diekspor jadi file Excel/CSV → diupload ke halaman MBTI di aplikasi.

---

## 2. Instruksi Pengerjaan

Instruksi yang seharusnya ditampilkan ke peserta (melalui Google Form, sebelum diproses aplikasi):

1. Terdapat 70 nomor, masing-masing berisi **2 pilihan** (A dan B).
2. Untuk setiap nomor, pilih **satu (1)** pilihan yang **lebih menggambarkan diri Anda**, meskipun keduanya sama-sama terasa relevan.
3. Jawablah berdasarkan kecenderungan alami/spontan Anda, bukan berdasarkan situasi tertentu saja.
4. Tidak ada jawaban benar/salah.
5. Usahakan menjawab seluruh 70 nomor — soal yang tidak dijawab akan dihitung sebagai **TD (Tidak Dijawab)** dan memengaruhi validitas hasil (lihat Bagian 4.4).

**Instruksi ke Admin/HR (di halaman upload aplikasi):**
- Upload file Excel (`.xlsx`/`.xls`) atau CSV hasil export Google Form.
- File harus memiliki **70 kolom jawaban berturut-turut** berisi huruf **A** atau **B** (atau teks pilihan lengkap — lihat Bagian 4.3).
- Kolom identitas (Nama, Jenis Kelamin, Tanggal/Timestamp, Tujuan/Posisi) dideteksi otomatis dari **8 kolom pertama** file berdasarkan nama header.
- Sistem selalu mengambil **70 kolom TERAKHIR** pada sheet sebagai kolom jawaban, apapun isi headernya — mirip prinsip Big Five (deteksi berbasis posisi, bukan nama kolom).
- Tersedia tombol **"Unduh Template Excel"**.

---

## 3. Struktur 70 Soal: 10 Blok × 7 Posisi

Sama seperti MSDT, soal MBTI di sini tersusun dalam blok-blok tersembunyi. Berbeda dari MSDT (yang membaca baris DAN kolom silang), MBTI cukup membaca **posisi soal dalam bloknya** untuk menentukan dimensi:

| Posisi dalam Blok (1–7) | Nomor Soal Global (di 10 blok) | Dimensi yang Diukur | Jumlah Item |
|---|---|---|---|
| 1 | 1, 8, 15, 22, 29, 36, 43, 50, 57, 64 | **E / I** | 10 |
| 2, 3 | 2,3, 9,10, 16,17, 23,24, 30,31, 37,38, 44,45, 51,52, 58,59, 65,66 | **S / N** | 20 |
| 4, 5 | 4,5, 11,12, 18,19, 25,26, 32,33, 39,40, 46,47, 53,54, 60,61, 67,68 | **T / F** | 20 |
| 6, 7 | 6,7, 13,14, 20,21, 27,28, 34,35, 41,42, 48,49, 55,56, 62,63, 69,70 | **J / P** | 20 |

**Aturan kutub:** jawaban **A** → kutub pertama (**E, S, T, J**); jawaban **B** → kutub kedua (**I, N, F, P**).

> **Catatan penting soal cakupan dokumen ini:** teks kalimat lengkap dari 70 soal (apa yang sebenarnya ditanyakan pada tiap nomor, dan apa isi tepatnya pilihan A vs B) **tidak tersedia di dalam basis kode aplikasi** — tidak seperti DISC (`Format DISC.xlsx`), PAPI, atau RIASEC yang punya daftar item lengkap. Yang tersedia hanyalah:
> - Posisi soal → dimensi (tabel di atas)
> - Kamus pencocokan teks jawaban parsial (lihat Bagian 4.3 & 5) yang berisi **fragmen frasa pilihan** (bukan pasangan A-B utuh per nomor), dipakai untuk mengenali jawaban dari Google Form yang formatnya tidak seragam
>
> Karena itu, bagian "daftar 70 soal lengkap" **tidak dapat disusun secara sah** di dokumen ini tanpa mengarang isi soal. Jika dibutuhkan untuk kebutuhan audit/reproduksi instrumen, teks soal asli perlu ditelusuri dari sumber Google Form produksi yang sebenarnya dipakai, karena tidak terekam di repository ini.

---

## 4. Sistem Skoring — Tahap demi Tahap

Implementasi persis: fungsi `processMbtiCSV()` dan `parseAns()` pada `src/pages/mbti.js`.

### 4.1 Tahap 1 — Deteksi Kolom Jawaban (Berbasis Posisi)

```
totalCols = jumlah_seluruh_kolom_di_header
ansCols   = kolom [totalCols - 70] hingga [totalCols - 1]   (70 kolom terakhir)
```
Jika kolom yang tersedia kurang dari 70 → error: *"Hanya {n} kolom jawaban terdeteksi. Diperlukan 70 soal."*

### 4.2 Tahap 2 — Deteksi Kolom Identitas

Dicari hanya pada **8 kolom pertama** file (bukan seluruh header seperti tes lain):
- Nama: mengandung `"nama"` atau `"name"`
- Jenis kelamin: mengandung `"kelamin"`, `"gender"`, atau persis `"l/p"`
- Tanggal tes: mengandung `"timestamp"`, `"tanggal"`, atau `"waktu"`
- Tujuan/posisi: mengandung `"tujuan"`, `"posisi"`, atau `"pekerjaan"`

### 4.3 Tahap 3 — Pencocokan Jawaban per Soal (`parseAns`)

Untuk tiap sel jawaban, nilai dicocokkan melalui 2 jalur:

1. **Literal huruf:** nilai (lowercase, trim) dicek apakah persis `"a"`, atau diawali `"a."`/`"a)"` → **A**. Sama untuk **B** dengan pola `"b"`, `"b."`, `"b)"`.
2. **Kamus fallback (`mbti_mapping.json`):** jika bukan literal huruf, nilai dibersihkan dari semua karakter non-alfanumerik dan spasi (`replace(/[^a-zA-Z0-9]/g, '')`, lowercase), lalu dicocokkan sebagai key persis di kamus `mbti_mapping.json`. Kamus ini berisi ±140 entri fragmen frasa jawaban (mis. `"realistik"` → A, `"spekulatif"` → B, `"argumenlogis"` → A, `"argumenemotiffeeling"` → B) hasil ekstraksi dari variasi teks pilihan asli Google Form.
3. Jika kedua jalur gagal → jawaban dianggap `null` (tidak dikenali, disertakan ke hitungan TD).

> Pendekatan ini **berbeda** dari mekanisme "exact→substring→word-overlap" yang dipakai PAPI/MSDT — MBTI memakai kamus lookup statis berbasis teks yang dinormalisasi ketat (semua spasi & tanda baca dibuang), bukan pencocokan fuzzy dinamis terhadap teks pertanyaan resmi (karena teks pertanyaan resmi memang tidak disimpan di kode — lihat Bagian 3).

### 4.4 Tahap 4 — Akumulasi Skor & Hitung TD (Tidak Dijawab)

Untuk tiap kelompok dimensi (EI, SN, TF, JP), iterasi index soal yang menjadi anggotanya:
```
jika jawaban == 'A': skor kutub-pertama++
jika jawaban == 'B': skor kutub-kedua++
jika jawaban == null (tidak dikenali/kosong): td++
```
`td` diakumulasi lintas keempat kelompok dimensi (bukan per dimensi terpisah) — jadi satu angka `td` total mewakili jumlah soal dari 70 yang gagal dikenali di seluruh instrumen.

### 4.5 Tahap 5 — Penentuan Tipe & Persentase

```
tipe = (E>I ? 'E':'I') + (S>N ? 'S':'N') + (T>F ? 'T':'F') + (J>P ? 'J':'P')
```
**Aturan tie-break saat skor sama persis:** kode memakai operator `>` murni (bukan `>=`), sehingga bila skor imbang, hasilnya otomatis jatuh ke kutub kedua — **I, N, F, P** menang saat seri. Ini konsisten dengan aturan yang diminta draft (`"seri → I"`, `"seri → N"`, `"seri → F"`, `"seri → P"`).

**Persentase** (dibulatkan ke bilangan bulat terdekat):
```
persen.E = round(skor.E / 10 × 100)     persen.I = round(skor.I / 10 × 100)
persen.S = round(skor.S / 20 × 100)     persen.N = round(skor.N / 20 × 100)
persen.T = round(skor.T / 20 × 100)     persen.F = round(skor.F / 20 × 100)
persen.J = round(skor.J / 20 × 100)     persen.P = round(skor.P / 20 × 100)
```
Catatan: karena pembagi memakai jumlah item per dimensi (10 atau 20), bukan `(A+B) yang berhasil dijawab`, item yang tidak terjawab (TD) tidak dikeluarkan dari pembagi seperti pada Big Five — persentase E dan I pada dimensi yang sama **tidak wajib berjumlah 100%** bila ada TD di dimensi tersebut (mis. bila 2 dari 10 soal E/I tak terjawab, persen.E + persen.I bisa berjumlah hanya 80%).

### 4.6 Tahap 6 — Validasi & Status

| Kondisi (`td` = total soal tak terjawab dari 70) | Status | Tampilan |
|---|---|---|
| `td` ≤ 5 | **Valid** | Badge hijau "✅ Valid", tanpa peringatan |
| `5 < td ≤ 15` | **Kurang Lengkap** | Badge kuning "⚠️ Kurang Lengkap" + alert: *"{td} soal tidak dijawab. Interpretasikan dengan hati-hati."* |
| `td > 15` | **Tidak Valid** | Badge merah "❌ Tidak Valid" + alert: *"Peserta tidak menjawab {td} soal (>15). Hasil tidak bisa diinterpretasikan."* |

Ambang ini **identik** dengan yang diminta draft spesifikasi (`prompt_mbti_psikoscoring.md` Bagian 2).

---

## 5. Kamus Pencocokan Jawaban (`mbti_mapping.json`)

Ini bukan kamus interpretasi kepribadian, melainkan **kamus teknis** untuk pencocokan jawaban Google Form yang formatnya bervariasi (mis. peserta menjawab dengan teks pilihan lengkap, bukan huruf A/B). Total ±140 entri, contoh sebagian:

| Fragmen Teks (dinormalisasi) | Kutub |
|---|---|
| `realistik` | A |
| `spekulatif` | B |
| `prinsip` | A |
| `perasaan` | B |
| `argumenlogis` | A |
| `argumenemotiffeeling` | B |
| `secaraberhatihati` | A |
| `secaraspontan` | B |
| `banyakmenggunakanakalsehat` | A |
| `imajinatif` | B |
| `tepatwaktu` | A |
| `santai` | B |
| `keputusanlogis` | A |
| `keputusanberdasarnilainilai` | B |
| `terorganisasidenganbaik` | A |
| `terbukauntukkemungkinankemungkinan` | B |
| `orangyangpraktis` | A |
| `orangyangteoritis` | B |
| `berpikiranjernih` | A |
| `berperasaanhangat` | B |
| ... | *(±120 entri lain, pola serupa: satu frasa singkat khas dari pilihan A/B, dinormalisasi tanpa spasi/tanda baca)* |

> File sumber tambahan di `zlainnya/` (`mbti_options.json`, `map_mbti_options.py`, `mbti_mapper.py`, `parse_mbti_doc.py`) menunjukkan kamus ini disusun dengan cara mengekstrak daftar opsi jawaban dari dokumen sumber asli, lalu memetakannya satu per satu ke kutub A/B — bukti bahwa proses ini dilakukan manual/semi-otomatis dari dokumen instrumen asli, bukan hasil rekayasa ulang dari nol.

---

## 6. Kamus 16 Tipe Kepribadian MBTI

Sumber: `MBTI_DATA` di `src/data/mbti_data.js`. Setiap tipe punya: nama julukan (nickname), 5 poin deskripsi, 5 poin saran pengembangan, dan daftar profesi.

### ISTJ — "The Inspector"
**Deskripsi:** Serius, tenang, stabil, dan damai dalam pembawaan · Senang berpegang teguh pada fakta, logis, obyektif, praktis, dan realistis · Sangat berorientasi pada tugas, tekun, teratur, menepati janji, dan dapat diandalkan · Pendengar yang baik, setia, namun lebih suka berbagi hanya dengan orang terdekat · Memegang aturan, standar, serta prosedur dengan tegas dan jelas.
**Saran:** Cobalah untuk lebih memahami perasaan dan kebutuhan emosional orang lain · Kurangi dorongan untuk mengontrol orang lain atau memerintah mereka demi penegakan aturan secara kaku · Berlatihlah melihat sisi positif dari suatu kondisi atau tindakan orang lain · Lebih terbuka dan fleksibel terhadap perubahan yang mendadak · Berikan ruang bagi orang lain untuk menyampaikan ide, bukan sekadar instruksi.
**Profesi:** Manajemen, Polisi, Intelijen, Hakim, Pengacara, Dokter, Akuntan, Programmer, System Analyst, Pemimpin Militer.

### ISFJ — "The Protector"
**Deskripsi:** Sangat berhati-hati, teliti, dan memiliki rasa loyalitas yang tinggi · Penuh perhatian, hangat pada orang lain, dan pandai mengorganisir suatu hal · Memiliki rasa tanggung jawab yang mendalam untuk melindungi dan merawat orang di sekitarnya · Lebih suka berada di belakang layar dan menghindari sorotan publik · Sangat peka terhadap detail lingkungan dan kebutuhan mendesak orang lain.
**Saran:** Jangan terlalu memaksakan diri untuk menyenangkan semua orang; belajarlah berkata 'tidak' · Beranikan diri untuk mengemukakan pendapat dan kebutuhan pribadi secara asertif · Jangan terlalu larut dalam rasa bersalah atau khawatir akan pandangan orang lain · Belajarlah untuk membiarkan orang lain memikul tanggung jawab mereka sendiri · Sadari bahwa Anda berhak atas waktu istirahat dan apresiasi atas kerja keras Anda.
**Profesi:** Arsitek, Perawat, Konselor, Pekerjaan Administratif, Hospitality, Guru, Pekerja Sosial.

### ISTP — "The Craftsman"
**Deskripsi:** Berpikir logis, kritis, dan cenderung fleksibel dalam menghadapi situasi tak terduga · Seorang problem-solver sejati yang menyukai hal-hal teknis dan mekanis · Bertindak cepat dan pragmatis, mengutamakan efisiensi dibandingkan teori semata · Bekerja dengan baik di bawah tekanan dan ahli dalam situasi darurat · Cenderung pendiam namun merupakan pengamat yang jeli terhadap lingkungannya.
**Saran:** Cobalah untuk lebih terbuka dalam mengkomunikasikan ide dan perasaan Anda · Belajarlah untuk lebih bersabar menghadapi hal-hal yang bersifat teoritis atau konseptual jangka panjang · Perhatikan perasaan orang lain; ketegasan Anda kadang bisa terkesan dingin atau kaku · Kembangkan kemampuan merencanakan sesuatu secara lebih matang alih-alih selalu spontan · Buka diri terhadap hubungan sosial dan kolaborasi tim yang lebih erat.
**Profesi:** Polisi, Ahli Forensik, Programmer, Teknisi, Pilot, Atlit, Mekanik, Pemadam Kebakaran.

### ISFP — "The Artist"
**Deskripsi:** Sederhana, praktis, sangat sensitif terhadap perasaan, dan rendah hati · Menyukai harmoni dan akan berusaha keras untuk menghindari konflik sebisa mungkin · Sangat menghargai estetika, kebebasan individu, dan kehidupan di masa kini · Pendengar yang penuh empati dan sangat peduli dengan kesejahteraan orang-orang terdekatnya · Sering mengekspresikan diri tidak melalui kata-kata, melainkan tindakan nyata atau karya seni.
**Saran:** Belajarlah untuk menghadapi konflik secara langsung tanpa harus menarik diri · Jangan terlalu mudah merasa tersinggung atau mengambil hati kritik yang bersifat membangun · Cobalah mengembangkan pandangan dan perencanaan jangka panjang yang lebih terstruktur · Beranikan diri untuk lebih vokal dalam mengemukakan pendapat di depan umum · Kurangi kecenderungan menyalahkan diri sendiri ketika sesuatu tidak berjalan sesuai harapan.
**Profesi:** Seniman, Designer, Konselor, Psikolog, Guru, Hospitality, Dokter Hewan, Desainer Interior.

### INFJ — "The Counselor"
**Deskripsi:** Sangat berempati, visioner, penuh dedikasi, dan memegang teguh idealismenya · Memiliki intuisi yang tajam mengenai orang lain dan situasi di masa depan · Cenderung perfeksionis dan hanya puas jika segala sesuatu berjalan sesuai dengan nilai moralnya · Menyukai percakapan yang mendalam dan bermakna dibandingkan obrolan ringan (small talk) · Pelindung setia bagi mereka yang lemah atau membutuhkan bantuan.
**Saran:** Belajarlah untuk lebih realistis dan tidak menuntut kesempurnaan mutlak dari diri sendiri maupun orang lain · Berikan ruang bagi diri Anda untuk bersantai dan menikmati momen saat ini tanpa memikirkan masa depan terus-menerus · Jangan terlalu menyerap energi negatif dari masalah orang lain; jaga batasan emosional Anda · Sampaikan gagasan kompleks Anda dengan cara yang lebih praktis agar mudah dipahami banyak orang · Ingatlah untuk memperhatikan kebutuhan logistik dan praktis sehari-hari.
**Profesi:** Pengajar, Psikolog, Dokter, Konselor, Fotografer, Seniman, Penulis, Konsultan HR.

### INTJ — "The Mastermind"
**Deskripsi:** Pemikir yang visioner, sangat mandiri, analitis, dan memiliki standar perfeksionis tinggi · Berfokus pada gambaran besar (big picture) dan selalu memiliki strategi jangka panjang · Berpikir strategis layaknya sedang bermain catur; selalu selangkah lebih maju · Sangat menghargai kecerdasan, kompetensi, dan kemampuan untuk berargumen secara logis · Bisa terlihat dingin atau tidak peduli, meskipun sebenarnya mereka sangat analitis.
**Saran:** Pahami bahwa tidak semua orang mampu menyerap ide-ide kompleks dengan kecepatan yang sama · Kurangi sikap kritis atau meremehkan terhadap argumen emosional orang lain · Belajarlah untuk menghargai perasaan orang di sekitar Anda dan berkomunikasi dengan lebih hangat · Lebih terbuka terhadap masukan dari luar alih-alih merasa strategi Anda selalu yang paling benar · Sadarilah bahwa hubungan interpersonal dan keakraban juga memengaruhi kesuksesan sebuah proyek.
**Profesi:** Peneliti, Ilmuwan, Insinyur, Pengajar Universitas, Dokter, Programmer, Pengacara, Strategist Bisnis.

### INFP — "The Healer"
**Deskripsi:** Sangat peka, loyal, idealis, dan selalu mengupayakan solusi menang-menang (win-win solution) · Memiliki sistem nilai internal yang sangat kuat dan selalu berusaha hidup selaras dengan nilai tersebut · Sangat peduli terhadap makna hidup dan pertumbuhan pribadi, baik bagi diri sendiri maupun orang lain · Kreatif dan sering mengekspresikan pemikiran mendalam mereka melalui karya tulis atau seni · Suka menyendiri untuk merenung, namun bisa menjadi sangat bersemangat ketika membahas idealisme mereka.
**Saran:** Jangan terlalu sensitif terhadap kritikan; pandanglah itu sebagai sarana untuk berkembang · Belajarlah untuk bertindak lebih tegas saat menghadapi masalah praktis atau menuntut penyelesaian cepat · Kurangi kecenderungan untuk selalu mengharapkan kondisi dunia yang sempurna dan ideal · Cobalah lebih terstruktur dalam manajemen waktu agar ide-ide brilian Anda bisa tereksekusi dengan nyata · Beranikan diri untuk menetapkan batasan yang jelas agar Anda tidak mudah dimanfaatkan.
**Profesi:** Penulis, Konselor, Psikolog, Pengajar, Seniman, Rohaniawan, Editor, Spesialis SDM.

### INTP — "The Architect"
**Deskripsi:** Pemikir intelektual yang sangat teoritis, logis, analitis, dan suka memecahkan misteri kompleks · Sangat menghargai ketepatan bahasa dan benci pada logika yang cacat atau argumen emosional · Cenderung lebih tertarik pada gagasan dan ide daripada interaksi sosial yang dangkal · Sangat independen dalam berpikir dan tidak mudah terpengaruh oleh opini mayoritas · Sering kali asyik dengan pikirannya sendiri sehingga terlihat menjauh dari lingkungan sekitarnya.
**Saran:** Cobalah menyederhanakan penjelasan Anda agar lebih mudah dipahami oleh orang awam · Berikan perhatian yang lebih besar pada implementasi ide, bukan hanya pada proses menemukan teori · Belajarlah memahami dan memvalidasi emosi orang lain, meskipun itu tidak tampak logis bagi Anda · Latihlah diri untuk bisa berbincang santai (small talk) untuk membangun jejaring sosial · Perhatikan hal-hal praktis seperti kerapian, jadwal, dan tanggung jawab rutin.
**Profesi:** Ilmuwan, Programmer, System Analyst, Pengacara, Ahli Forensik, Matematikawan, Ekonom.

### ESTP — "The Dynamo"
**Deskripsi:** Spontan, enerjik, sangat berorientasi pada tindakan (action-oriented), dan komunikatif · Menyukai sensasi, tantangan fisik, dan mampu berpikir sangat cepat di tengah krisis · Praktis dan fokus pada masa kini; tidak suka teori abstrak atau perencanaan jangka panjang · Mampu meyakinkan orang lain dengan mudah dan memiliki karisma yang menarik perhatian · Mudah beradaptasi dengan lingkungan baru dan sangat observan terhadap hal-hal fisik di sekitarnya.
**Saran:** Cobalah memikirkan dampak jangka panjang dari tindakan Anda sebelum mengambil risiko · Kembangkan rasa tanggung jawab terhadap komitmen yang sudah Anda buat · Jangan mudah merasa bosan dan meninggalkan proyek sebelum selesai sepenuhnya · Belajarlah lebih peka terhadap perasaan halus dan kebutuhan emosional orang lain · Hargai pentingnya rutinitas, perencanaan, dan struktur untuk mencapai kesuksesan yang konsisten.
**Profesi:** Marketing, Sales, Polisi, Entrepreneur, Technical Support, Pialang Saham, Paramedis, Manajer Olahraga.

### ESFP — "The Performer"
**Deskripsi:** Sangat outgoing, ramah, sosial, suka bersenang-senang (fun-loving), dan penuh antusiasme · Menyukai menjadi pusat perhatian dan mampu mencairkan suasana dengan humor mereka · Sangat peka terhadap panca indera, menyukai pengalaman estetis, dan gaya hidup aktif · Praktis, realistis, dan memiliki toleransi yang tinggi terhadap gaya hidup orang lain · Selalu berusaha menghindari konflik dan mencari cara untuk menikmati hidup sebaik mungkin.
**Saran:** Belajarlah menghadapi konflik dengan dewasa daripada sekadar menghindarinya · Rencanakan masa depan dan kelola keuangan Anda dengan lebih bijaksana · Fokus pada penyelesaian tugas hingga tuntas, bukan hanya mencari pengalaman baru secara konstan · Jangan terlalu mudah tersinggung oleh kritikan yang bermaksud membantu Anda berkembang · Pahamilah bahwa beberapa tujuan memerlukan analisis dan kerja keras yang mungkin kurang menyenangkan.
**Profesi:** Entertainer, Seniman, Marketing, Konselor, Tour Guide, Event Planner, Desainer Fashion, Public Relations.

### ENFP — "The Champion"
**Deskripsi:** Imajinatif, kreatif, penuh antusiasme, dan merupakan komunikator yang sangat persuasif · Mampu melihat potensi besar dalam diri setiap orang dan mendorong mereka untuk maju · Sangat membenci rutinitas, birokrasi, dan aturan ketat yang menghambat kreativitas · Mudah terhubung dengan orang lain secara emosional dan selalu mencari makna baru dalam hidup · Multitalenta dengan energi meluap-luap yang bisa berpindah-pindah ketertarikan dengan cepat.
**Saran:** Belajarlah fokus menyelesaikan satu proyek sebelum melompat ke ide cemerlang berikutnya · Beri perhatian lebih pada detail administratif, finansial, dan pengorganisasian rutinitas · Jangan terlalu memaksakan antusiasme Anda kepada orang yang mungkin membutuhkan ruang tenang · Berlatihlah menerima bahwa terkadang kritik datang bukan untuk menyerang Anda secara personal · Cobalah meredam sikap impulsif dan mengambil keputusan berdasarkan fakta konkrit, bukan hanya perasaan.
**Profesi:** Konselor, Psikolog, Motivator, Presenter, Reporter, Seniman, Copywriter, Manajer Marketing.

### ENTP — "The Visionary"
**Deskripsi:** Cerdik, inovatif, suka berdebat untuk mengasah pemikiran, dan selalu penuh ide-ide baru · Sangat menikmati adu argumen logis dan mampu melihat suatu masalah dari berbagai sudut pandang · Cepat memahami konsep kompleks namun sering cepat bosan saat tiba pada tahap implementasi · Berani menantang status quo dan aturan tradisional demi mencari efisiensi dan inovasi · Karismatik dan pandai memotivasi orang lain untuk ikut dalam proyek ambisius mereka.
**Saran:** Sadari bahwa berdebat secara konstan bisa melelahkan dan menyakiti hati orang lain · Belajarlah menepati komitmen dan menyelesaikan apa yang telah Anda mulai dengan tuntas · Hargai pentingnya tradisi atau aturan tertentu yang dibuat demi stabilitas lingkungan · Lebih peka dan berikan apresiasi emosional terhadap kerja keras tim Anda · Latih disiplin diri untuk fokus pada detail operasional yang membosankan namun esensial.
**Profesi:** Pengacara, Psikolog, Konsultan, Ilmuwan, Aktor, Programmer, Entrepreneur, Pengembang Properti.

### ESTJ — "The Supervisor"
**Deskripsi:** Sangat sistematis, disiplin, pekerja keras, tegas, dan selalu berbicara to the point · Pemimpin alami yang mampu mengorganisir orang dan proses demi mencapai target dengan efisien · Sangat memegang teguh standar, hukum, dan tradisi, serta membenci ketidakefisienan atau kemalasan · Bicara berdasarkan fakta konkret dan mampu mengambil keputusan sulit dengan cepat · Sangat bisa diandalkan, setia pada komitmen, dan menuntut standar yang sama dari orang lain.
**Saran:** Belajarlah untuk mendengarkan masukan dan ide dari orang lain dengan pikiran terbuka · Gunakan intonasi yang lebih lembut dan empatik saat memberikan kritik atau arahan · Berikan pujian dan apresiasi saat bawahan atau rekan tim Anda bekerja dengan baik · Sadari bahwa tidak semua perubahan adalah hal buruk; belajarlah lebih fleksibel · Berikan ruang bagi orang lain untuk menyelesaikan sesuatu dengan metode mereka sendiri.
**Profesi:** Militer, Manajer Perusahaan, Polisi, Hakim, Sales Manager, Akuntan, System Analyst, Administrator.

### ESFJ — "The Provider"
**Deskripsi:** Sangat hangat, suportif, komunikatif, bersosialisasi dengan mudah, dan penuh perhatian · Menemukan kepuasan sejati dalam melayani, membantu, dan memenuhi kebutuhan praktis orang lain · Sangat menghargai tradisi, loyalitas, dan keharmonisan di dalam komunitas maupun lingkungan kerja · Sangat terorganisir dalam hal-hal logistik dan mahir menjadi tuan rumah (host) di berbagai acara · Cenderung mengambil peran pengasuh yang mengutamakan kebaikan bersama di atas kepentingan diri.
**Saran:** Berhentilah memikul masalah semua orang; Anda tidak bertanggung jawab atas kebahagiaan mereka · Belajarlah menerima kritik tanpa langsung merasa ditolak secara personal · Sadari bahwa konflik kadang diperlukan untuk menyelesaikan akar masalah yang mendalam · Luangkan waktu dan energi yang cukup untuk merawat diri Anda sendiri secara mental dan fisik · Beranikan diri mencoba hal baru di luar rutinitas yang sudah biasa Anda jalankan.
**Profesi:** Perencana Keuangan, Perawat, Guru, Konselor, Pekerja Administratif, Customer Service, HRD.

### ENFJ — "The Teacher"
**Deskripsi:** Sangat karismatik, peduli, fasih berkomunikasi, dan sangat menginspirasi orang lain · Pemimpin visioner yang fokus mengembangkan potensi maksimal dari individu dalam tim mereka · Memiliki radar empatik yang kuat sehingga sangat responsif terhadap suasana hati orang banyak · Mampu mengutarakan pandangan yang kompleks menjadi pesan emosional yang menyentuh hati · Sangat terorganisir namun pendekatan kepemimpinannya lebih didorong oleh afeksi dan harmoni.
**Saran:** Belajarlah menarik batasan yang sehat agar Anda tidak terlalu terkuras oleh beban emosional orang lain · Terima kenyataan bahwa tidak semua orang ingin diselamatkan atau dibantu secara proaktif · Jangan menekan kritik rasional demi menjaga keharmonisan; kejujuran faktual itu penting · Latihlah diri Anda untuk menghadapi penolakan tanpa merasa harga diri Anda jatuh · Alokasikan lebih banyak waktu untuk kebutuhan diri sendiri agar tidak mudah lelah secara mental.
**Profesi:** Konsultan, Psikolog, Pengajar, Marketing Manager, HRD, Event Coordinator, Politikus, Diplomat.

### ENTJ — "The Commander"
**Deskripsi:** Sangat tegas, asertif, dominan, dan merupakan figur pemimpin (alpha) yang tangguh · Ahli dalam menyusun strategi komprehensif untuk mencapai sasaran jangka panjang yang masif · Cepat menemukan inefisiensi dan tidak segan melakukan perombakan drastis demi perbaikan sistem · Percaya diri, sangat rasional, dan menikmati tantangan intelektual atau perdebatan cerdas · Cenderung fokus pada hasil dan mengesampingkan faktor emosional yang dianggap menghambat progres.
**Saran:** Sadari bahwa pendekatan asertif Anda dapat menakuti orang lain jika tidak diimbangi dengan kelembutan · Berusahalah untuk mendengarkan, memvalidasi perasaan, dan memuji rekan setim yang telah berjuang · Berlatihlah menghadapi emosi (baik diri sendiri maupun orang lain) dengan lebih sabar dan bijaksana · Sadarilah bahwa memberikan waktu istirahat yang cukup adalah kunci keberlanjutan sebuah tim · Hargai pandangan yang berbeda, sekilas mungkin tidak efisien namun bisa memicu inovasi unik.
**Profesi:** Manajer Eksekutif, Pemimpin Perusahaan (CEO), Kepala Sekolah, Hakim, Pengacara Bisnis, Ahli Strategi.

---

## 7. Struktur & Konten Laporan (Detail View / PDF)

Laporan per peserta tersusun sebagai berikut, sesuai `renderDetailView()` pada `mbti.js`:

### A. Header Identitas
- Nama Lengkap, Jenis Kelamin, Tanggal Tes, Tujuan (bila ada).
- Alert peringatan validitas (Kurang Lengkap/Tidak Valid) ditampilkan menonjol di paling atas bila berlaku (lihat Bagian 4.6).

### B. Badge Tipe & Nickname
Kotak besar menampilkan kode tipe 4-huruf (mis. "INFP") dan nickname dari kamus (mis. "The Healer").

### C. Profil 4 Dimensi (Bar Berpasangan)
4 bar horizontal simetris (bukan bar chart biasa), masing-masing menampilkan sepasang kutub berlawanan dengan persentase di kedua sisi:
- Extraversion (E) — Introversion (I)
- Sensing (S) — Intuition (N)
- Thinking (T) — Feeling (F)
- Judging (J) — Perceiving (P)

Bar digambar dari titik tengah (50%) ke arah kiri untuk kutub pertama dan ke arah kanan untuk kutub kedua, lebar tiap sisi proporsional terhadap persentasenya sendiri (bukan dinormalisasi supaya total 100%).

### D. Deskripsi Kepribadian & Saran Pengembangan
Dua kolom berdampingan: daftar 5 poin deskripsi dan 5 poin saran dari kamus Bagian 6.

### E. Saran Profesi/Karir
Blok terpisah berisi daftar profesi yang cocok untuk tipe tersebut.

### F. Footer Laporan (khusus versi PDF, disisipkan dinamis saat unduh)
- Header PDF (`#pdf-header`, disembunyikan di layar, dimunculkan saat generate PDF): logo + "PsikoScoring CNA" + judul "Laporan MBTI" + tanggal cetak.
- Footer PDF (`#pdf-footer`): *"Hasil ini bersifat konfidensial. Dibuat dengan PsikoScoring CNA Group."*
- **Catatan:** berbeda dari 4 tes lain (DISC, PAPI, Big Five, MSDT) yang membuat elemen HTML PDF terpisah lewat fungsi `generatePDFHTML()`, MBTI **menyembunyikan/menampilkan elemen header-footer di dalam DOM yang sama** (`display:none` ↔ `display:flex/block`) sesaat sebelum `html2pdf()` dipanggil, lalu mengembalikannya lagi setelah selesai — pendekatan teknis berbeda untuk tujuan yang sama.
- Tidak ada blok promosi "Coach Alifya" seperti 4 tes lain — footer MBTI memakai branding "PsikoScoring CNA Group" yang berbeda.

### G. Fitur Unduh & Ekspor
- **Unduh PDF** per peserta (`html2pdf`, margin dalam mm, format A4 potrait).
- **Tidak ada** fitur "Unduh Semua (ZIP)" — berbeda dari DISC/PAPI/Big Five/MSDT/RIASEC yang semuanya punya tombol ini.
- **Tidak ada** fitur "Export CSV/Excel Rekapitulasi" di halaman ringkasan — berbeda dari kelima tes lain yang seluruhnya punya tombol export CSV.

### H. Navigasi
- Ringkasan (tabel semua peserta: No, Nama, L/P, Tipe, persentase 8 kutub, TD, Status, tombol Detail) → klik baris untuk ke Detail.
- Di halaman Detail: tombol Sebelumnya/Berikutnya untuk berpindah antar peserta.

---

## 8. Format File Input (Teknis)

- Ekstensi: `.xlsx`, `.xls`, atau `.csv` — validasi ekstensi dilakukan dari nama file (`/\.(xlsx|xls|csv)$/i`), bukan dari isi/MIME type.
- Baris pertama = header.
- Deteksi kolom jawaban: **selalu 70 kolom terakhir** pada sheet, tanpa mempertimbangkan isi header sama sekali (lihat Bagian 4.1) — pendekatan paling sederhana/ketat di antara semua tes yang sudah didokumentasikan (Big Five juga berbasis posisi, tapi MBTI bahkan tidak mencoba mencocokkan pola nomor "1." seperti tes lain).
- Deteksi kolom identitas: hanya diperiksa pada **8 kolom pertama** file (bukan seluruh header) — batasan ini tidak ada pada tes lain, yang mencari di semua kolom sebelum blok soal.
- **Tidak ada fallback nama** berbasis "kolom pertama yang berisi teks" seperti di DISC/PAPI/MSDT/RIASEC — jika kolom nama tidak terdeteksi, langsung memakai default `"Peserta {nomor baris}"`.
- **Tidak ada parsing tanggal Excel serial number** — nilai kolom tanggal (`tglTes`) langsung dikonversi ke string apa adanya (`String(row[dateColIdx])`), tidak ada penanganan khusus untuk objek `Date` atau serial number Excel seperti pada tes-tes lain.
- Baris tanpa nama (setelah trim) dilewati.

---

## Catatan & Riwayat Versi

Dibandingkan dengan `zlainnya/prompt_mbti_psikoscoring.md` (draft spesifikasi awal), implementasi aktual **konsisten pada logika skoring inti** (struktur 10×7 blok, formula skor, aturan tie-break, ambang validasi TD), tapi **berbeda signifikan pada arsitektur teknis dan cakupan fitur**:

| Aspek | Draft (`prompt_mbti_psikoscoring.md`) | Implementasi Aktual |
|---|---|---|
| Struktur file | Modul terpisah `/modules/mbti/` dengan `.html`, `.js`, `.css`, `-data.js` sendiri, offline murni tanpa framework | Terintegrasi sebagai satu file `src/pages/mbti.js` dalam arsitektur SPA yang sudah ada, memakai `import`/`export` ES module dan file data terpisah (`mbti_data.js`, `mbti_mapping.json`) — bukan struktur modul mandiri seperti draft minta |
| Pencocokan jawaban | Hanya disebutkan "a"/"b" case-insensitive | Implementasi jauh lebih kaya: ada jalur literal huruf **dan** kamus fallback `mbti_mapping.json` (±140 entri) untuk mengenali teks pilihan lengkap — fitur ini **tidak disebutkan sama sekali** di draft, murni penambahan implementasi |
| Field "Usia" (dihitung dari tanggal lahir) | Diminta ditampilkan di header detail dan kolom export | **Tidak diimplementasikan** — tidak ada field usia maupun perhitungan dari tanggal lahir ke tanggal tes |
| Tombol "Salin Teks" | Diminta sebagai salah satu opsi export | **Tidak diimplementasikan** |
| Export Excel/CSV rekapitulasi | Diminta sebagai fitur (`[Unduh Excel Rekap]`) dengan kolom lengkap termasuk deskripsi/saran/profesi gabungan | **Tidak diimplementasikan sama sekali** — MBTI adalah satu-satunya dari 6 tes yang sudah didokumentasikan yang tidak punya tombol export CSV di ringkasan |
| Unduh Semua (ZIP) | Tidak diminta eksplisit, tapi draf minta "Unduh Semua PDF" di alur UX | **Tidak diimplementasikan** — juga satu-satunya tes tanpa fitur unduh massal |
| Simpan ke Riwayat (localStorage) | Diminta eksplisit dengan key `psikoscoring_riwayat_mbti` | **Tidak diimplementasikan** — hasil hanya tersimpan di variabel in-memory (`_mbtiResults`), hilang saat halaman direfresh; tidak terhubung ke sistem riwayat manapun |
| Preview 3 baris awal CSV & dialog mapping kolom manual | Diminta sebagai bagian alur UX sebelum proses | **Tidak diimplementasikan** — file langsung diproses penuh begitu diupload, tanpa tahap konfirmasi |
| Progress indicator saat memproses banyak peserta | Diminta ("Memproses 45/120 peserta...") | **Tidak diimplementasikan** — pemrosesan berjalan sinkron tanpa indikator progres |
| Ringkasan distribusi tipe (pie/bar chart) di halaman summary | Diminta sebagai "Summary card" | **Tidak diimplementasikan** — halaman ringkasan hanya berisi tabel, tanpa visualisasi agregat |
| Teks lengkap 70 soal | Tidak disertakan langsung di draft (draft hanya berisi tabel posisi→dimensi, sama seperti kode) | **Sama-sama tidak tersedia** — baik draft maupun kode tidak pernah menyimpan teks soal lengkap; ini adalah keterbatasan bersama, bukan penyimpangan implementasi dari spesifikasi |

**Kesimpulan:** Inti algoritma skoring MBTI (pemetaan posisi-ke-dimensi, formula persentase, aturan tie-break, ambang TD) diimplementasikan dengan **benar dan sesuai spesifikasi**. Namun, MBTI adalah **modul dengan fitur pelaporan paling minim** dibanding lima tes lain yang sudah didokumentasikan (DISC, PAPI, Big Five, MSDT, RIASEC) — tidak ada export CSV, tidak ada unduh ZIP massal, tidak ada integrasi riwayat/localStorage, dan tidak ada field usia. Sebagian besar fitur pendukung yang diminta draft (preview, mapping manual, progress bar, ringkasan visual, riwayat) belum sampai diimplementasikan. Jika modul ini ingin disejajarkan dengan tes lain, prioritas pengembangan berikutnya idealnya: (1) export CSV rekapitulasi, (2) unduh ZIP semua PDF, (3) integrasi ke sistem riwayat yang sudah dipakai tes-tes lain.

---

## Sumber Dokumen

- `src/pages/mbti.js` — implementasi aktual (skoring, parsing jawaban, render, PDF).
- `src/data/mbti_data.js` — kamus 16 tipe kepribadian (deskripsi, saran, profesi).
- `src/data/mbti_mapping.json` — kamus teknis pencocokan fragmen teks jawaban ke kutub A/B.
- `zlainnya/prompt_mbti_psikoscoring.md` — draft spesifikasi awal (struktur skoring konsisten dengan kode; banyak fitur pelaporan tambahan belum diimplementasikan).
- `zlainnya/mbti_options.json`, `map_mbti_options.py`, `mbti_mapper.py`, `parse_mbti_doc.py` — perkakas bantu (tooling) yang dipakai untuk menyusun `mbti_mapping.json` dari dokumen instrumen asli.
