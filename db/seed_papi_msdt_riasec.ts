// @ts-nocheck
// Idempotent seed script for PAPI, MSDT, and RIASEC question banks + scoring_configs.
// Safe to re-run: skips insertion per test if question_banks already has rows for that test_id.
// Never deletes/truncates rows belonging to any other test_id (bigfive/disc/enneagram/wpt/tech_js untouched).
import { config } from 'dotenv';
config({ path: '.env.local' });

import pg from 'pg';
const { Client } = pg;

// ==========================================
// PAPI Kostick — 90 items, 20 aspects (refs/docs/papi.md Section 3)
// ==========================================
const PAPI_ITEMS: [string, string, string, string][] = [
  ['Saya seorang pekerja keras', 'G', 'Saya tidak suka uring-uringan', 'E'],
  ['Saya suka menghasilkan pekerjaan yang lebih baik daripada orang lain', 'A', 'Saya akan tetap menangani suatu pekerjaan sampai selesai', 'N'],
  ['Saya suka menunjukkan pada orang lain cara melakukan sesuatu', 'P', 'Saya ingin berusaha sebaik mungkin', 'A'],
  ['Saya suka melucu', 'X', 'Saya senang memberitahu orang lain hal-hal yang harus dikerjakan', 'P'],
  ['Saya suka bergabung dengan kelompok', 'B', 'Saya senang diperhatikan oleh kelompok', 'X'],
  ['Saya suka menjalin hubungan pribadi yang akrab', 'O', 'Saya suka berteman dengan kelompok', 'B'],
  ['Saya dapat cepat berubah jika merasa perlu', 'Z', 'Saya berusaha menjalin hubungan pribadi yang akrab', 'O'],
  ['Saya suka menyerang kembali jika benar-benar disakiti', 'K', 'Saya suka melakukan hal-hal yang baru dan berbeda', 'Z'],
  ['Saya ingin agar atasan menyukai saya', 'F', 'Saya suka menegur orang lain jika mereka melakukan kesalahan', 'K'],
  ['Saya suka mengikuti petunjuk-petunjuk yang diberikan pada saya', 'W', 'Saya suka menyenangkan orang-orang yang menjadi atasan saya', 'F'],
  ['Saya berusaha keras sekali', 'G', 'Saya seorang yang teratur. Saya meletakkan segala sesuatu pada tempatnya', 'C'],
  ['Saya dapat membuat orang lain melakukan apa yang saya inginkan', 'L', 'Saya tidak mudah marah', 'E'],
  ['Saya suka memberitahu kelompok, hal-hal yang harus mereka kerjakan', 'P', 'Saya selalu bertahan pada suatu pekerjaan sampai selesai', 'N'],
  ['Saya ingin menjadi orang yang penuh gairah dan menarik', 'X', 'Saya ingin menjadi orang yang sangat berhasil', 'A'],
  ['Saya ingin menjadi bagian dalam kelompok', 'B', 'Saya suka membantu orang lain mengambil keputusan', 'P'],
  ['Saya cemas bila seseorang tidak menyukai saya', 'O', 'Saya ingin agar orang lain memperhatikan saya', 'X'],
  ['Saya suka mencoba hal-hal baru', 'Z', 'Saya lebih suka bekerja bersama orang lain daripada sendiri', 'B'],
  ['Kadang-kadang saya menyalahkan orang lain jika ada yang tidak beres', 'K', 'Saya merasa terganggu jika seseorang tidak menyukai saya', 'O'],
  ['Saya suka menyenangkan orang yang menjadi atasan saya', 'F', 'Saya senang mencoba pekerjaan yang baru dan berbeda', 'Z'],
  ['Saya menyukai petunjuk-petunjuk terperinci untuk melaksanakan tugas', 'W', 'Saya suka memberitahu orang lain apabila mereka menjengkelkan', 'K'],
  ['Saya selalu berusaha keras', 'G', 'Saya selalu melaksanakan setiap langkah dengan sangat hati-hati', 'D'],
  ['Saya seorang pemimpin yang baik', 'L', 'Saya menata pekerjaan dengan baik', 'C'],
  ['Saya mudah marah', 'I', 'Saya lambat dalam membuat keputusan', 'E'],
  ['Saya suka mengerjakan beberapa tugas pada saat yang bersamaan', 'X', 'Bila berada dalam satu kelompok, saya suka berdiam diri', 'N'],
  ['Saya senang sekali bila diundang', 'B', 'Saya ingin melakukan sesuatu lebih baik dari pada orang lain', 'A'],
  ['Saya suka menjalin hubungan pribadi yang akrab', 'O', 'Saya suka memberi nasihat pada orang lain', 'P'],
  ['Saya suka melakukan hal-hal yang baru dan berbeda', 'Z', 'Saya suka menceritakan bagaimana saya berhasil dalam melakukan sesuatu', 'X'],
  ['Apabila pendapat saya benar, saya suka mempertahankannya', 'K', 'Saya ingin menjadi bagian dari suatu kelompok', 'B'],
  ['Saya tidak mau berbeda dari orang lain', 'F', 'Saya berusaha akrab dengan orang lain', 'O'],
  ['Saya senang diberitahu bagaimana melakukan suatu pekerjaan', 'W', 'Saya mudah bosan', 'Z'],
  ['Saya bekerja keras', 'G', 'Saya banyak berpikir dan membuat rencana', 'R'],
  ['Saya memimpin kelompok', 'L', 'Detail (hal-hal kecil) menarik buat saya', 'D'],
  ['Saya membuat keputusan dengan mudah dan cepat', 'I', 'Saya menyimpan barang-barang secara rapi dan teratur', 'C'],
  ['Saya membuat keputusan dengan mudah dan cepat', 'T', 'Saya jarang marah atau sedih', 'E'],
  ['Saya ingin menjadi bagian dalam kelompok', 'B', 'Saya ingin melakukan hanya satu pekerjaan pada satu waktu', 'N'],
  ['Saya berusaha berteman secara akrab', 'O', 'Saya berusaha sangat keras untuk menjadi yang terbaik', 'A'],
  ['Saya suka gaya terbaru dalam hal pakaian dan mobil', 'Z', 'Saya suka bertanggung jawab atas orang lain', 'P'],
  ['Saya senang berdebat', 'K', 'Saya suka mendapat perhatian', 'X'],
  ['Saya suka menyenangkan orang yang menjadi atasan saya', 'F', 'Saya tertarik untuk menjadi bagian dari kelompok', 'B'],
  ['Saya suka mengikuti peraturan dengan hati-hati', 'W', 'Saya suka orang lain mengenal saya dengan baik', 'O'],
  ['Saya berusaha keras sekali', 'G', 'Saya sangat ramah', 'S'],
  ['Orang lain berpendapat bahwa saya pemimpin yang baik', 'L', 'Saya berpikir hati-hati dan lama', 'R'],
  ['Saya sering memanfaatkan kesempatan', 'I', 'Saya suka cerewet mengenai hal-hal yang kecil', 'D'],
  ['Orang lain berpendapat bahwa saya bekerja cepat', 'T', 'Orang lain berpendapat bahwa saya menyimpan segala sesuatu secara teratur dan rapi', 'C'],
  ['Saya menyukai permainan dan olahraga', 'V', 'Saya sangat menyenangkan', 'E'],
  ['Saya senang bila orang lain bersikap akrab dan ramah', 'O', 'Saya selalu berusaha menyelesaikan sesuatu yang telah saya mulai', 'N'],
  ['Saya suka bereksperimen dan mencoba hal-hal baru', 'Z', 'Saya suka melaksanakan pekerjaan yang sulit dengan baik', 'A'],
  ['Saya suka diperlakukan secara adil', 'K', 'Saya suka memberitahu orang lain cara mengerjakan sesuatu', 'P'],
  ['Saya suka melakukan hal-hal yang diharapkan dari saya', 'F', 'Saya suka mendapat perhatian', 'X'],
  ['Saya suka petunjuk-petunjuk terperinci untuk melaksanakan suatu tugas', 'W', 'Saya senang berada bersama orang lain', 'B'],
  ['Saya selalu berusaha melakukan pekerjaan secara sempurna', 'G', 'Orang mengatakan bahwa saya hampir tidak pernah lelah', 'V'],
  ['Saya tipe seorang pemimpin', 'L', 'Saya mudah berteman', 'S'],
  ['Saya memanfaatkan kesempatan', 'I', 'Saya banyak sekali berpikir', 'R'],
  ['Saya bekerja dengan tempo yang cepat dan mantap', 'T', 'Saya senang menangani pekerjaan detail', 'D'],
  ['Saya memiliki banyak tenaga untuk permainan dan olahraga', 'V', 'Saya menyimpan segala sesuatu secara rapi dan teratur', 'C'],
  ['Saya bergaul dengan semua orang', 'S', 'Saya berwatak tenang', 'E'],
  ['Saya ingin bertemu orang-orang baru dan melakukan hal-hal baru', 'Z', 'Saya selalu ingin menyelesaikan pekerjaan yang telah saya mulai', 'N'],
  ['Saya biasanya suka mempertahankan keyakinan saya', 'K', 'Saya biasanya suka bekerja keras', 'A'],
  ['Saya menyukai saran-saran dari orang-orang yang saya kagumi', 'F', 'Saya suka bertanggung jawab terhadap orang lain', 'P'],
  ['Saya membiarkan orang lain memengaruhi diri saya secara kuat', 'W', 'Saya suka mendapat banyak perhatian', 'X'],
  ['Saya biasanya bekerja keras sekali', 'G', 'Saya biasanya bekerja cepat', 'T'],
  ['Apabila saya berbicara, kelompok menyimak', 'L', 'Saya terampil menggunakan peralatan', 'V'],
  ['Saya lambat dalam berteman', 'I', 'Saya lambat dalam mengambil keputusan', 'S'],
  ['Saya biasa makan dengan cepat', 'T', 'Saya senang membaca', 'R'],
  ['Saya menyukai pekerjaan yang membuat saya banyak bergerak', 'V', 'Saya menyukai pekerjaan yang harus saya kerjakan secara hati-hati', 'D'],
  ['Saya berteman dengan sebanyak mungkin orang', 'S', 'Saya dapat menemukan sesuatu yang telah saya sisihkan', 'C'],
  ['Saya merencanakan jauh dimuka', 'R', 'Saya selalu menyenangkan', 'E'],
  ['Saya sangat bangga akan nama baik saya', 'K', 'Saya tetap menangani suatu permasalahan sampai terpecahkan', 'N'],
  ['Saya suka menyenangkan orang-orang yang saya kagumi', 'F', 'Saya ingin berhasil', 'A'],
  ['Saya suka orang-orang lain membuat keputusan-keputusan untuk kelompok', 'W', 'Saya suka membuat keputusan-keputusan untuk kelompok', 'P'],
  ['Saya selalu berusaha sangat keras', 'G', 'Saya membuat keputusan secara mudah & cepat', 'I'],
  ['Kelompok biasanya melaksanakan keinginan saya', 'L', 'Saya biasa tergesa-gesa', 'T'],
  ['Saya sering merasa lelah', 'I', 'Saya lambat dalam membuat keputusan', 'V'],
  ['Saya bekerja cepat', 'T', 'Saya mudah berteman', 'S'],
  ['Saya biasa bersemangat atau bergairah', 'V', 'Saya menggunakan banyak waktu untuk berpikir', 'R'],
  ['Saya sangat ramah terhadap orang lain', 'S', 'Saya menyukai pekerjaan yang menuntut ketelitian', 'D'],
  ['Saya banyak berpikir dan merencanakan', 'R', 'Saya menyimpan segala sesuatu pada tempatnya', 'C'],
  ['Saya menyukai pekerjaan yang menuntut hal-hal yang mendetail', 'D', 'Saya tidak cepat marah', 'E'],
  ['Saya suka mengikuti orang-orang yang saya kagumi', 'F', 'Saya selalu menyelesaikan pekerjaan yang telah saya mulai', 'N'],
  ['Saya menyukai petunjuk-petunjuk yang jelas', 'W', 'Saya suka bekerja keras', 'A'],
  ['Saya mengejar hal-hal yang menjadi keinginan saya', 'G', 'Saya seorang pemimpin yang baik', 'L'],
  ['Saya membuat orang lain bekerja keras', 'L', 'Saya suka bersenang-senang', 'I'],
  ['Saya membuat keputusan dengan cepat', 'I', 'Saya berbicara cepat', 'T'],
  ['Saya biasanya bekerja secara tergesa-gesa', 'T', 'Saya berolahraga secara teratur', 'V'],
  ['Saya tidak suka bertemu orang-orang lain', 'V', 'Saya cepat lelah', 'S'],
  ['Saya berteman dengan banyak sekali orang', 'S', 'Saya menggunakan banyak waktu untuk berpikir', 'R'],
  ['Saya suka bekerja dengan teori', 'R', 'Saya suka melaksanakan pekerjaan detail', 'D'],
  ['Saya suka melaksanakan pekerjaan detail', 'D', 'Saya suka mengatur pekerjaan saya', 'C'],
  ['Saya meletakkan segala sesuatu pada tempatnya', 'C', 'Saya selalu menyenangkan', 'E'],
  ['Saya senang diberitahu hal-hal yang harus saya kerjakan', 'W', 'Saya harus menyelesaikan apa yang telah saya mulai', 'N'],
];

const PAPI_ASPECTS: Record<string, string> = {
  N: 'Need to Finish a Task', G: 'Hard Intense Worker', A: 'Need for Achievement', L: 'Leadership Role',
  P: 'Need to Control Others', I: 'Ease in Decision Making', T: 'Pace / Tempo', V: 'Vigour',
  X: 'Need for Recognition', S: 'Social Extensiveness', B: 'Need to Belong to Groups', O: 'Need for Closeness & Affection',
  R: 'Theoretical Type', D: 'Detail Conscious', C: 'Organized Type', Z: 'Need for Change',
  E: 'Emotional Restraint', K: 'Need for Aggression', F: 'Need for Support & Dependence', W: 'Need for Rules & Supervision',
};

// ==========================================
// MSDT — 64 items, 8x8 grid (refs/docs/msdt.md Section 4)
// ==========================================
const MSDT_ITEMS: [string, string][] = [
  ['Saya mengabaikan pelanggar-pelanggar peraturan bila saya merasa pasti bahwa tidak ada satu orangpun yang mengetahui tentang pelanggar-pelanggar tersebut.', 'Bila saya mengumumkan suatu keputusan yang kurang menyenangkan, saya akan menjelaskan kepada bawahan saya bahwa keputusan ini dibuat oleh Direktur.'],
  ['Bila ada seorang karyawan yang hasil kerjanya selalu tidak memuaskan saya, saya akan menunggu suatu kesempatan untuk memindahkannya dan bukan untuk memecatnya.', 'Bila ada bawahan saya yang dikucilkan dari kelompok kerjanya, saya akan mencarikan cara-cara agar supaya orang lain dapat berteman dengannya.'],
  ['Bila Direktur memberikan perintah yang kurang menyenangkan, saya pikir adalah cukup bijaksana bila saya menyebutkan namanya dan bukan nama saya.', 'Saya biasanya membuat keputusan-keputusan saya sendiri dan menyampaikannya kepada bawahan saya.'],
  ['Bila saya ditegur oleh atasan saya, saya akan memanggil semua bawahan saya dan mengatakan semua teguran tersebut kepada mereka.', 'Saya selalu memberikan tugas-tugas yang sangat sulit kepada karyawan-karyawan yang paling berpengalaman.'],
  ['Saya selalu melakukan diskusi-diskusi untuk mencapai kata sepakat.', 'Saya selalu menganjurkan kepada bawahan saya untuk memberikan usul-usul, tetapi kadang-kadang juga saya langsung membuat suatu tindakan tertentu.'],
  ['Kadang-kadang saya berpikir bahwa perasaan-perasaan saya dan sikap-sikap saya adalah mementingkan tugas saya.', 'Saya mengijinkan bawahan-bawahan saya untuk ikut serta mengambil keputusan yang dibuat berdasarkan atas suara terbanyak.'],
  ['Bila jumlah dan mutu hasil kerja bagian saya tidak memuaskan, saya menjelaskan kepada bawahan-bawahan saya bahwa Direktur merasa kecewa dan oleh karena itu mereka harus memperbaiki kerja mereka.', 'Saya membuat keputusan-keputusan sendiri dan kemudian saya mencoba untuk menjual keputusan-keputusan itu kepada bawahan saya.'],
  ['Bila saya mengumumkan suatu keputusan yang kurang menyenangkan, saya akan menjelaskan kepada bawahan saya bahwa keputusan ini dibuat oleh Direktur.', 'Saya mengijinkan bawahan-bawahan saya untuk ikut serta di dalam pengambilan keputusan, tetapi sayapun menyediakan sesuatu keputusan terakhir.'],
  ['Saya akan memberikan tugas-tugas yang sulit kepada bawahan saya yang belum berpengalaman, tetapi bila mereka memperoleh kesukaran, saya akan mengambil alih tanggung jawab mereka.', 'Bila jumlah dan mutu hasil kerja bagian saya tidak memuaskan, saya menjelaskan kepada bawahan-bawahan saya bahwa Direktur merasa kecewa dan oleh karena itu mereka harus memperbaiki mutu kerja mereka itu.'],
  ['Saya merasa bahwa adalah penting agar bawahan-bawahan menyukai saya apabila saya bekerja keras untuk mereka.', 'Saya membiarkan orang-orang lain menangani tugas-tugas mereka masing-masing, walaupun mereka membuat banyak kesalahan.'],
  ['Saya menunjukkan minat saya terhadap kehidupan pribadi bawahan-bawahan saya, sebab saya merasa bahwa saya mengerti mengapa mereka mengerjakan sesuatu hal sejauh mereka mengerjakan hal tersebut.', 'Saya merasa bahwa adalah tidak terlalu perlu untuk bawahan-bawahan saya mengerti mengapa mereka mengerjakan sesuatu hal sejauh mereka mengerjakan hal tersebut.'],
  ['Saya percaya bahwa bawahan-bawahan yang disiplin tidak akan memperbaiki jumlah atau mutu kerja mereka di dalam jangka waktu yang panjang.', 'Bila menghadapi masalah yang sulit, saya berusaha untuk mencapai pemecahan yang paling sedikit bisa diterima oleh sebagian besar orang-orang yang bersangkutan.'],
  ['Saya berpikir bahwa bila beberapa bawahan saya merasa tidak berbahagia, saya akan mencoba melakukan sesuatu mengenai hal tersebut.', 'Saya mengurusi pekerjaan saya sendiri dan saya merasa bahwa pekerjaan saya itu bisa mencapai "Dewan Direksi" untuk mengembangkan ide-ide baru.'],
  ['Saya menyetujui kenaikan tunjangan-tunjangan untuk staf dan karyawan.', 'Saya menunjukkan persetujuan untuk meningkatkan pengetahuan tentang pekerjaan dan perusahaan dari bawahan-bawahan saya, walaupun hal itu sebenarnya belum diperlukan untuk kedudukan mereka sekarang.'],
  ['Saya membiarkan orang-orang lain menangani tugas-tugas mereka masing-masing, walaupun mereka membuat banyak kesalahan.', 'Saya membuat keputusan-keputusan sendiri tetapi saya akan mempertimbangkan usul-usul yang masuk di akal dari bawahan-bawahan saya untuk memperbaiki keputusan tersebut apabila saya bertanya kepada mereka.'],
  ['Bila ada bawahan saya yang dikucilkan dari kelompok kerjanya, saya akan mencarikan cara-cara agar supaya orang lain dapat berteman dengannya.', 'Bila seorang karyawan tidak sanggup menyelesaikan tugasnya, saya akan membantu dia untuk menyelesaikan tugas tersebut.'],
  ['Saya percaya bahwa suatu penerapan disiplin adalah merupakan seperangkat contoh untuk karyawan-karyawan lainnya.', 'Kadang-kadang saya berpikir bahwa perasaan-perasaan saya dan sikap-sikap saya adalah mementingkan tugas saya.'],
  ['Saya mencela pembicaraan-pembicaraan yang tidak perlu di antara bawahan-bawahan saya selama mereka bekerja.', 'Saya menyetujui tunjangan-tunjangan untuk staf dan karyawan-karyawan.'],
  ['Saya selalu memperhatikan mengenai keterlambatan dan kemangkiran.', 'Saya percaya bahwa Serikat-Serikat Buruh akan mencoba untuk meruntuhkan kewibawaan pimpinan perusahaan.'],
  ['Kadang-kadang saya menentang keluhan-keluhan serikat buruh sebagai suatu perkara yang prinsipil.', 'Saya merasa bahwa keluhan-keluhan tidak dapat dicegah dan saya mencoba sebaik mungkin untuk dapat dilenyapkan.'],
  ['Adalah penting bagi saya untuk memperoleh nilai kredit bagi ide-ide saya yang baik.', 'Saya menyuarakan pendapat-pendapat saya di muka umum hanya bila saya merasa bahwa orang lain akan setuju dengan saya.'],
  ['Saya percaya bahwa Serikat-Serikat Buruh akan mencoba meruntuhkan kewibawaan pimpinan perusahaan.', 'Saya percaya bahwa pertemuan-pertemuan yang sering dengan karyawan secara pribadi adalah membantu pengembangan diri mereka.'],
  ['Saya merasa bahwa tidak terlalu perlu untuk bawahan-bawahan saya mengerti mengapa mereka mengerjakan sesuatu hal sejauh mereka mengerjakan hal tersebut.', 'Saya merasa bahwa jam pencatat waktu datang dan pulangnya para pegawai, mengurangi keterlambatan.'],
  ['Saya biasanya membuat keputusan-keputusan saya sendiri dan menyampaikannya kepada bawahan saya.', 'Saya merasa bahwa Serikat-Serikat Buruh dan pimpinan perusahaan adalah bekerja untuk mencapai tujuan-tujuan yang sama.'],
  ['Saya menyukai penggunaan dari skala penggajian karyawan.', 'Saya selalu melakukan diskusi-diskusi untuk mencapai kata sepakat.'],
  ['Saya merasa bangga di dalam kenyataannya bahwa saya biasanya tidak akan menanyakan kepada seseorang untuk mengerjakan suatu tugas yang kalau untuk saya sendiri, tidak akan saya kerjakan.', 'Saya berpikir bahwa bila beberapa bawahan saya merasa tidak berbahagia, saya akan mencoba melakukan sesuatu mengenai hal tersebut.'],
  ['Bila ada suatu tugas yang mendesak, walaupun semua peralatannya sudah disediakan saya akan membiarkannya saja, dan mengatakan kepada salah seorang bawahan saya untuk mengerjakan sesuatu tugas tersebut.', 'Adalah penting bagi saya untuk memperoleh nilai kredit bagi ide-ide saya yang baik.'],
  ['Tujuan saya adalah mencapai bagaimana tugas-tugas dapat dikerjakan, tanpa saya merasa lebih benci daripada siapapun yang mengerjakan.', 'Saya mungkin menentukan tugas-tugas tanpa banyak mempertimbangkan pengalaman atau kemampuan, tetapi saya lebih menuntut pada pencapaian hasil-hasilnya saja.'],
  ['Saya mungkin menentukan tugas-tugas tanpa banyak mempertimbangkan pengalaman atau kemampuan, tetapi saya lebih menuntut pada pencapaian hasil-hasilnya saja.', 'Saya dengan sabar mendengarkan keluhan-keluhan dan ketidakpuasan-ketidakpuasan dari bawahan saya tetapi seringkali saya meralat apa yang mereka katakan.'],
  ['Saya merasa bahwa keluhan-keluhan tidak dapat dicegah dan saya mencoba sebaik mungkin untuk dapat dilenyapkan.', 'Saya percaya bahwa bawahan-bawahan saya akan merasakan kepuasan kerja mereka tanpa merasakan tekanan apapun dari saya.'],
  ['Bila menghadapi masalah yang sulit, saya berusaha untuk mencapai pemecahan yang paling sedikit bisa diterima oleh sebagian besar orang-orang yang bersangkutan.', 'Saya percaya bahwa latihan melalui pengalaman bekerja, adalah lebih bermanfaat daripada pendidikan teoritis.'],
  ['Saya selalu memberikan tugas-tugas yang sangat sulit kepada karyawan-karyawan yang paling berpengalaman.', 'Saya percaya bahwa kenaikan jabatan adalah semata-mata berdasarkan kemampuan yang ada.'],
  ['Saya merasa bahwa masalah-masalah yang timbul di antara para karyawan biasanya akan dapat diselesaikan di antara mereka sendiri, tanpa campur tangan dari saya.', 'Bila saya ditegur oleh atasan saya, saya akan memanggil semua bawahan saya dan mengatakan semua teguran tersebut kepada mereka.'],
  ['Saya tidak peduli dengan apa yang dikerjakan oleh karyawan saya di luar jam kerja kantornya.', 'Saya percaya bahwa bawahan-bawahan yang disiplin tidak akan memperbaiki jumlah atau mutu kerja mereka di dalam jangka waktu panjang.'],
  ['Saya memberikan informasi kepada "Dewan Direksi" tidak lebih dari pada apa yang mereka tanyakan.', 'Kadang-kadang saya menentang keluhan-keluhan Serikat Buruh sebagai sesuatu perkara yang prinsipil.'],
  ['Saya kadang-kadang merasa ragu-ragu untuk membuat suatu keputusan yang akan tidak disukai oleh bawahan-bawahan saya.', 'Tujuan saya adalah mencapai bagaimana tugas-tugas dapat dikerjakan, tanpa saya merasa lebih benci daripada siapapun yang mengerjakannya.'],
  ['Saya dengan sabar mendengarkan keluhan-keluhan dan ketidakpuasan-ketidakpuasan dari bawahan saya, tetapi seringkali saya meralat apa yang mereka katakan.', 'Saya kadang-kadang merasa ragu-ragu untuk membuat keputusan-keputusan yang akan tidak disukai oleh bawahan-bawahan saya.'],
  ['Saya menyuarakan pendapat-pendapat saya di muka umum hanya bila saya merasa bahwa orang lain akan setuju dengan saya.', 'Sebagian besar dari bawahan-bawahan saya dapat menyelesaikan tugas-tugas mereka, bila perlu, tanpa kehadiran saya.'],
  ['Saya mengurusi pekerjaan saya sendiri, dan saya merasa bahwa pekerjaan saya itu bisa mencapai "Dewan Direksi" untuk mengembangkan ide-ide baru.', 'Bila saya memberikan perintah kepada bawahan-bawahan saya, saya menentukan batas waktu untuk mereka menyelesaikannya.'],
  ['Saya selalu menganjurkan kepada bawahan saya untuk memberikan usul-usul, tetapi kadang-kadang juga saya langsung membuat suatu tindakan tertentu.', 'Saya mencoba untuk membuat bawahan-bawahan saya merasa senang hatinya apabila mereka berbicara dengan saya.'],
  ['Di dalam diskusi, saya memberikan fakta-fakta seperti apa yang mereka pahami, dan membiarkan mereka melukiskan kesimpulan-kesimpulan mereka sendiri.', 'Bila Direktur memberikan perintah yang kurang menyenangkan, saya pikir adalah cukup bijaksana bila saya menyebutkan namanya dan bukan nama saya.'],
  ['Bila ada tugas-tugas yang tidak dikehendaki yang harus dikerjakan, sebelumnya saya akan menanyakan kepada beberapa sukarelawan yang mau mengerjakan tugas tersebut.', 'Saya menunjukkan minat saya terhadap kehidupan pribadi bawahan-bawahan saya, sebab saya merasa bahwa sayapun mengharapkan mereka berbuat seperti itu kepada saya.'],
  ['Saya adalah seorang yang sangat memperhatikan kebahagiaan karyawan-karyawan saya di dalam mereka mengerjakan tugas-tugas mereka.', 'Saya selalu memperhatikan mengenai keterlambatan dan kemangkiran.'],
  ['Sebagian besar dari bawahan-bawahan saya dapat menyelesaikan tugas-tugas mereka, bila perlu tanpa kehadiran saya.', 'Bila ada sesuatu tugas yang mendesak, walaupun semua peralatannya sesudah disediakan, saya akan membiarkannya saja dan mengatakan kepada salah seorang bawahan saya untuk mengerjakan tugas tersebut.'],
  ['Saya percaya bahwa bawahan-bawahan saya akan merasakan kepuasan kerja mereka tanpa merasakan tekanan apapun dari saya.', 'Saya memberikan informasi kepada "Dewan Direksi" tidak lebih daripada apa yang mereka tanyakan.'],
  ['Saya percaya bahwa pertemuan-pertemuan yang sering dengan karyawan secara pribadi adalah membantu pengembangan diri mereka.', 'Saya adalah seorang yang sangat memperhatikan karyawan-karyawan saya di dalam mereka mengerjakan tugas-tugas mereka.'],
  ['Saya menunjukkan persetujuan untuk meningkatkan pengetahuan tentang pekerjaan dan perusahaan dari bawahan-bawahan saya, walaupun hal itu sebenarnya belum diperlukan untuk kedudukan mereka sekarang.', 'Saya mengawasi benar bawahan-bawahan saya yang kurang mahir di dalam bekerjanya atau bawahan-bawahan saya yang hasil kerjanya kurang memuaskan.'],
  ['Saya mengijinkan bawahan-bawahan saya untuk ikut serta mengambil keputusan dan saya selalu mematuhi keputusan yang dibuat berdasarkan atas suara terbanyak.', 'Saya membuat bawahan-bawahan saya bekerja keras, dan saya berusaha meyakinkan mereka bahwa biasanya mereka mendapat perlakuan yang adil dari "Dewan Direksi".'],
  ['Saya merasa bahwa semua karyawan pada jabatan yang sama seharusnya memperoleh gaji yang sama.', 'Bila ada seorang karyawan yang hasil kerjanya selalu tidak memuaskan saya, saya akan menunggu suatu kesempatan untuk memindahkannya dan bukan untuk memecatnya.'],
  ['Saya merasa bahwa tujuan-tujuan Serikat Buruh dan tujuan-tujuan perusahaan adalah saling berbeda dan saya mencoba untuk tidak membuat pandangan saya secara jelas.', 'Saya merasa bahwa adalah penting agar bawahan saya menyukai saya apabila saya bekerja keras untuk mereka.'],
  ['Saya mengawasi benar bawahan-bawahan saya yang kurang mahir di dalam bekerjanya atau bawahan-bawahan saya yang hasil kerjanya kurang memuaskan.', 'Saya mencela pembicaraan-pembicaraan yang tidak perlu di antara bawahan-bawahan saya selama mereka bekerja.'],
  ['Bila saya memberikan perintah kepada bawahan-bawahan saya, saya menentukan batas waktu untuk mereka menyelesaikannya.', 'Saya merasa bangga di dalam kenyataannya bahwa saya biasanya tidak akan menanyakan kepada seseorang untuk mengerjakan suatu tugas yang kalau saya sendiri tidak akan saya kerjakan.'],
  ['Saya percaya bahwa latihan melalui pengalaman bekerja, adalah lebih bermanfaat daripada pendidikan teoritis.', 'Saya tidak peduli dengan apa yang dikerjakan oleh para pegawai saya di luar jam kantornya.'],
  ['Saya merasa bahwa jam pencatat waktu datang dan pulangnya para pegawai, mengurangi keterlambatan.', 'Saya mengijinkan bawahan-bawahan saya untuk ikut serta mengambil keputusan dan saya selalu mematuhi keputusan yang dibuat berdasarkan atas suara terbanyak.'],
  ['Saya mengambil keputusan-keputusan saya sendiri, tetapi saya dapat mempertimbangkan saran-saran yang wajar dari bawahan-bawahan saya untuk saya manfaatkan, bilamana saya bertanya kepada mereka.', 'Saya merasa bahwa tujuan-tujuan Serikat Buruh dan tujuan-tujuan perusahaan adalah saling berbeda, dan saya mencoba untuk tidak membuat pandangan saya secara jelas.'],
  ['Saya membuat keputusan-keputusan sendiri dan kemudian saya mencoba untuk "menjual" keputusan-keputusan itu kepada bawahan saya.', 'Apabila mungkin saya membentuk kelompok-kelompok kerja yang terdiri dari orang-orang yang sudah menjadi teman-teman baik saya.'],
  ['Saya tidak akan ragu-ragu untuk mempekerjakan pegawai-pegawai yang cacat jasmaninya, bilamana saya merasa pasti bahwa dia dapat mempelajari pekerjaannya.', 'Saya mengabaikan pelanggar-pelanggar peraturan bila saya merasa pasti bahwa tidak ada satu orangpun yang mengetahui tentang pelanggaran-pelanggaran tersebut.'],
  ['Apabila mungkin saya membentuk kelompok-kelompok kerja yang terdiri dari orang-orang yang sudah menjadi teman-teman baik saya.', 'Saya akan memberikan tugas-tugas yang sulit kepada bawahan-bawahan saya yang berpengalaman, tetapi bila mereka memperoleh kesukaran, saya akan mengambil alih tanggung jawab mereka.'],
  ['Saya membuat bawahan-bawahan saya bekerja keras, dan saya berusaha meyakinkan mereka bahwa biasanya mereka mendapat perlakuan yang adil dari "Dewan Direksi".', 'Saya percaya bahwa suatu penerapan disiplin adalah merupakan seperangkat contoh untuk karyawan-karyawan lainnya.'],
  ['Saya mencoba untuk membuat bawahan-bawahan saya merasa senang hatinya apabila mereka berbicara dengan saya.', 'Saya menyukai penggunaan dari skala penggajian karyawan.'],
  ['Saya percaya bahwa kenaikan jabatan adalah semata-mata berdasarkan kemampuan yang ada.', 'Saya merasa bahwa masalah-masalah yang timbul di antara para karyawan biasanya akan dapat diselesaikan di antara mereka sendiri, tanpa campur tangan dari saya.'],
  ['Saya merasa bahwa Serikat-Serikat Buruh dan pimpinan perusahaan adalah bekerja untuk mencapai tujuan-tujuan yang sama.', 'Di dalam diskusi, saya memberikan fakta-fakta seperti apa yang mereka pahami, dan membiarkan mereka melukiskan kesimpulan-kesimpulan mereka sendiri.'],
  ['Bila seorang karyawan tidak sanggup menyelesaikan tugasnya, saya akan membantu dia untuk menyelesaikan tugas tersebut.', 'Saya merasa bahwa semua karyawan pada jabatan yang sama seharusnya memperoleh gaji yang sama.'],
  ['Saya mengijinkan bawahan-bawahan saya untuk ikut serta di dalam pengambilan keputusan, tetapi sayapun menyediakan sesuatu yang jitu untuk membuat keputusan terakhir.', 'Saya tidak akan ragu-ragu untuk mempekerjakan pegawai-pegawai yang cacat jasmaninya, bilamana saya merasa bahwa dia dapat mempelajari pekerjaannya.'],
];

const MSDT_DIMENSIONS = ['Ds', 'Mi', 'Au', 'Co', 'Bu', 'Dv', 'Ba', 'E'];
const MSDT_CORRECTION: Record<string, number> = { Ds: 1, Mi: 2, Au: 1, Co: 0, Bu: 3, Dv: -1, Ba: 0, E: -4 };

// ==========================================
// RIASEC — 108 items, 6 types x 18 (refs/docs/riasec.md Section 3)
// ==========================================
const RIASEC_ITEMS: [string, string][] = [
  ['A', 'Senang menonton drama'], ['S', 'Senang Melatih Orang'], ['A', 'Mampu bermain dalam drama / berakting'],
  ['I', 'Suka membaca mengenai topik-topik khusus atas keinginan sendiri'], ['I', 'Mampu melakukan percobaan atau penelitian ilmiah'],
  ['A', 'Artistik'], ['I', 'Mampu memprogram komputer untuk mempelajari masalah ilmiah'], ['R', 'Tertarik menjadi pengawas konstruksi bangunan'],
  ['I', 'Suka dalam memecahkan soal eksak'], ['C', 'Mampu melakukan dan menyukai tugas administratif'],
  ['E', 'Bisa mempengaruhi dan membujuk orang lain'], ['C', 'Prosedural (Mengikuti aturan)'], ['C', 'Suka menggunakan aplikasi pencatatan keuangan'],
  ['R', 'Suka memperbaiki motor'], ['A', 'Bisa mengekspresikan diri secara kreatif'], ['C', 'Ingin bekerja dibagian Staff keuangan'],
  ['I', 'Mampu menyebutkan makanan yang memiliki protein tinggi'], ['S', 'Suka melakukan pekerjaan social'],
  ['E', 'Mampu mengetahui bagaimana menjadi pemimpin yang baik/ berhasil'], ['R', 'Tidak suka menyatakan perasaan'],
  ['E', 'Percaya diri'], ['I', 'Suka menerapkan matematika dalam masalah praktis'], ['A', 'Emosional'],
  ['R', 'Menyukai memperbaiki peralatan mekanik'], ['S', 'Mampu menghibur dan menemani orang yang lebih tua dari saya'],
  ['E', 'Senang memulai proyek baru'], ['I', 'Suka kegiatan akademis'], ['S', 'Ramah'], ['C', 'Efisien dan Terstruktur'],
  ['R', 'Suka menggunakan perkakas bengkel dan mesin'], ['S', 'Suka menjaga / mengurus mengawasi anak-anak'],
  ['I', 'Senang menganalisa dan mengevaluasi'], ['R', 'Senang melatih binatang'], ['A', 'Tertarik menjadi aktor/ aktris'],
  ['A', 'Mampu memainkan alat musik'], ['S', 'Tertarik menjadi konselor masalah pribadi'], ['A', 'Ingin menjadi pemain dalam kelompok musik'],
  ['I', 'Tertarik menjadi ahli biologi/ hayati'], ['S', 'Tertarik menjadi pekerja sosial'], ['E', 'Energetik'],
  ['S', 'Suka bekerja dalam kelompok'], ['I', 'Suka membaca buku/ majalah ilmiah'], ['R', 'Suka mengutak-atik mesin/alat elektronik'],
  ['R', 'Suka kegiatan di luar ruangan'], ['A', 'Senang memotret atau videographer'], ['A', 'Suka membuat lukisan/ foto orang'],
  ['A', 'Senang bekerja di situasi yang bebas'], ['C', 'Membuat Hari Saya Terstruktur'], ['S', 'Mampu menarik perhatian orang untuk menceritakan masalah mereka'],
  ['C', 'Memperhatikan Detailnya'], ['C', 'Sering diminta mengumpulkan data'], ['A', 'Suka membuat sketsa, Mendesign atau melukis'],
  ['S', 'Mampu mengajar orang dewasa dengan mudah'], ['S', 'Antusias berparisipasi dalam pencarian dana/ amal'],
  ['S', 'Mampu mudah berbicara dengan semua orang'], ['I', 'Suka mempelajari teori ilmiah'], ['I', 'Tertarik menjadi pekerja riset ilmiah'],
  ['E', 'Mampu mengatur pekerjaan orang lain'], ['R', 'Bisa menguasai diri'], ['E', 'Mampu membuat kelompok sosial/ kerja berjalan dengan baik'],
  ['R', 'Tertarik menjadi insinyur otomotif'], ['C', 'Suka membuat catatan pengeluaran yang terperinci'], ['I', 'Kompleks'],
  ['E', 'Mampu mengelola usaha kecil'], ['A', 'Rumit'], ['R', 'Tertarik menjadi spesialis perikanan/ margasatwa'],
  ['E', 'Suka memimpin kelompok dalam meraih tujuan tertentu'], ['E', 'Suka menjual suatu barang'], ['E', 'Tegas'],
  ['C', 'Mampu mencatat dengan cermat pembayaran/ penjualan'], ['I', 'Suka mengerjakan proyek ilmiah'], ['S', 'Bisa menyatakan perasaan dengan jelas'],
  ['R', 'Menyusun Sesuatu Atau Merakit Model'], ['I', 'Senang mengamati'], ['E', 'Mampu memengaruhi orang lain supaya melakukan sesuatu dengan caranya'],
  ['A', 'Senang mengerjakan kerajinan tangan'], ['R', 'Suka bekerja menggunakan tangan'], ['S', 'Suka membantu orang lain dengan masalah pribadinya'],
  ['R', 'Senang kegiatan fisik'], ['I', 'Tertarik menjadi ahli teknisi laboratorium medis'], ['A', 'Ingin menjadi seniman'],
  ['R', 'Mampu melakukan perbaikan kecil pada pipa air, kran, dan lain-lain'], ['R', 'Mampu membuat gambar dengan skala'],
  ['C', 'Prosedural (Suka mengikuti aturan)'], ['C', 'Suka mengarsip surat dan berkas-berkas lain'], ['E', 'Mampu menjadi seorang pembicara di depan umum yang baik'],
  ['S', 'Mampu memimpin diskusi kelompok'], ['C', 'Suka melakukan pekerjaan surat menyurat/ masalah perkantoran'], ['E', 'Senang bertemu orang baru'],
  ['C', 'Bisa bekerja dengan baik dalam system /aturan'], ['A', 'Suka merancang perabotan, pakaian atau poster'], ['E', 'Tertarik menjadi pembawa acara / MC'],
  ['I', 'Tertarik menjadi ilmuwan peneliti'], ['R', 'Suka memperbaiki alat-alat listrik'], ['E', 'Terbuka'],
  ['C', 'Tertarik menjadi penaksir biaya'], ['S', 'Suka mendamaikan orang'], ['I', 'Suka mengerjakan teka-teki'],
  ['S', 'Mampu mengajar anak-anak dengan mudah'], ['C', 'Suka membuat daftar inventaris dari persediaan/ produk'], ['R', 'Suka olahraga'],
  ['A', 'Bisa menulis karya sastra'], ['S', 'Tertarik menjadi konselor kejuruan dan pekerjaan'], ['A', 'Sensitif'],
  ['E', 'Senang petualangan / mengambil resiko'], ['E', 'Ambisius dan cenderung berbicara apa adanya (Spontan)'], ['C', 'Penurut'],
  ['C', 'Suka menyusun sistem pengarsipan'],
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL! });
  await client.connect();

  try {
    const tests = await client.query(`SELECT id, code FROM master_tests WHERE code IN ('papi','msdt','riasec')`);
    const testIdByCode: Record<string, number> = {};
    for (const row of tests.rows) testIdByCode[row.code] = row.id;

    for (const code of ['papi', 'msdt', 'riasec']) {
      if (!testIdByCode[code]) {
        console.log(`[skip] master_tests row for '${code}' not found — run db/seed.ts first.`);
      }
    }

    // ---- PAPI ----
    if (testIdByCode['papi']) {
      const testId = testIdByCode['papi'];
      const countRes = await client.query('SELECT COUNT(*) FROM question_banks WHERE test_id = $1', [testId]);
      if (Number(countRes.rows[0].count) > 0) {
        console.log(`[skip] question_banks already has ${countRes.rows[0].count} rows for papi (test_id=${testId})`);
      } else {
        console.log('Seeding 90 PAPI items...');
        for (let i = 0; i < PAPI_ITEMS.length; i++) {
          const [stmtA, aspectA, stmtB, aspectB] = PAPI_ITEMS[i];
          const questionData = JSON.stringify({ options: [stmtA, stmtB], aspect_a: aspectA, aspect_b: aspectB });
          await client.query(
            `INSERT INTO question_banks (test_id, question_type, question_data, order_number) VALUES ($1, 'papi', $2::jsonb, $3)`,
            [testId, questionData, i + 1]
          );
        }
        console.log('PAPI seeded: 90 rows.');
      }

      const scRes = await client.query('SELECT id FROM scoring_configs WHERE test_id = $1', [testId]);
      if (scRes.rows.length === 0) {
        const configData = JSON.stringify({ aspects: PAPI_ASPECTS, aspect_order: Object.keys(PAPI_ASPECTS) });
        await client.query(
          `INSERT INTO scoring_configs (test_id, formula_type, config_data) VALUES ($1, 'papi_20_aspects', $2::jsonb)`,
          [testId, configData]
        );
        console.log('PAPI scoring_configs seeded.');
      }
    }

    // ---- MSDT ----
    if (testIdByCode['msdt']) {
      const testId = testIdByCode['msdt'];
      const countRes = await client.query('SELECT COUNT(*) FROM question_banks WHERE test_id = $1', [testId]);
      if (Number(countRes.rows[0].count) > 0) {
        console.log(`[skip] question_banks already has ${countRes.rows[0].count} rows for msdt (test_id=${testId})`);
      } else {
        console.log('Seeding 64 MSDT items...');
        for (let i = 0; i < MSDT_ITEMS.length; i++) {
          const [stmtA, stmtB] = MSDT_ITEMS[i];
          const block = Math.floor(i / 8) + 1;
          const position = (i % 8) + 1;
          const questionData = JSON.stringify({ options: [stmtA, stmtB], block, position });
          await client.query(
            `INSERT INTO question_banks (test_id, question_type, question_data, order_number) VALUES ($1, 'msdt', $2::jsonb, $3)`,
            [testId, questionData, i + 1]
          );
        }
        console.log('MSDT seeded: 64 rows.');
      }

      const scRes = await client.query('SELECT id FROM scoring_configs WHERE test_id = $1', [testId]);
      if (scRes.rows.length === 0) {
        const configData = JSON.stringify({
          dimension_order: MSDT_DIMENSIONS,
          correction: MSDT_CORRECTION,
          orientation_formula: {
            TO: ['Au', 'Co', 'Ba', 'E'],
            RO: ['Mi', 'Co', 'Dv', 'E'],
            E: ['Bu', 'Dv', 'Ba', 'E'],
            O: ['Ds'],
          },
          conversion_table: [
            { max: 29, value: 0.0 }, { max: 31, value: 0.6 }, { max: 32, value: 1.2 },
            { max: 33, value: 1.8 }, { max: 34, value: 2.4 }, { max: 35, value: 3.0 },
            { max: 37, value: 3.6 }, { max: Infinity, value: 4.0 },
          ],
          final_result_matrix: {
            'HHH': 'E', 'HHL': 'Co', 'HLH': 'Ba', 'HLL': 'Au',
            'LHH': 'Dv', 'LHL': 'Mi', 'LLH': 'Bu', 'LLL': 'Ds',
          },
        });
        await client.query(
          `INSERT INTO scoring_configs (test_id, formula_type, config_data) VALUES ($1, 'msdt_8x8_grid', $2::jsonb)`,
          [testId, configData]
        );
        console.log('MSDT scoring_configs seeded.');
      }
    }

    // ---- RIASEC ----
    if (testIdByCode['riasec']) {
      const testId = testIdByCode['riasec'];
      const countRes = await client.query('SELECT COUNT(*) FROM question_banks WHERE test_id = $1', [testId]);
      if (Number(countRes.rows[0].count) > 0) {
        console.log(`[skip] question_banks already has ${countRes.rows[0].count} rows for riasec (test_id=${testId})`);
      } else {
        console.log('Seeding 108 RIASEC items...');
        for (let i = 0; i < RIASEC_ITEMS.length; i++) {
          const [dim, text] = RIASEC_ITEMS[i];
          const questionData = JSON.stringify({ text, options: ['Ya', 'Tidak'], dimension: dim });
          await client.query(
            `INSERT INTO question_banks (test_id, question_type, question_data, order_number) VALUES ($1, 'riasec', $2::jsonb, $3)`,
            [testId, questionData, i + 1]
          );
        }
        console.log('RIASEC seeded: 108 rows.');
      }

      const scRes = await client.query('SELECT id FROM scoring_configs WHERE test_id = $1', [testId]);
      if (scRes.rows.length === 0) {
        const configData = JSON.stringify({
          type_order: ['R', 'I', 'A', 'S', 'E', 'C'],
          consistency_map: {
            high: ['RI', 'RC', 'IR', 'IA', 'AI', 'AS', 'SA', 'SE', 'ES', 'CE', 'EC', 'CR'],
            medium: ['RA', 'RE', 'IS', 'IC', 'AR', 'AE', 'SI', 'SC', 'EA', 'ER', 'CS', 'CI'],
            low: ['RS', 'IE', 'AC', 'SR', 'EI', 'CA'],
          },
        });
        await client.query(
          `INSERT INTO scoring_configs (test_id, formula_type, config_data) VALUES ($1, 'riasec_hexagon', $2::jsonb)`,
          [testId, configData]
        );
        console.log('RIASEC scoring_configs seeded.');
      }
    }

    console.log('\n--- Verification: question_banks counts per test ---');
    const verify = await client.query(`
      SELECT mt.code AS test_code, COUNT(qb.id) AS question_count
      FROM master_tests mt
      LEFT JOIN question_banks qb ON qb.test_id = mt.id
      GROUP BY mt.code
      ORDER BY mt.code
    `);
    console.table(verify.rows);

    console.log('\n--- Verification: duplicate statement text check (papi/msdt/riasec) ---');
    const dupCheck = await client.query(`
      SELECT mt.code AS test_code, qb.question_data->>'text' AS text_field, COUNT(*) AS cnt
      FROM question_banks qb
      JOIN master_tests mt ON mt.id = qb.test_id
      WHERE mt.code IN ('papi','msdt','riasec') AND qb.question_data->>'text' IS NOT NULL
      GROUP BY 1, 2
      HAVING COUNT(*) > 1
    `);
    console.table(dupCheck.rows);

    console.log('\n--- Verification: duplicate option-pair check (papi/msdt) ---');
    const dupOptions = await client.query(`
      SELECT mt.code AS test_code, qb.question_data->'options' AS options, COUNT(*) AS cnt
      FROM question_banks qb
      JOIN master_tests mt ON mt.id = qb.test_id
      WHERE mt.code IN ('papi','msdt')
      GROUP BY 1, 2
      HAVING COUNT(*) > 1
    `);
    console.table(dupOptions.rows);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});
