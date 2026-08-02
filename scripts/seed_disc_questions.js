const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

const discQuestions = [
  ["Mudah bergaul, ramah, menyenangkan", "Penuh kepercayaan, percaya pada orang lain", "Petualang, pengambil risiko", "Toleran, penuh hormat"],
  ["Lembut dalam tutur kata, pendiam", "Persuasif, meyakinkan", "Kerja keras, pantang menyerah", "Suka kerapian, teliti"],
  ["Suka membantu, ramah", "Suka kepemimpinan, tegas", "Menghindari konflik, tenang", "Suka fakta dan angka, sistematis"],
  ["Kritis, mudah mempertanyakan", "Mudah menyesuaikan diri, fleksibel", "Ramah, suka berteman", "Penuh semangat, energik"],
  ["Cepat bertindak, berani", "Mengharapkan yang terbaik, optimis", "Sabar, pendengar yang baik", "Berhati-hati, cermat"],
  ["Mandiri, percaya diri", "Komunikatif, antusias", "Setia, suka stabilitas", "Akurat, berstandar tinggi"],
  ["Suka tantangan baru", "Pandai bergaul, hangat", "Stabil, konsisten", "Metodis, terstruktur"],
  ["Berorientasi hasil, fokus target", "Ekspresif, penuh ide", "Menyenangkan orang lain, kooperatif", "Analitis, berpatokan aturan"],
  ["Dominan, memegang kendali", "Suka dipuji, ceria", "Rendah hati, tenang", "Disiplin, mematuhi prosedur"],
  ["Cepat mengambil keputusan", "Kharismatik, memotivasi", "Sabar dalam proses", "Perfeksionis, teliti"],
  ["Berani mengambil alih", "Suka keramaian, terbuka", "Pendengar yang hangat", "Menganalisis sebelum bertindak"],
  ["Tegas, lugas", "Suka menginspirasi", "Harmonis, suka perdamaian", "Terencana, terorganisir"],
  ["Pengambil keputusan cepat", "Penuh daya tarik sosial", "Konsisten dalam rutinitas", "Berpikir logis, obyektif"],
  ["Kompetitif, suka menang", "Antusias, bersemangat", "Empati tinggi, peduli", "Cermat, menghindari kesalahan"],
  ["Gigih, tidak mudah menyerah", "Gembira, menyenangkan", "Penyabar, penuh pengertian", "Berhati-hati pada risiko"],
  ["Percaya pada kemampuan sendiri", "Pandai bicara, persuasif", "Suka bekerja sama dalam tim", "Sangat menjaga ketelitian"],
  ["Berambisi tinggi", "Suka dipuji dan dihargai", "Sabar dan tenang", "Taat pada aturan resmi"],
  ["Berani menghadapi konflik", "Ramah dan mudah tersenyum", "Setia pada organisasi/teman", "Kritis terhadap detail"],
  ["Fokus pada tujuan akhir", "Suka suasana ceria", "Konsisten dan dapat diandalkan", "Mengutamakan keakuratan data"],
  ["Tegas dalam bertindak", "Kreatif dan inovatif", "Tenang menghadapi situasi", "Sistematis dalam bekerja"],
  ["Suka mengendalikan situasi", "Suka bersosialisasi", "Suka membantu rekan", "Tekun dan teliti"],
  ["Pantang mundur", "Suka berdiskusi terbuka", "Menjaga kerukunan", "Patuh pada standar kerja"],
  ["Mengatasi tantangan", "Membangun hubungan positif", "Memberi dukungan pada sesama", "Mengevaluasi risiko cermat"],
  ["Siap memimpin", "Mudah akrab", "Stabil dan tenang", "Akurat dan teratur"]
];

async function seed() {
  console.log('Finding DISC test ID...');
  const tests = await sql`SELECT id FROM master_tests WHERE LOWER(code) = 'disc' LIMIT 1`;
  if (!tests.length) {
    console.error('DISC test not found in master_tests!');
    process.exit(1);
  }
  const discTestId = tests[0].id;
  console.log(`DISC Test ID: ${discTestId}`);

  // Delete existing question banks for DISC
  await sql`DELETE FROM question_banks WHERE test_id = ${discTestId}`;

  // Insert 24 DISC questions
  for (let i = 0; i < discQuestions.length; i++) {
    const items = discQuestions[i];
    const orderNumber = i + 1;
    const questionData = JSON.stringify({ items });
    await sql`
      INSERT INTO question_banks (test_id, question_type, question_data, order_number)
      VALUES (${discTestId}, 'disc', ${questionData}::jsonb, ${orderNumber})
    `;
  }

  console.log(`Successfully seeded ${discQuestions.length} DISC questions!`);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
