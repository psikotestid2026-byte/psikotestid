const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

const wptQuestions = [
  { text: "Bulan lalu pada awal tahun ini adalah:", options: ["Januari", "Maret", "Juli", "Desember", "Oktober"] },
  { text: "MENANGKAP adalah lawan kata dari:", options: ["Meletakkan", "Membebaskan", "Membiarkan", "Menahan", "Turun tingkat"] },
  { text: "Sebagian besar hal di bawah ini serupa satu sama lain. Manakah yang kurang serupa?", options: ["Kucing", "Anjing", "Mobil", "Kuda", "Sapi"] },
  { text: "Apakah RSVP berarti 'jawablah jika tidak perlu'?", options: ["Ya", "Tidak", "Tidak Tahu"] },
  { text: "Dalam kelompok kata berikut, manakah kata yang berbeda?", options: ["Pasukan", "Liga", "Berpartisipasi", "Paket", "Kelompok"] },
  { text: "BIASA adalah lawan kata dari:", options: ["Jarang", "Terbiasa", "Berhenti", "Luar Biasa", "Selalu"] },
  { text: "Manakah dari bentuk berikut yang merupakan gabungan dua potongan gambar?", options: ["Bentuk 1", "Bentuk 2", "Bentuk 3", "Bentuk 4", "Bentuk 5"] },
  { text: "Perhatikan urutan angka berikut. Angka berapa yang muncul berikutnya? 8, 4, 2, 1, 1/2, 1/4, ...", options: ["1/8", "1/6", "1/16", "0", "1/2"] },
  { text: "Klien dan Pelanggan. Apakah kata-kata ini:", options: ["Memiliki arti yang sama", "Memiliki arti berlawanan", "Tidak memiliki arti sama atau berlawanan"] },
  { text: "Manakah kata berikut ini yang berhubungan dengan mencium, seperti halnya gigi dengan mengunyah?", options: ["Manis", "Bersih", "Bau tak sedap", "Bau wangi", "Hidung"] },
  { text: "MUSIM GUGUR adalah lawan dari:", options: ["Liburan", "Musim Panas", "Musim Semi", "Musim Dingin", "Hujan"] },
  { text: "Sebuah pesawat terbang 300 kaki dalam 0.5 detik. Dengan kecepatan yang sama, berapa kaki ia terbang dalam 10 detik?", options: ["3.000 kaki", "6.000 kaki", "1.500 kaki", "12.000 kaki", "4.500 kaki"] },
  { text: "\"Anak-anak lelaki ini adalah anak yang normal.\" Apakah kalimat ini:", options: ["Benar", "Salah", "Tidak Tahu"] },
  { text: "JAUH adalah lawan kata dari:", options: ["Terpencil", "Dekat", "Jarak", "Terburu-buru", "Pasti"] },
  { text: "3 permen lemon seharga 10 rupiah. Berapa harga 6 permen?", options: ["15 rupiah", "20 rupiah", "25 rupiah", "30 rupiah", "18 rupiah"] },
  { text: "Berapa banyak pasangan angka identik berikut? (3254-3254, 4215-4215, 6314-6314, 5214-5214, 1423-1423)", options: ["1", "2", "3", "4", "5"] },
  { text: "Susunlah kata-kata berikut menjadi kalimat: 'penyanyi dia seorang merupakan'. Apakah huruf pertama dari kata ketiga?", options: ["S", "P", "D", "M", "E"] },
  { text: "Anak lelaki berumur 5 tahun dan saudara perempuannya berumur dua kali lipat. Ketika anak lelaki tersebut berumur 8 tahun, berapa umur saudara perempuannya?", options: ["10 tahun", "11 tahun", "13 tahun", "16 tahun", "14 tahun"] },
  { text: "IT'S dan ITS. Apakah kata-kata ini:", options: ["Memiliki arti yang sama", "Memiliki arti berlawanan", "Memiliki tata bahasa dan arti berbeda"] },
  { text: "\"John seusia dengan Sally. Sally lebih muda dari Bill. Bill lebih tua dari John.\" Jika 2 pernyataan pertama benar, maka pernyataan ketiga adalah:", options: ["Benar", "Salah", "Tidak pasti"] },
  { text: "Seorang pedagang membeli beberapa barel seharga 4.000 rupiah. Ia menjualnya kembali seharga 5.000 rupiah dan mendapat untung 50 rupiah per barel. Berapa barel yang dijual?", options: ["10 barel", "20 barel", "50 barel", "100 barel", "25 barel"] },
  { text: "Susunlah kata-kata berikut menjadi kalimat: 'sebuah kaki tiga memiliki segitiga'. Pernyataan tersebut adalah:", options: ["Benar", "Salah", "Tidak pasti"] },
  { text: "Dua dari peribahasa berikut memiliki arti yang mirip: 1) Ada gula ada semut, 2) Air tenang menghanyutkan, 3) Di mana bumi dipijak di sana langit dijunjung, 4) Dimana ada gula di situ ada semut. Manakah itu?", options: ["1 dan 2", "1 dan 4", "2 dan 3", "3 dan 4"] },
  { text: "Sebuah jam terlambat 1 menit 18 detik dalam 39 hari. Berapa detik terlambat dalam sehari?", options: ["1 detik", "2 detik", "3 detik", "4 detik", "5 detik"] },
  { text: "CANVASS dan CANVAS. Apakah kata-kata ini:", options: ["Memiliki arti yang sama", "Memiliki arti berlawanan", "Memiliki arti berbeda"] },
  { text: "\"Semua siswa mengikuti ujian. Beberapa orang di ruangan ini adalah siswa. Oleh karena itu, beberapa orang di ruangan ini mengikuti ujian.\" Apakah pernyataan tersebut:", options: ["Benar", "Salah", "Tidak pasti"] },
  { text: "Dalam 30 hari seorang menabung 1 dolar (100 sen). Berapa rata-rata tabungan per hari dalam sen (dibulatkan)?", options: ["3.33 sen", "3 sen", "10 sen", "30 sen", "1 sen"] },
  { text: "INGENIOUS dan INGENUOUS. Apakah kata-kata ini:", options: ["Memiliki arti yang sama", "Memiliki arti berlawanan", "Memiliki arti berbeda"] },
  { text: "Dua orang menangkap 36 ikan. X menangkap 5 kali lebih banyak dari Y. Berapa banyak ikan yang ditangkap Y?", options: ["5 ikan", "6 ikan", "7 ikan", "30 ikan", "12 ikan"] },
  { text: "Sebuah kotak segi empat terisi penuh, memiliki panjang 9 meter, lebar 6 meter, dan tinggi 4 meter. Berapa volume kotak tersebut dalam meter kubik?", options: ["108 m³", "216 m³", "144 m³", "196 m³", "72 m³"] },
  { text: "Satu angka dari rangkaian berikut tidak cocok: 1/10, 1/100, 1/1000, 1/10000. Angka berikutnya yang sesuai pola adalah:", options: ["1/100000", "1/10000", "1/20000", "1/50000"] },
  { text: "Apakah PM berarti 'Post Meridiem'?", options: ["Ya", "Tidak", "Tidak Tahu"] },
  { text: "DAPAT DIPERCAYA dan GAMPANG PERCAYA. Apakah kata-kata ini:", options: ["Memiliki arti yang sama", "Memiliki arti berlawanan", "Memiliki arti berbeda"] },
  { text: "Sebuah rok membutuhkan 2 1/4 meter kain. Berapa banyak rok yang dapat dibuat dari 45 meter kain?", options: ["15 rok", "18 rok", "20 rok", "22 rok", "25 rok"] },
  { text: "Sebuah jam menunjukkan tepat pukul 12 siang pada hari Senin. Pada pukul 2 siang hari Rabu berikutnya (50 jam), ia terlambat 25 detik. Berapa detik keterlambatan jam tersebut dalam 1 jam?", options: ["0.5 detik", "1 detik", "2 detik", "5 detik"] },
  { text: "Tim bisbol kami kalah 9 permainan dalam musim ini. Ini merupakan 3/8 dari seluruh permainan. Berapa banyak total permainan yang dimainkan?", options: ["18 permainan", "24 permainan", "27 permainan", "32 permainan", "36 permainan"] },
  { text: "Apakah angka selanjutnya dari deret ini? 100, 97, 94, 91, 88, 85, ...", options: ["82", "81", "83", "80", "84"] },
  { text: "Manakah pasangan sudut yang dapat membentuk sebuah bujur sangkar jika digabungkan?", options: ["Dua segitiga siku-siku sama kaki", "Dua lingkaran", "Dua garis lurus", "Dua trapesium sembarang"] },
  { text: "\"Sebuah sapu yang baru menyapu dengan bersih.\" Apakah peribahasa ini bermakna:", options: ["Karyawan/alat baru sering bekerja sangat efisien", "Sapu tua tidak bisa dipakai", "Pekerjaan bersih hanya untuk orang kaya"] },
  { text: "Berapa banyak dari 3 pasangan kata berikut yang artinya persis sama? (Besar-Agung, Terang-Cerah, Cepat-Laju)", options: ["0", "1", "2", "3"] },
  { text: "Dua dari peribahasa ini memiliki makna yang serupa: 1) Hemat pangkal kaya, 2) Rajin pangkal pandai, 3) Sedikit-sedikit lama-lama menjadi bukit. Manakah itu?", options: ["1 dan 2", "1 dan 3", "2 dan 3"] },
  { text: "Sebuah jajar genjang dapat dibagi garis lurus menjadi dua bagian yang membentuk persegi panjang jika sudutnya:", options: ["90 derajat", "45 derajat", "180 derajat", "60 derajat"] },
  { text: "Dalam kelompok angka berikut, manakah angka terkecil? 10, 1, 0.9, 0.99, 0.88, 2, 0.33", options: ["0.9", "0.99", "0.88", "0.33", "1"] },
  { text: "\"Tidak ada orang jujur meminta maaf atas kejujurannya.\" Apakah kalimat ini bermakna:", options: ["Kejujuran adalah nilai moral yang tidak perlu disesali", "Orang jujur tidak pernah bersalah", "Orang jujur selalu meminta maaf"] },
  { text: "Sebuah grosir membeli 12 lusin buah seharga Rp 180.000. Berapa harga per buah?", options: ["Rp 1.000", "Rp 1.250", "Rp 1.500", "Rp 2.000"] },
  { text: "Dalam rangkaian kata berikut, manakah kata yang berbeda?", options: ["Kelereng", "Bola", "Kubus", "Global", "Mutiara"] },
  { text: "\"Orang besar dibodohi. Saya dibodohi. Saya adalah orang besar.\" Kesimpulan ini:", options: ["Benar", "Salah (Sesat Pikir)", "Tidak pasti"] },
  { text: "Tiga orang membagi keuntungan Rp 900.000 sama rata. Berapa bagian masing-masing?", options: ["Rp 200.000", "Rp 300.000", "Rp 400.000", "Rp 450.000"] },
  { text: "Empat dari 5 bentuk berikut dapat digabungkan membentuk segitiga siku-siku. Berapa jumlah sudut dalam segitiga tersebut?", options: ["90 derajat", "180 derajat", "360 derajat", "270 derajat"] },
  { text: "Untuk mencetak artikel berisi 30.000 kata dengan kecepatan 600 kata per menit, berapa menit waktu yang dibutuhkan?", options: ["30 menit", "45 menit", "50 menit", "60 menit", "100 menit"] }
];

async function seed() {
  console.log('Finding WPT test ID...');
  const tests = await sql`SELECT id FROM master_tests WHERE LOWER(code) = 'wpt' LIMIT 1`;
  if (!tests.length) {
    console.error('WPT test not found in master_tests!');
    process.exit(1);
  }
  const wptTestId = tests[0].id;
  console.log(`WPT Test ID: ${wptTestId}`);

  // Delete existing question banks for WPT
  await sql`DELETE FROM question_banks WHERE test_id = ${wptTestId}`;

  // Insert 50 WPT questions
  for (let i = 0; i < wptQuestions.length; i++) {
    const q = wptQuestions[i];
    const orderNumber = i + 1;
    const questionData = JSON.stringify({ text: q.text, options: q.options });
    await sql`
      INSERT INTO question_banks (test_id, question_type, question_data, order_number)
      VALUES (${wptTestId}, 'multiple_choice', ${questionData}::jsonb, ${orderNumber})
    `;
  }

  console.log(`Successfully seeded ${wptQuestions.length} WPT questions!`);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
