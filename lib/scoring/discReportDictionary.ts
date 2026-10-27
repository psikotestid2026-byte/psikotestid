import { discGraphPatternCode, discSubTraitPair, reachableDiscPatternCodes } from '@/lib/scoring/discPatternCode';
import type { DiscGraphValues } from '@/lib/scoring/disc';

export type DiscGraphKey = 'g1' | 'g2' | 'g3';

export interface DiscPatternRecord {
  code: string;
  name: string;
  description: string;
  jobs: string[];
}

export interface DiscSubTraitRecord {
  pairKey: string;
  labelId: string;
  pairLabel: string;
  narrative: string;
}

export interface DiscGraphMeaningRecord {
  graphKey: DiscGraphKey;
  title: string;
  meaning: string;
}

export interface DiscReportDictionary {
  patterns: Record<string, DiscPatternRecord>;
  subTraits: Record<string, DiscSubTraitRecord>;
  graphMeanings: Record<DiscGraphKey, DiscGraphMeaningRecord>;
}

const PATTERN_ROWS: DiscPatternRecord[] = [
  {
    code: 'C MURNI',
    name: 'LOGICAL THINKER',
    description:
      '{nama} praktis, cakap, dan kritis terhadap dirinya maupun orang lain. Ia menyukai hal yang rinci dan logis, lalu meneliti sebuah isu lebih dari sekali sebelum merasa yakin. Keputusan ia ambil dari logika, bukan dari suasana hati, dengan pertanyaan bagaimana dan mengapa. {nama} mengerjakan tugas secara sistematis, akurat, dan teliti sampai bagian kecil yang sering dilewatkan orang lain.',
    jobs: ['PERENCANA', 'TEKNIK', 'STATISTISI', 'AKADEMISI', 'PENGAWAS MUTU', 'TEKNOLOGI INFORMASI'],
  },
  {
    code: 'D MURNI',
    name: 'ESTABLISHER',
    description:
      '{nama} memiliki dorongan diri yang kuat dan cenderung individualis dengan standar yang tinggi. Ia lebih suka mengurai masalah sendiri daripada menunggu kesepakatan yang panjang. Rasa mandirinya membuatnya tidak nyaman bila dikendalikan terlalu rapat, sehingga ia ingin menetapkan arah dan ukuran keberhasilan. {nama} menghindari hal yang biasa saja, mencari tantangan baru, dan ingin unggul ketika bersaing.',
    jobs: ['PENASIHAT HUKUM', 'PENJUALAN', 'MANAJER PRODUKSI', 'PERENCANAAN STRATEGIS', 'PENYELESAIAN MASALAH', 'WIRAUSAHA'],
  },
  {
    code: 'CD',
    name: 'DESIGNER',
    description:
      '{nama} sangat berorientasi pada tugas dan peka terhadap masalah yang belum beres. Ia lebih memperhatikan pekerjaan yang ada daripada suasana di sekitarnya, termasuk perasaan orang lain. Pendekatannya kukuh, hati-hati, dan efektif saat memecahkan masalah yang rumit. {nama} menjaga jarak emosional agar keputusan tetap jernih, lalu menuntaskan pekerjaan dengan standar yang ia tetapkan sendiri.',
    jobs: ['DESAIN TEKNIS', 'RISET', 'PERENCANA', 'PENGAWAS MUTU', 'ANALIS SISTEM', 'TEKNIK'],
  },
  {
    code: 'ID',
    name: 'NEGOTIATOR',
    description:
      'Merupakan {nama} pemimpin integratif yang bekerja dengan dan melalui orang lain. Ia ramah, memiliki perhatian yang tinggi akan orang, dan mempunyai kemampuan untuk memperoleh hormat serta penghargaan dari berbagai tipe orang. {nama} melakukan pekerjaannya dengan cara yang bersahabat, baik dalam mencapai sasaran maupun dalam mengajak orang lain terlibat. Ia menyadari kebutuhan rekan kerjanya dan menyesuaikan pendekatan tanpa kehilangan arah pada hasil.',
    jobs: ['PENGAJARAN', 'PELATIHAN', 'PENEMU', 'PENJUALAN KHUSUS', 'KEUANGAN', 'HUBUNGAN MASYARAKAT'],
  },
  {
    code: 'IDC',
    name: 'CONFIDENT & DETERMINED',
    description:
      '{nama} sangat berorientasi pada tugas dan sekaligus senang bekerja bersama orang. Ia pandai memilih orang, memimpin, dan menjaga keterampilan interpersonal saat mengejar hasil. {nama} dominan, percaya diri, dan ingin pengakuan atas apa yang ia selesaikan. Ia aktif menggerakkan pekerjaan, tetapi perlu mengingat bahwa kecepatan tidak boleh menyingkirkan aturan yang melindungi mutu.',
    jobs: ['MANAJEMEN UMUM', 'HUBUNGAN MASYARAKAT', 'KONSULTAN BISNIS', 'PENJUALAN', 'PEMASARAN', 'PRODUKSI'],
  },
  {
    code: 'IDS',
    name: 'REFORMER',
    description:
      '{nama} bersahabat dan sosial, sekaligus suka mengendalikan situasi dan menjadi pemimpin. Ia menyelesaikan tugas melalui keterampilan sosialnya, peduli, dan menerima orang lain. {nama} mudah bergaul, sadar diri, dan cepat percaya pada orang yang ia anggap sejalan. Optimisme dan empatinya kuat, tetapi ia perlu menjaga agar selektivitasnya tidak membuat tim merasa terlalu dinilai.',
    jobs: ['PENGEMBANGAN TIM', 'PELATIHAN', 'HUBUNGAN MASYARAKAT', 'LAYANAN PELANGGAN', 'KOORDINATOR', 'PENYULUH'],
  },
  {
    code: 'ISD',
    name: 'MOTIVATOR',
    description:
      '{nama} menampilkan gaya pemimpin pada kelompok yang tidak harus besar. Ia mendukung orang lain, sabar, dan tetap ingin pekerjaan bergerak. Sosialisasinya baik, tetapi ia membutuhkan ketegasan agar arah tidak mengambang. {nama} berorientasi pada hasil dan pelayanan, lalu menjaga agar kebutuhan akan pujian tidak mengalahkan fokus pada tugas.',
    jobs: ['PELATIH', 'SUPERVISOR TIM', 'LAYANAN PELANGGAN', 'HUBUNGAN MASYARAKAT', 'KOORDINATOR ACARA', 'PENGAJAR'],
  },
  {
    code: 'SDC',
    name: 'INQUIRER',
    description:
      '{nama} sabar, terkontrol, dan penuh pertimbangan sebelum bergerak. Ia menjaga kendali diri dan tidak terburu memilih jalan. {nama} selektif terhadap orang dan situasi, lalu bekerja dengan ritme yang stabil. Ketelitiannya menjadi kekuatan, asalkan ia tidak terlalu kaku ketika keadaan menuntut penyesuaian.',
    jobs: ['PENELITI', 'ANALIS', 'PENGAWAS MUTU', 'ADMINISTRASI', 'TEKNISI', 'PERENCANA'],
  },
  {
    code: 'SCD',
    name: 'INQUIRER',
    description:
      '{nama} baik secara alami dan sangat berorientasi pada rincian. Ia peduli pada orang di sekitarnya dan teliti saat menyelesaikan tugas. {nama} mempertimbangkan keadaan sebelum memutuskan, lalu sulit mengubah pendirian bila sudah yakin. Ia berhati-hati dan paling kuat ketika prosedur serta fakta tersedia dengan jelas.',
    jobs: ['PENGAWAS PRODUKSI', 'AKUNTANSI', 'PENELITI', 'ADMINISTRASI', 'PENGAWAS MUTU', 'ANALIS PASAR'],
  },
  {
    code: 'DI',
    name: 'PENGAMBIL KEPUTUSAN',
    description:
      '{nama} tidak berbasa-basi dan tegas. Ia individualis, berpandangan jauh, progresif, dan mau bersaing untuk mencapai sasaran. {nama} logis, kritis, dan tajam saat memecahkan masalah, dengan minat yang luas. Ia memasang standar tinggi bagi dirinya dan orang di sekitarnya, menginginkan wewenang yang jelas, serta menyukai tugas yang baru.',
    jobs: ['MANAJEMEN UMUM', 'HUBUNGAN MASYARAKAT', 'KONSULTAN BISNIS', 'PENJUALAN', 'PEMASARAN', 'PRODUKSI'],
  },
  {
    code: 'DIS',
    name: 'DIRECTOR',
    description:
      '{nama} fokus pada penyelesaian pekerjaan dan tetap menunjukkan penghargaan kepada orang lain. Ia mampu menggerakkan orang sekaligus menuntaskan tugas. Energinya sosial, sehingga ia dapat memotivasi tim tanpa melepaskan target. {nama} tampil percaya diri, meyakinkan, dan setelah memutuskan ia terus mengerjakan sampai selesai.',
    jobs: ['MANAJER PRODUKSI', 'PENJUALAN', 'MANAJER LAYANAN', 'LAYANAN PELANGGAN', 'TEKNOLOGI INFORMASI', 'PENGAJAR'],
  },
  {
    code: 'DS',
    name: 'SELF-MOTIVATED',
    description:
      '{nama} objektif dan analitis. Ia ingin terlibat dalam situasi, sekaligus memberi bantuan kepada orang yang ia hormati. Motivasi utamanya datang dari target pribadi, bukan dari sorotan orang lain. Karena determinasinya kuat, {nama} sering berhasil, dengan ketenangan dan daya tahan sebagai bagian dari keberhasilan itu.',
    jobs: ['TEKNIK', 'MANAJEMEN PROYEK', 'RISET', 'ANALIS SISTEM', 'PEMROGRAM', 'TEKNOLOGI INFORMASI'],
  },
  {
    code: 'CIS',
    name: 'MEDIATOR',
    description:
      '{nama} berorientasi pada orang dan mampu menggabungkan ketepatan dengan loyalitas. Ia cenderung peka dan memegang standar yang tinggi. {nama} menginginkan stabilitas serta pengakuan sosial, bersahabat, antusias, dan tidak formal. Ia menolak agresi, mengharapkan suasana yang harmonis, dan menjadi pencari fakta yang baik sebelum memutuskan.',
    jobs: ['HUBUNGAN MASYARAKAT', 'PELATIHAN', 'LAYANAN PELANGGAN', 'ADMINISTRASI', 'KONSELING', 'PENGAJAR'],
  },
  {
    code: 'CSI',
    name: 'PRACTITIONER',
    description:
      '{nama} berorientasi pada orang dan mampu menggabungkan ketepatan dengan loyalitas pada ritmenya sendiri. Ia peka, memegang standar tinggi, dan ingin suasana yang dapat diperkirakan. {nama} bersahabat serta antusias, tetapi tetap terjadwal dan hati-hati terhadap kejutan. Ia menjaga harmoni dan baru bergerak setelah fakta yang ia butuhkan terkumpul.',
    jobs: ['PRAKTISI TEKNIS', 'PELATIH', 'ADMINISTRASI', 'LAYANAN PELANGGAN', 'ANALIS', 'PENGAWAS MUTU'],
  },
  {
    code: 'ISC',
    name: 'RESPONSIVE & THOUGHTFUL',
    description:
      '{nama} berorientasi pada orang, lancar berkomunikasi, dan loyal. Ia sensitif, memegang standar tinggi, dan keputusannya bertumpu pada fakta serta data. {nama} sulit diam ketika suasana menuntut kehadirannya. Ia perlu lebih terus terang agar tidak terlalu subjektif, karena ia cepat akrab dan sangat memperhatikan apa yang dipikirkan orang lain.',
    jobs: ['PERSONALIA', 'PELATIHAN', 'PENGAJARAN', 'AKUNTANSI', 'LAYANAN PELANGGAN', 'HUBUNGAN MASYARAKAT'],
  },
  {
    code: 'ICS',
    name: 'RESPONSIVE & THOUGHTFUL',
    description:
      '{nama} menggabungkan energi komunikasi dengan kebutuhan akan mutu. Ia banyak bicara, ingin pengakuan, dan tetap mencoba menjaga kualitas pekerjaan. {nama} mudah bersosialisasi, kadang terlalu banyak, sehingga fokusnya terpecah. Ia dapat diandalkan ketika peran dan tenggat dijelaskan dengan ramah serta jelas.',
    jobs: ['PENGAJARAN', 'PELATIHAN', 'LAYANAN PELANGGAN', 'HUBUNGAN MASYARAKAT', 'AKUNTANSI', 'HOSPITALITI'],
  },
  {
    code: 'S MURNI',
    name: 'SPECIALIST',
    description:
      '{nama} konsisten dan berusaha menjaga lingkungan yang tidak berubah-ubah. Ia bekerja baik dengan berbagai kepribadian karena perilakunya terkendali dan rendah hati. {nama} sabar, loyal, dan suka menolong, sementara persahabatan ia kembangkan dengan lambat dan selektif. Ia nyaman berada di belakang layar, sistematis, dan tidak mengejar peran pemimpin bila tidak diminta.',
    jobs: ['ADMINISTRASI', 'TEKNIK', 'RISET', 'RITEL', 'AKUNTANSI', 'DUKUNGAN OPERASIONAL'],
  },
  {
    code: 'CS',
    name: 'PERFECTIONIST',
    description:
      '{nama} berpikir sistematis dan cenderung mengikuti prosedur, baik dalam kerja maupun dalam urusan pribadi. Ia teratur, teliti, dan fokus pada rincian. {nama} bertindak hati-hati, diplomatis, dan jarang menentang rekan secara terbuka. Ia mengharapkan akurasi serta standar yang tinggi, dan dapat terjebak pada detail bila harus memutuskan tanpa petunjuk yang jelas.',
    jobs: ['PENGAWAS MUTU', 'AKUNTANSI', 'ADMINISTRASI', 'ARSIPARIS', 'ANALIS DATA', 'PERENCANA'],
  },
  {
    code: 'SC',
    name: 'PEACEMAKER',
    description:
      '{nama} baik secara alami dan sangat berorientasi pada rincian. Ia peduli pada orang di sekitarnya dan menjaga kualitas penyelesaian tugas. {nama} mempertimbangkan lingkungannya sebelum memutuskan agar dampaknya tidak merugikan orang lain. Ia menginginkan kedamaian, loyal, dan tidak suka perubahan mendadak.',
    jobs: ['MANAJER KANTOR', 'SUPERVISOR PRODUKSI', 'AKUNTAN', 'ENTRI DATA', 'LAYANAN PELANGGAN', 'ADMINISTRASI'],
  },
  {
    code: 'DC',
    name: 'CHALLENGER',
    description:
      '{nama} peka terhadap masalah dan kreatif dalam memecahkannya. Ia dapat menyelesaikan tugas penting dalam waktu singkat karena keputusannya kuat. {nama} tekun, reaksinya cepat, dan banyak memberi ide yang tetap berfokus pada pekerjaan. Usaha pada ketepatan mengimbangi keinginannya pada hasil yang terukur, dan ia perlu dijaga agar standar itu tidak membebani tim.',
    jobs: ['MANAJEMEN TEKNIK', 'KEUANGAN', 'PERENCANAAN PRODUKSI', 'RISET', 'PENGAWAS MUTU', 'ANALIS'],
  },
  {
    code: 'DIC',
    name: 'CHANCELLOR',
    description:
      '{nama} menggabungkan kesenangan dengan pekerjaan ketika melakukan sesuatu. Ia terlihat menyukai hubungan dengan sesama, tetapi juga mampu mengerjakan hal yang rinci. {nama} ingin melakukan segala sesuatu dengan tepat. Ia ramah secara alami, menikmati interaksi, lalu menilai orang dan tugas secara hati-hati.',
    jobs: ['MANAJEMEN TEKNIS', 'TEKNIK', 'KEUANGAN', 'KONSULTAN BISNIS', 'TEKNOLOGI INFORMASI', 'PENGAJAR'],
  },
  {
    code: 'DSI',
    name: 'DIRECTOR',
    description:
      '{nama} objektif dan analitis, serta ingin terlibat ketika situasi menuntut keputusan. Ia memberi bantuan dan dukungan, tetapi tetap berorientasi pada pekerjaannya. {nama} menyukai hubungan dengan sesama dan termotivasi oleh target pribadi. Determinasi, ketenangan, dan daya tahannya membuatnya sering berhasil sampai sasaran tercapai.',
    jobs: ['MANAJEMEN PRODUKSI', 'PENJUALAN', 'MANAJER LAYANAN', 'LAYANAN PELANGGAN', 'SUPERVISOR', 'KOORDINATOR'],
  },
  {
    code: 'DSC',
    name: 'DIRECTOR',
    description:
      '{nama} objektif, analitis, dan ingin berada di dalam situasi, bukan hanya mengamati dari pinggir. Ia memberi dukungan kepada orang yang ia hormati sambil menjaga orientasi pada tugas. {nama} tenang, stabil, dan tahan lama saat tekanan naik. Kemandirian serta kecermatannya membuatnya dapat diandalkan pada peran yang membutuhkan arah dan ketekunan.',
    jobs: ['SUPERVISOR PRODUKSI', 'MANAJEMEN LAYANAN', 'PENJUALAN LAYANAN', 'OPERASIONAL', 'ADMINISTRASI', 'KOORDINATOR'],
  },
  {
    code: 'DCI',
    name: 'CHALLENGER',
    description:
      '{nama} peka terhadap permasalahan dan kreatif mencari jalan keluar. Ia menuntaskan tugas penting dengan keputusan yang kuat dan reaksi yang cepat. {nama} meneliti berbagai kemungkinan sebelum memilih solusi, lalu banyak memberi ide yang tetap menempel pada pekerjaan. Ketepatan menjadi penyeimbang ambisinya pada hasil.',
    jobs: ['RISET DAN PENGEMBANGAN', 'ANALIS SISTEM', 'PENJUALAN TEKNIS', 'PENGAJAR', 'TEKNIK', 'PENGAWAS MUTU'],
  },
  {
    code: 'DCS',
    name: 'CHALLENGER',
    description:
      '{nama} peka pada masalah dan tidak berhenti pada solusi pertama. Ia tekun, keputusannya kuat, dan reaksinya cepat ketika situasi mendesak. {nama} mengejar kemungkinan yang ada, lalu mengerjakan ide dengan fokus pada pekerjaan. Usaha pada ketepatan mengimbangi dorongannya untuk melihat hasil yang terukur.',
    jobs: ['TEKNIK', 'PRODUKSI', 'KEUANGAN', 'PENGAWAS MUTU', 'PERENCANA', 'ANALIS'],
  },
  {
    code: 'I MURNI',
    name: 'COMMUNICATOR',
    description:
      'Merupakan {nama} yang antusias dan optimistis. Ia lebih suka mencapai sasarannya melalui orang lain dan senang berhubungan dengan sesamanya. {nama} tidak suka bekerja sendirian terlalu lama dan perasaannya biasanya tampak jelas bagi orang di sekitarnya. Ia tidak memaksakan ide, tetapi mengajak dengan semangat, sehingga tindak lanjut perlu dijaga agar tidak tertinggal.',
    jobs: ['PROMOSI', 'PEMASARAN', 'HUBUNGAN MASYARAKAT', 'PENGAJARAN', 'HOSPITALITI', 'KEHUMASAN'],
  },
  {
    code: 'IS',
    name: 'ADVISOR',
    description:
      '{nama} mengesankan orang dengan kehangatan, simpati, dan pengertian. Ia tenang pada sebagian besar situasi sosial dan jarang sengaja membuat orang lain tidak nyaman. Banyak orang datang kepadanya karena ia terlihat sebagai pendengar yang baik. {nama} tidak memaksakan ide, toleran, dan sering menjadi penjaga damai di kelompoknya.',
    jobs: ['PERSONALIA', 'KESEJAHTERAAN', 'PELATIHAN', 'PERHOTELAN', 'KEPERAWATAN', 'SUMBER DAYA MANUSIA'],
  },
  {
    code: 'IC',
    name: 'ASSESSOR',
    description:
      '{nama} ramah, suka berteman, dan tetap nyaman walaupun berhadapan dengan orang yang baru dikenal. Ia mudah mengembangkan hubungan baru, tetapi mampu mengendalikan diri. {nama} sangat sosial dan cenderung menjaga suasana agar tidak tegang. Secara alami ia menjaga mutu, menerima kritik selama disampaikan dengan hormat, dan suka membantu tugas orang lain terlihat jelas.',
    jobs: ['PENGAJARAN', 'PELATIHAN', 'PENEMU', 'PENJUALAN KHUSUS', 'KEUANGAN', 'HUBUNGAN MASYARAKAT'],
  },
  {
    code: 'ICD',
    name: 'ASSESSOR',
    description:
      '{nama} analitis, berhati-hati, dan ramah ketika ia merasa nyaman. Ia terbiasa dengan orang asing dan dapat mengembangkan hubungan baru bila ia menginginkannya. {nama} mampu mengendalikan diri sampai jarang menimbulkan rasa tersinggung. Ia peduli, tetap ramah, dan memusatkan perhatian pada penyelesaian tugas dengan mutu yang ia jaga sendiri.',
    jobs: ['PENJUALAN TEKNIS', 'KEUANGAN', 'TEKNIK', 'KONSULTAN', 'PELATIHAN', 'HUBUNGAN MASYARAKAT'],
  },
  {
    code: 'SD',
    name: 'SELF-MOTIVATED',
    description:
      '{nama} objektif dan analitis. Ia ingin terlibat dalam situasi dan juga ingin memberi bantuan serta dukungan. Motivasi internalnya berasal dari target pribadi, sementara ia tetap menyukai orang-orang di sekitarnya. Karena determinasinya kuat, {nama} sering berhasil, dengan ketenangan dan daya tahan sebagai penyumbang utama.',
    jobs: ['TEKNIK', 'PRODUKSI', 'PENELITI', 'AKUNTANSI', 'SUPERVISOR', 'ANALIS'],
  },
  {
    code: 'SI',
    name: 'ADVISOR',
    description:
      '{nama} menampilkan kehangatan, simpati, dan pengertian yang mudah dikenali. Ia tenang dalam situasi sosial dan jarang menyakiti orang lain dengan sengaja. Orang datang kepadanya karena ia pendengar yang baik. {nama} tidak memaksakan ide, menerima kritik dengan sabar, dan sering berdiri sebagai penjaga damai.',
    jobs: ['PERSONALIA', 'PELATIHAN', 'PENGAJARAN', 'LAYANAN PELANGGAN', 'HUBUNGAN MASYARAKAT', 'KONSELING'],
  },
  {
    code: 'SDI',
    name: 'DIRECTOR',
    description:
      '{nama} objektif dan analitis, serta ingin masuk ke dalam situasi daripada hanya menunggu. Ia memberi bantuan kepada orang yang ia hormati dan tetap termotivasi oleh target pribadi. {nama} berorientasi pada pekerjaan, tetapi menyukai hubungan dengan sesama. Karakternya tenang dan daya tahannya tinggi, sehingga ia ulet sampai sasaran selesai.',
    jobs: ['SUPERVISOR PRODUKSI', 'PENJUALAN LAYANAN', 'MANAJEMEN KANTOR', 'DISTRIBUSI', 'LAYANAN PELANGGAN', 'KOORDINATOR'],
  },
  {
    code: 'SID',
    name: 'ADVISOR',
    description:
      '{nama} mengesankan orang dengan kehangatan dan pengertian, sambil tetap membawa ketegasan yang tidak keras. Ia tenang pada situasi sosial dan tidak memaksakan ide kepada orang lain. {nama} kurang nyaman memberi perintah, menerima kritik, dan menjaga damai. Ketika ia sudah yakin, ia bergerak bersama orang, bukan dengan mendesak mereka.',
    jobs: ['PERSONALIA', 'PELATIHAN', 'PENGAJARAN', 'LAYANAN PELANGGAN', 'ADMINISTRASI', 'PENDAMPING'],
  },
  {
    code: 'SIC',
    name: 'ADVOCATE',
    description:
      '{nama} stabil dan ramah. Ia berusaha membangun hubungan yang positif, baik di tempat kerja maupun di rumah. {nama} dapat menjadi sangat berorientasi pada rincian ketika situasi memintanya, tetapi secara keseluruhan ia cenderung menjaga jalannya sendiri. Setelah memutuskan, ia sulit mengubah pendirian dan akan memihak bila merasa ada yang tidak adil.',
    jobs: ['LAYANAN PELANGGAN', 'SUPERVISOR', 'PEMROGRAM', 'AKUNTANSI', 'ADMINISTRASI', 'PENDAMPING'],
  },
  {
    code: 'SCI',
    name: 'ADVOCATE',
    description:
      '{nama} stabil, ramah, dan berusaha menjaga hubungan yang positif. Ia dapat menajamkan perhatian pada rincian ketika situasi meminta, lalu kembali pada cara kerjanya yang mandiri. {nama} teguh pada pendirian, mendukung pihak yang lemah, dan ingin diterima sebagai anggota tim. Setelah yakin, ia dapat diandalkan untuk menuntaskan bagiannya.',
    jobs: ['PENGAJARAN', 'KONSELING', 'LAYANAN PELANGGAN', 'ADMINISTRASI', 'PELATIHAN', 'HOSPITALITI'],
  },
  {
    code: 'CI',
    name: 'ASSESSOR',
    description:
      '{nama} analitis, berhati-hati, dan ramah saat merasa nyaman. Ia terbiasa dengan orang asing karena dapat menilai lalu menyesuaikan diri dalam hubungan itu. {nama} mudah mengembangkan hubungan baru ketika ia mau, dan umumnya mampu mengendalikan diri. Orientasinya pada mutu membuat ritme kerjanya mudah diramalkan.',
    jobs: ['PENJUALAN TEKNIS', 'HUBUNGAN MASYARAKAT', 'PENGAJAR', 'PELATIHAN', 'HOSPITALITI', 'KONSULTAN'],
  },
  {
    code: 'CDI',
    name: 'CHALLENGER',
    description:
      '{nama} sangat berorientasi pada tugas dan peka terhadap permasalahan. Ia lebih memperhatikan pekerjaan yang ada daripada perasaan di sekitarnya. {nama} kukuh dan menjaga jarak agar keputusan tetap berdasarkan fakta. Ia tidak mudah percaya sebelum bukti terkumpul, dan paling andal ketika mutu menjadi ukuran utama.',
    jobs: ['TEKNIK', 'RISET', 'PERENCANAAN', 'PENJUALAN TEKNIS', 'ANALIS SISTEM', 'PENGAJAR'],
  },
  {
    code: 'CDS',
    name: 'CONTEMPLATOR',
    description:
      '{nama} berorientasi pada rincian dan memegang standar yang tinggi untuk dirinya. Ia logis, analitis, dan selalu melihat ada ruang untuk perbaikan. {nama} cenderung kompetitif dan ingin menghasilkan pekerjaan dengan mutu terbaik. Ia sebenarnya peka terhadap orang, tetapi sifat logisnya menutupi hal itu, dan ia suka dihargai karena kualitas kerjanya.',
    jobs: ['TEKNIK', 'RISET', 'PRODUKSI', 'AKUNTAN', 'PENGAWAS MUTU', 'ANALIS PASAR'],
  },
  {
    code: 'CID',
    name: 'ASSESSOR',
    description:
      '{nama} analitis dan berhati-hati, tetapi tetap ramah ketika suasana terasa aman. Ia terbiasa dengan orang baru dan dapat membangun hubungan bila ia memilih untuk itu. {nama} mengendalikan diri, peduli, dan memusatkan perhatian pada penyelesaian tugas. Ia paling kuat ketika boleh menggabungkan analisis dengan percakapan yang hangat.',
    jobs: ['PENJUALAN KHUSUS', 'KEUANGAN', 'KONSULTAN', 'PENGAJAR', 'ANALIS', 'HUBUNGAN MASYARAKAT'],
  },
  {
    code: 'CSD',
    name: 'PRECISIONIST',
    description:
      '{nama} berpikir sistematis dan cenderung mengikuti prosedur dalam kehidupan pribadi maupun pekerjaannya. Ia teratur, memiliki perencanaan yang baik, teliti, dan fokus pada rincian. {nama} bertindak bijaksana, diplomatis, dan jarang menentang rekan kerjanya dengan sengaja. Ia mengharapkan akurasi yang tinggi dan menginginkan petunjuk yang jelas, tanpa perubahan mendadak.',
    jobs: ['TEKNIK', 'RISET', 'PRODUKSI', 'MANAJER KEUANGAN', 'PENGAWAS MUTU', 'PERENCANA'],
  },
];

const SUBTRAIT_ROWS: DiscSubTraitRecord[] = [
  {
    pairKey: 'DI',
    labelId: 'Efisiensi',
    pairLabel: 'Efisiensi (D/I)',
    narrative:
      '{nama} bergerak cepat dari gagasan ke tindakan dan tidak suka energi tim terbuang pada putaran yang tidak menghasilkan. Ia menyusun prioritas dengan tegas, lalu mengajak orang lain ikut pada ritme itu melalui penjelasan yang langsung. Pembicaraan yang berputar membuatnya tidak sabar, sehingga ia memotong jalan menuju keputusan. {nama} mengukur hari yang baik dari jumlah hal yang benar-benar selesai, bukan dari lamanya diskusi. Ia tetap bisa hangat, tetapi kehangatan itu dipakai untuk membuka jalan, bukan untuk memperpanjang suasana. Bila prosedur terasa memperlambat hasil, ia akan mencari cara yang lebih pendek dan perlu diingatkan mana batas yang tidak boleh dilewati.',
  },
  {
    pairKey: 'DS',
    labelId: 'Motivasi Diri',
    pairLabel: 'Motivasi Diri (D/S)',
    narrative:
      '{nama} menyalakan kerjanya dari target pribadi, bukan dari sorotan atau desakan orang lain. Ia tenang di luar, tetapi di dalam ada dorongan untuk menyelesaikan apa yang sudah ia pegang. Perubahan mendadak tidak ia sukai, namun ia tetap maju bila sasaran terasa adil dan jelas. {nama} tidak membutuhkan banyak pengawasan untuk memulai, asalkan wewenangnya tidak dicabut di tengah jalan. Ia menghargai orang yang konsisten dan akan menjaga mereka yang ia hormati. Ketika suasana menjadi lambat, ia menaikkan tempo dengan cara yang terkendali, bukan dengan keramaian.',
  },
  {
    pairKey: 'DC',
    labelId: 'Kemandirian',
    pairLabel: 'Kemandirian (D/C)',
    narrative:
      '{nama} ingin memegang kendali atas cara kerja dan standar hasilnya sendiri. Ia tidak nyaman bila setiap langkah harus disetujui orang lain, terutama bila alasan persetujuan itu tidak rasional. Keputusan ia ambil dari fakta yang ia kumpulkan, lalu ia jalankan tanpa banyak mencari persetujuan sosial. {nama} menjaga jarak secukupnya agar penilaiannya tidak kabur oleh suasana kelompok. Ia menghormati aturan yang masuk akal dan menolak aturan yang hanya memperlambat. Kemandirian ini menjadi kekuatan bila batas wewenangnya ditulis sejak awal.',
  },
  {
    pairKey: 'ID',
    labelId: 'Keramahan',
    pairLabel: 'Keramahan (I/D)',
    narrative:
      '{nama} membuka hubungan dengan sikap yang hangat dan mudah diingat. Ia ingin disukai, tetapi tidak melepaskan keinginan untuk mempengaruhi arah pembicaraan. Orang baru cepat merasa diterima karena ia memberi perhatian yang tampak tulus. {nama} menggunakan keramahan itu untuk melancarkan kerja sama, bukan hanya untuk mengisi suasana. Ia kurang nyaman bila suasana menjadi dingin atau kaku terlalu lama. Di balik senyumnya tetap ada dorongan agar urusan yang ia anggap penting segera diputuskan.',
  },
  {
    pairKey: 'IS',
    labelId: 'Antusiasme',
    pairLabel: 'Antusiasme (I/S)',
    narrative:
      '{nama} membawa energi yang mudah menular ketika sebuah gagasan baru muncul. Ia berbicara dengan semangat, mengajak orang lain melihat sisi yang menyenangkan dari pekerjaan, dan tidak suka suasana yang muram. Antusiasme itu stabil bila hubungan di sekitarnya terasa aman. {nama} dapat kehilangan daya bila dikritik secara keras di depan orang atau bila ritme kerja berubah tanpa penjelasan. Ia paling berguna sebagai penyebar semangat pada awal tugas dan sebagai perekat saat tim mulai lelah. Tindak lanjut yang rinci perlu ditemani pengingat, karena perhatiannya mudah berpindah ke hal yang lebih hidup.',
  },
  {
    pairKey: 'IC',
    labelId: 'Kepercayaan Diri',
    pairLabel: 'Kepercayaan Diri (I/C)',
    narrative:
      '{nama} jarang sekali ragu pada dirinya, nyaman pada berbagai macam situasi, dan mudah bergaul dengan orang baru. Ia menyampaikan gagasan dengan nada yang yakin, termasuk ketika audiensnya belum ia kenal. Tekanan sosial jarang membuatnya mundur, karena ia memakai kehangatan untuk membuka percakapan dan menjaga suasana. {nama} percaya bahwa ia dapat menyesuaikan diri tanpa kehilangan kendali atas pesan yang ingin disampaikan. Keyakinan ini membuatnya cepat mengambil peran di kelompok baru, sambil tetap menjaga mutu hasil yang ia janjikan. Saat menerima kritik, ia tidak mudah goyah, lalu menata ulang cara kerjanya agar tetap terlihat kompeten dan dapat diandalkan.',
  },
  {
    pairKey: 'SD',
    labelId: 'Kesabaran',
    pairLabel: 'Kesabaran (S/D)',
    narrative:
      '{nama} tidak terburu memaksa hasil pada hari pertama. Ia memberi waktu pada orang dan proses, lalu tetap memegang arah yang ingin ia capai. Kesabaran itu bukan sikap pasif. {nama} menggunakannya untuk meredakan ketegangan sebelum keputusan yang lebih tegas diambil. Ia tidak suka benturan terbuka dan akan mencari jalan yang menjaga hubungan. Bila tekanan terus naik tanpa penjelasan, kesabarannya menipis dan ia menjadi lebih diam daripada berdebat.',
  },
  {
    pairKey: 'SI',
    labelId: 'Kehati-hatian',
    pairLabel: 'Kehati-hatian (S/I)',
    narrative:
      '{nama} menimbang dampak perkataannya sebelum berbicara, terutama bila suasana sedang rapuh. Ia tidak ingin menjadi pusat perhatian bila hal itu membuat orang lain tidak nyaman. Kehati-hatian ini membuatnya pendengar yang baik dan rekan yang jarang mempermalukan orang. {nama} bergerak lebih pelan saat ide masih mentah, karena ia ingin yakin bahwa langkahnya tidak merugikan kelompok. Ia perlu didorong untuk menyuarakan pendapat lebih awal, sebelum keputusan diambil orang lain. Setelah merasa aman, ia dapat memberi masukan yang halus tetapi tepat.',
  },
  {
    pairKey: 'SC',
    labelId: 'Ketekunan',
    pairLabel: 'Ketekunan (S/C)',
    narrative:
      '{nama} bertahan pada tugas yang panjang tanpa membutuhkan sorotan. Ia mengulang pemeriksaan, menjaga urutan, dan tidak mudah meninggalkan pekerjaan di tengah jalan. Ritme yang stabil lebih ia sukai daripada lonjakan semangat yang cepat padam. {nama} menjadi andalan pada pekerjaan yang menuntut konsistensi dan akurasi. Perubahan mendadak mengganggu ketekunannya, sehingga ia perlu diberi alasan dan waktu penyesuaian. Hasilnya sering rapi justru karena ia tidak terburu pindah ke hal yang lebih ramai.',
  },
  {
    pairKey: 'CD',
    labelId: 'Kerja Sama',
    pairLabel: 'Kerja Sama (C/D)',
    narrative:
      '{nama} mau bekerja bersama, asalkan peran, aturan, dan ukuran mutu sudah jelas. Ia tidak mencari keramaian, tetapi ia juga tidak menolak koordinasi yang masuk akal. Kerja sama baginya berarti pembagian tugas yang rapi, bukan sekadar kehadiran dalam diskusi. {nama} akan mendukung keputusan kelompok bila data yang mendasarinya dapat ia terima. Ia keberatan secara tenang ketika standar dilonggarkan tanpa alasan. Dalam tim yang menghargai ketelitian, ia menjadi mitra yang dapat diandalkan dan tidak berebut panggung.',
  },
  {
    pairKey: 'CI',
    labelId: 'Ketelitian',
    pairLabel: 'Ketelitian (C/I)',
    narrative:
      '{nama} memperhatikan angka, urutan, dan janji kecil yang mudah dilupakan orang lain. Ia tidak puas dengan kesan umum bila rinciannya belum cocok. Ketelitian itu ia sampaikan dengan cara yang masih bisa diterima, karena ia tetap peduli pada hubungan. {nama} memeriksa ulang sebelum nama atau hasilnya tampil di depan orang. Kesalahan yang berulang membuatnya tidak nyaman, termasuk kesalahan yang ia buat sendiri. Ia paling berguna pada pekerjaan yang menggabungkan komunikasi dengan kebutuhan akan bukti yang rapi.',
  },
  {
    pairKey: 'CS',
    labelId: 'Kepekaan',
    pairLabel: 'Kepekaan (C/S)',
    narrative:
      '{nama} cepat menangkap suasana yang tidak diucapkan, lalu menimbangnya dengan standar yang ia pegang. Ia peka terhadap kritik, perubahan nada, dan ketidakteraturan. Kepekaan ini membuatnya hati-hati agar tidak menyakiti orang, tetapi juga membuatnya waspada bila mutu mulai longgar. {nama} membutuhkan lingkungan yang dapat diperkirakan agar perasaannya tidak terus dalam keadaan siaga. Ketika merasa aman, ia memberi perhatian yang teliti dan setia. Ketika merasa dinilai tidak adil, ia menarik diri lebih dulu sebelum berbicara.',
  },
  {
    pairKey: 'BALANCE',
    labelId: 'Keseimbangan',
    pairLabel: 'Keseimbangan (D/I/S/C)',
    narrative:
      '{nama} menampilkan keempat dimensi pada tingkat yang berdekatan, sehingga tidak ada satu gaya yang menonjol secara tajam. Ia dapat berpindah antara ketegasan, kehangatan, kestabilan, dan ketelitian sesuai tuntutan situasi. Keseimbangan ini membuatnya fleksibel, tetapi juga membuat orang lain sulit membaca prioritas utamanya. {nama} bekerja paling baik ketika peran, batas wewenang, dan ukuran keberhasilan dijelaskan sejak awal. Tanpa arah itu, ia dapat terlihat ragu memilih gaya mana yang harus dikedepankan. Dengan kejelasan tersebut, ia mampu menyesuaikan diri tanpa kehilangan rasa diri.',
  },
];

const GRAPH_MEANING_ROWS: DiscGraphMeaningRecord[] = [
  {
    graphKey: 'g1',
    title: 'DESKRIPSI PERILAKU ADAPTASI',
    meaning:
      'Graph 1 (MOST) menggambarkan Perilaku Adaptasi (Public Self), yaitu bagaimana individu menyesuaikan gaya perilaku, pola komunikasi, dan pendekatan kerjanya demi memenuhi tuntutan lingkungan kerja atau harapan sekitar.',
  },
  {
    graphKey: 'g2',
    title: 'DESKRIPSI KEPRIBADIAN ASLI',
    meaning:
      'Graph 2 (LEAST) menggambarkan Perilaku Saat Tekanan (Private Self), yaitu respons alami dan naluriah individu saat menghadapi tekanan, stres, atau kondisi tantangan yang mendesak.',
  },
  {
    graphKey: 'g3',
    title: 'DESKRIPSI PERSEPSI DIRI',
    meaning:
      'Graph 3 (CHANGE / DIFFERENCE) menggambarkan Perilaku Integratif (Integrated Self / Perilaku Asli), yaitu gambaran persepsi diri individu secara menyeluruh yang menggabungkan kepribadian inti dengan bentuk adaptasi lingkungannya.',
  },
];

function indexBy<T extends object>(rows: T[], key: keyof T): Record<string, T> {
  return Object.fromEntries(rows.map((row) => [String(row[key]), row]));
}

export const DISC_PATTERN_LIST: DiscPatternRecord[] = PATTERN_ROWS;
export const DISC_SUBTRAIT_LIST: DiscSubTraitRecord[] = SUBTRAIT_ROWS;
export const DISC_GRAPH_MEANING_LIST: DiscGraphMeaningRecord[] = GRAPH_MEANING_ROWS;

export function bundledDiscReportDictionary(): DiscReportDictionary {
  return {
    patterns: indexBy(PATTERN_ROWS, 'code'),
    subTraits: indexBy(SUBTRAIT_ROWS, 'pairKey'),
    graphMeanings: {
      g1: GRAPH_MEANING_ROWS[0],
      g2: GRAPH_MEANING_ROWS[1],
      g3: GRAPH_MEANING_ROWS[2],
    },
  };
}

export function fillDiscName(template: string, participantName: string | null | undefined): string {
  const name = String(participantName || '').trim() || 'Peserta';
  return template.replaceAll('{nama}', name);
}

export function discPatternForCode(
  dictionary: DiscReportDictionary,
  code: string
): DiscPatternRecord | null {
  return dictionary.patterns[code] || null;
}

export interface DiscDictionaryRows {
  patterns: { code: string; name: string; description: string; jobs: unknown }[];
  subTraits: { pairKey: string; labelId: string; pairLabel: string; narrative: string }[];
  graphMeanings: { graphKey: string; title: string; meaning: string }[];
}

function asJobList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

/** DB rows override the bundled copy per key. Empty result sets keep the bundled dictionary. */
export function mergeDiscDictionary(
  fallback: DiscReportDictionary,
  rows: DiscDictionaryRows | null | undefined
): DiscReportDictionary {
  if (!rows) return fallback;
  const hasPatterns = rows.patterns.length > 0;
  const hasSubTraits = rows.subTraits.length > 0;
  const hasMeanings = rows.graphMeanings.length > 0;
  if (!hasPatterns && !hasSubTraits && !hasMeanings) return fallback;

  const patterns = { ...fallback.patterns };
  if (hasPatterns) {
    for (const row of rows.patterns) {
      const code = String(row.code || '').trim();
      if (!code) continue;
      const jobs = asJobList(row.jobs);
      const current = patterns[code];
      patterns[code] = {
        code,
        name: String(row.name || current?.name || code).trim() || code,
        description: String(row.description || current?.description || '').trim(),
        jobs: jobs.length ? jobs : current?.jobs || [],
      };
    }
  }

  const subTraits = { ...fallback.subTraits };
  if (hasSubTraits) {
    for (const row of rows.subTraits) {
      const pairKey = String(row.pairKey || '').trim();
      if (!pairKey) continue;
      const current = subTraits[pairKey];
      subTraits[pairKey] = {
        pairKey,
        labelId: String(row.labelId || current?.labelId || pairKey).trim(),
        pairLabel: String(row.pairLabel || current?.pairLabel || pairKey).trim(),
        narrative: String(row.narrative || current?.narrative || '').trim(),
      };
    }
  }

  const graphMeanings = { ...fallback.graphMeanings };
  if (hasMeanings) {
    for (const row of rows.graphMeanings) {
      const graphKey = String(row.graphKey || '').trim() as DiscGraphKey;
      if (graphKey !== 'g1' && graphKey !== 'g2' && graphKey !== 'g3') continue;
      const current = graphMeanings[graphKey];
      graphMeanings[graphKey] = {
        graphKey,
        title: String(row.title || current.title).trim(),
        meaning: String(row.meaning || current.meaning).trim(),
      };
    }
  }

  return { patterns, subTraits, graphMeanings };
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function renderDiscDictionarySeedSql(): string {
  const patternValues = PATTERN_ROWS.map((row, index) => {
    const suffix = index === PATTERN_ROWS.length - 1 ? '' : ',';
    return `  (${sqlLiteral(row.code)}, ${sqlLiteral(row.name)}, ${sqlLiteral(row.description)}, ${sqlLiteral(JSON.stringify(row.jobs))}::jsonb, TRUE, NOW())${suffix}`;
  });
  const subTraitValues = SUBTRAIT_ROWS.map((row, index) => {
    const suffix = index === SUBTRAIT_ROWS.length - 1 ? '' : ',';
    return `  (${sqlLiteral(row.pairKey)}, ${sqlLiteral(row.labelId)}, ${sqlLiteral(row.pairLabel)}, ${sqlLiteral(row.narrative)}, NOW())${suffix}`;
  });
  const meaningValues = GRAPH_MEANING_ROWS.map((row, index) => {
    const suffix = index === GRAPH_MEANING_ROWS.length - 1 ? '' : ',';
    return `  (${sqlLiteral(row.graphKey)}, ${sqlLiteral(row.title)}, ${sqlLiteral(row.meaning)}, NOW())${suffix}`;
  });

  return [
    '-- Idempotent seed for the v3 DISC report dictionary.',
    '-- Source of truth: lib/scoring/discReportDictionary.ts',
    '-- Re-running updates existing keys and leaves other rows in place.',
    '',
    'INSERT INTO disc_patterns (code, name, description, jobs, is_active, updated_at)',
    'VALUES',
    ...patternValues,
    'ON CONFLICT (code) DO UPDATE SET',
    '  name = EXCLUDED.name,',
    '  description = EXCLUDED.description,',
    '  jobs = EXCLUDED.jobs,',
    '  is_active = EXCLUDED.is_active,',
    '  updated_at = NOW();',
    '',
    'INSERT INTO disc_subtraits (pair_key, label_id, pair_label, narrative, updated_at)',
    'VALUES',
    ...subTraitValues,
    'ON CONFLICT (pair_key) DO UPDATE SET',
    '  label_id = EXCLUDED.label_id,',
    '  pair_label = EXCLUDED.pair_label,',
    '  narrative = EXCLUDED.narrative,',
    '  updated_at = NOW();',
    '',
    'INSERT INTO disc_graph_meanings (graph_key, title, meaning, updated_at)',
    'VALUES',
    ...meaningValues,
    'ON CONFLICT (graph_key) DO UPDATE SET',
    '  title = EXCLUDED.title,',
    '  meaning = EXCLUDED.meaning,',
    '  updated_at = NOW();',
    '',
  ].join('\n');
}

export function assertDiscDictionaryComplete(dictionary: DiscReportDictionary = bundledDiscReportDictionary()): string[] {
  const missing = reachableDiscPatternCodes().filter((code) => !dictionary.patterns[code]);
  return missing;
}

export function describeDiscGraph(dictionary: DiscReportDictionary, values: DiscGraphValues) {
  const code = discGraphPatternCode(values);
  const pair = discSubTraitPair(values);
  const pattern = dictionary.patterns[code] || null;
  const subTrait = dictionary.subTraits[pair.pairKey] || null;
  return { code, pair, pattern, subTrait };
}
