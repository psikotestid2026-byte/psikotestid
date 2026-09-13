# MSAI (Management Skills Assessment Instrument) — Dokumentasi Lengkap Alat Tes

> Dokumen ini merangkum **persis apa yang berjalan di aplikasi** (`src/pages/msai.js`, `src/data/msai_data.js`), dicocokkan dengan dokumen spesifikasi (`zlainnya/PROMPT_MSAI_Generator_Antigravity.md`). Implementasi **sangat setia** pada spesifikasi — termasuk mekanisme pencocokan kolom berbasis teks (fuzzy match) yang justru **tidak ada** di beberapa tes lain (RIASEC, Big Five, MBTI, Enneagram) yang sudah didokumentasikan sebelumnya. Ada **satu bug nyata** yang ditemukan — lihat [Catatan & Riwayat Versi](#catatan--riwayat-versi).

---

## 1. Ringkasan Alat Tes

- **Nama:** MSAI (Management Skills Assessment Instrument) — berbasis **Competing Values Framework (Quinn)**, instrumen 360°/self-assessment untuk menilai kompetensi manajerial.
- **Jumlah soal:** 87 item, dibagi 4 blok dengan skala Likert 1–5 yang maknanya berbeda per blok.
- **Dimensi yang diukur:** **12 area skill manajerial**, dikelompokkan ke **4 kuadran budaya organisasi**: Clan, Adhocracy, Market, Hierarchy.
- **Fitur unik:** setiap skill dinilai dari **3 sudut sekaligus** — Actual Behaviour (perilaku aktual, dari rata-rata 5 item), Expected Effectiveness (efektivitas yang diharapkan, dari 1 item), dan Importance to Job (kepentingan bagi peran, dari 1 item) — lalu dihitung **Gap** (Importance − Actual) untuk menentukan prioritas pengembangan.
- **Output:** skor 12 skill (3 kolom: actual/effectiveness/importance + gap), skor 4 kuadran, radar chart 12 sumbu, narasi otomatis, dan laporan PDF per peserta.
- **Sumber input:** Google Form → diekspor jadi file Excel/CSV → diupload ke halaman MSAI di aplikasi — **dengan tahap pratinjau pemetaan kolom** sebelum dihitung (satu-satunya tes yang punya tahap ini secara eksplisit).

---

## 2. Instruksi Pengerjaan

Instruksi yang seharusnya ditampilkan ke peserta (melalui Google Form, sebelum diproses aplikasi):

1. Terdapat 87 pernyataan tentang perilaku dan kompetensi manajerial Anda, terbagi 4 bagian dengan skala berbeda:
   - **Bagian 1 (Q1–Q60) — Perilaku Manajerial Aktual:** skala 1 (*Sangat Tidak Setuju*) sampai 5 (*Sangat Setuju*), tentang apa yang **benar-benar** Anda lakukan sehari-hari.
   - **Bagian 2 (Q61–Q73) — Efektivitas Manajerial:** skala 1 (*Buruk*) sampai 5 (*Luar Biasa*), tentang seberapa efektif Anda menjalankan tiap kompetensi tersebut.
   - **Bagian 3 (Q74–Q75) — Pertanyaan Karir:** pilihan berskala tentang ekspektasi jenjang karir dan penilaian diri dibanding manajer lain.
   - **Bagian 4 (Q76–Q87) — Kepentingan bagi Organisasi:** skala 1 (*Kurang Penting*) sampai 5 (*Sangat Penting/Kritikal*), tentang seberapa penting kompetensi tersebut bagi peran Anda saat ini.
2. Jawablah dengan jujur berdasarkan kondisi nyata, bukan kondisi ideal.
3. Semua 87 pertanyaan sebaiknya dijawab lengkap; sistem akan tetap memproses item yang kosong secara proporsional, namun akan menandai berapa banyak yang hilang (lihat Bagian 4.4).

**Instruksi ke Admin/HR (di halaman upload aplikasi):**
- Upload file Excel (`.xlsx`/`.xls`) atau CSV hasil export Google Form.
- **Header kolom harus berupa teks pertanyaan lengkap** (bukan label "Q1"/"Q2") — sistem akan mencocokkan otomatis lewat kemiripan teks terhadap bank pertanyaan kanonik.
- Setelah upload, akan muncul **halaman Pratinjau Pemetaan Kolom** yang menunjukkan hasil deteksi otomatis (kolom mana → nomor soal berapa) sebelum perhitungan dijalankan — periksa halaman ini untuk memastikan pemetaan benar sebelum menekan "Konfirmasi & Hitung".
- Kolom identitas (Nama, Jenis Kelamin, Tanggal) dideteksi otomatis dari nama header.

---

## 3. Struktur 87 Soal (4 Blok)

| Blok | Item | Skala Likert 1–5 | Fungsi dalam Skoring |
|---|---|---|---|
| **Managerial Behaviour** (perilaku aktual) | Q1–Q60 | 1=Sangat Tidak Setuju … 5=Sangat Setuju | Basis skor **Actual Behaviour** — dirata-rata 5 item per skill |
| **Managerial Effectiveness** (efektivitas) | Q61–Q73 | 1=Buruk … 5=Luar Biasa | Q61–Q72 = skor **Expected Effectiveness** per skill (item tunggal); Q73 = kompetensi manajerial keseluruhan (khusus narasi) |
| **Career questions** (naratif) | Q74–Q75 | Pilihan berskala 1–5 (lihat Bagian 5) | Tidak masuk kuadran — dipakai murni untuk kalimat narasi |
| **Importance to organisation** (kepentingan) | Q76–Q87 | 1=Kurang Penting … 5=Sangat Kritikal | Skor **Importance to Job** per skill (item tunggal) |

### Daftar Lengkap 87 Item (Bank Pertanyaan Kanonik)

Sumber: `MSAI_QUESTIONS` di `src/data/msai_data.js` — teks asli berbahasa Inggris (instrumen MSAI standar Quinn), dipakai sebagai basis pencocokan fuzzy terhadap header kolom Google Form (yang bisa jadi sudah diterjemahkan/dimodifikasi redaksinya oleh pembuat form).

**Q1–Q60 — Managerial Behaviour:**

| No | Pernyataan |
|---|---|
| 1 | I communicate in a supportive way when people in my unit share their problems with me. |
| 2 | I encourage others in my unit to generate new ideas and methods. |
| 3 | I motivate and energise others to do a better job. |
| 4 | I keep close track of how my unit is performing. |
| 5 | I regularly coach followers to improve their management skills so they can achieve higher levels of performance. |
| 6 | I insist on intense hard work and high productivity from my followers. |
| 7 | I establish ambitious goals that challenge followers to achieve performance levels above the standard. |
| 8 | I generate, or help others obtain, the resources necessary to implement their innovative ideas. |
| 9 | When someone comes up with a new idea, I help sponsor them to develop it. |
| 10 | I make certain that all employees are clear about our policies, values and objectives. |
| 11 | I make certain that others have a clear picture of how their job fits with others in the organisation. |
| 12 | I build cohesive, committed teams of people. |
| 13 | I give to followers regular feedback about how I think they're doing. |
| 14 | I articulate a clear vision of what can be accomplished in the future. |
| 15 | I foster a sense of competitiveness that helps members of my work group perform at higher levels than members of other units. |
| 16 | I assure that regular reports and assessments occur in my unit. |
| 17 | I interpret and simplify complex information so that it makes sense to others and can be shared throughout the organisation. |
| 18 | I facilitate effective information sharing and problem solving in my group. |
| 19 | I foster rational, systematic decision analysis in my unit (e.g. logically analysing component parts of problems) to reduce the complexity of important issues. |
| 20 | I make sure that others in my unit are provided with opportunities for personal growth and development. |
| 21 | I create an environment where involvement and participation in decisions are encouraged and rewarded. |
| 22 | In groups I lead, I make sure that sufficient attention is given to both task accomplishment and to inter-personal relationships. |
| 23 | When giving negative feedback to others, I foster their self-improvement rather than defensiveness or anger. |
| 24 | I give others assignments and responsibilities that provide opportunities for their personal growth and development. |
| 25 | I actively help prepare others to move up in the organisation. |
| 26 | I regularly come up with new, creative ideas regarding processes, products or procedures for my organisation. |
| 27 | I constantly restate and reinforce my vision of the future to members of my unit. |
| 28 | I help others visualise a new kind of future that includes possibilities as well as probabilities. |
| 29 | I am always working to improve the processes we use to achieve our desired output. |
| 30 | I push my unit to achieve world-class competitive performance in service and/or products. |
| 31 | By enabling others in my unit, I foster a motivational climate that energises everyone involved. |
| 32 | I have consistent and frequent personal contact with my internal and my external customers. |
| 33 | I make sure that we assess how well we are meeting our customers' expectations. |
| 34 | I provide experiences for employees that help them become socialised and integrated into the culture of our organisation. |
| 35 | I increase the competitiveness of my unit by encouraging others to provide services and/or products that surprise and delight customers by exceeding their expectations. |
| 36 | I have established a control system that assures consistency in quality, service, cost and productivity in my unit. |
| 37 | I coordinate regularly with managers in other units in my organisation. |
| 38 | I routinely share information across functional boundaries in my organisation to facilitate coordination. |
| 39 | I use a measurement system that consistently monitors both work processes and outcomes. |
| 40 | I clarify for members of my unit exactly what is expected of them. |
| 41 | I assure that everything we do is focused on better serving our customers. |
| 42 | I facilitate a climate of aggressiveness and intensity in my unit. |
| 43 | I constantly monitor the strengths and weaknesses of our best competition and provide my unit with information on how we measure up. |
| 44 | I facilitate a climate of continuous improvement in my unit. |
| 45 | I have developed a clear strategy for helping my unit successfully accomplish my vision of the future. |
| 46 | I capture the imagination and emotional commitment of others when I talk about my vision of the future. |
| 47 | I facilitate a work environment where peers as well as followers learn from and help develop one another. |
| 48 | I listen openly and attentively to others who give me their ideas, even when I disagree. |
| 49 | When leading a group, I ensure collaboration and positive conflict resolution among group members. |
| 50 | I foster trust and openness by showing understanding for the point of view of individuals who come to me with problems or concerns. |
| 51 | I create an environment where experimentation and creativity are rewarded and recognised. |
| 52 | I encourage everyone in my unit to constantly improve and update everything they do. |
| 53 | I encourage all employees to make small improvements continuously in the way they do their jobs. |
| 54 | I make sure that my unit continually gathers information on our customers' needs and preferences. |
| 55 | I involve customers in my unit's planning and evaluations. |
| 56 | I establish ceremonies and rewards in my unit that reinforce the values and culture of our organisation. |
| 57 | I maintain a formal system for gathering and responding to information that originates in other units outside my own. |
| 58 | I initiate cross-functional teams or task forces that focus on important organisational issues. |
| 59 | I help my employees strive for improvement in all aspects of their lives, not just in job-related activities. |
| 60 | I create a climate where individuals in my unit want to achieve higher levels of performance than the competition. |

**Q61–Q73 — Managerial Effectiveness:**

| No | Pernyataan |
|---|---|
| 61 | Managing teams (building effective, cohesive, smooth-functioning teams). |
| 62 | Managing interpersonal relationships (listening to and providing supportive feedback to others). |
| 63 | Managing the development of others (helping others improve their performance and obtain personal development opportunities). |
| 64 | Fostering innovation (encouraging others to innovate and generate new ideas). |
| 65 | Managing the future (communicating a clear vision of the future and facilitating its accomplishment). |
| 66 | Managing continuous improvement (fostering an orientation toward continuous improvement among employees in everything they do). |
| 67 | Managing competitiveness (fostering an aggressive orientation toward exceeding performance targets). |
| 68 | Energising employees (motivating others to put forth extra effort and to work effectively). |
| 69 | Managing customer service (fostering a focus on service and involvement with customers). |
| 70 | Managing acculturation (helping others become clear about what is expected of them and about organisational culture and standards). |
| 71 | Managing the control system (having measurement and monitoring systems in place to keep close track of processes and performance). |
| 72 | Managing coordination (sharing information across functional boundaries and fostering coordination with other units). |
| 73 | Overall management competency (general level of managerial ability). |

**Q74–Q75 — Career Questions:**

| No | Pernyataan |
|---|---|
| 74 | On the basis of your level of management competency, how high in the organisation do you expect to go in your career? |
| 75 | Compared to all other managers you've known, how would you rate your own competency as a manager? |

**Q76–Q87 — Importance to Organisation:**

| No | Pernyataan |
|---|---|
| 76 | Managing teams (building effective, cohesive, smooth-functioning teams). |
| 77 | Managing interpersonal relationships (listening to and providing supportive feedback to others). |
| 78 | Managing the development of others (helping others improve their performance and obtain personal development opportunities). |
| 79 | Managing innovation (encouraging others to innovate and generate new ideas). |
| 80 | Managing the future (communicating a clear vision of the future and facilitating its accomplishment). |
| 81 | Managing continuous improvement (fostering an orientation toward continuous improvement among employees in everything they do). |
| 82 | Managing competitiveness (fostering an aggressive orientation toward exceeding competitors' performance). |
| 83 | Energising employees (motivating others to put forth extra effort and to work effectively). |
| 84 | Managing customer service (fostering a focus on service and involvement with customers). |
| 85 | Managing acculturation (helping others become clear about what is expected of them and about organisational culture and standards). |
| 86 | Managing the control system (having measurement and monitoring systems in place to keep close track of processes and performance). |
| 87 | Managing coordination (sharing information across functional boundaries and fostering coordination with other units). |

> **Catatan:** item Q61–Q72 (Effectiveness) dan Q76–Q87 (Importance) sengaja memakai **teks yang identik** dengan pasangan skill-nya — ini disengaja karena keduanya menilai skill yang sama, hanya dari sudut "seberapa efektif" vs "seberapa penting".

---

## 4. Sistem Pemetaan Kolom & Skoring — Tahap demi Tahap

Implementasi persis: fungsi `detectColumns()`, `similarity()`, dan `scoreRow()` pada `src/pages/msai.js`.

### 4.1 Tahap 1 — Deteksi Kolom Identitas

Dicari di seluruh header: Nama (`nama`/`name`), Jenis kelamin (`kelamin`/`gender`), Tanggal (`tanggal`/`timestamp`/`date`).

### 4.2 Tahap 2 — Pencocokan Kolom Soal via Fuzzy-Text Matching (`similarity()`)

**Ini satu-satunya modul di antara 7 tes yang sudah didokumentasikan yang benar-benar mengimplementasikan pencocokan berbasis isi teks header**, bukan asumsi posisi buta. Algoritmanya:

1. **Normalisasi teks** (`cleanStr`): lowercase, buang semua karakter selain huruf/angka/spasi, rapikan spasi berlebih.
2. **Fungsi `similarity(a, b)`** menghitung skor kemiripan 0–1:
   - Jika identik persis setelah normalisasi → skor 1.
   - Jika salah satu teks (setelah normalisasi) **memuat** teks yang lain secara utuh sebagai substring → skor = `panjang(teks pendek) / panjang(teks panjang)`.
   - Jika tidak, hitung jumlah karakter yang "match" antara kedua string (algoritma mirip Dice's coefficient sederhana berbasis multiset karakter, bukan Levenshtein distance) → skor = `(2 × jumlah_match) / (panjang_a + panjang_b)`.
3. Untuk setiap kolom non-demografi di file, **bandingkan headernya terhadap ke-87 pertanyaan kanonik** (`MSAI_QUESTIONS`), ambil nomor soal dengan skor kemiripan tertinggi.
4. **Ambang penerimaan:** hanya diterima sebagai match bila skor kemiripan **> 0.45**. Di bawah itu, kolom masuk daftar `unmapped`.

### 4.3 Tahap 3 — Fallback Sekuensial (Jika Fuzzy Match Gagal Total)

Jika hasil pemetaan fuzzy menghasilkan **kurang dari 50 soal berhasil dipetakan** (dari 87), sistem beralih total ke strategi cadangan: kolom-kolom non-demografi diurutkan sesuai posisi di file dan dipasangkan **berurutan** ke Q1, Q2, Q3, … — sama seperti pendekatan posisi-murni di Enneagram/RIASEC/Big Five/MBTI, tapi **hanya dipakai sebagai jaring pengaman terakhir**, bukan metode utama.

### 4.4 Tahap 4 — Halaman Pratinjau Pemetaan (Sebelum Skoring)

Sebelum menghitung, ditampilkan halaman terpisah menunjukkan:
- Badge status: jumlah soal berhasil terpetakan dari 87 (hijau jika ≥80, kuning jika kurang).
- Info kolom demografi yang terdeteksi (Nama/Gender/Tanggal → nomor kolom, atau "tidak terdeteksi").
- Tabel pemetaan (30 baris pertama): nomor soal → cuplikan teks header kolom yang cocok.
- Peringatan daftar nomor soal yang **tidak** berhasil dipetakan (`unmapped`), bila ada.
- Tombol **"✔ Konfirmasi & Hitung"** untuk melanjutkan ke skoring, atau **"← Upload Ulang"** untuk mengganti file.

> **Catatan keterbatasan:** halaman ini bersifat **read-only** — menampilkan hasil deteksi tapi **tidak menyediakan cara untuk mengoreksi manual** pemetaan yang salah (mis. dropdown untuk menugaskan ulang kolom ke nomor soal lain). Ini berbeda dari yang diminta draft spesifikasi (lihat Catatan & Riwayat Versi).

### 4.5 Tahap 5 — Skoring per Skill (Actual Behaviour)

Untuk tiap satu dari 12 skill:
```
nilai_terisi = [nilai valid (1-5) dari 5 item anggota skill tersebut]
missing      = item anggota yang nilainya tidak valid/kosong
actual       = rata-rata(nilai_terisi)   — jika ada nilai terisi
             = null                       — jika seluruh 5 item kosong/invalid
```
**Nilai dianggap valid hanya jika berupa angka 1–5** (`isFinite(v) && v >= 1 && v <= 5`); di luar itu (termasuk kosong) → `null`, **bukan** didiam-diamkan jadi 0 — konsisten dengan permintaan draft spesifikasi.

### 4.6 Tahap 6 — Effectiveness, Importance & Gap

```
effectiveness = nilai item Effectiveness tunggal skill tsb (Q61-Q72), atau null jika invalid/kosong
importance    = nilai item Importance tunggal skill tsb (Q76-Q87), atau null jika invalid/kosong
gap           = importance - actual   (hanya dihitung jika keduanya tidak null)
```

### 4.7 Tahap 7 — Skor 4 Kuadran

```
skor_kuadran = rata-rata dari actual (bukan effectiveness/importance) milik 3 skill anggota kuadran tersebut,
               dihitung hanya dari skill yang actual-nya tidak null
```

### 4.8 Tahap 8 — Penghitungan Item Hilang (`missingCount`)

Dijumlahkan lintas semua 12 skill (dari 60 item Q1-60 yang dipakai untuk Actual Behaviour) — field ini ditampilkan sebagai badge peringatan di ringkasan dan detail (`⚠️ {n}` bila > 0), **tidak disembunyikan**. Ini juga konsisten dengan permintaan draft ("laporkan ke user, jangan diam-diam jadi 0").

---

## 5. Pemetaan 12 Skill → Item, Kuadran, dan Kamus Label

### 5.1 Tabel Lengkap 12 Skill (Item Actual, Effectiveness, Importance)

| Skill | Kuadran | Item Actual (Q1-60) | Item Effectiveness | Item Importance |
|---|---|---|---|---|
| Managing Innovation | Adhocracy | 2, 8, 27, 45, 51 | Q64 | Q79 |
| Managing the Future | Adhocracy | 9, 14, 28, 46, 59 | Q65 | Q80 |
| Managing Continuous Improvement | Adhocracy | 26, 29, 44, 52, 53 | Q66 | Q81 |
| Managing Competitiveness | Market | 15, 30, 35, 42, 43 | Q67 | Q82 |
| Energising Employees | Market | 3, 6, 7, 31, 60 | Q68 | Q83 |
| Managing Customer Services | Market | 32, 33, 41, 54, 55 | Q69 | Q84 |
| Managing Coordination | Hierarchy | 11, 17, 37, 38, 57 | Q72 | Q87 |
| Managing the Control System | Hierarchy | 4, 16, 19, 36, 39 | Q71 | Q86 |
| Managing Acculturation | Hierarchy | 10, 34, 40, 56, 58 | Q70 | Q85 |
| Managing the Development of Others | Clan | 5, 20, 24, 25, 47 | Q63 | Q78 |
| Managing Interpersonal Relationships | Clan | 1, 13, 23, 48, 50 | Q62 | Q77 |
| Managing Teams | Clan | 12, 18, 21, 22, 49 | Q61 | Q76 |

> Ke-60 item Actual Behaviour (Q1–Q60) dipakai **tepat satu kali masing-masing** di seluruh 12 skill (tidak ada duplikasi, tidak ada yang terlewat) — sesuai catatan verifikasi draft.

### 5.2 Kamus 4 Kuadran (Competing Values Framework)

| Kuadran | Deskripsi | Skill Anggota | Warna |
|---|---|---|---|
| **Adhocracy** | Inovatif & Visioner — berfokus pada kreativitas, perubahan, dan pengembangan masa depan organisasi. | Managing Innovation, Managing the Future, Managing Continuous Improvement | `#8b5cf6` |
| **Market** | Kompetitif & Berorientasi Hasil — mendorong kinerja tinggi, kepuasan pelanggan, dan keunggulan bersaing. | Managing Competitiveness, Energising Employees, Managing Customer Services | `#f97316` |
| **Hierarchy** | Terstruktur & Terkontrol — menekankan koordinasi, sistem, dan konsistensi proses. | Managing Coordination, Managing the Control System, Managing Acculturation | `#06b6d4` |
| **Clan** | Kolaboratif & Membina — mengutamakan pengembangan orang, hubungan interpersonal, dan kerja tim. | Managing the Development of Others, Managing Interpersonal Relationships, Managing Teams | `#10b981` |

Pengelompokan tampilan mengikuti sumbu CVF asli: **FLEXIBILITY** (=Adhocracy), **EXTERNAL** (=Market), **CONTROL** (=Hierarchy), **INTERNAL** (=Clan).

### 5.3 Kamus Label Q73 (Overall Management Competency)

| Nilai | Label |
|---|---|
| 5 | Outstanding |
| 4 | Above Average |
| 3 | Average |
| 2 | Below Average |
| 1 | Poor |

### 5.4 Kamus Label Q74 (Ekspektasi Jenjang Karir)

| Nilai | Label |
|---|---|
| 5 | To the very top of the organisation |
| 4 | Near the top — just below the CEO |
| 3 | To a senior position (senior management team) |
| 2 | One level above current position |
| 1 | No higher than current position |

### 5.5 Kamus Label Q75 (Penilaian Diri vs Manajer Lain)

| Nilai | Label |
|---|---|
| 5 | Top 5% |
| 4 | Top 10% |
| 3 | Top 25% |
| 2 | Top 50% |
| 1 | In the bottom half |

---

## 6. Narasi Otomatis (`buildNarrative`)

Narasi dirangkai deterministik (tanpa AI eksternal, sesuai prinsip offline), terdiri dari:

1. **Kalimat pembuka:** kuadran dominan (skor tertinggi di antara 4 kuadran yang tidak null) + skornya + deskripsi kuadran dari kamus Bagian 5.2.
2. **Kuadran terlemah** (bila berbeda dari kuadran dominan): kalimat terpisah menyebut kuadran dengan skor terendah sebagai "yang paling perlu dikembangkan".
3. **Kekuatan (3 skill tertinggi):** daftar bullet dari 3 skill dengan `actual` tertinggi (yang tidak null).
4. **Prioritas Pengembangan (gap terbesar):** daftar bullet 3 skill dengan `gap` positif terbesar, ditampilkan sebagai `"{Skill} (gap: +{nilai})"` — mewakili skill yang penting bagi peran tapi perilakunya belum optimal.
5. **Kalimat Q73/Q74/Q75** (bila ada nilainya): masing-masing satu kalimat memakai label dari kamus Bagian 5.3–5.5, mis. *"Penilaian diri {Nama} terhadap kompetensi manajerial keseluruhan: {label Q73}."*

Kata ganti (`pronoun`) disesuaikan dari kolom gender: mengandung "pria"/"laki"/"l"/"m"/"male" → *"ia (laki-laki)"*; mengandung "wanita"/"perempuan"/"p"/"f"/"female" → *"ia (perempuan)"*; selain itu → *"ia"* netral. **Catatan:** variabel `pronoun` dihitung tapi **tidak dipakai** di teks narasi manapun (semua kalimat narasi memakai `{Nama}` langsung, bukan kata ganti) — kemungkinan sisa kode dari iterasi sebelumnya yang belum dibersihkan atau memang disiapkan untuk pemakaian di masa depan.

---

## 7. Struktur & Konten Laporan (Detail View / PDF)

Laporan per peserta tersusun sebagai berikut, sesuai `renderDetailView()` pada `msai.js`:

### A. Header Identitas
Nama, Jenis Kelamin, Tanggal. Peringatan item hilang (`⚠️ {n} item tidak terjawab`) ditampilkan di baris yang sama bila `missingCount > 0`.

### B. Kartu 4 Skor Kuadran
4 kartu berjajar (Adhocracy, Market, Hierarchy, Clan — urutan sesuai `MSAI_QUADRANTS`), masing-masing menampilkan skor rata-rata, nama kuadran, dan bar proporsional terhadap skala 0–5.

### C. Radar Chart 12 Skill Area (SVG Custom)
- 12 sumbu melingkar (bukan library eksternal — SVG digambar manual di kode), dikelompokkan berurutan per kuadran (Adhocracy → Market → Hierarchy → Clan), label sumbu diwarnai sesuai kuadrannya.
- Poligon utama = skor **Actual Behaviour**.
- **2 toggle overlay** (tombol "☑ Effectiveness" dan "☑ Importance") untuk menampilkan poligon tambahan skor Effectiveness dan/atau Importance pada radar yang sama, dengan opacity lebih rendah — default keduanya nonaktif (`off by default`), sesuai spesifikasi.
- Grid lingkaran skala 1–5, legenda warna kuadran di bagian bawah.

### D. Tabel Summary 3 Kolom
Tabel 12 baris (dikelompokkan per kuadran dengan sub-header berwarna), kolom: Skill Area, Actual Behaviour (bar + angka), Expected Effectiveness, Importance to Job, **Gap** (berwarna: oranye jika gap > 1, kuning jika gap > 0, hijau/sukses jika ≤ 0).

### E. Blok Narasi & Interpretasi
Kartu terpisah berisi narasi lengkap dari Bagian 6.

### F. Footer Laporan (khusus versi PDF, disisipkan dinamis)
- Header PDF: logo + **"Ruang Scoring"** (bukan "PsikoScoring CNA" seperti MBTI/Enneagram — nama brand berbeda, kemungkinan modul ini dibuat di fase rebranding berikutnya) + judul "Laporan MSAI" + tanggal cetak.
- Footer PDF: *"Laporan ini bersifat konfidensial. Dibuat dengan Ruang Scoring."*

### G. Fitur Unduh & Ekspor
- **Unduh PDF** per peserta (`html2pdf`, margin dalam mm, format A4 potrait) — berfungsi normal.
- **Download Excel Rekap** — satu file `.xlsx` berisi **satu sheet** (`MSAI Rekap`) dengan satu baris per peserta, kolom: Nama, Gender, Tanggal, lalu untuk tiap 12 skill: `Actual:{skill}`, kemudian blok `Effectiveness:{skill}` semua skill, blok `Importance:{skill}` semua skill, blok `Gap:{skill}` semua skill, lalu skor 4 kuadran, Q73/Q74/Q75 (nilai mentah, bukan label), dan `Missing Items`.
- **Tidak ada** fitur "Unduh Semua (ZIP)" untuk PDF batch — sama seperti MBTI/Enneagram, hanya PDF per-peserta yang tersedia.
- Tombol **"Unduh Template Excel"** ada di halaman upload, tapi **memanggil fungsi yang tidak ada** — lihat bug di Catatan & Riwayat Versi.

### H. Navigasi
- Ringkasan (tabel semua peserta: No, Nama, Gender, skor 4 kuadran, badge kuadran dominan, badge missing item, tombol Detail) → klik baris untuk ke Detail.
- Di halaman Detail: tombol Sebelumnya/Berikutnya untuk berpindah antar peserta.

---

## 8. Format File Input (Teknis)

- Ekstensi: `.xlsx`, `.xls`, atau `.csv`.
- Baris pertama = header, dibaca sebagai array datar (`header:1`) tanpa asumsi struktur tetap.
- **Tidak ada validasi jumlah kolom minimum** di tahap upload (berbeda dari tes lain) — validasi kelengkapan sepenuhnya diserahkan ke halaman Pratinjau Pemetaan Kolom (badge hijau/kuning berdasarkan jumlah soal terpetakan).
- Kolom demografi (`isDemoCol`) dikenali dari kata kunci: `timestamp`, `email`, `nama`, `name`, `gender`, `jenis kelamin`, `tanggal`, `date` — kolom-kolom ini **dikecualikan** dari proses fuzzy-matching pertanyaan.
- Baris tanpa nama (setelah trim) dilewati saat pemrosesan skor.

---

## Catatan & Riwayat Versi

Dibandingkan dengan `zlainnya/PROMPT_MSAI_Generator_Antigravity.md`, implementasi aktual **paling setia** pada spesifikasi dibanding modul-modul lain yang sudah didokumentasikan — termasuk pada bagian-bagian yang secara eksplisit disebut sebagai *"definition of done"* (fuzzy match + fallback posisi, penanganan missing value yang transparan, bukan skoring dari kombinasi acak). Perbedaan yang ditemukan:

| Aspek | Draft (`PROMPT_MSAI_Generator_Antigravity.md`) | Implementasi Aktual (`msai.js`) |
|---|---|---|
| Pencocokan kolom → soal | Fuzzy match (utama) + fallback posisi (cadangan) + **opsi koreksi manual via dropdown** | Fuzzy match + fallback posisi **diimplementasikan dengan benar**, tapi **koreksi manual tidak ada** — halaman pratinjau bersifat read-only, hanya bisa "Konfirmasi" atau "Upload Ulang" (mengulang dari awal), tidak bisa memperbaiki satu-dua kolom yang salah tanpa mengunggah ulang seluruh file |
| Penanganan nilai tidak valid/kosong | Wajib dilaporkan ke user, jangan diam-diam jadi 0 | **Diimplementasikan dengan benar** — nilai invalid/kosong jadi `null`, dihitung sebagai `missingCount`, ditampilkan sebagai badge peringatan di ringkasan & detail |
| Ekspor Excel | Sheet 1 = rekap semua peserta; **Sheet 2+ (atau opsi per-peserta) = detail tabel summary 3 kolom** | Hanya **Sheet 1 (rekap)** yang diimplementasikan — sheet detail per peserta tidak ada; detail lengkap hanya bisa dilihat di tampilan layar/PDF, tidak di file Excel |
| Unit test skoring | Diminta unit test yang membuktikan union item 12 skill = {1..60} tanpa duplikat, dan kasus manual (isi semua 5 → semua skill/kuadran = 5) | **Tidak ditemukan berkas unit test terkait** di repository — tidak bisa diverifikasi apakah pernah dijalankan, meski secara manual pemetaan item di `MSAI_SKILLS` memang sudah menutup {1..60} tanpa duplikat maupun celah (diverifikasi manual saat penyusunan dokumen ini) |
| Tombol "Unduh Template Excel" | Diminta sebagai bagian alur (tersirat dari pola tes lain yang semuanya punya tombol ini) | 🐛 **BUG:** tombol memanggil `downloadMsaiTemplate()`, namun **fungsi ini tidak pernah didefinisikan di manapun dalam `msai.js`** (tidak ada `function downloadMsaiTemplate` maupun impor dari file lain). Mengklik tombol ini akan menghasilkan `ReferenceError` di console browser dan tombol tidak melakukan apa-apa yang terlihat oleh pengguna |
| Branding footer PDF | Tidak dispesifikasi nama brand tertentu | Memakai **"Ruang Scoring"**, berbeda dari MBTI/Enneagram yang memakai **"PsikoScoring CNA"** — indikasi modul ini dibuat setelah rebranding aplikasi, jejak historis penamaan yang tidak konsisten antar modul |
| Algoritma "fuzzy match" | Disebut sebagai "pencocokan berbasis similarity (rasio kemiripan tinggi)" tanpa menentukan algoritma pasti | Implementasi custom: substring-ratio + Dice-coefficient sederhana berbasis multiset karakter — bukan Levenshtein distance klasik, tapi cukup untuk toleransi variasi kecil ejaan/spasi seperti yang dimaksud draft |

**Kesimpulan:** MSAI adalah modul dengan **kualitas implementasi tertinggi** dari sisi kesetiaan pada spesifikasi teknis inti (skoring, penanganan data hilang, keamanan pemetaan kolom) di antara semua tes yang sudah didokumentasikan. Kelemahan yang ada bersifat **fitur pelengkap yang belum lengkap** (koreksi manual pemetaan, sheet detail Excel) dan **satu bug nyata yang mudah diperbaiki** (fungsi `downloadMsaiTemplate` yang hilang) — bukan kesalahan pada logika skoring inti.

---

## Sumber Dokumen

- `src/pages/msai.js` — implementasi aktual (deteksi kolom, fuzzy matching, skoring, radar chart, narasi, render, PDF, ekspor Excel).
- `src/data/msai_data.js` — definisi 12 skill, 4 kuadran, kamus label Q73/Q74/Q75, bank 87 pertanyaan kanonik.
- `zlainnya/PROMPT_MSAI_Generator_Antigravity.md` — draft spesifikasi lengkap (kunci skoring, bank pertanyaan, algoritma pemetaan kolom — konsisten dengan kode aktual pada hampir seluruh bagian inti).
